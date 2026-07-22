import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

// Get all contacts
router.get('/contacts', async (req, res) => {
  const { type, search } = req.query;

  let query = 'SELECT * FROM crm_contacts WHERE 1=1';
  const params = [];

  if (type) {
    query += ' AND user_type = ?';
    params.push(type);
  }
  if (search) {
    query += ' AND (user_name LIKE ? OR company LIKE ? OR email LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY updated_at DESC';

  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Get single contact
router.get('/contacts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM crm_contacts WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// Create contact
router.post('/contacts', async (req, res) => {
  const { user_name, user_type, company, email, phone, address, tags, notes } = req.body;

  if (!user_name || !user_type) {
    return res.status(400).json({ error: 'user_name and user_type are required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO crm_contacts (user_name, user_type, company, email, phone, address, tags, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_name, user_type, company || null, email || null, phone || null, address || null, JSON.stringify(tags || []), notes || null]
    );

    const [rows] = await pool.query('SELECT * FROM crm_contacts WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// Update contact
router.patch('/contacts/:id', async (req, res) => {
  const { id } = req.params;
  const { company, email, phone, address, tags, notes } = req.body;

  const updates = [];
  const params = [];

  if (company !== undefined) { updates.push('company = ?'); params.push(company); }
  if (email !== undefined) { updates.push('email = ?'); params.push(email); }
  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
  if (address !== undefined) { updates.push('address = ?'); params.push(address); }
  if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }

  params.push(id);

  try {
    await pool.query(`UPDATE crm_contacts SET ${updates.join(', ')} WHERE id = ?`, params);
    const [rows] = await pool.query('SELECT * FROM crm_contacts WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Get contact interactions
router.get('/contacts/:id/interactions', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM crm_interactions WHERE contact_id = ? ORDER BY created_at DESC',
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({ error: 'Failed to fetch interactions' });
  }
});

// Create interaction
router.post('/interactions', async (req, res) => {
  const { contact_id, type, subject, content, created_by } = req.body;

  if (!contact_id || !type) {
    return res.status(400).json({ error: 'contact_id and type are required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO crm_interactions (contact_id, type, subject, content, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [contact_id, type, subject || null, content || null, created_by || null]
    );

    // Update contact's updated_at timestamp
    await pool.query('UPDATE crm_contacts SET updated_at = NOW() WHERE id = ?', [contact_id]);

    const [rows] = await pool.query('SELECT * FROM crm_interactions WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating interaction:', error);
    res.status(500).json({ error: 'Failed to create interaction' });
  }
});

// Get contact stats
router.get('/contacts/:id/stats', async (req, res) => {
  const { id } = req.params;

  try {
    // Get contact
    const [contactRows] = await pool.query('SELECT * FROM crm_contacts WHERE id = ?', [id]);
    if (contactRows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    const contact = contactRows[0];

    // Ticket count
    const [ticketRows] = await pool.query(
      'SELECT COUNT(*) as count FROM tickets WHERE customer_name = ? OR tech_name = ?',
      [contact.user_name, contact.user_name]
    );

    // Payment total
    const [paymentRows] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments 
       WHERE customer_name = ? OR tech_name = ?`,
      [contact.user_name, contact.user_name]
    );

    // Interaction count
    const [interactionRows] = await pool.query(
      'SELECT COUNT(*) as count FROM crm_interactions WHERE contact_id = ?',
      [id]
    );

    // Average rating (for techs)
    let avgRating = null;
    if (contact.user_type === 'tech') {
      const [ratingRows] = await pool.query(
        'SELECT AVG(rating) as avg FROM ratings WHERE tech_name = ?',
        [contact.user_name]
      );
      avgRating = ratingRows[0].avg ? parseFloat(ratingRows[0].avg.toFixed(1)) : null;
    }

    res.json({
      ticketCount: ticketRows[0].count,
      lifetimeValue: parseFloat(contact.lifetime_value) || 0,
      totalPayments: parseFloat(paymentRows[0].total) || 0,
      interactionCount: interactionRows[0].count,
      averageRating: avgRating
    });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({ error: 'Failed to fetch contact stats' });
  }
});

export default router;
