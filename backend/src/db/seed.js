/**
 * Database Seed Script
 * Populates the database with sample data for testing and demo purposes
 * 
 * Usage: node src/db/seed.js
 */

import pool from './index.js';
import crypto from 'crypto';

// Use the same hashing as auth.js
function hashPassword(password, salt = null) {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  const connection = await pool.getConnection();
  
  try {
    // ============================================
    // SEED USERS
    // ============================================
    console.log('👥 Seeding users...');
    
    const { hash: adminHash, salt: adminSalt } = hashPassword('password123');
    
    await connection.query(`
      INSERT IGNORE INTO users (name, email, password_hash, password_salt, role, status, bio, hourly_rate) VALUES
      ('Admin User', 'admin@techdesk.com', ?, ?, 'admin', 'active', 'System administrator', 0.00),
      ('John Smith', 'john@example.com', ?, ?, 'customer', 'active', 'Software developer interested in DevOps', 0.00),
      ('Sarah Johnson', 'sarah@example.com', ?, ?, 'customer', 'active', 'Product manager at TechCorp', 0.00),
      ('Mike Wilson', 'mike@example.com', ?, ?, 'customer', 'active', 'Startup founder', 0.00),
      ('Emily Chen', 'emily@example.com', ?, ?, 'tech', 'active', 'Full-stack developer with 5 years experience in React and Node.js', 75.00),
      ('David Lee', 'david@example.com', ?, ?, 'tech', 'active', 'DevOps engineer specializing in AWS and Kubernetes', 85.00),
      ('Lisa Brown', 'lisa@example.com', ?, ?, 'tech', 'active', 'Backend developer expert in Python and Django', 70.00),
      ('James Taylor', 'james@example.com', ?, ?, 'tech', 'active', 'Mobile developer with React Native expertise', 80.00),
      ('Anna Martinez', 'anna@example.com', ?, ?, 'tech', 'active', 'Database administrator and MySQL expert', 90.00),
      ('Chris Anderson', 'chris@example.com', ?, ?, 'tech', 'active', 'Security specialist with OSCP certification', 95.00)
    `, [adminHash, adminSalt, adminHash, adminSalt, adminHash, adminSalt, adminHash, adminSalt, adminHash, adminSalt, adminHash, adminSalt, adminHash, adminSalt, adminHash, adminSalt, adminHash, adminSalt, adminHash, adminSalt]);
    
    console.log('   ✓ 10 users created\n');

    // ============================================
    // SEED TICKET CATEGORIES
    // ============================================
    console.log('📁 Seeding ticket categories...');
    
    await connection.query(`
      INSERT IGNORE INTO ticket_categories (name, description, icon, color, sort_order, is_active) VALUES
      ('Software Development', 'Bugs, features, and code-related issues', '💻', '#6366f1', 1, TRUE),
      ('DevOps & Infrastructure', 'Deployment, CI/CD, and server issues', '🚀', '#10b981', 2, TRUE),
      ('Database', 'Database queries, migrations, and optimization', '🗄️', '#f59e0b', 3, TRUE),
      ('Security', 'Security vulnerabilities and authentication issues', '🔒', '#ef4444', 4, TRUE),
      ('Cloud Services', 'AWS, Azure, GCP, and cloud infrastructure', '☁️', '#3b82f6', 5, TRUE),
      ('Mobile Development', 'iOS, Android, and cross-platform issues', '📱', '#8b5cf6', 6, TRUE),
      ('UI/UX Design', 'Design, layouts, and user experience', '🎨', '#ec4899', 7, TRUE),
      ('API Integration', 'Third-party API connections and webhooks', '🔗', '#06b6d4', 8, TRUE),
      ('Performance', 'Speed optimization and caching', '⚡', '#84cc16', 9, TRUE),
      ('General Support', 'General questions and miscellaneous help', '❓', '#64748b', 10, TRUE)
    `);
    
    console.log('   ✓ 10 categories created\n');

    // ============================================
    // SEED CATEGORY HIERARCHIES
    // ============================================
    console.log('📂 Seeding category hierarchies...');
    
    await connection.query(`
      INSERT IGNORE INTO category_hierarchies (name, parent_id, description, icon, color, sort_order, is_active) VALUES
      ('Software Development', NULL, 'All software development related issues', '💻', '#6366f1', 1, TRUE),
      ('Frontend', 1, 'UI and client-side development', '🎨', '#8b5cf6', 1, TRUE),
      ('Backend', 1, 'Server-side development', '⚙️', '#10b981', 2, TRUE),
      ('Full Stack', 1, 'Both frontend and backend', '🔀', '#f59e0b', 3, TRUE),
      ('DevOps', NULL, 'DevOps and infrastructure', '🚀', '#3b82f6', 2, TRUE),
      ('CI/CD', 5, 'Continuous integration and deployment', '🔄', '#06b6d4', 1, TRUE),
      ('Containers', 5, 'Docker and Kubernetes', '📦', '#8b5cf6', 2, TRUE),
      ('Cloud', 5, 'Cloud infrastructure', '☁️', '#3b82f6', 3, TRUE),
      ('Database', NULL, 'Database-related issues', '🗄️', '#f59e0b', 3, TRUE),
      ('SQL', 9, 'MySQL, PostgreSQL, SQL Server', '📊', '#10b981', 1, TRUE),
      ('NoSQL', 9, 'MongoDB, Redis, Cassandra', '📚', '#8b5cf6', 2, TRUE)
    `);
    
    console.log('   ✓ 11 category hierarchies created\n');

    // ============================================
    // SEED ISSUE TEMPLATES
    // ============================================
    console.log('📝 Seeding issue templates...');
    
    await connection.query(`
      INSERT IGNORE INTO issue_templates (name, category, description, template_content, variables, is_active, use_count) VALUES
      ('Bug Report', 'Software Development', 'Report a bug in your application', 
       '## Bug Description\nDescribe the bug here...\n\n## Steps to Reproduce\n1. First step\n2. Second step\n3. Third step\n\n## Expected Behavior\nWhat you expected to happen\n\n## Actual Behavior\nWhat actually happened\n\n## Screenshots\n[Add screenshots if applicable]', 
       '["steps", "expected", "actual"]', TRUE, 45),
      ('Feature Request', 'Software Development', 'Request a new feature', 
       '## Feature Description\nDescribe the feature you want...\n\n## Use Case\nWho would benefit from this feature?\n\n## Proposed Solution\nHow do you think it should work?\n\n## Alternatives Considered\nAny alternative solutions you considered?',
       '["usecase", "alternatives"]', TRUE, 32),
      ('API Integration Issue', 'API Integration', 'Report an API integration problem', 
       '## API Endpoint\nWhat endpoint are you having trouble with?\n\n## Request/Response\nInclude your request and response\n\n## Error Message\nWhat error are you seeing?\n\n## Authentication\nHow are you authenticating?',
       '["endpoint", "error"]', TRUE, 28),
      ('Database Query Help', 'Database', 'Get help with a database query', 
       '## Query\nPaste your SQL query here\n\n## Goal\nWhat are you trying to achieve?\n\n## Current Results\nWhat results are you getting?\n\n## Database\nWhich database are you using?',
       '["query", "goal"]', TRUE, 22),
      ('Security Vulnerability', 'Security', 'Report a security issue', 
       '## Vulnerability Type\nWhat type of vulnerability?\n\n## Affected Component\nWhich part of the system is affected?\n\n## Description\nDetailed description of the vulnerability\n\n## Proof of Concept\nSteps to reproduce',
       '["type", "component"]', TRUE, 8),
      ('Performance Issue', 'Performance', 'Report a performance problem', 
       '## Issue Description\nDescribe the performance problem\n\n## Current Performance\nResponse times, load times, etc.\n\n## Expected Performance\nWhat performance should be achieved\n\n## Environment\nBrowser, OS, server specs',
       '["performance", "environment"]', TRUE, 19),
      ('Cloud Setup Help', 'Cloud Services', 'Get help with cloud infrastructure', 
       '## Cloud Provider\nWhich cloud service are you using?\n\n## Service Needed\nWhich service do you need help with?\n\n## Current Setup\nDescribe your current infrastructure\n\n## Requirements\nWhat are your requirements?',
       '["provider", "requirements"]', TRUE, 15)
    `);
    
    console.log('   ✓ 7 issue templates created\n');

    // ============================================
    // SEED TOPIC SUGGESTIONS
    // ============================================
    console.log('💡 Seeding topic suggestions...');
    
    await connection.query(`
      INSERT IGNORE INTO topic_suggestions (tag, usage_count, success_rate, avg_resolution_hours) VALUES
      ('API Integration', 150, 95.5, 4.2),
      ('Authentication', 120, 88.2, 6.5),
      ('Database Migration', 85, 78.3, 12.0),
      ('Performance Optimization', 72, 82.1, 8.0),
      ('Docker Setup', 65, 92.0, 3.5),
      ('React Component', 58, 97.0, 2.0),
      ('Node.js Error', 52, 85.5, 4.8),
      ('AWS Configuration', 48, 80.0, 10.5),
      ('Kubernetes Deployment', 42, 88.0, 7.5),
      ('MongoDB Query', 38, 90.0, 3.0),
      ('SSL Certificate', 35, 95.0, 1.5),
      ('CI/CD Pipeline', 32, 85.0, 5.0),
      ('Mobile App Crash', 28, 70.0, 15.0),
      ('Payment Gateway', 25, 75.0, 12.0),
      ('Security Audit', 20, 60.0, 20.0),
      ('GraphQL Query', 18, 88.0, 4.0),
      ('Redis Caching', 15, 92.0, 3.0),
      ('Webhook Setup', 12, 95.0, 2.0),
      ('Load Balancing', 10, 85.0, 8.0),
      ('Code Review', 8, 98.0, 1.0)
    `);
    
    console.log('   ✓ 20 topic suggestions created\n');

    // ============================================
    // SEED TICKETS
    // ============================================
    console.log('🎫 Seeding tickets...');
    
    await connection.query(`
      INSERT IGNORE INTO tickets (title, description, priority, status, customer_name, category, base_pay, environment, tags, satisfaction_score) VALUES
      ('API returning 500 error on user endpoint', 'Getting Internal Server Error when calling the /api/users endpoint. Error started after the last deployment.', 'high', 'open', 'John Smith', 'Software Development', 50.00, 'production', '["api", "error", "urgent"]', NULL),
      ('Need help setting up Docker compose', 'I want to set up a multi-container Docker application with PostgreSQL, Redis, and Node.js. Need help with the compose file.', 'normal', 'open', 'Sarah Johnson', 'DevOps & Infrastructure', 35.00, 'staging', '["docker", "compose"]', NULL),
      ('Database query optimization needed', 'Our user search query is taking over 5 seconds. We have indexes but need help optimizing the query plan.', 'high', 'in_progress', 'Mike Wilson', 'Database', 60.00, 'production', '["database", "performance", "optimization"]', 5),
      ('React app memory leak issue', 'The React dashboard memory usage keeps growing until the browser crashes. Need help identifying the leak.', 'urgent', 'open', 'Emily Chen', 'Software Development', 75.00, 'production', '["react", "memory-leak"]', NULL),
      ('AWS Lambda cold start optimization', 'Our Lambda functions have slow cold starts affecting user experience. Looking for optimization strategies.', 'normal', 'open', 'David Lee', 'Cloud Services', 55.00, 'staging', '["aws", "lambda", "performance"]', NULL),
      ('Mobile app crashing on iOS 17', 'Our React Native app crashes immediately on iOS 17 devices. Works fine on iOS 16.', 'critical', 'open', 'James Taylor', 'Mobile Development', 100.00, 'production', '["ios", "crash", "react-native"]', NULL),
      ('Implement OAuth2 authentication', 'Need to add OAuth2 authentication to our Node.js API. Should support Google and GitHub providers.', 'normal', 'open', 'Sarah Johnson', 'Security', 80.00, 'staging', '["oauth2", "authentication", "google"]', NULL),
      ('Help with Kubernetes ingress setup', 'Having trouble configuring ingress controller with SSL termination. Getting 502 errors.', 'high', 'in_progress', 'Mike Wilson', 'DevOps & Infrastructure', 70.00, 'production', '["kubernetes", "ingress", "ssl"]', 4),
      ('GraphQL subscription not working', 'Real-time subscriptions disconnect after a few minutes. Using Apollo Server with Redis.', 'normal', 'open', 'Emily Chen', 'API Integration', 45.00, 'staging', '["graphql", "subscriptions", "redis"]', NULL),
      ('PostgreSQL backup strategy review', 'Need expert review of our PostgreSQL backup and recovery strategy. Current RTO might be too high.', 'normal', 'open', 'Anna Martinez', 'Database', 40.00, 'production', '["postgresql", "backup", "recovery"]', NULL)
    `);
    
    console.log('   ✓ 10 tickets created\n');

    // ============================================
    // SEED AGENT EXPERTISE
    // ============================================
    console.log('🎯 Seeding agent expertise...');
    
    await connection.query(`
      INSERT IGNORE INTO agent_expertise (tech_name, category, subcategory, expertise_level, success_rate, total_tickets, successful_tickets, avg_rating) VALUES
      ('Emily Chen', 'Software Development', 'Frontend', 'expert', 95.0, 45, 43, 4.8),
      ('Emily Chen', 'Software Development', 'Backend', 'advanced', 88.0, 30, 26, 4.6),
      ('David Lee', 'DevOps', 'Infrastructure', 'expert', 92.0, 60, 55, 4.9),
      ('David Lee', 'Cloud Services', 'AWS', 'expert', 90.0, 55, 50, 4.7),
      ('Lisa Brown', 'Software Development', 'Backend', 'expert', 94.0, 70, 66, 4.8),
      ('Lisa Brown', 'Database', 'PostgreSQL', 'advanced', 88.0, 35, 31, 4.5),
      ('James Taylor', 'Mobile Development', 'React Native', 'expert', 96.0, 40, 38, 4.9),
      ('James Taylor', 'Mobile Development', 'iOS', 'advanced', 85.0, 25, 21, 4.6),
      ('Anna Martinez', 'Database', 'MySQL', 'expert', 97.0, 80, 78, 4.9),
      ('Anna Martinez', 'Database', 'PostgreSQL', 'advanced', 90.0, 45, 40, 4.7),
      ('Chris Anderson', 'Security', 'Authentication', 'expert', 93.0, 50, 47, 4.8),
      ('Chris Anderson', 'Security', 'Penetration Testing', 'expert', 88.0, 30, 26, 4.9)
    `);
    
    console.log('   ✓ 12 agent expertise records created\n');

    // ============================================
    // SEED RATINGS
    // ============================================
    console.log('⭐ Seeding ratings...');
    
    await connection.query(`
      INSERT IGNORE INTO ratings (ticket_id, tech_name, rating, comment) VALUES
      (1, 'Emily Chen', 5, 'Fixed the API issue quickly and professionally!'),
      (2, 'David Lee', 5, 'Great Docker setup guide, everything works perfectly now.'),
      (3, 'Lisa Brown', 4, 'Query is now running 10x faster. Thanks!'),
      (8, 'David Lee', 4, 'Ingress is working now, had to adjust some settings.')
    `);
    
    console.log('   ✓ 4 ratings created\n');

    // ============================================
    // SEED CREDIT TRANSACTIONS
    // ============================================
    console.log('💰 Seeding credit transactions...');
    
    await connection.query(`
      INSERT IGNORE INTO credit_transactions (name, type, amount, balance_after, reason) VALUES
      ('John Smith', 'credit', 500.00, 500.00, 'Initial deposit'),
      ('John Smith', 'debit', 50.00, 450.00, 'Ticket payment - API error fix'),
      ('Sarah Johnson', 'credit', 1000.00, 1000.00, 'Initial deposit'),
      ('Sarah Johnson', 'debit', 35.00, 965.00, 'Ticket payment - Docker setup'),
      ('Sarah Johnson', 'debit', 80.00, 885.00, 'Ticket payment - OAuth2 auth'),
      ('Mike Wilson', 'credit', 750.00, 750.00, 'Initial deposit'),
      ('Mike Wilson', 'debit', 60.00, 690.00, 'Ticket payment - DB optimization'),
      ('Mike Wilson', 'debit', 70.00, 620.00, 'Ticket payment - K8s ingress'),
      ('Emily Chen', 'credit', 200.00, 200.00, 'Initial credits'),
      ('David Lee', 'credit', 500.00, 500.00, 'Initial credits'),
      ('Lisa Brown', 'credit', 400.00, 400.00, 'Initial credits'),
      ('James Taylor', 'credit', 350.00, 350.00, 'Initial credits'),
      ('Anna Martinez', 'credit', 600.00, 600.00, 'Initial credits'),
      ('Chris Anderson', 'credit', 450.00, 450.00, 'Initial credits')
    `);
    
    console.log('   ✓ 14 credit transactions created\n');

    // ============================================
    // SEED PLATFORM SETTINGS
    // ============================================
    console.log('⚙️ Seeding platform settings...');
    
    await connection.query(`
      INSERT IGNORE INTO platform_settings (key_name, value) VALUES
      ('platform_name', 'TechDesk'),
      ('platform_tagline', 'Expert Technical Support on Demand'),
      ('support_email', 'support@techdesk.com'),
      ('commission_rate', '0.15'),
      ('minimum_payout', '25.00'),
      ('dev_ticket_pay', '25.00'),
      ('staging_ticket_pay', '50.00'),
      ('payout_auto_approve', 'true'),
      ('credit_low_priority', '0'),
      ('credit_normal_priority', '50'),
      ('credit_high_priority', '75'),
      ('credit_urgent_priority', '100'),
      ('credit_critical_priority', '150'),
      ('email_notifications', 'true'),
      ('require_ticket_rating', 'true'),
      ('require_email_verification', 'true'),
      ('theme', 'dark'),
      ('primary_color', '#6366f1'),
      ('accent_color', '#f59e0b')
    `);
    
    console.log('   ✓ 19 platform settings created\n');

    // ============================================
    // SEED CRM CONTACTS
    // ============================================
    console.log('👤 Seeding CRM contacts...');
    
    await connection.query(`
      INSERT IGNORE INTO crm_contacts (name, email, phone, company, notes) VALUES
      ('Acme Corp', 'contact@acme.com', '+1-555-0100', 'Acme Corporation', 'Enterprise customer interested in annual plan'),
      ('TechStart Inc', 'info@techstart.io', '+1-555-0101', 'TechStart Inc', 'Startup with 10 developers'),
      ('Global Services', 'sales@globalservices.com', '+1-555-0102', 'Global Services LLC', 'Looking for custom enterprise solution'),
      ('Innovation Labs', 'hello@innovationlabs.co', '+1-555-0103', 'Innovation Labs', 'Long-term partner')
    `);
    
    console.log('   ✓ 4 CRM contacts created\n');

    // ============================================
    // SEED CRM INTERACTIONS
    // ============================================
    console.log('💬 Seeding CRM interactions...');
    
    await connection.query(`
      INSERT IGNORE INTO crm_interactions (contact_id, type, subject, content) VALUES
      (1, 'call', 'Onboarding call', 'Discussed enterprise features and pricing'),
      (1, 'email', 'Follow-up', 'Sent proposal document'),
      (2, 'meeting', 'Product demo', 'Demo of DevOps integration features'),
      (3, 'call', 'Initial contact', 'Qualification call for enterprise needs'),
      (4, 'email', 'Partnership renewal', 'Discussed new partnership terms')
    `);
    
    console.log('   ✓ 5 CRM interactions created\n');

    // ============================================
    // SEED HELP ARTICLES
    // ============================================
    console.log('📚 Seeding help articles...');
    
    await connection.query(`
      INSERT IGNORE INTO help_articles (title, slug, content, category, author, status, view_count) VALUES
      ('Getting Started with TechDesk', 'getting-started', '# Welcome to TechDesk\n\nThis guide will help you get started with our platform...', 'getting-started', 'Admin User', 'published', 1250),
      ('How to Submit a Ticket', 'submit-ticket', '# Submitting Your First Ticket\n\nLearn how to create effective tickets...', 'getting-started', 'Admin User', 'published', 890),
      ('Understanding Credit System', 'credits-system', '# Credit System Explained\n\nLearn how credits work on TechDesk...', 'billing', 'Admin User', 'published', 560),
      ('Expert Guidelines', 'expert-guidelines', '# Guidelines for Tech Experts\n\nBest practices for providing support...', 'for-experts', 'Admin User', 'published', 340),
      ('API Authentication Guide', 'api-auth', '# API Authentication\n\nHow to authenticate with our REST API...', 'developers', 'Admin User', 'published', 720),
      ('Docker Best Practices', 'docker-best-practices', '# Docker Best Practices\n\nTips for containerized deployments...', 'devops', 'David Lee', 'published', 430),
      ('React Performance Tips', 'react-performance', '# Optimizing React Applications\n\nSpeed up your React apps...', 'frontend', 'Emily Chen', 'published', 380),
      ('Database Optimization Guide', 'db-optimization', '# Database Performance Tuning\n\nMake your database queries faster...', 'database', 'Lisa Brown', 'published', 290)
    `);
    
    console.log('   ✓ 8 help articles created\n');

    // ============================================
    // SEED NOTIFICATIONS
    // ============================================
    console.log('🔔 Seeding notifications...');
    
    await connection.query(`
      INSERT IGNORE INTO notifications (name, type, title, message, link, is_read) VALUES
      ('Emily Chen', 'ticket', 'New ticket assigned', 'You have been assigned to ticket #3', '/tickets/3', FALSE),
      ('Emily Chen', 'rating', 'New rating received', 'John Smith gave you a 5-star rating!', '/tickets/3', FALSE),
      ('David Lee', 'ticket', 'Ticket update', 'Ticket #8 has been updated', '/tickets/8', FALSE),
      ('Lisa Brown', 'payment', 'Payout processed', 'Your payout of $150.00 has been processed', '/earnings', TRUE),
      ('John Smith', 'system', 'Ticket resolved', 'Your ticket #1 has been resolved', '/tickets/1', FALSE),
      ('Sarah Johnson', 'system', 'Credit received', 'You received 50 bonus credits', '/billing', TRUE)
    `);
    
    console.log('   ✓ 6 notifications created\n');

    // ============================================
    // SEED CHATBOT CONVERSATIONS
    // ============================================
    console.log('🤖 Seeding chatbot conversations...');
    
    await connection.query(`
      INSERT IGNORE INTO chatbot_conversations (name, messages, status) VALUES
      ('John Smith', '[{"role":"user","content":"How do I submit a ticket?"},{"role":"bot","content":"You can submit a ticket by clicking the Submit Ticket button..."}]', 'completed'),
      ('Sarah Johnson', '[{"role":"user","content":"What technologies do you support?"},{"role":"bot","content":"We support all major technologies including React, Node.js, Python..."}]', 'completed'),
      ('Mike Wilson', '[{"role":"user","content":"How do credits work?"},{"role":"bot","content":"Credits are used to pay for technical support. You can purchase them..."}]', 'active')
    `);
    
    console.log('   ✓ 3 chatbot conversations created\n');

    console.log('========================================');
    console.log('✅ Database seeding completed successfully!');
    console.log('========================================\n');
    console.log('Sample Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:     admin@techdesk.com / password123');
    console.log('Customer:  john@example.com / password123');
    console.log('Tech:      emily@example.com / password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// Run if called directly
seedDatabase().catch(console.error);
