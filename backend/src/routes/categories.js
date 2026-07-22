import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

// Get all categories
router.get('/', async (req, res) => {
  const { active_only = 'true' } = req.query;

  let query = 'SELECT * FROM ticket_categories';
  if (active_only === 'true') {
    query += ' WHERE is_active = TRUE';
  }
  query += ' ORDER BY sort_order ASC';

  try {
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get templates
router.get('/templates', async (req, res) => {
  const { category } = req.query;

  let query = 'SELECT * FROM issue_templates WHERE is_active = TRUE';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY use_count DESC, name ASC';

  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get single template
router.get('/templates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM issue_templates WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Use template (increments use count)
router.post('/templates/:id/use', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'UPDATE issue_templates SET use_count = use_count + 1 WHERE id = ?',
      [id]
    );
    const [rows] = await pool.query('SELECT * FROM issue_templates WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to use template' });
  }
});

// Create category (admin only)
router.post('/', async (req, res) => {
  const { name, description, icon, color, sort_order } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO ticket_categories (name, description, icon, color, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [name, description || null, icon || 'folder', color || '#FFB454', sort_order || 0]
    );

    const [rows] = await pool.query('SELECT * FROM ticket_categories WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Create template (admin only)
router.post('/templates', async (req, res) => {
  const { name, category, description, template_content, variables } = req.body;

  if (!name || !template_content) {
    return res.status(400).json({ error: 'Name and content are required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO issue_templates (name, category, description, template_content, variables)
       VALUES (?, ?, ?, ?, ?)`,
      [name, category || null, description || null, template_content, JSON.stringify(variables || [])]
    );

    const [rows] = await pool.query('SELECT * FROM issue_templates WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update category
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, icon, color, sort_order, is_active } = req.body;

  const updates = [];
  const params = [];

  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (icon !== undefined) { updates.push('icon = ?'); params.push(icon); }
  if (color !== undefined) { updates.push('color = ?'); params.push(color); }
  if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }
  if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }

  params.push(id);

  try {
    await pool.query(`UPDATE ticket_categories SET ${updates.join(', ')} WHERE id = ?`, params);
    const [rows] = await pool.query('SELECT * FROM ticket_categories WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

export default router;
