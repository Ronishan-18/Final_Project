import mysql from 'mysql2';
import 'dotenv/config';
import { getDbConfig } from './dbConfig.js';

const pool = mysql.createPool(getDbConfig(process.env));

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL Connection Failed:', err.message);
    return;
  }
  console.log('✅ MySQL Connected to:', process.env.MYSQLDATABASE || process.env.DB_NAME);
  connection.release();
});

export default pool.promise();