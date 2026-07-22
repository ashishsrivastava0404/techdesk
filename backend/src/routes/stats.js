import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

router.get('/:name', async (req, res) => {
  const { name } = req.params;
  
  try {
    const [userRows] = await pool.query('SELECT * FROM users WHERE name = ?', [name]);
    
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userRows[0];
    
    let stats = {
      role: user.role,
      openTickets: 0,
      resolvedTickets: 0,
      claimedTickets: 0,
      pendingRequests: 0,
      incomingLeads: 0,
      composite: 0,
      tier: 'Dev',
      avgRating: null,
      totalResolved: 0
    };
    
    if (user.role === 'customer') {
      const [openResult] = await pool.query(
        "SELECT COUNT(*) as count FROM tickets WHERE customer_name = ? AND status IN ('open', 'claimed')",
        [name]
      );
      stats.openTickets = openResult[0].count;
      
      const [resolvedResult] = await pool.query(
        "SELECT COUNT(*) as count FROM tickets WHERE customer_name = ? AND status = 'closed'",
        [name]
      );
      stats.resolvedTickets = resolvedResult[0].count;
      
      const [requestsResult] = await pool.query(
        "SELECT COUNT(*) as count FROM hire_requests WHERE customer_name = ? AND status = 'sent'",
        [name]
      );
      stats.pendingRequests = requestsResult[0].count;
    } else {
      const [openResult] = await pool.query(
        "SELECT COUNT(*) as count FROM tickets WHERE status = 'open'",
        []
      );
      stats.openTickets = openResult[0].count;
      
      const [claimedResult] = await pool.query(
        "SELECT COUNT(*) as count FROM tickets WHERE tech_name = ? AND status = 'claimed'",
        [name]
      );
      stats.claimedTickets = claimedResult[0].count;
      
      const [resolvedResult] = await pool.query(
        "SELECT COUNT(*) as count FROM tickets WHERE tech_name = ? AND status = 'closed'",
        [name]
      );
      stats.totalResolved = resolvedResult[0].count;
      stats.resolvedTickets = resolvedResult[0].count;
      
      const [leadsResult] = await pool.query(
        "SELECT COUNT(*) as count FROM hire_requests WHERE tech_name = ? AND status = 'sent'",
        [name]
      );
      stats.incomingLeads = leadsResult[0].count;
      
      const [ratingResult] = await pool.query(
        'SELECT AVG(rating) as avg_rating FROM ratings WHERE tech_name = ?',
        [name]
      );
      
      const avgRating = parseFloat(ratingResult[0].avg_rating);
      if (avgRating) {
        stats.avgRating = parseFloat(avgRating.toFixed(1));
        stats.composite = Math.round((stats.avgRating * 20) + (stats.totalResolved * 2));
        
        if (stats.composite >= 66) stats.tier = 'Production-Ready';
        else if (stats.composite >= 33) stats.tier = 'Staging';
      }
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/', async (req, res) => {
  try {
    const [ticketCount] = await pool.query('SELECT COUNT(*) as count FROM tickets');
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [ratingCount] = await pool.query('SELECT COUNT(*) as count FROM ratings');
    
    res.json({
      totalTickets: ticketCount[0].count,
      totalUsers: userCount[0].count,
      totalRatings: ratingCount[0].count
    });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({ error: 'Failed to fetch global stats' });
  }
});

export default router;
