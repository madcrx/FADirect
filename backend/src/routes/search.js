const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Global search across all entities
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { q, type, limit = 50 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        error: { message: 'Search query must be at least 2 characters' },
      });
    }

    const searchTerm = `%${q}%`;
    const results = {
      arrangements: [],
      invoices: [],
      users: [],
      governmentForms: [],
      calendar: [],
      priceLists: [],
    };

    // Search arrangements
    if (!type || type === 'arrangements') {
      const arrangementsResult = await db.query(
        `SELECT id, deceased_name, funeral_type, status, service_date, created_at
         FROM arrangements
         WHERE deleted_at IS NULL
           AND (deceased_name ILIKE $1 OR notes ILIKE $1 OR service_location ILIKE $1)
         ORDER BY created_at DESC
         LIMIT $2`,
        [searchTerm, parseInt(limit)]
      );

      results.arrangements = arrangementsResult.rows.map(row => ({
        id: row.id,
        type: 'arrangement',
        title: row.deceased_name,
        subtitle: `${row.funeral_type} - ${row.status}`,
        date: row.service_date || row.created_at,
      }));
    }

    // Search invoices
    if (!type || type === 'invoices') {
      const invoicesResult = await db.query(
        `SELECT i.id, i.invoice_number, i.total_amount, i.status, i.created_at, a.deceased_name
         FROM invoices i
         LEFT JOIN arrangements a ON i.arrangement_id = a.id
         WHERE i.deleted_at IS NULL
           AND (i.invoice_number ILIKE $1 OR i.notes ILIKE $1 OR a.deceased_name ILIKE $1)
         ORDER BY i.created_at DESC
         LIMIT $2`,
        [searchTerm, parseInt(limit)]
      );

      results.invoices = invoicesResult.rows.map(row => ({
        id: row.id,
        type: 'invoice',
        title: row.invoice_number,
        subtitle: `$${row.total_amount} - ${row.status}${row.deceased_name ? ` - ${row.deceased_name}` : ''}`,
        date: row.created_at,
      }));
    }

    // Search users
    if (!type || type === 'users') {
      const usersResult = await db.query(
        `SELECT id, name, phone_number, role, email, created_at
         FROM users
         WHERE name ILIKE $1 OR phone_number ILIKE $1 OR email ILIKE $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [searchTerm, parseInt(limit)]
      );

      results.users = usersResult.rows.map(row => ({
        id: row.id,
        type: 'user',
        title: row.name,
        subtitle: `${row.role} - ${row.phone_number}${row.email ? ` - ${row.email}` : ''}`,
        date: row.created_at,
      }));
    }

    // Search government forms
    if (!type || type === 'government') {
      const governmentResult = await db.query(
        `SELECT gs.id, gs.submission_type, gs.status, gs.reference_number, gs.created_at, a.deceased_name
         FROM government_submissions gs
         LEFT JOIN arrangements a ON gs.arrangement_id = a.id
         WHERE gs.deleted_at IS NULL
           AND (gs.reference_number ILIKE $1 OR gs.notes ILIKE $1 OR a.deceased_name ILIKE $1)
         ORDER BY gs.created_at DESC
         LIMIT $2`,
        [searchTerm, parseInt(limit)]
      );

      results.governmentForms = governmentResult.rows.map(row => ({
        id: row.id,
        type: 'government',
        title: row.submission_type.replace(/_/g, ' ').toUpperCase(),
        subtitle: `${row.status}${row.reference_number ? ` - ${row.reference_number}` : ''}${row.deceased_name ? ` - ${row.deceased_name}` : ''}`,
        date: row.created_at,
      }));
    }

    // Search calendar events
    if (!type || type === 'calendar') {
      const calendarResult = await db.query(
        `SELECT ce.id, ce.title, ce.event_type, ce.start_time, ce.location, a.deceased_name
         FROM calendar_events ce
         LEFT JOIN arrangements a ON ce.arrangement_id = a.id
         WHERE ce.deleted_at IS NULL
           AND (ce.title ILIKE $1 OR ce.description ILIKE $1 OR ce.location ILIKE $1 OR a.deceased_name ILIKE $1)
         ORDER BY ce.start_time DESC
         LIMIT $2`,
        [searchTerm, parseInt(limit)]
      );

      results.calendar = calendarResult.rows.map(row => ({
        id: row.id,
        type: 'calendar',
        title: row.title,
        subtitle: `${row.event_type}${row.location ? ` - ${row.location}` : ''}${row.deceased_name ? ` - ${row.deceased_name}` : ''}`,
        date: row.start_time,
      }));
    }

    // Search price lists
    if (!type || type === 'prices') {
      const pricesResult = await db.query(
        `SELECT id, name, category, base_price, active, created_at
         FROM price_list_items
         WHERE deleted_at IS NULL
           AND (name ILIKE $1 OR description ILIKE $1 OR category ILIKE $1)
         ORDER BY name ASC
         LIMIT $2`,
        [searchTerm, parseInt(limit)]
      );

      results.priceLists = pricesResult.rows.map(row => ({
        id: row.id,
        type: 'price',
        title: row.name,
        subtitle: `${row.category} - $${row.base_price}${row.active ? '' : ' (Inactive)'}`,
        date: row.created_at,
      }));
    }

    // Calculate total results
    const totalResults =
      results.arrangements.length +
      results.invoices.length +
      results.users.length +
      results.governmentForms.length +
      results.calendar.length +
      results.priceLists.length;

    res.json({
      query: q,
      totalResults,
      results,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
