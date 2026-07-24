/**
 * Ticket Metadata Routes
 * 
 * Provides category hierarchy and other ticket metadata.
 */

import { Router } from 'express';
import { 
  TICKET_CATEGORIES, 
  getCategories, 
  getCategory,
  getFullPath,
  validateCategoryPath 
} from '../constants/ticketCategories.js';
import { getCache, setCache } from '../services/redisCache.js';

const router = Router();

// Cache TTL for category data (1 hour)
const CATEGORIES_CACHE_TTL = 3600;

/**
 * GET /api/categories
 * Get all ticket categories with hierarchy
 */
router.get('/', async (req, res) => {
  const { flat } = req.query;
  
  // Try to get from cache first
  const cacheKey = `categories:${flat || 'nested'}`;
  const cached = await getCache(cacheKey);
  
  if (cached) {
    return res.json({
      success: true,
      data: cached,
      fromCache: true
    });
  }

  try {
    let data;
    
    if (flat === 'true') {
      // Flat format: just categories list
      data = {
        categories: getCategories()
      };
    } else {
      // Full hierarchy format (default)
      data = TICKET_CATEGORIES;
    }

    // Cache the result
    await setCache(cacheKey, data, CATEGORIES_CACHE_TTL);

    res.json({
      success: true,
      data,
      fromCache: false
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch categories' 
    });
  }
});

/**
 * GET /api/categories/:categoryId
 * Get a specific category with its subcategories
 */
router.get('/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  
  try {
    const category = getCategory(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category'
    });
  }
});

/**
 * GET /api/categories/:categoryId/:subcategoryId
 * Get subcategory topics
 */
router.get('/:categoryId/:subcategoryId', async (req, res) => {
  const { categoryId, subcategoryId } = req.params;
  
  try {
    const category = TICKET_CATEGORIES[categoryId];
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    const subcategory = category.subcategories?.[subcategoryId];
    
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        error: 'Subcategory not found'
      });
    }

    res.json({
      success: true,
      data: {
        category: { id: category.id, name: category.name, icon: category.icon },
        subcategory: { id: subcategory.id, name: subcategory.name },
        topics: Object.values(subcategory.topics || {})
      }
    });
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subcategory'
    });
  }
});

/**
 * POST /api/categories/validate
 * Validate a complete category path
 */
router.post('/validate', async (req, res) => {
  const { category, subcategory, topic } = req.body;
  
  try {
    const isValid = validateCategoryPath(category, subcategory, topic);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category path'
      });
    }

    const path = getFullPath(category, subcategory, topic);

    res.json({
      success: true,
      valid: true,
      data: path
    });
  } catch (error) {
    console.error('Error validating category path:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate category path'
    });
  }
});

/**
 * GET /api/categories/search
 * Search categories by keyword
 */
router.get('/search/:query', async (req, res) => {
  const { query } = req.params;
  const searchTerm = query.toLowerCase();
  
  try {
    const results = [];
    
    // Search through all categories, subcategories, and topics
    for (const [catId, category] of Object.entries(TICKET_CATEGORIES)) {
      // Check category name
      if (category.name.toLowerCase().includes(searchTerm)) {
        results.push({
          type: 'category',
          id: catId,
          name: category.name,
          path: [category.name]
        });
      }
      
      // Check subcategories
      for (const [subId, subcategory] of Object.entries(category.subcategories || {})) {
        if (subcategory.name.toLowerCase().includes(searchTerm)) {
          results.push({
            type: 'subcategory',
            id: subId,
            name: subcategory.name,
            category: catId,
            path: [category.name, subcategory.name]
          });
        }
        
        // Check topics
        for (const [topicId, topic] of Object.entries(subcategory.topics || {})) {
          if (topic.name.toLowerCase().includes(searchTerm)) {
            results.push({
              type: 'topic',
              id: topicId,
              name: topic.name,
              category: catId,
              subcategory: subId,
              path: [category.name, subcategory.name, topic.name]
            });
          }
        }
      }
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error searching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search categories'
    });
  }
});

export default router;
