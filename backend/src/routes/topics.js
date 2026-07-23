import { Router } from 'express';
import pool from '../db/index.js';
import { routingService } from '../services/routing.js';

const router = Router();

/**
 * GET /api/topics/suggest
 * Get topic suggestions based on historical success rates
 */
router.get('/suggest', async (req, res) => {
  const { limit = 10, category } = req.query;

  try {
    let query = `
      SELECT tag, usage_count, success_rate, avg_resolution_hours, last_used_at
      FROM topic_suggestions
      WHERE usage_count > 0
    `;
    const params = [];

    if (category) {
      // Filter by related category (would need to add category column to topic_suggestions)
      // For now, we'll just return all
    }

    query += ` ORDER BY success_rate DESC, usage_count DESC LIMIT ?`;
    params.push(parseInt(limit));

    const [topics] = await pool.query(query, params);

    res.json({
      topics,
      total: topics.length
    });
  } catch (error) {
    console.error('Error fetching topic suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch topic suggestions' });
  }
});

/**
 * POST /api/topics/suggest
 * Add a new topic suggestion (called after ticket creation)
 */
router.post('/suggest', async (req, res) => {
  const { tag, category, resolution_hours, was_successful } = req.body;

  if (!tag) {
    return res.status(400).json({ error: 'Tag is required' });
  }

  try {
    const normalizedTag = tag.toLowerCase().trim();

    // Check if tag exists
    const [existing] = await pool.query(
      'SELECT * FROM topic_suggestions WHERE tag = ?',
      [normalizedTag]
    );

    if (existing.length > 0) {
      // Update existing
      const current = existing[0];
      const newUsageCount = current.usage_count + 1;
      const totalResolutionHours = (current.avg_resolution_hours * current.usage_count) + (resolution_hours || 0);
      const newAvgResolutionHours = totalResolutionHours / newUsageCount;
      const successIncrement = was_successful ? 1 : 0;
      const newSuccessRate = ((current.success_rate * current.usage_count / 100) + successIncrement) / newUsageCount * 100;

      await pool.query(
        `UPDATE topic_suggestions SET 
         usage_count = ?,
         success_rate = ?,
         avg_resolution_hours = ?,
         last_used_at = NOW()
         WHERE id = ?`,
        [newUsageCount, newSuccessRate, newAvgResolutionHours, current.id]
      );
    } else {
      // Insert new
      await pool.query(
        `INSERT INTO topic_suggestions (tag, usage_count, success_rate, avg_resolution_hours)
         VALUES (?, 1, ?, ?)`,
        [normalizedTag, was_successful ? 100 : 0, resolution_hours || 0]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error creating topic suggestion:', error);
    res.status(500).json({ error: 'Failed to create topic suggestion' });
  }
});

/**
 * GET /api/topics/categories
 * Get hierarchical categories
 */
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT * FROM category_hierarchies 
      WHERE is_active = TRUE 
      ORDER BY sort_order, name
    `);

    // Build hierarchy
    const rootCategories = categories.filter(c => !c.parent_id);
    const childCategories = categories.filter(c => c.parent_id);

    const hierarchy = rootCategories.map(parent => ({
      ...parent,
      children: childCategories.filter(child => child.parent_id === parent.id)
    }));

    res.json(hierarchy);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * POST /api/topics/categories
 * Create a new category
 */
router.post('/categories', async (req, res) => {
  const { name, parent_id, description, icon, color, sort_order } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO category_hierarchies (name, parent_id, description, icon, color, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, parent_id || null, description, icon || 'folder', color || '#FFB454', sort_order || 0]
    );

    const [newCategory] = await pool.query(
      'SELECT * FROM category_hierarchies WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newCategory[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

/**
 * GET /api/topics/expertise/:techName
 * Get agent's expertise profile
 */
router.get('/expertise/:techName', async (req, res) => {
  const { techName } = req.params;

  try {
    const profile = await routingService.getAgentProfile(techName);

    if (!profile) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching expertise:', error);
    res.status(500).json({ error: 'Failed to fetch expertise' });
  }
});

/**
 * POST /api/topics/expertise
 * Add expertise for an agent
 */
router.post('/expertise', async (req, res) => {
  const { tech_name, category, subcategory, level } = req.body;

  if (!tech_name || !category) {
    return res.status(400).json({ error: 'tech_name and category are required' });
  }

  try {
    await routingService.addAgentExpertise(tech_name, category, subcategory, level);

    res.json({ success: true });
  } catch (error) {
    console.error('Error adding expertise:', error);
    res.status(500).json({ error: 'Failed to add expertise' });
  }
});

/**
 * DELETE /api/topics/expertise
 * Remove expertise for an agent
 */
router.delete('/expertise', async (req, res) => {
  const { tech_name, category, subcategory } = req.body;

  if (!tech_name || !category) {
    return res.status(400).json({ error: 'tech_name and category are required' });
  }

  try {
    await routingService.removeAgentExpertise(tech_name, category, subcategory);

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing expertise:', error);
    res.status(500).json({ error: 'Failed to remove expertise' });
  }
});

/**
 * GET /api/topics/route/:ticketId
 * Get top agents for a ticket
 */
router.get('/route/:ticketId', async (req, res) => {
  const { ticketId } = req.params;

  try {
    const [tickets] = await pool.query(
      'SELECT * FROM tickets WHERE id = ?',
      [ticketId]
    );

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
    console.error('Error routing ticket:', error);
    res.status(500).json({ error: 'Failed to route ticket' });
  }
});

export default router;
