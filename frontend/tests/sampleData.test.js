/**
 * Sample Data Tests
 * Tests for sample data used in frontend development and testing
 */

import { describe, it, expect } from 'vitest';
import {
  sampleUsers,
  sampleTickets,
  sampleCategories,
  sampleTemplates,
  sampleTechStack,
  sampleTopicSuggestions,
  sampleNotifications,
  sampleStats,
  sampleLeaderboard,
  sampleExpertSkills,
  simulateApiDelay,
  createMockResponse
} from '../src/data/sampleData.js';

// ============================================
// USER DATA TESTS
// ============================================

describe('Sample Users', () => {
  it('should have all required user roles', () => {
    const roles = sampleUsers.map(u => u.role);
    expect(roles).toContain('admin');
    expect(roles).toContain('customer');
    expect(roles).toContain('tech');
  });

  it('should have valid email formats', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    sampleUsers.forEach(user => {
      expect(user.email).toMatch(emailRegex);
    });
  });

  it('should have at least one tech user with rating', () => {
    const techUsers = sampleUsers.filter(u => u.role === 'tech');
    expect(techUsers.length).toBeGreaterThan(0);
    techUsers.forEach(user => {
      expect(user).toHaveProperty('rating');
      expect(user.rating).toBeGreaterThanOrEqual(0);
      expect(user.rating).toBeLessThanOrEqual(5);
    });
  });
});

// ============================================
// TICKET DATA TESTS
// ============================================

describe('Sample Tickets', () => {
  it('should have valid priority levels', () => {
    const validPriorities = ['low', 'normal', 'high', 'urgent', 'critical'];
    sampleTickets.forEach(ticket => {
      expect(validPriorities).toContain(ticket.priority);
    });
  });

  it('should have valid status values', () => {
    const validStatuses = ['open', 'claimed', 'in_progress', 'resolved', 'closed'];
    sampleTickets.forEach(ticket => {
      expect(validStatuses).toContain(ticket.status);
    });
  });

  it('should have numeric base_pay', () => {
    sampleTickets.forEach(ticket => {
      expect(typeof ticket.base_pay).toBe('number');
      expect(ticket.base_pay).toBeGreaterThan(0);
    });
  });

  it('should have tags as array', () => {
    sampleTickets.forEach(ticket => {
      expect(Array.isArray(ticket.tags)).toBe(true);
    });
  });
});

// ============================================
// CATEGORY DATA TESTS
// ============================================

