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

// Convert array of objects to CSV
const arrayToCSV = (data, headers) => {
  if (data.length === 0) return '';

  const csvHeaders = headers.join(',');
  const csvRows = data.map(row =>
    headers.map(header => {
      let value = row[header];
      // Handle special characters and quotes
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else {
        value = String(value);
      }
      // Escape quotes and wrap in quotes if contains comma or quote
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
};

// Export arrangements
router.get('/arrangements', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
        id, deceased_name, deceased_date_of_birth, deceased_date_of_death,
        funeral_type, status, service_date, service_location, notes,
        created_at, updated_at
       FROM arrangements
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`
    );

    const headers = [
      'id', 'deceased_name', 'deceased_date_of_birth', 'deceased_date_of_death',
      'funeral_type', 'status', 'service_date', 'service_location', 'notes',
      'created_at', 'updated_at'
    ];

    const csv = arrayToCSV(result.rows, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="arrangements.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Export invoices
router.get('/invoices', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
        i.id, i.invoice_number, i.arrangement_id, a.deceased_name,
        i.total_amount, i.paid_amount, i.status, i.due_date,
        i.notes, i.created_at, i.updated_at
       FROM invoices i
       LEFT JOIN arrangements a ON i.arrangement_id = a.id
       WHERE i.deleted_at IS NULL
       ORDER BY i.created_at DESC`
    );

    const headers = [
      'id', 'invoice_number', 'arrangement_id', 'deceased_name',
      'total_amount', 'paid_amount', 'status', 'due_date',
      'notes', 'created_at', 'updated_at'
    ];

    const csv = arrayToCSV(result.rows, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Export price lists
router.get('/price-lists', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
        id, name, description, category, base_price, active,
        created_at, updated_at
       FROM price_list_items
       WHERE deleted_at IS NULL
       ORDER BY category, name`
    );

    const headers = [
      'id', 'name', 'description', 'category', 'base_price', 'active',
      'created_at', 'updated_at'
    ];

    const csv = arrayToCSV(result.rows, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="price_lists.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Export government forms
router.get('/government-forms', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
        gs.id, gs.arrangement_id, a.deceased_name,
        gs.submission_type, gs.status, gs.reference_number,
        gs.submission_date, gs.completion_date, gs.notes,
        gs.created_at, gs.updated_at
       FROM government_submissions gs
       LEFT JOIN arrangements a ON gs.arrangement_id = a.id
       WHERE gs.deleted_at IS NULL
       ORDER BY gs.created_at DESC`
    );

    const headers = [
      'id', 'arrangement_id', 'deceased_name',
      'submission_type', 'status', 'reference_number',
      'submission_date', 'completion_date', 'notes',
      'created_at', 'updated_at'
    ];

    const csv = arrayToCSV(result.rows, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="government_forms.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Export users
router.get('/users', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
        id, phone_number, name, email, role, phone_verified,
        created_at, updated_at, last_seen
       FROM users
       ORDER BY created_at DESC`
    );

    const headers = [
      'id', 'phone_number', 'name', 'email', 'role', 'phone_verified',
      'created_at', 'updated_at', 'last_seen'
    ];

    const csv = arrayToCSV(result.rows, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Export calendar events
router.get('/calendar', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
        ce.id, ce.title, ce.description, ce.event_type,
        ce.start_time, ce.end_time, ce.all_day, ce.location,
        ce.arrangement_id, a.deceased_name, ce.status,
        ce.created_at, ce.updated_at
       FROM calendar_events ce
       LEFT JOIN arrangements a ON ce.arrangement_id = a.id
       WHERE ce.deleted_at IS NULL
       ORDER BY ce.start_time DESC`
    );

    const headers = [
      'id', 'title', 'description', 'event_type',
      'start_time', 'end_time', 'all_day', 'location',
      'arrangement_id', 'deceased_name', 'status',
      'created_at', 'updated_at'
    ];

    const csv = arrayToCSV(result.rows, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="calendar_events.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Export all data (complete backup)
router.get('/all', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const backup = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {},
    };

    // Export all tables
    const tables = [
      'arrangements',
      'invoices',
      'invoice_line_items',
      'payments',
      'price_list_items',
      'government_submissions',
      'calendar_events',
      'users',
    ];

    for (const table of tables) {
      const result = await db.query(`SELECT * FROM ${table} WHERE deleted_at IS NULL OR deleted_at IS NOT NULL`);
      backup.data[table] = result.rows;
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="fadirect_backup_${Date.now()}.json"`);
    res.json(backup);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
