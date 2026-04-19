const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get jobs for a date range (rostering board)
router.get('/jobs', authenticateToken, async (req, res, next) => {
  try {
    const { startDate, endDate, status, includeDeleted } = req.query;

    let query = `
      SELECT
        j.*,
        jt.name as job_type_name,
        jt.color as job_type_color,
        a.deceased_name,
        json_agg(DISTINCT jsonb_build_object(
          'id', u.id,
          'fullName', u.name,
          'role', jsa.role,
          'isPrimary', jsa.is_primary
        )) FILTER (WHERE u.id IS NOT NULL) as staff,
        json_agg(DISTINCT jsonb_build_object(
          'id', v.id,
          'registration', v.registration,
          'type', v.vehicle_type,
          'make', v.make,
          'model', v.model
        )) FILTER (WHERE v.id IS NOT NULL) as vehicles,
        json_agg(DISTINCT jsonb_build_object(
          'id', e.id,
          'name', e.name,
          'equipmentType', e.equipment_type,
          'serialNumber', e.serial_number
        )) FILTER (WHERE e.id IS NOT NULL) as equipment
      FROM jobs j
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN arrangements a ON j.arrangement_id = a.id
      LEFT JOIN job_staff_assignments jsa ON j.id = jsa.job_id
      LEFT JOIN users u ON jsa.staff_id = u.id
      LEFT JOIN job_vehicle_assignments jva ON j.id = jva.job_id
      LEFT JOIN vehicles v ON jva.vehicle_id = v.id
      LEFT JOIN job_equipment_assignments jea ON j.id = jea.job_id
      LEFT JOIN equipment e ON jea.equipment_id = e.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Filter by deleted status
    if (includeDeleted === 'only') {
      query += ` AND j.deleted_at IS NOT NULL`;
    } else if (includeDeleted !== 'all') {
      query += ` AND j.deleted_at IS NULL`;
    }

    if (startDate && endDate) {
      query += ` AND DATE(j.start_time) BETWEEN $${paramCount}::date AND $${paramCount + 1}::date`;
      params.push(startDate, endDate);
      paramCount += 2;
    }

    if (status) {
      query += ` AND j.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += `
      GROUP BY j.id, jt.name, jt.color, a.deceased_name
      ORDER BY j.start_time ASC
    `;

    const result = await db.query(query, params);

    res.json({
      jobs: result.rows.map(row => ({
        id: row.id,
        jobTypeId: row.job_type_id,
        jobTypeName: row.job_type_name,
        jobTypeColor: row.job_type_color,
        arrangementId: row.arrangement_id,
        deceasedName: row.deceased_name,
        title: row.title,
        description: row.description,
        location: row.location,
        startTime: row.start_time,
        endTime: row.end_time,
        status: row.status,
        priority: row.priority,
        notes: row.notes,
        specialInstructions: row.special_instructions,
        allDay: row.all_day,
        attendees: row.attendees,
        reminderMinutes: row.reminder_minutes,
        color: row.color,
        requirements: row.requirements,
        staff: row.staff || [],
        vehicles: row.vehicles || [],
        equipment: row.equipment || [],
        createdAt: row.created_at,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Create job
router.post('/jobs',
  authenticateToken,
  [
    body('jobTypeId').isUUID().withMessage('Valid job type ID required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('startTime').isISO8601().withMessage('Valid start time required'),
    body('endTime').isISO8601().withMessage('Valid end time required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const {
      jobTypeId,
      arrangementId,
      title,
      description,
      location,
      startTime,
      endTime,
      priority,
      notes,
      specialInstructions,
      requirements,
      allDay,
      attendees,
      reminderMinutes,
      color,
      staffIds,
      vehicleIds,
      equipmentIds,
    } = req.body;

    try {
      // Create job
      const jobResult = await db.query(`
        INSERT INTO jobs (
          job_type_id,
          arrangement_id,
          title,
          description,
          location,
          start_time,
          end_time,
          priority,
          notes,
          special_instructions,
          requirements,
          all_day,
          attendees,
          reminder_minutes,
          color,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `, [
        jobTypeId,
        arrangementId || null,
        title,
        description || null,
        location || null,
        startTime,
        endTime,
        priority || 'normal',
        notes || null,
        specialInstructions || null,
        requirements ? JSON.stringify(requirements) : '{}',
        allDay || false,
        attendees ? JSON.stringify(attendees) : null,
        reminderMinutes || null,
        color || null,
        req.user.id,
      ]);

      const job = jobResult.rows[0];

      // Assign staff
      if (staffIds && staffIds.length > 0) {
        for (const staffId of staffIds) {
          await db.query(`
            INSERT INTO job_staff_assignments (job_id, staff_id, is_primary)
            VALUES ($1, $2, $3)
          `, [job.id, staffId, staffId === staffIds[0]]);
        }
      }

      // Assign vehicles
      if (vehicleIds && vehicleIds.length > 0) {
        for (const vehicleId of vehicleIds) {
          await db.query(`
            INSERT INTO job_vehicle_assignments (job_id, vehicle_id)
            VALUES ($1, $2)
          `, [job.id, vehicleId]);
        }
      }

      // Assign equipment
      if (equipmentIds && equipmentIds.length > 0) {
        for (const equipmentId of equipmentIds) {
          await db.query(`
            INSERT INTO job_equipment_assignments (job_id, equipment_id)
            VALUES ($1, $2)
          `, [job.id, equipmentId]);
        }
      }

      res.status(201).json({
        message: 'Job created successfully',
        job: {
          id: job.id,
          title: job.title,
          startTime: job.start_time,
          endTime: job.end_time,
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update job
router.put('/jobs/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      location,
      startTime,
      endTime,
      status,
      priority,
      notes,
      specialInstructions,
      allDay,
      attendees,
      reminderMinutes,
      color,
      staffIds,
      vehicleIds,
    } = req.body;

    // Update job
    await db.query(`
      UPDATE jobs SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        location = COALESCE($3, location),
        start_time = COALESCE($4, start_time),
        end_time = COALESCE($5, end_time),
        status = COALESCE($6, status),
        priority = COALESCE($7, priority),
        notes = COALESCE($8, notes),
        special_instructions = COALESCE($9, special_instructions),
        all_day = COALESCE($10, all_day),
        attendees = COALESCE($11, attendees),
        reminder_minutes = COALESCE($12, reminder_minutes),
        color = COALESCE($13, color),
        updated_at = NOW()
      WHERE id = $14 AND deleted_at IS NULL
    `, [
      title,
      description,
      location,
      startTime,
      endTime,
      status,
      priority,
      notes,
      specialInstructions,
      allDay,
      attendees ? JSON.stringify(attendees) : null,
      reminderMinutes,
      color,
      id,
    ]);

    // Update staff assignments if provided
    if (staffIds) {
      await db.query('DELETE FROM job_staff_assignments WHERE job_id = $1', [id]);
      for (const staffId of staffIds) {
        await db.query(`
          INSERT INTO job_staff_assignments (job_id, staff_id, is_primary)
          VALUES ($1, $2, $3)
        `, [id, staffId, staffId === staffIds[0]]);
      }
    }

    // Update vehicle assignments if provided
    if (vehicleIds) {
      await db.query('DELETE FROM job_vehicle_assignments WHERE job_id = $1', [id]);
      for (const vehicleId of vehicleIds) {
        await db.query(`
          INSERT INTO job_vehicle_assignments (job_id, vehicle_id)
          VALUES ($1, $2)
        `, [id, vehicleId]);
      }
    }

    res.json({ message: 'Job updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete job
router.delete('/jobs/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    await db.query(`
      UPDATE jobs SET deleted_at = NOW()
      WHERE id = $1
    `, [id]);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get job types
router.get('/job-types', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT * FROM job_types
      WHERE is_active = true
      ORDER BY name ASC
    `);

    res.json({
      jobTypes: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        color: row.color,
        icon: row.icon,
        defaultDuration: row.default_duration,
        requiresVehicle: row.requires_vehicle,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Check staff availability
router.post('/check-availability/staff', authenticateToken, async (req, res, next) => {
  try {
    const { staffId, startTime, endTime, excludeJobId } = req.body;

    const result = await db.query(`
      SELECT check_staff_availability($1, $2, $3, $4) as available
    `, [staffId, startTime, endTime, excludeJobId || null]);

    res.json({ available: result.rows[0].available });
  } catch (error) {
    next(error);
  }
});

// Check vehicle availability
router.post('/check-availability/vehicle', authenticateToken, async (req, res, next) => {
  try {
    const { vehicleId, startTime, endTime, excludeJobId } = req.body;

    const result = await db.query(`
      SELECT check_vehicle_availability($1, $2, $3, $4) as available
    `, [vehicleId, startTime, endTime, excludeJobId || null]);

    res.json({ available: result.rows[0].available });
  } catch (error) {
    next(error);
  }
});

// Generate run sheet
router.post('/run-sheet',
  authenticateToken,
  [
    body('date').isDate().withMessage('Valid date required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const { date, title, recipients } = req.body;

    try {
      // Get all jobs for the date
      const jobs = await db.query(`
        SELECT
          j.*,
          jt.name as job_type_name,
          jt.color as job_type_color,
          a.deceased_name,
          json_agg(DISTINCT jsonb_build_object(
            'fullName', u.full_name,
            'role', jsa.role,
            'phone', u.phone_number
          )) FILTER (WHERE u.id IS NOT NULL) as staff,
          json_agg(DISTINCT jsonb_build_object(
            'registration', v.registration,
            'type', v.vehicle_type
          )) FILTER (WHERE v.id IS NOT NULL) as vehicles
        FROM jobs j
        LEFT JOIN job_types jt ON j.job_type_id = jt.id
        LEFT JOIN arrangements a ON j.arrangement_id = a.id
        LEFT JOIN job_staff_assignments jsa ON j.id = jsa.job_id
        LEFT JOIN users u ON jsa.staff_id = u.id
        LEFT JOIN job_vehicle_assignments jva ON j.id = jva.job_id
        LEFT JOIN vehicles v ON jva.vehicle_id = v.id
        WHERE DATE(j.start_time) = $1
          AND j.deleted_at IS NULL
          AND j.status NOT IN ('cancelled')
        GROUP BY j.id, jt.name, jt.color, a.deceased_name
        ORDER BY j.start_time ASC
      `, [date]);

      // Create run sheet record
      const runSheetResult = await db.query(`
        INSERT INTO run_sheets (date, title, generated_by, recipients)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [date, title || `Run Sheet - ${date}`, req.user.id, recipients || []]);

      res.json({
        message: 'Run sheet generated successfully',
        runSheet: {
          id: runSheetResult.rows[0].id,
          date: runSheetResult.rows[0].date,
          title: runSheetResult.rows[0].title,
        },
        jobs: jobs.rows
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get available staff for rostering (filtered by role and leave status)
router.get('/available-staff', authenticateToken, async (req, res, next) => {
  try {
    const { date, role } = req.query;

    if (!date) {
      return res.status(400).json({
        error: { message: 'Date parameter is required' }
      });
    }

    let query = `
      SELECT
        u.id,
        u.name,
        u.role,
        u.phone_number,
        sp.position,
        sp.photo_url,
        sp.is_available,
        CASE WHEN EXISTS (
          SELECT 1 FROM leave_requests lr
          WHERE lr.staff_id = u.id
            AND lr.status = 'approved'
            AND $1::date BETWEEN lr.start_date AND lr.end_date
        ) THEN true ELSE false END as on_leave
      FROM users u
      LEFT JOIN staff_profiles sp ON sp.user_id = u.id
      WHERE u.role != ARRAY['mourner']::TEXT[]
        AND sp.is_available = true
    `;

    const params = [date];

    // Filter by role if specified
    if (role) {
      query += ` AND $2 = ANY(u.role)`;
      params.push(role);
    }

    query += ` ORDER BY u.name ASC`;

    const result = await db.query(query, params);

    res.json({
      date,
      staff: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        roles: row.role,
        phoneNumber: row.phone_number,
        position: row.position,
        photoUrl: row.photo_url,
        available: row.is_available && !row.on_leave,
        onLeave: row.on_leave,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Assign staff to job
router.post('/jobs/:jobId/assign-staff', authenticateToken, async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { staffId, role, isPrimary } = req.body;

    if (!staffId) {
      return res.status(400).json({ error: { message: 'Staff ID is required' } });
    }

    // Check if assignment already exists for this specific role
    const existing = await db.query(
      'SELECT id FROM job_staff_assignments WHERE job_id = $1 AND staff_id = $2 AND role = $3',
      [jobId, staffId, role || null]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: { message: 'Staff member already assigned to this job with this role' } });
    }

    // Create assignment
    await db.query(
      'INSERT INTO job_staff_assignments (job_id, staff_id, role, is_primary) VALUES ($1, $2, $3, $4)',
      [jobId, staffId, role || null, isPrimary || false]
    );

    res.json({ message: 'Staff assigned successfully' });
  } catch (error) {
    next(error);
  }
});

// Assign vehicle to job
router.post('/jobs/:jobId/assign-vehicle', authenticateToken, async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { vehicleId, isPrimary } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ error: { message: 'Vehicle ID is required' } });
    }

    // Check if assignment already exists
    const existing = await db.query(
      'SELECT id FROM job_vehicle_assignments WHERE job_id = $1 AND vehicle_id = $2',
      [jobId, vehicleId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: { message: 'Vehicle already assigned to this job' } });
    }

    // Create assignment
    await db.query(
      'INSERT INTO job_vehicle_assignments (job_id, vehicle_id, is_primary) VALUES ($1, $2, $3)',
      [jobId, vehicleId, isPrimary || false]
    );

    res.json({ message: 'Vehicle assigned successfully' });
  } catch (error) {
    next(error);
  }
});

// Assign equipment to job
router.post('/jobs/:jobId/assign-equipment', authenticateToken, async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { equipmentId } = req.body;

    if (!equipmentId) {
      return res.status(400).json({ error: { message: 'Equipment ID is required' } });
    }

    // Check if assignment already exists
    const existing = await db.query(
      'SELECT id FROM job_equipment_assignments WHERE job_id = $1 AND equipment_id = $2',
      [jobId, equipmentId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: { message: 'Equipment already assigned to this job' } });
    }

    // Create assignment
    await db.query(
      'INSERT INTO job_equipment_assignments (job_id, equipment_id) VALUES ($1, $2)',
      [jobId, equipmentId]
    );

    res.json({ message: 'Equipment assigned successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
