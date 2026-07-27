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
