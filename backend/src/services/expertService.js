/**
 * Expert Service
 * 
 * Handles expert profile management, skill tracking, and eligibility verification.
 */

import db from '../db/index.js';
import { getTechnology, getAllTechnologies, EXPERTISE_LEVELS, COMPLEXITY_TIERS } from '../constants/techStack.js';

/**
 * ExpertService class
 */
class ExpertService {
  /**
   * Get expert profile by user ID
   */
  async getExpertProfile(userId) {
    try {
      // Get user basic info
      const [users] = await db.query(
        'SELECT id, name, email, role, status, created_at FROM users WHERE id = ? AND role = "tech"',
        [userId]
      );
      
      if (users.length === 0) {
        return null;
      }
      
      const user = users[0];
      
      // Get expert skills
      const [skills] = await db.query(
        `SELECT es.*, ts.name as tech_name, ts.category as tech_category, ts.certified
         FROM expert_skills es
         JOIN tech_stack ts ON es.tech_id = ts.id
         WHERE es.user_id = ?`,
        [userId]
      );
      
      // Get expert stats
      const [stats] = await db.query(
        'SELECT * FROM expert_stats WHERE user_id = ?',
        [userId]
      );
      
      // Get category-specific stats
      const [categoryStats] = await db.query(
        `SELECT category, tickets_resolved, total_rating, avg_rating
         FROM expert_category_stats
         WHERE user_id = ?`,
        [userId]
      );
      
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          createdAt: user.created_at
        },
        skills: skills.map(s => ({
          techId: s.tech_id,
          techName: s.tech_name,
          category: s.tech_category,
          expertiseLevel: s.expertise_level,
          yearsExperience: s.years_experience,
          isVerified: s.is_verified,
          isCertified: s.certified,
          updatedAt: s.updated_at
        })),
        overallStats: stats.length > 0 ? {
          totalTicketsResolved: stats[0].total_tickets_resolved,
          totalRating: stats[0].total_rating,
          avgRating: stats[0].avg_rating,
          avgResolutionTime: stats[0].avg_resolution_time,
          successRate: stats[0].success_rate,
          lastActive: stats[0].last_active
        } : {
          totalTicketsResolved: 0,
          totalRating: 0,
          avgRating: 0,
          avgResolutionTime: 0,
          successRate: 0,
          lastActive: null
        },
        categoryStats: categoryStats.reduce((acc, stat) => {
          acc[stat.category] = {
            ticketsResolved: stat.tickets_resolved,
            totalRating: stat.total_rating,
            avgRating: stat.avg_rating
          };
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting expert profile:', error);
      throw error;
    }
  }

  /**
   * Update expert skills
   */
  async updateExpertSkills(userId, skills) {
    try {
      // Validate all tech IDs exist
      const allTechs = getAllTechnologies().map(t => t.id);
      for (const skill of skills) {
        if (!allTechs.includes(skill.techId)) {
          throw new Error(`Invalid technology: ${skill.techId}`);
        }
        
        // Check if certification is required but not obtained
        const tech = getTechnology(skill.techId);
        if (tech?.certified && skill.expertiseLevel === 'certified' && !skill.certificationProof) {
          throw new Error(`Certification proof required for ${tech.name}`);
        }
      }
      
      // Start transaction
      const connection = await db.getConnection();
      await connection.beginTransaction();
      
      try {
        // Delete existing skills
        await connection.query('DELETE FROM expert_skills WHERE user_id = ?', [userId]);
        
        // Insert new skills
        for (const skill of skills) {
          await connection.query(
            `INSERT INTO expert_skills 
             (user_id, tech_id, expertise_level, years_experience, certification_proof, is_verified, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
              userId,
              skill.techId,
              skill.expertiseLevel,
              skill.yearsExperience || 0,
              skill.certificationProof || null,
              skill.expertiseLevel === 'certified' ? 0 : 1 // Auto-verify non-certified levels
            ]
          );
        }
        
        await connection.commit();
        
        return { success: true, skillsCount: skills.length };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error updating expert skills:', error);
      throw error;
    }
  }

  /**
   * Get qualified experts for a ticket
   */
  async getQualifiedExperts(ticketCategory, complexityTier = 'moderate') {
    try {
      const tier = COMPLEXITY_TIERS[complexityTier] || COMPLEXITY_TIERS.moderate;
      
      // Map ticket category to tech categories for matching
      const categoryMapping = {
        hardware: ['tools'],
        software: ['frontend', 'backend', 'languages'],
        network: ['cloud', 'security'],
        database: ['databases'],
        security: ['security'],
        mobile: ['mobile'],
        data: ['data'],
        default: ['frontend', 'backend', 'languages']
      };
      
      const techCategories = categoryMapping[ticketCategory] || categoryMapping.default;
      
      // Get experts with matching skills and meeting criteria
      const [experts] = await db.query(
        `SELECT DISTINCT 
           u.id, u.name, u.email,
           eskills.expertise_level,
           eskills.years_experience,
           es.avg_rating,
           es.total_tickets_resolved,
           es.last_active,
           CASE WHEN es.avg_rating >= ? THEN 1 ELSE 0 END as meets_rating,
           CASE WHEN eskills.years_experience >= ? THEN 1 ELSE 0 END as meets_experience
         FROM users u
         INNER JOIN expert_skills eskills ON u.id = eskills.user_id
         INNER JOIN tech_stack ts ON eskills.tech_id = ts.id
         INNER JOIN expert_stats es ON u.id = es.user_id
         WHERE u.role = 'tech'
           AND u.status = 'active'
           AND ts.category IN (?)
           AND es.avg_rating >= ?
           AND eskills.is_verified = 1
         ORDER BY es.avg_rating DESC, es.total_tickets_resolved DESC
         LIMIT 10`,
        [tier.maxRating - 0.5, tier.maxYears, techCategories, tier.maxRating - 1]
      );
      
      return experts.map(expert => ({
        id: expert.id,
        name: expert.name,
        email: expert.email,
        expertiseLevel: expert.expertise_level,
        yearsExperience: expert.years_experience,
        rating: expert.avg_rating,
        ticketsResolved: expert.total_tickets_resolved,
        lastActive: expert.last_active,
        meetsRating: expert.meets_rating === 1,
        meetsExperience: expert.meets_experience === 1
      }));
    } catch (error) {
      console.error('Error getting qualified experts:', error);
      throw error;
    }
  }

  /**
   * Check expert eligibility for a ticket
   */
  async checkExpertEligibility(userId, ticketCategory, complexityTier = 'moderate') {
    try {
      const tier = COMPLEXITY_TIERS[complexityTier] || COMPLEXITY_TIERS.moderate;
      
      // Get expert stats
      const [stats] = await db.query(
        'SELECT avg_rating, total_tickets_resolved FROM expert_stats WHERE user_id = ?',
        [userId]
      );
      
      if (stats.length === 0) {
        return {
          eligible: false,
          reason: 'Expert profile not found',
          ratingRequired: tier.maxRating,
          ratingCurrent: 0
        };
      }
      
      const expert = stats[0];
      
      // Check rating
      if (expert.avg_rating < tier.maxRating - 1) {
        return {
          eligible: false,
          reason: `Rating ${expert.avg_rating.toFixed(1)} below minimum ${tier.maxRating - 1}`,
          ratingRequired: tier.maxRating - 1,
          ratingCurrent: expert.avg_rating
        };
      }
      
      // Get experience from skills
      const [skills] = await db.query(
        `SELECT MAX(years_experience) as max_experience 
         FROM expert_skills 
         WHERE user_id = ? AND is_verified = 1`,
        [userId]
      );
      
      const maxExperience = skills[0]?.max_experience || 0;
      
      if (maxExperience < tier.maxYears - 1) {
        return {
          eligible: false,
          reason: `Experience ${maxExperience} years below minimum ${tier.maxYears - 1}`,
          experienceRequired: tier.maxYears - 1,
          experienceCurrent: maxExperience
        };
      }
      
      return {
        eligible: true,
        ratingRequired: tier.maxRating - 1,
        ratingCurrent: expert.avg_rating,
        experienceRequired: tier.maxYears - 1,
        experienceCurrent: maxExperience
      };
    } catch (error) {
      console.error('Error checking expert eligibility:', error);
      throw error;
    }
  }

  /**
   * Update expert stats on ticket resolution
   */
  async updateStatsOnResolution(userId, ticketCategory, rating, resolutionTime) {
    try {
      const connection = await db.getConnection();
      await connection.beginTransaction();
      
      try {
        // Update overall stats
        await connection.query(
          `INSERT INTO expert_stats (user_id, total_tickets_resolved, total_rating, avg_rating, avg_resolution_time, last_active)
           VALUES (?, 1, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
             total_tickets_resolved = total_tickets_resolved + 1,
             total_rating = total_rating + ?,
             avg_rating = (total_rating + ?) / (total_tickets_resolved + 1),
             avg_resolution_time = (avg_resolution_time * total_tickets_resolved + ?) / (total_tickets_resolved + 1),
             last_active = NOW()`,
          [userId, rating, rating, resolutionTime, rating, rating, resolutionTime]
        );
        
        // Update category stats
        await connection.query(
          `INSERT INTO expert_category_stats (user_id, category, tickets_resolved, total_rating, avg_rating)
           VALUES (?, ?, 1, ?, ?)
           ON DUPLICATE KEY UPDATE
             tickets_resolved = tickets_resolved + 1,
             total_rating = total_rating + ?,
             avg_rating = (total_rating + ?) / (tickets_resolved + 1)`,
          [userId, ticketCategory, rating, rating, rating, rating]
        );
        
        await connection.commit();
        
        return { success: true };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error updating expert stats:', error);
      throw error;
    }
  }

  /**
   * Get expert leaderboard
   */
  async getLeaderboard(limit = 10) {
    try {
      const [experts] = await db.query(
        `SELECT 
           u.id, u.name, u.email,
           es.total_tickets_resolved,
           es.avg_rating,
           es.avg_resolution_time,
           COUNT(DISTINCT eskills.tech_id) as skills_count
         FROM users u
         INNER JOIN expert_stats es ON u.id = es.user_id
         INNER JOIN expert_skills eskills ON u.id = eskills.user_id AND eskills.is_verified = 1
         WHERE u.role = 'tech' AND u.status = 'active'
         GROUP BY u.id
         ORDER BY es.avg_rating DESC, es.total_tickets_resolved DESC
         LIMIT ?`,
        [limit]
      );
      
      return experts.map((expert, index) => ({
        rank: index + 1,
        id: expert.id,
        name: expert.name,
        email: expert.email,
        ticketsResolved: expert.total_tickets_resolved,
        avgRating: expert.avg_rating,
        avgResolutionTime: expert.avg_resolution_time,
        skillsCount: expert.skills_count
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  /**
   * Verify expert skill (admin only)
   */
  async verifySkill(userId, techId, verified = true) {
    try {
      await db.query(
        'UPDATE expert_skills SET is_verified = ?, updated_at = NOW() WHERE user_id = ? AND tech_id = ?',
        [verified ? 1 : 0, userId, techId]
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error verifying skill:', error);
      throw error;
    }
  }

  /**
   * Get pending verification skills (for admin)
   */
  async getPendingVerifications() {
    try {
      const [skills] = await db.query(
        `SELECT es.*, u.name as user_name, u.email as user_email, 
                ts.name as tech_name, ts.category as tech_category
         FROM expert_skills es
         JOIN users u ON es.user_id = u.id
         JOIN tech_stack ts ON es.tech_id = ts.id
         WHERE es.is_verified = 0
           AND es.expertise_level = 'certified'
         ORDER BY es.updated_at DESC`
      );
      
      return skills.map(skill => ({
        userId: skill.user_id,
        userName: skill.user_name,
        userEmail: skill.user_email,
        techId: skill.tech_id,
        techName: skill.tech_name,
        category: skill.tech_category,
        expertiseLevel: skill.expertise_level,
        yearsExperience: skill.years_experience,
        certificationProof: skill.certification_proof,
        updatedAt: skill.updated_at
      }));
    } catch (error) {
      console.error('Error getting pending verifications:', error);
      throw error;
    }
  }
}

export const expertService = new ExpertService();
export default expertService;
