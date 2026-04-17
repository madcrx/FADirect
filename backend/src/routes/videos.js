const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for video uploads
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
  limits: { fileSize: config.MAX_FILE_SIZE * 10 }, // 10x larger limit for videos
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|mov|avi|webm|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('video/');
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only video files are allowed.'));
  },
});

// Upload video
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
      `INSERT INTO videos (arrangement_id, uploaded_by, file_name, file_url, thumbnail_url, file_size, caption)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [arrangementId, req.user.id, req.file.originalname, fileUrl, thumbnailUrl, req.file.size, caption || null]
    );

    res.status(201).json({ video: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Get all videos (with optional arrangement filter)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { arrangementId } = req.query;

    let query = `
      SELECT
        v.*,
        u.name as uploaded_by_name,
        a.deceased_name
      FROM videos v
      LEFT JOIN users u ON v.uploaded_by = u.id
      LEFT JOIN arrangements a ON v.arrangement_id = a.id
      WHERE v.deleted_at IS NULL
    `;

    const params = [];
    if (arrangementId) {
      query += ` AND v.arrangement_id = $1`;
      params.push(arrangementId);
    }

    query += ` ORDER BY v.created_at DESC LIMIT 100`;

    const result = await db.query(query, params);

    // Ensure URLs are absolute
    const protocol = req.protocol;
    const host = req.get('host');
    const videos = result.rows.map(video => ({
      id: video.id,
      fileName: video.file_name,
      originalName: video.file_name,
      fileSize: video.file_size,
      duration: video.duration,
      arrangementId: video.arrangement_id,
      deceasedName: video.deceased_name,
      uploadedBy: video.uploaded_by_name,
      uploadedAt: video.created_at,
      url: video.file_url.startsWith('http') ? video.file_url : `${protocol}://${host}${video.file_url}`,
      thumbnailUrl: video.thumbnail_url ? (video.thumbnail_url.startsWith('http') ? video.thumbnail_url : `${protocol}://${host}${video.thumbnail_url}`) : null,
      caption: video.caption,
    }));

    res.json({ videos });
  } catch (error) {
    next(error);
  }
});

// Get videos for arrangement
router.get('/arrangement/:arrangementId', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT v.*, u.name as uploader_name
       FROM videos v
       LEFT JOIN users u ON v.uploaded_by = u.id
       WHERE v.arrangement_id = $1
         AND v.deleted_at IS NULL
       ORDER BY v.created_at DESC`,
      [req.params.arrangementId]
    );

    // Ensure URLs are absolute and transform to camelCase
    const protocol = req.protocol;
    const host = req.get('host');
    const videos = result.rows.map(video => ({
      id: video.id,
      fileName: video.file_name,
      fileUrl: video.file_url.startsWith('http') ? video.file_url : `${protocol}://${host}${video.file_url}`,
      thumbnailUrl: video.thumbnail_url ? (video.thumbnail_url.startsWith('http') ? video.thumbnail_url : `${protocol}://${host}${video.thumbnail_url}`) : null,
      fileSize: video.file_size,
      duration: video.duration,
      arrangementId: video.arrangement_id,
      uploadedBy: video.uploaded_by,
      uploaderName: video.uploader_name,
      caption: video.caption,
      createdAt: video.created_at,
    }));

    res.json({ videos });
  } catch (error) {
    next(error);
  }
});

// Soft delete video (uploader, arranger, admin, or unassigned)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    // Get video and check permissions
    const video = await db.query(
      `SELECT v.*, a.arranger_id
       FROM videos v
       LEFT JOIN arrangements a ON v.arrangement_id = a.id
       WHERE v.id = $1 AND v.deleted_at IS NULL`,
      [req.params.id]
    );

    if (video.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Video not found' } });
    }

    const isUploader = video.rows[0].uploaded_by === req.user.id;
    const isArranger = video.rows[0].arranger_id && video.rows[0].arranger_id === req.user.id;
    const isAdmin = Array.isArray(req.user.role) ? req.user.role.includes('admin') : req.user.role === 'admin';

    // Allow deletion if: uploader, arranger, admin, or unassigned file
    const canDelete = isUploader || isArranger || isAdmin || !video.rows[0].arrangement_id;

    if (!canDelete) {
      return res.status(403).json({ error: { message: 'Unauthorized' } });
    }

    // Soft delete
    await db.query(
      'UPDATE videos SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.params.id]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
