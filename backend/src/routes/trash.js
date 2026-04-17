const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all deleted items (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { type } = req.query;

    const deletedItems = {
      arrangements: [],
      invoices: [],
      priceListItems: [],
      governmentForms: [],
      calendarEvents: [],
      documents: [],
      photos: [],
      users: [],
    };

    // Get deleted arrangements
    if (!type || type === 'arrangements') {
      const result = await db.query(
        `SELECT id, deceased_name, funeral_type, status, deleted_at
         FROM arrangements
         WHERE deleted_at IS NOT NULL
         ORDER BY deleted_at DESC
         LIMIT 100`
      );
      deletedItems.arrangements = result.rows.map(row => ({
        id: row.id,
        type: 'arrangement',
        name: row.deceased_name,
        details: `${row.funeral_type} - ${row.status}`,
        deletedAt: row.deleted_at,
      }));
    }

    // Get deleted invoices
    if (!type || type === 'invoices') {
      const result = await db.query(
        `SELECT i.id, i.invoice_number, i.total_amount, i.deleted_at, a.deceased_name
         FROM invoices i
         LEFT JOIN arrangements a ON i.arrangement_id = a.id
         WHERE i.deleted_at IS NOT NULL
         ORDER BY i.deleted_at DESC
         LIMIT 100`
      );
      deletedItems.invoices = result.rows.map(row => ({
        id: row.id,
        type: 'invoice',
        name: row.invoice_number,
        details: `$${row.total_amount}${row.deceased_name ? ` - ${row.deceased_name}` : ''}`,
        deletedAt: row.deleted_at,
      }));
    }

    // Get deleted price list items
    if (!type || type === 'price-lists') {
      const result = await db.query(
        `SELECT id, name, category, base_price, deleted_at
         FROM price_list_items
         WHERE deleted_at IS NOT NULL
         ORDER BY deleted_at DESC
         LIMIT 100`
      );
      deletedItems.priceListItems = result.rows.map(row => ({
        id: row.id,
        type: 'price-list',
        name: row.name,
        details: `${row.category} - $${row.base_price}`,
        deletedAt: row.deleted_at,
      }));
    }

    // Get deleted government forms
    if (!type || type === 'government-forms') {
      const result = await db.query(
        `SELECT gs.id, gs.submission_type, gs.reference_number, gs.deleted_at, a.deceased_name
         FROM government_submissions gs
         LEFT JOIN arrangements a ON gs.arrangement_id = a.id
         WHERE gs.deleted_at IS NOT NULL
         ORDER BY gs.deleted_at DESC
         LIMIT 100`
      );
      deletedItems.governmentForms = result.rows.map(row => ({
        id: row.id,
        type: 'government-form',
        name: row.submission_type.replace(/_/g, ' ').toUpperCase(),
        details: `${row.reference_number || 'No ref'}${row.deceased_name ? ` - ${row.deceased_name}` : ''}`,
        deletedAt: row.deleted_at,
      }));
    }

    // Get deleted calendar events
    if (!type || type === 'calendar') {
      const result = await db.query(
        `SELECT id, title, event_type, start_time, deleted_at
         FROM calendar_events
         WHERE deleted_at IS NOT NULL
         ORDER BY deleted_at DESC
         LIMIT 100`
      );
      deletedItems.calendarEvents = result.rows.map(row => ({
        id: row.id,
        type: 'calendar-event',
        name: row.title,
        details: `${row.event_type} - ${new Date(row.start_time).toLocaleDateString()}`,
        deletedAt: row.deleted_at,
      }));
    }

    // Get deleted documents
    if (!type || type === 'documents') {
      const result = await db.query(
        `SELECT d.id, d.file_name, d.document_type, d.deleted_at, a.deceased_name
         FROM documents d
         LEFT JOIN arrangements a ON d.arrangement_id = a.id
         WHERE d.deleted_at IS NOT NULL
         ORDER BY d.deleted_at DESC
         LIMIT 100`
      );
      deletedItems.documents = result.rows.map(row => ({
        id: row.id,
        type: 'document',
        name: row.file_name,
        details: `${row.document_type || 'Document'}${row.deceased_name ? ` - ${row.deceased_name}` : ''}`,
        deletedAt: row.deleted_at,
      }));
    }

    // Get deleted photos
    if (!type || type === 'photos') {
      const result = await db.query(
        `SELECT p.id, p.file_name, p.deleted_at, a.deceased_name
         FROM photos p
         LEFT JOIN arrangements a ON p.arrangement_id = a.id
         WHERE p.deleted_at IS NOT NULL
         ORDER BY p.deleted_at DESC
         LIMIT 100`
      );
      deletedItems.photos = result.rows.map(row => ({
        id: row.id,
        type: 'photo',
        name: row.file_name,
        details: row.deceased_name ? `Photo - ${row.deceased_name}` : 'Photo',
        deletedAt: row.deleted_at,
      }));
    }

    // Count total
    const totalCount =
      deletedItems.arrangements.length +
      deletedItems.invoices.length +
      deletedItems.priceListItems.length +
      deletedItems.governmentForms.length +
      deletedItems.calendarEvents.length +
      deletedItems.documents.length +
      deletedItems.photos.length;

    res.json({
      totalCount,
      items: deletedItems,
    });
  } catch (error) {
    next(error);
  }
});

// Restore a deleted item (admin only)
router.post('/restore/:type/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { type, id } = req.params;

    const tableMap = {
      'arrangement': 'arrangements',
      'invoice': 'invoices',
      'price-list': 'price_list_items',
      'government-form': 'government_submissions',
      'calendar-event': 'calendar_events',
      'document': 'documents',
      'photo': 'photos',
    };

    const tableName = tableMap[type];
    if (!tableName) {
      return res.status(400).json({ error: { message: 'Invalid type' } });
    }

    // Restore the record
    const result = await db.query(
      `UPDATE ${tableName} SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Item not found or already restored' } });
    }

    res.json({ success: true, message: 'Item restored successfully' });
  } catch (error) {
    next(error);
  }
});

// Permanently delete an item (admin only)
router.delete('/permanent/:type/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { type, id } = req.params;

    const tableMap = {
      'arrangement': 'arrangements',
      'invoice': 'invoices',
      'price-list': 'price_list_items',
      'government-form': 'government_submissions',
      'calendar-event': 'calendar_events',
      'document': 'documents',
      'photo': 'photos',
    };

    const tableName = tableMap[type];
    if (!tableName) {
      return res.status(400).json({ error: { message: 'Invalid type' } });
    }

    // Permanently delete the record
    const result = await db.query(
      `DELETE FROM ${tableName} WHERE id = $1 AND deleted_at IS NOT NULL RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Item not found or not in trash' } });
    }

    res.json({ success: true, message: 'Item permanently deleted' });
  } catch (error) {
    next(error);
  }
});

// Empty trash (permanently delete all deleted items) - admin only
router.delete('/empty', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const tables = [
      'arrangements',
      'invoices',
      'price_list_items',
      'government_submissions',
      'calendar_events',
    ];

    let totalDeleted = 0;

    for (const table of tables) {
      const result = await db.query(
        `DELETE FROM ${table} WHERE deleted_at IS NOT NULL`
      );
      totalDeleted += result.rowCount;
    }

    res.json({
      success: true,
      message: `Permanently deleted ${totalDeleted} items`,
      count: totalDeleted,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
