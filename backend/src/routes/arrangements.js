const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all arrangements for current user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT a.*, u.name as arranger_name
       FROM arrangements a
       LEFT JOIN users u ON a.arranger_id = u.id
       LEFT JOIN arrangement_participants ap ON a.id = ap.arrangement_id
       WHERE a.arranger_id = $1 OR ap.user_id = $1
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    res.json({ arrangements: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get single arrangement
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM arrangements WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Arrangement not found' } });
    }
    res.json({ arrangement: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Create arrangement
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { deceasedName, deceasedDateOfBirth, deceasedDateOfDeath, serviceDate, serviceLocation, notes } = req.body;
    const result = await db.query(
      `INSERT INTO arrangements (deceased_name, deceased_date_of_birth, deceased_date_of_death, arranger_id, service_date, service_location, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [deceasedName, deceasedDateOfBirth, deceasedDateOfDeath, req.user.id, serviceDate, serviceLocation, notes]
    );
    res.status(201).json({ arrangement: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update arrangement
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { deceasedName, serviceDate, serviceLocation, notes, status } = req.body;
    const result = await db.query(
      `UPDATE arrangements
       SET deceased_name = COALESCE($1, deceased_name),
           service_date = COALESCE($2, service_date),
           service_location = COALESCE($3, service_location),
           notes = COALESCE($4, notes),
           status = COALESCE($5, status)
       WHERE id = $6 AND arranger_id = $7
       RETURNING *`,
      [deceasedName, serviceDate, serviceLocation, notes, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Arrangement not found or unauthorized' } });
    }
    res.json({ arrangement: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
