const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all events (with optional date range filter)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { start, end, type, arrangementId } = req.query;

    let query = `
      SELECT ce.*, a.deceased_name, u.name as created_by_name
      FROM calendar_events ce
      LEFT JOIN arrangements a ON ce.arrangement_id = a.id
      LEFT JOIN users u ON ce.created_by = u.id
      WHERE ce.deleted_at IS NULL
    `;
    const params = [];
    let paramIndex = 1;

    if (start) {
      query += ` AND ce.start_time >= $${paramIndex}`;
      params.push(start);
      paramIndex++;
    }

    if (end) {
      query += ` AND ce.end_time <= $${paramIndex}`;
      params.push(end);
      paramIndex++;
    }

    if (type) {
      query += ` AND ce.event_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (arrangementId) {
      query += ` AND ce.arrangement_id = $${paramIndex}`;
      params.push(arrangementId);
      paramIndex++;
    }

    query += ' ORDER BY ce.start_time ASC';

    const result = await db.query(query, params);

    res.json({
      events: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        eventType: row.event_type,
        startTime: row.start_time,
        endTime: row.end_time,
        allDay: row.all_day,
        location: row.location,
        arrangementId: row.arrangement_id,
        deceasedName: row.deceased_name,
        createdBy: row.created_by,
        createdByName: row.created_by_name,
        attendees: row.attendees,
        reminderMinutes: row.reminder_minutes,
        status: row.status,
        color: row.color,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get single event
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT ce.*, a.deceased_name
       FROM calendar_events ce
       LEFT JOIN arrangements a ON ce.arrangement_id = a.id
       WHERE ce.id = $1 AND ce.deleted_at IS NULL`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Event not found' } });
    }

    const event = result.rows[0];
    res.json({
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        eventType: event.event_type,
        startTime: event.start_time,
        endTime: event.end_time,
        allDay: event.all_day,
        location: event.location,
        arrangementId: event.arrangement_id,
        deceasedName: event.deceased_name,
        createdBy: event.created_by,
        attendees: event.attendees,
        reminderMinutes: event.reminder_minutes,
        status: event.status,
        color: event.color,
        notes: event.notes,
        createdAt: event.created_at,
        updatedAt: event.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create event
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      title,
      description,
      eventType,
      startTime,
      endTime,
      allDay,
      location,
      arrangementId,
      attendees,
      reminderMinutes,
      status,
      color,
      notes,
    } = req.body;

    if (!title || !eventType || !startTime || !endTime) {
      return res.status(400).json({
        error: { message: 'Title, event type, start time, and end time are required' },
      });
    }

    const result = await db.query(
      `INSERT INTO calendar_events (
        title, description, event_type, start_time, end_time, all_day,
        location, arrangement_id, created_by, attendees, reminder_minutes,
        status, color, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        title,
        description || null,
        eventType,
        startTime,
        endTime,
        allDay || false,
        location || null,
        arrangementId || null,
        req.user.id,
        attendees ? JSON.stringify(attendees) : null,
        reminderMinutes || null,
        status || 'scheduled',
        color || null,
        notes || null,
      ]
    );

    const event = result.rows[0];
    res.status(201).json({
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        eventType: event.event_type,
        startTime: event.start_time,
        endTime: event.end_time,
        allDay: event.all_day,
        location: event.location,
        arrangementId: event.arrangement_id,
        createdBy: event.created_by,
        attendees: event.attendees,
        reminderMinutes: event.reminder_minutes,
        status: event.status,
        color: event.color,
        notes: event.notes,
        createdAt: event.created_at,
        updatedAt: event.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update event
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const {
      title,
      description,
      eventType,
      startTime,
      endTime,
      allDay,
      location,
      arrangementId,
      attendees,
      reminderMinutes,
      status,
      color,
      notes,
    } = req.body;

    const result = await db.query(
      `UPDATE calendar_events
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           event_type = COALESCE($3, event_type),
           start_time = COALESCE($4, start_time),
           end_time = COALESCE($5, end_time),
           all_day = COALESCE($6, all_day),
           location = COALESCE($7, location),
           arrangement_id = COALESCE($8, arrangement_id),
           attendees = COALESCE($9, attendees),
           reminder_minutes = COALESCE($10, reminder_minutes),
           status = COALESCE($11, status),
           color = COALESCE($12, color),
           notes = COALESCE($13, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 AND deleted_at IS NULL
       RETURNING *`,
      [
        title,
        description,
        eventType,
        startTime,
        endTime,
        allDay,
        location,
        arrangementId,
        attendees ? JSON.stringify(attendees) : null,
        reminderMinutes,
        status,
        color,
        notes,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Event not found' } });
    }

    const event = result.rows[0];
    res.json({
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        eventType: event.event_type,
        startTime: event.start_time,
        endTime: event.end_time,
        allDay: event.all_day,
        location: event.location,
        arrangementId: event.arrangement_id,
        createdBy: event.created_by,
        attendees: event.attendees,
        reminderMinutes: event.reminder_minutes,
        status: event.status,
        color: event.color,
        notes: event.notes,
        createdAt: event.created_at,
        updatedAt: event.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete event (soft delete)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    await db.query(
      'UPDATE calendar_events SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.params.id]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
