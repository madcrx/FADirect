const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    // Only allow admin and arrangers
    if (req.user.role !== 'admin' && req.user.role !== 'arranger') {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    // Get total arrangements count
    const totalResult = await db.query(
      'SELECT COUNT(*) FROM arrangements WHERE deleted_at IS NULL'
    );

    // Get active arrangements
    const activeResult = await db.query(
      "SELECT COUNT(*) FROM arrangements WHERE status = 'active' AND deleted_at IS NULL"
    );

    // Get completed this month
    const completedResult = await db.query(
      `SELECT COUNT(*) FROM arrangements
       WHERE status = 'completed'
       AND deleted_at IS NULL
       AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
    );

    // Get recent arrangements
    const recentResult = await db.query(
      `SELECT a.*, u.name as arranger_name
       FROM arrangements a
       LEFT JOIN users u ON a.arranger_id = u.id
       WHERE a.deleted_at IS NULL
       ORDER BY a.created_at DESC
       LIMIT 5`
    );

    res.json({
      totalArrangements: parseInt(totalResult.rows[0].count),
      activeArrangements: parseInt(activeResult.rows[0].count),
      completedThisMonth: parseInt(completedResult.rows[0].count),
      totalRevenue: 0, // TODO: Calculate from invoices table
      pendingPayments: 0, // TODO: Calculate from invoices table
      recentArrangements: recentResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
