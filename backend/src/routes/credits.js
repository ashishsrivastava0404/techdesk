import { Router } from 'express';
import { creditService } from '../services/credits.js';
import { stripeService } from '../services/stripe.js';

const router = Router();

// Check if Stripe is configured
function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * GET /api/credits/balance/:userName
 * Get user's credit balance
 */
router.get('/balance/:userName', async (req, res) => {
  const { userName } = req.params;
  try {
    const balance = await creditService.getBalance(userName);
    res.json({ userName, balance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

/**
 * GET /api/credits/history/:userName
 * Get credit transaction history
 */
router.get('/history/:userName', async (req, res) => {
  const { userName } = req.params;
  const { limit } = req.query;
  try {
    const transactions = await creditService.getTransactionHistory(userName, parseInt(limit) || 50);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * POST /api/credits/add
 * Add credits to user account (admin only)
 */
router.post('/add', async (req, res) => {
  const { user_name, amount, reason } = req.body;
  if (!user_name || !amount) {
    return res.status(400).json({ error: 'user_name and amount are required' });
  }
  try {
    const newBalance = await creditService.addCredits(user_name, parseFloat(amount), reason || 'admin_credit');
    res.json({ userName: user_name, balance: newBalance, added: parseFloat(amount) });
  } catch (error) {
    console.error('Error adding credits:', error);
    res.status(500).json({ error: 'Failed to add credits' });
  }
});

/**
 * POST /api/credits/deduct
 * Deduct credits from user account (admin only)
 */
router.post('/deduct', async (req, res) => {
  const { user_name, amount, reason } = req.body;
  if (!user_name || !amount) {
    return res.status(400).json({ error: 'user_name and amount are required' });
  }
  try {
    const newBalance = await creditService.deductCredits(user_name, parseFloat(amount), reason || 'admin_deduction');
    res.json({ userName: user_name, balance: newBalance, deducted: parseFloat(amount) });
  } catch (error) {
    console.error('Error deducting credits:', error);
    res.status(500).json({ error: error.message || 'Failed to deduct credits' });
  }
});

/**
 * POST /api/credits/transfer
 * Transfer credits between users (donations)
 */
router.post('/transfer', async (req, res) => {
  const { from_user, to_user, amount, note } = req.body;
  if (!from_user || !to_user || !amount) {
    return res.status(400).json({ error: 'from_user, to_user, and amount are required' });
  }
  try {
    const result = await creditService.transferCredits(from_user, to_user, parseFloat(amount), note);
    res.json({
      success: true,
      fromUser: from_user,
      toUser: to_user,
      amount: parseFloat(amount),
      fromBalance: result.fromBalance,
      toBalance: result.toBalance
    });
  } catch (error) {
    console.error('Error transferring credits:', error);
    res.status(400).json({ error: error.message || 'Failed to transfer credits' });
  }
});

/**
 * POST /api/credits/donate
 * Donate credits to a tech (tip/bonus after ticket resolution)
 */
router.post('/donate', async (req, res) => {
  const { customer_name, tech_name, ticket_id, amount, note } = req.body;
  if (!customer_name || !tech_name || !amount) {
    return res.status(400).json({ error: 'customer_name, tech_name, and amount are required' });
  }
  if (customer_name === tech_name) {
    return res.status(400).json({ error: 'Cannot donate to yourself' });
  }
  try {
    const result = await creditService.transferCredits(
      customer_name, 
      tech_name, 
      parseFloat(amount), 
      note || `Tip for ticket #${ticket_id}`
    );
    res.json({
      success: true,
      message: `Successfully donated ${amount} credits to ${tech_name}`,
      fromBalance: result.fromBalance,
      toBalance: result.toBalance
    });
  } catch (error) {
    console.error('Error donating credits:', error);
    res.status(400).json({ error: error.message || 'Failed to donate credits' });
  }
});

/**
 * GET /api/credits/packages
 * Get available credit purchase packages
 */
router.get('/packages', async (req, res) => {
  const packages = [
    { id: 'starter', credits: 100, price: 10, label: 'Starter Pack' },
    { id: 'basic', credits: 250, price: 20, label: 'Basic Pack' },
    { id: 'pro', credits: 500, price: 35, label: 'Pro Pack' },
    { id: 'enterprise', credits: 1000, price: 60, label: 'Enterprise Pack' }
  ];
  res.json(packages);
});

/**
 * POST /api/credits/purchase
 * Purchase credits with real money
 */
router.post('/purchase', async (req, res) => {
  const { user_name, package_id, amount } = req.body;
  if (!user_name) {
    return res.status(400).json({ error: 'user_name is required' });
  }

  const packages = {
    starter: { credits: 100, price: 10 },
    basic: { credits: 250, price: 20 },
    pro: { credits: 500, price: 35 },
    enterprise: { credits: 1000, price: 60 }
  };

  const pkg = package_id ? packages[package_id] : null;
  const credits = amount || (pkg ? pkg.credits : 100);
  const price = pkg ? pkg.price : (credits / 10); // Default: $1 per 10 credits

  if (credits < 1) {
    return res.status(400).json({ error: 'Minimum purchase is 1 credit' });
  }

  try {
    // If Stripe is configured, create payment intent
    let stripePaymentIntentId = null;
    let clientSecret = null;

    if (isStripeConfigured()) {
      try {
        const stripeResult = await stripeService.createPaymentIntent(price, 'usd', {
          user_name,
          credits,
          type: 'credit_purchase'
        });
        stripePaymentIntentId = stripeResult.paymentIntentId;
        clientSecret = stripeResult.clientSecret;
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
      }
    }

    // For demo/testing without Stripe, auto-add credits
    if (!isStripeConfigured() || !stripePaymentIntentId) {
      await creditService.addCredits(user_name, credits, 'credit_purchase');
      res.json({
        success: true,
        credits,
        balance: await creditService.getBalance(user_name),
        message: 'Credits added successfully'
      });
    } else {
      res.json({
        success: true,
        credits,
        clientSecret,
        paymentIntentId: stripePaymentIntentId,
        message: 'Payment initiated'
      });
    }
  } catch (error) {
    console.error('Error purchasing credits:', error);
    res.status(500).json({ error: 'Failed to process purchase' });
  }
});

/**
 * GET /api/credits/cost
 * Calculate ticket cost in credits
 */
router.get('/cost', async (req, res) => {
  const { priority, base_pay } = req.query;
  if (!priority || !base_pay) {
    return res.status(400).json({ error: 'priority and base_pay are required' });
  }
  try {
    const cost = await creditService.calculateTicketCost(priority, parseFloat(base_pay));
    res.json({ priority, basePay: parseFloat(base_pay), creditCost: cost });
  } catch (error) {
    console.error('Error calculating cost:', error);
    res.status(500).json({ error: 'Failed to calculate cost' });
  }
});

/**
 * GET /api/credits/check
 * Check if user has enough credits
 */
router.get('/check', async (req, res) => {
  const { user_name, priority, base_pay } = req.query;
  if (!user_name || !priority || !base_pay) {
    return res.status(400).json({ error: 'user_name, priority, and base_pay are required' });
  }
  try {
    const hasEnough = await creditService.hasEnoughCredits(user_name, priority, parseFloat(base_pay));
    const balance = await creditService.getBalance(user_name);
    const cost = await creditService.calculateTicketCost(priority, parseFloat(base_pay));
    res.json({ userName: user_name, hasEnough, balance, required: cost });
  } catch (error) {
    console.error('Error checking credits:', error);
    res.status(500).json({ error: 'Failed to check credits' });
  }
});

/**
 * GET /api/credits/settings
 * Get credit system settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await creditService.getCreditSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PATCH /api/credits/settings
 * Update credit system settings (admin only)
 */
router.patch('/settings', async (req, res) => {
  try {
    const settings = await creditService.updateCreditSettings(req.body);
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
