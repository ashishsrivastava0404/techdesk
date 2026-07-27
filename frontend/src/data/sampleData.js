/**
 * Sample Data for Frontend Testing and Demo
 * These mock data objects can be used to test components without a backend
 */

export const sampleUsers = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@techdesk.com',
    role: 'admin',
    status: 'active',
    bio: 'System administrator',
    avatar_url: null
  },
  {
    id: 2,
    name: 'John Smith',
    email: 'john@example.com',
    role: 'customer',
    status: 'active',
    bio: 'Software developer interested in DevOps',
    avatar_url: null
  },
  {
    id: 5,
    name: 'Emily Chen',
    email: 'emily@example.com',
    role: 'tech',
    status: 'active',
    bio: 'Full-stack developer with 5 years experience in React and Node.js',
    hourly_rate: 75.00,
    rating: 4.8,
    ticketsResolved: 43
  },
  {
    id: 6,
    name: 'David Lee',
    email: 'david@example.com',
    role: 'tech',
    status: 'active',
    bio: 'DevOps engineer specializing in AWS and Kubernetes',
    hourly_rate: 85.00,
    rating: 4.9,
    ticketsResolved: 55
  }
];

export const sampleTickets = [
  {
    id: 1,
    title: 'API returning 500 error on user endpoint',
    description: 'Getting Internal Server Error when calling the /api/users endpoint. Error started after the last deployment.',
    priority: 'high',
    status: 'open',
    customer_name: 'John Smith',
    category: 'Software Development',
    base_pay: 50.00,
    environment: 'production',
    tags: ['api', 'error', 'urgent'],
    created_at: new Date().toISOString(),
    sla_status: 'at_risk'
  },
  {
    id: 2,
    title: 'Need help setting up Docker compose',
    description: 'I want to set up a multi-container Docker application with PostgreSQL, Redis, and Node.js. Need help with the compose file.',
    priority: 'normal',
    status: 'open',
    customer_name: 'Sarah Johnson',
    category: 'DevOps & Infrastructure',
    base_pay: 35.00,
    environment: 'staging',
    tags: ['docker', 'compose'],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    sla_status: 'on_track'
  },
  {
    id: 3,
    title: 'Database query optimization needed',
    description: 'Our user search query is taking over 5 seconds. We have indexes but need help optimizing the query plan.',
    priority: 'high',
    status: 'in_progress',
    customer_name: 'Mike Wilson',
    tech_name: 'Lisa Brown',
    category: 'Database',
    base_pay: 60.00,
    environment: 'production',
    tags: ['database', 'performance', 'optimization'],
    created_at: new Date(Date.now() - 172800000).toISOString(),
    satisfaction_score: 5
  },
  {
    id: 4,
    title: 'React app memory leak issue',
    description: 'The React dashboard memory usage keeps growing until the browser crashes. Need help identifying the leak.',
    priority: 'urgent',
    status: 'open',
    customer_name: 'Emily Chen',
    category: 'Software Development',
    base_pay: 75.00,
    environment: 'production',
    tags: ['react', 'memory-leak'],
    created_at: new Date(Date.now() - 43200000).toISOString(),
    sla_status: 'at_risk'
  },
  {
    id: 5,
    title: 'AWS Lambda cold start optimization',
    description: 'Our Lambda functions have slow cold starts affecting user experience. Looking for optimization strategies.',
    priority: 'normal',
    status: 'open',
    customer_name: 'David Lee',
    category: 'Cloud Services',
    base_pay: 55.00,
    environment: 'staging',
    tags: ['aws', 'lambda', 'performance'],
    created_at: new Date(Date.now() - 259200000).toISOString(),
    sla_status: 'on_track'
  }
];

