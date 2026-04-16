const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all price list items
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM price_list_items
       WHERE deleted_at IS NULL
       ORDER BY category, name ASC`
    );

    res.json({
      items: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        basePrice: parseFloat(row.base_price),
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Create price list item
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { name, description, category, basePrice, active } = req.body;

    if (!name || !category || basePrice === undefined) {
      return res.status(400).json({
        error: { message: 'Name, category, and base price are required' },
      });
    }

    const result = await db.query(
      `INSERT INTO price_list_items (name, description, category, base_price, active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description || null, category, basePrice, active !== false]
    );

    const item = result.rows[0];
    res.status(201).json({
      item: {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        basePrice: parseFloat(item.base_price),
        active: item.active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update price list item
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { name, description, category, basePrice, active } = req.body;

    const result = await db.query(
      `UPDATE price_list_items
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           base_price = COALESCE($4, base_price),
           active = COALESCE($5, active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND deleted_at IS NULL
       RETURNING *`,
      [name, description, category, basePrice, active, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Price item not found' } });
    }

    const item = result.rows[0];
    res.json({
      item: {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        basePrice: parseFloat(item.base_price),
        active: item.active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete price list item (soft delete)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    await db.query(
      'UPDATE price_list_items SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.params.id]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
