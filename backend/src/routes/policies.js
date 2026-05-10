const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pool = require('../db/pool');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/policies');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, and TXT files are allowed.'));
    }
  }
});

// Get all policy categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, display_order, created_at, updated_at
       FROM policy_categories
       ORDER BY display_order, name`
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Error fetching policy categories:', error);
    res.status(500).json({ error: { message: 'Failed to fetch policy categories' } });
  }
});

// Get all policies (with optional filtering)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category_id, requires_acknowledgment } = req.query;
    const userId = req.user.userId;

    let query = `
      SELECT
        pd.*,
        pc.name as category_name,
        u1.name as created_by_name,
        u2.name as updated_by_name,
        CASE
          WHEN pa.id IS NOT NULL THEN true
          ELSE false
        END as acknowledged
      FROM policy_documents pd
      LEFT JOIN policy_categories pc ON pd.category_id = pc.id
      LEFT JOIN users u1 ON pd.created_by = u1.id
      LEFT JOIN users u2 ON pd.updated_by = u2.id
      LEFT JOIN policy_acknowledgments pa ON pd.id = pa.policy_id AND pa.user_id = $1
      WHERE pd.deleted_at IS NULL
    `;

    const params = [userId];
    let paramIndex = 2;

    if (category_id) {
      query += ` AND pd.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    if (requires_acknowledgment !== undefined) {
      query += ` AND pd.requires_acknowledgment = $${paramIndex}`;
      params.push(requires_acknowledgment === 'true');
      paramIndex++;
    }

    query += ` ORDER BY pd.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({ policies: result.rows });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ error: { message: 'Failed to fetch policies' } });
  }
});

// Get single policy
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT
        pd.*,
        pc.name as category_name,
        u1.name as created_by_name,
        u2.name as updated_by_name,
        CASE
          WHEN pa.id IS NOT NULL THEN true
          ELSE false
        END as acknowledged
      FROM policy_documents pd
      LEFT JOIN policy_categories pc ON pd.category_id = pc.id
      LEFT JOIN users u1 ON pd.created_by = u1.id
      LEFT JOIN users u2 ON pd.updated_by = u2.id
      LEFT JOIN policy_acknowledgments pa ON pd.id = pa.policy_id AND pa.user_id = $1
      WHERE pd.id = $2 AND pd.deleted_at IS NULL`,
      [userId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Policy not found' } });
    }

    res.json({ policy: result.rows[0] });
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ error: { message: 'Failed to fetch policy' } });
  }
});

