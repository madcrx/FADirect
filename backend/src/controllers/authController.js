const db = require('../config/database');
const { generateToken } = require('../utils/jwt');
const twilio = require('twilio');
const config = require('../config');

// Initialize Twilio client (only if configured)
let twilioClient = null;
if (config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
}

/**
 * Send verification code to phone number
 * POST /api/auth/send-code
 * Body: { phoneNumber: string }
 */
exports.sendVerificationCode = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: { message: 'Phone number is required' } });
    }

    // Validate phone number format (E.164)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        error: { message: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)' }
      });
    }

    if (!twilioClient) {
      // Development mode - return mock code
      console.log(`[DEV] Verification code for ${phoneNumber}: 123456`);
      return res.json({
        success: true,
        message: 'Verification code sent (dev mode)',
        devCode: '123456', // Only in development
      });
    }

    // Send verification code via Twilio
    const verification = await twilioClient.verify
      .v2.services(config.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phoneNumber, channel: 'sms' });

    res.json({
      success: true,
      message: 'Verification code sent',
      status: verification.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify code and create/login user
 * POST /api/auth/verify-code
 * Body: { phoneNumber: string, code: string, name?: string, role?: string }
 */
exports.verifyCode = async (req, res, next) => {
  try {
    const { phoneNumber, code, name, role } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({
        error: { message: 'Phone number and verification code are required' }
      });
    }

    // Verify code with Twilio (or use dev mode)
    if (twilioClient) {
      const verificationCheck = await twilioClient.verify
        .v2.services(config.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({ to: phoneNumber, code });

      if (verificationCheck.status !== 'approved') {
        return res.status(401).json({ error: { message: 'Invalid verification code' } });
      }
    } else {
      // Development mode - accept 123456
      if (code !== '123456') {
        return res.status(401).json({ error: { message: 'Invalid verification code' } });
      }
    }

    // Check if user exists
    let result = await db.query('SELECT * FROM users WHERE phone_number = $1', [phoneNumber]);
    let user = result.rows[0];

    if (user) {
      // Existing user - update last seen and phone_verified
      await db.query(
        'UPDATE users SET last_seen = CURRENT_TIMESTAMP, phone_verified = TRUE WHERE id = $1',
        [user.id]
      );
    } else {
      // New user - create account
      if (!name || !role) {
        return res.status(400).json({
          error: { message: 'Name and role are required for new users' },
          requiresSetup: true,
        });
      }

      if (!['mourner', 'arranger'].includes(role)) {
        return res.status(400).json({
          error: { message: 'Role must be either "mourner" or "arranger"' }
        });
      }

      result = await db.query(
        `INSERT INTO users (phone_number, phone_verified, name, role)
         VALUES ($1, TRUE, $2, $3)
         RETURNING *`,
        [phoneNumber, name, role]
      );
      user = result.rows[0];
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        name: user.name,
        role: user.role,
        organizationId: user.organization_id,
        profilePhotoUrl: user.profile_photo_url,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 * Requires: Authentication
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    res.json({
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        name: user.name,
        role: user.role,
        organizationId: user.organization_id,
        profilePhotoUrl: user.profile_photo_url,
        createdAt: user.created_at,
        lastSeen: user.last_seen,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout (client-side token deletion, but update last seen)
 * POST /api/auth/logout
 * Requires: Authentication
 */
exports.logout = async (req, res, next) => {
  try {
    await db.query(
      'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = $1',
      [req.user.id]
    );

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};
