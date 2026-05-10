const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get audit history for a specific entity
router.get('/:entityType/:entityId', authenticateToken, async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const isManager = userRoles.includes('admin') || userRoles.includes('management');

    if (!isManager) {
      return res.status(403).json({
        error: { message: 'Only admins and managers can view audit history' }
      });
    }

    const result = await db.query(`
      SELECT
        al.*,
        u.name as performed_by_name,
        u.phone_number as performed_by_phone
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = $1 AND al.entity_id = $2
      ORDER BY al.created_at DESC
    `, [entityType, entityId]);

    res.json({
      history: result.rows.map(row => ({
        id: row.id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        action: row.action,
        fieldName: row.field_name,
        oldValue: row.old_value,
        newValue: row.new_value,
        userId: row.user_id,
        userName: row.user_name,
        performedByName: row.performed_by_name,
        performedByPhone: row.performed_by_phone,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        notes: row.notes,
        createdAt: row.created_at,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get audit history for related entities (e.g., all audit logs for a job and its arrangement)
router.get('/related/:entityType/:entityId', authenticateToken, async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const isManager = userRoles.includes('admin') || userRoles.includes('management');

    if (!isManager) {
      return res.status(403).json({
        error: { message: 'Only admins and managers can view audit history' }
      });
    }

    let query = '';
    let params = [];

    if (entityType === 'job') {
      // Get audit logs for job and its related arrangement, quote, invoice
      query = `
        SELECT DISTINCT
          al.*,
          u.name as performed_by_name,
          u.phone_number as performed_by_phone
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE
          (al.entity_type = 'job' AND al.entity_id = $1)
          OR (al.entity_type = 'arrangement' AND al.entity_id = (SELECT arrangement_id FROM jobs WHERE id = $1))
          OR (al.entity_type = 'quote' AND al.entity_id = (SELECT quote_id FROM jobs WHERE id = $1))
          OR (al.entity_type = 'invoice' AND al.entity_id IN (SELECT id FROM invoices WHERE job_id = $1))
        ORDER BY al.created_at DESC
      `;
      params = [entityId];
    } else if (entityType === 'arrangement') {
      // Get audit logs for arrangement and all related entities
      query = `
        SELECT DISTINCT
          al.*,
          u.name as performed_by_name,
          u.phone_number as performed_by_phone
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE
          (al.entity_type = 'arrangement' AND al.entity_id = $1)
          OR (al.entity_type = 'quote' AND al.entity_id IN (SELECT id FROM quotes WHERE arrangement_id = $1))
          OR (al.entity_type = 'job' AND al.entity_id IN (SELECT id FROM jobs WHERE arrangement_id = $1))
          OR (al.entity_type = 'invoice' AND al.entity_id IN (SELECT id FROM invoices WHERE arrangement_id = $1))
        ORDER BY al.created_at DESC
      `;
      params = [entityId];
    } else {
      // Default: just get audit logs for the specific entity
      query = `
        SELECT
          al.*,
          u.name as performed_by_name,
          u.phone_number as performed_by_phone
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.entity_type = $1 AND al.entity_id = $2
        ORDER BY al.created_at DESC
      `;
      params = [entityType, entityId];
    }

    const result = await db.query(query, params);

    res.json({
      history: result.rows.map(row => ({
        id: row.id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        action: row.action,
        fieldName: row.field_name,
        oldValue: row.old_value,
        newValue: row.new_value,
        userId: row.user_id,
        userName: row.user_name,
        performedByName: row.performed_by_name,
        performedByPhone: row.performed_by_phone,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        notes: row.notes,
        createdAt: row.created_at,
      }))
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
