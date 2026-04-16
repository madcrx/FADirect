const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get overview statistics
router.get('/overview', authenticateToken, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    let dateFilter = '';
    const params = [];
    if (startDate && endDate) {
      dateFilter = 'AND created_at BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    // Get arrangement statistics
    const arrangementsQuery = `
      SELECT
        COUNT(*) as total_arrangements,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_arrangements,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_arrangements,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_arrangements,
        COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_arrangements
      FROM arrangements
      WHERE 1=1 ${dateFilter}
    `;

    const arrangementsResult = await db.query(arrangementsQuery, params);

    // Get invoice statistics
    const invoicesQuery = `
      SELECT
        COUNT(*) as total_invoices,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_invoice_amount,
        COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_invoices,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue_invoices,
        SUM(total_amount) FILTER (WHERE status = 'paid') as paid_amount,
        SUM(total_amount) FILTER (WHERE status = 'pending') as pending_amount
      FROM invoices
      WHERE deleted_at IS NULL ${dateFilter}
    `;

    const invoicesResult = await db.query(invoicesQuery, params);

    // Get user statistics
    const usersQuery = `
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
        COUNT(*) FILTER (WHERE role = 'staff') as staff_users,
        COUNT(*) FILTER (WHERE role = 'viewer') as viewer_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users
      FROM users
      WHERE deleted_at IS NULL
    `;

    const usersResult = await db.query(usersQuery);

    // Get document and photo counts
    const filesQuery = `
      SELECT
        (SELECT COUNT(*) FROM documents WHERE deleted_at IS NULL ${dateFilter}) as total_documents,
        (SELECT COUNT(*) FROM photos WHERE deleted_at IS NULL ${dateFilter}) as total_photos,
        (SELECT SUM(file_size) FROM documents WHERE deleted_at IS NULL) as documents_storage,
        (SELECT SUM(file_size) FROM photos WHERE deleted_at IS NULL) as photos_storage
    `;

    const filesResult = await db.query(filesQuery, params);

    res.json({
      arrangements: arrangementsResult.rows[0],
      invoices: invoicesResult.rows[0],
      users: usersResult.rows[0],
      files: filesResult.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Get arrangement trends over time
router.get('/trends/arrangements', authenticateToken, async (req, res, next) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year

    let dateFormat;
    switch (period) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'IYYY-IW';
        break;
      case 'year':
        dateFormat = 'YYYY';
        break;
      case 'month':
      default:
        dateFormat = 'YYYY-MM';
    }

    const query = `
      SELECT
        TO_CHAR(created_at, $1) as period,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count
      FROM arrangements
      WHERE created_at >= NOW() - INTERVAL '12 months'
        AND deleted_at IS NULL
      GROUP BY TO_CHAR(created_at, $1)
      ORDER BY period ASC
    `;

    const result = await db.query(query, [dateFormat]);

    res.json({
      period,
      data: result.rows.map(row => ({
        period: row.period,
        count: parseInt(row.count),
        completedCount: parseInt(row.completed_count),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get revenue trends over time
router.get('/trends/revenue', authenticateToken, async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    let dateFormat;
    switch (period) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'IYYY-IW';
        break;
      case 'year':
        dateFormat = 'YYYY';
        break;
      case 'month':
      default:
        dateFormat = 'YYYY-MM';
    }

    const query = `
      SELECT
        TO_CHAR(created_at, $1) as period,
        SUM(total_amount) as revenue,
        COUNT(*) as invoice_count,
        AVG(total_amount) as average_amount
      FROM invoices
      WHERE created_at >= NOW() - INTERVAL '12 months'
        AND deleted_at IS NULL
      GROUP BY TO_CHAR(created_at, $1)
      ORDER BY period ASC
    `;

    const result = await db.query(query, [dateFormat]);

    res.json({
      period,
      data: result.rows.map(row => ({
        period: row.period,
        revenue: parseFloat(row.revenue || 0),
        invoiceCount: parseInt(row.invoice_count),
        averageAmount: parseFloat(row.average_amount || 0),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get top services by revenue
router.get('/top-services', authenticateToken, async (req, res, next) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [limit];
    let paramCount = 2;

    if (startDate && endDate) {
      dateFilter = 'AND i.created_at BETWEEN $2 AND $3';
      params.push(startDate, endDate);
      paramCount = 4;
    }

    const query = `
      SELECT
        il.description,
        SUM(il.quantity) as total_quantity,
        SUM(il.total_price) as total_revenue,
        COUNT(DISTINCT i.id) as invoice_count
      FROM invoice_line_items il
      JOIN invoices i ON il.invoice_id = i.id
      WHERE i.deleted_at IS NULL ${dateFilter}
      GROUP BY il.description
      ORDER BY total_revenue DESC
      LIMIT $1
    `;

    const result = await db.query(query, params);

    res.json({
      services: result.rows.map(row => ({
        description: row.description,
        totalQuantity: parseInt(row.total_quantity),
        totalRevenue: parseFloat(row.total_revenue),
        invoiceCount: parseInt(row.invoice_count),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get user activity statistics
router.get('/user-activity', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const query = `
      SELECT
        u.id,
        u.full_name,
        u.role,
        COUNT(DISTINCT a.id) as arrangements_count,
        COUNT(DISTINCT al.id) as audit_log_count,
        MAX(al.created_at) as last_activity
      FROM users u
      LEFT JOIN arrangements a ON a.created_by = u.id
      LEFT JOIN audit_logs al ON al.user_id = u.id
      WHERE u.deleted_at IS NULL
      GROUP BY u.id, u.full_name, u.role
      ORDER BY audit_log_count DESC
    `;

    const result = await db.query(query);

    res.json({
      users: result.rows.map(row => ({
        id: row.id,
        fullName: row.full_name,
        role: row.role,
        arrangementsCount: parseInt(row.arrangements_count || 0),
        auditLogCount: parseInt(row.audit_log_count || 0),
        lastActivity: row.last_activity,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get payment status breakdown
router.get('/payment-status', authenticateToken, async (req, res, next) => {
  try {
    const query = `
      SELECT
        status,
        COUNT(*) as count,
        SUM(total_amount) as total_amount
      FROM invoices
      WHERE deleted_at IS NULL
      GROUP BY status
      ORDER BY count DESC
    `;

    const result = await db.query(query);

    res.json({
      paymentStatus: result.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count),
        totalAmount: parseFloat(row.total_amount),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get arrangement status breakdown
router.get('/arrangement-status', authenticateToken, async (req, res, next) => {
  try {
    const query = `
      SELECT
        status,
        COUNT(*) as count
      FROM arrangements
      WHERE deleted_at IS NULL
      GROUP BY status
      ORDER BY count DESC
    `;

    const result = await db.query(query);

    res.json({
      arrangementStatus: result.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get average completion time for arrangements
router.get('/completion-time', authenticateToken, async (req, res, next) => {
  try {
    const query = `
      SELECT
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/86400) as avg_days,
        MIN(EXTRACT(EPOCH FROM (completed_at - created_at))/86400) as min_days,
        MAX(EXTRACT(EPOCH FROM (completed_at - created_at))/86400) as max_days,
        COUNT(*) as completed_count
      FROM arrangements
      WHERE status = 'completed'
        AND completed_at IS NOT NULL
        AND deleted_at IS NULL
    `;

    const result = await db.query(query);

    res.json({
      averageDays: parseFloat(result.rows[0].avg_days || 0).toFixed(2),
      minDays: parseFloat(result.rows[0].min_days || 0).toFixed(2),
      maxDays: parseFloat(result.rows[0].max_days || 0).toFixed(2),
      completedCount: parseInt(result.rows[0].completed_count || 0),
    });
  } catch (error) {
    next(error);
  }
});

// Get monthly comparison (current vs previous period)
router.get('/monthly-comparison', authenticateToken, async (req, res, next) => {
  try {
    const query = `
      WITH current_month AS (
        SELECT
          COUNT(*) as arrangements,
          COALESCE(SUM(i.total_amount), 0) as revenue
        FROM arrangements a
        LEFT JOIN invoices i ON i.arrangement_id = a.id
        WHERE DATE_TRUNC('month', a.created_at) = DATE_TRUNC('month', CURRENT_DATE)
          AND a.deleted_at IS NULL
      ),
      previous_month AS (
        SELECT
          COUNT(*) as arrangements,
          COALESCE(SUM(i.total_amount), 0) as revenue
        FROM arrangements a
        LEFT JOIN invoices i ON i.arrangement_id = a.id
        WHERE DATE_TRUNC('month', a.created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
          AND a.deleted_at IS NULL
      )
      SELECT
        cm.arrangements as current_arrangements,
        cm.revenue as current_revenue,
        pm.arrangements as previous_arrangements,
        pm.revenue as previous_revenue,
        CASE
          WHEN pm.arrangements > 0
          THEN ((cm.arrangements - pm.arrangements)::FLOAT / pm.arrangements * 100)
          ELSE 0
        END as arrangements_change_percent,
        CASE
          WHEN pm.revenue > 0
          THEN ((cm.revenue - pm.revenue) / pm.revenue * 100)
          ELSE 0
        END as revenue_change_percent
      FROM current_month cm, previous_month pm
    `;

    const result = await db.query(query);

    res.json({
      currentMonth: {
        arrangements: parseInt(result.rows[0].current_arrangements),
        revenue: parseFloat(result.rows[0].current_revenue),
      },
      previousMonth: {
        arrangements: parseInt(result.rows[0].previous_arrangements),
        revenue: parseFloat(result.rows[0].previous_revenue),
      },
      change: {
        arrangementsPercent: parseFloat(result.rows[0].arrangements_change_percent).toFixed(2),
        revenuePercent: parseFloat(result.rows[0].revenue_change_percent).toFixed(2),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
