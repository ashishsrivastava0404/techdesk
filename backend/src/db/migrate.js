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
    console.log('👥 Checking users table schema...');
    
    const [userColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users'
    `);
    
    const userColumnsMap = userColumns.map(col => col.COLUMN_NAME);
    
    // Add password_hash if missing
    if (!userColumnsMap.includes('password_hash')) {
      console.log('   → Adding password_hash column...');
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN password_hash VARCHAR(255) AFTER email
      `);
      console.log('   ✓ password_hash column added');
    } else {
      console.log('   ✓ password_hash column exists');
    }
    
    // Add password_salt if missing
    if (!userColumnsMap.includes('password_salt')) {
      console.log('   → Adding password_salt column...');
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN password_salt VARCHAR(255) AFTER password_hash
      `);
      console.log('   ✓ password_salt column added');
    } else {
      console.log('   ✓ password_salt column exists');
    }
    
    // Add google_id if missing
    if (!userColumnsMap.includes('google_id')) {
      console.log('   → Adding google_id column...');
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN google_id VARCHAR(255) AFTER password_salt
      `);
      console.log('   ✓ google_id column added');
    } else {
      console.log('   ✓ google_id column exists');
    }

    // ============================================
    // TICKET CATEGORIES TABLE MIGRATIONS
    // ============================================
    console.log('\n📁 Checking ticket_categories table schema...');
    
    const [catColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'ticket_categories'
    `);
    
    const catColumnsMap = catColumns.map(col => col.COLUMN_NAME);
    
    // Add missing columns to ticket_categories
    const catColumnsToAdd = [
      { name: 'icon', type: 'VARCHAR(50) DEFAULT NULL' },
      { name: 'color', type: 'VARCHAR(20) DEFAULT NULL' },
      { name: 'sort_order', type: 'INT DEFAULT 0' },
      { name: 'is_active', type: 'BOOLEAN DEFAULT TRUE' }
    ];
    
    for (const col of catColumnsToAdd) {
      if (!catColumnsMap.includes(col.name)) {
        console.log(`   → Adding ${col.name} column...`);
        await connection.query(`ALTER TABLE ticket_categories ADD COLUMN ${col.name} ${col.type}`);
        console.log(`   ✓ ${col.name} column added`);
      } else {
        console.log(`   ✓ ${col.name} column exists`);
      }
    }

    // ============================================
    // ISSUE TEMPLATES TABLE MIGRATIONS
    // ============================================
    console.log('\n📝 Checking issue_templates table schema...');
    
    const [templateColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'issue_templates'
    `);
    
    const templateColumnsMap = templateColumns.map(col => col.COLUMN_NAME);
    
    // Add missing columns to issue_templates
    const templateColumnsToAdd = [
      { name: 'template_content', type: 'TEXT' },
      { name: 'variables', type: 'JSON' },
      { name: 'is_active', type: 'BOOLEAN DEFAULT TRUE' },
      { name: 'use_count', type: 'INT DEFAULT 0' }
    ];
    
    for (const col of templateColumnsToAdd) {
      if (!templateColumnsMap.includes(col.name)) {
        console.log(`   → Adding ${col.name} column...`);
        await connection.query(`ALTER TABLE issue_templates ADD COLUMN ${col.name} ${col.type}`);
        console.log(`   ✓ ${col.name} column added`);
      } else {
        console.log(`   ✓ ${col.name} column exists`);
      }
    }

    // ============================================
    // TOPIC SUGGESTIONS TABLE MIGRATIONS
    // ============================================
    console.log('\n💡 Checking topic_suggestions table schema...');
    
    const [topicColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'topic_suggestions'
    `);
    
    const topicColumnsMap = topicColumns.map(col => col.COLUMN_NAME);
    
    const topicColumnsToAdd = [
      { name: 'usage_count', type: 'INT DEFAULT 0' },
      { name: 'success_rate', type: 'DECIMAL(5,2) DEFAULT 0' },
      { name: 'avg_resolution_hours', type: 'DECIMAL(10,2) DEFAULT 0' }
    ];
    
    for (const col of topicColumnsToAdd) {
      if (!topicColumnsMap.includes(col.name)) {
        console.log(`   → Adding ${col.name} column...`);
        await connection.query(`ALTER TABLE topic_suggestions ADD COLUMN ${col.name} ${col.type}`);
        console.log(`   ✓ ${col.name} column added`);
      } else {
        console.log(`   ✓ ${col.name} column exists`);
      }
    }

    // ============================================
    // TECHNOLOGIES TABLE MIGRATIONS
    // ============================================
    console.log('\n🔧 Checking agent_expertise table schema...');
    
    const [techColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'agent_expertise'
    `);
    
    const techColumnsMap = techColumns.map(col => col.COLUMN_NAME);
    
    const techColumnsToAdd = [
      { name: 'category', type: 'VARCHAR(100) DEFAULT NULL' },
      { name: 'subcategory', type: 'VARCHAR(100) DEFAULT NULL' },
      { name: 'expertise_level', type: 'ENUM("beginner", "intermediate", "advanced", "expert", "certified") DEFAULT "intermediate"' },
      { name: 'success_rate', type: 'DECIMAL(5,2) DEFAULT 0' },
      { name: 'total_tickets', type: 'INT DEFAULT 0' },
      { name: 'successful_tickets', type: 'INT DEFAULT 0' },
      { name: 'avg_rating', type: 'DECIMAL(3,2) DEFAULT 0' }
    ];
    
    for (const col of techColumnsToAdd) {
      if (!techColumnsMap.includes(col.name)) {
        console.log(`   → Adding ${col.name} column...`);
        await connection.query(`ALTER TABLE agent_expertise ADD COLUMN ${col.name} ${col.type}`);
        console.log(`   ✓ ${col.name} column added`);
      } else {
        console.log(`   ✓ ${col.name} column exists`);
      }
    }

    console.log('\n========================================');
    console.log('✅ Database migrations completed successfully!');
    console.log('========================================\n');
    console.log('You can now run: npm run dev\n');

  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run if called directly
runMigrations().catch(console.error);
