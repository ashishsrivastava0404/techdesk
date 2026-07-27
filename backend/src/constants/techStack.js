/**
 * Tech Stack Constants
 * 
 * Single source of truth for all technologies and skills that experts can select.
 * Used for:
 * - Expert profile expertise selection
 * - Ticket tech stack tagging
 * - Skill-based expert matching
 * - Qualification verification
 */

/**
 * Tech stack categories with their technologies
 */
export const TECH_STACK = {
  // ==========================================================================
  // PROGRAMMING LANGUAGES
  // ==========================================================================
  languages: {
    id: 'languages',
    name: 'Programming Languages',
    icon: '💻',
    technologies: {
      javascript: { id: 'javascript', name: 'JavaScript', category: 'frontend', certified: true },
      typescript: { id: 'typescript', name: 'TypeScript', category: 'frontend', certified: true },
      python: { id: 'python', name: 'Python', category: 'backend', certified: true },
      java: { id: 'java', name: 'Java', category: 'backend', certified: true },
      csharp: { id: 'csharp', name: 'C#', category: 'backend', certified: true },
      go: { id: 'go', name: 'Go', category: 'backend', certified: true },
      rust: { id: 'rust', name: 'Rust', category: 'backend', certified: true },
      php: { id: 'php', name: 'PHP', category: 'backend', certified: false },
      ruby: { id: 'ruby', name: 'Ruby', category: 'backend', certified: false },
      swift: { id: 'swift', name: 'Swift', category: 'mobile', certified: true },
      kotlin: { id: 'kotlin', name: 'Kotlin', category: 'mobile', certified: true },
      dart: { id: 'dart', name: 'Dart', category: 'mobile', certified: false },
      cpp: { id: 'cpp', name: 'C++', category: 'systems', certified: true },
      c: { id: 'c', name: 'C', category: 'systems', certified: true },
      sql: { id: 'sql', name: 'SQL', category: 'database', certified: true },
      r: { id: 'r', name: 'R', category: 'data', certified: false },
      matlab: { id: 'matlab', name: 'MATLAB', category: 'data', certified: false }
    }
  },

  // ==========================================================================
  // FRONTEND FRAMEWORKS
  // ==========================================================================
  frontend: {
    id: 'frontend',
    name: 'Frontend Frameworks',
    icon: '🎨',
    technologies: {
      react: { id: 'react', name: 'React', category: 'framework', certified: true },
      vue: { id: 'vue', name: 'Vue.js', category: 'framework', certified: true },
      angular: { id: 'angular', name: 'Angular', category: 'framework', certified: true },
      nextjs: { id: 'nextjs', name: 'Next.js', category: 'framework', certified: true },
      nuxt: { id: 'nuxt', name: 'Nuxt.js', category: 'framework', certified: false },
      svelte: { id: 'svelte', name: 'Svelte', category: 'framework', certified: false },
      jquery: { id: 'jquery', name: 'jQuery', category: 'library', certified: false },
      bootstrap: { id: 'bootstrap', name: 'Bootstrap', category: 'css', certified: false },
      tailwind: { id: 'tailwind', name: 'Tailwind CSS', category: 'css', certified: true },
      sass: { id: 'sass', name: 'Sass/SCSS', category: 'css', certified: false },
      materialui: { id: 'materialui', name: 'Material UI', category: 'component', certified: false },
      antdesign: { id: 'antdesign', name: 'Ant Design', category: 'component', certified: false }
    }
  },

  // ==========================================================================
  // BACKEND FRAMEWORKS
  // ==========================================================================
  backend: {
    id: 'backend',
    name: 'Backend Frameworks',
    icon: '⚙️',
    technologies: {
      nodejs: { id: 'nodejs', name: 'Node.js', category: 'runtime', certified: true },
      express: { id: 'express', name: 'Express.js', category: 'framework', certified: true },
      nestjs: { id: 'nestjs', name: 'NestJS', category: 'framework', certified: true },
      koa: { id: 'koa', name: 'Koa.js', category: 'framework', certified: false },
      django: { id: 'django', name: 'Django', category: 'framework', certified: true },
      flask: { id: 'flask', name: 'Flask', category: 'framework', certified: false },
      fastapi: { id: 'fastapi', name: 'FastAPI', category: 'framework', certified: true },
      spring: { id: 'spring', name: 'Spring Boot', category: 'framework', certified: true },
      rails: { id: 'rails', name: 'Ruby on Rails', category: 'framework', certified: true },
      laravel: { id: 'laravel', name: 'Laravel', category: 'framework', certified: true },
      dotnet: { id: 'dotnet', name: '.NET Core', category: 'framework', certified: true },
      graphql: { id: 'graphql', name: 'GraphQL', category: 'api', certified: true },
      rest: { id: 'rest', name: 'REST API', category: 'api', certified: true },
      websockets: { id: 'websockets', name: 'WebSockets', category: 'api', certified: false }
    }
  },

  // ==========================================================================
  // DATABASES
  // ==========================================================================
  databases: {
    id: 'databases',
    name: 'Databases',
    icon: '🗄️',
    technologies: {
      mysql: { id: 'mysql', name: 'MySQL', category: 'relational', certified: true },
      postgresql: { id: 'postgresql', name: 'PostgreSQL', category: 'relational', certified: true },
      mssql: { id: 'mssql', name: 'MS SQL Server', category: 'relational', certified: true },
      oracle: { id: 'oracle', name: 'Oracle', category: 'relational', certified: true },
      mariadb: { id: 'mariadb', name: 'MariaDB', category: 'relational', certified: false },
      sqlite: { id: 'sqlite', name: 'SQLite', category: 'relational', certified: false },
      mongodb: { id: 'mongodb', name: 'MongoDB', category: 'nosql', certified: true },
      redis: { id: 'redis', name: 'Redis', category: 'nosql', certified: true },
      elasticsearch: { id: 'elasticsearch', name: 'Elasticsearch', category: 'nosql', certified: true },
      dynamodb: { id: 'dynamodb', name: 'DynamoDB', category: 'nosql', certified: true },
      cassandra: { id: 'cassandra', name: 'Cassandra', category: 'nosql', certified: false },
      couchdb: { id: 'couchdb', name: 'CouchDB', category: 'nosql', certified: false },
      neo4j: { id: 'neo4j', name: 'Neo4j', category: 'graph', certified: false },
      firebase: { id: 'firebase', name: 'Firebase', category: 'realtime', certified: true },
      supabase: { id: 'supabase', name: 'Supabase', category: 'realtime', certified: false }
    }
  },

  // ==========================================================================
  // CLOUD & DEVOPS
  // ==========================================================================
  cloud: {
    id: 'cloud',
    name: 'Cloud & DevOps',
    icon: '☁️',
    technologies: {
      aws: { id: 'aws', name: 'AWS', category: 'provider', certified: true },
      azure: { id: 'azure', name: 'Azure', category: 'provider', certified: true },
      gcp: { id: 'gcp', name: 'Google Cloud', category: 'provider', certified: true },
      digitalocean: { id: 'digitalocean', name: 'DigitalOcean', category: 'provider', certified: false },
      heroku: { id: 'heroku', name: 'Heroku', category: 'paas', certified: false },
      vercel: { id: 'vercel', name: 'Vercel', category: 'paas', certified: false },
      netlify: { id: 'netlify', name: 'Netlify', category: 'paas', certified: false },
      docker: { id: 'docker', name: 'Docker', category: 'container', certified: true },
      kubernetes: { id: 'kubernetes', name: 'Kubernetes', category: 'orchestration', certified: true },
      terraform: { id: 'terraform', name: 'Terraform', category: 'iac', certified: true },
      ansible: { id: 'ansible', name: 'Ansible', category: 'automation', certified: true },
      jenkins: { id: 'jenkins', name: 'Jenkins', category: 'ci_cd', certified: true },
      github_actions: { id: 'github_actions', name: 'GitHub Actions', category: 'ci_cd', certified: true },
      gitlab_ci: { id: 'gitlab_ci', name: 'GitLab CI', category: 'ci_cd', certified: false },
      circleci: { id: 'circleci', name: 'CircleCI', category: 'ci_cd', certified: false },
      datadog: { id: 'datadog', name: 'Datadog', category: 'monitoring', certified: true },
      prometheus: { id: 'prometheus', name: 'Prometheus', category: 'monitoring', certified: true },
      grafana: { id: 'grafana', name: 'Grafana', category: 'monitoring', certified: true }
    }
  },

  // ==========================================================================
  // MOBILE DEVELOPMENT
  // ==========================================================================
  mobile: {
    id: 'mobile',
    name: 'Mobile Development',
    icon: '📱',
    technologies: {
      reactnative: { id: 'reactnative', name: 'React Native', category: 'framework', certified: true },
      flutter: { id: 'flutter', name: 'Flutter', category: 'framework', certified: true },
      ionic: { id: 'ionic', name: 'Ionic', category: 'framework', certified: false },
      native_android: { id: 'native_android', name: 'Native Android', category: 'native', certified: true },
      native_ios: { id: 'native_ios', name: 'Native iOS', category: 'native', certified: true },
      xamarin: { id: 'xamarin', name: 'Xamarin', category: 'framework', certified: false },
      expo: { id: 'expo', name: 'Expo', category: 'tool', certified: false }
    }
  },

  // ==========================================================================
  // DATA & ANALYTICS
  // ==========================================================================
  data: {
    id: 'data',
    name: 'Data & Analytics',
    icon: '📊',
    technologies: {
      python_data: { id: 'python_data', name: 'Python (Data)', category: 'language', certified: true },
      pandas: { id: 'pandas', name: 'Pandas', category: 'library', certified: true },
      numpy: { id: 'numpy', name: 'NumPy', category: 'library', certified: false },
      scipy: { id: 'scipy', name: 'SciPy', category: 'library', certified: false },
      sklearn: { id: 'sklearn', name: 'Scikit-learn', category: 'ml', certified: true },
      tensorflow: { id: 'tensorflow', name: 'TensorFlow', category: 'ml', certified: true },
      pytorch: { id: 'pytorch', name: 'PyTorch', category: 'ml', certified: true },
      apache_spark: { id: 'apache_spark', name: 'Apache Spark', category: 'processing', certified: true },
      kafka: { id: 'kafka', name: 'Apache Kafka', category: 'streaming', certified: true },
      airflow: { id: 'airflow', name: 'Airflow', category: 'orchestration', certified: true },
      dbt: { id: 'dbt', name: 'dbt', category: 'transform', certified: true },
      tableau: { id: 'tableau', name: 'Tableau', category: 'visualization', certified: true },
      powerbi: { id: 'powerbi', name: 'Power BI', category: 'visualization', certified: true },
      looker: { id: 'looker', name: 'Looker', category: 'visualization', certified: false }
    }
  },

  // ==========================================================================
  // SECURITY
  // ==========================================================================
  security: {
    id: 'security',
    name: 'Security',
    icon: '🔒',
    technologies: {
      oauth: { id: 'oauth', name: 'OAuth 2.0', category: 'auth', certified: true },
      jwt: { id: 'jwt', name: 'JWT', category: 'auth', certified: true },
      ssl_tls: { id: 'ssl_tls', name: 'SSL/TLS', category: 'encryption', certified: true },
      penetration_testing: { id: 'penetration_testing', name: 'Penetration Testing', category: 'testing', certified: true },
     owasp: { id: 'owasp', name: 'OWASP', category: 'framework', certified: true },
      saST: { id: 'sast', name: 'SAST/DAST', category: 'tools', certified: false },
      siem: { id: 'siem', name: 'SIEM', category: 'monitoring', certified: false },
      vpn_security: { id: 'vpn_security', name: 'VPN Security', category: 'network', certified: false }
    }
  },

  // ==========================================================================
  // CMS & E-COMMERCE
  // ==========================================================================
  cms: {
    id: 'cms',
    name: 'CMS & E-Commerce',
    icon: '🛒',
    technologies: {
      wordpress: { id: 'wordpress', name: 'WordPress', category: 'cms', certified: true },
      drupal: { id: 'drupal', name: 'Drupal', category: 'cms', certified: true },
      shopify: { id: 'shopify', name: 'Shopify', category: 'ecommerce', certified: true },
      woocommerce: { id: 'woocommerce', name: 'WooCommerce', category: 'ecommerce', certified: true },
      magento: { id: 'magento', name: 'Magento', category: 'ecommerce', certified: true },
      contentful: { id: 'contentful', name: 'Contentful', category: 'headless', certified: false },
      strapi: { id: 'strapi', name: 'Strapi', category: 'headless', certified: false },
      sanity: { id: 'sanity', name: 'Sanity', category: 'headless', certified: false }
    }
  },

  // ==========================================================================
  // COLLABORATION & TOOLS
  // ==========================================================================
  tools: {
    id: 'tools',
    name: 'Collaboration & Tools',
    icon: '🔧',
    technologies: {
      git: { id: 'git', name: 'Git', category: 'vcs', certified: true },
      github: { id: 'github', name: 'GitHub', category: 'platform', certified: true },
      gitlab: { id: 'gitlab', name: 'GitLab', category: 'platform', certified: true },
      bitbucket: { id: 'bitbucket', name: 'Bitbucket', category: 'platform', certified: false },
      jira: { id: 'jira', name: 'Jira', category: 'project', certified: true },
      confluence: { id: 'confluence', name: 'Confluence', category: 'wiki', certified: true },
      slack: { id: 'slack', name: 'Slack', category: 'communication', certified: true },
      notion: { id: 'notion', name: 'Notion', category: 'wiki', certified: false },
      figma: { id: 'figma', name: 'Figma', category: 'design', certified: true },
      adobe_xd: { id: 'adobe_xd', name: 'Adobe XD', category: 'design', certified: false }
    }
  }
};

