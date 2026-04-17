const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all staff profiles
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        sp.*,
        u.name as full_name,
        u.phone_number,
        u.role
      FROM staff_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE NOT (u.role @> ARRAY['mourner']::TEXT[])
      ORDER BY u.name ASC
    `);

    res.json({
      staff: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        fullName: row.full_name,
        email: row.email || '',
        phoneNumber: row.phone_number,
        role: row.role,
        photoUrl: row.photo_url,
        position: row.position,
        licenseNumber: row.license_number,
        licenseExpiry: row.license_expiry,
        qualifications: row.qualifications,
        emergencyContactName: row.emergency_contact_name,
        emergencyContactPhone: row.emergency_contact_phone,
        isAvailable: row.is_available,
        userIsActive: true,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Create or update staff profile
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      userId,
      photoUrl,
      position,
      licenseNumber,
      licenseExpiry,
      qualifications,
      emergencyContactName,
      emergencyContactPhone,
      isAvailable,
    } = req.body;

    const result = await db.query(`
      INSERT INTO staff_profiles (
        user_id, photo_url, position, license_number, license_expiry,
        qualifications, emergency_contact_name, emergency_contact_phone, is_available
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id) DO UPDATE SET
        photo_url = EXCLUDED.photo_url,
        position = EXCLUDED.position,
        license_number = EXCLUDED.license_number,
        license_expiry = EXCLUDED.license_expiry,
        qualifications = EXCLUDED.qualifications,
        emergency_contact_name = EXCLUDED.emergency_contact_name,
        emergency_contact_phone = EXCLUDED.emergency_contact_phone,
        is_available = EXCLUDED.is_available,
        updated_at = NOW()
      RETURNING *
    `, [
      userId,
      photoUrl,
      position,
      licenseNumber,
      licenseExpiry,
      qualifications,
      emergencyContactName,
      emergencyContactPhone,
      isAvailable !== undefined ? isAvailable : true,
    ]);

    res.json({
      message: 'Staff profile saved successfully',
      profile: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
