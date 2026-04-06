import db from '../config/db.js';

const migs = [
  "ALTER TABLE profiles ADD COLUMN first_name VARCHAR(100) DEFAULT NULL AFTER full_name",
  "ALTER TABLE profiles ADD COLUMN last_name VARCHAR(100) DEFAULT NULL AFTER first_name",
  "ALTER TABLE profiles ADD COLUMN gender VARCHAR(20) DEFAULT NULL AFTER date_of_birth",
  "ALTER TABLE profiles ADD COLUMN nic_passport VARCHAR(50) DEFAULT NULL AFTER gender",
  "ALTER TABLE profiles ADD COLUMN city VARCHAR(100) DEFAULT NULL AFTER country",
  "ALTER TABLE profiles ADD COLUMN address TEXT DEFAULT NULL AFTER phone",
  "ALTER TABLE profiles ADD COLUMN nickname VARCHAR(100) DEFAULT NULL AFTER address",
  "ALTER TABLE profiles ADD COLUMN social_google VARCHAR(255) DEFAULT NULL",
  "ALTER TABLE profiles ADD COLUMN social_steam VARCHAR(255) DEFAULT NULL",
  "ALTER TABLE profiles ADD COLUMN social_discord VARCHAR(255) DEFAULT NULL",
  "ALTER TABLE profiles ADD COLUMN arena_of_valor_id VARCHAR(100) DEFAULT NULL",
  "ALTER TABLE profiles ADD COLUMN cricket_sixes_id VARCHAR(100) DEFAULT NULL",
  "ALTER TABLE profiles ADD COLUMN minecraft_id VARCHAR(100) DEFAULT NULL",
  "ALTER TABLE profiles ADD COLUMN krunker_id VARCHAR(100) DEFAULT NULL",
  "ALTER TABLE profiles ADD COLUMN fifa_mobile_id VARCHAR(100) DEFAULT NULL",
  "ALTER TABLE profiles ADD COLUMN honor_of_kings_id VARCHAR(100) DEFAULT NULL",
  "ALTER TABLE profiles ADD COLUMN identity_v_id VARCHAR(100) DEFAULT NULL"
];

async function run() {
  console.log('🚀 Starting profile schema migrations...');
  for (const sql of migs) {
    try {
      console.log(`Running: ${sql.substring(0, 50)}...`);
      await db.query(sql);
      console.log('✅ Success');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ Column already exists, skipping.');
      } else {
        console.error(`❌ Error: ${err.message}`);
      }
    }
  }
  console.log('🏁 Finished migrations.');
  process.exit(0);
}
run();
