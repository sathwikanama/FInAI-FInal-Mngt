/**
 * OCR Migration Runner
 * Run this script to add OCR columns to the transactions table
 */

const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runOCRMigration() {
  let connection;
  
  try {
    console.log('🔍 Checking if OCR columns exist...');
    
    connection = await db.getConnection();
    
    // Check if merchant_name column exists
    const [columns] = await connection.execute(
      `SHOW COLUMNS FROM transactions LIKE 'merchant_name'`
    );
    
    if (columns.length === 0) {
      console.log('📝 OCR columns not found. Running migration...');
      
      // Read and execute the migration SQL
      const migrationSQL = fs.readFileSync(
        path.join(__dirname, 'migrations/add_ocr_columns.sql'),
        'utf8'
      );
      
      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('🔄 Executing:', statement.substring(0, 50) + '...');
          await connection.execute(statement);
        }
      }
      
      console.log('✅ OCR migration completed successfully!');
    } else {
      console.log('✅ OCR columns already exist');
    }
    
    // Show table structure
    const [structure] = await connection.execute('DESCRIBE transactions');
    console.log('\n📊 Transactions table structure:');
    structure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  runOCRMigration();
}

module.exports = runOCRMigration;
