const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigrations() {
  console.log('🔄 Running database migrations...\n');

  const migrationFiles = [
    '001_initial_schema.sql',
    '002_add_workflow_features.sql',
    '003_add_soft_delete.sql',
    '004_add_price_lists_invoices.sql',
    '005_add_government_forms.sql',
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
        // Ignore "already exists" errors:
        // 42P07 = relation already exists
        // 42710 = object already exists
        // 42P04 = database already exists
        // 42701 = duplicate column
        const ignoredErrors = ['42P07', '42710', '42P04', '42701'];
        if (ignoredErrors.includes(error.code)) {
          console.log(`   ℹ️  Some objects already exist (${error.code}), continuing...`);
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
