import { Router } from 'express';
import pool from '../db/index.js';
import { stripeService } from '../services/stripe.js';
import { paypalService } from '../services/paypal.js';
import { bankTransferService } from '../services/bankTransfer.js';
import { notificationService } from '../services/notifications.js';

const router = Router();

// Get tech earnings summary
router.get('/:techName', async (req, res) => {
  const { techName } = req.params;

  try {
    const [totalResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM tech_earnings WHERE tech_name = ? AND source != 'payout'`,
      [techName]
    );

    const [availableResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as available FROM tech_earnings WHERE tech_name = ? AND status = 'available' AND source != 'payout'`,
      [techName]
    );

    const [pendingResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as pending FROM tech_earnings WHERE tech_name = ? AND status = 'pending' AND source != 'payout'`,
      [techName]
    );

    const [monthResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as this_month FROM tech_earnings
       WHERE tech_name = ? AND source != 'payout' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())`,
      [techName]
    );

    const [withdrawnResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as withdrawn FROM tech_payouts WHERE tech_name = ? AND status = 'completed'`,
      [techName]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as count FROM tech_earnings WHERE tech_name = ? AND source != 'payout'`,
      [techName]
    );

    const [userResult] = await pool.query(
      `SELECT payout_method, payout_details FROM users WHERE name = ?`,
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
        : 0,
      payoutMethod: userResult[0]?.payout_method || 'stripe',
      payoutDetails: userResult[0]?.payout_details || {}
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
    const [availableResult] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as available FROM tech_earnings WHERE tech_name = ? AND status = 'available'`,
      [tech_name]
    );

    if (availableResult[0].available < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const [settingResult] = await pool.query('SELECT value FROM platform_settings WHERE key_name = ?', ['minimum_payout']);
    const minPayout = parseFloat(settingResult[0]?.value || 25);

    if (amount < minPayout) {
      return res.status(400).json({ error: `Minimum payout is $${minPayout}` });
    }

    const [result] = await pool.query(
      `INSERT INTO tech_payouts (tech_name, amount, method, payout_details, status, requested_at) 
       VALUES (?, ?, ?, ?, 'requested', NOW())`,
      [tech_name, amount, method, JSON.stringify(payout_details || {})]
    );

    await pool.query(
      `INSERT INTO tech_earnings (tech_name, payment_id, source, description, amount, status) 
       VALUES (?, ?, 'payout', 'Payout requested - pending approval', ?, 'withdrawn')`,
      [tech_name, result.insertId, -amount]
    );

    const [techUser] = await pool.query('SELECT email FROM users WHERE name = ?', [tech_name]);

    if (techUser[0]?.email) {
      await notificationService.sendEmail(
        techUser[0].email,
        'Payout Request Submitted',
        `Your payout request of $${amount.toFixed(2)} via ${method} has been submitted and is pending admin approval.`
      );
    }

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

// Process payout (admin only)
router.patch('/payouts/:id/process', async (req, res) => {
  const { id } = req.params;
  const { admin_name, action, notes } = req.body;

  if (!admin_name) {
    return res.status(400).json({ error: 'Admin name required' });
  }

  try {
    const [payouts] = await pool.query('SELECT * FROM tech_payouts WHERE id = ?', [id]);
    
    if (payouts.length === 0) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    const payout = payouts[0];

    if (payout.status !== 'requested') {
      return res.status(400).json({ error: 'Payout has already been processed' });
    }

    if (action === 'reject') {
      await pool.query(
        `UPDATE tech_payouts SET status = 'rejected', processed_by = ?, processed_at = NOW(), admin_notes = ? WHERE id = ?`,
        [admin_name, notes || 'Rejected by admin', id]
      );

      await pool.query(
        `INSERT INTO tech_earnings (tech_name, payment_id, source, description, amount, status) 
         VALUES (?, ?, 'payout', 'Payout rejected - funds returned', ?, 'available')`,
        [payout.tech_name, id, payout.amount]
      );

      const [techUser] = await pool.query('SELECT email FROM users WHERE name = ?', [payout.tech_name]);
      if (techUser[0]?.email) {
        await notificationService.sendEmail(
          techUser[0].email,
          'Payout Request Rejected',
          `Your payout request of $${payout.amount.toFixed(2)} has been rejected. ${notes || 'Please contact support.'}`
        );
      }

      return res.json({ success: true, message: 'Payout rejected, funds returned' });
    }

    // Approve and process
    let transferResult;
    const payoutDetails = JSON.parse(payout.payout_details || '{}');

    try {
      if (payout.method === 'stripe') {
        if (stripeService.configured()) {
          transferResult = await stripeService.transferToConnectAccount(
            payoutDetails.stripeAccountId,
            payout.amount
          );
        } else {
          transferResult = {
            transferId: `stripe_demo_${Date.now()}`,
            status: 'pending',
            message: 'Demo mode: Stripe transfer simulated'
          };
        }
      } else if (payout.method === 'paypal') {
        if (paypalService.configured()) {
          transferResult = await paypalService.createPayout(
            `payout_${id}`,
            payoutDetails.email,
            payout.amount
          );
        } else {
          transferResult = {
            batchId: `paypal_demo_${Date.now()}`,
            status: 'pending',
            message: 'Demo mode: PayPal transfer simulated'
          };
        }
      } else if (payout.method === 'bank') {
        transferResult = await bankTransferService.processACHTransfer(
          payoutDetails,
          payout.amount,
          payout.tech_name,
          id
        );
      } else {
        throw new Error('Invalid payout method');
      }
    } catch (transferError) {
      console.error('Transfer error:', transferError);
      return res.status(500).json({ error: `Transfer failed: ${transferError.message}` });
    }

    await pool.query(
      `UPDATE tech_payouts 
       SET status = 'processing', 
           processed_by = ?, 
           processed_at = NOW(), 
           admin_notes = ?,
           transfer_id = ?,
           transfer_status = ?
       WHERE id = ?`,
      [admin_name, notes || 'Processed successfully', transferResult.transferId || null, transferResult.status, id]
    );

    const [techUser] = await pool.query('SELECT email FROM users WHERE name = ?', [payout.tech_name]);
    if (techUser[0]?.email) {
      const estimatedArrival = transferResult.estimatedArrival 
        ? new Date(transferResult.estimatedArrival).toLocaleDateString()
        : '1-3 business days';
      
      await notificationService.sendEmail(
        techUser[0].email,
        'Payout Processing Started',
        `Your payout of $${payout.amount.toFixed(2)} is being processed via ${payout.method}. 
        
Estimated arrival: ${estimatedArrival}
Transfer ID: ${transferResult.transferId || 'N/A'}`
      );
    }

    const [updatedPayout] = await pool.query('SELECT * FROM tech_payouts WHERE id = ?', [id]);
    res.json(updatedPayout[0]);
  } catch (error) {
    console.error('Error processing payout:', error);
    res.status(500).json({ error: 'Failed to process payout' });
  }
});

// Complete payout
router.patch('/payouts/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { admin_name } = req.body;

  try {
    await pool.query(
      `UPDATE tech_payouts SET status = 'completed', completed_at = NOW() WHERE id = ? AND status = 'processing'`,
      [id]
    );

    const [payout] = await pool.query('SELECT * FROM tech_payouts WHERE id = ?', [id]);
    
    if (payout[0]) {
      const [techUser] = await pool.query('SELECT email FROM users WHERE name = ?', [payout[0].tech_name]);
      if (techUser[0]?.email) {
        await notificationService.sendEmail(
          techUser[0].email,
          'Payout Completed!',
          `Great news! Your payout of $${payout[0].amount.toFixed(2)} has been completed and should now be available in your ${payout[0].method} account.`
        );
      }
    }

    res.json({ success: true, message: 'Payout completed' });
  } catch (error) {
    console.error('Error completing payout:', error);
    res.status(500).json({ error: 'Failed to complete payout' });
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
