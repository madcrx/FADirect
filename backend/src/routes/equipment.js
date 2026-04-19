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
    cb(null, 'equipment-' + uniqueSuffix + path.extname(file.originalname));
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

// Get all equipment
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, type } = req.query;

    let query = `
      SELECT e.*, v.registration as vehicle_registration,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM equipment_maintenance em
            WHERE em.equipment_id = e.id
            AND em.status IN ('scheduled', 'in_progress')
            AND CURRENT_DATE BETWEEN em.start_date AND em.end_date
          ) THEN 'maintenance'
          ELSE e.status
        END as current_status
      FROM equipment e
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      WHERE e.deleted_at IS NULL
    `;

    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (type) {
      query += ` AND equipment_type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    query += ` ORDER BY name ASC`;

    const result = await db.query(query, params);

    res.json({
      equipment: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        equipmentType: row.equipment_type,
        description: row.description,
        serialNumber: row.serial_number,
        photoUrl: row.photo_url,
        status: row.current_status,
        purchaseDate: row.purchase_date,
        lastMaintenanceDate: row.last_maintenance_date,
        nextMaintenanceDate: row.next_maintenance_date,
        location: row.location,
        vehicleId: row.vehicle_id,
        vehicleRegistration: row.vehicle_registration,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get single equipment item
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM equipment WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Equipment not found' } });
    }

    const row = result.rows[0];
    res.json({
      equipment: {
        id: row.id,
        name: row.name,
        equipmentType: row.equipment_type,
        description: row.description,
        serialNumber: row.serial_number,
        photoUrl: row.photo_url,
        status: row.status,
        purchaseDate: row.purchase_date,
        lastMaintenanceDate: row.last_maintenance_date,
        nextMaintenanceDate: row.next_maintenance_date,
        location: row.location,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Upload equipment photo
router.post('/upload-photo', authenticateToken, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const { equipmentId } = req.body;

    if (!equipmentId) {
      return res.status(400).json({ error: { message: 'Equipment ID is required' } });
    }

    // Generate relative URL for the uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;

    // Update equipment with photo URL
    await db.query(
      `UPDATE equipment SET photo_url = $1, updated_at = NOW() WHERE id = $2`,
      [fileUrl, equipmentId]
    );

    res.json({ photoUrl: fileUrl });
  } catch (error) {
    next(error);
  }
});

// Create equipment
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      name,
      equipmentType,
      description,
      serialNumber,
      photoUrl,
      status,
      purchaseDate,
      location,
      vehicleId,
      notes,
    } = req.body;

    if (!name || !equipmentType) {
      return res.status(400).json({
        error: { message: 'Name and equipment type are required' }
      });
    }

    const result = await db.query(
      `INSERT INTO equipment (
        name, equipment_type, description, serial_number, photo_url,
        status, purchase_date, location, vehicle_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        name,
        equipmentType,
        description || null,
        serialNumber || null,
        photoUrl || null,
        status || 'available',
        purchaseDate || null,
        location || null,
        vehicleId || null,
        notes || null,
      ]
    );

    res.status(201).json({
      message: 'Equipment created successfully',
      equipment: {
        id: result.rows[0].id,
        name: result.rows[0].name,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update equipment
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      equipmentType,
      description,
      serialNumber,
      photoUrl,
      status,
      purchaseDate,
      lastMaintenanceDate,
      nextMaintenanceDate,
      location,
      vehicleId,
      notes,
    } = req.body;

    const result = await db.query(
      `UPDATE equipment SET
        name = COALESCE($1, name),
        equipment_type = COALESCE($2, equipment_type),
        description = COALESCE($3, description),
        serial_number = COALESCE($4, serial_number),
        photo_url = COALESCE($5, photo_url),
        status = COALESCE($6, status),
        purchase_date = COALESCE($7, purchase_date),
        last_maintenance_date = COALESCE($8, last_maintenance_date),
        next_maintenance_date = COALESCE($9, next_maintenance_date),
        location = COALESCE($10, location),
        vehicle_id = $11,
        notes = COALESCE($12, notes)
      WHERE id = $13 AND deleted_at IS NULL
      RETURNING *`,
      [
        name,
        equipmentType,
        description,
        serialNumber,
        photoUrl,
        status,
        purchaseDate,
        lastMaintenanceDate,
        nextMaintenanceDate,
        location,
        vehicleId,
        notes,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Equipment not found' } });
    }

    res.json({
      message: 'Equipment updated successfully',
      equipment: {
        id: result.rows[0].id,
        name: result.rows[0].name,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Soft delete equipment
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(
      'UPDATE equipment SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Equipment not found' } });
    }

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Check equipment availability
router.post('/check-availability', authenticateToken, async (req, res, next) => {
  try {
    const { equipmentId, startTime, endTime, excludeJobId } = req.body;

    // Check if equipment is assigned to any job during the time period
    let query = `
      SELECT EXISTS (
        SELECT 1 FROM job_equipment_assignments jea
        JOIN jobs j ON jea.job_id = j.id
        WHERE jea.equipment_id = $1
          AND j.deleted_at IS NULL
          AND j.status NOT IN ('cancelled', 'completed')
          AND (
            (j.start_time <= $2 AND j.end_time >= $2)
            OR (j.start_time <= $3 AND j.end_time >= $3)
            OR (j.start_time >= $2 AND j.end_time <= $3)
          )
    `;

    const params = [equipmentId, startTime, endTime];

    if (excludeJobId) {
      query += ` AND j.id != $4`;
      params.push(excludeJobId);
    }

    query += `) as in_use`;

    const result = await db.query(query, params);

    res.json({
      available: !result.rows[0].in_use,
      equipmentId,
      startTime,
      endTime,
    });
  } catch (error) {
    next(error);
  }
});

// Get maintenance schedules for equipment
router.get('/:id/maintenance', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT * FROM equipment_maintenance WHERE equipment_id = $1 ORDER BY start_date DESC`,
      [id]
    );
    res.json({
      maintenance: result.rows.map(row => ({
        id: row.id,
        equipmentId: row.equipment_id,
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

// Add maintenance schedule for equipment
router.post('/:id/maintenance', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, reason, status } = req.body;

    const result = await db.query(
      `INSERT INTO equipment_maintenance (equipment_id, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, startDate, endDate, reason, status || 'scheduled']
    );

    res.status(201).json({
      message: 'Maintenance schedule created',
      maintenance: {
        id: result.rows[0].id,
        equipmentId: result.rows[0].equipment_id,
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
    await db.query('DELETE FROM equipment_maintenance WHERE id = $1', [maintenanceId]);
    res.json({ message: 'Maintenance schedule deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
