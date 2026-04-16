const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Bulk update arrangement status
router.post('/arrangements/update-status',
  authenticateToken,
  [
    body('arrangementIds').isArray().notEmpty().withMessage('Arrangement IDs are required'),
    body('status').isIn(['pending', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const { arrangementIds, status } = req.body;
    const userId = req.user.id;

    try {
      const result = await db.query(`
        UPDATE arrangements
        SET status = $1, updated_at = NOW()
        WHERE id = ANY($2::uuid[])
          AND deleted_at IS NULL
        RETURNING id
      `, [status, arrangementIds]);

      // Log audit trail
      for (const id of result.rows) {
        await db.query(`
          INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
          VALUES ($1, 'bulk_update', 'arrangement', $2, $3)
        `, [userId, id.id, JSON.stringify({ field: 'status', value: status })]);
      }

      res.json({
        message: `Updated ${result.rows.length} arrangement(s)`,
        count: result.rows.length
      });
    } catch (error) {
      next(error);
    }
  }
);

// Bulk assign arrangements
router.post('/arrangements/assign',
  authenticateToken,
  [
    body('arrangementIds').isArray().notEmpty().withMessage('Arrangement IDs are required'),
    body('assignedTo').isUUID().withMessage('Valid user ID is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const { arrangementIds, assignedTo } = req.body;
    const userId = req.user.id;

    try {
      // Verify assigned user exists
      const userCheck = await db.query(`
        SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL
      `, [assignedTo]);

      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: { message: 'Assigned user not found' } });
      }

      const result = await db.query(`
        UPDATE arrangements
        SET assigned_to = $1, updated_at = NOW()
        WHERE id = ANY($2::uuid[])
          AND deleted_at IS NULL
        RETURNING id
      `, [assignedTo, arrangementIds]);

      // Log audit trail
      for (const id of result.rows) {
        await db.query(`
          INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
          VALUES ($1, 'bulk_assign', 'arrangement', $2, $3)
        `, [userId, id.id, JSON.stringify({ assignedTo })]);
      }

      res.json({
        message: `Assigned ${result.rows.length} arrangement(s)`,
        count: result.rows.length
      });
    } catch (error) {
      next(error);
    }
  }
);

// Bulk delete arrangements (soft delete)
router.post('/arrangements/delete',
  authenticateToken,
  requireAdmin,
  [
    body('arrangementIds').isArray().notEmpty().withMessage('Arrangement IDs are required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const { arrangementIds } = req.body;
    const userId = req.user.id;

    try {
      const result = await db.query(`
        UPDATE arrangements
        SET deleted_at = NOW()
        WHERE id = ANY($1::uuid[])
          AND deleted_at IS NULL
        RETURNING id
      `, [arrangementIds]);

      // Log audit trail
      for (const id of result.rows) {
        await db.query(`
          INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
          VALUES ($1, 'bulk_delete', 'arrangement', $2, $3)
        `, [userId, id.id, JSON.stringify({ deleted: true })]);
      }

      res.json({
        message: `Deleted ${result.rows.length} arrangement(s)`,
        count: result.rows.length
      });
    } catch (error) {
      next(error);
    }
  }
);

// Bulk update invoice status
router.post('/invoices/update-status',
  authenticateToken,
  [
    body('invoiceIds').isArray().notEmpty().withMessage('Invoice IDs are required'),
    body('status').isIn(['draft', 'pending', 'paid', 'overdue', 'cancelled']).withMessage('Invalid status'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const { invoiceIds, status } = req.body;
    const userId = req.user.id;

    try {
      const result = await db.query(`
        UPDATE invoices
        SET status = $1, updated_at = NOW()
        WHERE id = ANY($2::uuid[])
          AND deleted_at IS NULL
        RETURNING id
      `, [status, invoiceIds]);

      // Log audit trail
      for (const id of result.rows) {
        await db.query(`
          INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
          VALUES ($1, 'bulk_update', 'invoice', $2, $3)
        `, [userId, id.id, JSON.stringify({ field: 'status', value: status })]);
      }

      res.json({
        message: `Updated ${result.rows.length} invoice(s)`,
        count: result.rows.length
      });
    } catch (error) {
      next(error);
    }
  }
);

// Bulk export arrangements
router.post('/arrangements/export',
  authenticateToken,
  [
    body('arrangementIds').isArray().notEmpty().withMessage('Arrangement IDs are required'),
    body('format').isIn(['csv', 'json', 'pdf']).withMessage('Invalid format'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const { arrangementIds, format } = req.body;

    try {
      const result = await db.query(`
        SELECT
          a.*,
          u.name as assigned_user_name,
          uc.full_name as created_by_name
        FROM arrangements a
        LEFT JOIN users u ON a.assigned_to = u.id
        LEFT JOIN users uc ON a.created_by = uc.id
        WHERE a.id = ANY($1::uuid[])
          AND a.deleted_at IS NULL
        ORDER BY a.created_at DESC
      `, [arrangementIds]);

      if (format === 'json') {
        res.json({
          arrangements: result.rows
        });
      } else if (format === 'csv') {
        // Convert to CSV
        const headers = [
          'ID', 'Deceased Name', 'Date of Death', 'Status',
          'Service Type', 'Service Date', 'Service Location',
          'Assigned To', 'Created By', 'Created At'
        ];

        const csvRows = [headers.join(',')];

        result.rows.forEach(row => {
          csvRows.push([
            row.id,
            row.deceased_name,
            row.date_of_death,
            row.status,
            row.service_type,
            row.service_date,
            row.service_location,
            row.assigned_user_name || '',
            row.created_by_name || '',
            row.created_at
          ].map(value => `"${value || ''}"`).join(','));
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=arrangements.csv');
        res.send(csvRows.join('\n'));
      } else {
        res.status(400).json({ error: { message: 'PDF format not yet implemented' } });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Bulk send invoice reminders
router.post('/invoices/send-reminders',
  authenticateToken,
  [
    body('invoiceIds').isArray().notEmpty().withMessage('Invoice IDs are required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const { invoiceIds } = req.body;

    try {
      // Get invoices with contact information
      const result = await db.query(`
        SELECT
          i.*,
          a.informant_email,
          a.informant_phone
        FROM invoices i
        JOIN arrangements a ON i.arrangement_id = a.id
        WHERE i.id = ANY($1::uuid[])
          AND i.status IN ('pending', 'overdue')
          AND i.deleted_at IS NULL
      `, [invoiceIds]);

      let sentCount = 0;
      const errors = [];

      for (const invoice of result.rows) {
        try {
          if (invoice.informant_email) {
            // Queue reminder email
            await db.query(`
              INSERT INTO email_queue (to_email, subject, body, related_entity_type, related_entity_id)
              VALUES ($1, $2, $3, 'invoice', $4)
            `, [
              invoice.informant_email,
              `Invoice Reminder - ${invoice.invoice_number}`,
              `This is a reminder that invoice ${invoice.invoice_number} for $${invoice.total_amount} is ${invoice.status}.`,
              invoice.id
            ]);
            sentCount++;
          } else {
            errors.push(`Invoice ${invoice.invoice_number}: No email address`);
          }
        } catch (err) {
          errors.push(`Invoice ${invoice.invoice_number}: ${err.message}`);
        }
      }

      res.json({
        message: `Sent ${sentCount} reminder(s)`,
        count: sentCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