export const sampleCategories = [
  { id: 1, name: 'Software Development', icon: '💻', color: '#6366f1', count: 4 },
  { id: 2, name: 'DevOps & Infrastructure', icon: '🚀', color: '#10b981', count: 2 },
  { id: 3, name: 'Database', icon: '🗄️', color: '#f59e0b', count: 1 },
  { id: 4, name: 'Security', icon: '🔒', color: '#ef4444', count: 1 },
  { id: 5, name: 'Cloud Services', icon: '☁️', color: '#3b82f6', count: 1 },
  { id: 6, name: 'Mobile Development', icon: '📱', color: '#8b5cf6', count: 1 },
  { id: 7, name: 'UI/UX Design', icon: '🎨', color: '#ec4899', count: 0 },
  { id: 8, name: 'API Integration', icon: '🔗', color: '#06b6d4', count: 1 },
  { id: 9, name: 'Performance', icon: '⚡', color: '#84cc16', count: 0 },
  { id: 10, name: 'General Support', icon: '❓', color: '#64748b', count: 0 }
];

export const sampleTemplates = [
  {
    id: 1,
    name: 'Bug Report',
    description: 'Report a bug in your application',
    use_count: 45,
    is_active: true,
    category: 'Software Development'
  },
  {
    id: 2,
    name: 'Feature Request',
    description: 'Request a new feature',
    use_count: 32,
    is_active: true,
    category: 'Software Development'
  },
  {
    id: 3,
    name: 'API Integration Issue',
    description: 'Report an API integration problem',
    use_count: 28,
    is_active: true,
    category: 'API Integration'
  },
  {
    id: 4,
    name: 'Database Query Help',
    description: 'Get help with a database query',
    use_count: 22,
    is_active: true,
    category: 'Database'
  },
  {
    id: 5,
    name: 'Security Vulnerability',
    description: 'Report a security issue',
    use_count: 8,
    is_active: true,
    category: 'Security'
  },
  {
    id: 6,
    name: 'Performance Issue',
    description: 'Report a performance problem',
    use_count: 19,
    is_active: true,
    category: 'Performance'
  }
];

export const sampleTechStack = {
  categories: [
    { id: 'frontend', name: 'Frontend Frameworks', icon: '🎨', count: 5 },
    { id: 'backend', name: 'Backend Frameworks', icon: '⚙️', count: 4 },
    { id: 'database', name: 'Databases', icon: '🗄️', count: 4 },
    { id: 'cloud', name: 'Cloud & DevOps', icon: '☁️', count: 5 },
    { id: 'mobile', name: 'Mobile Development', icon: '📱', count: 3 }
  ],
  technologies: [
    // Frontend
    { id: 'react', name: 'React', categoryId: 'frontend', certified: true },
    { id: 'vue', name: 'Vue.js', categoryId: 'frontend', certified: false },
    { id: 'angular', name: 'Angular', categoryId: 'frontend', certified: true },
    { id: 'nextjs', name: 'Next.js', categoryId: 'frontend', certified: true },
    { id: 'svelte', name: 'Svelte', categoryId: 'frontend', certified: false },
    // Backend
    { id: 'nodejs', name: 'Node.js', categoryId: 'backend', certified: true },
    { id: 'python', name: 'Python', categoryId: 'backend', certified: true },
    { id: 'django', name: 'Django', categoryId: 'backend', certified: false },
    { id: 'spring', name: 'Spring Boot', categoryId: 'backend', certified: true },
    // Database
    { id: 'mysql', name: 'MySQL', categoryId: 'database', certified: true },
    { id: 'postgresql', name: 'PostgreSQL', categoryId: 'database', certified: true },
    { id: 'mongodb', name: 'MongoDB', categoryId: 'database', certified: false },
    { id: 'redis', name: 'Redis', categoryId: 'database', certified: false },
    // Cloud
    { id: 'aws', name: 'AWS', categoryId: 'cloud', certified: true },
    { id: 'azure', name: 'Azure', categoryId: 'cloud', certified: true },
    { id: 'gcp', name: 'Google Cloud', categoryId: 'cloud', certified: true },
    { id: 'docker', name: 'Docker', categoryId: 'cloud', certified: false },
    { id: 'kubernetes', name: 'Kubernetes', categoryId: 'cloud', certified: true },
    // Mobile
    { id: 'reactnative', name: 'React Native', categoryId: 'mobile', certified: true },
    { id: 'flutter', name: 'Flutter', categoryId: 'mobile', certified: false },
    { id: 'swift', name: 'Swift', categoryId: 'mobile', certified: true }
  ]
};

