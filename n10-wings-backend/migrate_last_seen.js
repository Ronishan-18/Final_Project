import db from './config/db.js';

async function updateSchema() {
  try {
    console.log('--- Migrating Database ---');
    
    // Add last_seen to users table
    try {
        await db.query(`ALTER TABLE users ADD COLUMN last_seen DATETIME DEFAULT NULL`);
        console.log('✅ Added last_seen column to users table');
    } catch (e) {
        if (e.code === 'ER_DUP_COLUMN_NAME') {
            console.log('ℹ️ last_seen column already exists');
        } else {
            throw e;
        }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

updateSchema();
