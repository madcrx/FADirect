const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { createAuditLog } = require('./audit-logs');

// Middleware to check admin access
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: { message: 'Admin access required' } });
  }
  next();
};

// Get company settings
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM company_settings LIMIT 1');

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Settings not found' } });
    }

    const settings = result.rows[0];
    res.json({
      settings: {
        id: settings.id,
        companyName: settings.company_name,
        abn: settings.abn,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        logoUrl: settings.logo_url,
        primaryColor: settings.primary_color,
        secondaryColor: settings.secondary_color,
        emailFromName: settings.email_from_name,
        emailFromAddress: settings.email_from_address,
        smtpHost: settings.smtp_host,
        smtpPort: settings.smtp_port,
        smtpUser: settings.smtp_user,
        smtpSecure: settings.smtp_secure,
        invoicePrefix: settings.invoice_prefix,
        invoiceTerms: settings.invoice_terms,
        createdAt: settings.created_at,
        updatedAt: settings.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update company settings (admin only)
router.put('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const {
      companyName,
      abn,
      address,
      phone,
      email,
      website,
      logoUrl,
      primaryColor,
      secondaryColor,
      emailFromName,
      emailFromAddress,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpSecure,
      invoicePrefix,
      invoiceTerms,
    } = req.body;

    // Get current settings for audit log
    const currentResult = await db.query('SELECT * FROM company_settings LIMIT 1');
    const currentSettings = currentResult.rows[0];

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (companyName !== undefined) {
      updates.push(`company_name = $${paramIndex}`);
      values.push(companyName);
      paramIndex++;
    }
    if (abn !== undefined) {
      updates.push(`abn = $${paramIndex}`);
      values.push(abn);
      paramIndex++;
    }
    if (address !== undefined) {
      updates.push(`address = $${paramIndex}`);
      values.push(address);
      paramIndex++;
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      values.push(phone);
      paramIndex++;
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }
    if (website !== undefined) {
      updates.push(`website = $${paramIndex}`);
      values.push(website);
      paramIndex++;
    }
    if (logoUrl !== undefined) {
      updates.push(`logo_url = $${paramIndex}`);
      values.push(logoUrl);
      paramIndex++;
    }
    if (primaryColor !== undefined) {
      updates.push(`primary_color = $${paramIndex}`);
      values.push(primaryColor);
      paramIndex++;
    }
    if (secondaryColor !== undefined) {
      updates.push(`secondary_color = $${paramIndex}`);
      values.push(secondaryColor);
      paramIndex++;
    }
    if (emailFromName !== undefined) {
      updates.push(`email_from_name = $${paramIndex}`);
      values.push(emailFromName);
      paramIndex++;
    }
    if (emailFromAddress !== undefined) {
      updates.push(`email_from_address = $${paramIndex}`);
      values.push(emailFromAddress);
      paramIndex++;
    }
    if (smtpHost !== undefined) {
      updates.push(`smtp_host = $${paramIndex}`);
      values.push(smtpHost);
      paramIndex++;
    }
    if (smtpPort !== undefined) {
      updates.push(`smtp_port = $${paramIndex}`);
      values.push(smtpPort);
      paramIndex++;
    }
    if (smtpUser !== undefined) {
      updates.push(`smtp_user = $${paramIndex}`);
      values.push(smtpUser);
      paramIndex++;
    }
    if (smtpPassword !== undefined) {
      updates.push(`smtp_password = $${paramIndex}`);
      values.push(smtpPassword);
      paramIndex++;
    }
    if (smtpSecure !== undefined) {
      updates.push(`smtp_secure = $${paramIndex}`);
      values.push(smtpSecure);
      paramIndex++;
    }
    if (invoicePrefix !== undefined) {
      updates.push(`invoice_prefix = $${paramIndex}`);
      values.push(invoicePrefix);
      paramIndex++;
    }
    if (invoiceTerms !== undefined) {
      updates.push(`invoice_terms = $${paramIndex}`);
      values.push(invoiceTerms);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: { message: 'No fields to update' } });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const query = `UPDATE company_settings SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    values.push(currentSettings.id);

    const result = await db.query(query, values);
    const newSettings = result.rows[0];

    // Create audit log
    await createAuditLog(
      req.user.id,
      'update',
      'company_settings',
      newSettings.id,
      { old: currentSettings, new: newSettings },
      req
    );

    res.json({
      settings: {
        id: newSettings.id,
        companyName: newSettings.company_name,
        abn: newSettings.abn,
        address: newSettings.address,
        phone: newSettings.phone,
        email: newSettings.email,
        website: newSettings.website,
        logoUrl: newSettings.logo_url,
        primaryColor: newSettings.primary_color,
        secondaryColor: newSettings.secondary_color,
        emailFromName: newSettings.email_from_name,
        emailFromAddress: newSettings.email_from_address,
        smtpHost: newSettings.smtp_host,
        smtpPort: newSettings.smtp_port,
        smtpUser: newSettings.smtp_user,
        smtpSecure: newSettings.smtp_secure,
        invoicePrefix: newSettings.invoice_prefix,
        invoiceTerms: newSettings.invoice_terms,
        createdAt: newSettings.created_at,
        updatedAt: newSettings.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
