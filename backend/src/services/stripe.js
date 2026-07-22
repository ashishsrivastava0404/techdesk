import Stripe from 'stripe';

/**
 * Stripe Payment Service
 * Handles payment processing with Stripe
 */

class StripeService {
  constructor() {
    this.stripe = null;
    this.configured = () => !!(process.env.STRIPE_SECRET_KEY);
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
}

export const stripeService = new StripeService();
export default stripeService;
