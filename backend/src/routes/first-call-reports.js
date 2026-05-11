const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Submit a new First Call Report
// This will automatically create an arrangement and removal job
router.post('/', authenticateToken, async (req, res) => {
  const client = await db.getClient();

  try {
    const { formData } = req.body;

    if (!formData) {
      return res.status(400).json({ message: 'Form data is required' });
    }

    await client.query('BEGIN');

    // Get the latest active First Call Report template
    const templateResult = await client.query(
      `SELECT id, template_data
       FROM form_templates
       WHERE form_type = 'first_call_report'
         AND is_active = TRUE
         AND deleted_at IS NULL
       ORDER BY version DESC
       LIMIT 1`
    );

    const templateId = templateResult.rows[0]?.id || null;

    // Insert the First Call Report
    // The trigger will automatically create the arrangement and job
    const result = await client.query(
      `INSERT INTO first_call_reports (
        template_id,
        form_data,
        submitted_by,
        status
      ) VALUES ($1, $2, $3, 'pending')
      RETURNING *`,
      [templateId, JSON.stringify(formData), req.user.id]
    );

    const report = result.rows[0];

    await client.query('COMMIT');

    res.status(201).json({
      message: 'First Call Report submitted successfully',
      report: {
        id: report.id,
        arrangementId: report.arrangement_id,
        jobId: report.job_id,
        status: report.status,
        submittedAt: report.submitted_at,
        processedAt: report.processed_at,
        notes: report.notes,
        error: report.processing_error
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting First Call Report:', error);
    res.status(500).json({
      message: 'Failed to submit First Call Report',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get all First Call Reports with filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, submittedBy, startDate, endDate, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        fcr.*,
        u.name as submitted_by_name,
        a.deceased_name,
        j.job_type,
        j.scheduled_date as removal_date
      FROM first_call_reports fcr
      LEFT JOIN users u ON fcr.submitted_by = u.id
      LEFT JOIN arrangements a ON fcr.arrangement_id = a.id
      LEFT JOIN daily_run_sheet j ON fcr.job_id = j.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND fcr.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (submittedBy) {
      query += ` AND fcr.submitted_by = $${paramCount}`;
      params.push(submittedBy);
      paramCount++;
    }

    if (startDate) {
      query += ` AND fcr.submitted_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND fcr.submitted_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    query += ` ORDER BY fcr.submitted_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    const countQuery = query.split('ORDER BY')[0].replace(/SELECT .* FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await db.query(countQuery, params.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      reports: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching First Call Reports:', error);
    res.status(500).json({
      message: 'Failed to fetch First Call Reports',
      error: error.message
    });
  }
});

// Get a specific First Call Report by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
        fcr.*,
        u.name as submitted_by_name,
        u.email as submitted_by_email,
        a.deceased_name,
        a.status as arrangement_status,
        j.job_type,
        j.scheduled_date as removal_date,
        j.status as job_status
      FROM first_call_reports fcr
      LEFT JOIN users u ON fcr.submitted_by = u.id
      LEFT JOIN arrangements a ON fcr.arrangement_id = a.id
      LEFT JOIN daily_run_sheet j ON fcr.job_id = j.id
      WHERE fcr.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'First Call Report not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching First Call Report:', error);
    res.status(500).json({
      message: 'Failed to fetch First Call Report',
      error: error.message
    });
  }
});

// Get First Call Report by Arrangement ID
router.get('/arrangement/:arrangementId', authenticateToken, async (req, res) => {
  try {
    const { arrangementId } = req.params;

    const result = await db.query(
      `SELECT
        fcr.*,
        u.name as submitted_by_name
      FROM first_call_reports fcr
      LEFT JOIN users u ON fcr.submitted_by = u.id
      WHERE fcr.arrangement_id = $1
      ORDER BY fcr.submitted_at DESC`,
      [arrangementId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching First Call Reports by arrangement:', error);
    res.status(500).json({
      message: 'Failed to fetch First Call Reports',
      error: error.message
    });
  }
});

// Get First Call Report by Job ID
router.get('/job/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;

    const result = await db.query(
      `SELECT
        fcr.*,
        u.name as submitted_by_name
      FROM first_call_reports fcr
      LEFT JOIN users u ON fcr.submitted_by = u.id
      WHERE fcr.job_id = $1
      ORDER BY fcr.submitted_at DESC`,
      [jobId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching First Call Reports by job:', error);
    res.status(500).json({
      message: 'Failed to fetch First Call Reports',
      error: error.message
    });
  }
});

// Retry processing a failed First Call Report
router.post('/:id/retry', authenticateToken, async (req, res) => {
  const client = await db.getClient();

  try {
    const { id } = req.params;

    // Check if user is admin or manager
    if (req.user.role !== 'admin' && req.user.role !== 'management') {
      return res.status(403).json({ message: 'Only admins and managers can retry failed reports' });
    }

    await client.query('BEGIN');

    // Get the report
    const reportResult = await client.query(
      'SELECT * FROM first_call_reports WHERE id = $1',
      [id]
    );

    if (reportResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'First Call Report not found' });
    }

    const report = reportResult.rows[0];

    if (report.status !== 'failed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Only failed reports can be retried' });
    }

    // Reset status to pending to trigger reprocessing
    const result = await client.query(
      `UPDATE first_call_reports
       SET status = 'pending',
           processing_error = NULL
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'First Call Report retry initiated',
      report: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error retrying First Call Report:', error);
    res.status(500).json({
      message: 'Failed to retry First Call Report',
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
