const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all config values by category
router.get('/values/:category', authenticateToken, async (req, res, next) => {
  try {
    const { category } = req.params;
    const { includeInactive } = req.query;

    let query = `
      SELECT id, category, value, label, is_active, sort_order
      FROM config_values
      WHERE category = $1 AND deleted_at IS NULL
    `;

    if (!includeInactive) {
      query += ` AND is_active = true`;
    }

    query += ` ORDER BY sort_order ASC, label ASC`;

    const result = await db.query(query, [category]);

    res.json({
      category,
      values: result.rows.map(row => ({
        id: row.id,
        value: row.value,
        label: row.label,
        isActive: row.is_active,
        sortOrder: row.sort_order,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get all categories
router.get('/categories', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT category
      FROM config_values
      WHERE deleted_at IS NULL
      ORDER BY category ASC
    `);

    const categories = [
      { value: 'vehicle_type', label: 'Vehicle Types', description: 'Types of vehicles used in operations' },
      { value: 'equipment_type', label: 'Equipment Types', description: 'Types of equipment and assets' },
      { value: 'staff_role', label: 'Staff Roles', description: 'Staff member role classifications' },
      { value: 'price_category', label: 'Price List Categories', description: 'Categories for price list items' },
      { value: 'arrangement_status', label: 'Arrangement Status', description: 'Status values for arrangements' },
      { value: 'funeral_type', label: 'Funeral Types', description: 'Types of funeral services offered' },
      { value: 'job_status', label: 'Job Status', description: 'Status values for jobs and events' },
      { value: 'job_priority', label: 'Job Priority', description: 'Priority levels for jobs' },
    ];

    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

// Create new config value
router.post('/values/:category', authenticateToken, async (req, res, next) => {
  try {
    const { category } = req.params;
    const { value, label, sortOrder } = req.body;

    if (!value || !label) {
      return res.status(400).json({
        error: { message: 'Value and label are required' }
      });
    }

    // Check if value already exists
    const existing = await db.query(
      'SELECT id FROM config_values WHERE category = $1 AND value = $2 AND deleted_at IS NULL',
      [category, value]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: { message: 'This value already exists in this category' }
      });
    }

    const result = await db.query(`
      INSERT INTO config_values (category, value, label, sort_order)
      VALUES ($1, $2, $3, $4)
      RETURNING id, category, value, label, is_active, sort_order
    `, [category, value, label, sortOrder || 0]);

    const row = result.rows[0];
    res.status(201).json({
      message: 'Config value created successfully',
      configValue: {
        id: row.id,
        value: row.value,
        label: row.label,
        isActive: row.is_active,
        sortOrder: row.sort_order,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update config value
router.put('/values/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, isActive, sortOrder } = req.body;

    const result = await db.query(`
      UPDATE config_values
      SET label = COALESCE($1, label),
          is_active = COALESCE($2, is_active),
          sort_order = COALESCE($3, sort_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND deleted_at IS NULL
      RETURNING id, category, value, label, is_active, sort_order
    `, [label, isActive, sortOrder, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Config value not found' }
      });
    }

    const row = result.rows[0];
    res.json({
      message: 'Config value updated successfully',
      configValue: {
        id: row.id,
        value: row.value,
        label: row.label,
        isActive: row.is_active,
        sortOrder: row.sort_order,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete config value (soft delete)
router.delete('/values/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE config_values SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({ message: 'Config value deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
