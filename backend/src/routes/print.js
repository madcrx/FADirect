const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Generate HTML for invoice (can be printed or converted to PDF)
router.get('/invoice/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get invoice with line items and company settings
    const invoiceResult = await db.query(
      `SELECT i.*, a.deceased_name, a.service_date, a.service_location
       FROM invoices i
       LEFT JOIN arrangements a ON i.arrangement_id = a.id
       WHERE i.id = $1`,
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Invoice not found' } });
    }

    const invoice = invoiceResult.rows[0];

    // Get line items
    const lineItemsResult = await db.query(
      'SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY created_at',
      [id]
    );

    // Get company settings
    const settingsResult = await db.query('SELECT * FROM company_settings LIMIT 1');
    const settings = settingsResult.rows[0] || {};

    // Generate HTML invoice
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      border-bottom: 2px solid #1A3A52;
      padding-bottom: 20px;
    }
    .company-info h1 {
      color: #1A3A52;
      margin: 0;
      font-size: 32px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-number {
      font-size: 24px;
      font-weight: bold;
      color: #1A3A52;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background-color: #1A3A52;
      color: white;
      padding: 12px;
      text-align: left;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-top: 20px;
      text-align: right;
    }
    .totals table {
      margin-left: auto;
      width: 300px;
    }
    .totals th, .totals td {
      background: none;
      color: #333;
    }
    .grand-total {
      font-size: 20px;
      font-weight: bold;
      background-color: #f5f5f5 !important;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: bold;
    }
    .status-paid { background: #4caf50; color: white; }
    .status-partial { background: #ff9800; color: white; }
    .status-overdue { background: #f44336; color: white; }
    .status-draft { background: #9e9e9e; color: white; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>${settings.company_name || 'FA Direct'}</h1>
      <p>${settings.address || ''}</p>
      <p>Phone: ${settings.phone || ''}</p>
      <p>Email: ${settings.email || ''}</p>
      ${settings.abn ? `<p>ABN: ${settings.abn}</p>` : ''}
    </div>
    <div class="invoice-info">
      <div class="invoice-number">${invoice.invoice_number}</div>
      <p><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleDateString()}</p>
      ${invoice.due_date ? `<p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>` : ''}
      <p><span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span></p>
    </div>
  </div>

  <div class="billing-info">
    <h3>Service For:</h3>
    <p><strong>${invoice.deceased_name || 'N/A'}</strong></p>
    ${invoice.service_date ? `<p>Service Date: ${new Date(invoice.service_date).toLocaleDateString()}</p>` : ''}
    ${invoice.service_location ? `<p>Location: ${invoice.service_location}</p>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Quantity</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsResult.rows.map(item => `
      <tr>
        <td>${item.description}</td>
        <td class="text-right">${item.quantity}</td>
        <td class="text-right">$${parseFloat(item.unit_price).toFixed(2)}</td>
        <td class="text-right">$${parseFloat(item.total_price).toFixed(2)}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr>
        <td><strong>Subtotal:</strong></td>
        <td class="text-right">$${parseFloat(invoice.total_amount).toFixed(2)}</td>
      </tr>
      <tr>
        <td><strong>Paid:</strong></td>
        <td class="text-right">-$${parseFloat(invoice.paid_amount).toFixed(2)}</td>
      </tr>
      <tr class="grand-total">
        <td><strong>Balance Due:</strong></td>
        <td class="text-right"><strong>$${(parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount)).toFixed(2)}</strong></td>
      </tr>
    </table>
  </div>

  ${invoice.notes ? `
  <div style="margin-top: 40px;">
    <h3>Notes:</h3>
    <p>${invoice.notes}</p>
  </div>
  ` : ''}

  ${settings.invoice_terms ? `
  <div class="footer">
    <h4>Terms & Conditions:</h4>
    <p>${settings.invoice_terms}</p>
  </div>
  ` : ''}

  <div class="no-print" style="margin-top: 40px; text-align: center;">
    <button onclick="window.print()" style="padding: 12px 24px; font-size: 16px; cursor: pointer; background: #1A3A52; color: white; border: none; border-radius: 4px;">
      Print Invoice
    </button>
  </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    next(error);
  }
});

// Generate printable arrangement details
router.get('/arrangement/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT a.*, u.name as arranger_name
       FROM arrangements a
       LEFT JOIN users u ON a.arranger_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Arrangement not found' } });
    }

    const arrangement = result.rows[0];

    const settingsResult = await db.query('SELECT * FROM company_settings LIMIT 1');
    const settings = settingsResult.rows[0] || {};

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Arrangement - ${arrangement.deceased_name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      color: #333;
    }
    h1 { color: #1A3A52; }
    .section {
      margin: 30px 0;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .section h2 {
      color: #1A3A52;
      margin-top: 0;
      border-bottom: 2px solid #1A3A52;
      padding-bottom: 10px;
    }
    .field {
      margin: 10px 0;
      display: flex;
    }
    .field-label {
      font-weight: bold;
      width: 200px;
    }
    .field-value {
      flex: 1;
    }
    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${settings.company_name || 'FA Direct'} - Funeral Arrangement</h1>

  <div class="section">
    <h2>Deceased Information</h2>
    <div class="field">
      <div class="field-label">Name:</div>
      <div class="field-value">${arrangement.deceased_name}</div>
    </div>
    ${arrangement.deceased_date_of_birth ? `
    <div class="field">
      <div class="field-label">Date of Birth:</div>
      <div class="field-value">${new Date(arrangement.deceased_date_of_birth).toLocaleDateString()}</div>
    </div>
    ` : ''}
    ${arrangement.deceased_date_of_death ? `
    <div class="field">
      <div class="field-label">Date of Death:</div>
      <div class="field-value">${new Date(arrangement.deceased_date_of_death).toLocaleDateString()}</div>
    </div>
    ` : ''}
  </div>

  <div class="section">
    <h2>Service Details</h2>
    <div class="field">
      <div class="field-label">Funeral Type:</div>
      <div class="field-value">${arrangement.funeral_type?.replace('_', ' ') || 'N/A'}</div>
    </div>
    <div class="field">
      <div class="field-label">Status:</div>
      <div class="field-value">${arrangement.status}</div>
    </div>
    ${arrangement.service_date ? `
    <div class="field">
      <div class="field-label">Service Date:</div>
      <div class="field-value">${new Date(arrangement.service_date).toLocaleDateString()}</div>
    </div>
    ` : ''}
    ${arrangement.service_location ? `
    <div class="field">
      <div class="field-label">Service Location:</div>
      <div class="field-value">${arrangement.service_location}</div>
    </div>
    ` : ''}
    <div class="field">
      <div class="field-label">Arranger:</div>
      <div class="field-value">${arrangement.arranger_name || 'N/A'}</div>
    </div>
  </div>

  ${arrangement.notes ? `
  <div class="section">
    <h2>Notes</h2>
    <p>${arrangement.notes}</p>
  </div>
  ` : ''}

  <div class="no-print" style="margin-top: 40px; text-align: center;">
    <button onclick="window.print()" style="padding: 12px 24px; font-size: 16px; cursor: pointer; background: #1A3A52; color: white; border: none; border-radius: 4px;">
      Print Arrangement
    </button>
  </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
