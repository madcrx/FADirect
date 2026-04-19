const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { HTTP_STATUS } = require('../constants');

/**
 * Middleware to check if user has permission to access a file
 * Requires authenticateToken to be called first
 */
const checkFileAccess = (fileType) => {
  return async (req, res, next) => {
    const { fileId } = req.params;
    const userId = req.user.id;
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const isAdmin = userRoles.includes('admin');

    try {
      let query;
      let params;

      // Check access based on file type
      switch (fileType) {
        case 'document':
          query = `
            SELECT d.id, d.arrangement_id
            FROM documents d
            LEFT JOIN arrangements a ON d.arrangement_id = a.id
            LEFT JOIN arrangement_participants ap ON a.id = ap.arrangement_id
            WHERE d.id = $1
              AND (a.arranger_id = $2 OR a.mourner_id = $2 OR ap.user_id = $2 OR $3 = true)
              AND d.deleted_at IS NULL
          `;
          params = [fileId, userId, isAdmin];
          break;

        case 'photo':
          query = `
            SELECT p.id, p.arrangement_id
            FROM photos p
            LEFT JOIN arrangements a ON p.arrangement_id = a.id
            LEFT JOIN arrangement_participants ap ON a.id = ap.arrangement_id
            WHERE p.id = $1
              AND (a.arranger_id = $2 OR a.mourner_id = $2 OR ap.user_id = $2 OR $3 = true)
              AND p.deleted_at IS NULL
          `;
          params = [fileId, userId, isAdmin];
          break;

        case 'video':
          query = `
            SELECT v.id, v.arrangement_id
            FROM videos v
            LEFT JOIN arrangements a ON v.arrangement_id = a.id
            LEFT JOIN arrangement_participants ap ON a.id = ap.arrangement_id
            WHERE v.id = $1
              AND (a.arranger_id = $2 OR a.mourner_id = $2 OR ap.user_id = $2 OR $3 = true)
              AND v.deleted_at IS NULL
          `;
          params = [fileId, userId, isAdmin];
          break;

        default:
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: { message: 'Invalid file type' },
          });
      }

      const result = await db.query(query, params);

      if (result.rows.length === 0) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          error: { message: 'Access denied: You do not have permission to access this file' },
        });
      }

      // Store arrangement_id for later use
      req.fileAccess = {
        arrangementId: result.rows[0].arrangement_id,
      };

      next();
    } catch (error) {
      console.error('Error checking file access:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: { message: 'Failed to verify file access' },
      });
    }
  };
};

/**
 * Serve a protected file
 */
const serveProtectedFile = (filePath) => {
  return (req, res) => {
    const fullPath = path.resolve(filePath);

    // Security: Ensure file path doesn't escape upload directory
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
    if (!fullPath.startsWith(uploadDir)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: { message: 'Access denied' },
      });
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: { message: 'File not found' },
      });
    }

    // Stream file to client
    const stat = fs.statSync(fullPath);
    const fileStream = fs.createReadStream(fullPath);

    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(fullPath)}"`);

    fileStream.pipe(res);
  };
};

module.exports = {
  checkFileAccess,
  serveProtectedFile,
};
