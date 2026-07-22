import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

// Get survey for ticket
router.get('/ticket/:ticketId', async (req, res) => {
  const { ticketId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM csat_surveys WHERE ticket_id = ?',
      [ticketId]
    );
    res.json(rows[0] || null);
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// Submit survey
router.post('/', async (req, res) => {
  const { ticket_id, customer_name, tech_name, score, feedback, would_recommend, resolved_on_time, communication_rating, response_time_rating } = req.body;

  if (!ticket_id || !customer_name || score === undefined) {
    return res.status(400).json({ error: 'ticket_id, customer_name, and score are required' });
  }

  try {
    // Check if survey already exists
    const [existing] = await pool.query(
      'SELECT * FROM csat_surveys WHERE ticket_id = ?',
      [ticket_id]
    );

    if (existing.length > 0) {
      // Update existing survey
      await pool.query(
        `UPDATE csat_surveys SET 
         score = ?, feedback = ?, would_recommend = ?, resolved_on_time = ?,
         communication_rating = ?, response_time_rating = ?, completed_at = NOW()
         WHERE ticket_id = ?`,
        [score, feedback || null, would_recommend, resolved_on_time, communication_rating || null, response_time_rating || null, ticket_id]
      );
    } else {
      // Create new survey
      await pool.query(
        `INSERT INTO csat_surveys (ticket_id, customer_name, tech_name, score, feedback, would_recommend, resolved_on_time, communication_rating, response_time_rating, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [ticket_id, customer_name, tech_name || null, score, feedback || null, would_recommend, resolved_on_time, communication_rating || null, response_time_rating || null]
      );
    }

    // Update ticket satisfaction score
    await pool.query(
      'UPDATE tickets SET satisfaction_score = ? WHERE id = ?',
      [score, ticket_id]
    );

    const [rows] = await pool.query('SELECT * FROM csat_surveys WHERE ticket_id = ?', [ticket_id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error submitting survey:', error);
    res.status(500).json({ error: 'Failed to submit survey' });
  }
});

// Get surveys for tech
router.get('/tech/:techName', async (req, res) => {
  const { techName } = req.params;
  const { days = 30 } = req.query;

  try {
    const [rows] = await pool.query(
      `SELECT cs.*, t.title as ticket_title, t.environment
       FROM csat_surveys cs
       JOIN tickets t ON cs.ticket_id = t.id
       WHERE cs.tech_name = ? AND cs.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY cs.created_at DESC`,
      [techName, parseInt(days)]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

// Get CSAT stats for tech
router.get('/tech/:techName/stats', async (req, res) => {
  const { techName } = req.params;
  const { days = 30 } = req.query;

  try {
    const [avgScore] = await pool.query(
      `SELECT AVG(score) as avg_score, COUNT(*) as total_surveys
       FROM csat_surveys 
       WHERE tech_name = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [techName, parseInt(days)]
    );

    const [recommendRate] = await pool.query(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN would_recommend = TRUE THEN 1 ELSE 0 END) as recommends,
         AVG(communication_rating) as avg_communication,
         AVG(response_time_rating) as avg_response_time
       FROM csat_surveys 
       WHERE tech_name = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND would_recommend IS NOT NULL`,
      [techName, parseInt(days)]
    );

    res.json({
      averageScore: avgScore[0].avg_score ? parseFloat(avgScore[0].avg_score.toFixed(2)) : 0,
      totalSurveys: avgScore[0].total_surveys,
      recommendRate: recommendRate[0].total > 0 
        ? Math.round((recommendRate[0].recommends / recommendRate[0].total) * 100) 
        : 0,
      averageCommunication: recommendRate[0].avg_communication 
        ? parseFloat(recommendRate[0].avg_communication.toFixed(2)) 
        : 0,
      averageResponseTime: recommendRate[0].avg_response_time 
        ? parseFloat(recommendRate[0].avg_response_time.toFixed(2)) 
        : 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