/**
 * Expertise levels
 */
export const EXPERTISE_LEVELS = {
  beginner: { id: 'beginner', name: 'Beginner', minYears: 0, color: '#6b7280' },
  intermediate: { id: 'intermediate', name: 'Intermediate', minYears: 1, color: '#3b82f6' },
  advanced: { id: 'advanced', name: 'Advanced', minYears: 3, color: '#8b5cf6' },
  expert: { id: 'expert', name: 'Expert', minYears: 5, color: '#f59e0b' },
  certified: { id: 'certified', name: 'Certified', minYears: 3, color: '#10b981', badge: '✓' }
};

/**
 * Complexity tiers for tickets
 */
export const COMPLEXITY_TIERS = {
  simple: { 
    id: 'simple', 
    name: 'Simple', 
    maxRating: 2.5, 
    maxYears: 2,
    description: 'Basic issues that can be resolved quickly' 
  },
  moderate: { 
    id: 'moderate', 
    name: 'Moderate', 
    maxRating: 3.5, 
    maxYears: 4,
    description: 'Issues requiring some expertise' 
  },
  complex: { 
    id: 'complex', 
    name: 'Complex', 
    maxRating: 4.5, 
    maxYears: 6,
    description: 'Technical issues requiring significant expertise' 
  },
  critical: { 
    id: 'critical', 
    name: 'Critical', 
    maxRating: 5.0, 
    maxYears: 10,
    description: 'Mission-critical issues requiring top experts' 
  }
};

