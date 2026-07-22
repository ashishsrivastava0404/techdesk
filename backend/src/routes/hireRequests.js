import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

router.get('/', async (req, res) => {
  const { tech_name, customer_name } = req.query;
  
  let query = 'SELECT * FROM hire_requests WHERE 1=1';
  const params = [];
  
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
    console.error('Error fetching hire requests:', error);
    res.status(500).json({ error: 'Failed to fetch hire requests' });
  }
});

router.post('/', async (req, res) => {
  const { tech_name, customer_name, message, contact } = req.body;
  
  if (!tech_name || !customer_name || !message || !contact) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO hire_requests (tech_name, customer_name, message, contact) VALUES (?, ?, ?, ?)',
      [tech_name, customer_name, message, contact]
    );
    
    const [rows] = await pool.query('SELECT * FROM hire_requests WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating hire request:', error);
    res.status(500).json({ error: 'Failed to create hire request' });
  }
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['sent', 'accepted', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  try {
    await pool.query('UPDATE hire_requests SET status = ? WHERE id = ?', [status, id]);
    const [rows] = await pool.query('SELECT * FROM hire_requests WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating hire request:', error);
    res.status(500).json({ error: 'Failed to update hire request' });
  }
});

export default router;
