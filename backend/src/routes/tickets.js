import { Router } from 'express';
import pool from '../db/index.js';
import { routingService } from '../services/routing.js';
import { validateCategoryPath, getFullPath } from '../constants/ticketCategories.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Get tickets with filters
router.get('/', authenticate, async (req, res) => {
  const { status, tech_name, customer_name, environment, priority, category, subcategory, search, ticket_type } = req.query;
  
  let query = 'SELECT * FROM tickets WHERE 1=1';
  const params = [];
  
  // Role-based filtering
  if (req.user.role === 'customer') {
    query += ' AND customer_name = ?';
    params.push(req.user.name);
  } else if (req.user.role === 'tech') {
    // Techs can ONLY see technical tickets
    query += " AND ticket_type = 'technical'";
    if (!tech_name && !customer_name) {
      query += ' AND (tech_name = ? OR status IN ("open", "pending_assignment"))';
      params.push(req.user.name);
    }
  }
  
  if (status) {
    if (status === 'open') {
      query += " AND status IN ('open', 'claimed', 'in_progress', 'pending_assignment')";
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

  if (subcategory) {
    query += ' AND subcategory = ?';
    params.push(subcategory);
  }

  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ? OR subject LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (ticket_type) {
    query += ' AND ticket_type = ?';
    params.push(ticket_type);
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

// Create ticket with enhanced fields
router.post('/', async (req, res) => {
  const { 
    title, 
    description, 
    subject,
    short_description,
    long_description,
    environment, 
    priority, 
    customer_name, 
    category, 
    subcategory,
    topic,
    tags, 
    estimated_hours,
    ticket_type = 'technical',
    auto_route = true // Whether to auto-route to agents
  } = req.body;
  
  if (!title || !description || !customer_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate ticket_type
  const validTicketTypes = ['technical', 'business'];
  const finalTicketType = validTicketTypes.includes(ticket_type) ? ticket_type : 'technical';

  // Techs can only create business tickets
  if (req.user.role === 'tech' && finalTicketType === 'technical') {
    return res.status(403).json({ error: 'Technicians can only create business tickets' });
  }
  
  // Validate category path if provided
  if (category && subcategory && topic) {
    if (!validateCategoryPath(category, subcategory, topic)) {
      return res.status(400).json({ error: 'Invalid category hierarchy path' });
    }
  }
  
  // Validate word counts
  if (short_description && short_description.split(/\s+/).length > 200) {
    return res.status(400).json({ error: 'short_description exceeds 200 words' });
  }
  
  if (long_description && long_description.split(/\s+/).length > 1000) {
    return res.status(400).json({ error: 'long_description exceeds 1000 words' });
  }
  
  try {
    // Calculate SLA based on priority
    let slaHours = 24;
    if (priority === 'critical') slaHours = 1;
    else if (priority === 'urgent') slaHours = 4;
    else if (priority === 'high') slaHours = 8;
    else if (priority === 'normal') slaHours = 24;
    else if (priority === 'low') slaHours = 48;

    // Get full category path for reporting
    const categoryPath = category && subcategory && topic 
      ? getFullPath(category, subcategory, topic)
      : null;

    const [result] = await pool.query(
      `INSERT INTO tickets (title, description, subject, short_description, long_description, environment, priority, ticket_type, customer_name, category, subcategory, topic, tags, estimated_hours, assigned_to_admin, sla_due_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))`,
      [
        title, 
        description, 
        subject || null,
        short_description || null,
        long_description || null,
        environment || 'dev', 
        priority || 'normal', 
        finalTicketType,
        customer_name, 
        category || 'general',
        subcategory || null,
        topic || null,
        JSON.stringify(tags || []), 
        estimated_hours || null, 
        finalTicketType === 'business' ? req.user.name : null,
        slaHours
      ]
    );
    
    const [rows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [result.insertId]);
    const ticket = rows[0];
    
    // Log history with full category path
    await pool.query(
      `INSERT INTO ticket_history (ticket_id, action, actor_name, actor_role, metadata)
       VALUES (?, 'created', ?, 'customer', ?)`,
      [result.insertId, customer_name, JSON.stringify({ 
        ticket_type: finalTicketType,
        priority, 
        environment, 
        category, 
        subcategory, 
        topic,
        categoryPath 
      })]
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

    // Auto-route to qualified agents if enabled
    let routingResult = null;
    if (auto_route) {
      try {
        routingResult = await routingService.routeTicket(ticket);
      } catch (routingError) {
        console.error('Routing error:', routingError);
      }
    }
    
    res.status(201).json({
      ...ticket,
      routing: routingResult,
      categoryPath
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Update ticket
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, tech_name, assigned_to_admin, priority, category, subcategory, tags, estimated_hours, actual_hours, actor_name, actor_role, subject, short_description, long_description } = req.body;
  
  try {
    // Get current ticket for history
    const [current] = await pool.query('SELECT * FROM tickets WHERE id = ?', [id]);
    if (current.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    const ticket = current[0];

    const updates = [];
    const params = [];
  
  // Role-based filtering
  if (req.user.role === 'customer') {
    query += ' AND customer_name = ?';
    params.push(req.user.name);
  } else if (req.user.role === 'tech') {
    // Techs can ONLY see technical tickets
    query += " AND ticket_type = 'technical'";
    if (!tech_name && !customer_name) {
      query += ' AND (tech_name = ? OR status IN ("open", "pending_assignment"))';
      params.push(req.user.name);
    }
  }
    const historyEntries = [];
    
    // Validate word counts if provided
    if (short_description && short_description.split(/\s+/).length > 200) {
      return res.status(400).json({ error: 'short_description exceeds 200 words' });
    }
    if (long_description && long_description.split(/\s+/).length > 1000) {
      return res.status(400).json({ error: 'long_description exceeds 1000 words' });
    }
    
    if (status) {
      updates.push('status = ?');
      params.push(status);
      historyEntries.push({ field: 'status', old: ticket.status, new: status });
      
      if (status === 'resolved') {
        updates.push('resolved_at = NOW()');
        const slaStatus = new Date(ticket.sla_due_at) > new Date() ? 'met' : 'breached';
        updates.push('sla_status = ?');
        params.push(slaStatus);
        historyEntries.push({ field: 'sla_status', old: ticket.sla_status, new: slaStatus });

        // Update agent expertise
        if (ticket.tech_name) {
          const [ratings] = await pool.query(
            'SELECT rating FROM ratings WHERE ticket_id = ? AND tech_name = ? ORDER BY created_at DESC LIMIT 1',
            [id, ticket.tech_name]
          );
          const rating = ratings[0]?.rating || 0;
          await routingService.updateAgentExpertise(
            ticket.tech_name, 
            ticket.category, 
            ticket.subcategory, 
            rating
          );
        }
      }
    }
    
    if (tech_name !== undefined) {
      updates.push('tech_name = ?');
      params.push(tech_name);
      historyEntries.push({ field: 'tech_name', old: ticket.tech_name, new: tech_name });
      
      if (tech_name && !ticket.first_response_at) {
        updates.push('first_response_at = NOW()');
      }
    }

    if (assigned_to_admin !== undefined) {
      updates.push('assigned_to_admin = ?');
      params.push(assigned_to_admin);
      historyEntries.push({ field: 'assigned_to_admin', old: ticket.assigned_to_admin, new: assigned_to_admin });
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

    if (subcategory !== undefined) {
      updates.push('subcategory = ?');
      params.push(subcategory);
      historyEntries.push({ field: 'subcategory', old: ticket.subcategory, new: subcategory });
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

    if (subject !== undefined) {
      updates.push('subject = ?');
      params.push(subject);
      historyEntries.push({ field: 'subject', old: ticket.subject, new: subject });
    }

    if (short_description !== undefined) {
      updates.push('short_description = ?');
      params.push(short_description);
      historyEntries.push({ field: 'short_description', old: ticket.short_description, new: short_description });
    }

    if (long_description !== undefined) {
      updates.push('long_description = ?');
      params.push(long_description);
      historyEntries.push({ field: 'long_description', old: ticket.long_description, new: long_description });
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

// Get suggested agents for a ticket
router.get('/:id/suggested-agents', async (req, res) => {
  const { id } = req.params;

  try {
    const [tickets] = await pool.query('SELECT * FROM tickets WHERE id = ?', [id]);
    
    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = tickets[0];
    const tags = typeof ticket.tags === 'string' ? JSON.parse(ticket.tags) : ticket.tags || [];
    
    const topAgents = await routingService.getTopAgents(
      ticket.category,
      ticket.subcategory,
      tags,
      10
    );

    res.json({
      ticket: {
        id: ticket.id,
        title: ticket.title,
        category: ticket.category,
        subcategory: ticket.subcategory
      },
      agents: topAgents
    });
  } catch (error) {
    console.error('Error getting suggested agents:', error);
    res.status(500).json({ error: 'Failed to get suggested agents' });
  }
});

// Ticket Drafts - Save draft
router.post('/draft', async (req, res) => {
  const { draft_id, title, description, short_description, long_description, environment, priority, category, subcategory, topic, tags } = req.body;
  
  try {
    if (!draft_id) {
      return res.status(400).json({ error: 'draft_id is required' });
    }

    // Store draft in memory or database (using simple JSON file for persistence)
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const draftsDir = path.join(process.cwd(), 'data', 'drafts');
    await fs.mkdir(draftsDir, { recursive: true });
    
    const draftData = {
      draft_id,
      title: title || '',
      description: description || '',
      short_description: short_description || '',
      long_description: long_description || '',
      environment: environment || 'dev',
      priority: priority || 'normal',
      category: category || 'general',
      subcategory: subcategory || '',
      topic: topic || '',
      tags: tags || [],
      saved_at: new Date().toISOString()
    };
    
    await fs.writeFile(
      path.join(draftsDir, `${draft_id}.json`),
      JSON.stringify(draftData, null, 2)
    );
    
    res.json({ success: true, message: 'Draft saved successfully', draft: draftData });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

// Ticket Drafts - Get draft
router.get('/draft/:draft_id', async (req, res) => {
  const { draft_id } = req.params;
  
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const draftPath = path.join(process.cwd(), 'data', 'drafts', `${draft_id}.json`);
    
    try {
      const data = await fs.readFile(draftPath, 'utf8');
      const draft = JSON.parse(data);
      res.json(draft);
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.status(404).json({ error: 'Draft not found' });
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('Error getting draft:', error);
    res.status(500).json({ error: 'Failed to get draft' });
  }
});

// Ticket Drafts - Delete draft
router.delete('/draft/:draft_id', async (req, res) => {
  const { draft_id } = req.params;
  
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const draftPath = path.join(process.cwd(), 'data', 'drafts', `${draft_id}.json`);
    
    try {
      await fs.unlink(draftPath);
      res.json({ success: true, message: 'Draft deleted successfully' });
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.status(404).json({ error: 'Draft not found' });
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});

// Export tickets to CSV
router.get('/export', async (req, res) => {
  const { status, category, priority, date_from, date_to, customer_name } = req.query;
  
  try {
    let query = 'SELECT id, title, description, environment, priority, status, customer_name, tech_name, category, subcategory, ticket_type, assigned_to_admin, created_at, resolved_at FROM tickets WHERE 1=1';
    const params = [];
  
  // Role-based filtering
  if (req.user.role === 'customer') {
    query += ' AND customer_name = ?';
    params.push(req.user.name);
  } else if (req.user.role === 'tech') {
    // Techs can ONLY see technical tickets
    query += " AND ticket_type = 'technical'";
    if (!tech_name && !customer_name) {
      query += ' AND (tech_name = ? OR status IN ("open", "pending_assignment"))';
      params.push(req.user.name);
    }
  }
    
    if (status) {
      if (status === 'open') {
        query += " AND status IN ('open', 'claimed', 'in_progress', 'pending_assignment')";
      } else {
        query += ' AND status = ?';
        params.push(status);
      }
    }
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }
    
    if (customer_name) {
      query += ' AND customer_name = ?';
      params.push(customer_name);
    }
    
    if (date_from) {
      query += ' AND created_at >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND created_at <= ?';
      params.push(date_to);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.query(query, params);
    
    // Generate CSV
    const headers = ['ID', 'Title', 'Description', 'Environment', 'Priority', 'Status', 'Customer', 'Tech', 'Category', 'Subcategory', 'Created', 'Resolved'];
    const csvRows = [headers.join(',')];
    
    for (const row of rows) {
      const values = [
        row.id,
        `"${(row.title || '').replace(/"/g, '""')}"`,
        `"${(row.description || '').replace(/"/g, '""')}"`,
        row.environment,
        row.priority,
        row.status,
        `"${(row.customer_name || '').replace(/"/g, '""')}"`,
        `"${(row.tech_name || '').replace(/"/g, '""')}"`,
        row.category,
        row.subcategory || '',
        row.created_at ? new Date(row.created_at).toISOString() : '',
        row.resolved_at ? new Date(row.resolved_at).toISOString() : ''
      ];
      csvRows.push(values.join(','));
    }
    
    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=tickets_export_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting tickets:', error);
    res.status(500).json({ error: 'Failed to export tickets' });
  }
});

export default router;
