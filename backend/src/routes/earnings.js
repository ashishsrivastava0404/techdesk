import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

// Get tech earnings summary
router.get('/:techName', async (req, res) => {
  const { techName } = req.params;

  try {
    // Total earned (all time)
    const [totalResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM tech_earnings WHERE tech_name = ? AND source != 'payout'`,
      [techName]
    );

    // Available balance
    const [availableResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as available FROM tech_earnings WHERE tech_name = ? AND status = 'available' AND source != 'payout'`,
      [techName]
    );

    // Pending
    const [pendingResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as pending FROM tech_earnings WHERE tech_name = ? AND status = 'pending' AND source != 'payout'`,
      [techName]
    );

    // This month
    const [monthResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as this_month FROM tech_earnings 
       WHERE tech_name = ? AND source != 'payout' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())`,
      [techName]
    );

    // Total withdrawn
    const [withdrawnResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as withdrawn FROM tech_payouts WHERE tech_name = ? AND status = 'completed'`,
      [techName]
    );

    // Transaction count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as count FROM tech_earnings WHERE tech_name = ? AND source != 'payout'`,
      [techName]
    );

    res.json({
      totalEarned: parseFloat(totalResult[0].total) || 0,
      availableBalance: parseFloat(availableResult[0].available) || 0,
      pendingPayments: parseFloat(pendingResult[0].pending) || 0,
      thisMonth: parseFloat(monthResult[0].this_month) || 0,
      totalWithdrawn: parseFloat(withdrawnResult[0].withdrawn) || 0,
      transactionCount: countResult[0].count || 0,
      averagePerTicket: countResult[0].count > 0 
        ? parseFloat((totalResult[0].total / countResult[0].count).toFixed(2)) 
        : 0
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

// Get tech transaction history
router.get('/:techName/transactions', async (req, res) => {
  const { techName } = req.params;
  const { start_date, end_date, source } = req.query;

  let query = 'SELECT * FROM tech_earnings WHERE tech_name = ? AND source != "payout"';
  const params = [techName];

  if (start_date) {
    query += ' AND created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND created_at <= ?';
    params.push(end_date);
  }
  if (source) {
    query += ' AND source = ?';
    params.push(source);
  }

  query += ' ORDER BY created_at DESC';

  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Request payout
router.post('/payouts', async (req, res) => {
  const { tech_name, amount, method, payout_details } = req.body;

  if (!tech_name || !amount || !method) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check available balance
    const [availableResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as available FROM tech_earnings WHERE tech_name = ? AND status = 'available'`,
      [tech_name]
    );

    if (availableResult[0].available < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Check minimum payout
    const [settingResult] = await pool.query('SELECT value FROM platform_settings WHERE key_name = ?', ['minimum_payout']);
    const minPayout = parseFloat(settingResult[0]?.value || 25);

    if (amount < minPayout) {
      return res.status(400).json({ error: `Minimum payout is $${minPayout}` });
    }

    // Create payout request
    const [result] = await pool.query(
      `INSERT INTO tech_payouts (tech_name, amount, method, payout_details, status) VALUES (?, ?, ?, ?, 'requested')`,
      [tech_name, amount, method, JSON.stringify(payout_details || {})]
    );

    // Deduct from available earnings
    await pool.query(
      `INSERT INTO tech_earnings (tech_name, payment_id, source, description, amount, status) VALUES (?, NULL, 'payout', 'Payout requested', ?, 'withdrawn')`,
      [tech_name, -amount]
    );

    const [rows] = await pool.query('SELECT * FROM tech_payouts WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating payout:', error);
    res.status(500).json({ error: 'Failed to create payout' });
  }
});

// Get payout history
router.get('/payouts/:techName', async (req, res) => {
  const { techName } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tech_payouts WHERE tech_name = ? ORDER BY created_at DESC',
      [techName]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

// Get earnings chart data (monthly)
router.get('/:techName/chart', async (req, res) => {
  const { techName } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(CASE WHEN source = 'hire' THEN amount ELSE 0 END) as hire_earnings,
        SUM(CASE WHEN source = 'ticket' THEN amount ELSE 0 END) as ticket_earnings,
        SUM(CASE WHEN source = 'bonus' THEN amount ELSE 0 END) as bonus_earnings,
        SUM(amount) as total
       FROM tech_earnings 
       WHERE tech_name = ? AND source != 'payout' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month`,
      [techName]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

export default router;
