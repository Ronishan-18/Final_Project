import db from './config/db.js';

async function checkSchema() {
  try {
    const [columns] = await db.query('DESCRIBE profiles');
    console.log('Columns in profiles table:');
    columns.forEach(col => console.log(`- ${col.Field}`));
    process.exit(0);
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema();
