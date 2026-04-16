const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Middleware to check admin access
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: { message: 'Admin access required' } });
  }
  next();
};

// Get audit logs (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { entityType, entityId, action, userId, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT al.*, u.name as user_name, u.phone_number as user_phone
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (entityType) {
      query += ` AND al.entity_type = $${paramIndex}`;
      params.push(entityType);
      paramIndex++;
    }

    if (entityId) {
      query += ` AND al.entity_id = $${paramIndex}`;
      params.push(entityId);
      paramIndex++;
    }

    if (action) {
      query += ` AND al.action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    if (userId) {
      query += ` AND al.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    res.json({
      logs: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userPhone: row.user_phone,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        changes: row.changes,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Create audit log entry
const createAuditLog = async (userId, action, entityType, entityId, changes, req) => {
  try {
    const ipAddress = req?.ip || req?.connection?.remoteAddress;
    const userAgent = req?.get('user-agent');

    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, entityType, entityId, JSON.stringify(changes), ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

module.exports = router;
module.exports.createAuditLog = createAuditLog;