describe('Sample Categories', () => {
  it('should have icon and color for each category', () => {
    sampleCategories.forEach(cat => {
      expect(cat.icon).toBeDefined();
      expect(cat.color).toBeDefined();
      expect(cat.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('should have numeric count', () => {
    sampleCategories.forEach(cat => {
      expect(typeof cat.count).toBe('number');
      expect(cat.count).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================
// TEMPLATE DATA TESTS
// ============================================

describe('Sample Templates', () => {
  it('should have is_active boolean', () => {
    sampleTemplates.forEach(template => {
      expect(typeof template.is_active).toBe('boolean');
    });
  });

  it('should have numeric use_count', () => {
    sampleTemplates.forEach(template => {
      expect(typeof template.use_count).toBe('number');
      expect(template.use_count).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================
// TECH STACK DATA TESTS
// ============================================

describe('Sample Tech Stack', () => {
  it('should have categories array', () => {
    expect(Array.isArray(sampleTechStack.categories)).toBe(true);
    expect(sampleTechStack.categories.length).toBeGreaterThan(0);
  });

  it('should have technologies array', () => {
    expect(Array.isArray(sampleTechStack.technologies)).toBe(true);
    expect(sampleTechStack.technologies.length).toBeGreaterThan(0);
  });

  it('should have certified boolean on technologies', () => {
    sampleTechStack.technologies.forEach(tech => {
      expect(typeof tech.certified).toBe('boolean');
    });
  });

  it('should have categoryId linking to categories', () => {
    const categoryIds = sampleTechStack.categories.map(c => c.id);
    sampleTechStack.technologies.forEach(tech => {
      expect(categoryIds).toContain(tech.categoryId);
    });
  });

  it('should have some certified technologies', () => {
    const certifiedTechs = sampleTechStack.technologies.filter(t => t.certified);
    expect(certifiedTechs.length).toBeGreaterThan(0);
  });
});

// ============================================
// TOPIC SUGGESTIONS TESTS
// ============================================

describe('Sample Topic Suggestions', () => {
  it('should have valid success_rate (0-100)', () => {
    sampleTopicSuggestions.forEach(topic => {
      expect(topic.success_rate).toBeGreaterThanOrEqual(0);
      expect(topic.success_rate).toBeLessThanOrEqual(100);
    });
  });

  it('should have numeric usage_count', () => {
    sampleTopicSuggestions.forEach(topic => {
      expect(typeof topic.usage_count).toBe('number');
      expect(topic.usage_count).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================
// NOTIFICATION DATA TESTS
// ============================================

describe('Sample Notifications', () => {
  it('should have is_read boolean', () => {
    sampleNotifications.forEach(notification => {
      expect(typeof notification.is_read).toBe('boolean');
    });
  });

  it('should have valid types', () => {
    const validTypes = ['ticket', 'rating', 'payment', 'system'];
    sampleNotifications.forEach(notification => {
      expect(validTypes).toContain(notification.type);
    });
  });

  it('should have created_at as ISO string', () => {
    sampleNotifications.forEach(notification => {
      expect(notification.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});

// ============================================
// STATS DATA TESTS
// ============================================

describe('Sample Stats', () => {
  it('should have numeric values', () => {
    expect(typeof sampleStats.totalTickets).toBe('number');
    expect(typeof sampleStats.openTickets).toBe('number');
    expect(typeof sampleStats.resolvedTickets).toBe('number');
    expect(typeof sampleStats.totalEarnings).toBe('number');
  });

  it('should have valid average rating', () => {
    expect(sampleStats.averageRating).toBeGreaterThanOrEqual(0);
    expect(sampleStats.averageRating).toBeLessThanOrEqual(5);
  });

  it('should have ticket counts consistent', () => {
    const total = sampleStats.openTickets + sampleStats.inProgressTickets + sampleStats.resolvedTickets;
    expect(total).toBeLessThanOrEqual(sampleStats.totalTickets);
  });
});

// ============================================
// LEADERBOARD DATA TESTS
// ============================================

describe('Sample Leaderboard', () => {
  it('should be sorted by rank', () => {
    for (let i = 1; i < sampleLeaderboard.length; i++) {
      expect(sampleLeaderboard[i].rank).toBeGreaterThan(sampleLeaderboard[i - 1].rank);
    }
  });

  it('should have valid ratings', () => {
    sampleLeaderboard.forEach(entry => {
      expect(entry.rating).toBeGreaterThanOrEqual(0);
      expect(entry.rating).toBeLessThanOrEqual(5);
    });
  });

  it('should have numeric values for stats', () => {
    sampleLeaderboard.forEach(entry => {
      expect(typeof entry.ticketsResolved).toBe('number');
      expect(typeof entry.earnings).toBe('number');
    });
  });
});

// ============================================
// EXPERT SKILLS DATA TESTS
// ============================================

describe('Sample Expert Skills', () => {
  it('should have valid expertise levels', () => {
    const validLevels = ['beginner', 'intermediate', 'advanced', 'expert', 'certified'];
    sampleExpertSkills.forEach(expert => {
      expert.skills.forEach(skill => {
        expect(validLevels).toContain(skill.expertiseLevel);
      });
    });
  });

  it('should have numeric years of experience', () => {
    sampleExpertSkills.forEach(expert => {
      expert.skills.forEach(skill => {
        expect(typeof skill.yearsExperience).toBe('number');
        expect(skill.yearsExperience).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

// ============================================
// HELPER FUNCTION TESTS
// ============================================

describe('Helper Functions', () => {
  describe('simulateApiDelay', () => {
    it('should resolve with data after delay', async () => {
      const testData = { test: 'value' };
      const start = Date.now();
      const result = await simulateApiDelay(testData, 100);
      const elapsed = Date.now() - start;
      
      expect(result).toEqual(testData);
      expect(elapsed).toBeGreaterThanOrEqual(95);
    });
  });

  describe('createMockResponse', () => {
    it('should create response with data', async () => {
      const testData = { items: [1, 2, 3] };
      const response = await createMockResponse(testData);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(testData);
      expect(response.timestamp).toBeDefined();
    });

    it('should handle success: false', async () => {
      const response = await createMockResponse(null, false);
      
      expect(response.success).toBe(false);
    });
  });
});
