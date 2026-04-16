const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        phone_number,
        name,
        role,
        phone_verified,
        profile_photo_url,
        created_at,
        last_seen
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({
      users: result.rows.map(row => ({
        id: row.id,
        phoneNumber: row.phone_number,
        name: row.name,
        email: '', // Users table doesn't have email
        role: row.role,
        phoneVerified: row.phone_verified,
        profilePhotoUrl: row.profile_photo_url,
        createdAt: row.created_at,
        lastSeen: row.last_seen,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Create user (admin only)
router.post('/users', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { phoneNumber, name, role } = req.body;

    if (!phoneNumber || !name || !role) {
      return res.status(400).json({
        error: { message: 'Phone number, name, and role are required' }
      });
    }

    const result = await db.query(
      `INSERT INTO users (phone_number, name, role, phone_verified)
       VALUES ($1, $2, $3, FALSE)
       RETURNING *`,
      [phoneNumber, name, role]
    );

    res.status(201).json({
      success: true,
      user: {
        id: result.rows[0].id,
        phoneNumber: result.rows[0].phone_number,
        name: result.rows[0].name,
        role: result.rows[0].role,
      }
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        error: { message: 'A user with this phone number already exists' }
      });
    }
    next(error);
  }
});

// Update user (admin only)
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { name, role } = req.body;

    const result = await db.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           role = COALESCE($2, role),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [name, role, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    res.json({
      success: true,
      user: {
        id: result.rows[0].id,
        phoneNumber: result.rows[0].phone_number,
        name: result.rows[0].name,
        role: result.rows[0].role,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    // Don't allow deleting yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        error: { message: 'Cannot delete your own account' }
      });
    }

    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
