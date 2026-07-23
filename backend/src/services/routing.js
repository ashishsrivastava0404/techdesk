import pool from '../db/index.js';
import { notificationService } from './notifications.js';

/**
 * Intelligent Agent Routing Service
 * Scores and matches agents to tickets based on expertise and performance
 */

class RoutingService {
  /**
   * Calculate agent score for a ticket
   * @param {string} techName - Agent's username
   * @param {string} category - Ticket category
   * @param {string} subcategory - Ticket subcategory
   * @param {Array} tags - Ticket tags
   * @returns {Object} Agent score breakdown
   */
  async calculateAgentScore(techName, category, subcategory, tags = []) {
    const expertise = await this.getAgentExpertise(techName, category, subcategory);
    
    if (!expertise) {
      return {
        techName,
        totalScore: 0,
        expertiseScore: 0,
        performanceScore: 0,
        availabilityScore: 0,
        reason: 'No expertise match'
      };
    }

    // Expertise score (0-40 points)
    const expertiseLevelScores = { beginner: 10, intermediate: 25, expert: 40 };
    const expertiseScore = expertiseLevelScores[expertise.expertise_level] || 0;

    // Performance score (0-40 points) - based on success rate and rating
    const successRateScore = (expertise.success_rate || 0) * 0.4; // 0-40 points
    const ratingScore = (expertise.avg_rating || 0) * 8; // 0-40 points (5 stars = 40)
    const performanceScore = Math.min((successRateScore + ratingScore) / 2, 40);

    // Availability score (0-20 points)
    const availabilityScore = await this.getAgentAvailability(techName);

    const totalScore = expertiseScore + performanceScore + availabilityScore;

    return {
      techName,
      totalScore: Math.round(totalScore * 100) / 100,
      expertiseScore,
      performanceScore: Math.round(performanceScore * 100) / 100,
      availabilityScore,
      expertiseLevel: expertise.expertise_level,
      successRate: expertise.success_rate,
      avgRating: expertise.avg_rating,
      totalTickets: expertise.total_tickets
    };
  }

  /**
   * Get agent expertise for a category
   */
  async getAgentExpertise(techName, category, subcategory = null) {
    let query = `
      SELECT * FROM agent_expertise 
      WHERE tech_name = ? AND category = ?
    `;
    let params = [techName, category];

    // Order by subcategory match (prefer exact match if subcategory provided)
    if (subcategory) {
      query += ` ORDER BY CASE WHEN subcategory = ? THEN 0 ELSE 1 END LIMIT 1`;
      params.push(subcategory);
    } else {
      query += ` LIMIT 1`;
    }

    const [rows] = await pool.query(query, params);
    return rows[0] || null;
  }

  /**
   * Get agent availability score (0-20)
   * Lower score = more available
   */
  async getAgentAvailability(techName) {
    // Count open/in_progress tickets
    const [openTickets] = await pool.query(
      `SELECT COUNT(*) as count FROM tickets 
       WHERE tech_name = ? AND status IN ('claimed', 'in_progress')`,
      [techName]
    );

    const openCount = openTickets[0]?.count || 0;

    // More open tickets = lower availability
    if (openCount >= 5) return 0;
    if (openCount >= 3) return 5;
    if (openCount >= 1) return 10;
    return 20;
  }

  /**
   * Get top agents for a ticket
   * @param {string} category - Ticket category
   * @param {string} subcategory - Ticket subcategory
   * @param {Array} tags - Ticket tags
   * @param {number} limit - Number of agents to return
   */
  async getTopAgents(category, subcategory, tags = [], limit = 10) {
    // Get all active techs
    const [techs] = await pool.query(
      `SELECT name FROM users WHERE role = 'tech' AND status = 'active'`
    );

    // Calculate scores for each agent
    const scoredAgents = await Promise.all(
      techs.map(async (tech) => {
        const score = await this.calculateAgentScore(
          tech.name,
          category,
          subcategory,
          tags
        );
        return score;
      })
    );

    // Filter out agents with no score and sort
    const qualifiedAgents = scoredAgents
      .filter(agent => agent.totalScore > 0)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);

