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
          avg_resolution_hours DECIMAL(10,2) DEFAULT 0
        )
      `);
      console.log('   ✓ topic_suggestions table created');
    } else {
      console.log('   ✓ topic_suggestions table exists');
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
          status ENUM('open', 'claimed', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
          customer_name VARCHAR(255),
          tech_name VARCHAR(255) DEFAULT NULL,
          category VARCHAR(255) DEFAULT NULL,
          base_pay DECIMAL(10,2) DEFAULT 0,
          environment ENUM('dev', 'staging', 'production') DEFAULT 'dev',
          tags TEXT,
          satisfaction_score INT DEFAULT NULL,
          sla_status ENUM('on_track', 'at_risk', 'breached') DEFAULT 'on_track',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ tickets table created');
    } else {
      console.log('   ✓ tickets table exists');
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
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(50),
          company VARCHAR(255),
          status ENUM('lead', 'active', 'inactive') DEFAULT 'lead',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ crm_contacts table created');
    } else {
      console.log('   ✓ crm_contacts table exists');
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
    // CHATBOT CONVERSATIONS TABLE
    // ============================================
    console.log('\n🤖 Checking chatbot_conversations table...');
    
    const [chatTables] = await connection.query(`SHOW TABLES LIKE 'chatbot_conversations'`);
    
    if (chatTables.length === 0) {
      console.log('   → Creating chatbot_conversations table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS chatbot_conversations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_name VARCHAR(255) NOT NULL,
          messages TEXT,
          status ENUM('active', 'completed') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✓ chatbot_conversations table created');
    } else {
      console.log('   ✓ chatbot_conversations table exists');
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
