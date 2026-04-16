const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

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
    const { status, lastServiceDate, nextServiceDate } = req.body;

    await db.query(`
      UPDATE vehicles SET
        status = COALESCE($1, status),
        last_service_date = COALESCE($2, last_service_date),
        next_service_date = COALESCE($3, next_service_date),
        updated_at = NOW()
      WHERE id = $4
    `, [status, lastServiceDate, nextServiceDate, id]);

    res.json({ message: 'Vehicle updated successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
