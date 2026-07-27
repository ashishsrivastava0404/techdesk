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

  try {
    // topic_suggestions
    await addColumn('topic_suggestions', 'last_used_at', 'TIMESTAMP NULL DEFAULT NULL');
    
    // tickets - add first_response_at
    await addColumn('tickets', 'first_response_at', 'TIMESTAMP NULL DEFAULT NULL');
    
    // tech_earnings - add tech_name (if it uses different column name)
    try {
      const [cols] = await connection.query("DESCRIBE tech_earnings");
      const hasTechName = cols.some(c => c.Field === 'tech_name');
      if (!hasTechName) {
        // Check what column exists instead
        const firstCol = cols[0];
        if (firstCol && firstCol.Field === 'user_name') {
          await connection.query("ALTER TABLE tech_earnings CHANGE COLUMN user_name tech_name VARCHAR(255)");
          console.log('✓ Renamed user_name to tech_name in tech_earnings');
        }
      } else {
        console.log('✓ tech_name exists in tech_earnings');
      }
    } catch (err) {
      console.log(`⚠ tech_earnings check: ${err.code}`);
    }
    
    // tech_payouts - add tech_name
    try {
      const [cols] = await connection.query("DESCRIBE tech_payouts");
      const hasTechName = cols.some(c => c.Field === 'tech_name');
      if (!hasTechName) {
        const firstCol = cols[0];
        if (firstCol && firstCol.Field === 'user_name') {
          await connection.query("ALTER TABLE tech_payouts CHANGE COLUMN user_name tech_name VARCHAR(255)");
          console.log('✓ Renamed user_name to tech_name in tech_payouts');
        }
      } else {
        console.log('✓ tech_name exists in tech_payouts');
      }
    } catch (err) {
      console.log(`⚠ tech_payouts check: ${err.code}`);
    }
    
    // crm_contacts - add user_type
    await addColumn('crm_contacts', 'user_type', "ENUM('customer', 'tech', 'other') DEFAULT 'customer'");

    console.log('\n✅ Migrations complete!');
  } finally {
    await connection.end();
  }
}

runMigrations().catch(console.error);
