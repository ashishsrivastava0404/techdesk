import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

/**
 * Submit a support report (any user - no auth required for guests)
 */
router.post('/', async (req, res) => {
  const { 
    user_id, 
    user_name, 
    user_email, 
    user_role = 'customer',
    report_type, 
    subject, 
    description,
    page_url,
    browser_info,
    priority = 'medium'
  } = req.body;

  if (!report_type || !subject || !description) {
    return res.status(400).json({ 
      error: 'report_type, subject, and description are required' 
    });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO support_reports 
       (user_id, user_name, user_email, user_role, report_type, subject, description, page_url, browser_info, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, user_name, user_email, user_role, report_type, subject, description, page_url, browser_info, priority]
    );

    // Log in admin_logs
    if (user_id) {
      await pool.query(
        `INSERT INTO admin_logs (admin_name, action, target_type, target_id, details, ip_address)
         VALUES (?, 'support_report_submitted', 'support_report', ?, ?, ?)`,
        [user_name || 'anonymous', result.insertId, JSON.stringify({ report_type, subject }), req.ip]
      );
    }

    // Create notification for admins
    const priorityEmoji = priority === 'urgent' ? '🚨' : priority === 'high' ? '⚠️' : '📋';
    await pool.query(
      `INSERT INTO notifications (user_name, type, title, message, related_report_id)
       SELECT 'admin', 'support_report', ?, ?, ?
       FROM DUAL WHERE EXISTS (SELECT 1 FROM users WHERE role = 'admin')`,
      [
        `${priorityEmoji} New Support Report`,
        `${report_type.replace('_', ' ')}: ${subject} (${priority} priority)`,
        result.insertId
      ]
    );

    // Also insert directly if no admin exists via select
    await pool.query(
      `INSERT INTO notifications (user_name, type, title, message, related_report_id)
       SELECT 'Admin', 'support_report', ?, ?, ?
       FROM DUAL WHERE EXISTS (SELECT 1 FROM users WHERE role = 'admin' LIMIT 1)
       ON DUPLICATE KEY UPDATE id = id`,
      [
        `${priorityEmoji} New Support Report`,
        `${report_type.replace('_', ' ')}: ${subject} (${priority} priority)`,
        result.insertId
      ]
    );

    res.status(201).json({ 
      success: true, 
      report_id: result.insertId,
      message: 'Your report has been submitted. We will review it shortly.' 
    });
  } catch (error) {
    console.error('Error creating support report:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

/**
 * Get user's own support reports
 */
router.get('/my-reports', async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM support_reports WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

export default router;
