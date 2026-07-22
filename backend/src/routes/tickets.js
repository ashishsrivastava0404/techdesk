import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

router.get('/', async (req, res) => {
  const { status, tech_name, customer_name, environment } = req.query;
  
  let query = 'SELECT * FROM tickets WHERE 1=1';
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
  
  if (environment) {
    query += ' AND environment = ?';
    params.push(environment);
  }
  
  query += ' ORDER BY created_at DESC';
  
  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

router.post('/', async (req, res) => {
  const { title, description, environment, priority, customer_name } = req.body;
  
  if (!title || !description || !customer_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO tickets (title, description, environment, priority, customer_name) VALUES (?, ?, ?, ?, ?)',
      [title, description, environment || 'dev', priority || 'normal', customer_name]
    );
    
    const [rows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, tech_name } = req.body;
  
  try {
    const updates = [];
    const params = [];
    
    if (status) {
      updates.push('status = ?');
      params.push(status);
      
      if (status === 'resolved') {
        updates.push('resolved_at = NOW()');
      }
    }
    
    if (tech_name !== undefined) {
      updates.push('tech_name = ?');
      params.push(tech_name);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    params.push(id);
    await pool.query(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`, params);
    
    const [rows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tickets WHERE id = ?', [id]);
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

export default router;
