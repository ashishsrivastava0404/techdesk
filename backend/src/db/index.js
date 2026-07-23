import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig = {
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

if (process.env.DB_SOCKET) {
  poolConfig.socketPath = process.env.DB_SOCKET;
} else {
  poolConfig.host = process.env.DB_HOST || 'localhost';
  poolConfig.port = parseInt(process.env.DB_PORT || '3306', 10);
}

const pool = mysql.createPool({
  ...poolConfig,
  database: process.env.DB_NAME || 'promote'
});

export async function initDatabase() {
  const initConfig = {
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };

  if (process.env.DB_SOCKET) {
    initConfig.socketPath = process.env.DB_SOCKET;
  } else {
    initConfig.host = process.env.DB_HOST || 'localhost';
    initConfig.port = parseInt(process.env.DB_PORT || '3306', 10);
  }

  const connection = await mysql.createConnection(initConfig);

  await connection.query(`CREATE DATABASE IF NOT EXISTS promote`);
  await connection.query(`USE promote`);

  // Users table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      role ENUM('customer', 'tech', 'admin') DEFAULT 'customer',
      status ENUM('active', 'suspended', 'banned') DEFAULT 'active',
      email VARCHAR(255),
      google_id VARCHAR(255),
      avatar_url VARCHAR(500),
      skills TEXT,
      hourly_rate DECIMAL(10,2) DEFAULT 50.00,
      bio TEXT,
      payout_method ENUM('bank', 'paypal', 'stripe') DEFAULT 'stripe',
      payout_details JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Tickets table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      subject VARCHAR(255) DEFAULT NULL,
      short_description TEXT DEFAULT NULL,
      long_description TEXT DEFAULT NULL,
      environment ENUM('dev', 'staging') DEFAULT 'dev',
      priority ENUM('low', 'normal', 'high', 'urgent', 'critical') DEFAULT 'normal',
      status ENUM('open', 'claimed', 'in_progress', 'resolved', 'closed', 'rejected', 'pending_assignment') DEFAULT 'open',
      customer_name VARCHAR(255) NOT NULL,
      tech_name VARCHAR(255) DEFAULT NULL,
      base_pay DECIMAL(10,2) DEFAULT 25.00,
      category VARCHAR(100) DEFAULT 'general',
      subcategory VARCHAR(100) DEFAULT NULL,
      tags JSON,
      estimated_hours DECIMAL(5,2) DEFAULT NULL,
      actual_hours DECIMAL(5,2) DEFAULT NULL,
      time_remaining_hours DECIMAL(5,2) DEFAULT NULL,
      first_response_at TIMESTAMP NULL DEFAULT NULL,
      sla_due_at TIMESTAMP NULL DEFAULT NULL,
      sla_status ENUM('on_track', 'at_risk', 'breached', 'met') DEFAULT 'on_track',
      satisfaction_score INT DEFAULT NULL,
      satisfaction_comment TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL DEFAULT NULL
    )
  `);

  // Category hierarchies table (nested categories/sub-categories)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS category_hierarchies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      parent_id INT DEFAULT NULL,
      description TEXT,
      icon VARCHAR(50) DEFAULT 'folder',
      color VARCHAR(20) DEFAULT '#FFB454',
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES category_hierarchies(id) ON DELETE SET NULL
    )
  `);

  // Agent expertise table (maps agents to expertise categories)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS agent_expertise (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tech_name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      subcategory VARCHAR(100) DEFAULT NULL,
      expertise_level ENUM('beginner', 'intermediate', 'expert') DEFAULT 'intermediate',
      success_rate DECIMAL(5,2) DEFAULT 0,
      total_tickets INT DEFAULT 0,
      successful_tickets INT DEFAULT 0,
      avg_rating DECIMAL(3,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_expertise (tech_name, category, subcategory)
    )
  `);

  // Agent requests table (for agent-to-customer requests)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS agent_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      tech_name VARCHAR(255) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      message TEXT,
      proposed_rate DECIMAL(10,2) DEFAULT NULL,
      estimated_days INT DEFAULT NULL,
      status ENUM('pending', 'approved', 'rejected', 'expired') DEFAULT 'pending',
      response_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      responded_at TIMESTAMP NULL DEFAULT NULL,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    )
  `);

  // Topic suggestions table (for auto-suggest based on historical data)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS topic_suggestions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tag VARCHAR(100) NOT NULL,
      usage_count INT DEFAULT 1,
      success_rate DECIMAL(5,2) DEFAULT 0,
      avg_resolution_hours DECIMAL(10,2) DEFAULT 0,
      last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_tag (tag)
    )
  `);

  // Credit transactions table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_name VARCHAR(255) NOT NULL,
      type ENUM('credit', 'debit', 'transfer_in', 'transfer_out', 'refund') NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      balance_after DECIMAL(10,2) NOT NULL,
      reason VARCHAR(255),
      related_user VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_name (user_name),
      INDEX idx_created_at (created_at)
    )
  `);

  // Ratings table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      tech_name VARCHAR(255) NOT NULL,
      rating INT NOT NULL,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    )
  `);

  // Hire requests table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS hire_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tech_name VARCHAR(255) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      contact VARCHAR(255) NOT NULL,
      proposed_amount DECIMAL(10,2) DEFAULT 0,
      status ENUM('sent', 'accepted', 'declined', 'in_progress', 'completed', 'disputed') DEFAULT 'sent',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL DEFAULT NULL
    )
  `);

  // Payments table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hire_request_id INT DEFAULT NULL,
      ticket_id INT DEFAULT NULL,
      customer_name VARCHAR(255) NOT NULL,
      tech_name VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      platform_fee DECIMAL(10,2) NOT NULL,
      tech_payout DECIMAL(10,2) NOT NULL,
      status ENUM('pending', 'held', 'released', 'refunded', 'disputed', 'failed') DEFAULT 'pending',
      payment_method VARCHAR(50),
      transaction_id VARCHAR(255),
      stripe_payment_intent_id VARCHAR(255),
      stripe_customer_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      released_at TIMESTAMP NULL DEFAULT NULL
    )
  `);

  // Tech earnings table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS tech_earnings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tech_name VARCHAR(255) NOT NULL,
      payment_id INT DEFAULT NULL,
      source ENUM('hire', 'ticket', 'bonus', 'payout') NOT NULL,
      description VARCHAR(255),
      amount DECIMAL(10,2) NOT NULL,
      status ENUM('pending', 'available', 'withdrawn') DEFAULT 'available',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tech payouts table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS tech_payouts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tech_name VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      method ENUM('bank', 'paypal', 'stripe') NOT NULL,
      payout_details JSON,
      status ENUM('requested', 'processing', 'completed', 'failed') DEFAULT 'requested',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL DEFAULT NULL
    )
  `);

  // Customer invoices table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS customer_invoices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      payment_id INT,
      description TEXT,
      amount DECIMAL(10,2) NOT NULL,
      status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
      due_date DATE,
      paid_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // CRM contacts table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS crm_contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_name VARCHAR(255) NOT NULL,
      user_type ENUM('customer', 'tech') NOT NULL,
      company VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      tags JSON,
      notes TEXT,
      lifetime_value DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // CRM interactions table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS crm_interactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      contact_id INT NOT NULL,
      type ENUM('note', 'call', 'email', 'meeting') NOT NULL,
      subject VARCHAR(255),
      content TEXT,
      created_by VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Admin logs table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_name VARCHAR(255) NOT NULL,
      action VARCHAR(255) NOT NULL,
      target_type VARCHAR(50),
      target_id INT,
      details JSON,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Platform settings table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      key_name VARCHAR(100) UNIQUE NOT NULL,
      value JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Insert default settings
  await connection.query(`
    INSERT IGNORE INTO platform_settings (key_name, value) VALUES
    ('commission_rate', '0.15'),
    ('minimum_payout', '25.00'),
    ('dev_ticket_pay', '25.00'),
    ('staging_ticket_pay', '50.00'),
    ('dev_threshold', '33'),
    ('staging_threshold', '66')
  `);

  // Ticket categories table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ticket_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      icon VARCHAR(50) DEFAULT 'folder',
      color VARCHAR(20) DEFAULT '#FFB454',
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default categories
  await connection.query(`
    INSERT IGNORE INTO ticket_categories (name, description, icon, color, sort_order) VALUES
    ('Bug Report', 'Issues, errors, and unexpected behavior', 'bug', '#ef4444', 1),
    ('Feature Request', 'New features and enhancements', 'sparkles', '#22c55e', 2),
    ('Technical Support', 'Help with existing functionality', 'question-mark-circle', '#3b82f6', 3),
    ('Infrastructure', 'Server, database, and network issues', 'server', '#8b5cf6', 4),
    ('Security', 'Security vulnerabilities and concerns', 'shield', '#f59e0b', 5),
    ('Documentation', 'Docs, guides, and tutorials', 'document-text', '#06b6d4', 6),
    ('Performance', 'Speed, optimization, and scaling', 'lightning-bolt', '#ec4899', 7),
    ('Integration', 'Third-party service integrations', 'puzzle-piece', '#14b8a6', 8),
    ('General Inquiry', 'Questions and general assistance', 'chat', '#FFB454', 9)
  `);

  // Issue templates table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS issue_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      description TEXT,
      template_content TEXT NOT NULL,
      variables JSON,
      is_active BOOLEAN DEFAULT TRUE,
      use_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default templates
  await connection.query(`
    INSERT IGNORE INTO issue_templates (name, category, description, template_content, variables) VALUES
    ('Bug Report Template', 'Bug Report', 'Standard template for reporting bugs', 
     '## Bug Description\n[Describe the bug clearly]\n\n## Steps to Reproduce\n1. \n2. \n3. \n\n## Expected Behavior\n[What should happen]\n\n## Actual Behavior\n[What actually happens]\n\n## Screenshots/Logs\n[Attach relevant screenshots or logs]\n\n## Environment\n- Browser/OS: \n- Version: ', 
     '["browser", "version", "screenshot"]'),
    ('Feature Request Template', 'Feature Request',
     'Template for suggesting new features',
     '## Feature Summary\n[Brief description of the feature]\n\n## Problem Statement\n[What problem does this solve?]\n\n## Proposed Solution\n[How should it work?]\n\n## User Stories\nAs a [type of user], I want [goal] so that [benefit].\n\n## Acceptance Criteria\n- [ ] \n- [ ] \n- [ ] ',
     '["user_type", "goal", "benefit"]'),
    ('Support Request Template', 'Technical Support',
     'Template for getting technical help',
     '## Issue Summary\n[What do you need help with?]\n\n## Current Situation\n[Describe your current setup or situation]\n\n## What You Have Tried\n[List troubleshooting steps already taken]\n\n## Specific Questions\n1. \n2. \n\n## Urgency\n[Low/Medium/High/Critical]',
     '["urgency", "troubleshooting"]')
  `);

  // Encrypted ticket messages table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      sender_name VARCHAR(255) NOT NULL,
      sender_role ENUM('customer', 'tech', 'admin') NOT NULL,
      content TEXT NOT NULL,
      message_type ENUM('text', 'file', 'system', 'status_change') DEFAULT 'text',
      encrypted BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    )
  `);

  // Ticket history/audit log table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ticket_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      action VARCHAR(100) NOT NULL,
      actor_name VARCHAR(255) NOT NULL,
      actor_role ENUM('customer', 'tech', 'admin') NOT NULL,
      field_changed VARCHAR(100),
      old_value TEXT,
      new_value TEXT,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    )
  `);

  // Notifications table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      related_ticket_id INT,
      related_user VARCHAR(255),
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // CSAT Surveys table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS csat_surveys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      tech_name VARCHAR(255),
      score INT CHECK (score >= 1 AND score <= 5),
      feedback TEXT,
      would_recommend BOOLEAN,
      resolved_on_time BOOLEAN,
      communication_rating INT CHECK (communication_rating >= 1 AND communication_rating <= 5),
      response_time_rating INT CHECK (response_time_rating >= 1 AND response_time_rating <= 5),
      completed_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    )
  `);

  // File attachments table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ticket_attachments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      uploader_name VARCHAR(255) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_type VARCHAR(100),
      file_size INT,
      file_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    )
  `);

  // Chatbot conversations table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS chatbot_conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(100) DEFAULT 'default',
      user_name VARCHAR(255),
      user_message TEXT NOT NULL,
      bot_response TEXT,
      faq_matched VARCHAR(255),
      action_taken VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Help center articles table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS help_articles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(100),
      tags JSON,
      view_count INT DEFAULT 0,
      helpful_count INT DEFAULT 0,
      not_helpful_count INT DEFAULT 0,
      is_published BOOLEAN DEFAULT TRUE,
      author VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Insert default help articles
  await connection.query(`
    INSERT IGNORE INTO help_articles (title, slug, content, category, tags) VALUES
    ('Getting Started with Promote', 'getting-started', 
     '# Getting Started with Promote\n\nWelcome to Promote! This guide will help you get up and running quickly.\n\n## For Customers\n\n1. **Submit your first ticket**\n   - Click "Submit Ticket" in the navigation\n   - Fill in the title and description\n   - Select environment and priority\n   - Submit!\n\n2. **Track your tickets**\n   - Go to "My Tickets" to see all your tickets\n   - Click on a ticket to view details and messages\n\n3. **Hire a tech**\n   - View tech profiles on the leaderboard\n   - Click "Request for production" to hire directly\n\n## For Techs\n\n1. **Start earning**\n   - Go to "Available Tickets"\n   - Claim a ticket that matches your skills\n   - Complete the work and mark as resolved\n\n2. **Build your reputation**\n   - Get good ratings from customers\n   - Climb the leaderboard\n   - Unlock production access\n\n3. **Get paid**\n   - View earnings in "💰 Earnings"\n   - Request payout when you have $25+',
     'Getting Started', '["onboarding", "beginner", "customers", "techs"]'),
    ('How to Submit a Ticket', 'how-to-submit-ticket',
     '# How to Submit a Ticket\n\nFollow these steps to submit a support ticket:\n\n## Step 1: Click Submit Ticket\nNavigate to the "Submit Ticket" page using the navigation menu.\n\n## Step 2: Fill in Details\n- **Title**: Brief summary of your issue\n- **Description**: Detailed explanation\n- **Category**: Select from Bug Report, Feature Request, etc.\n- **Environment**: Dev or Staging\n- **Priority**: Normal, High, Urgent, or Critical\n\n## Step 3: Use Templates\nSelect a template to structure your ticket:\n- Bug Report Template\n- Feature Request Template\n- Support Request Template\n\n## Step 4: Submit\nClick "Submit Ticket" to create your ticket. You will receive updates as techs work on it.',
     'Tickets', '["submit", "create", "tickets", "how-to"]'),
    ('Understanding Priority Levels', 'understanding-priority',
     '# Understanding Priority Levels\n\nPriority determines how quickly your ticket should be addressed.\n\n## Priority Definitions\n\n| Priority | Response Time | Use Case |\n|----------|---------------|----------|\n| Critical | 1 hour | System down, data loss |\n| Urgent | 4 hours | Major feature broken |\n| High | 8 hours | Important issue |\n| Normal | 24 hours | Standard requests |\n| Low | 48 hours | Nice to have |\n\n## Best Practices\n\n1. **Use Critical sparingly** - Only for genuine emergencies\n2. **High for important issues** - Not working features\n3. **Normal for standard work** - Most tickets\n4. **Low for nice-to-haves** - Enhancements',
     'Tickets', '["priority", "sla", "response-time", "urgent"]'),
    ('Getting Paid as a Tech', 'getting-paid',
     '# Getting Paid as a Tech\n\nLearn how to earn and withdraw money on Promote.\n\n## Ways to Earn\n\n1. **Ticket Resolution**\n   - Dev tickets: $25 base pay\n   - Staging tickets: $50 base pay\n\n2. **Production Hires**\n   - Direct payments from customers\n   - Negotiated rates\n\n## Requesting Payouts\n\n1. Go to "💰 Earnings" page\n2. Check your available balance\n3. Click "Request Payout"\n4. Select payment method:\n   - Stripe\n   - PayPal\n   - Bank Transfer\n\n## Minimum Payout\nThe minimum payout is $25.\n\n## Processing Time\nPayouts are typically processed within 2-3 business days.',
     'Payments', '["payout", "payment", "money", "earn"]'),
    ('Rating System Explained', 'rating-system',
     '# Rating System Explained\n\nThe rating system helps maintain quality and builds trust.\n\n## How It Works\n\nAfter resolving a ticket, customers rate their experience (1-5 stars).\n\n## What Affects Your Rating\n\n1. **Communication** - Did you keep the customer updated?\n2. **Timeliness** - Did you meet the SLA?\n3. **Quality of Work** - Was the issue properly fixed?\n4. **Professionalism** - Were you helpful and courteous?\n\n## Rating Impact\n\n- **Leaderboard position** - Higher ratings = better ranking\n- **Customer trust** - Customers prefer highly-rated techs\n- **Hire requests** - More customers request high-rated techs\n\n## Improving Your Rating\n\n1. Respond quickly to messages\n2. Keep customers informed of progress\n3. Be thorough in your work\n4. Ask clarifying questions',
     'Reputation', '["rating", "stars", "reputation", "feedback"]'),
    ('FAQ - Frequently Asked Questions', 'faq',
     '# Frequently Asked Questions\n\n## General\n\n**Q: How do I reset my password?**\nA: Contact an admin to reset your password.\n\n**Q: Can I delete my account?**\nA: Contact support to request account deletion.\n\n## Tickets\n\n**Q: Can I edit a ticket after submitting?**\nA: Yes, you can edit open tickets.\n\n**Q: What happens if no one claims my ticket?**\nA: Admins are notified and can assign a tech.\n\n**Q: Can I cancel a ticket?**\nA: Yes, if it hasnt been started yet.\n\n## Payments\n\n**Q: When do I get paid?**\nA: After marking a ticket as resolved and customer releases payment.\n\n**Q: What payment methods are supported?**\nA: Stripe, PayPal, and Bank Transfer.',
     'General', '["faq", "questions", "help"]'),
    ('Contacting Support', 'contacting-support',
     '# Contacting Support\n\n## When to Contact Support\n\n- Technical issues with the platform\n- Billing disputes\n- Account problems\n- Harassment or policy violations\n- Feature requests\n\n## How to Contact\n\n1. **Chat with our bot** - Available 24/7 for quick questions\n2. **Submit a ticket** - For specific issues\n3. **Email support** - support@promote.example\n\n## Response Times\n\n- Chatbot: Instant\n- Support tickets: Within 24 hours\n- Email: Within 48 hours\n\n## Escalation\n\nIf your issue isnt resolved, reply to your ticket with "escalate" and a senior agent will review.',
     'Support', '["support", "contact", "help", "escalate"]'),
    ('Account and Profile Settings', 'account-settings',
     '# Account and Profile Settings\n\n## Updating Your Profile\n\n1. Click on your name in the top bar\n2. Edit your profile information\n3. Changes save automatically\n\n## Profile Information\n\n### For Customers\n- Name\n- Email (for notifications)\n- Company name (optional)\n\n### For Techs\n- Name\n- Email\n- Skills\n- Hourly rate\n- Bio\n- Payout method\n\n## Notification Settings\n\nReceive notifications for:\n- Ticket updates\n- New messages\n- Payment updates\n- Rating received\n\n## Changing Roles\n\nUse the role toggle in the top bar to switch between Customer and Tech views.',
     'Account', '["account", "profile", "settings", "notifications"]'),
    ('Understanding SLA and Response Times', 'understanding-sla',
     '# Understanding SLA\n\nSLA (Service Level Agreement) defines response time commitments.\n\n## SLA by Priority\n\n| Priority | First Response | Resolution |\n|----------|---------------|------------|\n| Critical | 1 hour | 4 hours |\n| Urgent | 4 hours | 24 hours |\n| High | 8 hours | 48 hours |\n| Normal | 24 hours | 72 hours |\n| Low | 48 hours | 1 week |\n\n## SLA Status Types\n\n- **On Track**: Meeting SLA requirements\n- **At Risk**: May miss SLA if not addressed soon\n- **Breached**: Failed to meet SLA\n- **Met**: Resolution within SLA\n\n## Why SLA Matters\n\n- Affects customer satisfaction scores\n- Impacts tech ratings\n- Determines platform health metrics',
     'SLA', '["sla", "response-time", "deadline", "priority"]'),
    ('Categories and Issue Templates', 'categories-templates',
     '# Categories and Templates\n\n## Ticket Categories\n\n1. **Bug Report** - Report issues and errors\n2. **Feature Request** - Suggest new features\n3. **Technical Support** - Get help with existing features\n4. **Infrastructure** - Server, database, network issues\n5. **Security** - Security vulnerabilities\n6. **Documentation** - Docs and guide requests\n7. **Performance** - Speed and optimization\n8. **Integration** - Third-party service issues\n9. **General Inquiry** - Other questions\n\n## Issue Templates\n\nTemplates help you structure better tickets:\n\n### Bug Report Template\n- Description of the bug\n- Steps to reproduce\n- Expected vs actual behavior\n- Screenshots/logs\n\n### Feature Request Template\n- Problem statement\n- Proposed solution\n- User stories\n\n### Support Request Template\n- Current situation\n- What you have tried\n- Specific questions',
     'Tickets', '["category", "template", "bug", "feature", "structure"]')
  `);

  await connection.end();
  console.log('Database initialized successfully');
}

export default pool;
