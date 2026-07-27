/**
 * Expert Routes
 * API endpoints for expert profile management
 */

import { Router } from 'express';
import { expertService } from '../services/expertService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getAllTechnologies, getTechnologiesByCategory, EXPERTISE_LEVELS, TECH_STACK } from '../constants/techStack.js';

const router = Router();

/**
 * GET /api/expert/technologies
 * Get all available technologies for selection
 */
router.get('/technologies', asyncHandler(async (req, res) => {
  const { category } = req.query;
  
  if (category) {
    const technologies = getTechnologiesByCategory(category);
    return res.json({ 
      success: true, 
      technologies,
      categories: Object.keys(require('../constants/techStack.js').TECH_STACK)
    });
  }
  
  const technologies = getAllTechnologies();
  const categories = Object.entries(TECH_STACK).map(([id, cat]) => ({
    id,
    name: cat.name,
    icon: cat.icon,
    count: Object.keys(cat.technologies).length
  }));
  
  res.json({ 
    success: true, 
    technologies,
    categories,
    expertiseLevels: Object.entries(EXPERTISE_LEVELS).map(([id, level]) => ({
      id,
      name: level.name,
      minYears: level.minYears
    }))
  });
}));

/**
 * GET /api/expert/profile
 * Get current expert's profile
 */
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  if (req.user.role !== 'tech' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Expert role required.' });
  }
  
  const profile = await expertService.getExpertProfile(req.user.id);
  
  if (!profile) {
    return res.status(404).json({ error: 'Expert profile not found' });
  }
  
  res.json({ success: true, profile });
}));

/**
 * GET /api/expert/profile/:userId
 * Get specific expert's public profile
 */
router.get('/profile/:userId', asyncHandler(async (req, res) => {
  const profile = await expertService.getExpertProfile(req.params.userId);
  
  if (!profile) {
    return res.status(404).json({ error: 'Expert profile not found' });
  }
  
  // Return limited public info
  res.json({
    success: true,
    profile: {
      user: {
        id: profile.user.id,
        name: profile.user.name,
        createdAt: profile.user.createdAt
      },
      skills: profile.skills.filter(s => s.isVerified),
      overallStats: profile.overallStats
    }
  });
}));

/**
 * PUT /api/expert/skills
 * Update expert's skills
 */
router.put('/skills', authenticate, asyncHandler(async (req, res) => {
  if (req.user.role !== 'tech' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Expert role required.' });
  }
  
  const { skills } = req.body;
  
  if (!Array.isArray(skills)) {
    return res.status(400).json({ error: 'Skills must be an array' });
  }
  
  // Validate skills structure
  for (const skill of skills) {
    if (!skill.techId) {
      return res.status(400).json({ error: 'techId is required for each skill' });
    }
    if (!skill.expertiseLevel) {
      return res.status(400).json({ error: 'expertiseLevel is required for each skill' });
    }
  }
  
  const result = await expertService.updateExpertSkills(req.user.id, skills);
  
  res.json({ 
    success: true, 
    message: `Updated ${result.skillsCount} skills successfully`,
    skillsCount: result.skillsCount
  });
}));

/**
 * GET /api/expert/qualified
 * Get qualified experts for a ticket category
 */
router.get('/qualified', asyncHandler(async (req, res) => {
  const { category, complexity } = req.query;
  
  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }
  
  const experts = await expertService.getQualifiedExperts(category, complexity || 'moderate');
  
  res.json({ success: true, experts });
}));

/**
 * GET /api/expert/eligibility
 * Check current user's eligibility for a ticket
 */
router.get('/eligibility', authenticate, asyncHandler(async (req, res) => {
  if (req.user.role !== 'tech') {
    return res.status(403).json({ error: 'Access denied. Expert role required.' });
  }
  
  const { category, complexity } = req.query;
  
  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }
  
  const eligibility = await expertService.checkExpertEligibility(
    req.user.id, 
    category, 
    complexity || 'moderate'
  );
  
  res.json({ success: true, eligibility });
}));

/**
 * POST /api/expert/claim/:ticketId/check
 * Check if current expert can claim a ticket
 */
router.post('/claim/:ticketId/check', authenticate, asyncHandler(async (req, res) => {
  if (req.user.role !== 'tech') {
    return res.status(403).json({ error: 'Access denied. Expert role required.' });
  }
  
  const { ticketId } = req.params;
  const { category, complexity } = req.body;
  
  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }
  
  const eligibility = await expertService.checkExpertEligibility(
    req.user.id, 
    category, 
    complexity || 'moderate'
  );
  
  // Also get expert profile for display
  const profile = await expertService.getExpertProfile(req.user.id);
  
  res.json({ 
    success: true, 
    canClaim: eligibility.eligible,
    eligibility,
    expertPreview: profile ? {
      name: profile.user.name,
      rating: profile.overallStats.avgRating,
      ticketsResolved: profile.overallStats.totalTicketsResolved
    } : null
  });
}));

/**
 * GET /api/expert/leaderboard
 * Get top experts leaderboard
 */
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const { limit } = req.query;
  
  const leaderboard = await expertService.getLeaderboard(parseInt(limit) || 10);
  
  res.json({ success: true, leaderboard });
}));

/**
 * GET /api/expert/stats
 * Get current expert's stats
 */
router.get('/stats', authenticate, asyncHandler(async (req, res) => {
  if (req.user.role !== 'tech' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Expert role required.' });
  }
  
  const profile = await expertService.getExpertProfile(req.user.id);
  
  if (!profile) {
    return res.status(404).json({ error: 'Expert profile not found' });
  }
  
  res.json({ 
    success: true, 
    stats: profile.overallStats,
    categoryStats: profile.categoryStats
  });
}));

// Admin routes

/**
 * GET /api/expert/admin/pending
 * Get pending skill verifications (admin only)
 */
router.get('/admin/pending', authenticate, requireRole('admin'), asyncHandler(async (req, res) => {
  const pending = await expertService.getPendingVerifications();
  
  res.json({ success: true, pending });
}));

/**
 * POST /api/expert/admin/verify
 * Verify an expert's skill (admin only)
 */
router.post('/admin/verify', authenticate, requireRole('admin'), asyncHandler(async (req, res) => {
  const { userId, techId, verified } = req.body;
  
  if (!userId || !techId) {
    return res.status(400).json({ error: 'userId and techId are required' });
  }
  
  const result = await expertService.verifySkill(userId, techId, verified !== false);
  
  res.json({ 
    success: true, 
    message: verified === false ? 'Skill verification denied' : 'Skill verified successfully'
  });
}));

/**
 * GET /api/expert/admin/experts
 * Get all experts with stats (admin only)
 */
router.get('/admin/experts', authenticate, requireRole('admin'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  const db = require('../db/index.js');
  const [experts] = await db.query(
    `SELECT u.id, u.name, u.email, u.status, u.created_at,
            es.total_tickets_resolved, es.avg_rating, es.last_active,
            COUNT(DISTINCT eskills.id) as skills_count
     FROM users u
     LEFT JOIN expert_stats es ON u.id = es.user_id
     LEFT JOIN expert_skills eskills ON u.id = eskills.user_id
     WHERE u.role = 'tech'
     GROUP BY u.id
     ORDER BY es.avg_rating DESC
     LIMIT ? OFFSET ?`,
    [parseInt(limit), offset]
  );
  
  const [countResult] = await db.query(
    'SELECT COUNT(*) as total FROM users WHERE role = "tech"'
  );
  
  res.json({ 
    success: true, 
    experts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: countResult[0].total,
      pages: Math.ceil(countResult[0].total / parseInt(limit))
    }
  });
}));

export default router;
