const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { schemas, validators } = require('../validators');

// Get leave requests (all for admin/management, own for staff)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, staffId } = req.query;
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const isManager = userRoles.includes('admin') || userRoles.includes('management');

    let query = `
      SELECT
        lr.id,
        lr.staff_id,
        lr.leave_type,
        lr.start_date,
        lr.end_date,
        lr.reason,
        lr.status,
        lr.approved_by,
        lr.approved_at,
        lr.created_at,
        lr.updated_at,
        u.name as staff_name,
        u.phone_number as staff_phone,
        approver.name as approved_by_name
      FROM leave_requests lr
      JOIN users u ON lr.staff_id = u.id
      LEFT JOIN users approver ON lr.approved_by = approver.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Non-managers can only see their own leave requests
    if (!isManager) {
      query += ` AND lr.staff_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    } else if (staffId) {
      query += ` AND lr.staff_id = $${paramCount}`;
      params.push(staffId);
      paramCount++;
    }

    if (status) {
      query += ` AND lr.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` ORDER BY lr.start_date ASC`;

    const result = await db.query(query, params);

    res.json({
      leaveRequests: result.rows.map(row => ({
        id: row.id,
        staffId: row.staff_id,
        staffName: row.staff_name,
        staffPhone: row.staff_phone,
        leaveType: row.leave_type,
        startDate: row.start_date,
        endDate: row.end_date,
        reason: row.reason,
        status: row.status,
        approvedBy: row.approved_by,
        approvedByName: row.approved_by_name,
        approvedAt: row.approved_at,
        createdAt: row.created_at,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Create leave request
router.post('/', authenticateToken, validateRequest(schemas.createLeave), async (req, res, next) => {
  try {
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: { message: 'Start date and end date are required' }
      });
    }

    const result = await db.query(
      `INSERT INTO leave_requests (staff_id, start_date, end_date, leave_type, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [req.user.id, startDate, endDate, req.body.leaveType || 'annual', reason]
    );

    const leaveRequest = result.rows[0];

    // Get the requesting user's name
    const userResult = await db.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
    const userName = userResult.rows[0]?.name || 'Unknown';

    // Notify all managers and admins about the new leave request
    const managersResult = await db.query(
      `SELECT id FROM users
       WHERE 'admin' = ANY(role) OR 'management' = ANY(role)`
    );

    const notificationPromises = managersResult.rows.map(manager =>
      db.query(
        `INSERT INTO notifications (user_id, title, body, type, category, entity_type, entity_id, action_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          manager.id,
          'New Leave Request',
          `${userName} has requested leave from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
          'info',
          'leave',
          'leave_request',
          leaveRequest.id,
          '/leave-management'
        ]
      )
    );

    await Promise.all(notificationPromises);

    res.status(201).json({
      message: 'Leave request submitted successfully',
      leaveRequest
    });
  } catch (error) {
    next(error);
  }
});

// Approve/reject leave request (admin/management only)
router.put('/:id/status', authenticateToken, validateRequest([validators.uuid('id'), ...schemas.updateLeaveStatus]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if user is admin or management
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const isManager = userRoles.includes('admin') || userRoles.includes('management');

    if (!isManager) {
      return res.status(403).json({
        error: { message: 'Only admin and management can approve/reject leave requests' }
      });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: { message: 'Status must be either "approved" or "rejected"' }
      });
    }

    const result = await db.query(
      `UPDATE leave_requests
       SET status = $1, approved_by = $2, approved_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Leave request not found' }
      });
    }

    const leaveRequest = result.rows[0];

    // Get approver's name
    const approverResult = await db.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
    const approverName = approverResult.rows[0]?.name || 'Manager';

    // Notify the staff member about the decision
    await db.query(
      `INSERT INTO notifications (user_id, title, body, type, category, entity_type, entity_id, action_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        leaveRequest.staff_id,
        `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        `Your leave request from ${new Date(leaveRequest.start_date).toLocaleDateString()} to ${new Date(leaveRequest.end_date).toLocaleDateString()} has been ${status} by ${approverName}`,
        status === 'approved' ? 'success' : 'warning',
        'leave',
        'leave_request',
        leaveRequest.id,
        '/leave-management'
      ]
    );

    res.json({
      message: `Leave request ${status}`,
      leaveRequest
    });
  } catch (error) {
    next(error);
  }
});

// Delete leave request (own requests only, or admin)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const isAdmin = userRoles.includes('admin');

    let query, params;
    if (isAdmin) {
      query = 'DELETE FROM leave_requests WHERE id = $1 RETURNING *';
      params = [id];
    } else {
      query = 'DELETE FROM leave_requests WHERE id = $1 AND staff_id = $2 RETURNING *';
      params = [id, req.user.id];
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Leave request not found or access denied' }
      });
    }

    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Check if staff is on leave for a specific date
router.get('/check-availability', authenticateToken, async (req, res, next) => {
  try {
    const { staffId, date } = req.query;

    if (!staffId || !date) {
      return res.status(400).json({
        error: { message: 'staffId and date are required' }
      });
    }

    const result = await db.query(
      `SELECT EXISTS (
        SELECT 1 FROM leave_requests
        WHERE staff_id = $1
          AND status = 'approved'
          AND $2::date BETWEEN start_date AND end_date
      ) as on_leave`,
      [staffId, date]
    );

    res.json({
      staffId,
      date,
      onLeave: result.rows[0].on_leave,
      available: !result.rows[0].on_leave
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
