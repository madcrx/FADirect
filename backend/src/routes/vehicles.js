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
    cb(null, 'vehicle-' + uniqueSuffix + path.extname(file.originalname));
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

// Get all vehicles
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT * FROM vehicles
      WHERE deleted_at IS NULL
      ORDER BY vehicle_type, make, model ASC
    `);

    res.json({
      vehicles: result.rows.map(row => ({
        id: row.id,
        vehicleType: row.vehicle_type,
        make: row.make,
        model: row.model,
        year: row.year,
        registration: row.registration,
        color: row.color,
        photoUrl: row.photo_url,
        seatingCapacity: row.seating_capacity,
        status: row.status,
        lastServiceDate: row.last_service_date,
        nextServiceDate: row.next_service_date,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Upload vehicle photo
router.post('/upload-photo', authenticateToken, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const { vehicleId } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ error: { message: 'Vehicle ID is required' } });
    }

    // Generate relative URL for the uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;

    // Update vehicle with photo URL
    await db.query(
      `UPDATE vehicles SET photo_url = $1, updated_at = NOW() WHERE id = $2`,
      [fileUrl, vehicleId]
    );

    res.json({ photoUrl: fileUrl });
  } catch (error) {
    next(error);
  }
});

// Create vehicle
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      vehicleType,
      make,
      model,
      year,
      registration,
      color,
      photoUrl,
      seatingCapacity,
    } = req.body;

    const result = await db.query(`
      INSERT INTO vehicles (
        vehicle_type, make, model, year, registration, color,
        photo_url, seating_capacity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [vehicleType, make, model, year, registration, color, photoUrl, seatingCapacity]);

    res.status(201).json({
      message: 'Vehicle created successfully',
      vehicle: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Update vehicle
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      vehicleType,
      make,
      model,
      year,
      registration,
      color,
      seatingCapacity,
      status,
      lastServiceDate,
      nextServiceDate
    } = req.body;

    await db.query(`
      UPDATE vehicles SET
        vehicle_type = COALESCE($1, vehicle_type),
        make = COALESCE($2, make),
        model = COALESCE($3, model),
        year = COALESCE($4, year),
        registration = COALESCE($5, registration),
        color = COALESCE($6, color),
        seating_capacity = COALESCE($7, seating_capacity),
        status = COALESCE($8, status),
        last_service_date = COALESCE($9, last_service_date),
        next_service_date = COALESCE($10, next_service_date),
        updated_at = NOW()
      WHERE id = $11
    `, [vehicleType, make, model, year, registration, color, seatingCapacity, status, lastServiceDate, nextServiceDate, id]);

    res.json({ message: 'Vehicle updated successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
