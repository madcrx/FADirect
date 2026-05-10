const db = require('../config/database');

/**
 * Creates a staff profile for an existing user by phone number
 * Usage: node src/scripts/create-staff-profile-for-user.js "+61123456789"
 */

async function createStaffProfileForUser(phoneNumber) {
  try {
    // Find user by phone number
    const userResult = await db.query(
      'SELECT id, name, phone_number FROM users WHERE phone_number = $1',
      [phoneNumber]
    );

    if (userResult.rows.length === 0) {
      console.error(`❌ No user found with phone number: ${phoneNumber}`);
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`✓ Found user: ${user.name} (${user.id})`);

    // Check if staff profile already exists
    const existingProfile = await db.query(
      'SELECT id FROM staff_profiles WHERE user_id = $1',
      [user.id]
    );

    if (existingProfile.rows.length > 0) {
      console.log(`✓ Staff profile already exists for ${user.name}`);
      process.exit(0);
    }

    // Create staff profile
    const result = await db.query(
      `INSERT INTO staff_profiles (
        user_id,
        position,
        is_available
      ) VALUES ($1, $2, $3)
      RETURNING *`,
      [
        user.id,
        'Staff Member', // Default position
        true // Available by default
      ]
    );

    console.log(`✅ Created staff profile for ${user.name}`);
    console.log(`   Profile ID: ${result.rows[0].id}`);
    console.log(`   Position: Staff Member`);
    console.log('\n💡 User can now update their profile details in the Staff page');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating staff profile:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Get phone number from command line argument
const phoneNumber = process.argv[2];

if (!phoneNumber) {
  console.error('Usage: node src/scripts/create-staff-profile-for-user.js "+61123456789"');
  process.exit(1);
}

createStaffProfileForUser(phoneNumber);