    return qualifiedAgents;
  }

  /**
   * Route ticket to qualified agents
   * Called when a new ticket is submitted
   */
  async routeTicket(ticket) {
    const {
      id: ticketId,
      category,
      subcategory,
      tags,
      title,
      customer_name,
      priority
    } = ticket;

    // Determine agent limit based on priority
    // Critical/Normal: Top 20 agents
    // High/Urgent: Top 15 agents
    // Low: Top 10 agents
    const agentLimits = {
      critical: 20,
      normal: 20,
      high: 15,
      urgent: 15,
      low: 10
    };
    const agentLimit = agentLimits[priority] || 10;

    const topAgents = await this.getTopAgents(category, subcategory, tags, agentLimit);

    if (topAgents.length === 0) {
      console.log(`No qualified agents found for ticket #${ticketId}`);
      return { routed: false, agents: [] };
    }

    // Notify agents
    const notifiedAgents = [];
    for (const agent of topAgents) {
      try {
        await notificationService.storeNotification({
          user_name: agent.techName,
          type: 'ticket_available',
          title: `New ${priority} Priority Ticket Match`,
          message: `A new ticket matching your expertise is available: "${title}". Category: ${category}`,
          related_ticket_id: ticketId,
          related_user: customer_name
        });
        notifiedAgents.push(agent.techName);
      } catch (error) {
        console.error(`Failed to notify ${agent.techName}:`, error);
      }
    }

    return {
      routed: true,
      agents: topAgents,
      notifiedCount: notifiedAgents.length,
      priorityRouting: {
        priority,
        agentLimit
      }
    };
  }

  /**
   * Update agent expertise statistics
   * Called when a ticket is resolved
   */
  async updateAgentExpertise(techName, category, subcategory, rating) {
    const success = rating >= 4 ? 1 : 0;

    // Check if expertise record exists
    const [existing] = await pool.query(
      `SELECT * FROM agent_expertise 
       WHERE tech_name = ? AND category = ? AND (subcategory = ? OR subcategory IS NULL)
       ORDER BY subcategory DESC LIMIT 1`,
      [techName, category, subcategory || null]
    );

    if (existing.length > 0) {
      // Update existing record
      const current = existing[0];
      const newTotal = current.total_tickets + 1;
      const newSuccessful = current.successful_tickets + success;
      const newSuccessRate = (newSuccessful / newTotal) * 100;
      const newAvgRating = ((current.avg_rating * current.total_tickets) + rating) / newTotal;

      await pool.query(
        `UPDATE agent_expertise SET 
         total_tickets = ?,
         successful_tickets = ?,
         success_rate = ?,
         avg_rating = ?,
         updated_at = NOW()
         WHERE id = ?`,
        [newTotal, newSuccessful, newSuccessRate, newAvgRating, current.id]
      );
    } else {
      // Create new expertise record
      await pool.query(
        `INSERT INTO agent_expertise 
         (tech_name, category, subcategory, total_tickets, successful_tickets, success_rate, avg_rating)
         VALUES (?, ?, ?, 1, ?, ?, ?)`,
        [techName, category, subcategory || null, success, success * 100, rating || 0]
      );
    }
  }

  /**
   * Get agent's full profile with expertise
   */
  async getAgentProfile(techName) {
    const [user] = await pool.query(
      'SELECT id, name, email, avatar_url, bio, hourly_rate FROM users WHERE name = ?',
      [techName]
    );

    if (user.length === 0) {
      return null;
    }

    const [expertise] = await pool.query(
      'SELECT * FROM agent_expertise WHERE tech_name = ? ORDER BY success_rate DESC',
      [techName]
    );

    const [stats] = await pool.query(
      `SELECT 
         COUNT(*) as total_resolved,
         AVG(satisfaction_score) as avg_satisfaction,
         SUM(actual_hours) as total_hours
       FROM tickets 
       WHERE tech_name = ? AND status = 'resolved'`,
      [techName]
    );

    return {
      ...user[0],
      expertise,
      stats: stats[0]
    };
  }

  /**
   * Add expertise for an agent
   */
  async addAgentExpertise(techName, category, subcategory, level = 'intermediate') {
    await pool.query(
      `INSERT INTO agent_expertise (tech_name, category, subcategory, expertise_level)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE expertise_level = ?`,
      [techName, category, null, level, level] // subcategory not used in unique constraint
    );
  }

  /**
   * Remove expertise for an agent
   */
  async removeAgentExpertise(techName, category, subcategory = null) {
    let query = `DELETE FROM agent_expertise WHERE tech_name = ? AND category = ?`;
    let params = [techName, category];

    if (subcategory) {
      query += ` AND subcategory = ?`;
      params.push(subcategory);
    }

    await pool.query(query, params);
  }
}

export const routingService = new RoutingService();
export default routingService;