// Create new policy (Admin and Management only)
router.post('/', authenticateToken, requireRole(['admin', 'management']), upload.single('file'), async (req, res) => {
  try {
    const {
      title,
      category_id,
      version,
      requires_acknowledgment,
      description,
      effective_date,
      review_date,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: { message: 'File is required' } });
    }

    if (!title || !version) {
      // Clean up uploaded file if validation fails
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: { message: 'Title and version are required' } });
    }

    const result = await pool.query(
      `INSERT INTO policy_documents (
        title, category_id, version, file_path, file_name, file_size, mime_type,
        requires_acknowledgment, description, effective_date, review_date, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
      RETURNING *`,
      [
        title,
        category_id || null,
        version,
        req.file.path,
        req.file.originalname,
        req.file.size,
        req.file.mimetype,
        requires_acknowledgment === 'true',
        description || null,
        effective_date || null,
        review_date || null,
        req.user.userId,
      ]
    );

    // If requires acknowledgment, create notification for all users
    if (requires_acknowledgment === 'true') {
      await pool.query(
        `INSERT INTO admin_notifications (title, message, type, action_url, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          'New Policy Requires Acknowledgment',
          `New policy "${title}" (v${version}) requires your acknowledgment.`,
          'info',
          `/policies/${result.rows[0].id}`,
          req.user.userId,
        ]
      );
    }

    res.status(201).json({ policy: result.rows[0] });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    console.error('Error creating policy:', error);
    res.status(500).json({ error: { message: 'Failed to create policy' } });
  }
});

// Update policy (Admin and Management only)
router.put('/:id', authenticateToken, requireRole(['admin', 'management']), upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category_id,
      version,
      requires_acknowledgment,
      description,
      effective_date,
      review_date,
    } = req.body;

    // Check if policy exists
    const existing = await pool.query(
      'SELECT * FROM policy_documents WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (existing.rows.length === 0) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return res.status(404).json({ error: { message: 'Policy not found' } });
    }

    let updateQuery = `
      UPDATE policy_documents
      SET title = $1,
          category_id = $2,
          version = $3,
          requires_acknowledgment = $4,
          description = $5,
          effective_date = $6,
          review_date = $7,
          updated_by = $8
    `;
    let params = [
      title,
      category_id || null,
      version,
      requires_acknowledgment === 'true',
      description || null,
      effective_date || null,
      review_date || null,
      req.user.userId,
    ];

    // If new file uploaded, update file fields and delete old file
    if (req.file) {
      updateQuery += `, file_path = $9, file_name = $10, file_size = $11, mime_type = $12`;
      params.push(req.file.path, req.file.originalname, req.file.size, req.file.mimetype);

      // Delete old file
      const oldFilePath = existing.rows[0].file_path;
      fs.unlink(oldFilePath).catch(() => {});
    }

    updateQuery += ` WHERE id = $${params.length + 1} RETURNING *`;
    params.push(id);

    const result = await pool.query(updateQuery, params);

    res.json({ policy: result.rows[0] });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    console.error('Error updating policy:', error);
    res.status(500).json({ error: { message: 'Failed to update policy' } });
  }
});

// Delete policy (soft delete - Admin and Management only)
router.delete('/:id', authenticateToken, requireRole(['admin', 'management']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE policy_documents SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Policy not found' } });
    }

    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ error: { message: 'Failed to delete policy' } });
  }
});

// Download policy document
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT file_path, file_name, mime_type FROM policy_documents WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Policy not found' } });
    }

    const { file_path, file_name, mime_type } = result.rows[0];

    res.setHeader('Content-Type', mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${file_name}"`);
    res.sendFile(file_path);
  } catch (error) {
    console.error('Error downloading policy:', error);
    res.status(500).json({ error: { message: 'Failed to download policy' } });
  }
});

// Acknowledge policy
router.post('/:id/acknowledge', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Check if policy exists and requires acknowledgment
    const policy = await pool.query(
      'SELECT * FROM policy_documents WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (policy.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Policy not found' } });
    }

    if (!policy.rows[0].requires_acknowledgment) {
      return res.status(400).json({ error: { message: 'This policy does not require acknowledgment' } });
    }

    // Check if already acknowledged
    const existing = await pool.query(
      'SELECT * FROM policy_acknowledgments WHERE policy_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: { message: 'Policy already acknowledged' } });
    }

    // Create acknowledgment
    await pool.query(
      `INSERT INTO policy_acknowledgments (policy_id, user_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [id, userId, ipAddress, userAgent]
    );

    res.json({ message: 'Policy acknowledged successfully' });
  } catch (error) {
    console.error('Error acknowledging policy:', error);
    res.status(500).json({ error: { message: 'Failed to acknowledge policy' } });
  }
});

// Get pending acknowledgments for current user
router.get('/pending/acknowledgments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT
        pd.id,
        pd.title,
        pd.version,
        pc.name as category_name,
        pd.created_at,
        pd.effective_date
      FROM policy_documents pd
      LEFT JOIN policy_categories pc ON pd.category_id = pc.id
      LEFT JOIN policy_acknowledgments pa ON pd.id = pa.policy_id AND pa.user_id = $1
      WHERE pd.deleted_at IS NULL
        AND pd.requires_acknowledgment = true
        AND pa.id IS NULL
      ORDER BY pd.created_at DESC`,
      [userId]
    );

    res.json({ pending: result.rows });
  } catch (error) {
    console.error('Error fetching pending acknowledgments:', error);
    res.status(500).json({ error: { message: 'Failed to fetch pending acknowledgments' } });
  }
});

module.exports = router;
