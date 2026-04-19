const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { schemas, validators } = require('../validators');

// Get messages for an arrangement
router.get('/arrangement/:arrangementId', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT m.*, u.name as sender_name
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.arrangement_id = $1
       ORDER BY m.created_at ASC`,
      [req.params.arrangementId]
    );
    res.json({
      messages: result.rows.map(row => ({
        id: row.id,
        arrangementId: row.arrangement_id,
        senderId: row.sender_id,
        senderName: row.sender_name,
        recipientId: row.recipient_id,
        content: row.encrypted_content, // Map encrypted_content to content for frontend
        timestamp: row.created_at,
        readAt: row.read_at,
        messageType: row.message_type,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Send message
router.post('/', authenticateToken, validateRequest(schemas.sendMessage), async (req, res, next) => {
  try {
    const { recipientId, arrangementId, encryptedContent, messageType } = req.body;
    const result = await db.query(
      `INSERT INTO messages (sender_id, recipient_id, arrangement_id, encrypted_content, message_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, recipientId, arrangementId, encryptedContent, messageType || 'text']
    );
    res.status(201).json({ message: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Mark message as read
router.put('/:id/read', authenticateToken, validateRequest([validators.uuid('id')]), async (req, res, next) => {
  try {
    await db.query(
      'UPDATE messages SET read = TRUE WHERE id = $1 AND recipient_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
