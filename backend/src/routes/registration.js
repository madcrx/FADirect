const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * Registration Routes
 * Handles user registration and approval workflow
 */

// Submit registration (public endpoint - no auth required)
router.post('/register', async (req, res, next) => {
  try {
    const { phoneNumber, name, email, requestedRole, registrationData, verificationCode } = req.body;

    if (!phoneNumber || !name || !requestedRole) {
      return res.status(400).json({
        error: { message: 'Phone number, name, and requested role are required' }
      });
    }

    if (!['staff', 'mourner'].includes(requestedRole)) {
      return res.status(400).json({
        error: { message: 'Requested role must be either "staff" or "mourner"' }
      });
    }

    // Check if phone number is already registered
    const existingUser = await db.query(
      'SELECT id FROM users WHERE phone_number = $1',
      [phoneNumber]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: { message: 'This phone number is already registered' }
      });
    }

    // Check if there's already a pending registration
    const pendingReg = await db.query(
      'SELECT id, status FROM pending_user_registrations WHERE phone_number = $1',
      [phoneNumber]
    );

    if (pendingReg.rows.length > 0) {
      const status = pendingReg.rows[0].status;
      if (status === 'pending') {
        return res.status(409).json({
          error: { message: 'You already have a pending registration request' }
        });
      } else if (status === 'rejected') {
        // Allow resubmission if previously rejected
        await db.query(
          'DELETE FROM pending_user_registrations WHERE phone_number = $1',
          [phoneNumber]
        );
      }
    }

    // Create pending registration
    const result = await db.query(`
      INSERT INTO pending_user_registrations (
        phone_number, name, email, requested_role,
        registration_data, verification_code, code_verified_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, phone_number, name, requested_role, status, created_at
    `, [
      phoneNumber,
      name,
      email || null,
      requestedRole,
      JSON.stringify(registrationData || {}),
      verificationCode || null
    ]);

    const registration = result.rows[0];

    // Create admin notification
    await db.query(`
      INSERT INTO admin_notifications (
        notification_type, title, body, data,
        related_entity_type, related_entity_id, target_roles
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      'user_registration',
      'New User Registration',
      `${name} has requested to register as ${requestedRole}`,
      JSON.stringify({ phoneNumber, email, requestedRole }),
      'pending_registration',
      registration.id,
      '{admin,management}'
    ]);

    // Send email to all admins
    await db.query(`
      INSERT INTO email_queue (
        to_email, to_name, subject, body, priority
      )
      SELECT
        COALESCE(u.email, u.phone_number || '@placeholder.com'),
        u.name,
        'New User Registration Pending Approval',
        $1,
        1
      FROM users u
      WHERE 'admin' = ANY(u.role) AND u.deleted_at IS NULL
    `, [
      `A new user registration is pending your approval:

      Name: ${name}
      Phone: ${phoneNumber}
      Email: ${email || 'Not provided'}
      Requested Role: ${requestedRole.charAt(0).toUpperCase() + requestedRole.slice(1)}

      Please log in to the CarePortal to review and approve this registration.
      `
    ]);

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. An admin will review your request.',
      registration: {
        id: registration.id,
        phoneNumber: registration.phone_number,
        name: registration.name,
        status: registration.status,
        createdAt: registration.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all pending registrations (admin only)
router.get('/pending', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        pr.*,
        u.name as reviewed_by_name
      FROM pending_user_registrations pr
      LEFT JOIN users u ON pr.reviewed_by = u.id
    `;

    const params = [];
    if (status) {
      query += ' WHERE pr.status = $1';
      params.push(status);
    }

    query += ' ORDER BY pr.created_at DESC';

    const result = await db.query(query, params);

    res.json({ registrations: result.rows });
  } catch (error) {
    next(error);
  }
});

