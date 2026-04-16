const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');

// Get all forms
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT * FROM digital_forms
      WHERE is_active = true
      ORDER BY name ASC
    `);

    res.json({ forms: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get form submissions (pending review)
router.get('/submissions', authenticateToken, async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;

    const result = await db.query(`
      SELECT
        fs.*,
        df.name as form_name,
        a.deceased_name
      FROM form_submissions fs
      JOIN digital_forms df ON fs.form_id = df.id
      LEFT JOIN arrangements a ON fs.arrangement_id = a.id
      WHERE fs.status = $1
      ORDER BY fs.created_at DESC
    `, [status]);

    res.json({
      submissions: result.rows.map(row => ({
        id: row.id,
        formId: row.form_id,
        formName: row.form_name,
        arrangementId: row.arrangement_id,
        deceasedName: row.deceased_name,
        submissionData: row.submission_data,
        submitterName: row.submitter_name,
        submitterEmail: row.submitter_email,
        status: row.status,
        createdAt: row.created_at,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Submit form (public endpoint)
router.post('/submit/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const { submissionData, submitterName, submitterEmail, submitterPhone } = req.body;

    // Find the form submission by token
    const formCheck = await db.query(`
      SELECT * FROM form_submissions
      WHERE access_token = $1
        AND expires_at > NOW()
        AND status = 'pending'
    `, [token]);

    if (formCheck.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Form not found or expired' } });
    }

    // Update the submission
    await db.query(`
      UPDATE form_submissions SET
        submission_data = $1,
        submitter_name = $2,
        submitter_email = $3,
        submitter_phone = $4,
        updated_at = NOW()
      WHERE access_token = $5
    `, [
      JSON.stringify(submissionData),
      submitterName,
      submitterEmail,
      submitterPhone,
      token,
    ]);

    res.json({ message: 'Form submitted successfully' });
  } catch (error) {
    next(error);
  }
});

// Approve and import form data to arrangement
router.post('/submissions/:id/import', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get submission
    const submission = await db.query(`
      SELECT * FROM form_submissions WHERE id = $1
    `, [id]);

    if (submission.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Submission not found' } });
    }

    const data = submission.rows[0].submission_data;
    const arrangementId = submission.rows[0].arrangement_id;

    if (!arrangementId) {
      return res.status(400).json({ error: { message: 'No arrangement linked to this submission' } });
    }

    // Update arrangement with form data
    await db.query(`
      UPDATE arrangements SET
        deceased_name = COALESCE($1, deceased_name),
        date_of_birth = COALESCE($2, date_of_birth),
        date_of_death = COALESCE($3, date_of_death),
        place_of_death = COALESCE($4, place_of_death),
        informant_name = COALESCE($5, informant_name),
        informant_phone = COALESCE($6, informant_phone),
        informant_email = COALESCE($7, informant_email),
        updated_at = NOW()
      WHERE id = $8
    `, [
      data.deceasedName,
      data.dateOfBirth,
      data.dateOfDeath,
      data.placeOfDeath,
      data.informantName,
      data.informantPhone,
      data.informantEmail,
      arrangementId,
    ]);

    // Mark submission as imported
    await db.query(`
      UPDATE form_submissions SET
        status = 'imported',
        reviewed_by = $1,
        reviewed_at = NOW(),
        imported_at = NOW()
      WHERE id = $2
    `, [req.user.id, id]);

    res.json({ message: 'Form data imported successfully' });
  } catch (error) {
    next(error);
  }
});

// Create form link for mourners
router.post('/create-link', authenticateToken, async (req, res, next) => {
  try {
    const { formId, arrangementId } = req.body;

    // Generate access token
    const accessToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    const result = await db.query(`
      INSERT INTO form_submissions (
        form_id,
        arrangement_id,
        submission_data,
        access_token,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [formId, arrangementId, '{}', accessToken, expiresAt]);

    const formUrl = `${process.env.WEB_URL || 'http://localhost:5173'}/forms/${accessToken}`;

    res.json({
      message: 'Form link created successfully',
      formUrl,
      expiresAt,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
