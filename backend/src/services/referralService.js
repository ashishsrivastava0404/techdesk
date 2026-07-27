/**
 * Referral Service
 * Handles referral codes, coupons, and affiliate tracking
 */

import db from '../db/index.js';

class ReferralService {
  /**
   * Create a referral code for a user
   */
  async createReferralCode(userId, userName) {
    const code = this.generateReferralCode(userName);
    
    try {
      await db.execute(
        `INSERT INTO referral_codes (user_id, code, created_at)
         VALUES (?, ?, NOW())`,
        [userId, code]
      );
      
      return { 
        success: true, 
        code,
        message: `Your referral code is: ${code}`,
        shareUrl: `${process.env.APP_URL}/signup?ref=${code}`
      };
    } catch (error) {
      console.error('Error creating referral code:', error);
      return { success: false, error: 'Failed to create referral code' };
    }
  }

  /**
   * Generate a unique referral code
   */
  generateReferralCode(userName) {
    const prefix = userName
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 4)
      .toUpperCase();
    
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${random}`;
  }

  /**
   * Validate and get referral code
   */
  async validateReferralCode(code) {
    try {
      const [rows] = await db.query(
        `SELECT rc.*, u.name as referrer_name, u.email as referrer_email
         FROM referral_codes rc
         JOIN users u ON rc.user_id = u.id
         WHERE rc.code = ? AND rc.active = TRUE`,
        [code]
      );

      if (rows.length === 0) {
        return { valid: false, error: 'Invalid or expired referral code' };
      }

      return { 
        valid: true, 
        referrerId: rows[0].user_id,
        referrerName: rows[0].referrer_name
      };
    } catch (error) {
      console.error('Error validating referral code:', error);
      return { valid: false, error: 'Failed to validate code' };
    }
  }

  /**
   * Apply referral bonus to both users
   */
  async applyReferralBonus(referrerId, refereeId, couponCode) {
    const BONUS_CREDITS = 20;
    
    try {
      // Add credits to referrer
      await db.execute(
        `UPDATE users SET credits = credits + ? WHERE id = ?`,
        [BONUS_CREDITS, referrerId]
      );

      // Add credits to referee
      await db.execute(
        `UPDATE users SET credits = credits + ? WHERE id = ?`,
        [BONUS_CREDITS, refereeId]
      );

      // Log the referral
      await db.execute(
        `INSERT INTO referral_transactions 
         (referrer_id, referee_id, coupon_code, bonus_credits, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [referrerId, refereeId, couponCode, BONUS_CREDITS]
      );

      // Update referral code usage
      await db.execute(
        `UPDATE referral_codes 
         SET times_used = times_used + 1 
         WHERE user_id = ? AND code = ?`,
        [referrerId, couponCode]
      );

      return { 
        success: true, 
        bonusCredits: BONUS_CREDITS,
        message: `Both users received ${BONUS_CREDITS} credits!`
      };
    } catch (error) {
      console.error('Error applying referral bonus:', error);
      return { success: false, error: 'Failed to apply bonus' };
    }
  }

  /**
   * Get referral statistics for a user
   */
  async getReferralStats(userId) {
    try {
      const [stats] = await db.query(
        `SELECT 
           COUNT(*) as total_referrals,
           SUM(CASE WHEN rt.status = 'completed' THEN 1 ELSE 0 END) as successful_referrals,
           SUM(bonus_credits) as total_credits_earned
         FROM referral_transactions rt
         WHERE rt.referrer_id = ?`,
        [userId]
      );

      const [recentReferrals] = await db.query(
        `SELECT rt.*, u.name as referee_name, u.email as referee_email
         FROM referral_transactions rt
         JOIN users u ON rt.referee_id = u.id
         WHERE rt.referrer_id = ?
         ORDER BY rt.created_at DESC
         LIMIT 10`,
        [userId]
      );

      return {
        totalReferrals: stats[0]?.total_referrals || 0,
        successfulReferrals: stats[0]?.successful_referrals || 0,
        totalCreditsEarned: stats[0]?.total_credits_earned || 0,
        recentReferrals
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      return null;
    }
  }

  /**
   * Apply a coupon code
   */
  async applyCoupon(code, userId) {
    const COUPONS = {
      'WELCOME50': { type: 'percent', value: 50, duration: 1, maxUses: 1 },
      'REFER20': { type: 'credit', value: 20, forBoth: true },
      'LAUNCH2024': { type: 'percent', value: 100, duration: 3, maxUses: 1000 },
      'SOCIAL10': { type: 'percent', value: 10, duration: null },
      'REDDIT20': { type: 'percent', value: 20, duration: null }
    };

    const coupon = COUPONS[code.toUpperCase()];
    
    if (!coupon) {
      return { success: false, error: 'Invalid coupon code' };
    }

    try {
      // Check if already used
      const [existing] = await db.query(
        `SELECT * FROM used_coupons WHERE code = ? AND user_id = ?`,
        [code.toUpperCase(), userId]
      );

      if (existing.length > 0) {
        return { success: false, error: 'Coupon already used' };
      }

      // Mark as used
      await db.execute(
        `INSERT INTO used_coupons (code, user_id, used_at) VALUES (?, ?, NOW())`,
        [code.toUpperCase(), userId]
      );

      return {
        success: true,
        coupon: {
          type: coupon.type,
          value: coupon.value,
          duration: coupon.duration,
          message: this.getCouponMessage(coupon)
        }
      };
    } catch (error) {
      console.error('Error applying coupon:', error);
      return { success: false, error: 'Failed to apply coupon' };
    }
  }

  /**
   * Get user-friendly coupon message
   */
  getCouponMessage(coupon) {
    if (coupon.type === 'percent') {
      if (coupon.value === 100) {
        return `Free ${coupon.duration} months!`;
      }
      return `${coupon.value}% off your subscription`;
    }
    if (coupon.type === 'credit') {
      return `$${coupon.value} credits added!`;
    }
    return 'Discount applied!';
  }
}

export const referralService = new ReferralService();
export default referralService;
