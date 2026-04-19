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
      SELECT v.*, u.name as allocated_to_staff_name,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM vehicle_maintenance vm
            WHERE vm.vehicle_id = v.id
            AND vm.status IN ('scheduled', 'in_progress')
            AND CURRENT_DATE BETWEEN vm.start_date AND vm.end_date
          ) THEN 'maintenance'
          ELSE v.status
        END as current_status
      FROM vehicles v
      LEFT JOIN users u ON v.allocated_to_staff_id = u.id
      WHERE v.deleted_at IS NULL
      ORDER BY v.vehicle_type, v.make, v.model ASC
    `);

    res.json({
      vehicles: result.rows.map(row => ({
        id: row.id,
        vehicleType: row.vehicle_type,
        make: row.make,
        model: row.model,
        year: row.year,
        registration: row.registration,
        registrationExpiry: row.registration_expiry,
        color: row.color,
        photoUrl: row.photo_url,
        seatingCapacity: row.seating_capacity,
        transmission: row.transmission,
        engineNumber: row.engine_number,
        vinNumber: row.vin_number,
        allocatedToStaffId: row.allocated_to_staff_id,
        allocatedToStaffName: row.allocated_to_staff_name,
        status: row.current_status,
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
      registrationExpiry,
      color,
      photoUrl,
      seatingCapacity,
      transmission,
      engineNumber,
      vinNumber,
      allocatedToStaffId,
    } = req.body;

    const result = await db.query(`
      INSERT INTO vehicles (
        vehicle_type, make, model, year, registration, registration_expiry,
        color, photo_url, seating_capacity, transmission, engine_number,
        vin_number, allocated_to_staff_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      vehicleType, make, model, year, registration, registrationExpiry,
      color, photoUrl, seatingCapacity, transmission, engineNumber,
      vinNumber, allocatedToStaffId
    ]);

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
      registrationExpiry,
      color,
      seatingCapacity,
      transmission,
      engineNumber,
      vinNumber,
      allocatedToStaffId,
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
        registration_expiry = COALESCE($6, registration_expiry),
        color = COALESCE($7, color),
        seating_capacity = COALESCE($8, seating_capacity),
        transmission = COALESCE($9, transmission),
        engine_number = COALESCE($10, engine_number),
        vin_number = COALESCE($11, vin_number),
        allocated_to_staff_id = $12,
        status = COALESCE($13, status),
        last_service_date = COALESCE($14, last_service_date),
        next_service_date = COALESCE($15, next_service_date),
        updated_at = NOW()
      WHERE id = $16
    `, [
      vehicleType, make, model, year, registration, registrationExpiry,
      color, seatingCapacity, transmission, engineNumber, vinNumber,
      allocatedToStaffId, status, lastServiceDate, nextServiceDate, id
    ]);

    res.json({ message: 'Vehicle updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Get maintenance schedules for a vehicle
router.get('/:id/maintenance', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT * FROM vehicle_maintenance WHERE vehicle_id = $1 ORDER BY start_date DESC`,
      [id]
    );
    res.json({
      maintenance: result.rows.map(row => ({
        id: row.id,
        vehicleId: row.vehicle_id,
        startDate: row.start_date,
        endDate: row.end_date,
        reason: row.reason,
        status: row.status,
        createdAt: row.created_at,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Add maintenance schedule for a vehicle
router.post('/:id/maintenance', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, reason, status } = req.body;

    const result = await db.query(
      `INSERT INTO vehicle_maintenance (vehicle_id, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, startDate, endDate, reason, status || 'scheduled']
    );

    res.status(201).json({
      message: 'Maintenance schedule created',
      maintenance: {
        id: result.rows[0].id,
        vehicleId: result.rows[0].vehicle_id,
        startDate: result.rows[0].start_date,
        endDate: result.rows[0].end_date,
        reason: result.rows[0].reason,
        status: result.rows[0].status,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete maintenance schedule
router.delete('/:id/maintenance/:maintenanceId', authenticateToken, async (req, res, next) => {
  try {
    const { maintenanceId } = req.params;
    await db.query('DELETE FROM vehicle_maintenance WHERE id = $1', [maintenanceId]);
    res.json({ message: 'Maintenance schedule deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
