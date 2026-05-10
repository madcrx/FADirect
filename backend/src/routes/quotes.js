const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get quotes for an arrangement
router.get('/arrangement/:arrangementId', authenticateToken, async (req, res, next) => {
  try {
    const { arrangementId } = req.params;

    const result = await db.query(`
      SELECT
        q.*,
        creator.name as created_by_name,
        acceptor.name as accepted_by_name,
        json_agg(
          json_build_object(
            'id', qli.id,
            'description', qli.description,
            'quantity', qli.quantity,
            'unitPrice', qli.unit_price,
            'totalPrice', qli.total_price
          ) ORDER BY qli.created_at
        ) FILTER (WHERE qli.id IS NOT NULL) as line_items
      FROM quotes q
      LEFT JOIN users creator ON q.created_by = creator.id
      LEFT JOIN users acceptor ON q.accepted_by = acceptor.id
      LEFT JOIN quote_line_items qli ON q.id = qli.quote_id
      WHERE q.arrangement_id = $1 AND q.deleted_at IS NULL
      GROUP BY q.id, creator.name, acceptor.name
      ORDER BY q.created_at DESC
    `, [arrangementId]);

    res.json({
      quotes: result.rows.map(row => ({
        id: row.id,
        quoteNumber: row.quote_number,
        arrangementId: row.arrangement_id,
        totalAmount: parseFloat(row.total_amount),
        status: row.status,
        validUntil: row.valid_until,
        notes: row.notes,
        termsConditions: row.terms_conditions,
        createdBy: row.created_by,
        createdByName: row.created_by_name,
        acceptedAt: row.accepted_at,
        acceptedBy: row.accepted_by,
        acceptedByName: row.accepted_by_name,
        lineItems: row.line_items || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Create quote
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      arrangementId,
      validUntil,
      notes,
      termsConditions,
      lineItems,
    } = req.body;

    // Start transaction
    await db.query('BEGIN');

    try {
      // Create quote
      const quoteResult = await db.query(`
        INSERT INTO quotes (
          arrangement_id,
          valid_until,
          notes,
          terms_conditions,
          created_by
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [arrangementId, validUntil, notes, termsConditions, req.user.id]);

      const quote = quoteResult.rows[0];

      // Add line items
      if (lineItems && lineItems.length > 0) {
        for (const item of lineItems) {
          await db.query(`
            INSERT INTO quote_line_items (
              quote_id,
              description,
              quantity,
              unit_price,
              total_price,
              price_list_item_id
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            quote.id,
            item.description,
            item.quantity,
            item.unitPrice,
            item.quantity * item.unitPrice,
            item.priceListItemId || null,
          ]);
        }
      }

      await db.query('COMMIT');

      res.status(201).json({
        message: 'Quote created successfully',
        quote: {
          id: quote.id,
          quoteNumber: quote.quote_number,
          arrangementId: quote.arrangement_id,
          totalAmount: parseFloat(quote.total_amount),
          status: quote.status,
        }
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

// Accept quote (triggers job creation)
router.post('/:id/accept', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      UPDATE quotes
      SET
        status = 'accepted',
        accepted_at = NOW(),
        accepted_by = $1,
        updated_at = NOW()
      WHERE id = $2 AND status IN ('draft', 'sent')
      RETURNING *
    `, [req.user.id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Quote not found or already processed' }
      });
    }

    res.json({
      message: 'Quote accepted. Job will be created automatically.',
      quote: {
        id: result.rows[0].id,
        quoteNumber: result.rows[0].quote_number,
        status: result.rows[0].status,
        acceptedAt: result.rows[0].accepted_at,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Reject quote
router.post('/:id/reject', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      UPDATE quotes
      SET status = 'rejected', updated_at = NOW()
      WHERE id = $1 AND status IN ('draft', 'sent')
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Quote not found or already processed' }
      });
    }

    res.json({
      message: 'Quote rejected',
      quote: {
        id: result.rows[0].id,
        quoteNumber: result.rows[0].quote_number,
        status: result.rows[0].status,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Send quote
router.post('/:id/send', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      UPDATE quotes
      SET status = 'sent', updated_at = NOW()
      WHERE id = $1 AND status = 'draft'
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Quote not found or not in draft status' }
      });
    }

    res.json({
      message: 'Quote sent',
      quote: {
        id: result.rows[0].id,
        quoteNumber: result.rows[0].quote_number,
        status: result.rows[0].status,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Finalize job resources (triggers invoice creation)
router.post('/jobs/:id/finalize', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      UPDATE jobs
      SET
        workflow_status = 'ready_to_invoice',
        resources_finalized_at = NOW(),
        resources_finalized_by = $1,
        updated_at = NOW()
      WHERE id = $2 AND workflow_status IN ('pending_resources', 'resources_assigned')
      RETURNING *
    `, [req.user.id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Job not found or already finalized' }
      });
    }

    res.json({
      message: 'Job finalized. Invoice will be created automatically.',
      job: {
        id: result.rows[0].id,
        workflowStatus: result.rows[0].workflow_status,
        resourcesFinalizedAt: result.rows[0].resources_finalized_at,
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