/**
 * Get all technologies flattened
 */
export function getAllTechnologies() {
  const technologies = [];
  
  Object.values(TECH_STACK).forEach(category => {
    Object.values(category.technologies).forEach(tech => {
      technologies.push({
        ...tech,
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon
      });
    });
  });
  
  return technologies;
}

/**
 * Get technologies by category
 */
export function getTechnologiesByCategory(categoryId) {
  const category = TECH_STACK[categoryId];
  if (!category) return [];
  
  return Object.values(category.technologies).map(tech => ({
    ...tech,
    categoryId: category.id,
    categoryName: category.name,
    categoryIcon: category.icon
  }));
}

/**
 * Get technology by ID
 */
export function getTechnology(techId) {
  for (const category of Object.values(TECH_STACK)) {
    const tech = category.technologies[techId];
    if (tech) {
      return {
        ...tech,
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon
      };
    }
  }
  return null;
}

/**
 * Check if technology requires certification
 */
export function requiresCertification(techId) {
  const tech = getTechnology(techId);
  return tech?.certified === true;
}

/**
 * Get certification-eligible technologies
 */
export function getCertifiableTechnologies() {
  return getAllTechnologies().filter(tech => tech.certified);
}

/**
 * Validate expertise level for complexity tier
 * Returns true if the expertise level can handle the given complexity tier
 */
export function canHandleComplexity(level, tier) {
  const levelInfo = EXPERTISE_LEVELS[level];
  const tierInfo = COMPLEXITY_TIERS[tier];
  
  if (!levelInfo || !tierInfo) return false;
  
  // Experience levels: beginner=0, intermediate=1, advanced=3, expert=5, certified=3
  // Complexity tiers: simple=0-2, moderate=0-4, complex=0-6, critical=0-10
  // A beginner (0 years) can handle simple (max 2 years)
  // An intermediate (1 year) can handle simple and moderate (max 4 years)
  // An advanced (3 years) can handle simple, moderate, and complex (max 6 years)
  // An expert (5 years) can handle all including critical (max 10 years)
  return levelInfo.minYears <= tierInfo.maxYears;
}

export default TECH_STACK;
