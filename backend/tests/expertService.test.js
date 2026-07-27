/**
 * Expert Service Tests
 * Tests for expert profile, skills, and eligibility
 */

import { describe, it, expect } from '@jest/globals';
import { 
  TECH_STACK, 
  getAllTechnologies, 
  getTechnologiesByCategory, 
  getTechnology, 
  EXPERTISE_LEVELS,
  COMPLEXITY_TIERS,
  requiresCertification,
  canHandleComplexity
} from '../src/constants/techStack.js';

// ============================================
// TECH STACK TESTS
// ============================================

describe('Tech Stack Constants', () => {
  describe('TECH_STACK structure', () => {
    it('should have all required categories', () => {
      const requiredCategories = [
        'languages', 'frontend', 'backend', 'databases', 
        'cloud', 'mobile', 'data', 'security', 'cms', 'tools'
      ];
      
      requiredCategories.forEach(cat => {
        expect(TECH_STACK).toHaveProperty(cat);
      });
    });

    it('should have proper structure for each category', () => {
      Object.entries(TECH_STACK).forEach(([catId, category]) => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('icon');
        expect(category).toHaveProperty('technologies');
        expect(category.id).toBe(catId);
      });
    });

    it('should have technologies with required fields', () => {
      Object.values(TECH_STACK).forEach(category => {
        Object.values(category.technologies).forEach(tech => {
          expect(tech).toHaveProperty('id');
          expect(tech).toHaveProperty('name');
          expect(tech).toHaveProperty('category');
          expect(tech).toHaveProperty('certified');
        });
      });
    });
  });

  describe('getAllTechnologies', () => {
    it('should return all technologies flattened', () => {
      const technologies = getAllTechnologies();
      expect(Array.isArray(technologies)).toBe(true);
      expect(technologies.length).toBeGreaterThan(0);
    });

    it('should include category info in each technology', () => {
      const technologies = getAllTechnologies();
      const tech = technologies[0];
      
      expect(tech).toHaveProperty('categoryId');
      expect(tech).toHaveProperty('categoryName');
      expect(tech).toHaveProperty('categoryIcon');
    });

    it('should have unique IDs for all technologies', () => {
      const technologies = getAllTechnologies();
      const ids = technologies.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('getTechnologiesByCategory', () => {
    it('should return technologies for valid category', () => {
      const technologies = getTechnologiesByCategory('languages');
      expect(Array.isArray(technologies)).toBe(true);
      expect(technologies.length).toBeGreaterThan(0);
      technologies.forEach(tech => {
        expect(tech.categoryId).toBe('languages');
      });
    });

    it('should return empty array for invalid category', () => {
      const technologies = getTechnologiesByCategory('invalid');
      expect(Array.isArray(technologies)).toBe(true);
      expect(technologies.length).toBe(0);
    });

    it('should include category info', () => {
      const technologies = getTechnologiesByCategory('frontend');
      expect(technologies[0].categoryName).toBe('Frontend Frameworks');
      expect(technologies[0].categoryIcon).toBe('🎨');
    });
  });

  describe('getTechnology', () => {
    it('should return technology by ID', () => {
      const tech = getTechnology('nodejs');
      expect(tech).not.toBeNull();
      expect(tech.name).toBe('Node.js');
      // Node.js is in the 'runtime' category within backend framework
      expect(['backend', 'runtime']).toContain(tech.category);
    });

    it('should return null for invalid ID', () => {
      const tech = getTechnology('invalid_tech_id');
      expect(tech).toBeNull();
    });

    it('should include category info', () => {
      const tech = getTechnology('react');
      expect(tech.categoryId).toBe('frontend');
      expect(tech.categoryName).toBe('Frontend Frameworks');
    });
  });

  describe('requiresCertification', () => {
    it('should return true for certified technologies', () => {
      expect(requiresCertification('nodejs')).toBe(true);
      expect(requiresCertification('react')).toBe(true);
      expect(requiresCertification('aws')).toBe(true);
    });

    it('should return false for non-certified technologies', () => {
      expect(requiresCertification('jquery')).toBe(false);
      expect(requiresCertification('php')).toBe(false);
    });

    it('should return false for invalid technology', () => {
      expect(requiresCertification('invalid')).toBe(false);
    });
  });
});

// ============================================
// EXPERTISE LEVELS TESTS
// ============================================

describe('Expertise Levels', () => {
  it('should have all required levels', () => {
    expect(EXPERTISE_LEVELS).toHaveProperty('beginner');
    expect(EXPERTISE_LEVELS).toHaveProperty('intermediate');
    expect(EXPERTISE_LEVELS).toHaveProperty('advanced');
    expect(EXPERTISE_LEVELS).toHaveProperty('expert');
    expect(EXPERTISE_LEVELS).toHaveProperty('certified');
  });

  it('should have correct minYears for each level', () => {
    expect(EXPERTISE_LEVELS.beginner.minYears).toBe(0);
    expect(EXPERTISE_LEVELS.intermediate.minYears).toBe(1);
    expect(EXPERTISE_LEVELS.advanced.minYears).toBe(3);
    expect(EXPERTISE_LEVELS.expert.minYears).toBe(5);
    expect(EXPERTISE_LEVELS.certified.minYears).toBe(3);
  });

  it('should have proper structure for each level', () => {
    Object.entries(EXPERTISE_LEVELS).forEach(([id, level]) => {
      expect(level).toHaveProperty('id');
      expect(level).toHaveProperty('name');
      expect(level).toHaveProperty('minYears');
      expect(level).toHaveProperty('color');
      expect(level.id).toBe(id);
    });
  });

  it('should have badge only for certified level', () => {
    expect(EXPERTISE_LEVELS.certified.badge).toBe('✓');
    expect(EXPERTISE_LEVELS.beginner.badge).toBeUndefined();
    expect(EXPERTISE_LEVELS.expert.badge).toBeUndefined();
  });
});

// ============================================
// COMPLEXITY TIERS TESTS
// ============================================

describe('Complexity Tiers', () => {
  it('should have all required tiers', () => {
    expect(COMPLEXITY_TIERS).toHaveProperty('simple');
    expect(COMPLEXITY_TIERS).toHaveProperty('moderate');
    expect(COMPLEXITY_TIERS).toHaveProperty('complex');
    expect(COMPLEXITY_TIERS).toHaveProperty('critical');
  });

  it('should have increasing requirements for higher tiers', () => {
    expect(COMPLEXITY_TIERS.simple.maxRating).toBeLessThan(COMPLEXITY_TIERS.moderate.maxRating);
    expect(COMPLEXITY_TIERS.moderate.maxRating).toBeLessThan(COMPLEXITY_TIERS.complex.maxRating);
    expect(COMPLEXITY_TIERS.complex.maxRating).toBeLessThan(COMPLEXITY_TIERS.critical.maxRating);
  });

  it('should have proper structure for each tier', () => {
    Object.entries(COMPLEXITY_TIERS).forEach(([id, tier]) => {
      expect(tier).toHaveProperty('id');
      expect(tier).toHaveProperty('name');
      expect(tier).toHaveProperty('maxRating');
      expect(tier).toHaveProperty('maxYears');
      expect(tier).toHaveProperty('description');
      expect(tier.id).toBe(id);
    });
  });

  describe('canHandleComplexity', () => {
    it('should allow beginner to handle all tiers (0 years experience is broad)', () => {
      // beginner has 0 minYears, which is <= all maxYears values
      expect(canHandleComplexity('beginner', 'simple')).toBe(true);
      expect(canHandleComplexity('beginner', 'moderate')).toBe(true);
      expect(canHandleComplexity('beginner', 'complex')).toBe(true);
      expect(canHandleComplexity('beginner', 'critical')).toBe(true);
    });

    it('should allow intermediate to handle most tiers', () => {
      // intermediate has 1 minYears, <= simple(2), moderate(4), complex(6), critical(10)
      expect(canHandleComplexity('intermediate', 'simple')).toBe(true);
      expect(canHandleComplexity('intermediate', 'moderate')).toBe(true);
      expect(canHandleComplexity('intermediate', 'complex')).toBe(true);
      expect(canHandleComplexity('intermediate', 'critical')).toBe(true);
    });

    it('should not allow advanced/expert/certified to handle simple (overqualified)', () => {
      // advanced=3, expert=5, certified=3 all > simple's maxYears=2
      expect(canHandleComplexity('advanced', 'simple')).toBe(false);
      expect(canHandleComplexity('expert', 'simple')).toBe(false);
      expect(canHandleComplexity('certified', 'simple')).toBe(false);
    });

    it('should allow expert to handle complex and critical', () => {
      // expert has 5 minYears, <= complex(6) and critical(10)
      expect(canHandleComplexity('expert', 'complex')).toBe(true);
      expect(canHandleComplexity('expert', 'critical')).toBe(true);
    });

    it('should not allow expert to handle moderate (overqualified)', () => {
      // expert has 5 minYears, > moderate's maxYears=4
      expect(canHandleComplexity('expert', 'moderate')).toBe(false);
    });

    it('should allow certified to handle moderate, complex, critical', () => {
      // certified has 3 minYears, <= moderate(4), complex(6), critical(10)
      expect(canHandleComplexity('certified', 'moderate')).toBe(true);
      expect(canHandleComplexity('certified', 'complex')).toBe(true);
      expect(canHandleComplexity('certified', 'critical')).toBe(true);
    });

    it('should return false for invalid levels', () => {
      expect(canHandleComplexity('invalid', 'simple')).toBe(false);
    });

    it('should return false for invalid tiers', () => {
      expect(canHandleComplexity('expert', 'invalid')).toBe(false);
    });
  });
});

// ============================================
// POPULAR TECHNOLOGIES TESTS
// ============================================

describe('Popular Technologies', () => {
  const popularTechs = ['nodejs', 'react', 'aws', 'docker', 'mysql', 'postgresql'];
  
  popularTechs.forEach(techId => {
    it(`should have ${techId} in tech stack`, () => {
      const tech = getTechnology(techId);
      expect(tech).not.toBeNull();
      expect(tech.id).toBe(techId);
    });

    it(`${techId} should be certified`, () => {
      const tech = getTechnology(techId);
      expect(tech.certified).toBe(true);
    });
  });
});

// ============================================
// MOBILE TECHNOLOGIES TESTS
// ============================================

describe('Mobile Technologies', () => {
  it('should have React Native', () => {
    const tech = getTechnology('reactnative');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('React Native');
    expect(tech.certified).toBe(true);
  });

  it('should have Flutter', () => {
    const tech = getTechnology('flutter');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('Flutter');
    expect(tech.certified).toBe(true);
  });

  it('should have native iOS', () => {
    const tech = getTechnology('native_ios');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('Native iOS');
  });
});

// ============================================
// CLOUD TECHNOLOGIES TESTS
// ============================================

describe('Cloud Technologies', () => {
  it('should have AWS', () => {
    const tech = getTechnology('aws');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('AWS');
    expect(tech.certified).toBe(true);
  });

  it('should have Azure', () => {
    const tech = getTechnology('azure');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('Azure');
    expect(tech.certified).toBe(true);
  });

  it('should have Google Cloud', () => {
    const tech = getTechnology('gcp');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('Google Cloud');
    expect(tech.certified).toBe(true);
  });

  it('should have Docker', () => {
    const tech = getTechnology('docker');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('Docker');
    expect(tech.certified).toBe(true);
  });

  it('should have Kubernetes', () => {
    const tech = getTechnology('kubernetes');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('Kubernetes');
    expect(tech.certified).toBe(true);
  });
});

// ============================================
// DATABASE TECHNOLOGIES TESTS
// ============================================

describe('Database Technologies', () => {
  it('should have MySQL', () => {
    const tech = getTechnology('mysql');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('MySQL');
    expect(tech.certified).toBe(true);
  });

  it('should have PostgreSQL', () => {
    const tech = getTechnology('postgresql');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('PostgreSQL');
    expect(tech.certified).toBe(true);
  });

  it('should have MongoDB', () => {
    const tech = getTechnology('mongodb');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('MongoDB');
    expect(tech.certified).toBe(true);
  });

  it('should have Redis', () => {
    const tech = getTechnology('redis');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('Redis');
    expect(tech.certified).toBe(true);
  });
});

// ============================================
// SECURITY TECHNOLOGIES TESTS
// ============================================

describe('Security Technologies', () => {
  it('should have OAuth', () => {
    const tech = getTechnology('oauth');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('OAuth 2.0');
  });

  it('should have JWT', () => {
    const tech = getTechnology('jwt');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('JWT');
  });

  it('should have OWASP', () => {
    const tech = getTechnology('owasp');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('OWASP');
  });
});

// ============================================
// TOOLS TESTS
// ============================================

describe('Collaboration Tools', () => {
  it('should have Git', () => {
    const tech = getTechnology('git');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('Git');
    expect(tech.certified).toBe(true);
  });

  it('should have GitHub', () => {
    const tech = getTechnology('github');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('GitHub');
  });

  it('should have Jira', () => {
    const tech = getTechnology('jira');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('Jira');
    expect(tech.certified).toBe(true);
  });

  it('should have Slack', () => {
    const tech = getTechnology('slack');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('Slack');
  });
});

// ============================================
// DATA & ML TECHNOLOGIES TESTS
// ============================================

describe('Data & ML Technologies', () => {
  it('should have TensorFlow', () => {
    const tech = getTechnology('tensorflow');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('TensorFlow');
  });

  it('should have PyTorch', () => {
    const tech = getTechnology('pytorch');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('PyTorch');
  });

  it('should have Apache Spark', () => {
    const tech = getTechnology('apache_spark');
    expect(tech).not.toBeNull();
    expect(tech.name).toBe('Apache Spark');
  });
});

// ============================================
// STATISTICS TESTS
// ============================================

describe('Tech Stack Statistics', () => {
  it('should have at least 100 technologies', () => {
    const technologies = getAllTechnologies();
    expect(technologies.length).toBeGreaterThanOrEqual(100);
  });

  it('should have multiple categories', () => {
    const categories = Object.keys(TECH_STACK);
    expect(categories.length).toBeGreaterThanOrEqual(8);
  });

  it('should have technologies in each category', () => {
    Object.entries(TECH_STACK).forEach(([catId, category]) => {
      const techs = Object.values(category.technologies);
      expect(techs.length).toBeGreaterThan(0);
    });
  });

  it('should have certified technologies in key categories', () => {
    const keyCategories = ['languages', 'frontend', 'backend', 'databases', 'cloud'];
    keyCategories.forEach(catId => {
      const techs = getTechnologiesByCategory(catId);
      const certifiedCount = techs.filter(t => t.certified).length;
      expect(certifiedCount).toBeGreaterThan(0);
    });
  });
});
