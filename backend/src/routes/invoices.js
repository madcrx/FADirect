const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get invoice statistics
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    // Get quotations (draft invoices)
    const quotationsResult = await db.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
       FROM invoices
       WHERE status = 'draft' AND deleted_at IS NULL`
    );

    // Get all invoices (sent or paid)
    const invoicesResult = await db.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
       FROM invoices
       WHERE status IN ('sent', 'paid') AND deleted_at IS NULL`
    );

    // Get outstanding invoices (sent or overdue, not fully paid)
    const outstandingResult = await db.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount - paid_amount), 0) as total
       FROM invoices
       WHERE status IN ('sent', 'overdue') AND deleted_at IS NULL AND total_amount > paid_amount`
    );

    res.json({
      quotations: {
        count: parseInt(quotationsResult.rows[0].count),
        total: parseFloat(quotationsResult.rows[0].total),
      },
      invoices: {
        count: parseInt(invoicesResult.rows[0].count),
        total: parseFloat(invoicesResult.rows[0].total),
      },
      outstanding: {
        count: parseInt(outstandingResult.rows[0].count),
        total: parseFloat(outstandingResult.rows[0].total),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get all invoices (with optional arrangement filter)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { arrangementId } = req.query;

    let query = `
      SELECT i.*, a.deceased_name, a.status as arrangement_status
      FROM invoices i
      LEFT JOIN arrangements a ON i.arrangement_id = a.id
      WHERE i.deleted_at IS NULL
    `;
    const params = [];

    if (arrangementId) {
      query += ' AND i.arrangement_id = $1';
      params.push(arrangementId);
    }

    query += ' ORDER BY i.created_at DESC';

    const result = await db.query(query, params);

    res.json({
      invoices: result.rows.map(row => ({
        id: row.id,
        arrangementId: row.arrangement_id,
        invoiceNumber: row.invoice_number,
        totalAmount: parseFloat(row.total_amount),
        paidAmount: parseFloat(row.paid_amount),
        status: row.status,
        dueDate: row.due_date,
        notes: row.notes,
        deceasedName: row.deceased_name,
        arrangementStatus: row.arrangement_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get single invoice with line items and payments
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get invoice
    const invoiceResult = await db.query(
      `SELECT i.*, a.deceased_name
       FROM invoices i
       LEFT JOIN arrangements a ON i.arrangement_id = a.id
       WHERE i.id = $1 AND i.deleted_at IS NULL`,
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Invoice not found' } });
    }

    const invoice = invoiceResult.rows[0];

    // Get line items
    const lineItemsResult = await db.query(
      `SELECT * FROM invoice_line_items
       WHERE invoice_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    // Get payments
    const paymentsResult = await db.query(
      `SELECT * FROM payments
       WHERE invoice_id = $1
       ORDER BY payment_date DESC`,
      [id]
    );

    res.json({
      invoice: {
        id: invoice.id,
        arrangementId: invoice.arrangement_id,
        invoiceNumber: invoice.invoice_number,
        totalAmount: parseFloat(invoice.total_amount),
        paidAmount: parseFloat(invoice.paid_amount),
        status: invoice.status,
        dueDate: invoice.due_date,
        notes: invoice.notes,
        deceasedName: invoice.deceased_name,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
        lineItems: lineItemsResult.rows.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          totalPrice: parseFloat(item.total_price),
          priceListItemId: item.price_list_item_id,
          createdAt: item.created_at,
        })),
        payments: paymentsResult.rows.map(payment => ({
          id: payment.id,
          amount: parseFloat(payment.amount),
          paymentMethod: payment.payment_method,
          paymentDate: payment.payment_date,
          referenceNumber: payment.reference_number,
          notes: payment.notes,
          createdAt: payment.created_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create new invoice
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { arrangementId, dueDate, notes, lineItems } = req.body;

    if (!arrangementId) {
      return res.status(400).json({
        error: { message: 'Arrangement ID is required' },
      });
    }

    // Generate invoice number
    const countResult = await db.query('SELECT COUNT(*) FROM invoices');
    const count = parseInt(countResult.rows[0].count) + 1;
    const invoiceNumber = `INV-${String(count).padStart(6, '0')}`;

    // Create invoice
    const invoiceResult = await db.query(
      `INSERT INTO invoices (arrangement_id, invoice_number, due_date, notes, status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING *`,
      [arrangementId, invoiceNumber, dueDate || null, notes || null]
    );

    const invoice = invoiceResult.rows[0];

    // Add line items if provided
    if (lineItems && lineItems.length > 0) {
      for (const item of lineItems) {
        await db.query(
          `INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, total_price, price_list_item_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            invoice.id,
            item.description,
            item.quantity || 1,
            item.unitPrice,
            item.totalPrice,
            item.priceListItemId || null,
          ]
        );
      }
    }

    // Fetch complete invoice with line items
    const completeInvoice = await db.query(
      `SELECT i.*, a.deceased_name
       FROM invoices i
       LEFT JOIN arrangements a ON i.arrangement_id = a.id
       WHERE i.id = $1`,
      [invoice.id]
    );

    const lineItemsResult = await db.query(
      `SELECT * FROM invoice_line_items WHERE invoice_id = $1`,
      [invoice.id]
    );

    res.status(201).json({
      invoice: {
        id: completeInvoice.rows[0].id,
        arrangementId: completeInvoice.rows[0].arrangement_id,
        invoiceNumber: completeInvoice.rows[0].invoice_number,
        totalAmount: parseFloat(completeInvoice.rows[0].total_amount),
        paidAmount: parseFloat(completeInvoice.rows[0].paid_amount),
        status: completeInvoice.rows[0].status,
        dueDate: completeInvoice.rows[0].due_date,
        notes: completeInvoice.rows[0].notes,
        deceasedName: completeInvoice.rows[0].deceased_name,
        createdAt: completeInvoice.rows[0].created_at,
        updatedAt: completeInvoice.rows[0].updated_at,
        lineItems: lineItemsResult.rows.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          totalPrice: parseFloat(item.total_price),
          priceListItemId: item.price_list_item_id,
        })),
        payments: [],
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update invoice
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, dueDate, notes } = req.body;

    const result = await db.query(
      `UPDATE invoices
       SET status = COALESCE($1, status),
           due_date = COALESCE($2, due_date),
           notes = COALESCE($3, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND deleted_at IS NULL
       RETURNING *`,
      [status, dueDate, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Invoice not found' } });
    }

    const invoice = result.rows[0];
    res.json({
      invoice: {
        id: invoice.id,
        arrangementId: invoice.arrangement_id,
        invoiceNumber: invoice.invoice_number,
        totalAmount: parseFloat(invoice.total_amount),
        paidAmount: parseFloat(invoice.paid_amount),
        status: invoice.status,
        dueDate: invoice.due_date,
        notes: invoice.notes,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete invoice (soft delete)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE invoices SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Add line item to invoice
router.post('/:id/line-items', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, quantity, unitPrice, priceListItemId } = req.body;

    if (!description || !unitPrice) {
      return res.status(400).json({
        error: { message: 'Description and unit price are required' },
      });
    }

    const qty = quantity || 1;
    const totalPrice = qty * unitPrice;

    const result = await db.query(
      `INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, total_price, price_list_item_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, description, qty, unitPrice, totalPrice, priceListItemId || null]
    );

    const item = result.rows[0];
    res.status(201).json({
      lineItem: {
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price),
        totalPrice: parseFloat(item.total_price),
        priceListItemId: item.price_list_item_id,
        createdAt: item.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update line item
router.put('/:id/line-items/:lineItemId', authenticateToken, async (req, res, next) => {
  try {
    const { lineItemId } = req.params;
    const { description, quantity, unitPrice } = req.body;

    let totalPrice = null;
    if (quantity !== undefined && unitPrice !== undefined) {
      totalPrice = quantity * unitPrice;
    }

    const result = await db.query(
      `UPDATE invoice_line_items
       SET description = COALESCE($1, description),
           quantity = COALESCE($2, quantity),
           unit_price = COALESCE($3, unit_price),
           total_price = COALESCE($4, total_price)
       WHERE id = $5
       RETURNING *`,
      [description, quantity, unitPrice, totalPrice, lineItemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Line item not found' } });
    }

    const item = result.rows[0];
    res.json({
      lineItem: {
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price),
        totalPrice: parseFloat(item.total_price),
        priceListItemId: item.price_list_item_id,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete line item
router.delete('/:id/line-items/:lineItemId', authenticateToken, async (req, res, next) => {
  try {
    const { lineItemId } = req.params;

    await db.query('DELETE FROM invoice_line_items WHERE id = $1', [lineItemId]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Record payment
router.post('/:id/payments', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, referenceNumber, notes } = req.body;

    if (!amount || !paymentMethod) {
      return res.status(400).json({
        error: { message: 'Amount and payment method are required' },
      });
    }

    const result = await db.query(
      `INSERT INTO payments (invoice_id, amount, payment_method, reference_number, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, amount, paymentMethod, referenceNumber || null, notes || null]
    );

    const payment = result.rows[0];
    res.status(201).json({
      payment: {
        id: payment.id,
        invoiceId: payment.invoice_id,
        amount: parseFloat(payment.amount),
        paymentMethod: payment.payment_method,
        paymentDate: payment.payment_date,
        referenceNumber: payment.reference_number,
        notes: payment.notes,
        createdAt: payment.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get payments for invoice
router.get('/:id/payments', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC',
      [id]
    );

    res.json({
      payments: result.rows.map(payment => ({
        id: payment.id,
        amount: parseFloat(payment.amount),
        paymentMethod: payment.payment_method,
        paymentDate: payment.payment_date,
        referenceNumber: payment.reference_number,
        notes: payment.notes,
        createdAt: payment.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
