const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const twilio = require('twilio');

// Get Twilio configuration from company settings
async function getTwilioClient() {
  const result = await db.query(`
    SELECT twilio_account_sid, twilio_auth_token, twilio_phone_number
    FROM company_settings
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    throw new Error('Company settings not configured');
  }

  const settings = result.rows[0];

  if (!settings.twilio_account_sid || !settings.twilio_auth_token || !settings.twilio_phone_number) {
    throw new Error('Twilio credentials not configured in settings');
  }

  return {
    client: twilio(settings.twilio_account_sid, settings.twilio_auth_token),
    fromNumber: settings.twilio_phone_number,
  };
}

// Make a phone call
router.post('/call',
  authenticateToken,
  [
    body('toNumber').trim().notEmpty().withMessage('Phone number is required'),
    body('arrangementId').optional().isUUID().withMessage('Invalid arrangement ID'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const { toNumber, arrangementId } = req.body;
    const userId = req.user.id;

    try {
      const { client, fromNumber } = await getTwilioClient();

      // Get user's phone number to connect the call to
      const userResult = await db.query(`
        SELECT phone_number FROM users WHERE id = $1
      `, [userId]);

      if (userResult.rows.length === 0 || !userResult.rows[0].phone_number) {
        return res.status(400).json({
          error: { message: 'User phone number not configured' }
        });
      }

      const userPhoneNumber = userResult.rows[0].phone_number;

      // Create a TwiML response that connects the caller to the user
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting your call. Please wait.</Say>
  <Dial>
    <Number>${userPhoneNumber}</Number>
  </Dial>
</Response>`;

      // Initiate the call
      const call = await client.calls.create({
        to: toNumber,
        from: fromNumber,
        twiml: twiml,
        statusCallback: `${process.env.API_URL || 'http://localhost:3000'}/api/phone/call-status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      });

      // Log the call in the database
      await db.query(`
        INSERT INTO call_logs (
          call_sid,
          user_id,
          arrangement_id,
          to_number,
          from_number,
          status,
          direction
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        call.sid,
        userId,
        arrangementId || null,
        toNumber,
        fromNumber,
        call.status,
        'outbound',
      ]);

      res.json({
        message: 'Call initiated successfully',
        callSid: call.sid,
        status: call.status,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Send SMS
router.post('/sms',
  authenticateToken,
  [
    body('toNumber').trim().notEmpty().withMessage('Phone number is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('arrangementId').optional().isUUID().withMessage('Invalid arrangement ID'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const { toNumber, message, arrangementId } = req.body;
    const userId = req.user.id;

    try {
      const { client, fromNumber } = await getTwilioClient();

      // Send the SMS
      const sms = await client.messages.create({
        to: toNumber,
        from: fromNumber,
        body: message,
        statusCallback: `${process.env.API_URL || 'http://localhost:3000'}/api/phone/sms-status`,
      });

      // Log the SMS in the messages table
      await db.query(`
        INSERT INTO messages (
          arrangement_id,
          sender_id,
          recipient_phone,
          content,
          type,
          status,
          external_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        arrangementId || null,
        userId,
        toNumber,
        message,
        'sms',
        sms.status,
        sms.sid,
      ]);

      res.json({
        message: 'SMS sent successfully',
        messageSid: sms.sid,
        status: sms.status,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get call logs
router.get('/call-logs', authenticateToken, async (req, res, next) => {
  try {
    const { arrangementId, limit = 50 } = req.query;

    let query = `
      SELECT
        cl.*,
        u.full_name as user_name,
        a.deceased_name
      FROM call_logs cl
      LEFT JOIN users u ON cl.user_id = u.id
      LEFT JOIN arrangements a ON cl.arrangement_id = a.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (arrangementId) {
      query += ` AND cl.arrangement_id = $${paramCount}`;
      params.push(arrangementId);
      paramCount++;
    }

    query += ` ORDER BY cl.created_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await db.query(query, params);

    res.json({
      callLogs: result.rows.map(row => ({
        id: row.id,
        callSid: row.call_sid,
        userId: row.user_id,
        userName: row.user_name,
        arrangementId: row.arrangement_id,
        deceasedName: row.deceased_name,
        toNumber: row.to_number,
        fromNumber: row.from_number,
        status: row.status,
        direction: row.direction,
        duration: row.duration,
        recordingUrl: row.recording_url,
        createdAt: row.created_at,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Webhook for call status updates
router.post('/call-status', async (req, res) => {
  try {
    const { CallSid, CallStatus, CallDuration, RecordingUrl } = req.body;

    await db.query(`
      UPDATE call_logs
      SET status = $1,
          duration = $2,
          recording_url = $3,
          updated_at = NOW()
      WHERE call_sid = $4
    `, [CallStatus, CallDuration || null, RecordingUrl || null, CallSid]);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error updating call status:', error);
    res.status(500).send('Error');
  }
});

// Webhook for SMS status updates
router.post('/sms-status', async (req, res) => {
  try {
    const { MessageSid, MessageStatus } = req.body;

    await db.query(`
      UPDATE messages
      SET status = $1,
          updated_at = NOW()
      WHERE external_id = $2
    `, [MessageStatus, MessageSid]);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error updating SMS status:', error);
    res.status(500).send('Error');
  }
});

// Click-to-call from arrangement
router.post('/click-to-call/:arrangementId',
  authenticateToken,
  [
    body('contactType').isIn(['family', 'informant', 'other']).withMessage('Invalid contact type'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const { arrangementId } = req.params;
    const { contactType } = req.body;

    try {
      // Get arrangement contact phone number
      const result = await db.query(`
        SELECT informant_phone, family_contact_phone
        FROM arrangements
        WHERE id = $1
      `, [arrangementId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: { message: 'Arrangement not found' } });
      }

      const arrangement = result.rows[0];
      let toNumber;

      if (contactType === 'informant') {
        toNumber = arrangement.informant_phone;
      } else if (contactType === 'family') {
        toNumber = arrangement.family_contact_phone;
      }

      if (!toNumber) {
        return res.status(400).json({
          error: { message: 'Contact phone number not available' }
        });
      }

      // Initiate the call using the call endpoint
      req.body = { toNumber, arrangementId };
      return router.handle({ ...req, url: '/call', method: 'POST' }, res, next);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
