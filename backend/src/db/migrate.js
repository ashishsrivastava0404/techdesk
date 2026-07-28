/**
 * Database Migration Script
 * Ensures database schema is up to date with all required columns
 * 
 * Usage: node src/db/migrate.js
 */

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Load environment variables
dotenv.config();

// Create connection without database first
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'mysql' // Connect to default mysql database first
};

async function runMigrations() {
  console.log('🔄 Starting database migrations...\n');
  console.log('📦 Connecting to MySQL...');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   User: ${dbConfig.user}`);

  // First, ensure the database exists
  console.log('\n📦 Creating database if needed...');
  const tempConnection = await mysql.createConnection(dbConfig);
  
  try {
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS promote`);
    console.log('   ✓ Database "promote" ready');
  } finally {
    await tempConnection.end();
  }

  // Now connect to the actual database
  dbConfig.database = 'promote';
  console.log('\n🔗 Connecting to promote database...');
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // ============================================
    // USERS TABLE MIGRATIONS
    // ============================================
    console.log('👥 Checking users table...');
    
    // Check if table exists
    const [userTables] = await connection.query(`SHOW TABLES LIKE 'users'`);
    
    if (userTables.length === 0) {
      console.log('   → Creating users table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          role ENUM('customer', 'tech', 'admin') DEFAULT 'customer',
          status ENUM('active', 'suspended', 'banned') DEFAULT 'active',
          email VARCHAR(255) UNIQUE,
          password_hash VARCHAR(255),
          password_salt VARCHAR(255),
          google_id VARCHAR(255),
          avatar_url VARCHAR(500),
          skills TEXT,
          hourly_rate DECIMAL(10,2) DEFAULT 50.00,
          bio TEXT,
          payout_method ENUM('bank', 'paypal', 'stripe') DEFAULT 'stripe',
          payout_details JSON,
          stripe_account_id VARCHAR(255),
          paypal_email VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ users table created');
    } else {
      console.log('   ✓ users table exists');
      
      // Add missing columns
      const [userColumns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users'
      `);
      
      const userColumnsMap = userColumns.map(col => col.COLUMN_NAME);
      
      if (!userColumnsMap.includes('password_hash')) {
        console.log('   → Adding password_hash column...');
        await connection.query(`ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) AFTER email`);
        console.log('   ✓ password_hash column added');
      }
      
      if (!userColumnsMap.includes('password_salt')) {
        console.log('   → Adding password_salt column...');
        await connection.query(`ALTER TABLE users ADD COLUMN password_salt VARCHAR(255) AFTER password_hash`);
        console.log('   ✓ password_salt column added');
      }
    }

    // ============================================
    // TICKET CATEGORIES TABLE MIGRATIONS
    // ============================================
    console.log('\n📁 Checking ticket_categories table...');
    
    const [catTables] = await connection.query(`SHOW TABLES LIKE 'ticket_categories'`);
    
    if (catTables.length === 0) {
      console.log('   → Creating ticket_categories table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS ticket_categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          icon VARCHAR(50) DEFAULT NULL,
          color VARCHAR(20) DEFAULT NULL,
          sort_order INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE
        )
      `);
      console.log('   ✓ ticket_categories table created');
    } else {
      console.log('   ✓ ticket_categories table exists');
    }

    // ============================================
    // ISSUE TEMPLATES TABLE MIGRATIONS
    // ============================================
    console.log('\n📝 Checking issue_templates table...');
    
    const [templateTables] = await connection.query(`SHOW TABLES LIKE 'issue_templates'`);
    
    if (templateTables.length === 0) {
      console.log('   → Creating issue_templates table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS issue_templates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(255),
          description TEXT,
          template_content TEXT,
          variables JSON,
          is_active BOOLEAN DEFAULT TRUE,
          use_count INT DEFAULT 0
        )
      `);
      console.log('   ✓ issue_templates table created');
    } else {
      console.log('   ✓ issue_templates table exists');
    }

    // ============================================
    // TOPIC SUGGESTIONS TABLE MIGRATIONS
    // ============================================
    console.log('\n💡 Checking topic_suggestions table...');
    
    const [topicTables] = await connection.query(`SHOW TABLES LIKE 'topic_suggestions'`);
    
    if (topicTables.length === 0) {
      console.log('   → Creating topic_suggestions table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS topic_suggestions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tag VARCHAR(255) NOT NULL,
          usage_count INT DEFAULT 0,
          success_rate DECIMAL(5,2) DEFAULT 0,
          avg_resolution_hours DECIMAL(10,2) DEFAULT 0,
          last_used_at TIMESTAMP NULL DEFAULT NULL
        )
      `);
      console.log('   ✓ topic_suggestions table created');
    } else {
      console.log('   ✓ topic_suggestions table exists');
      // Add missing columns
      try {
        await connection.query(`ALTER TABLE topic_suggestions ADD COLUMN last_used_at TIMESTAMP NULL DEFAULT NULL`);
        console.log('   → Added last_used_at column');
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') {
          // Column might already exist, ignore error
        }
      }
    }

    // ============================================
    // AGENT EXPERTISE TABLE MIGRATIONS
    // ============================================
    console.log('\n🔧 Checking agent_expertise table...');
    
    const [techTables] = await connection.query(`SHOW TABLES LIKE 'agent_expertise'`);
    
    if (techTables.length === 0) {
      console.log('   → Creating agent_expertise table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS agent_expertise (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tech_name VARCHAR(255) NOT NULL,
          category VARCHAR(100) DEFAULT NULL,
          subcategory VARCHAR(100) DEFAULT NULL,
          expertise_level ENUM('beginner', 'intermediate', 'advanced', 'expert', 'certified') DEFAULT 'intermediate',
          success_rate DECIMAL(5,2) DEFAULT 0,
          total_tickets INT DEFAULT 0,
          successful_tickets INT DEFAULT 0,
          avg_rating DECIMAL(3,2) DEFAULT 0
        )
      `);
      console.log('   ✓ agent_expertise table created');
    } else {
      console.log('   ✓ agent_expertise table exists');
    }

    // ============================================
    // CATEGORY HIERARCHIES TABLE
    // ============================================
    console.log('\n📂 Checking category_hierarchies table...');
    
    const [hierTables] = await connection.query(`SHOW TABLES LIKE 'category_hierarchies'`);
    
    if (hierTables.length === 0) {
      console.log('   → Creating category_hierarchies table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS category_hierarchies (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          parent_id INT DEFAULT NULL,
          description TEXT,
          icon VARCHAR(50) DEFAULT NULL,
          color VARCHAR(20) DEFAULT NULL,
          sort_order INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE
        )
      `);
      console.log('   ✓ category_hierarchies table created');
    } else {
      console.log('   ✓ category_hierarchies table exists');
    }

    // ============================================
    // TICKETS TABLE
    // ============================================
    console.log('\n🎫 Checking tickets table...');
    
    const [ticketTables] = await connection.query(`SHOW TABLES LIKE 'tickets'`);
    
    if (ticketTables.length === 0) {
      console.log('   → Creating tickets table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS tickets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          subject VARCHAR(255) DEFAULT NULL,
          short_description TEXT DEFAULT NULL,
          long_description TEXT DEFAULT NULL,
          priority ENUM('low', 'normal', 'high', 'urgent', 'critical') DEFAULT 'normal',
          ticket_type ENUM('business', 'technical') DEFAULT 'technical',
          status ENUM('open', 'claimed', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
          customer_name VARCHAR(255),
          tech_name VARCHAR(255) DEFAULT NULL,
          assigned_to_admin VARCHAR(255) DEFAULT NULL,
          category VARCHAR(255) DEFAULT NULL,
          base_pay DECIMAL(10,2) DEFAULT 0,
          environment ENUM('dev', 'staging', 'production') DEFAULT 'dev',
          tags TEXT,
          satisfaction_score INT DEFAULT NULL,
          resolved_at TIMESTAMP NULL DEFAULT NULL,
          first_response_at TIMESTAMP NULL DEFAULT NULL,
          sla_status ENUM('on_track', 'at_risk', 'breached') DEFAULT 'on_track',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ tickets table created');
    } else {
      console.log('   ✓ tickets table exists');
      
      // Check for missing columns
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tickets'
      `);
      
      const colMap = columns.map(c => c.COLUMN_NAME);
      
      if (!colMap.includes('ticket_type')) {
        console.log('   → Adding ticket_type column...');
        await connection.query(`ALTER TABLE tickets ADD COLUMN ticket_type ENUM('business', 'technical') DEFAULT 'technical'`);
        console.log('   ✓ ticket_type column added');
      }
      
      if (!colMap.includes('assigned_to_admin')) {
        console.log('   → Adding assigned_to_admin column...');
        await connection.query(`ALTER TABLE tickets ADD COLUMN assigned_to_admin VARCHAR(255) DEFAULT NULL AFTER tech_name`);
        console.log('   ✓ assigned_to_admin column added');
      }
      
      if (!colMap.includes('tags')) {
        console.log('   → Adding tags column...');
        await connection.query(`ALTER TABLE tickets ADD COLUMN tags TEXT`);
        console.log('   ✓ tags column added');
      }

      if (!colMap.includes('subcategory')) {
        console.log('   → Adding subcategory column...');
        await connection.query(`ALTER TABLE tickets ADD COLUMN subcategory VARCHAR(255) DEFAULT NULL`);
        console.log('   ✓ subcategory column added');
      }

      if (!colMap.includes('topic')) {
        console.log('   → Adding topic column...');
        await connection.query(`ALTER TABLE tickets ADD COLUMN topic VARCHAR(255) DEFAULT NULL`);
        console.log('   ✓ topic column added');
      }

      if (!colMap.includes('sla_due_at')) {
        console.log('   → Adding sla_due_at column...');
        await connection.query(`ALTER TABLE tickets ADD COLUMN sla_due_at TIMESTAMP NULL DEFAULT NULL`);
        console.log('   ✓ sla_due_at column added');
      }

      if (!colMap.includes('estimated_hours')) {
        console.log('   → Adding estimated_hours column...');
        await connection.query(`ALTER TABLE tickets ADD COLUMN estimated_hours DECIMAL(5,2) DEFAULT NULL`);
        console.log('   ✓ estimated_hours column added');
      }
    }

    // ============================================
    // RATINGS TABLE
    // ============================================
    console.log('\n⭐ Checking ratings table...');
    
    const [ratingTables] = await connection.query(`SHOW TABLES LIKE 'ratings'`);
    
    if (ratingTables.length === 0) {
      console.log('   → Creating ratings table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS ratings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_id INT NOT NULL,
          tech_name VARCHAR(255) NOT NULL,
          rating INT NOT NULL,
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ ratings table created');
    } else {
      console.log('   ✓ ratings table exists');
    }

    // ============================================
    // CREDIT TRANSACTIONS TABLE
    // ============================================
    console.log('\n💰 Checking credit_transactions table...');
    
    const [creditTables] = await connection.query(`SHOW TABLES LIKE 'credit_transactions'`);
    
    if (creditTables.length === 0) {
      console.log('   → Creating credit_transactions table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS credit_transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_name VARCHAR(255) NOT NULL,
          type ENUM('credit', 'debit') NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          balance_after DECIMAL(10,2) NOT NULL,
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ credit_transactions table created');
    } else {
      console.log('   ✓ credit_transactions table exists');
    }

    // ============================================
    // PLATFORM SETTINGS TABLE
    // ============================================
    console.log('\n⚙️ Checking platform_settings table...');
    
    const [settingsTables] = await connection.query(`SHOW TABLES LIKE 'platform_settings'`);
    
    if (settingsTables.length === 0) {
      console.log('   → Creating platform_settings table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS platform_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          key_name VARCHAR(255) UNIQUE NOT NULL,
          value TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ platform_settings table created');
    } else {
      console.log('   ✓ platform_settings table exists');
      
      // Check if using old column names and rename if needed
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'platform_settings'
      `);
      
      const colMap = columns.map(c => c.COLUMN_NAME);
      if (colMap.includes('setting_key') && !colMap.includes('key_name')) {
        console.log('   → Renaming columns to match expected schema...');
        await connection.query(`ALTER TABLE platform_settings CHANGE setting_key key_name VARCHAR(255)`);
        await connection.query(`ALTER TABLE platform_settings CHANGE setting_value value TEXT`);
        console.log('   ✓ Columns renamed');
      }
    }

    // ============================================
    // CRM CONTACTS TABLE
    // ============================================
    console.log('\n👤 Checking crm_contacts table...');
    
    const [crmTables] = await connection.query(`SHOW TABLES LIKE 'crm_contacts'`);
    
    if (crmTables.length === 0) {
      console.log('   → Creating crm_contacts table...');
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
      console.log('   ✓ crm_contacts table created');
    } else {
      console.log('   ✓ crm_contacts table exists');
      try {
        await connection.query(`ALTER TABLE crm_contacts ADD COLUMN user_name VARCHAR(255) DEFAULT NULL`);
        console.log('   → Added user_name column');
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') {}
      }
      try {
        await connection.query(`ALTER TABLE crm_contacts ADD COLUMN user_type ENUM('customer', 'tech') DEFAULT 'customer'`);
        console.log('   → Added user_type column');
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') {}
      }
    }

    // ============================================
    // CRM INTERACTIONS TABLE
    // ============================================
    console.log('\n💬 Checking crm_interactions table...');
    
    const [interactionTables] = await connection.query(`SHOW TABLES LIKE 'crm_interactions'`);
    
    if (interactionTables.length === 0) {
      console.log('   → Creating crm_interactions table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS crm_interactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          contact_id INT NOT NULL,
          type ENUM('call', 'email', 'meeting', 'note') NOT NULL,
          subject VARCHAR(255),
          content TEXT,
          outcome TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ crm_interactions table created');
    } else {
      console.log('   ✓ crm_interactions table exists');
    }

    // ============================================
    // HELP ARTICLES TABLE
    // ============================================
    console.log('\n📚 Checking help_articles table...');
    
    const [helpTables] = await connection.query(`SHOW TABLES LIKE 'help_articles'`);
    
    if (helpTables.length === 0) {
      console.log('   → Creating help_articles table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS help_articles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          content TEXT,
          category VARCHAR(100),
          tags TEXT,
          author VARCHAR(255),
          status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
          view_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ help_articles table created');
    } else {
      console.log('   ✓ help_articles table exists');
      
      // Check for missing columns
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'help_articles'
      `);
      
      const colMap = columns.map(c => c.COLUMN_NAME);
      if (!colMap.includes('tags')) {
        console.log('   → Adding tags column...');
        await connection.query(`ALTER TABLE help_articles ADD COLUMN tags TEXT`);
        console.log('   ✓ tags column added');
      }
    }

    // ============================================
    // NOTIFICATIONS TABLE
    // ============================================
    console.log('\n🔔 Checking notifications table...');
    
    const [notifTables] = await connection.query(`SHOW TABLES LIKE 'notifications'`);
    
    if (notifTables.length === 0) {
      console.log('   → Creating notifications table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT,
          link VARCHAR(500),
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ notifications table created');
    } else {
      console.log('   ✓ notifications table exists');
    }

    // ============================================
    // SUPPORT REPORTS TABLE
    // ============================================
    console.log('\n📋 Checking support_reports table...');

    const [reportTables] = await connection.query(`SHOW TABLES LIKE 'support_reports'`);

    if (reportTables.length === 0) {
      console.log('   → Creating support_reports table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS support_reports (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          user_name VARCHAR(255),
          user_email VARCHAR(255),
          user_role ENUM('customer', 'tech', 'admin') DEFAULT 'customer',
          report_type VARCHAR(100) NOT NULL,
          subject VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          page_url VARCHAR(500),
          browser_info TEXT,
          priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
          status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
          assigned_to VARCHAR(255),
          resolution_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ support_reports table created');
    } else {
      console.log('   ✓ support_reports table exists');
    }

// ============================================
    // CHATBOT CONVERSATIONS TABLE
    // ============================================
    console.log('\n🤖 Checking chatbot_conversations table...');
    
    const [chatTables] = await connection.query(`SHOW TABLES LIKE 'chatbot_conversations'`);
    
    if (chatTables.length === 0) {
      console.log('   → Creating chatbot_conversations table...');
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
      console.log('   ✓ chatbot_conversations table created');
    } else {
      console.log('   ✓ chatbot_conversations table exists');
    }

    // ============================================
    // ADMIN LOGS TABLE
    // ============================================
    console.log('\n📝 Checking admin_logs table...');
    const [adminLogTables] = await connection.query(`SHOW TABLES LIKE 'admin_logs'`);
    if (adminLogTables.length === 0) {
      console.log('   → Creating admin_logs table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS admin_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          admin_name VARCHAR(255),
          action VARCHAR(100) NOT NULL,
          target_type VARCHAR(100),
          target_id INT,
          details JSON,
          ip_address VARCHAR(45),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ admin_logs table created');
    } else {
      console.log('   ✓ admin_logs table exists');
    }
        // expert_skills table
        const [expertSkillsTable] = await connection.query(`SHOW TABLES LIKE 'expert_skills'`);
        if (expertSkillsTable.length === 0) {
          console.log('   → Creating expert_skills table...');
          await connection.query(`
            CREATE TABLE IF NOT EXISTS expert_skills (
              id INT AUTO_INCREMENT PRIMARY KEY,
              user_id INT NOT NULL,
              tech_id VARCHAR(100) NOT NULL,
              expertise_level ENUM('beginner', 'intermediate', 'advanced', 'expert', 'certified') DEFAULT 'beginner',
              years_experience INT DEFAULT 0,
              certification_proof TEXT,
              is_verified BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              UNIQUE KEY unique_user_tech (user_id, tech_id)
            )
          `);
          console.log('   ✓ expert_skills table created');
        } else {
          console.log('   ✓ expert_skills table exists');
        }

        // expert_stats table
        const [expertStatsTable] = await connection.query(`SHOW TABLES LIKE 'expert_stats'`);
        if (expertStatsTable.length === 0) {
          console.log('   → Creating expert_stats table...');
          await connection.query(`
            CREATE TABLE IF NOT EXISTS expert_stats (
              id INT AUTO_INCREMENT PRIMARY KEY,
              user_id INT NOT NULL UNIQUE,
              total_tickets_resolved INT DEFAULT 0,
              total_rating DECIMAL(10,2) DEFAULT 0,
              avg_rating DECIMAL(3,2) DEFAULT 0,
              avg_resolution_time INT DEFAULT 0,
              last_active TIMESTAMP NULL DEFAULT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
          `);
          console.log('   ✓ expert_stats table created');
        } else {
          console.log('   ✓ expert_stats table exists');
        }

        // tech_stack table
        const [techStackTable] = await connection.query(`SHOW TABLES LIKE 'tech_stack'`);
        if (techStackTable.length === 0) {
          console.log('   → Creating tech_stack table...');
          await connection.query(`
            CREATE TABLE IF NOT EXISTS tech_stack (
              id VARCHAR(100) PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              category VARCHAR(100) NOT NULL,
              certified BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          console.log('   ✓ tech_stack table created');
        } else {
          console.log('   ✓ tech_stack table exists');
        }


    // ============================================
    // AGENT REQUESTS TABLE
    // ============================================
    console.log('\n🤝 Checking agent_requests table...');
    const [agentTables] = await connection.query(`SHOW TABLES LIKE 'agent_requests'`);
    if (agentTables.length === 0) {
      console.log('   → Creating agent_requests table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS agent_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          role ENUM('customer', 'tech') NOT NULL,
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ agent_requests table created');
    } else {
      console.log('   ✓ agent_requests table exists');
    }

    // ============================================
    // HIRE REQUESTS TABLE
    // ============================================
    console.log('\n💼 Checking hire_requests table...');
    const [hireTables] = await connection.query(`SHOW TABLES LIKE 'hire_requests'`);
    if (hireTables.length === 0) {
      console.log('   → Creating hire_requests table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS hire_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          customer_name VARCHAR(255) NOT NULL,
          tech_name VARCHAR(255) NOT NULL,
          ticket_id INT,
          message TEXT,
          status ENUM('pending', 'accepted', 'declined', 'completed') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ hire_requests table created');
    } else {
      console.log('   ✓ hire_requests table exists');
    }

    // ============================================
    // TICKET ATTACHMENTS TABLE
    // ============================================
    console.log('\n📎 Checking ticket_attachments table...');
    const [attachTables] = await connection.query(`SHOW TABLES LIKE 'ticket_attachments'`);
    if (attachTables.length === 0) {
      console.log('   → Creating ticket_attachments table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS ticket_attachments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_id INT NOT NULL,
          user_name VARCHAR(255) NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_url VARCHAR(500) NOT NULL,
          file_type VARCHAR(100),
          file_size INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ ticket_attachments table created');
    } else {
      console.log('   ✓ ticket_attachments table exists');
    }

    // ============================================
    // ATTACHMENTS TABLE (without ticket_ prefix)
    // ============================================
    console.log('\n📎 Checking attachments table...');
    const [plainAttachTables] = await connection.query(`SHOW TABLES LIKE 'attachments'`);
    if (plainAttachTables.length === 0) {
      console.log('   → Creating attachments table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS attachments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_id INT NOT NULL,
          filename VARCHAR(255) NOT NULL,
          stored_filename VARCHAR(255) NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          file_size INT,
          mime_type VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ attachments table created');
    } else {
      console.log('   ✓ attachments table exists');
      
      // Check if id is AUTO_INCREMENT
      const [attachColumns] = await connection.query(`
        SELECT COLUMN_NAME, EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'attachments'
      `);
      const hasAutoInc = attachColumns.find(c => c.COLUMN_NAME === 'id' && c.EXTRA === 'auto_increment');
      if (!hasAutoInc) {
        console.log('   → Modifying attachments id to AUTO_INCREMENT...');
        await connection.query(`ALTER TABLE attachments MODIFY COLUMN id INT AUTO_INCREMENT`);
        console.log('   ✓ attachments id set to AUTO_INCREMENT');
      }
    }

    // ============================================
    // TICKET COMMENTS TABLE
    // ============================================
    console.log('\n💬 Checking ticket_comments table...');
    const [commentTables] = await connection.query(`SHOW TABLES LIKE 'ticket_comments'`);
    if (commentTables.length === 0) {
      console.log('   → Creating ticket_comments table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS ticket_comments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_id INT NOT NULL,
          user_name VARCHAR(255) NOT NULL,
          user_role ENUM('customer', 'tech', 'admin') DEFAULT 'customer',
          message TEXT NOT NULL,
          message_type ENUM('comment', 'note', 'resolution', 'internal') DEFAULT 'comment',
          parent_id INT,
          is_internal BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ ticket_comments table created');
    } else {
      console.log('   ✓ ticket_comments table exists');
    }

    // ============================================
    // TICKET HISTORY TABLE
    // ============================================
    console.log('\n📜 Checking ticket_history table...');
    const [historyTables] = await connection.query(`SHOW TABLES LIKE 'ticket_history'`);
    if (historyTables.length === 0) {
      console.log('   → Creating ticket_history table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS ticket_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_id INT NOT NULL,
          user_name VARCHAR(255) NOT NULL,
          action VARCHAR(100) NOT NULL,
          field_changed VARCHAR(100),
          old_value TEXT,
          new_value TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ ticket_history table created');
    } else {
      console.log('   ✓ ticket_history table exists');
      
      // Add missing columns for actor_name and actor_role
      const [histColumns] = await connection.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'ticket_history'
      `);
      const histColMap = histColumns.map(c => c.COLUMN_NAME);
      
      if (!histColMap.includes('actor_name')) {
        console.log('   → Adding actor_name column...');
        await connection.query(`ALTER TABLE ticket_history ADD COLUMN actor_name VARCHAR(255)`);
        console.log('   ✓ actor_name column added');
      }
      
      if (!histColMap.includes('actor_role')) {
        console.log('   → Adding actor_role column...');
        await connection.query(`ALTER TABLE ticket_history ADD COLUMN actor_role VARCHAR(50)`);
        console.log('   ✓ actor_role column added');
      }
      
      if (!histColMap.includes('metadata')) {
        console.log('   → Adding metadata column...');
        await connection.query(`ALTER TABLE ticket_history ADD COLUMN metadata JSON`);
        console.log('   ✓ metadata column added');
      }
    }

    // ============================================
    // TICKET MESSAGES TABLE
    // ============================================
    console.log('\n✉️ Checking ticket_messages table...');
    const [msgTables] = await connection.query(`SHOW TABLES LIKE 'ticket_messages'`);
    if (msgTables.length === 0) {
      console.log('   → Creating ticket_messages table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS ticket_messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_id INT NOT NULL,
          user_name VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          message_type ENUM('message', 'note', 'system') DEFAULT 'message',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ ticket_messages table created');
    } else {
      console.log('   ✓ ticket_messages table exists');
    }

    // ============================================
    // TECH EARNINGS TABLE
    // ============================================
    console.log('\n💵 Checking tech_earnings table...');
    const [earnTables] = await connection.query(`SHOW TABLES LIKE 'tech_earnings'`);
    if (earnTables.length === 0) {
      console.log('   → Creating tech_earnings table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS tech_earnings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tech_name VARCHAR(255) NOT NULL,
          ticket_id INT,
          amount DECIMAL(10,2) NOT NULL,
          type ENUM('earning', 'bonus', 'refund') DEFAULT 'earning',
          status ENUM('pending', 'available', 'withdrawn') DEFAULT 'pending',
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ tech_earnings table created');
    } else {
      console.log('   ✓ tech_earnings table exists');
    }

    // ============================================
    // CSAT SURVEYS TABLE
    // ============================================
    console.log('\n📊 Checking csat_surveys table...');
    const [surveyTables] = await connection.query(`SHOW TABLES LIKE 'csat_surveys'`);
    if (surveyTables.length === 0) {
      console.log('   → Creating csat_surveys table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS csat_surveys (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_id INT NOT NULL,
          customer_name VARCHAR(255) NOT NULL,
          tech_name VARCHAR(255),
          score INT NOT NULL,
          feedback TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ csat_surveys table created');
    } else {
      console.log('   ✓ csat_surveys table exists');
    }

    // ============================================
    // CUSTOMER INVOICES TABLE
    // ============================================
    console.log('\n🧾 Checking customer_invoices table...');
    const [invTables] = await connection.query(`SHOW TABLES LIKE 'customer_invoices'`);
    if (invTables.length === 0) {
      console.log('   → Creating customer_invoices table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS customer_invoices (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_name VARCHAR(255) NOT NULL,
          ticket_id INT,
          amount DECIMAL(10,2) NOT NULL,
          status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
          stripe_invoice_id VARCHAR(255),
          invoice_url VARCHAR(500),
          due_date DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ customer_invoices table created');
    } else {
      console.log('   ✓ customer_invoices table exists');
    }

    // ============================================
    // CONVERSATIONS TABLE
    // ============================================
    console.log('\n💭 Checking conversations table...');
    const [convTables] = await connection.query(`SHOW TABLES LIKE 'conversations'`);
    if (convTables.length === 0) {
      console.log('   → Creating conversations table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          customer_id INT,
          tech_id INT,
          customer_name VARCHAR(255),
          tech_name VARCHAR(255),
          title VARCHAR(255),
          messages TEXT,
          status ENUM('active', 'resolved') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ conversations table created');
    } else {
      console.log('   ✓ conversations table exists');
    }

// ============================================
    // PAYMENTS TABLE
    // ============================================
    console.log('\n💳 Checking payments table...');

    const [paymentTables] = await connection.query(`SHOW TABLES LIKE 'payments'`);

    if (paymentTables.length === 0) {
      console.log('   → Creating payments table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_name VARCHAR(255) NOT NULL,
          ticket_id INT,
          tech_name VARCHAR(255),
          customer_name VARCHAR(255) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          platform_fee DECIMAL(10,2) DEFAULT 0,
          status ENUM('pending', 'held', 'released', 'disputed', 'refunded') DEFAULT 'pending',
          stripe_payment_id VARCHAR(255),
          payment_method ENUM('stripe', 'paypal', 'bank') DEFAULT 'stripe',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ payments table created');
    } else {
      console.log('   ✓ payments table exists');
    }

    // ============================================
    // TECH PAYOUTS TABLE
    // ============================================
    console.log('\n🏧 Checking tech_payouts table...');

    const [payoutTables] = await connection.query(`SHOW TABLES LIKE 'tech_payouts'`);

    if (payoutTables.length === 0) {
      console.log('   → Creating tech_payouts table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS tech_payouts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tech_name VARCHAR(255) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          method ENUM('bank', 'paypal', 'stripe') DEFAULT 'stripe',
          status ENUM('requested', 'processing', 'completed', 'rejected') DEFAULT 'requested',
          notes TEXT,
          processed_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ tech_payouts table created');
    } else {
      console.log('   ✓ tech_payouts table exists');
    }

    console.log('\n========================================');
    console.log('✅ Database migrations completed successfully!');
    console.log('========================================\n');
    console.log('You can now run: npm run seed\n');

  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run if called directly
runMigrations().catch(console.error);
