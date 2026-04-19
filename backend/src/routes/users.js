const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Find or create user by phone
router.post('/find-or-create', authenticateToken, async (req, res, next) => {
  try {
    const { phoneNumber, name, role } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: { message: 'Phone number is required' } });
    }

    // Check if user exists
    let result = await db.query('SELECT * FROM users WHERE phone_number = $1', [phoneNumber]);

    if (result.rows.length > 0) {
      // User exists
      return res.json({ user: result.rows[0] });
    }

    // Create new user
    // Ensure role is an array
    const rolesArray = Array.isArray(role) ? role : (role ? [role] : ['mourner']);

    result = await db.query(
      `INSERT INTO users (phone_number, name, role, phone_verified)
       VALUES ($1, $2, $3, FALSE)
       RETURNING *`,
      [phoneNumber, name || null, rolesArray]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Get user profile
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        profilePhotoUrl: user.profile_photo_url,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/me', authenticateToken, async (req, res, next) => {
  try {
    const { name, role, profilePhotoUrl, email } = req.body;

    const validRoles = ['admin', 'management', 'arranger', 'conductor', 'funeral_director_assistant', 'embalmer', 'hearse_driver', 'coach_driver', 'mourner'];

    // Validate roles if provided
    if (role) {
      const rolesArray = Array.isArray(role) ? role : [role];
      const invalidRoles = rolesArray.filter(r => !validRoles.includes(r));
      if (invalidRoles.length > 0) {
        return res.status(400).json({
          error: { message: `Invalid roles: ${invalidRoles.join(', ')}. Must be one of: ${validRoles.join(', ')}` }
        });
      }
    }

    const result = await db.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           role = COALESCE($2, role),
           email = COALESCE($3, email),
           profile_photo_url = COALESCE($4, profile_photo_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, role, email, profilePhotoUrl, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    res.json({
      success: true,
      user: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        role: result.rows[0].role,
        email: result.rows[0].email,
        phoneNumber: result.rows[0].phone_number,
        profilePhotoUrl: result.rows[0].profile_photo_url,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user by ID (for admin/staff management)
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, email } = req.body;

    const validRoles = ['admin', 'management', 'arranger', 'conductor', 'funeral_director_assistant', 'embalmer', 'hearse_driver', 'coach_driver', 'mourner'];

    // Validate roles if provided
    if (role) {
      const rolesArray = Array.isArray(role) ? role : [role];
      const invalidRoles = rolesArray.filter(r => !validRoles.includes(r));
      if (invalidRoles.length > 0) {
        return res.status(400).json({
          error: { message: `Invalid roles: ${invalidRoles.join(', ')}. Must be one of: ${validRoles.join(', ')}` }
        });
      }
    }

    const result = await db.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           role = COALESCE($2, role),
           email = COALESCE($3, email),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [name, role, email, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    res.json({
      success: true,
      user: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        role: result.rows[0].role,
        email: result.rows[0].email,
        phoneNumber: result.rows[0].phone_number,
        profilePhotoUrl: result.rows[0].profile_photo_url,
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
