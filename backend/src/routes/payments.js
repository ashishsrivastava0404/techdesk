import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

// Get platform settings
async function getSetting(key) {
  const [rows] = await pool.query('SELECT value FROM platform_settings WHERE key_name = ?', [key]);
  return rows[0] ? parseFloat(rows[0].value) : 0;
}

// Create payment
router.post('/', async (req, res) => {
  const { hire_request_id, ticket_id, customer_name, tech_name, amount, payment_method } = req.body;

  if (!customer_name || !tech_name || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const commissionRate = await getSetting('commission_rate');
    const platformFee = amount * commissionRate;
    const techPayout = amount - platformFee;

    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const [result] = await pool.query(
      `INSERT INTO payments (hire_request_id, ticket_id, customer_name, tech_name, amount, platform_fee, tech_payout, payment_method, transaction_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'held')`,
      [hire_request_id || null, ticket_id || null, customer_name, tech_name, amount, platformFee, techPayout, payment_method || 'card', transactionId]
    );

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
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
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
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Release payment to tech
router.patch('/:id/release', async (req, res) => {
  const { id } = req.params;
  try {
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
  try {
    await pool.query(`UPDATE payments SET status = 'refunded' WHERE id = ? AND status = 'held'`, [id]);

    const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [id]);

    // Remove tech earnings if payment is refunded
    if (rows[0] && rows[0].payment_id) {
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

export default router;
