import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/:name', async (req, res) => {
  const { name } = req.params;
  try {
    let [rows] = await pool.query('SELECT * FROM users WHERE name = ?', [name]);
    
    if (rows.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO users (name, role) VALUES (?, ?)',
        [name, 'customer']
      );
      [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

router.patch('/:name', async (req, res) => {
  const { name } = req.params;
  const { role } = req.body;
  
  try {
    await pool.query('UPDATE users SET role = ? WHERE name = ?', [role, name]);
    const [rows] = await pool.query('SELECT * FROM users WHERE name = ?', [name]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.get('/techs/leaderboard', async (req, res) => {
  try {
    const [techs] = await pool.query(
      'SELECT name FROM users WHERE role = "tech"'
    );
    
    const leaderboard = await Promise.all(techs.map(async (tech) => {
      const [ratings] = await pool.query(
        'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM ratings WHERE tech_name = ?',
        [tech.name]
      );
      
      const [resolved] = await pool.query(
        'SELECT COUNT(*) as resolved_count FROM tickets WHERE tech_name = ? AND status = "closed"',
        [tech.name]
      );
      
      const avgRating = parseFloat(ratings[0].avg_rating) || 0;
      const count = parseInt(ratings[0].count) || 0;
      const resolvedCount = parseInt(resolved[0].resolved_count) || 0;
      
      const composite = Math.round((avgRating * 20) + (resolvedCount * 2));
      
      let tier = 'Dev';
      if (composite >= 66) tier = 'Production-Ready';
      else if (composite >= 33) tier = 'Staging';
      
      return {
        name: tech.name,
        avgRating: avgRating ? parseFloat(avgRating.toFixed(1)) : null,
        count,
        resolvedCount,
        composite,
        tier
      };
    }));
    
    leaderboard.sort((a, b) => b.composite - a.composite);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
