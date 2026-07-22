import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

// Admin dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    // Total users
    const [userRows] = await pool.query('SELECT COUNT(*) as count FROM users');

    // Users by role
    const [roleRows] = await pool.query(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );

    // Active tickets
    const [ticketRows] = await pool.query(
      "SELECT COUNT(*) as count FROM tickets WHERE status IN ('open', 'claimed')"
    );

    // Resolved tickets (this month)
    const [resolvedRows] = await pool.query(
      `SELECT COUNT(*) as count FROM tickets WHERE status = 'closed' 
       AND MONTH(resolved_at) = MONTH(CURDATE()) AND YEAR(resolved_at) = YEAR(CURDATE())`
    );

    // Platform revenue (this month)
    const [revenueRows] = await pool.query(
      `SELECT COALESCE(SUM(platform_fee), 0) as total FROM payments 
       WHERE status IN ('released', 'held') AND MONTH(created_at) = MONTH(CURDATE())`
    );

    // Total platform revenue
    const [totalRevenueRows] = await pool.query(
      `SELECT COALESCE(SUM(platform_fee), 0) as total FROM payments WHERE status IN ('released', 'held')`
    );

    // Average rating
    const [ratingRows] = await pool.query('SELECT AVG(rating) as avg FROM ratings');

    // Pending payouts
    const [payoutRows] = await pool.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM tech_payouts WHERE status = 'requested'"
    );

    // Disputed payments
    const [disputeRows] = await pool.query(
      "SELECT COUNT(*) as count FROM payments WHERE status = 'disputed'"
    );

    res.json({
      totalUsers: userRows[0].count,
      usersByRole: roleRows.reduce((acc, r) => { acc[r.role] = r.count; return acc; }, {}),
      activeTickets: ticketRows[0].count,
      resolvedThisMonth: resolvedRows[0].count,
      revenueThisMonth: parseFloat(revenueRows[0].total) || 0,
      totalPlatformRevenue: parseFloat(totalRevenueRows[0].total) || 0,
      averageRating: ratingRows[0].avg ? parseFloat(parseFloat(ratingRows[0].avg).toFixed(1)) : 0,
      pendingPayouts: {
        count: payoutRows[0].count,
        total: parseFloat(payoutRows[0].total) || 0
      },
      disputedPayments: disputeRows[0].count
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  const { role, status, search } = req.query;

  let query = 'SELECT * FROM users WHERE 1=1';
  const params = [];

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  query += ' ORDER BY created_at DESC';

  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user (admin action)
router.patch('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { role, status, admin_name } = req.body;

  const updates = [];
  const params = [];
  const logDetails = {};

  if (role !== undefined) {
    updates.push('role = ?');
    params.push(role);
    logDetails.role = role;
  }
  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
    logDetails.status = status;
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }

  params.push(id);

  try {
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    // Log admin action
    await pool.query(
      `INSERT INTO admin_logs (admin_name, action, target_type, target_id, details)
       VALUES (?, 'update_user', 'user', ?, ?)`,
      [admin_name || 'system', id, JSON.stringify(logDetails)]
    );

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get all payments (admin)
router.get('/payments', async (req, res) => {
  const { status } = req.query;

  let query = 'SELECT * FROM payments';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
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

// Get all payouts
router.get('/payouts', async (req, res) => {
  const { status } = req.query;

  let query = 'SELECT * FROM tech_payouts';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

// Update payout status
router.patch('/payouts/:id', async (req, res) => {
  const { id } = req.params;
  const { status, admin_name } = req.body;

  if (!['requested', 'processing', 'completed', 'failed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const updates = ['status = ?'];
    const params = [status];

    if (status === 'completed') {
      updates.push('completed_at = NOW()');
    }

    params.push(id);
    await pool.query(`UPDATE tech_payouts SET ${updates.join(', ')} WHERE id = ?`, params);

    // Log admin action
    await pool.query(
      `INSERT INTO admin_logs (admin_name, action, target_type, target_id, details)
       VALUES (?, 'update_payout', 'payout', ?, ?)`,
      [admin_name || 'system', id, JSON.stringify({ status })]
    );

    const [rows] = await pool.query('SELECT * FROM tech_payouts WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating payout:', error);
    res.status(500).json({ error: 'Failed to update payout' });
  }
});

// Get audit logs
router.get('/logs', async (req, res) => {
  const { action, target_type, admin_name, limit = 100 } = req.query;

  let query = 'SELECT * FROM admin_logs WHERE 1=1';
  const params = [];

  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }
  if (target_type) {
    query += ' AND target_type = ?';
    params.push(target_type);
  }
  if (admin_name) {
    query += ' AND admin_name = ?';
    params.push(admin_name);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Get platform settings
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM platform_settings');
    const settings = rows.reduce((acc, row) => {
      acc[row.key_name] = row.value;
      return acc;
    }, {});
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update platform settings
router.patch('/settings', async (req, res) => {
  const { settings, admin_name } = req.body;

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Settings object required' });
  }

  try {
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'UPDATE platform_settings SET value = ? WHERE key_name = ?',
        [JSON.stringify(value), key]
      );
    }

    // Log admin action
    await pool.query(
      `INSERT INTO admin_logs (admin_name, action, target_type, details)
       VALUES (?, 'update_settings', 'settings', ?)`,
      [admin_name || 'system', JSON.stringify(settings)]
    );

    const [rows] = await pool.query('SELECT * FROM platform_settings');
    const result = rows.reduce((acc, row) => {
      acc[row.key_name] = row.value;
      return acc;
    }, {});
    res.json(result);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Revenue chart data
router.get('/revenue-chart', async (req, res) => {
  const { months = 12 } = req.query;

  try {
    const [rows] = await pool.query(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(amount) as total_volume,
        SUM(platform_fee) as platform_revenue,
        COUNT(*) as transaction_count
       FROM payments 
       WHERE status IN ('released', 'held') AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month`,
      [parseInt(months)]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching revenue chart:', error);
    res.status(500).json({ error: 'Failed to fetch revenue chart' });
  }
});

export default router;
