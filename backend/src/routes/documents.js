const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { schemas, validators } = require('../validators');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  },
});

// Upload document
router.post('/upload', authenticateToken, upload.single('file'), validateRequest(schemas.uploadDocument), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const { arrangementId, documentType } = req.body;

    // Use relative URL for the uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;

    const result = await db.query(
      `INSERT INTO documents (arrangement_id, uploaded_by, file_name, file_type, file_size, file_url, document_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [arrangementId, req.user.id, req.file.originalname, req.file.mimetype, req.file.size, fileUrl, documentType]
    );

    res.status(201).json({ document: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Get all documents (with optional arrangement filter)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { arrangementId } = req.query;

    let query = `
      SELECT
        d.*,
        u.name as uploaded_by_name,
        a.deceased_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN arrangements a ON d.arrangement_id = a.id
      WHERE d.deleted_at IS NULL
    `;

    const params = [];
    if (arrangementId) {
      query += ` AND d.arrangement_id = $1`;
      params.push(arrangementId);
    }

    query += ` ORDER BY d.created_at DESC LIMIT 100`;

    const result = await db.query(query, params);

    // Map to response format with relative URLs
    const documents = result.rows.map(doc => ({
      id: doc.id,
      fileName: doc.file_name,
      originalName: doc.file_name,
      fileSize: doc.file_size,
      mimeType: doc.file_type,
      arrangementId: doc.arrangement_id,
      deceasedName: doc.deceased_name,
      uploadedBy: doc.uploaded_by_name,
      uploadedAt: doc.created_at,
      url: doc.file_url,
    }));

    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

// Get documents for arrangement
router.get('/arrangement/:arrangementId', authenticateToken, validateRequest([validators.uuid('arrangementId')]), async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT d.*, u.name as uploader_name
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.arrangement_id = $1 AND d.deleted_at IS NULL
       ORDER BY d.created_at DESC`,
      [req.params.arrangementId]
    );

    // Transform to camelCase with relative URLs
    const documents = result.rows.map(doc => ({
      id: doc.id,
      fileName: doc.file_name,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      fileUrl: doc.file_url,
      arrangementId: doc.arrangement_id,
      uploadedBy: doc.uploaded_by,
      uploaderName: doc.uploader_name,
      documentType: doc.document_type,
      createdAt: doc.created_at,
    }));

    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

// Soft delete document (uploader or arranger)
router.delete('/:id', authenticateToken, validateRequest([validators.uuid('id')]), async (req, res, next) => {
  try {
    // Get document and check permissions
    const doc = await db.query(
      `SELECT d.*, a.arranger_id
       FROM documents d
       LEFT JOIN arrangements a ON d.arrangement_id = a.id
       WHERE d.id = $1 AND d.deleted_at IS NULL`,
      [req.params.id]
    );

    if (doc.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Document not found' } });
    }

    const isUploader = doc.rows[0].uploaded_by === req.user.id;
    const isArranger = doc.rows[0].arranger_id && doc.rows[0].arranger_id === req.user.id;
    const isAdmin = Array.isArray(req.user.role) ? req.user.role.includes('admin') : req.user.role === 'admin';

    // Allow deletion if: uploader, arranger, admin, or unassigned file
    const canDelete = isUploader || isArranger || isAdmin || !doc.rows[0].arrangement_id;

    if (!canDelete) {
      return res.status(403).json({ error: { message: 'Unauthorized' } });
    }

    // Soft delete
    await db.query(
      'UPDATE documents SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.params.id]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
