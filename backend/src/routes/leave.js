const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get leave requests (all for admin/management, own for staff)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, staffId } = req.query;
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const isManager = userRoles.includes('admin') || userRoles.includes('management');

    let query = `
      SELECT
        lr.*,
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

    query += ` ORDER BY lr.start_date DESC`;

    const result = await db.query(query, params);

    res.json({
      leaveRequests: result.rows.map(row => ({
        id: row.id,
        staffId: row.staff_id,
        staffName: row.staff_name,
        staffPhone: row.staff_phone,
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
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: { message: 'Start date and end date are required' }
      });
    }

    const result = await db.query(
      `INSERT INTO leave_requests (staff_id, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [req.user.id, startDate, endDate, reason]
    );

    res.status(201).json({
      message: 'Leave request submitted successfully',
      leaveRequest: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Approve/reject leave request (admin/management only)
router.put('/:id/status', authenticateToken, async (req, res, next) => {
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

    res.json({
      message: `Leave request ${status}`,
      leaveRequest: result.rows[0]
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
