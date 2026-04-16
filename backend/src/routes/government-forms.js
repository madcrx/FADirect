const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all government submissions (with optional arrangement filter)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { arrangementId, type, status } = req.query;

    let query = `
      SELECT gs.*, a.deceased_name
      FROM government_submissions gs
      LEFT JOIN arrangements a ON gs.arrangement_id = a.id
      WHERE gs.deleted_at IS NULL
    `;
    const params = [];
    let paramIndex = 1;

    if (arrangementId) {
      query += ` AND gs.arrangement_id = $${paramIndex}`;
      params.push(arrangementId);
      paramIndex++;
    }

    if (type) {
      query += ` AND gs.submission_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (status) {
      query += ` AND gs.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY gs.created_at DESC';

    const result = await db.query(query, params);

    res.json({
      submissions: result.rows.map(row => ({
        id: row.id,
        arrangementId: row.arrangement_id,
        submissionType: row.submission_type,
        status: row.status,
        referenceNumber: row.reference_number,
        submissionDate: row.submission_date,
        completionDate: row.completion_date,
        notes: row.notes,
        deceasedName: row.deceased_name,
        formData: row.form_data,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get single submission with documents
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const submissionResult = await db.query(
      `SELECT gs.*, a.deceased_name
       FROM government_submissions gs
       LEFT JOIN arrangements a ON gs.arrangement_id = a.id
       WHERE gs.id = $1 AND gs.deleted_at IS NULL`,
      [id]
    );

    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Submission not found' } });
    }

    const submission = submissionResult.rows[0];

    // Get related documents
    const documentsResult = await db.query(
      'SELECT * FROM government_documents WHERE submission_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({
      submission: {
        id: submission.id,
        arrangementId: submission.arrangement_id,
        submissionType: submission.submission_type,
        status: submission.status,
        referenceNumber: submission.reference_number,
        submissionDate: submission.submission_date,
        completionDate: submission.completion_date,
        notes: submission.notes,
        deceasedName: submission.deceased_name,
        formData: submission.form_data,
        createdAt: submission.created_at,
        updatedAt: submission.updated_at,
        documents: documentsResult.rows.map(doc => ({
          id: doc.id,
          documentName: doc.document_name,
          documentType: doc.document_type,
          filePath: doc.file_path,
          fileSize: doc.file_size,
          createdAt: doc.created_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create new submission
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { arrangementId, submissionType, status, referenceNumber, submissionDate, notes, formData } = req.body;

    if (!arrangementId || !submissionType) {
      return res.status(400).json({
        error: { message: 'Arrangement ID and submission type are required' },
      });
    }

    const validTypes = ['bdm_death_registration', 'coroner_report', 'death_certificate_application'];
    if (!validTypes.includes(submissionType)) {
      return res.status(400).json({
        error: { message: 'Invalid submission type' },
      });
    }

    const result = await db.query(
      `INSERT INTO government_submissions (
        arrangement_id, submission_type, status, reference_number,
        submission_date, notes, form_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        arrangementId,
        submissionType,
        status || 'draft',
        referenceNumber || null,
        submissionDate || null,
        notes || null,
        formData ? JSON.stringify(formData) : null,
      ]
    );

    const submission = result.rows[0];
    res.status(201).json({
      submission: {
        id: submission.id,
        arrangementId: submission.arrangement_id,
        submissionType: submission.submission_type,
        status: submission.status,
        referenceNumber: submission.reference_number,
        submissionDate: submission.submission_date,
        completionDate: submission.completion_date,
        notes: submission.notes,
        formData: submission.form_data,
        createdAt: submission.created_at,
        updatedAt: submission.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update submission
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, referenceNumber, submissionDate, completionDate, notes, formData } = req.body;

    const result = await db.query(
      `UPDATE government_submissions
       SET status = COALESCE($1, status),
           reference_number = COALESCE($2, reference_number),
           submission_date = COALESCE($3, submission_date),
           completion_date = COALESCE($4, completion_date),
           notes = COALESCE($5, notes),
           form_data = COALESCE($6, form_data),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND deleted_at IS NULL
       RETURNING *`,
      [
        status,
        referenceNumber,
        submissionDate,
        completionDate,
        notes,
        formData ? JSON.stringify(formData) : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Submission not found' } });
    }

    const submission = result.rows[0];
    res.json({
      submission: {
        id: submission.id,
        arrangementId: submission.arrangement_id,
        submissionType: submission.submission_type,
        status: submission.status,
        referenceNumber: submission.reference_number,
        submissionDate: submission.submission_date,
        completionDate: submission.completion_date,
        notes: submission.notes,
        formData: submission.form_data,
        createdAt: submission.created_at,
        updatedAt: submission.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete submission (soft delete)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE government_submissions SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get submissions for a specific arrangement
router.get('/arrangement/:arrangementId', authenticateToken, async (req, res, next) => {
  try {
    const { arrangementId } = req.params;

    const result = await db.query(
      `SELECT * FROM government_submissions
       WHERE arrangement_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [arrangementId]
    );

    res.json({
      submissions: result.rows.map(row => ({
        id: row.id,
        arrangementId: row.arrangement_id,
        submissionType: row.submission_type,
        status: row.status,
        referenceNumber: row.reference_number,
        submissionDate: row.submission_date,
        completionDate: row.completion_date,
        notes: row.notes,
        formData: row.form_data,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
