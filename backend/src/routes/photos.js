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
    const fileUrl = `/uploads/${req.file.filename}`;
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

// Get photos for arrangement
router.get('/arrangement/:arrangementId', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT p.*, u.name as uploader_name
       FROM photos p
       LEFT JOIN users u ON p.uploaded_by = u.id
       WHERE p.arrangement_id = $1
       ORDER BY p.created_at DESC`,
      [req.params.arrangementId]
    );
    res.json({ photos: result.rows });
  } catch (error) {
    next(error);
  }
});

// Delete photo
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM photos WHERE id = $1 AND uploaded_by = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Photo not found or unauthorized' } });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
