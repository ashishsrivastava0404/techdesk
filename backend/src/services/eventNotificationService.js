/**
 * Event Notification Service
 * Comprehensive notification system that integrates with all user operations
 * Handles: In-app messages, Emails, SMS, and Push notifications
 */

import db from '../db/index.js';
import { i18nService } from './i18nService.js';

class EventNotificationService {
  constructor() {
    this.channels = ['in_app', 'email', 'sms', 'push'];
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM notification_preferences WHERE user_id = ?',
        [userId]
      );
      
      if (rows.length === 0) {
        // Return default preferences
        return {
          email_enabled: true,
          sms_enabled: true,
          in_app_enabled: true,
          push_enabled: true,
          email_frequency: 'instant'
        };
      }
      
      return rows[0];
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {
        email_enabled: true,
        sms_enabled: true,
        in_app_enabled: true,
        push_enabled: true,
        email_frequency: 'instant'
      };
    }
  }

  /**
   * Send notification across all enabled channels
   */
  async notify(eventType, userId, data, options = {}) {
    const preferences = await this.getUserPreferences(userId);
    const results = { in_app: false, email: false, sms: false, push: false };

    // In-app notification (always sent)
    if (preferences.in_app_enabled && options.skipInApp !== true) {
      results.in_app = await this.sendInAppNotification(userId, eventType, data);
    }

    // Email notification
    if (preferences.email_enabled && options.skipEmail !== true) {
      results.email = await this.sendEmailNotification(userId, eventType, data);
    }

    // SMS notification
    if (preferences.sms_enabled && options.skipSms !== true) {
      results.sms = await this.sendSmsNotification(userId, eventType, data);
    }

    // Push notification
    if (preferences.push_enabled && options.skipPush !== true) {
      results.push = await this.sendPushNotification(userId, eventType, data);
    }

    return results;
  }

  /**
   * Send in-app notification
   */
  async sendInAppNotification(userId, eventType, data) {
    try {
      const { title, message, relatedTicketId, relatedUser, priority = 'normal' } = data;
      
      await db.execute(
        `INSERT INTO notifications (user_name, type, title, message, related_ticket_id, related_user, priority)
         SELECT ?, ?, ?, ?, ?, ?, ?
         FROM users WHERE id = ?`,
        [data.userName || null, eventType, title, message, relatedTicketId || null, relatedUser || null, priority, userId]
      );

      // Also create a conversation message if it's a ticket event
      if (relatedTicketId) {
        await this.createTicketEventMessage(relatedTicketId, eventType, data);
      }

      return true;
    } catch (error) {
      console.error('Error sending in-app notification:', error);
      return false;
    }
  }

  /**
   * Create ticket event as system message
   */
  async createTicketEventMessage(ticketId, eventType, data) {
    try {
      // Get or create conversation
      const [convs] = await db.query(
        'SELECT id FROM conversations WHERE ticket_id = ?',
        [ticketId]
      );

      if (convs.length === 0) return false;

      const conversationId = convs[0].id;
      const systemMessage = this.getEventSystemMessage(eventType, data);

      await db.execute(
        `INSERT INTO messages (conversation_id, sender_id, message_type, content)
         VALUES (?, (SELECT id FROM users WHERE role = 'system' LIMIT 1), 'system', ?)`,
        [conversationId, systemMessage]
      );

      return true;
    } catch (error) {
      console.error('Error creating ticket event message:', error);
      return false;
    }
  }

  /**
   * Get system message for event
   */
  getEventSystemMessage(eventType, data) {
    const messages = {
      ticket_created: `Ticket "${data.title}" has been created`,
      ticket_claimed: `${data.techName || 'A technician'} has claimed the ticket`,
      ticket_assigned: `Ticket has been assigned to ${data.techName || 'a technician'}`,
      ticket_updated: `Ticket was updated`,
      ticket_resolved: `Ticket has been resolved: ${data.resolution || ''}`,
      ticket_closed: `Ticket has been closed`,
      ticket_reopened: `Ticket has been reopened`,
      priority_changed: `Priority changed to ${data.newPriority || 'normal'}`,
      comment_added: `${data.authorName || 'Someone'} added a comment`,
      status_changed: `Status changed to ${data.newStatus || 'unknown'}`,
      payment_received: `Payment of ${data.amount || 0} received`,
      payout_requested: `Payout request submitted`,
      payout_approved: `Payout of ${data.amount || 0} approved`,
      payout_rejected: `Payout request rejected: ${data.reason || 'No reason provided'}`,
      new_lead: `New lead assigned: ${data.leadName || 'Unknown'}`,
      lead_updated: `Lead status updated to ${data.newStatus || 'unknown'}`,
      rating_received: `You received a ${data.rating || 0}-star rating`,
      escalation: `Ticket escalated to ${data.level || 'higher'} level`,
      reminder: `Reminder: ${data.reminderMessage || 'You have pending tickets'}`
    };

    return messages[eventType] || `Event: ${eventType}`;
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(userId, eventType, data) {
    try {
      const [users] = await db.query(
        'SELECT email, preferred_language FROM users WHERE id = ?',
        [userId]
      );

      if (!users[0]?.email) return false;

      const language = users[0].preferred_language || 'en';
      const { subject, body } = this.getEmailContent(eventType, data, language);

      // Use notification service for email
      const { notificationService } = await import('./notifications.js');
      await notificationService.sendEmail(users[0].email, subject, body);

      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  }

  /**
   * Get email content with i18n
   */
  getEmailContent(eventType, data, language = 'en') {
    const templates = {
      ticket_created: {
        subject: i18nService.getEmailTemplate('ticket_created', language, {
          ticket_id: data.ticketId,
          customer_name: data.customerName
        }).subject,
        body: i18nService.getEmailTemplate('ticket_created', language, {
          ticket_id: data.ticketId,
          customer_name: data.customerName,
          ticket_subject: data.title,
          ticket_priority: i18nService.translatePriority(data.priority, language)
        }).body
      },
      ticket_assigned: {
        subject: i18nService.getEmailTemplate('ticket_assigned', language, {
          ticket_id: data.ticketId,
          tech_name: data.techName
        }).subject,
        body: i18nService.getEmailTemplate('ticket_assigned', language, {
          ticket_id: data.ticketId,
          customer_name: data.customerName,
          tech_name: data.techName
        }).body
      },
      ticket_resolved: {
        subject: i18nService.getEmailTemplate('ticket_resolved', language, {
          ticket_id: data.ticketId
        }).subject,
        body: i18nService.getEmailTemplate('ticket_resolved', language, {
          ticket_id: data.ticketId,
          customer_name: data.customerName,
          resolution: data.resolution
        }).body
      },
      payment_received: {
        subject: language === 'es' 
          ? `Pago recibido - Ticket #${data.ticketId}` 
          : `Payment Received - Ticket #${data.ticketId}`,
        body: language === 'es'
          ? `<p>Has recibido un pago de $${data.amount}.</p><p>Gracias por usar nuestra plataforma.</p>`
          : `<p>You have received a payment of $${data.amount}.</p><p>Thank you for using our platform.</p>`
      }
    };

    return templates[eventType] || {
      subject: `Notification - ${eventType}`,
      body: `<p>${data.message || 'You have a new notification.'}</p>`
    };
  }

  /**
   * Send SMS notification
   */
  async sendSmsNotification(userId, eventType, data) {
    try {
      const [users] = await db.query(
        'SELECT phone FROM users WHERE id = ?',
        [userId]
      );

      if (!users[0]?.phone) return false;

      const message = this.getSmsMessage(eventType, data);
      const { notificationService } = await import('./notifications.js');
      await notificationService.sendSMS(users[0].phone, message);

      return true;
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      return false;
    }
  }

  /**
   * Get SMS message
   */
  getSmsMessage(eventType, data) {
    const messages = {
      ticket_created: `Your ticket #${data.ticketId} has been created. We'll notify you when a technician is assigned.`,
      ticket_claimed: `Your ticket #${data.ticketId} is being worked on by ${data.techName}.`,
      ticket_resolved: `Your ticket #${data.ticketId} has been resolved. Please rate your experience.`,
      payment_received: `Payment received: $${data.amount} for ticket #${data.ticketId}.`,
      payout_approved: `Your payout of $${data.amount} has been approved and will be processed.`,
      reminder: `Reminder: You have pending tickets that need attention.`
    };

    return messages[eventType] || `TechDesk: ${data.message || 'You have a new notification'}`;
  }

  /**
   * Send push notification (placeholder for WebPush)
   */
  async sendPushNotification(userId, eventType, data) {
    // Push notification implementation would go here
    // For now, this is a placeholder
    console.log(`Push notification for user ${userId}: ${eventType}`);
    return true;
  }

  /**
   * Notify multiple users (bulk notification)
   */
  async notifyMultiple(userIds, eventType, data) {
    const results = [];
    for (const userId of userIds) {
      results.push(await this.notify(eventType, userId, data));
    }
    return results;
  }

  /**
   * Notify admins about an event
   */
  async notifyAdmins(eventType, data) {
    try {
      const [admins] = await db.query(
        "SELECT id FROM users WHERE role = 'admin' AND status = 'active'"
      );

      for (const admin of admins) {
        await this.notify(eventType, admin.id, {
          ...data,
          userName: 'Admin Notification'
        });
      }

      return true;
    } catch (error) {
      console.error('Error notifying admins:', error);
      return false;
    }
  }

  /**
   * Notify techs about a new ticket
   */
  async notifyTechsNewTicket(ticket, category = null) {
    try {
      let query = "SELECT id FROM users WHERE role = 'tech' AND status = 'active'";
      const params = [];

      // If category is provided, filter by expertise
      if (category) {
        query += " AND expertise LIKE ?";
        params.push(`%${category}%`);
      }

      const [techs] = await db.query(query, params);

      for (const tech of techs) {
        await this.notify('new_ticket', tech.id, {
          userName: tech.name,
          title: 'New Ticket Available',
          message: `New ${ticket.priority || 'normal'} priority ticket: "${ticket.title}"`,
          relatedTicketId: ticket.id,
          priority: ticket.priority
        }, { skipSms: true, skipPush: true });
      }

      return true;
    } catch (error) {
      console.error('Error notifying techs:', error);
      return false;
    }
  }
}

// Event types enumeration
export const EVENT_TYPES = {
  // Ticket events
  TICKET_CREATED: 'ticket_created',
  TICKET_CLAIMED: 'ticket_claimed',
  TICKET_ASSIGNED: 'ticket_assigned',
  TICKET_UPDATED: 'ticket_updated',
  TICKET_RESOLVED: 'ticket_resolved',
  TICKET_CLOSED: 'ticket_closed',
  TICKET_REOPENED: 'ticket_reopened',
  TICKET_DELETED: 'ticket_deleted',
  PRIORITY_CHANGED: 'priority_changed',
  STATUS_CHANGED: 'status_changed',
  ESCALATION: 'escalation',

  // Comment events
  COMMENT_ADDED: 'comment_added',
  COMMENT_UPDATED: 'comment_updated',
  COMMENT_DELETED: 'comment_deleted',

  // Payment events
  PAYMENT_RECEIVED: 'payment_received',
  PAYOUT_REQUESTED: 'payout_requested',
  PAYOUT_APPROVED: 'payout_approved',
  PAYOUT_REJECTED: 'payout_rejected',
  PAYOUT_COMPLETED: 'payout_completed',

  // CRM events
  NEW_LEAD: 'new_lead',
  LEAD_ASSIGNED: 'lead_assigned',
  LEAD_UPDATED: 'lead_updated',
  LEAD_CONVERTED: 'lead_converted',

  // Rating events
  RATING_RECEIVED: 'rating_received',
  RATING_UPDATED: 'rating_updated',

  // System events
  REMINDER: 'reminder',
  SYSTEM_ALERT: 'system_alert',
  MAINTENANCE: 'maintenance',
  NEW_MESSAGE: 'new_message'
};

export const eventNotificationService = new EventNotificationService();
export default eventNotificationService;
