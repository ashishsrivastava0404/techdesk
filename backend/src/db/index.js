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
      environment ENUM('dev', 'staging') DEFAULT 'dev',
      priority ENUM('normal', 'high') DEFAULT 'normal',
      status ENUM('open', 'claimed', 'resolved', 'closed') DEFAULT 'open',
      customer_name VARCHAR(255) NOT NULL,
      tech_name VARCHAR(255) DEFAULT NULL,
      base_pay DECIMAL(10,2) DEFAULT 25.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL DEFAULT NULL
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
      status ENUM('pending', 'held', 'released', 'refunded', 'disputed') DEFAULT 'pending',
      payment_method VARCHAR(50),
      transaction_id VARCHAR(255),
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

  await connection.end();
  console.log('Database initialized successfully');
}

export default pool;
