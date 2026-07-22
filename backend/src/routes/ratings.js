import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

router.get('/tech/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT r.*, t.title as ticket_title FROM ratings r JOIN tickets t ON r.ticket_id = t.id WHERE r.tech_name = ? ORDER BY r.created_at DESC',
      [name]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

router.post('/', async (req, res) => {
  const { ticket_id, tech_name, rating, comment } = req.body;
  
  if (!ticket_id || !tech_name || !rating) {
    return res.status(400).json({ error: 'Missing required fields' });
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
