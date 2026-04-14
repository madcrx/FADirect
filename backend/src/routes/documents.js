const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');

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
router.post('/upload', authenticateToken, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const { arrangementId, documentType } = req.body;

    // Generate full URL for the uploaded file
    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

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

// Get documents for arrangement
router.get('/arrangement/:arrangementId', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM documents WHERE arrangement_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
      [req.params.arrangementId]
    );

    // Ensure URLs are absolute
    const protocol = req.protocol;
    const host = req.get('host');
    const documents = result.rows.map(doc => ({
      ...doc,
      file_url: doc.file_url.startsWith('http') ? doc.file_url : `${protocol}://${host}${doc.file_url}`,
    }));

    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

// Soft delete document (uploader or arranger)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    // Get document and check permissions
    const doc = await db.query(
      `SELECT d.*, a.arranger_id
       FROM documents d
       JOIN arrangements a ON d.arrangement_id = a.id
       WHERE d.id = $1`,
      [req.params.id]
    );

    if (doc.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Document not found' } });
    }

    const isUploader = doc.rows[0].uploaded_by === req.user.id;
    const isArranger = doc.rows[0].arranger_id === req.user.id;

    if (!isUploader && !isArranger) {
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
