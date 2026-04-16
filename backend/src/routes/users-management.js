const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Middleware to check admin access
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: { message: 'Admin access required' } });
  }
  next();
};

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, phone_number, name, email, role, created_at, last_seen
       FROM users
       ORDER BY created_at DESC`
    );

    res.json({
      users: result.rows.map(user => ({
        id: user.id,
        phoneNumber: user.phone_number,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        lastSeen: user.last_seen,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get single user by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, phone_number, name, email, role, created_at, last_seen FROM users WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        lastSeen: user.last_seen,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create new user (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { phoneNumber, name, email, role } = req.body;

    // Validate required fields
    if (!phoneNumber || !name || !role) {
      return res.status(400).json({
        error: { message: 'Phone number, name, and role are required' },
      });
    }

    // Check if user already exists
    const existing = await db.query(
      'SELECT id FROM users WHERE phone_number = $1',
      [phoneNumber]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: { message: 'User with this phone number already exists' },
      });
    }

    // Create user
    const result = await db.query(
      `INSERT INTO users (phone_number, name, email, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, phone_number, name, email, role, created_at, last_seen`,
      [phoneNumber, name, email || null, role]
    );

    const user = result.rows[0];
    res.status(201).json({
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        lastSeen: user.last_seen,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { name, email, role } = req.body;

    const result = await db.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           role = COALESCE($3, role)
       WHERE id = $4
       RETURNING id, phone_number, name, email, role, created_at, last_seen`,
      [name, email, role, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        lastSeen: user.last_seen,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    // Check if user exists
    const user = await db.query('SELECT id FROM users WHERE id = $1', [req.params.id]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    // Prevent deleting self
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: { message: 'Cannot delete your own account' } });
    }

    // Delete user
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
