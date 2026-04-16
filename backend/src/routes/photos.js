const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for photo uploads
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
    const allowedTypes = /jpeg|jpg|png|gif|heic/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only images are allowed.'));
  },
});

// Upload photo
router.post('/upload', authenticateToken, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const { arrangementId, caption } = req.body;

    // Generate full URL for the uploaded file
    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    const thumbnailUrl = fileUrl; // TODO: Generate actual thumbnail

    const result = await db.query(
      `INSERT INTO photos (arrangement_id, uploaded_by, file_name, file_url, thumbnail_url, caption)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [arrangementId, req.user.id, req.file.originalname, fileUrl, thumbnailUrl, caption || null]
    );

    res.status(201).json({ photo: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Get all photos (with optional arrangement filter)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { arrangementId } = req.query;

    let query = `
      SELECT
        p.*,
        u.name as uploaded_by_name,
        a.deceased_name
      FROM photos p
      LEFT JOIN users u ON p.uploaded_by = u.id
      LEFT JOIN arrangements a ON p.arrangement_id = a.id
      WHERE p.deleted_at IS NULL
    `;

    const params = [];
    if (arrangementId) {
      query += ` AND p.arrangement_id = $1`;
      params.push(arrangementId);
    }

    query += ` ORDER BY p.created_at DESC LIMIT 100`;

    const result = await db.query(query, params);

    // Ensure URLs are absolute
    const protocol = req.protocol;
    const host = req.get('host');
    const photos = result.rows.map(photo => ({
      id: photo.id,
      fileName: photo.file_name,
      originalName: photo.file_name,
      fileSize: 0, // Not stored for photos
      mimeType: 'image/jpeg', // Default
      arrangementId: photo.arrangement_id,
      deceasedName: photo.deceased_name,
      uploadedBy: photo.uploaded_by_name,
      uploadedAt: photo.created_at,
      url: photo.file_url.startsWith('http') ? photo.file_url : `${protocol}://${host}${photo.file_url}`,
    }));

    res.json({ photos });
  } catch (error) {
    next(error);
  }
});

// Get photos for arrangement
router.get('/arrangement/:arrangementId', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT p.*, u.name as uploader_name
       FROM photos p
       LEFT JOIN users u ON p.uploaded_by = u.id
       WHERE p.arrangement_id = $1
         AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC`,
      [req.params.arrangementId]
    );

    // Ensure URLs are absolute
    const protocol = req.protocol;
    const host = req.get('host');
    const photos = result.rows.map(photo => ({
      ...photo,
      file_url: photo.file_url.startsWith('http') ? photo.file_url : `${protocol}://${host}${photo.file_url}`,
      thumbnail_url: photo.thumbnail_url.startsWith('http') ? photo.thumbnail_url : `${protocol}://${host}${photo.thumbnail_url}`,
    }));

    res.json({ photos });
  } catch (error) {
    next(error);
  }
});

// Soft delete photo (uploader or arranger)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    // Get photo and check permissions
    const photo = await db.query(
      `SELECT p.*, a.arranger_id
       FROM photos p
       JOIN arrangements a ON p.arrangement_id = a.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (photo.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Photo not found' } });
    }

    const isUploader = photo.rows[0].uploaded_by === req.user.id;
    const isArranger = photo.rows[0].arranger_id === req.user.id;

    if (!isUploader && !isArranger) {
      return res.status(403).json({ error: { message: 'Unauthorized' } });
    }

    // Soft delete
    await db.query(
      'UPDATE photos SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.params.id]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
