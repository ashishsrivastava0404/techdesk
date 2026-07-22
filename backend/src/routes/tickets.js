import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

// Get tickets with filters
router.get('/', async (req, res) => {
  const { status, tech_name, customer_name, environment, priority, category, search } = req.query;
  
  let query = 'SELECT * FROM tickets WHERE 1=1';
  const params = [];
  
  if (status) {
    if (status === 'open') {
      query += " AND status IN ('open', 'claimed', 'in_progress')";
    } else {
      query += ' AND status = ?';
      params.push(status);
    }
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

  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }
  
  query += ' ORDER BY FIELD(priority, "critical", "urgent", "high", "normal", "low"), created_at DESC';
  
  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get single ticket
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

// Create ticket
router.post('/', async (req, res) => {
  const { title, description, environment, priority, customer_name, category, tags, estimated_hours } = req.body;
  
  if (!title || !description || !customer_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    // Calculate SLA based on priority
    let slaHours = 24; // default 24 hours
    if (priority === 'critical') slaHours = 1;
    else if (priority === 'urgent') slaHours = 4;
    else if (priority === 'high') slaHours = 8;
    else if (priority === 'normal') slaHours = 24;
    else if (priority === 'low') slaHours = 48;

    const [result] = await pool.query(
      `INSERT INTO tickets (title, description, environment, priority, customer_name, category, tags, estimated_hours, sla_due_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))`,
      [title, description, environment || 'dev', priority || 'normal', customer_name, category || 'general', JSON.stringify(tags || []), estimated_hours || null, slaHours]
    );
    
    const [rows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [result.insertId]);
    
    // Log history
    await pool.query(
      `INSERT INTO ticket_history (ticket_id, action, actor_name, actor_role, metadata)
       VALUES (?, 'created', ?, 'customer', ?)`,
      [result.insertId, customer_name, JSON.stringify({ priority, environment })]
    );

    // Notify admins
    const [admins] = await pool.query("SELECT name FROM users WHERE role = 'admin'");
    for (const admin of admins) {
      await pool.query(
        `INSERT INTO notifications (user_name, type, title, message, related_ticket_id)
         VALUES (?, 'new_ticket', ?, ?, ?)`,
        [admin.name, 'New ticket created', `"${title}" - ${priority} priority`, result.insertId]
      );
    }
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Update ticket
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, tech_name, priority, category, tags, estimated_hours, actual_hours, actor_name, actor_role } = req.body;
  
  try {
    // Get current ticket for history
    const [current] = await pool.query('SELECT * FROM tickets WHERE id = ?', [id]);
    if (current.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    const ticket = current[0];

    const updates = [];
    const params = [];
    const historyEntries = [];
    
    if (status) {
      updates.push('status = ?');
      params.push(status);
      historyEntries.push({ field: 'status', old: ticket.status, new: status });
      
      if (status === 'resolved') {
        updates.push('resolved_at = NOW()');
        // Check SLA
        const slaStatus = new Date(ticket.sla_due_at) > new Date() ? 'met' : 'breached';
        updates.push('sla_status = ?');
        params.push(slaStatus);
        historyEntries.push({ field: 'sla_status', old: ticket.sla_status, new: slaStatus });
      }
    }
    
    if (tech_name !== undefined) {
      updates.push('tech_name = ?');
      params.push(tech_name);
      historyEntries.push({ field: 'tech_name', old: ticket.tech_name, new: tech_name });
      
      // Set first response time if claiming
      if (tech_name && !ticket.first_response_at) {
        updates.push('first_response_at = NOW()');
      }
    }

    if (priority !== undefined) {
      updates.push('priority = ?');
      params.push(priority);
      historyEntries.push({ field: 'priority', old: ticket.priority, new: priority });
    }

    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
      historyEntries.push({ field: 'category', old: ticket.category, new: category });
    }

    if (tags !== undefined) {
      updates.push('tags = ?');
      params.push(JSON.stringify(tags));
      historyEntries.push({ field: 'tags', old: ticket.tags, new: tags });
    }

    if (estimated_hours !== undefined) {
      updates.push('estimated_hours = ?');
      params.push(estimated_hours);
      historyEntries.push({ field: 'estimated_hours', old: ticket.estimated_hours, new: estimated_hours });
    }

    if (actual_hours !== undefined) {
      updates.push('actual_hours = ?');
      params.push(actual_hours);
      historyEntries.push({ field: 'actual_hours', old: ticket.actual_hours, new: actual_hours });
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    params.push(id);
    await pool.query(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`, params);

    // Log history
    const actor = actor_name || tech_name || 'System';
    const role = actor_role || 'tech';
    for (const entry of historyEntries) {
      await pool.query(
        `INSERT INTO ticket_history (ticket_id, action, actor_name, actor_role, field_changed, old_value, new_value)
         VALUES (?, 'updated', ?, ?, ?, ?, ?)`,
        [id, actor, role, entry.field, entry.old || '', entry.new || '']
      );
    }

    // Send notifications
    if (status === 'claimed' && tech_name) {
      await pool.query(
        `INSERT INTO notifications (user_name, type, title, message, related_ticket_id, related_user)
         VALUES (?, 'ticket_claimed', ?, ?, ?, ?)`,
        [ticket.customer_name, 'Your ticket has been claimed', `"${ticket.title}" is being worked on by ${tech_name}`, id, tech_name]
      );
    } else if (status === 'resolved') {
      await pool.query(
        `INSERT INTO notifications (user_name, type, title, message, related_ticket_id)
         VALUES (?, 'ticket_resolved', ?, ?, ?)`,
        [ticket.customer_name, 'Ticket resolved', `"${ticket.title}" has been marked as resolved`, id]
      );
    }
    
    const [rows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Delete ticket
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
