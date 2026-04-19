const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { schemas, validators } = require('../validators');

// Get user notifications
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { limit = 50, unreadOnly = false } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;

    const params = [userId];

    if (unreadOnly === 'true') {
      query += ` AND read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $2`;
    params.push(limit);

    const result = await db.query(query, params);

    res.json({
      notifications: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        message: row.body,
        type: row.type,
        category: row.category,
        entityType: row.entity_type,
        entityId: row.entity_id,
        isRead: row.read,
        readAt: row.read_at,
        actionUrl: row.action_url,
        createdAt: row.created_at,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await db.query(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND read = false
    `, [userId]);

    res.json({
      count: parseInt(result.rows[0].count)
    });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, validateRequest([validators.uuid('id')]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(`
      UPDATE notifications
      SET read = true, read_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Notification not found' } });
    }

    res.json({
      message: 'Notification marked as read',
      notification: {
        id: result.rows[0].id,
        isRead: result.rows[0].read,
        readAt: result.rows[0].read_at,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await db.query(`
      UPDATE notifications
      SET read = true, read_at = NOW()
      WHERE user_id = $1 AND read = false
      RETURNING id
    `, [userId]);

    res.json({
      message: 'All notifications marked as read',
      count: result.rows.length
    });
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(`
      DELETE FROM notifications
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Notification not found' } });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

// Delete all read notifications
router.delete('/clear-read', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await db.query(`
      DELETE FROM notifications
      WHERE user_id = $1 AND read = true
      RETURNING id
    `, [userId]);

    res.json({
      message: 'Read notifications cleared',
      count: result.rows.length
    });
  } catch (error) {
    next(error);
  }
});

// Get notification preferences
router.get('/preferences', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    let result = await db.query(`
      SELECT * FROM notification_preferences WHERE user_id = $1
    `, [userId]);

    // Create default preferences if they don't exist
    if (result.rows.length === 0) {
      result = await db.query(`
        INSERT INTO notification_preferences (user_id)
        VALUES ($1)
        RETURNING *
      `, [userId]);
    }

    const prefs = result.rows[0];

    res.json({
      preferences: {
        emailEnabled: prefs.email_enabled,
        smsEnabled: prefs.sms_enabled,
        pushEnabled: prefs.push_enabled,
        arrangementNotifications: prefs.arrangement_notifications,
        invoiceNotifications: prefs.invoice_notifications,
        messageNotifications: prefs.message_notifications,
        systemNotifications: prefs.system_notifications,
        digestEnabled: prefs.digest_enabled,
        digestFrequency: prefs.digest_frequency,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update notification preferences
router.put('/preferences', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      emailEnabled,
      smsEnabled,
      pushEnabled,
      arrangementNotifications,
      invoiceNotifications,
      messageNotifications,
      systemNotifications,
      digestEnabled,
      digestFrequency,
    } = req.body;

    const result = await db.query(`
      INSERT INTO notification_preferences (
        user_id,
        email_enabled,
        sms_enabled,
        push_enabled,
        arrangement_notifications,
        invoice_notifications,
        message_notifications,
        system_notifications,
        digest_enabled,
        digest_frequency,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        email_enabled = EXCLUDED.email_enabled,
        sms_enabled = EXCLUDED.sms_enabled,
        push_enabled = EXCLUDED.push_enabled,
        arrangement_notifications = EXCLUDED.arrangement_notifications,
        invoice_notifications = EXCLUDED.invoice_notifications,
        message_notifications = EXCLUDED.message_notifications,
        system_notifications = EXCLUDED.system_notifications,
        digest_enabled = EXCLUDED.digest_enabled,
        digest_frequency = EXCLUDED.digest_frequency,
        updated_at = NOW()
      RETURNING *
    `, [
      userId,
      emailEnabled,
      smsEnabled,
      pushEnabled,
      arrangementNotifications,
      invoiceNotifications,
      messageNotifications,
      systemNotifications,
      digestEnabled,
      digestFrequency,
    ]);

    res.json({
      message: 'Notification preferences updated',
      preferences: {
        emailEnabled: result.rows[0].email_enabled,
        smsEnabled: result.rows[0].sms_enabled,
        pushEnabled: result.rows[0].push_enabled,
        arrangementNotifications: result.rows[0].arrangement_notifications,
        invoiceNotifications: result.rows[0].invoice_notifications,
        messageNotifications: result.rows[0].message_notifications,
        systemNotifications: result.rows[0].system_notifications,
        digestEnabled: result.rows[0].digest_enabled,
        digestFrequency: result.rows[0].digest_frequency,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get active system alerts
router.get('/alerts', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await db.query(`
      SELECT sa.*
      FROM system_alerts sa
      WHERE sa.is_active = true
        AND (sa.starts_at IS NULL OR sa.starts_at <= NOW())
        AND (sa.expires_at IS NULL OR sa.expires_at > NOW())
        AND (sa.target_roles IS NULL OR $1 = ANY(sa.target_roles))
        AND NOT EXISTS (
          SELECT 1 FROM system_alert_dismissals sad
          WHERE sad.alert_id = sa.id AND sad.user_id = $2
        )
      ORDER BY sa.created_at DESC
    `, [userRole, userId]);

    res.json({
      alerts: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        message: row.body,
        type: row.type,
        startsAt: row.starts_at,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Dismiss system alert
router.post('/alerts/:id/dismiss', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.query(`
      INSERT INTO system_alert_dismissals (alert_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (alert_id, user_id) DO NOTHING
    `, [id, userId]);

    res.json({ message: 'Alert dismissed' });
  } catch (error) {
    next(error);
  }
});

// Admin: Create system alert
router.post('/alerts',
  authenticateToken,
  requireAdmin,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('type').isIn(['info', 'success', 'warning', 'error']).withMessage('Invalid type'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const { title, message, type, targetRoles, startsAt, expiresAt } = req.body;
    const userId = req.user.id;

    try {
      const result = await db.query(`
        INSERT INTO system_alerts (
          title,
          body,
          type,
          target_roles,
          starts_at,
          expires_at,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        title,
        message,
        type,
        targetRoles || null,
        startsAt || null,
        expiresAt || null,
        userId,
      ]);

      res.status(201).json({
        message: 'System alert created',
        alert: {
          id: result.rows[0].id,
          title: result.rows[0].title,
          message: result.rows[0].body,
          type: result.rows[0].type,
          targetRoles: result.rows[0].target_roles,
          startsAt: result.rows[0].starts_at,
          expiresAt: result.rows[0].expires_at,
          createdAt: result.rows[0].created_at,
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Admin: Deactivate system alert
router.delete('/alerts/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      UPDATE system_alerts
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Alert not found' } });
    }

    res.json({ message: 'Alert deactivated' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
