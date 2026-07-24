/**
 * Tests for ticket category hierarchy
 */

import {
  TICKET_CATEGORIES,
  getCategories,
  getCategory,
  getFullPath,
  validateCategoryPath,
  getTopic
} from '../src/constants/ticketCategories.js';

describe('TicketCategoryHierarchy', () => {
  describe('TICKET_CATEGORIES', () => {
    it('should have all main categories defined', () => {
      expect(TICKET_CATEGORIES.hardware).toBeDefined();
      expect(TICKET_CATEGORIES.software).toBeDefined();
      expect(TICKET_CATEGORIES.network).toBeDefined();
      expect(TICKET_CATEGORIES.access).toBeDefined();
      expect(TICKET_CATEGORIES.data).toBeDefined();
      expect(TICKET_CATEGORIES.account).toBeDefined();
      expect(TICKET_CATEGORIES.training).toBeDefined();
      expect(TICKET_CATEGORIES.other).toBeDefined();
    });

    it('should have required properties on each category', () => {
      Object.values(TICKET_CATEGORIES).forEach(category => {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.icon).toBeDefined();
        expect(category.description).toBeDefined();
        expect(category.subcategories).toBeDefined();
      });
    });

    it('should have subcategories with topics', () => {
      const hardware = TICKET_CATEGORIES.hardware;
      expect(Object.keys(hardware.subcategories).length).toBeGreaterThan(0);
      
      const desktop = hardware.subcategories.desktop;
      expect(desktop.topics).toBeDefined();
      expect(Object.keys(desktop.topics).length).toBeGreaterThan(0);
    });

    it('should have valid topic structure', () => {
      const hardware = TICKET_CATEGORIES.hardware;
      const desktop = hardware.subcategories.desktop;
      if (desktop && desktop.topics) {
        Object.values(desktop.topics).forEach(topic => {
          expect(topic.id).toBeDefined();
          expect(topic.name).toBeDefined();
        });
      }
    });
  });

  describe('getCategories', () => {
    it('should return array of categories with required fields', () => {
      const categories = getCategories();
      
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      
      categories.forEach(cat => {
        expect(cat.id).toBeDefined();
        expect(cat.name).toBeDefined();
        expect(cat.icon).toBeDefined();
        expect(cat.description).toBeDefined();
      });
    });
  });

  describe('getCategory', () => {
    it('should return category with subcategories', () => {
      const category = getCategory('hardware');
      
      expect(category).not.toBeNull();
      expect(category.id).toBe('hardware');
      expect(category.name).toBe('Hardware');
      expect(category.subcategories).toBeDefined();
      expect(Array.isArray(category.subcategories)).toBe(true);
    });

    it('should return null for invalid category', () => {
      const category = getCategory('invalid_category');
      expect(category).toBeNull();
    });
  });

  describe('getFullPath', () => {
    it('should return complete path for valid hierarchy', () => {
      const path = getFullPath('hardware', 'desktop', 'display');
      
      expect(path).not.toBeNull();
      expect(path.category.id).toBe('hardware');
      expect(path.category.name).toBe('Hardware');
      expect(path.subcategory.id).toBe('desktop');
      expect(path.subcategory.name).toBe('Desktop');
      expect(path.topic.id).toBe('display');
      expect(path.topic.name).toBe('Display/Monitor Issues');
    });

    it('should return null for invalid category', () => {
      const path = getFullPath('invalid', 'desktop', 'display');
      expect(path).toBeNull();
    });

    it('should return null for invalid subcategory', () => {
      const path = getFullPath('hardware', 'invalid', 'display');
      expect(path).toBeNull();
    });

    it('should return null for invalid topic', () => {
      const path = getFullPath('hardware', 'desktop', 'invalid');
      expect(path).toBeNull();
    });
  });

  describe('validateCategoryPath', () => {
    it('should return true for valid path', () => {
      expect(validateCategoryPath('hardware', 'desktop', 'display')).toBe(true);
      expect(validateCategoryPath('software', 'operating_system', 'windows')).toBe(true);
      expect(validateCategoryPath('network', 'connectivity', 'wifi')).toBe(true);
    });

    it('should return false for invalid path', () => {
      expect(validateCategoryPath('invalid', 'desktop', 'display')).toBe(false);
      expect(validateCategoryPath('hardware', 'invalid', 'display')).toBe(false);
      expect(validateCategoryPath('hardware', 'desktop', 'invalid')).toBe(false);
    });

    it('should return false for missing values', () => {
      expect(validateCategoryPath(null, 'desktop', 'display')).toBe(false);
      expect(validateCategoryPath('hardware', null, 'display')).toBe(false);
      expect(validateCategoryPath('hardware', 'desktop', null)).toBe(false);
    });
  });

  describe('getTopic', () => {
    it('should return topic for valid path', () => {
      const topic = getTopic('hardware', 'desktop', 'keyboard');
      
      expect(topic).not.toBeNull();
      expect(topic.id).toBe('keyboard');
      expect(topic.name).toBe('Keyboard Problems');
    });

    it('should return null for invalid path', () => {
      expect(getTopic('invalid', 'desktop', 'keyboard')).toBeNull();
      expect(getTopic('hardware', 'invalid', 'keyboard')).toBeNull();
      expect(getTopic('hardware', 'desktop', 'invalid')).toBeNull();
    });
  });

  describe('Category Coverage', () => {
    it('should have at least 7 main categories', () => {
      const categoryCount = Object.keys(TICKET_CATEGORIES).length;
      expect(categoryCount).toBeGreaterThanOrEqual(7);
    });

    it('should have icons for all categories', () => {
      Object.values(TICKET_CATEGORIES).forEach(category => {
        expect(category.icon).toBeDefined();
      });
    });

    it('should have at least 1 subcategory per main category', () => {
      Object.values(TICKET_CATEGORIES).forEach(category => {
        const subcatCount = Object.keys(category.subcategories).length;
        expect(subcatCount).toBeGreaterThanOrEqual(1);
      });
    });

    it('should have at least 1 topic per subcategory', () => {
      Object.values(TICKET_CATEGORIES).forEach(category => {
        Object.values(category.subcategories).forEach(subcategory => {
          if (subcategory.topics) {
            const topicCount = Object.keys(subcategory.topics).length;
            expect(topicCount).toBeGreaterThanOrEqual(1);
          }
        });
      });
    });
  });
});
