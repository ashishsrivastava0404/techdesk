import { Router } from 'express';
import pool from '../db/index.js';
import { stripeService } from '../services/stripe.js';
import { notificationService } from '../services/notifications.js';

const router = Router();

// Get platform settings
async function getSetting(key) {
  const [rows] = await pool.query('SELECT value FROM platform_settings WHERE key_name = ?', [key]);
  return rows[0] ? parseFloat(rows[0].value) : 0;
}

// Check if Stripe is configured
function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}

// Create payment with Stripe
router.post('/', async (req, res) => {
  const { hire_request_id, ticket_id, customer_name, tech_name, amount, payment_method, customer_email } = req.body;

  if (!customer_name || !tech_name || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const commissionRate = await getSetting('commission_rate');
    const platformFee = amount * commissionRate;
    const techPayout = amount - platformFee;

    // Generate transaction ID
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // If Stripe is configured, create payment intent
    let stripePaymentIntentId = null;
    let clientSecret = null;

    if (isStripeConfigured()) {
      try {
        const stripeResult = await stripeService.createPaymentIntent(amount, 'usd', {
          customer_name,
          tech_name,
          ticket_id: ticket_id?.toString(),
          hire_request_id: hire_request_id?.toString()
        });
        stripePaymentIntentId = stripeResult.paymentIntentId;
        clientSecret = stripeResult.clientSecret;
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        // Continue without Stripe - use manual payment
      }
    }

    // Insert payment record
    const [result] = await pool.query(
      `INSERT INTO payments (hire_request_id, ticket_id, customer_name, tech_name, amount, platform_fee, tech_payout, payment_method, transaction_id, status, stripe_payment_intent_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [hire_request_id || null, ticket_id || null, customer_name, tech_name, amount, platformFee, techPayout, payment_method || 'card', transactionId, stripePaymentIntentId]
    );

    // If Stripe not configured, auto-confirm (for demo purposes)
    if (!isStripeConfigured() || !stripePaymentIntentId) {
      await pool.query(
        `UPDATE payments SET status = 'held' WHERE id = ?`,
        [result.insertId]
      );
    }

    // Create tech earning record
    await pool.query(
      `INSERT INTO tech_earnings (tech_name, payment_id, source, description, amount, status)
       VALUES (?, ?, 'hire', ?, ?, 'available')`,
      [tech_name, result.insertId, `Production hire - ${ticket_id ? 'Ticket #' + ticket_id : 'Hire #' + hire_request_id}`, techPayout]
    );

    // Create customer invoice
    await pool.query(
      `INSERT INTO customer_invoices (customer_name, payment_id, description, amount, status, due_date)
       VALUES (?, ?, ?, ?, 'paid', CURDATE())`,
      [customer_name, result.insertId, `Production hire payment`, amount]
    );

    const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [result.insertId]);
    
    const response = { ...rows[0] };
    
    // Include Stripe client secret if available
    if (clientSecret) {
      response.clientSecret = clientSecret;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Confirm payment (after Stripe payment succeeds)
router.post('/:id/confirm', async (req, res) => {
  const { id } = req.params;
  const { payment_intent_id } = req.body;

  try {
    // Update payment status
    await pool.query(
      `UPDATE payments SET status = 'held' WHERE id = ? AND stripe_payment_intent_id = ?`,
      [id, payment_intent_id]
    );

    const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [id]);
    
    if (rows[0]) {
      // Notify tech
      await notificationService.notifyPaymentReceived(
        rows[0].ticket_id,
        rows[0].tech_name,
        rows[0].tech_payout
      );
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Stripe webhook handler
router.post('/webhook/stripe', async (req, res) => {
  if (!isStripeConfigured()) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const signature = req.headers['stripe-signature'];

  try {
    const event = stripeService.verifyWebhookSignature(req.body, signature);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        
        // Update payment status in database
        await pool.query(
          `UPDATE payments SET status = 'held' WHERE stripe_payment_intent_id = ?`,
          [paymentIntent.id]
        );

        // Get payment details and notify
        const [payments] = await pool.query(
          'SELECT * FROM payments WHERE stripe_payment_intent_id = ?',
          [paymentIntent.id]
        );

        if (payments[0]) {
          await notificationService.notifyPaymentReceived(
            payments[0].ticket_id,
            payments[0].tech_name,
            payments[0].tech_payout
          );
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        await pool.query(
          `UPDATE payments SET status = 'failed' WHERE stripe_payment_intent_id = ?`,
          [paymentIntent.id]
        );
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;
        await pool.query(
          `UPDATE payments SET status = 'refunded' WHERE stripe_payment_intent_id = ?`,
          [paymentIntentId]
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

// Get all payments (admin)
router.get('/', async (req, res) => {
  const { status, tech_name, customer_name } = req.query;

  let query = 'SELECT * FROM payments WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (tech_name) {
    query += ' AND tech_name = ?';
    params.push(tech_name);
  }
  if (customer_name) {
    query += ' AND customer_name = ?';
    params.push(customer_name);
  }

  query += ' ORDER BY created_at DESC';

  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get single payment
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = rows[0];
    
    // If Stripe configured, get real-time status
    if (isStripeConfigured() && payment.stripe_payment_intent_id) {
      try {
        const stripeStatus = await stripeService.getPaymentStatus(payment.stripe_payment_intent_id);
        payment.stripeStatus = stripeStatus.status;
      } catch {
        // Ignore Stripe errors
      }
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Release payment to tech
router.patch('/:id/release', async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await pool.query('SELECT * FROM payments WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = existing[0];

    // If Stripe configured, create refund
    if (isStripeConfigured() && payment.stripe_payment_intent_id && payment.status === 'held') {
      try {
        // In real implementation, this would transfer to tech's Stripe account
        // For now, just mark as released
        console.log('Payment released for tech:', payment.tech_name);
      } catch (stripeError) {
        console.error('Stripe release error:', stripeError);
        return res.status(500).json({ error: 'Failed to release payment via Stripe' });
      }
    }

    await pool.query(
      `UPDATE payments SET status = 'released', released_at = NOW() WHERE id = ? AND status = 'held'`,
      [id]
    );

    const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [id]);
    
    if (rows[0]) {
      // Update hire request if linked
      if (rows[0].hire_request_id) {
        await pool.query(
          `UPDATE hire_requests SET status = 'completed', completed_at = NOW() WHERE id = ?`,
          [rows[0].hire_request_id]
        );
      }

      // Notify tech of payout
      await notificationService.notifyPayout(
        { name: rows[0].tech_name },
        rows[0].tech_payout,
        'completed'
      );
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error releasing payment:', error);
    res.status(500).json({ error: 'Failed to release payment' });
  }
});

// Refund payment
router.patch('/:id/refund', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  try {
    const [existing] = await pool.query('SELECT * FROM payments WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = existing[0];

    // If Stripe configured, create refund
    if (isStripeConfigured() && payment.stripe_payment_intent_id) {
      try {
        await stripeService.createRefund(payment.stripe_payment_intent_id);
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        return res.status(500).json({ error: 'Failed to process refund via Stripe' });
      }
    }

    await pool.query(`UPDATE payments SET status = 'refunded' WHERE id = ? AND status = 'held'`, [id]);

    const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [id]);

    // Remove tech earnings if payment is refunded
    if (rows[0]) {
      await pool.query(`UPDATE tech_earnings SET status = 'withdrawn' WHERE payment_id = ?`, [id]);
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error refunding payment:', error);
    res.status(500).json({ error: 'Failed to refund payment' });
  }
});

// Dispute payment
router.patch('/:id/dispute', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE payments SET status = 'disputed' WHERE id = ?`, [id]);
    const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error disputing payment:', error);
    res.status(500).json({ error: 'Failed to dispute payment' });
  }
});

// Get payment methods for customer
router.get('/methods/:customerName', async (req, res) => {
  if (!isStripeConfigured()) {
    return res.json({ configured: false, methods: [] });
  }

  try {
    // In real implementation, would list customer's saved payment methods
    res.json({ configured: true, methods: [] });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

export default router;
