import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

// Get history for a ticket
router.get('/:ticketId', async (req, res) => {
  const { ticketId } = req.params;
  const { limit = 100 } = req.query;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM ticket_history WHERE ticket_id = ? ORDER BY created_at DESC LIMIT ?',
      [ticketId, parseInt(limit)]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Add history entry
router.post('/', async (req, res) => {
  const { ticket_id, action, actor_name, actor_role, field_changed, old_value, new_value, metadata } = req.body;

  if (!ticket_id || !action || !actor_name) {
    return res.status(400).json({ error: 'ticket_id, action, and actor_name are required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO ticket_history (ticket_id, action, actor_name, actor_role, field_changed, old_value, new_value, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ticket_id, action, actor_name, actor_role || 'customer', field_changed || null, old_value || null, new_value || null, JSON.stringify(metadata || {})]
    );

    const [rows] = await pool.query('SELECT * FROM ticket_history WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating history:', error);
    res.status(500).json({ error: 'Failed to create history' });
  }
});

// Get activity summary for user
router.get('/user/:userName', async (req, res) => {
  const { userName } = req.params;
  const { days = 7 } = req.query;

  try {
    const [rows] = await pool.query(
      `SELECT h.*, t.title as ticket_title 
       FROM ticket_history h
       JOIN tickets t ON h.ticket_id = t.id
       WHERE h.actor_name = ? AND h.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY h.created_at DESC`,
      [userName, parseInt(days)]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

export default router;
