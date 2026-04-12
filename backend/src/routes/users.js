const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

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
    const { name, profilePhotoUrl } = req.body;
    const result = await db.query(
      'UPDATE users SET name = COALESCE($1, name), profile_photo_url = COALESCE($2, profile_photo_url) WHERE id = $3 RETURNING *',
      [name, profilePhotoUrl, req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
