import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

// Simple encryption simulation (in production, use proper encryption)
const encryptMessage = (text) => Buffer.from(text).toString('base64');
const decryptMessage = (encrypted) => Buffer.from(encrypted, 'base64').toString('utf-8');

// Get messages for a ticket (encrypted)
router.get('/:ticketId', async (req, res) => {
  const { ticketId } = req.params;
  const { user_name, user_role } = req.query;

  try {
    // First verify the user has access to this ticket
    const [ticketRows] = await pool.query(
      'SELECT * FROM tickets WHERE id = ?',
      [ticketId]
    );

    if (ticketRows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketRows[0];
    
    // Check if user is authorized (customer who created, tech assigned, or admin)
    const isAuthorized = 
      ticket.customer_name === user_name || 
      ticket.tech_name === user_name || 
      user_role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to view this discussion' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC',
      [ticketId]
    );

    // Decrypt messages for authorized users
    const decryptedMessages = rows.map(msg => ({
      ...msg,
      content: msg.encrypted ? decryptMessage(msg.content) : msg.content
    }));

    res.json(decryptedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message (encrypted)
router.post('/', async (req, res) => {
  const { ticket_id, sender_name, sender_role, content, message_type = 'text' } = req.body;

  if (!ticket_id || !sender_name || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify authorization
    const [ticketRows] = await pool.query(
      'SELECT * FROM tickets WHERE id = ?',
      [ticket_id]
    );

    if (ticketRows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketRows[0];
    const isAuthorized = 
      ticket.customer_name === sender_name || 
      ticket.tech_name === sender_name || 
      sender_role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to post messages' });
    }

    // Encrypt the message
    const encryptedContent = encryptMessage(content);

    const [result] = await pool.query(
      `INSERT INTO ticket_messages (ticket_id, sender_name, sender_role, content, message_type, encrypted)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [ticket_id, sender_name, sender_role, encryptedContent, message_type]
    );

    // Create notification for the other party
    const notifyUser = ticket.customer_name === sender_name ? ticket.tech_name : ticket.customer_name;
    if (notifyUser) {
      await pool.query(
        `INSERT INTO notifications (user_name, type, title, message, related_ticket_id, related_user)
         VALUES (?, 'new_message', ?, ?, ?, ?)`,
        [notifyUser, 'New message on ticket', `${sender_name} sent a message on "${ticket.title}"`, ticket_id, sender_name]
      );
    }

    const [rows] = await pool.query('SELECT * FROM ticket_messages WHERE id = ?', [result.insertId]);
    const msg = rows[0];
    
    res.status(201).json({
      ...msg,
      content: decryptMessage(msg.content)
    });
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

// Add system message
router.post('/system', async (req, res) => {
  const { ticket_id, action, actor_name, actor_role } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO ticket_messages (ticket_id, sender_name, sender_role, content, message_type, encrypted)
       VALUES (?, 'System', 'system', ?, 'status_change', FALSE)`,
      [ticket_id, action]
    );

    const [rows] = await pool.query('SELECT * FROM ticket_messages WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error adding system message:', error);
    res.status(500).json({ error: 'Failed to add system message' });
  }
});

export default router;
