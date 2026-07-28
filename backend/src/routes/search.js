import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

// Get available filters for search
router.get('/filters', async (req, res) => {
  try {
    const filters = {
      categories: [],
      subcategories: [],
      priorities: [],
      statuses: [],
      environments: [],
      techs: [],
      customers: [],
      date_ranges: [
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'last_7_days', label: 'Last 7 days' },
        { value: 'last_30_days', label: 'Last 30 days' },
        { value: 'last_90_days', label: 'Last 90 days' },
        { value: 'this_month', label: 'This month' },
        { value: 'last_month', label: 'Last month' },
        { value: 'this_year', label: 'This year' },
        { value: 'custom', label: 'Custom range' }
      ],
      tags: []
    };

    // Get categories from tickets
    const [categories] = await pool.query(
      'SELECT DISTINCT category FROM tickets WHERE category IS NOT NULL ORDER BY category'
    );
    filters.categories = categories.map(c => c.category);

    // Get subcategories from tickets
    const [subcategories] = await pool.query(
      'SELECT DISTINCT subcategory FROM tickets WHERE subcategory IS NOT NULL AND subcategory != "" ORDER BY subcategory'
    );
    filters.subcategories = subcategories.map(s => s.subcategory);

    // Get priorities
    const [priorities] = await pool.query(
      'SELECT DISTINCT priority FROM tickets WHERE priority IS NOT NULL ORDER BY FIELD(priority, "critical", "urgent", "high", "normal", "low")'
    );
    filters.priorities = priorities.map(p => p.priority);

    // Get statuses
    const [statuses] = await pool.query(
      'SELECT DISTINCT status FROM tickets WHERE status IS NOT NULL ORDER BY FIELD(status, "open", "pending_assignment", "claimed", "in_progress", "resolved", "closed", "rejected")'
    );
    filters.statuses = statuses.map(s => s.status);

    // Get environments
    const [environments] = await pool.query(
      'SELECT DISTINCT environment FROM tickets WHERE environment IS NOT NULL ORDER BY environment'
    );
    filters.environments = environments.map(e => e.environment);

    // Get techs
    const [techs] = await pool.query(
      "SELECT DISTINCT tech_name FROM tickets WHERE tech_name IS NOT NULL AND tech_name != '' ORDER BY tech_name"
    );
    filters.techs = techs.map(t => t.tech_name);

    // Get customers
    const [customers] = await pool.query(
      'SELECT DISTINCT customer_name FROM tickets WHERE customer_name IS NOT NULL ORDER BY customer_name'
    );
    filters.customers = customers.map(c => c.customer_name);

    // Get all unique tags from tickets
    const [tagRows] = await pool.query('SELECT tags FROM tickets WHERE tags IS NOT NULL');
    const allTags = new Set();
    for (const row of tagRows) {
      try {
        const tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;
        if (Array.isArray(tags)) {
          tags.forEach(tag => allTags.add(tag));
        }
      } catch {
        // Ignore parse errors
      }
    }
    filters.tags = Array.from(allTags).sort();

    res.json(filters);
  } catch (error) {
    console.error('Error fetching search filters:', error);
    res.status(500).json({ error: 'Failed to fetch search filters' });
  }
});

// Advanced search endpoint
router.get('/tickets', async (req, res) => {
  try {
    const {
      q, // General search query
      status,
      priority,
      category,
      subcategory,
      environment,
      tech_name,
      customer_name,
      date_from,
      date_to,
      date_range, // Predefined range
      tags,
      sort_by = 'created_at',
      sort_order = 'DESC',
      page = 1,
      limit = 50
    } = req.query;

    let query = 'SELECT SQL_CALC_FOUND_ROWS * FROM tickets WHERE 1=1';
    const params = [];

    // General search
    if (q) {
      query += ' AND (title LIKE ? OR description LIKE ? OR subject LIKE ? OR customer_name LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Status filter
    if (status) {
      if (status === 'open') {
        query += " AND status IN ('open', 'claimed', 'in_progress', 'pending_assignment')";
      } else if (status === 'closed') {
        query += " AND status IN ('resolved', 'closed', 'rejected')";
      } else {
        query += ' AND status = ?';
        params.push(status);
      }
    }

    // Priority filter
    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    // Category filter
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    // Subcategory filter
    if (subcategory) {
      query += ' AND subcategory = ?';
      params.push(subcategory);
    }

    // Environment filter
    if (environment) {
      query += ' AND environment = ?';
      params.push(environment);
    }

    // Tech filter
    if (tech_name) {
      query += ' AND tech_name = ?';
      params.push(tech_name);
    }

    // Customer filter
    if (customer_name) {
      query += ' AND customer_name = ?';
      params.push(customer_name);
    }

    // Date range filter
    let startDate = date_from;
    let endDate = date_to;

    if (date_range && !date_from && !date_to) {
      const now = new Date();
      endDate = now.toISOString().split('T')[0];

      switch (date_range) {
        case 'today':
          startDate = now.toISOString().split('T')[0];
          break;
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          startDate = yesterday.toISOString().split('T')[0];
          endDate = startDate;
          break;
        case 'last_7_days':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          startDate = weekAgo.toISOString().split('T')[0];
          break;
        case 'last_30_days':
          const monthAgo = new Date(now);
          monthAgo.setDate(monthAgo.getDate() - 30);
          startDate = monthAgo.toISOString().split('T')[0];
          break;
        case 'last_90_days':
          const quarterAgo = new Date(now);
          quarterAgo.setDate(quarterAgo.getDate() - 90);
          startDate = quarterAgo.toISOString().split('T')[0];
          break;
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          break;
        case 'last_month':
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          startDate = lastMonthStart.toISOString().split('T')[0];
          endDate = lastMonthEnd.toISOString().split('T')[0];
          break;
        case 'this_year':
          startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
          break;
      }
    }

    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(`${endDate} 23:59:59`);
    }

    // Tags filter
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim());
      query += ' AND (';
      const tagConditions = tagList.map(() => 'tags LIKE ?');
      query += tagConditions.join(' OR ');
      query += ')';
      params.push(...tagList.map(t => `%${t}%`));
    }

    // Sorting
    const validSortFields = ['created_at', 'updated_at', 'priority', 'status', 'title', 'customer_name'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY FIELD(priority, "critical", "urgent", "high", "normal", "low"), ${sortField} ${sortDirection}`;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(query, params);

    // Get total count
    const [[{ 'FOUND_ROWS()': total }]] = await pool.query('SELECT FOUND_ROWS()');

    res.json({
      tickets: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error searching tickets:', error);
    res.status(500).json({ error: 'Failed to search tickets' });
  }
});

export default router;
