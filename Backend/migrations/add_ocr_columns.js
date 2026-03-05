/**
 * Migration: Add OCR columns to transactions table
 * Run this script to add enhanced OCR functionality to existing transactions
 */

const db = require('../config/db');

async function addOCRColumns() {
  let connection;
  
  try {
    connection = await db.getConnection();
    console.log('🔧 Adding OCR columns to transactions table...');

    // Check if columns already exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'transactions'
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);

    // Columns to add
    const columnsToAdd = [
      { name: 'merchant_name', sql: 'VARCHAR(255)' },
      { name: 'payment_method', sql: 'VARCHAR(100)' },
      { name: 'transaction_date', sql: 'DATE' },
      { name: 'ocr_confidence', sql: 'FLOAT' },
      { name: 'parsing_confidence', sql: 'FLOAT' },
      { name: 'raw_text', sql: 'TEXT' }
    ];

    // Add missing columns
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        console.log(`➕ Adding column: ${column.name}`);
        await connection.execute(`
          ALTER TABLE transactions 
          ADD COLUMN ${column.name} ${column.sql}
        `);
      } else {
        console.log(`✅ Column ${column.name} already exists`);
      }
    }

    console.log('✅ OCR columns migration completed successfully');

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  addOCRColumns()
    .then(() => {
      console.log('🎉 Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addOCRColumns;
