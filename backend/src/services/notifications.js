import pool from '../db/index.js';

/**
 * Notification Service
 * Handles email and SMS notifications via SendGrid and Twilio
 */

class NotificationService {
  constructor() {
    this.sendGridConfigured = () => !!process.env.SENDGRID_API_KEY;
    this.twilioConfigured = () => !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  }

  async sendEmail(to, subject, text, html = null) {
    if (!this.sendGridConfigured()) {
      console.log('SendGrid not configured, skipping email to:', to);
      return { sent: false, reason: 'SendGrid not configured' };
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || 'noreply@promote.example',
            name: process.env.SENDGRID_FROM_NAME || 'Promote Platform'
          },
          subject,
          content: html ? [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html }
          ] : [{ type: 'text/plain', value: text }]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('SendGrid error:', error);
        return { sent: false, reason: error };
      }

      return { sent: true };
    } catch (error) {
      console.error('SendGrid error:', error);
      return { sent: false, reason: error.message };
    }
  }

  async sendSMS(to, message) {
    if (!this.twilioConfigured()) {
      console.log('Twilio not configured, skipping SMS to:', to);
      return { sent: false, reason: 'Twilio not configured' };
    }

    try {
      const auth = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString('base64');

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: to,
            From: process.env.TWILIO_PHONE_NUMBER,
            Body: message
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Twilio error:', error);
        return { sent: false, reason: error.message };
      }

      return { sent: true };
    } catch (error) {
      console.error('Twilio error:', error);
      return { sent: false, reason: error.message };
    }
  }

  async notifyTicketCreated(ticket, customer) {
    await this.storeNotification({
      user_name: customer.name,
      type: 'ticket_created',
      title: 'Ticket Created',
      message: `Your ticket "${ticket.title}" has been created.`,
      related_ticket_id: ticket.id
    });

    await this.notifyTechs('new_ticket', {
      title: 'New Ticket Available',
      message: `New ticket: ${ticket.title}`,
      related_ticket_id: ticket.id
    });
  }

  async notifyTicketClaimed(ticket, tech) {
    await this.storeNotification({
      user_name: ticket.customer_name,
      type: 'ticket_claimed',
      title: 'Ticket Claimed',
      message: `${tech.name} has claimed your ticket "${ticket.title}".`,
      related_ticket_id: ticket.id,
      related_user: tech.name
    });
  }

  async notifyTicketResolved(ticket) {
    await this.storeNotification({
      user_name: ticket.customer_name,
      type: 'ticket_resolved',
      title: 'Ticket Resolved',
      message: `Your ticket "${ticket.title}" has been resolved. Please rate the service.`,
      related_ticket_id: ticket.id,
      related_user: ticket.tech_name
    });
  }

  async notifyNewMessage(ticketId, recipientName, senderName, isTech) {
    const type = isTech ? 'tech_message' : 'customer_message';
    await this.storeNotification({
      user_name: recipientName,
      type,
      title: 'New Message',
      message: `${senderName} sent a message on ticket #${ticketId}.`,
      related_ticket_id: ticketId
    });
  }

  async notifyPayout(tech, amount, status) {
    await this.storeNotification({
      user_name: tech.name,
      type: status === 'completed' ? 'payout_completed' : 'payout_requested',
      title: status === 'completed' ? 'Payout Received' : 'Payout Requested',
      message: `Your payout of $${amount} has been ${status}.`,
    });
  }

  async notifyPayoutRequest(techName, amount, method, payoutId) {
    const [admins] = await pool.query(
      "SELECT name FROM users WHERE role = 'admin' AND status = 'active'"
    );

    for (const admin of admins) {
      await this.storeNotification({
        user_name: admin.name,
        type: 'payout_request',
        title: 'New Payout Request',
        message: `${techName} requested a payout of $${amount.toFixed(2)} via ${method}`,
        related_payout_id: payoutId
      });
    }

    const [adminUsers] = await pool.query(
      "SELECT email FROM users WHERE role = 'admin' AND status = 'active' AND email IS NOT NULL"
    );

    for (const admin of adminUsers) {
      await this.sendEmail(
        admin.email,
        `[Admin] New Payout Request - ${techName}`,
        `A new payout request requires your approval:\n\nTech: ${techName}\nAmount: $${amount.toFixed(2)}\nMethod: ${method}\nPayout ID: ${payoutId}\n\nPlease review and process in the admin dashboard.`
      );
    }
  }

  async notifyPaymentReceived(ticketId, techName, amount) {
    await this.storeNotification({
      user_name: techName,
      type: 'payment_received',
      title: 'Payment Received',
      message: `You received a payment of $${amount} for ticket #${ticketId}.`,
      related_ticket_id: ticketId
    });
  }

  async notifyTechs(type, data) {
    const [techs] = await pool.query(
      "SELECT name, phone FROM users WHERE role = 'tech' AND status = 'active'"
    );

    for (const tech of techs) {
      await this.storeNotification({
        user_name: tech.name,
        type,
        title: data.title,
        message: data.message,
        related_ticket_id: data.related_ticket_id
      });
    }
  }

  async storeNotification(data) {
    await pool.query(
      `INSERT INTO notifications (user_name, type, title, message, related_ticket_id, related_user, related_payout_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_name,
        data.type,
        data.title,
        data.message,
        data.related_ticket_id || null,
        data.related_user || null,
        data.related_payout_id || null
      ]
    );
  }

  async sendBulkEmail(recipients, subject, text, html = null) {
    if (!this.sendGridConfigured()) {
      console.log('SendGrid not configured, skipping bulk email');
      return { sent: false, reason: 'SendGrid not configured' };
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: recipients.map(email => ({ to: [{ email }] })),
          from: {
            email: process.env.SENDGRID_FROM_EMAIL,
            name: process.env.SENDGRID_FROM_NAME
          },
          subject,
          content: html ? [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html }
          ] : [{ type: 'text/plain', value: text }]
        })
      });

      return { sent: response.ok };
    } catch (error) {
      console.error('Bulk email error:', error);
      return { sent: false, reason: error.message };
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
