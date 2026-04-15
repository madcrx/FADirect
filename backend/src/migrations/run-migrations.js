const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigrations() {
  console.log('🔄 Running database migrations...\n');

  const migrationFiles = [
    '001_initial_schema.sql',
    '002_add_workflow_features.sql',
    '003_add_soft_delete.sql',
  ];

  try {
    for (const file of migrationFiles) {
      const filePath = path.join(__dirname, file);

      console.log(`📝 Running migration: ${file}`);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${file} - file not found`);
        continue;
      }

      const sql = fs.readFileSync(filePath, 'utf8');

      // Execute the entire file as one query to handle functions properly
      try {
        await db.query(sql);
      } catch (error) {
        // Ignore "already exists" errors
        if (error.code === '42P07' || error.code === '42710' || error.code === '42P04') {
          console.log(`   ℹ️  Some objects already exist, continuing...`);
        } else {
          throw error;
        }
      }

      console.log(`✅ Completed: ${file}\n`);
    }

    console.log('✨ All migrations completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

runMigrations();
