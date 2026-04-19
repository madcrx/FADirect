const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Send a file to a mourner
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { fileId, fileType, arrangementId, sentToUserId, notes } = req.body;

    if (!fileId || !fileType || !arrangementId || !sentToUserId) {
      return res.status(400).json({
        error: { message: 'File ID, file type, arrangement ID, and recipient are required' }
      });
    }

    // Verify arrangement exists
    const arrangement = await db.query(
      'SELECT id, mourner_name FROM arrangements WHERE id = $1 AND deleted_at IS NULL',
      [arrangementId]
    );

    if (arrangement.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Arrangement not found' } });
    }

    // Create file send record
    const result = await db.query(
      `INSERT INTO file_sends (
        file_id, file_type, arrangement_id, sent_to_user_id, sent_by_user_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [fileId, fileType, arrangementId, sentToUserId, req.user.id, notes || null]
    );

    // Create notification for mourner
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        sentToUserId,
        'Document Sent',
        `A ${fileType} has been sent to you for arrangement: ${arrangement.rows[0].mourner_name || 'Unnamed'}`,
        'document_sent',
        'file_send',
        result.rows[0].id
      ]
    );

    res.status(201).json({
      message: 'File sent successfully',
      fileSend: {
        id: result.rows[0].id,
        fileId: result.rows[0].file_id,
        fileType: result.rows[0].file_type,
        arrangementId: result.rows[0].arrangement_id,
        status: result.rows[0].status,
        sentAt: result.rows[0].sent_at,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all sent files for an arrangement
router.get('/arrangement/:arrangementId', authenticateToken, async (req, res, next) => {
  try {
    const { arrangementId } = req.params;

    const result = await db.query(
      `SELECT
        fs.*,
        u_to.name as sent_to_name,
        u_by.name as sent_by_name
       FROM file_sends fs
       LEFT JOIN users u_to ON fs.sent_to_user_id = u_to.id
       LEFT JOIN users u_by ON fs.sent_by_user_id = u_by.id
       WHERE fs.arrangement_id = $1
       ORDER BY fs.sent_at DESC`,
      [arrangementId]
    );

    res.json({
      fileSends: result.rows.map(row => ({
        id: row.id,
        fileId: row.file_id,
        fileType: row.file_type,
        arrangementId: row.arrangement_id,
        sentToUserId: row.sent_to_user_id,
        sentToName: row.sent_to_name,
        sentByUserId: row.sent_by_user_id,
        sentByName: row.sent_by_name,
        status: row.status,
        sentAt: row.sent_at,
        viewedAt: row.viewed_at,
        returnedAt: row.returned_at,
        notes: row.notes,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Update file send status
router.put('/:id/status', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['sent', 'viewed', 'returned', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: { message: 'Invalid status' } });
    }

    const updateFields = ['status = $1', 'updated_at = NOW()'];
    const params = [status, id];

    if (status === 'viewed' && !req.body.viewedAt) {
      updateFields.push('viewed_at = NOW()');
    }
    if (status === 'returned' && !req.body.returnedAt) {
      updateFields.push('returned_at = NOW()');
    }

    const result = await db.query(
      `UPDATE file_sends SET ${updateFields.join(', ')}
       WHERE id = $2 RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'File send not found' } });
    }

    // If file is returned, create notification for arranger
    if (status === 'returned') {
      const fileSend = result.rows[0];

      // Get arrangement details
      const arrangement = await db.query(
        'SELECT mourner_name FROM arrangements WHERE id = $1',
        [fileSend.arrangement_id]
      );

      if (fileSend.sent_by_user_id) {
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            fileSend.sent_by_user_id,
            'Document Returned',
            `A ${fileSend.file_type} has been returned for arrangement: ${arrangement.rows[0]?.mourner_name || 'Unnamed'}`,
            'document_returned',
            'file_send',
            id
          ]
        );
      }

      // Update workflow if needed
      // You can add workflow update logic here
    }

    res.json({
      message: 'Status updated successfully',
      fileSend: {
        id: result.rows[0].id,
        status: result.rows[0].status,
        viewedAt: result.rows[0].viewed_at,
        returnedAt: result.rows[0].returned_at,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Mark file as viewed (typically called from mobile app)
router.post('/:id/viewed', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE file_sends
       SET status = 'viewed', viewed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'sent'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'File send not found or already viewed' } });
    }

    res.json({
      message: 'File marked as viewed',
      fileSend: {
        id: result.rows[0].id,
        status: result.rows[0].status,
        viewedAt: result.rows[0].viewed_at,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete file send record
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM file_sends WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'File send not found' } });
    }

    res.json({ message: 'File send deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
