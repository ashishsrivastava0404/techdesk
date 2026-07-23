import Stripe from 'stripe';

/**
 * Stripe Payment Service
 * Handles payment processing with Stripe and Stripe Connect payouts
 */

class StripeService {
  constructor() {
    this.stripe = null;
    this.configured = () => !!(process.env.STRIPE_SECRET_KEY);
    this.platformAccountId = process.env.STRIPE_PLATFORM_ACCOUNT_ID; // For Connect
    this.init();
  }

  init() {
    if (this.configured()) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-06-20'
      });
    }
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    if (!this.configured()) {
      throw new Error('Stripe is not configured');
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true
      }
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  }

  /**
   * Confirm payment
   */
  async confirmPayment(paymentIntentId) {
    if (!this.configured()) {
      throw new Error('Stripe is not configured');
    }

    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Cancel payment intent
   */
  async cancelPayment(paymentIntentId) {
    if (!this.configured()) {
      throw new Error('Stripe is not configured');
    }

    return await this.stripe.paymentIntents.cancel(paymentIntentId);
  }

  /**
   * Create refund
   */
  async createRefund(paymentIntentId, amount = null) {
    if (!this.configured()) {
      throw new Error('Stripe is not configured');
    }

    const refundParams = { payment_intent: paymentIntentId };
    if (amount) {
      refundParams.amount = Math.round(amount * 100);
    }

    return await this.stripe.refunds.create(refundParams);
  }

  /**
   * Create customer
   */
  async createCustomer(email, name, metadata = {}) {
    if (!this.configured()) {
      throw new Error('Stripe is not configured');
    }

    return await this.stripe.customers.create({
      email,
      name,
      metadata
    });
  }

  /**
   * Create payment method
   */
  async createPaymentMethod(cardElement) {
    if (!this.configured()) {
      throw new Error('Stripe is not configured');
    }

    return await this.stripe.paymentMethods.create({
      type: 'card',
      card: cardElement
    });
  }

  /**
   * List transactions
   */
  async listPaymentIntents(limit = 10, startingAfter = null) {
    if (!this.configured()) {
      throw new Error('Stripe is not configured');
    }

    const params = { limit };
    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    return await this.stripe.paymentIntents.list(params);
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    if (!this.configured() || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Stripe webhook is not configured');
    }

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentIntentId) {
    if (!this.configured()) {
      throw new Error('Stripe is not configured');
    }

    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata
    };
  }

  /**
   * Create checkout session (for hosted checkout)
   */
  async createCheckoutSession(lineItems, successUrl, cancelUrl, metadata = {}) {
    if (!this.configured()) {
      throw new Error('Stripe is not configured');
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems.map(item => ({
        price_data: {
          currency: item.currency || 'usd',
          product_data: {
            name: item.name,
            description: item.description
          },
          unit_amount: Math.round(item.amount * 100)
        },
        quantity: item.quantity || 1
      })),
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata
    });

    return {
      sessionId: session.id,
      url: session.url
    };
  }

  // ============================================
  // STRIPE CONNECT - For Tech Payouts
  // ============================================

  /**
   * Create a Stripe Connect Express account for a tech
   */
  async createConnectAccount(email, techName, payoutMethod = 'standard') {
    if (!this.configured()) {
      throw new Error('Stripe is not configured');
    }

    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        email,
        capabilities: {
          transfers: { requested: true }
        },
        business_type: 'individual',
        metadata: {
          tech_name: techName
        }
      });

      return {
        accountId: account.id,
        email: account.email,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled
      };
    } catch (error) {
      console.error('Error creating Connect account:', error);
      throw error;
    }
  }

  /**
   * Create an account link for Stripe Connect onboarding
   */
  async createAccountLink(accountId, refreshUrl, returnUrl) {
    if (!this.configured()) {
      throw new Error('Stripe is not configured');
    }

    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding'
      });

      return {
        url: accountLink.url,
        expiresAt: accountLink.expires_at
      };
    } catch (error) {
      console.error('Error creating account link:', error);
      throw error;
    }
  }

  /**
   * Get Connect account status
   */
  async getConnectAccountStatus(accountId) {
    if (!this.configured()) {
      throw new Error('Stripe is not configured');
    }

    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      return {
        id: account.id,
        email: account.email,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        requirements: account.requirements
      };
    } catch (error) {
      console.error('Error getting account status:', error);
      throw error;
    }
  }

  /**
   * Transfer funds to a Connect account (payout to tech)
   */
  async transferToConnectAccount(accountId, amount, destinationCurrency = 'usd') {
    if (!this.configured()) {
      throw new Error('Stripe is not configured');
    }

    try {
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: destinationCurrency,
        destination: accountId,
        metadata: {
          payout_type: 'tech_earnings'
        }
      });

      return {
        transferId: transfer.id,
        amount: transfer.amount / 100,
        currency: transfer.currency,
        status: transfer.status
      };
    } catch (error) {
      console.error('Error creating transfer:', error);
      throw error;
    }
  }

  /**
   * Create a payout to a Connect account's external bank account
   */
  async createPayout(accountId, amount, currency = 'usd') {
    if (!this.configured()) {
      throw new Error('Stripe is not configured');
    }

    try {
      // First transfer to the connected account
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency,
        destination: accountId,
        transfer_group: `payout_${Date.now()}`
      });

      // Then create a payout on the connected account
      const payout = await this.stripe.payouts.create({
        amount: Math.round(amount * 100),
        currency,
      }, {
        stripeAccount: accountId
      });

      return {
        transferId: transfer.id,
        payoutId: payout.id,
        amount: payout.amount / 100,
        status: payout.status,
        arrivalDate: new Date(payout.arrival_date * 1000).toISOString()
      };
    } catch (error) {
      console.error('Error creating payout:', error);
      throw error;
    }
  }

  /**
   * List Connect accounts
   */
  async listConnectAccounts(limit = 10) {
    if (!this.configured()) {
      throw new Error('Stripe is not configured');
    }

    try {
      const accounts = await this.stripe.accounts.list({ limit });
      return accounts.data.map(acc => ({
        id: acc.id,
        email: acc.email,
        charges_enabled: acc.charges_enabled,
        payouts_enabled: acc.payouts_enabled
      }));
    } catch (error) {
      console.error('Error listing accounts:', error);
      throw error;
    }
  }

  /**
   * Delete a Connect account
   */
  async deleteConnectAccount(accountId) {
    if (!this.configured()) {
      throw new Error('Stripe is not configured');
    }

    try {
      await this.stripe.accounts.delete(accountId);
      return { deleted: true, id: accountId };
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
export default stripeService;
