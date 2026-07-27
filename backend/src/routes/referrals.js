/**
 * Referral Routes
 * API endpoints for referral codes, coupons, and tracking
 */

import { Router } from 'express';
import { referralService } from '../services/referralService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/referrals/code
 * Get current user's referral code
 */
router.get('/code', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const result = await referralService.createReferralCode(userId, req.user.name);
  
  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result);
}));

/**
 * GET /api/referrals/stats
 * Get referral statistics for current user
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const stats = await referralService.getReferralStats(userId);
  
  if (!stats) {
    return res.status(500).json({ error: 'Failed to get stats' });
  }

  res.json(stats);
}));

/**
 * POST /api/referrals/apply
 * Apply a coupon code
 */
router.post('/apply', asyncHandler(async (req, res) => {
  const { code } = req.body;
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!code) {
    return res.status(400).json({ error: 'Coupon code required' });
  }

  const result = await referralService.applyCoupon(code, userId);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
}));

/**
 * GET /api/referrals/validate/:code
 * Validate a referral code
 */
router.get('/validate/:code', asyncHandler(async (req, res) => {
  const { code } = req.params;
  
  const result = await referralService.validateReferralCode(code);
  
  res.json(result);
}));

/**
 * POST /api/referrals/apply-bonus
 * Apply referral bonus (admin only or after successful signup)
 */
router.post('/apply-bonus', asyncHandler(async (req, res) => {
  const { referrerId, refereeId, couponCode } = req.body;
  
  if (!referrerId || !refereeId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = await referralService.applyReferralBonus(
    referrerId, 
    refereeId, 
    couponCode
  );
  
  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result);
}));

/**
 * GET /api/referrals/coupons
 * List available coupon codes (public)
 */
router.get('/coupons', (req, res) => {
  res.json({
    coupons: [
      {
        code: 'WELCOME50',
        description: '50% off your first month',
        type: 'percent',
        value: 50,
        terms: 'New users only, one-time use'
      },
      {
        code: 'LAUNCH2024',
        description: '3 months free',
        type: 'percent',
        value: 100,
        terms: 'First 1000 users only'
      },
      {
        code: 'SOCIAL10',
        description: '10% off forever',
        type: 'percent',
        value: 10,
        terms: 'Follow us on social media'
      }
    ]
  });
});

export default router;
