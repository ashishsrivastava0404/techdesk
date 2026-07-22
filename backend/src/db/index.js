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

  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      role ENUM('customer', 'tech') DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL DEFAULT NULL
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      tech_name VARCHAR(255) NOT NULL,
      rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS hire_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tech_name VARCHAR(255) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      contact VARCHAR(255) NOT NULL,
      status ENUM('sent', 'accepted', 'declined') DEFAULT 'sent',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.end();
  console.log('Database initialized successfully');
}

export default pool;
