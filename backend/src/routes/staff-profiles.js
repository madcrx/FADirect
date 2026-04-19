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
        u.role,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM staff_leave sl
            WHERE sl.user_id = u.id
            AND sl.status = 'approved'
            AND CURRENT_DATE BETWEEN sl.start_date AND sl.end_date
          ) THEN false
          ELSE sp.is_available
        END as is_available_now
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
        isAvailable: row.is_available_now,
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

// Get all leave periods (for management)
router.get('/leave/all', authenticateToken, async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT sl.*, u.name as staff_name
      FROM staff_leave sl
      JOIN users u ON sl.user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    if (status) {
      query += ` AND sl.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY sl.created_at DESC`;

    const result = await db.query(query, params);

    res.json({
      leave: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        staffName: row.staff_name,
        startDate: row.start_date,
        endDate: row.end_date,
        leaveType: row.leave_type,
        reason: row.reason,
        status: row.status,
        createdAt: row.created_at,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get leave periods for a staff member
router.get('/:id/leave', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get user_id from staff profile
    const staffProfile = await db.query('SELECT user_id FROM staff_profiles WHERE id = $1', [id]);
    if (staffProfile.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Staff profile not found' } });
    }

    const userId = staffProfile.rows[0].user_id;
    const result = await db.query(
      `SELECT * FROM staff_leave WHERE user_id = $1 ORDER BY start_date DESC`,
      [userId]
    );

    res.json({
      leave: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        startDate: row.start_date,
        endDate: row.end_date,
        leaveType: row.leave_type,
        reason: row.reason,
        status: row.status,
        createdAt: row.created_at,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Add leave period for a staff member
router.post('/:id/leave', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, leaveType, reason, status } = req.body;

    // Get user_id from staff profile
    const staffProfile = await db.query('SELECT user_id FROM staff_profiles WHERE id = $1', [id]);
    if (staffProfile.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Staff profile not found' } });
    }

    const userId = staffProfile.rows[0].user_id;
    const result = await db.query(
      `INSERT INTO staff_leave (user_id, start_date, end_date, leave_type, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, startDate, endDate, leaveType || 'annual', reason, status || 'approved']
    );

    res.status(201).json({
      message: 'Leave period created',
      leave: {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        startDate: result.rows[0].start_date,
        endDate: result.rows[0].end_date,
        leaveType: result.rows[0].leave_type,
        reason: result.rows[0].reason,
        status: result.rows[0].status,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update leave status
router.put('/:id/leave/:leaveId', authenticateToken, async (req, res, next) => {
  try {
    const { leaveId } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: { message: 'Invalid status' } });
    }

    const result = await db.query(
      `UPDATE staff_leave SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, leaveId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Leave period not found' } });
    }

    res.json({
      message: 'Leave status updated',
      leave: {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        startDate: result.rows[0].start_date,
        endDate: result.rows[0].end_date,
        leaveType: result.rows[0].leave_type,
        reason: result.rows[0].reason,
        status: result.rows[0].status,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete leave period
router.delete('/:id/leave/:leaveId', authenticateToken, async (req, res, next) => {
  try {
    const { leaveId } = req.params;
    await db.query('DELETE FROM staff_leave WHERE id = $1', [leaveId]);
    res.json({ message: 'Leave period deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
