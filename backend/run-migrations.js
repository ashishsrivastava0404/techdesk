/**
 * Run database migrations manually
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'techdesk'
  });

  console.log('Running migrations...\n');

  const addColumn = async (table, column, definition) => {
    try {
      await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      console.log(`✓ Added ${column} to ${table}`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log(`✓ ${column} already exists in ${table}`);
      } else {
        console.log(`⚠ ${table}.${column}: ${err.code}`);
      }
    }
  };

  const createTable = async (table, sql) => {
    try {
      await connection.query(sql);
      console.log(`✓ Created ${table} table`);
    } catch (err) {
      if (err.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log(`✓ ${table} table already exists`);
      } else {
        console.log(`⚠ ${table}: ${err.code}`);
      }
    }
  };

  try {
    // topic_suggestions - add last_used_at
    await addColumn('topic_suggestions', 'last_used_at', 'TIMESTAMP NULL DEFAULT NULL');
    
    // tickets - add first_response_at
    await addColumn('tickets', 'first_response_at', 'TIMESTAMP NULL DEFAULT NULL');
    
    // crm_contacts - add user_type
    await addColumn('crm_contacts', 'user_type', "ENUM('customer', 'tech', 'other') DEFAULT 'customer'");
    
    // tech_earnings - rename user_name to tech_name if needed
    try {
      const [cols] = await connection.query("DESCRIBE tech_earnings");
      const hasTechName = cols.some(c => c.Field === 'tech_name');
      const hasUserName = cols.some(c => c.Field === 'user_name');
      if (hasUserName && !hasTechName) {
        await connection.query("ALTER TABLE tech_earnings CHANGE COLUMN user_name tech_name VARCHAR(255)");
        console.log('✓ Renamed user_name to tech_name in tech_earnings');
      } else if (hasTechName) {
        console.log('✓ tech_name exists in tech_earnings');
      }
    } catch (err) {
      console.log(`⚠ tech_earnings check: ${err.code}`);
    }
    
    // tech_payouts - rename user_name to tech_name if needed
    try {
      const [cols] = await connection.query("DESCRIBE tech_payouts");
      const hasTechName = cols.some(c => c.Field === 'tech_name');
      const hasUserName = cols.some(c => c.Field === 'user_name');
      if (hasUserName && !hasTechName) {
        await connection.query("ALTER TABLE tech_payouts CHANGE COLUMN user_name tech_name VARCHAR(255)");
        console.log('✓ Renamed user_name to tech_name in tech_payouts');
      } else if (hasTechName) {
        console.log('✓ tech_name exists in tech_payouts');
      }
    } catch (err) {
      console.log(`⚠ tech_payouts check: ${err.code}`);
    }
    
    // Create expert_skills table
    await createTable('expert_skills', `
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
    
    // Create expert_stats table
    await createTable('expert_stats', `
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
    
    // Create tech_stack table
    await createTable('tech_stack', `
      CREATE TABLE IF NOT EXISTS tech_stack (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        certified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create currencies table if not exists (for currency service)
    await createTable('currencies', `
      CREATE TABLE IF NOT EXISTS currencies (
        code VARCHAR(3) PRIMARY KEY,
        symbol VARCHAR(10) NOT NULL,
        name VARCHAR(100) NOT NULL,
        decimal_places INT DEFAULT 2,
        exchange_rate_to_usd DECIMAL(15,6) DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Insert default currencies if empty
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM currencies');
    if (rows[0].count === 0) {
      await connection.query(`
        INSERT INTO currencies (code, symbol, name, decimal_places, exchange_rate_to_usd) VALUES
        ('USD', '$', 'US Dollar', 2, 1.000000),
        ('EUR', '€', 'Euro', 2, 0.850000),
        ('GBP', '£', 'British Pound', 2, 0.730000),
        ('INR', '₹', 'Indian Rupee', 2, 74.500000),
        ('JPY', '¥', 'Japanese Yen', 0, 110.000000)
      `);
      console.log('✓ Inserted default currencies');
    }

    console.log('\n✅ Migrations complete!');
  } finally {
    await connection.end();
  }
}

runMigrations().catch(console.error);
