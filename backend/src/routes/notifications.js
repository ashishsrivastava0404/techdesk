import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

// Get notifications for user
router.get('/:userName', async (req, res) => {
  const { userName } = req.params;
  const { unread_only, limit = 50 } = req.query;

  let query = 'SELECT * FROM notifications WHERE user_name = ?';
  const params = [userName];

  if (unread_only === 'true') {
    query += ' AND is_read = FALSE';
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/:userName/count', async (req, res) => {
  const { userName } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_name = ? AND is_read = FALSE',
      [userName]
    );
    res.json({ unread_count: rows[0].count });
  } catch (error) {
    console.error('Error fetching count:', error);
    res.status(500).json({ error: 'Failed to fetch count' });
  }
});

// Mark as read
router.patch('/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification:', error);
    res.status(500).json({ error: 'Failed to mark notification' });
  }
});

// Mark all as read
router.patch('/:userName/read-all', async (req, res) => {
  const { userName } = req.params;
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_name = ?', [userName]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications:', error);
    res.status(500).json({ error: 'Failed to mark notifications' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM notifications WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Create notification (internal use)
router.post('/', async (req, res) => {
  const { user_name, type, title, message, related_ticket_id, related_user } = req.body;

  if (!user_name || !title) {
    return res.status(400).json({ error: 'user_name and title are required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO notifications (user_name, type, title, message, related_ticket_id, related_user)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_name, type || 'info', title, message || null, related_ticket_id || null, related_user || null]
    );

    const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

export default router;