export const sampleTopicSuggestions = [
  { id: 1, tag: 'API Integration', usage_count: 150, success_rate: 95.5 },
  { id: 2, tag: 'Authentication', usage_count: 120, success_rate: 88.2 },
  { id: 3, tag: 'Database Migration', usage_count: 85, success_rate: 78.3 },
  { id: 4, tag: 'Performance Optimization', usage_count: 72, success_rate: 82.1 },
  { id: 5, tag: 'Docker Setup', usage_count: 65, success_rate: 92.0 },
  { id: 6, tag: 'React Component', usage_count: 58, success_rate: 97.0 },
  { id: 7, tag: 'Node.js Error', usage_count: 52, success_rate: 85.5 },
  { id: 8, tag: 'AWS Configuration', usage_count: 48, success_rate: 80.0 },
  { id: 9, tag: 'Kubernetes Deployment', usage_count: 42, success_rate: 88.0 },
  { id: 10, tag: 'MongoDB Query', usage_count: 38, success_rate: 90.0 }
];

export const sampleNotifications = [
  {
    id: 1,
    type: 'ticket',
    title: 'New ticket assigned',
    message: 'You have been assigned to ticket #3',
    link: '/tickets/3',
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 2,
    type: 'rating',
    title: 'New rating received',
    message: 'John Smith gave you a 5-star rating!',
    link: '/tickets/3',
    is_read: false,
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 3,
    type: 'payment',
    title: 'Payout processed',
    message: 'Your payout of $150.00 has been processed',
    link: '/earnings',
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 4,
    type: 'system',
    title: 'Credit received',
    message: 'You received 50 bonus credits',
    link: '/billing',
    is_read: true,
    created_at: new Date(Date.now() - 172800000).toISOString()
  }
];

export const sampleStats = {
  totalTickets: 156,
  openTickets: 23,
  inProgressTickets: 12,
  resolvedTickets: 121,
  totalEarnings: 4520.00,
  pendingPayout: 320.00,
  averageRating: 4.7,
  totalRatings: 89
};

export const sampleLeaderboard = [
  { rank: 1, name: 'David Lee', rating: 4.9, ticketsResolved: 55, earnings: 1250.00 },
  { rank: 2, name: 'Emily Chen', rating: 4.8, ticketsResolved: 43, earnings: 980.00 },
  { rank: 3, name: 'Lisa Brown', rating: 4.7, ticketsResolved: 38, earnings: 890.00 },
  { rank: 4, name: 'Anna Martinez', rating: 4.6, ticketsResolved: 32, earnings: 750.00 },
  { rank: 5, name: 'James Taylor', rating: 4.5, ticketsResolved: 28, earnings: 650.00 }
];

export const sampleExpertSkills = [
  {
    user_id: 5,
    user_name: 'Emily Chen',
    skills: [
      { techId: 'react', expertiseLevel: 'expert', yearsExperience: 5 },
      { techId: 'nodejs', expertiseLevel: 'advanced', yearsExperience: 4 },
      { techId: 'vue', expertiseLevel: 'intermediate', yearsExperience: 2 }
    ]
  },
  {
    user_id: 6,
    user_name: 'David Lee',
    skills: [
      { techId: 'aws', expertiseLevel: 'certified', yearsExperience: 6 },
      { techId: 'kubernetes', expertiseLevel: 'expert', yearsExperience: 5 },
      { techId: 'docker', expertiseLevel: 'expert', yearsExperience: 5 }
    ]
  },
  {
    user_id: 7,
    user_name: 'Lisa Brown',
    skills: [
      { techId: 'python', expertiseLevel: 'expert', yearsExperience: 6 },
      { techId: 'postgresql', expertiseLevel: 'advanced', yearsExperience: 4 },
      { techId: 'django', expertiseLevel: 'expert', yearsExperience: 5 }
    ]
  }
];

// Helper function to simulate API delay
export const simulateApiDelay = (data, delay = 500) => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay);
  });
};

// Helper function to create mock API responses
export const createMockResponse = (data, success = true) => {
  return simulateApiDelay({
    success,
    data,
    timestamp: new Date().toISOString()
  });
};

export default {
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
};
