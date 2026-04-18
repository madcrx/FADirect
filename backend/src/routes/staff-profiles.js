const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'staff-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    // Allow common image mimetypes
    const allowedMimetypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/heic', 'image/heif'];
    const allowedExtensions = /jpeg|jpg|png|gif|heic|heif/;

    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimetypes.includes(file.mimetype.toLowerCase());

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only images are allowed (jpg, png, gif, heic).'));
  },
});

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

// Upload staff photo
router.post('/upload-photo', authenticateToken, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: { message: 'User ID is required' } });
    }

    // Generate relative URL for the uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;

    // Update staff profile with photo URL
    await db.query(
      `INSERT INTO staff_profiles (user_id, photo_url)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET
         photo_url = EXCLUDED.photo_url,
         updated_at = NOW()`,
      [userId, fileUrl]
    );

    res.json({ photoUrl: fileUrl });
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

    // Check if profile exists to determine if we should update photo_url
    const existingProfile = await db.query(
      'SELECT photo_url FROM staff_profiles WHERE user_id = $1',
      [userId]
    );

    // Use existing photo URL if no new photo URL provided
    const finalPhotoUrl = photoUrl || (existingProfile.rows[0]?.photo_url) || null;

    const result = await db.query(`
      INSERT INTO staff_profiles (
        user_id, photo_url, position, license_number, license_expiry,
        qualifications, emergency_contact_name, emergency_contact_phone, is_available
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id) DO UPDATE SET
        photo_url = COALESCE(EXCLUDED.photo_url, staff_profiles.photo_url),
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
      finalPhotoUrl,
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
