import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/index.js';

const router = Router();

// Get all ratings (paginated)
router.get('/', async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  
  try {
    const [rows] = await pool.query(
      'SELECT r.*, t.title as ticket_title FROM ratings r LEFT JOIN tickets t ON r.ticket_id = t.id ORDER BY r.created_at DESC LIMIT ? OFFSET ?',
      [parseInt(limit), parseInt(offset)]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// Get ratings for a specific tech
router.get('/tech/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT r.*, t.title as ticket_title FROM ratings r LEFT JOIN tickets t ON r.ticket_id = t.id WHERE r.tech_name = ? ORDER BY r.created_at DESC',
      [name]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// Create a new rating
router.post('/', authenticate, async (req, res) => {
  const { ticket_id, tech_name, rating, comment } = req.body;

  if (!ticket_id || !tech_name || !rating) {
    return res.status(400).json({ error: 'Missing required fields: ticket_id, tech_name, rating' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO ratings (ticket_id, tech_name, rating, comment) VALUES (?, ?, ?, ?)',
      [ticket_id, tech_name, rating, comment || '']
    );

    const [rows] = await pool.query('SELECT * FROM ratings WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating rating:', error);
    res.status(500).json({ error: 'Failed to create rating' });
  }
});

export default router;
