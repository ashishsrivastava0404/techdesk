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

  try {
    try {
      await connection.query("ALTER TABLE topic_suggestions ADD COLUMN last_used_at TIMESTAMP NULL DEFAULT NULL");
      console.log('✓ Added last_used_at to topic_suggestions');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('✓ last_used_at already exists');
      else console.log('⚠ topic_suggestions:', err.code);
    }
    console.log('\n✅ Migrations complete!');
  } finally {
    await connection.end();
  }
}

runMigrations().catch(console.error);
