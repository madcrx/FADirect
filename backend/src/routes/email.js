const express = require('express');
const router = express.Router();
const db = require('../config/database');
const nodemailer = require('nodemailer');
const { authenticateToken } = require('../middleware/auth');

// Create email transporter from settings
async function createTransporter() {
  const settingsResult = await db.query('SELECT * FROM company_settings LIMIT 1');

  if (settingsResult.rows.length === 0) {
    throw new Error('Company settings not configured');
  }

  const settings = settingsResult.rows[0];

  if (!settings.smtp_host || !settings.smtp_port) {
    throw new Error('SMTP not configured. Please configure email settings first.');
  }

  return nodemailer.createTransporter({
    host: settings.smtp_host,
    port: settings.smtp_port,
    secure: settings.smtp_secure,
    auth: settings.smtp_user && settings.smtp_password ? {
      user: settings.smtp_user,
      pass: settings.smtp_password,
    } : undefined,
  });
}

// Send email
router.post('/send', authenticateToken, async (req, res, next) => {
  try {
    const { to, toName, subject, body, htmlBody, attachments } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        error: { message: 'To, subject, and body are required' },
      });
    }

    // Get settings for from address
    const settingsResult = await db.query('SELECT * FROM company_settings LIMIT 1');
    const settings = settingsResult.rows[0];

    const fromEmail = settings.email_from_address || settings.email;
    const fromName = settings.email_from_name || settings.company_name;

    // Queue email
    await db.query(
      `INSERT INTO email_queue (
        to_email, to_name, from_email, from_name,
        subject, body, html_body, attachments, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING id`,
      [
        to,
        toName || null,
        fromEmail,
        fromName,
        subject,
        body,
        htmlBody || null,
        attachments ? JSON.stringify(attachments) : null,
      ]
    );

    // Try to send immediately
    try {
      const transporter = await createTransporter();

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: toName ? `"${toName}" <${to}>` : to,
        subject,
        text: body,
        html: htmlBody || body,
      };

      await transporter.sendMail(mailOptions);

      // Mark as sent
      await db.query(
        'UPDATE email_queue SET status = $1, sent_at = CURRENT_TIMESTAMP WHERE to_email = $2 AND subject = $3',
        ['sent', to, subject]
      );

      res.json({
        success: true,
        message: 'Email sent successfully',
      });
    } catch (sendError) {
      // Failed to send, will retry later
      console.error('Failed to send email:', sendError);

      await db.query(
        'UPDATE email_queue SET status = $1, error_message = $2 WHERE to_email = $3 AND subject = $4',
        ['failed', sendError.message, to, subject]
      );

      res.status(500).json({
        error: { message: 'Email queued but failed to send. Will retry automatically.' },
      });
    }
  } catch (error) {
    next(error);
  }
});

// Send invoice email
router.post('/send-invoice', authenticateToken, async (req, res, next) => {
  try {
    const { invoiceId, email } = req.body;

    if (!invoiceId || !email) {
      return res.status(400).json({
        error: { message: 'Invoice ID and email are required' },
      });
    }

    // Get invoice details
    const invoiceResult = await db.query(
      `SELECT i.*, a.deceased_name, a.mourner_id
       FROM invoices i
       LEFT JOIN arrangements a ON i.arrangement_id = a.id
       WHERE i.id = $1`,
      [invoiceId]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Invoice not found' } });
    }

    const invoice = invoiceResult.rows[0];

    // Get email template
    const templateResult = await db.query(
      `SELECT * FROM notification_templates
       WHERE event_trigger = 'invoice_created' AND template_type = 'email' AND active = true
       LIMIT 1`
    );

    let subject, body;
    if (templateResult.rows.length > 0) {
      const template = templateResult.rows[0];
      subject = template.subject;
      body = template.body;

      // Replace variables
      subject = subject.replace('{{invoice_number}}', invoice.invoice_number);
      subject = subject.replace('{{company_name}}', 'FA Direct');

      body = body.replace('{{invoice_number}}', invoice.invoice_number);
      body = body.replace('{{deceased_name}}', invoice.deceased_name || 'N/A');
      body = body.replace('{{invoice_total}}', invoice.total_amount);
      body = body.replace('{{due_date}}', invoice.due_date || 'Upon receipt');
      body = body.replace('{{company_name}}', 'FA Direct');
      body = body.replace('{{company_phone}}', '+61 2 9999 9999');
    } else {
      subject = `Invoice ${invoice.invoice_number} from FA Direct`;
      body = `Please find invoice ${invoice.invoice_number} for $${invoice.total_amount}.`;
    }

    // Send email
    await db.query(
      `INSERT INTO email_queue (
        to_email, subject, body, status
      )
      VALUES ($1, $2, $3, 'pending')`,
      [email, subject, body]
    );

    res.json({
      success: true,
      message: 'Invoice email queued for sending',
    });
  } catch (error) {
    next(error);
  }
});

// Get email queue (admin only)
router.get('/queue', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Admin access required' } });
    }

    const result = await db.query(
      'SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 100'
    );

    res.json({
      queue: result.rows.map(row => ({
        id: row.id,
        to: row.to_email,
        toName: row.to_name,
        subject: row.subject,
        status: row.status,
        sentAt: row.sent_at,
        errorMessage: row.error_message,
        retryCount: row.retry_count,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Test email configuration
router.post('/test', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Admin access required' } });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: { message: 'Email address required' } });
    }

    const transporter = await createTransporter();

    await transporter.sendMail({
      from: '"FA Direct" <noreply@fadirect.com>',
      to: email,
      subject: 'FA Direct - Email Configuration Test',
      text: 'Your email configuration is working correctly!',
    });

    res.json({
      success: true,
      message: 'Test email sent successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: { message: error.message || 'Failed to send test email' },
    });
  }
});

module.exports = router;
