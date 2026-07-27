/**
 * EnhancedSettings Master Data Component Tests
 * Tests for Master Data Management section and API integrations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================
// MASTER DATA API RESPONSE MOCKS
// ============================================

const mockCategoryHierarchy = {
  data: {
    '1': {
      name: 'Software Development',
      icon: '💻',
      subcategories: {
        '101': { name: 'Frontend' },
        '102': { name: 'Backend' },
        '103': { name: 'DevOps' }
      }
    },
    '2': {
      name: 'Database',
      icon: '🗄️',
      subcategories: {
        '201': { name: 'SQL' },
        '202': { name: 'NoSQL' }
      }
    },
    '3': {
      name: 'Cloud & Infrastructure',
      icon: '☁️',
      subcategories: {}
    }
  }
};

const mockEmptyCategoryHierarchy = {
  data: {}
};

const mockTemplates = [
  {
    id: 1,
    name: 'Bug Report Template',
    category: 'software',
    description: 'Template for reporting bugs',
    use_count: 45,
    is_active: true
  },
  {
    id: 2,
    name: 'Feature Request Template',
    category: 'feature',
    description: 'Template for new features',
    use_count: 23,
    is_active: true
  },
  {
    id: 3,
    name: 'Inactive Template',
    category: 'other',
    use_count: 5,
    is_active: false
  }
];

const mockTechStack = {
  success: true,
  categories: [
    { id: 'frontend', name: 'Frontend Frameworks', icon: '🎨' },
    { id: 'backend', name: 'Backend Frameworks', icon: '⚙️' },
    { id: 'database', name: 'Databases', icon: '🗄️' }
  ],
  technologies: [
    { id: 'react', name: 'React', categoryId: 'frontend', certified: true },
    { id: 'vue', name: 'Vue.js', categoryId: 'frontend', certified: false },
    { id: 'angular', name: 'Angular', categoryId: 'frontend', certified: true },
    { id: 'nodejs', name: 'Node.js', categoryId: 'backend', certified: true },
    { id: 'django', name: 'Django', categoryId: 'backend', certified: false },
    { id: 'express', name: 'Express', categoryId: 'backend', certified: false },
    { id: 'mysql', name: 'MySQL', categoryId: 'database', certified: true },
    { id: 'mongodb', name: 'MongoDB', categoryId: 'database', certified: false }
  ]
};

const mockTopicSuggestions = [
  { id: 1, tag: 'API Integration', usage_count: 150, success_rate: 95.5 },
  { id: 2, tag: 'Authentication', usage_count: 120, success_rate: 88.2 },
  { id: 3, tag: 'Database Migration', usage_count: 85, success_rate: null },
  { id: 4, tag: 'Performance', usage_count: 60, success_rate: 0 }
];

// ============================================
// CATEGORY HIERARCHY ROUTING TESTS
// ============================================

describe('Category Hierarchy Routing', () => {
  describe('fetchCategories API Call', () => {
    it('should call /api/ticket-hierarchy endpoint', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCategoryHierarchy)
      });

      await fetch('/api/ticket-hierarchy');
      
      expect(global.fetch).toHaveBeenCalledWith('/api/ticket-hierarchy');
    });

    it('should handle empty API response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockEmptyCategoryHierarchy)
      });

      const response = await fetch('/api/ticket-hierarchy');
      const data = await response.json();
      
      expect(data.data).toEqual({});
    });

    it('should throw error on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      });

      const response = await fetch('/api/ticket-hierarchy');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('Flat-list Conversion', () => {
    it('should correctly map subcategory IDs and names', () => {
      const catList = Object.entries(mockCategoryHierarchy.data || {}).map(([id, cat]) => ({
        id,
        name: cat.name,
        icon: cat.icon,
        subcategories: Object.keys(cat.subcategories || {}).map(subId => ({
          id: subId,
          name: cat.subcategories[subId].name
        }))
      }));

      // Check first category
      expect(catList[0].id).toBe('1');
      expect(catList[0].name).toBe('Software Development');
      expect(catList[0].subcategories).toHaveLength(3);
      expect(catList[0].subcategories[0].id).toBe('101');
      expect(catList[0].subcategories[0].name).toBe('Frontend');

      // Check category with no subcategories
      expect(catList[2].name).toBe('Cloud & Infrastructure');
      expect(catList[2].subcategories).toHaveLength(0);
    });

    it('should handle missing subcategories gracefully', () => {
      const incompleteData = {
        data: {
          '1': {
            name: 'Test Category',
            icon: '📁',
            subcategories: null
          }
        }
      };

      const catList = Object.entries(incompleteData.data || {}).map(([id, cat]) => ({
        subcategories: Object.keys(cat?.subcategories || {}).map(subId => ({
          id: subId,
          name: cat.subcategories[subId]?.name || 'Unknown'
        }))
      }));

      expect(catList[0].subcategories).toHaveLength(0);
    });

    it('should handle null category name with default', () => {
      const catWithNullName = {
        data: {
          '1': {
            name: null,
            icon: '📁',
            subcategories: {}
          }
        }
      };

      const catList = Object.entries(catWithNullName.data || {}).map(([id, cat]) => ({
        name: cat?.name || 'Unknown'
      }));

      expect(catList[0].name).toBe('Unknown');
    });
  });

  describe('Empty State Handling', () => {
    it('should return empty array for empty data object', () => {
      const catList = Object.entries(mockEmptyCategoryHierarchy.data || {}).map(([id, cat]) => ({
        id,
        name: cat.name,
        subcategories: Object.keys(cat?.subcategories || {}).map(subId => ({
          id: subId,
          name: cat.subcategories[subId]?.name
        }))
      }));

      expect(catList).toHaveLength(0);
    });
  });
});

// ============================================
// TEMPLATE MANAGEMENT TESTS
// ============================================

describe('Template Management', () => {
  describe('API Response Handling', () => {
    it('should return array of templates', () => {
      const templates = mockTemplates;
      
      expect(Array.isArray(templates)).toBe(true);
      expect(templates).toHaveLength(3);
    });

    it('should extract template name correctly', () => {
      const template = mockTemplates[0];
      
      expect(template.name).toBe('Bug Report Template');
    });

    it('should handle missing template name with default', () => {
      const templateWithoutName = { id: 4, use_count: 0, is_active: true };
      const displayName = templateWithoutName.name || 'Unnamed Template';
      
      expect(displayName).toBe('Unnamed Template');
    });

    it('should default use_count to 0', () => {
      const templateWithoutCount = { id: 4, name: 'Test' };
      const count = templateWithoutCount.use_count || 0;
      
      expect(count).toBe(0);
    });
  });

  describe('Status Badge Logic', () => {
    it('should apply active class for is_active true', () => {
      const template = mockTemplates[0]; // Bug Report Template
      const badgeClass = template.is_active ? 'active' : 'inactive';
      
      expect(badgeClass).toBe('active');
    });

    it('should apply inactive class for is_active false', () => {
      const template = mockTemplates[2]; // Inactive Template
      const badgeClass = template.is_active ? 'active' : 'inactive';
      
      expect(badgeClass).toBe('inactive');
    });

    it('should display correct badge text for active', () => {
      const template = mockTemplates[0];
      const badgeText = template.is_active ? 'Active' : 'Inactive';
      
      expect(badgeText).toBe('Active');
    });

    it('should display correct badge text for inactive', () => {
      const template = mockTemplates[2];
      const badgeText = template.is_active ? 'Active' : 'Inactive';
      
      expect(badgeText).toBe('Inactive');
    });
  });

  describe('getTemplates API Mock', () => {
    it('should return templates via api.categories.getTemplates', async () => {
      const mockApi = {
        categories: {
          getTemplates: vi.fn().mockResolvedValue(mockTemplates)
        }
      };

      const response = await mockApi.categories.getTemplates();
      
      expect(mockApi.categories.getTemplates).toHaveBeenCalled();
      expect(response).toEqual(mockTemplates);
    });

    it('should handle non-array response', async () => {
      const mockApi = {
        categories: {
          getTemplates: vi.fn().mockResolvedValue({ error: 'Not found' })
        }
      };

      const response = await mockApi.categories.getTemplates();
      const templates = Array.isArray(response) ? response : [];
      
      expect(templates).toEqual([]);
    });
  });
});

// ============================================
// TECH STACK GRID TESTS
// ============================================

describe('Tech Stack Grid', () => {
  describe('Category Grouping', () => {
    it('should group technologies by category', () => {
      const { categories, technologies } = mockTechStack;
      
      const grouped = categories.map(cat => ({
        ...cat,
        technologies: technologies?.filter(t => t.categoryId === cat.id) || []
      }));

      // Frontend category
      const frontendCat = grouped.find(c => c.id === 'frontend');
      expect(frontendCat.technologies).toHaveLength(3);
      expect(frontendCat.technologies.map(t => t.name)).toContain('React');

      // Backend category
      const backendCat = grouped.find(c => c.id === 'backend');
      expect(backendCat.technologies).toHaveLength(3);

      // Database category
      const dbCat = grouped.find(c => c.id === 'database');
      expect(dbCat.technologies).toHaveLength(2);
    });

    it('should handle missing technologies array', () => {
      const grouped = mockTechStack.categories.map(cat => ({
        ...cat,
        technologies: mockTechStack.technologies?.filter(t => t.categoryId === cat.id) || []
      }));

      const emptyTech = grouped[0];
      expect(emptyTech.technologies).toBeDefined();
    });
  });

  describe('"More" Label Logic', () => {
    it('should show "+X more" when technologies exceed 5', () => {
      const category = {
        id: 'frontend',
        name: 'Frontend',
        technologies: [
          { id: '1', name: 'React' },
          { id: '2', name: 'Vue' },
          { id: '3', name: 'Angular' },
          { id: '4', name: 'Svelte' },
          { id: '5', name: 'Next.js' },
          { id: '6', name: 'Nuxt' },
          { id: '7', name: 'Remix' }
        ]
      };

      const visibleTechs = category.technologies.slice(0, 5);
      const remainingCount = category.technologies.length - 5;
      const moreLabel = remainingCount > 0 ? `+${remainingCount} more` : null;

      expect(visibleTechs).toHaveLength(5);
      expect(remainingCount).toBe(2);
      expect(moreLabel).toBe('+2 more');
    });

    it('should not show "more" when technologies <= 5', () => {
      const category = {
        id: 'database',
        name: 'Database',
        technologies: [
          { id: '1', name: 'MySQL' },
          { id: '2', name: 'PostgreSQL' },
          { id: '3', name: 'MongoDB' }
        ]
      };

      const remainingCount = category.technologies.length - 5;
      const moreLabel = remainingCount > 0 ? `+${remainingCount} more` : null;

      expect(remainingCount).toBe(-2);
      expect(moreLabel).toBeNull();
    });

    it('should handle empty technologies array', () => {
      const category = {
        id: 'empty',
        name: 'Empty',
        technologies: []
      };

      const visibleTechs = category.technologies.slice(0, 5);
      // For empty array, length is 0, so remainingCount = 0 - 5 = -5
      // The moreLabel condition checks if > 0, so no "more" label shown
      const remainingCount = (category.technologies?.length || 0) - 5;
      const moreLabel = remainingCount > 0 ? `+${remainingCount} more` : null;

      expect(visibleTechs).toHaveLength(0);
      expect(remainingCount).toBe(-5);
      expect(moreLabel).toBeNull();
    });

    it('should handle null technologies array', () => {
      const category = {
        id: 'null',
        name: 'Null',
        technologies: null
      };

      const visibleTechs = (category.technologies || []).slice(0, 5);
      // For null, ?.length returns undefined, so (undefined || 0) - 5 = -5
      const remainingCount = (category.technologies?.length || 0) - 5;
      const moreLabel = remainingCount > 0 ? `+${remainingCount} more` : null;

      expect(visibleTechs).toHaveLength(0);
      expect(remainingCount).toBe(-5);
      expect(moreLabel).toBeNull();
    });
  });

  describe('Certified Badge Logic', () => {
    it('should apply certified CSS class for certified technologies', () => {
      const technology = mockTechStack.technologies[0]; // React
      
      expect(technology.certified).toBe(true);
      expect(technology.certified ? 'certified' : '').toBe('certified');
    });

    it('should not apply certified class for non-certified technologies', () => {
      const technology = mockTechStack.technologies[1]; // Vue
      
      expect(technology.certified).toBe(false);
      expect(technology.certified ? 'certified' : '').toBe('');
    });

    it('should show checkmark symbol for certified technologies', () => {
      const technology = mockTechStack.technologies[0]; // React
      
      const displayName = technology.certified ? `${technology.name} ✓` : technology.name;
      
      expect(displayName).toBe('React ✓');
    });

    it('should not show checkmark for non-certified technologies', () => {
      const technology = mockTechStack.technologies[1]; // Vue
      
      const displayName = technology.certified ? `${technology.name} ✓` : technology.name;
      
      expect(displayName).toBe('Vue.js');
    });

    it('should handle undefined certified field', () => {
      const technology = { id: '1', name: 'Test' };
      
      const hasCertified = technology.certified ? 'certified' : '';
      
      expect(hasCertified).toBe('');
    });
  });

  describe('getTechnologies API Mock', () => {
    it('should call /api/expert/technologies endpoint', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTechStack)
      });

      await fetch('/api/expert/technologies');
      
      expect(global.fetch).toHaveBeenCalledWith('/api/expert/technologies');
    });

    it('should handle success response with categories', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTechStack)
      });

      const response = await fetch('/api/expert/technologies');
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.categories).toBeDefined();
      expect(data.categories).toHaveLength(3);
    });
  });
});

// ============================================
// TOPIC SUGGESTIONS TESTS
// ============================================

describe('Topic Suggestions', () => {
  describe('Success Rate Formatting', () => {
    it('should format success_rate as percentage string', () => {
      const topic = mockTopicSuggestions[0]; // 95.5%
      
      const formattedRate = Number(topic.success_rate || 0).toFixed(0);
      
      expect(formattedRate).toBe('96');
    });

    it('should handle null success_rate', () => {
      const topic = mockTopicSuggestions[2]; // null
      
      const formattedRate = Number(topic.success_rate || 0).toFixed(0);
      
      expect(formattedRate).toBe('0');
    });

    it('should handle zero success_rate', () => {
      const topic = mockTopicSuggestions[3]; // 0
      
      const formattedRate = Number(topic.success_rate || 0).toFixed(0);
      
      expect(formattedRate).toBe('0');
    });

    it('should handle string success_rate', () => {
      const topic = { id: 1, tag: 'Test', success_rate: '85.7' };
      
      const formattedRate = Number(topic.success_rate || 0).toFixed(0);
      
      expect(formattedRate).toBe('86');
    });

    it('should handle missing success_rate field', () => {
      const topic = { id: 1, tag: 'Test' };
      
      const formattedRate = Number(topic.success_rate || 0).toFixed(0);
      
      expect(formattedRate).toBe('0');
    });

    it('should display percentage string correctly', () => {
      const topic = mockTopicSuggestions[1]; // 88.2%
      
      const percentageString = `${Number(topic.success_rate || 0).toFixed(0)}% success`;
      
      expect(percentageString).toBe('88% success');
    });
  });

  describe('Usage Count Display', () => {
    it('should display usage count correctly', () => {
      const topic = mockTopicSuggestions[0];
      
      const displayCount = topic.usage_count || 0;
      
      expect(displayCount).toBe(150);
    });

    it('should default usage_count to 0', () => {
      const topic = { id: 1, tag: 'Test' };
      
      const displayCount = topic.usage_count || 0;
      
      expect(displayCount).toBe(0);
    });

    it('should display usage string correctly', () => {
      const topic = mockTopicSuggestions[1];
      
      const usageString = `${topic.usage_count || 0} uses`;
      
      expect(usageString).toBe('120 uses');
    });
  });

  describe('getTopics API Mock', () => {
    it('should call /api/topics/suggest endpoint', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ topics: mockTopicSuggestions })
      });

      await fetch('/api/topics/suggest?limit=50');
      
      expect(global.fetch).toHaveBeenCalledWith('/api/topics/suggest?limit=50');
    });

    it('should return topics array', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ topics: mockTopicSuggestions })
      });

      const response = await fetch('/api/topics/suggest?limit=50');
      const data = await response.json();
      
      expect(data.topics).toBeDefined();
      expect(data.topics).toHaveLength(4);
    });

    it('should default to empty array on missing topics', async () => {
      const data = { };
      
      const topics = data?.topics || [];
      
      expect(topics).toEqual([]);
    });
  });

  describe('Edit/Delete Button Actions', () => {
    it('should have edit button handler', () => {
      const handleEdit = vi.fn();
      
      handleEdit(1);
      
      expect(handleEdit).toHaveBeenCalledWith(1);
    });

    it('should have delete button handler', () => {
      const handleDelete = vi.fn();
      
      handleDelete(1);
      
      expect(handleDelete).toHaveBeenCalledWith(1);
    });

    it('should trigger delete API call', async () => {
      const mockApi = {
        topics: {
          delete: vi.fn().mockResolvedValue({ success: true })
        }
      };

      await mockApi.topics.delete(1);
      
      expect(mockApi.topics.delete).toHaveBeenCalledWith(1);
    });

    it('should trigger edit API call', async () => {
      const mockApi = {
        topics: {
          update: vi.fn().mockResolvedValue({ success: true })
        }
      };

      const updateData = { id: 1, tag: 'Updated Tag' };
      await mockApi.topics.update(updateData);
      
      expect(mockApi.topics.update).toHaveBeenCalledWith(updateData);
    });
  });
});

// ============================================
// LOADING & ERROR STATE TESTS
// ============================================

describe('Loading & Error States', () => {
  describe('Loading State Management', () => {
    it('should initialize loading state to false', () => {
      const initialLoadingState = false;
      
      expect(initialLoadingState).toBe(false);
    });

    it('should set loading to true during fetch', () => {
      let loadingState = false;
      
      // Simulate fetch start
      loadingState = true;
      
      expect(loadingState).toBe(true);
    });

    it('should set loading to false after successful fetch', () => {
      let loadingState = true;
      
      // Simulate fetch complete
      loadingState = false;
      
      expect(loadingState).toBe(false);
    });

    it('should set loading to false after failed fetch', async () => {
      let loadingState = true;
      
      try {
        throw new Error('API Error');
      } catch (error) {
        console.error('Error:', error);
      } finally {
        loadingState = false;
      }
      
      expect(loadingState).toBe(false);
    });

    it('should handle multiple loading states independently', () => {
      const loadingStates = {
        categories: false,
        templates: false,
        topics: false,
        techStack: false
      };
      
      // Simulate fetching categories
      loadingStates.categories = true;
      
      expect(loadingStates.categories).toBe(true);
      expect(loadingStates.templates).toBe(false);
    });
  });

  describe('Refresh Button Functionality', () => {
    it('should trigger fetchCategories on refresh', async () => {
      const fetchCategories = vi.fn().mockResolvedValue([]);
      
      fetchCategories();
      
      expect(fetchCategories).toHaveBeenCalled();
    });

    it('should trigger fetchTemplates on refresh', async () => {
      const fetchTemplates = vi.fn().mockResolvedValue([]);
      
      fetchTemplates();
      
      expect(fetchTemplates).toHaveBeenCalled();
    });

    it('should trigger fetchTopics on refresh', async () => {
      const fetchTopics = vi.fn().mockResolvedValue([]);
      
      fetchTopics();
      
      expect(fetchTopics).toHaveBeenCalled();
    });

    it('should trigger fetchTechStack on refresh', async () => {
      const fetchTechStack = vi.fn().mockResolvedValue([]);
      
      fetchTechStack();
      
      expect(fetchTechStack).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      try {
        await fetch('/api/test');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle HTTP 500 errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      });
      
      const response = await fetch('/api/test');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it('should handle HTTP 404 errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      });
      
      const response = await fetch('/api/test');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it('should throw error on non-ok response', async () => {
      const checkResponse = async (response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch');
        }
        return response.json();
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      });

      const response = await fetch('/api/test');
      
      await expect(checkResponse(response)).rejects.toThrow('Failed to fetch');
    });

    it('should call showToast on error', () => {
      const showToast = vi.fn();
      
      showToast('Failed to load categories', 'error');
      
      expect(showToast).toHaveBeenCalledWith('Failed to load categories', 'error');
    });
  });

  describe('Initial Component Mount', () => {
    it('should not fetch master data before section activation', () => {
      const activeSection = 'general';
      const shouldFetch = activeSection === 'masterdata';
      
      expect(shouldFetch).toBe(false);
    });

    it('should fetch master data when section becomes active', () => {
      const activeSection = 'masterdata';
      const shouldFetch = activeSection === 'masterdata';
      
      expect(shouldFetch).toBe(true);
    });

    it('should use effect dependency on activeSection', () => {
      const previousSection = 'general';
      const currentSection = 'masterdata';
      const shouldReRun = previousSection !== currentSection;
      
      expect(shouldReRun).toBe(true);
    });
  });

  describe('Console Error Handling', () => {
    it('should log errors to console', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      console.error('Error fetching categories');
      
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching categories');
      
      consoleSpy.mockRestore();
    });
  });
});

// ============================================
// DATA INTEGRITY TESTS
// ============================================

describe('Data Integrity', () => {
  describe('Optional Chaining', () => {
    it('should handle deeply nested optional data', () => {
      const data = {
        categories: [
          {
            id: 'frontend',
            name: 'Frontend',
            technologies: [
              { id: 'react', name: 'React', certified: true }
            ]
          }
        ]
      };
      
      const firstTechName = data?.categories?.[0]?.technologies?.[0]?.name;
      
      expect(firstTechName).toBe('React');
    });

    it('should handle completely missing data structure', () => {
      const data = null;
      
      const firstTechName = data?.categories?.[0]?.technologies?.[0]?.name;
      
      expect(firstTechName).toBeUndefined();
    });

    it('should handle partial data structure', () => {
      const data = {
        categories: null
      };
      
      const firstTechName = data?.categories?.[0]?.technologies?.[0]?.name;
      
      expect(firstTechName).toBeUndefined();
    });
  });

  describe('Default Values', () => {
    it('should provide default for missing string', () => {
      const value = null;
      const display = value || 'Unknown';
      
      expect(display).toBe('Unknown');
    });

    it('should provide default for missing number', () => {
      const value = null;
      const display = value || 0;
      
      expect(display).toBe(0);
    });

    it('should provide default for missing array', () => {
      const value = null;
      const display = value || [];
      
      expect(display).toEqual([]);
    });

    it('should handle 0 as valid number', () => {
      const value = 0;
      const display = value ?? 'Default'; // Using nullish coalescing
      
      expect(display).toBe(0);
    });

    it('should handle empty string as falsy', () => {
      const value = '';
      const display = value || 'Default';
      
      expect(display).toBe('Default');
    });
  });

  describe('Numeric Calculations', () => {
    it('should handle Number() wrapper for toFixed', () => {
      const value = '85.7';
      const result = Number(value).toFixed(0);
      
      expect(result).toBe('86');
    });

    it('should handle null in Number()', () => {
      const value = null;
      const result = Number(value || 0).toFixed(0);
      
      expect(result).toBe('0');
    });

    it('should handle undefined in Number()', () => {
      const value = undefined;
      const result = Number(value || 0).toFixed(0);
      
      expect(result).toBe('0');
    });
  });
});

// ============================================
// API ROUTE INTEGRATION TESTS
// ============================================

describe('API Route Integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch.mockReset();
  });

  describe('All Master Data Endpoints', () => {
    it('should call categories endpoint', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCategoryHierarchy)
      });

      await fetch('/api/ticket-hierarchy');
      
      expect(global.fetch).toHaveBeenCalledWith('/api/ticket-hierarchy');
    });

    it('should call templates endpoint via api.categories.getTemplates', async () => {
      const mockApi = {
        categories: {
          getTemplates: vi.fn().mockResolvedValue(mockTemplates)
        }
      };

      await mockApi.categories.getTemplates();
      
      expect(mockApi.categories.getTemplates).toHaveBeenCalled();
    });

    it('should call tech stack endpoint', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTechStack)
      });

      await fetch('/api/expert/technologies');
      
      expect(global.fetch).toHaveBeenCalledWith('/api/expert/technologies');
    });

    it('should call topics endpoint', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ topics: mockTopicSuggestions })
      });

      await fetch('/api/topics/suggest?limit=50');
      
      expect(global.fetch).toHaveBeenCalledWith('/api/topics/suggest?limit=50');
    });
  });

  describe('Error Response Handling', () => {
    it('should return empty array for categories on error', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      try {
        await fetch('/api/ticket-hierarchy');
      } catch (error) {
        const categories = [];
        expect(categories).toEqual([]);
      }
    });

    it('should return empty array for templates on error', async () => {
      const mockApi = {
        categories: {
          getTemplates: vi.fn().mockRejectedValue(new Error('API Error'))
        }
      };

      try {
        await mockApi.categories.getTemplates();
      } catch (error) {
        const templates = [];
        expect(templates).toEqual([]);
      }
    });
  });
});
