import crypto from 'crypto';

/**
 * PayPal Payout Service
 * Handles PayPal mass payments and payouts
 */

class PayPalService {
  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    this.mode = process.env.PAYPAL_MODE || 'sandbox'; // sandbox or live
    this.configured = () => !!(this.clientId && this.clientSecret);
    this.accessToken = null;
    this.tokenExpiry = 0;
  }

  get baseUrl() {
    return this.mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  /**
   * Get access token
   */
  async getAccessToken() {
    if (!this.configured()) {
      throw new Error('PayPal is not configured');
    }

    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal auth failed: ${error}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Refresh 1 min before expiry

      return this.accessToken;
    } catch (error) {
      console.error('PayPal getAccessToken error:', error);
      throw error;
    }
  }

  /**
   * Create a single payout
   */
  async createPayout(senderBatchId, recipientEmail, amount, currency = 'USD') {
    if (!this.configured()) {
      throw new Error('PayPal is not configured');
    }

    try {
      const token = await this.getAccessToken();
      const payoutItemId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response = await fetch(`${this.baseUrl}/v1/payments/payouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender_batch_header: {
            sender_batch_id: senderBatchId,
            email_subject: 'You received a payment from Promote!',
            email_message: 'You received a payout for your work on Promote. Thank you!'
          },
          items: [
            {
              recipient_type: 'EMAIL',
              amount: {
                value: amount.toFixed(2),
                currency: currency
              },
              receiver: recipientEmail,
              note: 'Thanks for using Promote!',
              sender_item_id: payoutItemId
            }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`PayPal payout failed: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      return {
        batchId: data.batch_header.payout_batch_id,
        batchStatus: data.batch_header.batch_status,
        itemId: payoutItemId,
        status: data.items[0].transaction_status,
        links: data.batch_header.links
      };
    } catch (error) {
      console.error('PayPal createPayout error:', error);
      throw error;
    }
  }

  /**
   * Create mass payouts (batch)
   */
  async createMassPayout(items, currency = 'USD') {
    if (!this.configured()) {
      throw new Error('PayPal is not configured');
    }

    try {
      const token = await this.getAccessToken();
      const senderBatchId = `batch_${Date.now()}`;

      const payoutItems = items.map((item, index) => ({
        recipient_type: 'EMAIL',
        amount: {
          value: item.amount.toFixed(2),
          currency: currency
        },
        receiver: item.email,
        note: item.note || 'Payout from Promote',
        sender_item_id: `payout_${Date.now()}_${index}`
      }));

      const response = await fetch(`${this.baseUrl}/v1/payments/payouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender_batch_header: {
            sender_batch_id: senderBatchId,
            email_subject: 'You received payments from Promote!',
            email_message: 'You received payouts for your work on Promote. Thank you!'
          },
          items: payoutItems
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`PayPal mass payout failed: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      return {
        batchId: data.batch_header.payout_batch_id,
        batchStatus: data.batch_header.batch_status,
        itemCount: data.items.length,
        links: data.batch_header.links
      };
    } catch (error) {
      console.error('PayPal createMassPayout error:', error);
      throw error;
    }
  }

  /**
   * Get payout status
   */
  async getPayoutStatus(batchId) {
    if (!this.configured()) {
      throw new Error('PayPal is not configured');
    }

    try {
      const token = await this.getAccessToken();
      const response = await fetch(`${this.baseUrl}/v1/payments/payouts/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`PayPal getPayoutStatus failed: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      return {
        batchId: data.batch_header.payout_batch_id,
        batchStatus: data.batch_header.batch_status,
        amount: parseFloat(data.batch_header.amount.value),
        currency: data.batch_header.amount.currency,
        timeCompleted: data.batch_header.time_completed,
        items: data.items.map(item => ({
          itemId: item.payout_item_id,
          status: item.transaction_status,
          amount: parseFloat(item.amount.value),
          email: item.payout_item.receiver,
          createdAt: item.payout_item.created_at,
          completedAt: item.payout_item.completed_at
        }))
      };
    } catch (error) {
      console.error('PayPal getPayoutStatus error:', error);
      throw error;
    }
  }

  /**
   * Cancel payout (if not yet completed)
   */
  async cancelPayout(payoutItemId) {
    if (!this.configured()) {
      throw new Error('PayPal is not configured');
    }

    try {
      const token = await this.getAccessToken();
      const response = await fetch(`${this.baseUrl}/v1/payments/payouts-item/${payoutItemId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`PayPal cancelPayout failed: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      return {
        itemId: data.payout_item_id,
        status: data.transaction_status
      };
    } catch (error) {
      console.error('PayPal cancelPayout error:', error);
      throw error;
    }
  }

  /**
   * Get payout item status
   */
  async getPayoutItem(itemId) {
    if (!this.configured()) {
      throw new Error('PayPal is not configured');
    }

    try {
      const token = await this.getAccessToken();
      const response = await fetch(`${this.baseUrl}/v1/payments/payouts-item/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`PayPal getPayoutItem failed: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      return {
        itemId: data.payout_item_id,
        status: data.transaction_status,
        amount: parseFloat(data.amount.value),
        currency: data.amount.currency,
        email: data.payout_item.receiver,
        createdAt: data.payout_item.created_at,
        completedAt: data.payout_item.completed_at,
        error: data.errors ? data.errors[0] : null
      };
    } catch (error) {
      console.error('PayPal getPayoutItem error:', error);
      throw error;
    }
  }
}

export const paypalService = new PayPalService();
export default paypalService;
