const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all form templates (including deleted if showDeleted=true)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { showDeleted, formType } = req.query;

    let query = `
      SELECT
        ft.*,
        u_created.name as created_by_name,
        u_updated.name as updated_by_name,
        u_deleted.name as deleted_by_name
      FROM form_templates ft
      LEFT JOIN users u_created ON ft.created_by = u_created.id
      LEFT JOIN users u_updated ON ft.updated_by = u_updated.id
      LEFT JOIN users u_deleted ON ft.deleted_by = u_deleted.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (showDeleted !== 'true') {
      query += ` AND ft.deleted_at IS NULL`;
    }

    if (formType) {
      query += ` AND ft.form_type = $${paramIndex++}`;
      params.push(formType);
    }

    query += ` ORDER BY ft.form_type, ft.version DESC, ft.created_at DESC`;

    const result = await db.query(query, params);

    const templates = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      formType: row.form_type,
      version: row.version,
      isActive: row.is_active,
      templateData: row.template_data,
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      updatedBy: row.updated_by,
      updatedByName: row.updated_by_name,
      deletedBy: row.deleted_by,
      deletedByName: row.deleted_by_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    }));

    res.json({ templates });
  } catch (error) {
    next(error);
  }
});

// Get a specific template by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
        ft.*,
        u_created.name as created_by_name,
        u_updated.name as updated_by_name,
        u_deleted.name as deleted_by_name
      FROM form_templates ft
      LEFT JOIN users u_created ON ft.created_by = u_created.id
      LEFT JOIN users u_updated ON ft.updated_by = u_updated.id
      LEFT JOIN users u_deleted ON ft.deleted_by = u_deleted.id
      WHERE ft.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Template not found' } });
    }

    const row = result.rows[0];
    const template = {
      id: row.id,
      name: row.name,
      description: row.description,
      formType: row.form_type,
      version: row.version,
      isActive: row.is_active,
      templateData: row.template_data,
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      updatedBy: row.updated_by,
      updatedByName: row.updated_by_name,
      deletedBy: row.deleted_by,
      deletedByName: row.deleted_by_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };

    res.json({ template });
  } catch (error) {
    next(error);
  }
});

// Get the latest active template for a form type
router.get('/active/:formType', authenticateToken, async (req, res, next) => {
  try {
    const { formType } = req.params;

    const result = await db.query(
      `SELECT
        ft.*,
        u_created.name as created_by_name,
        u_updated.name as updated_by_name
      FROM form_templates ft
      LEFT JOIN users u_created ON ft.created_by = u_created.id
      LEFT JOIN users u_updated ON ft.updated_by = u_updated.id
      WHERE ft.form_type = $1
        AND ft.is_active = TRUE
        AND ft.deleted_at IS NULL
      ORDER BY ft.version DESC, ft.created_at DESC
      LIMIT 1`,
      [formType]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'No active template found' } });
    }

    const row = result.rows[0];
    const template = {
      id: row.id,
      name: row.name,
      description: row.description,
      formType: row.form_type,
      version: row.version,
      isActive: row.is_active,
      templateData: row.template_data,
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      updatedBy: row.updated_by,
      updatedByName: row.updated_by_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json({ template });
  } catch (error) {
    next(error);
  }
});

// Create new template (creates new version, old ones are auto-deleted by trigger)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { name, description, formType, templateData } = req.body;
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const isAdminOrManager = userRoles.some(role => ['admin', 'management'].includes(role));

    if (!isAdminOrManager) {
      return res.status(403).json({ error: { message: 'Only admins and managers can create form templates' } });
    }

    if (!name || !formType || !templateData) {
      return res.status(400).json({ error: { message: 'Name, form type, and template data are required' } });
    }

    const result = await db.query(
      `INSERT INTO form_templates (name, description, form_type, template_data, created_by, updated_by, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING *`,
      [name, description, formType, JSON.stringify(templateData), req.user.id, req.user.id]
    );

    const template = result.rows[0];

    res.status(201).json({
      message: 'Form template created successfully',
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        formType: template.form_type,
        version: template.version,
        isActive: template.is_active,
        templateData: template.template_data,
        createdAt: template.created_at,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update template (creates new version, current active is soft-deleted by trigger)
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, templateData } = req.body;
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const isAdminOrManager = userRoles.some(role => ['admin', 'management'].includes(role));

    if (!isAdminOrManager) {
      return res.status(403).json({ error: { message: 'Only admins and managers can update form templates' } });
    }

    // Get the current template to copy form_type
    const current = await db.query('SELECT form_type FROM form_templates WHERE id = $1', [id]);

    if (current.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Template not found' } });
    }

    const formType = current.rows[0].form_type;

    // Create new version (trigger will handle deactivating old version)
    const result = await db.query(
      `INSERT INTO form_templates (name, description, form_type, template_data, created_by, updated_by, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING *`,
      [name, description, formType, JSON.stringify(templateData), req.user.id, req.user.id]
    );

    const template = result.rows[0];

    res.json({
      message: 'Form template updated successfully (new version created)',
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        formType: template.form_type,
        version: template.version,
        isActive: template.is_active,
        templateData: template.template_data,
        createdAt: template.created_at,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Soft delete a template
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const isAdminOrManager = userRoles.some(role => ['admin', 'management'].includes(role));

    if (!isAdminOrManager) {
      return res.status(403).json({ error: { message: 'Only admins and managers can delete form templates' } });
    }

    const result = await db.query(
      `UPDATE form_templates
       SET deleted_at = NOW(), deleted_by = $1, is_active = FALSE
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Template not found or already deleted' } });
    }

    res.json({ message: 'Form template deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Restore a deleted template
router.post('/:id/restore', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const isAdminOrManager = userRoles.some(role => ['admin', 'management'].includes(role));

    if (!isAdminOrManager) {
      return res.status(403).json({ error: { message: 'Only admins and managers can restore form templates' } });
    }

    const result = await db.query(
      `UPDATE form_templates
       SET deleted_at = NULL, deleted_by = NULL, is_active = TRUE, updated_by = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NOT NULL
       RETURNING id`,
      [req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Template not found or not deleted' } });
    }

    res.json({ message: 'Form template restored successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