// Approve registration (admin only)
router.post('/:registrationId/approve', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { registrationId } = req.params;
    const adminId = req.user.id;
    const { assignedRoles } = req.body; // Actual roles to assign (can be different from requested)

    // Get registration details
    const regResult = await db.query(
      'SELECT * FROM pending_user_registrations WHERE id = $1',
      [registrationId]
    );

    if (regResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Registration not found' } });
    }

    const registration = regResult.rows[0];

    if (registration.status !== 'pending') {
      return res.status(400).json({
        error: { message: `Registration has already been ${registration.status}` }
      });
    }

    // Determine roles to assign
    const rolesToAssign = assignedRoles || [registration.requested_role];

    // Create user account
    const userResult = await db.query(`
      INSERT INTO users (phone_number, name, email, role, phone_verified)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, phone_number, name, role
    `, [
      registration.phone_number,
      registration.name,
      registration.email,
      rolesToAssign
    ]);

    const newUser = userResult.rows[0];

    // If staff role, create staff profile
    if (rolesToAssign.includes('staff') ||
        rolesToAssign.includes('conductor') ||
        rolesToAssign.includes('arranger')) {
      await db.query(`
        INSERT INTO staff_profiles (user_id)
        VALUES ($1)
      `, [newUser.id]);
    }

    // Update registration status
    await db.query(`
      UPDATE pending_user_registrations
      SET status = 'approved',
          reviewed_by = $1,
          reviewed_at = NOW()
      WHERE id = $2
    `, [adminId, registrationId]);

    // Send approval email to user
    await db.query(`
      INSERT INTO email_queue (
        to_email, to_name, subject, body, priority
      )
      VALUES ($1, $2, $3, $4, 1)
    `, [
      registration.email || (registration.phone_number + '@placeholder.com'),
      registration.name,
      'Your CarePortal Registration Has Been Approved',
      `Dear ${registration.name},

Your registration for CarePortal has been approved!

You can now log in to the FA Direct mobile app using:
Phone Number: ${registration.phone_number}

Your assigned role(s): ${rolesToAssign.join(', ')}

Welcome to the team!
      `
    ]);

    // Create roster notification if staff
    if (rolesToAssign.some(r => ['staff', 'conductor', 'arranger', 'driver'].includes(r))) {
      await db.query(`
        INSERT INTO roster_notifications (
          user_id, notification_type, title, body, data
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        newUser.id,
        'registration_approved',
        'Welcome to CarePortal!',
        'Your registration has been approved. You can now view and confirm shift assignments.',
        JSON.stringify({ approvedAt: new Date().toISOString() })
      ]);
    }

    res.json({
      success: true,
      message: 'Registration approved and user created successfully',
      user: newUser
    });
  } catch (error) {
    next(error);
  }
});

// Reject registration (admin only)
router.post('/:registrationId/reject', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { registrationId } = req.params;
    const adminId = req.user.id;
    const { reason } = req.body;

    // Get registration details
    const regResult = await db.query(
      'SELECT * FROM pending_user_registrations WHERE id = $1',
      [registrationId]
    );

    if (regResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Registration not found' } });
    }

    const registration = regResult.rows[0];

    if (registration.status !== 'pending') {
      return res.status(400).json({
        error: { message: `Registration has already been ${registration.status}` }
      });
    }

    // Update registration status
    await db.query(`
      UPDATE pending_user_registrations
      SET status = 'rejected',
          rejection_reason = $1,
          reviewed_by = $2,
          reviewed_at = NOW()
      WHERE id = $3
    `, [reason || 'No reason provided', adminId, registrationId]);

    // Send rejection email to user
    await db.query(`
      INSERT INTO email_queue (
        to_email, to_name, subject, body, priority
      )
      VALUES ($1, $2, $3, $4, 2)
    `, [
      registration.email || (registration.phone_number + '@placeholder.com'),
      registration.name,
      'CarePortal Registration Update',
      `Dear ${registration.name},

Thank you for your interest in CarePortal.

Unfortunately, we are unable to approve your registration request at this time.

${reason ? `Reason: ${reason}` : ''}

If you have any questions, please contact your administrator.
      `
    ]);

    res.json({
      success: true,
      message: 'Registration rejected'
    });
  } catch (error) {
    next(error);
  }
});

// Get admin notifications
router.get('/admin/notifications', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRoles = req.user.role;

    const result = await db.query(`
      SELECT * FROM admin_notifications
      WHERE target_roles && $1::text[]
        AND (expires_at IS NULL OR expires_at > NOW())
        AND NOT ($2 = ANY(read_by))
      ORDER BY created_at DESC
      LIMIT 50
    `, [userRoles, userId]);

    res.json({ notifications: result.rows });
  } catch (error) {
    next(error);
  }
});

// Mark admin notification as read
router.put('/admin/notifications/:notificationId/read', authenticateToken, async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    await db.query(`
      UPDATE admin_notifications
      SET read_by = array_append(read_by, $1)
      WHERE id = $2 AND NOT ($1 = ANY(read_by))
    `, [userId, notificationId]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
