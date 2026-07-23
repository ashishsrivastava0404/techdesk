import { Router } from 'express';
import { creditService } from '../services/credits.js';

const router = Router();

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
