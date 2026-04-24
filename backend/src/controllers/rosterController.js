const db = require('../config/database');

/**
 * Roster Controller
 * Handles all business logic for rostering, job management, and resource assignments
 */

/**
 * Get jobs for a date range (rostering board)
 * GET /roster/jobs
 */
exports.getJobs = async (req, res, next) => {
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
        updatedAt: row.updated_at,
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available staff for a time slot
 * GET /roster/available-staff
 */
exports.getAvailableStaff = async (req, res, next) => {
  try {
    const { startTime, endTime, roles } = req.query;

    let query = `
      SELECT DISTINCT
        u.id,
        u.name,
        u.phone_number,
        sp.roles,
        sp.photo_url,
        sp.qualifications,
        sp.availability_status
      FROM users u
      INNER JOIN staff_profiles sp ON u.id = sp.user_id
      WHERE u.deleted_at IS NULL
        AND sp.deleted_at IS NULL
        AND sp.employment_status = 'active'
    `;

    const params = [];
    let paramCount = 1;

    if (roles) {
      const rolesArray = Array.isArray(roles) ? roles : [roles];
      query += ` AND sp.roles && $${paramCount}::text[]`;
      params.push(rolesArray);
      paramCount++;
    }

    if (startTime && endTime) {
      query += `
        AND u.id NOT IN (
          SELECT DISTINCT jsa.staff_id
          FROM job_staff_assignments jsa
          INNER JOIN jobs j ON jsa.job_id = j.id
          WHERE j.deleted_at IS NULL
            AND (
              (j.start_time, j.end_time) OVERLAPS ($${paramCount}::timestamp, $${paramCount + 1}::timestamp)
            )
        )
      `;
      params.push(startTime, endTime);
      paramCount += 2;

      query += `
        AND u.id NOT IN (
          SELECT staff_id
          FROM leave
          WHERE status = 'approved'
            AND (start_date, end_date) OVERLAPS ($${paramCount}::date, $${paramCount + 1}::date)
        )
      `;
      params.push(startTime, endTime);
    }

    query += ` ORDER BY u.name ASC`;

    const result = await db.query(query, params);

    res.json({
      staff: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        phoneNumber: row.phone_number,
        roles: row.roles,
        photoUrl: row.photo_url,
        qualifications: row.qualifications,
        availabilityStatus: row.availability_status,
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign staff to a job
 * POST /roster/jobs/:jobId/assign-staff
 */
exports.assignStaff = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { staffId, role, isPrimary } = req.body;

    if (!staffId || !role) {
      return res.status(400).json({
        error: { message: 'Staff ID and role are required' }
      });
    }

    // Check if job exists
    const jobCheck = await db.query(
      'SELECT id, start_time, end_time FROM jobs WHERE id = $1 AND deleted_at IS NULL',
      [jobId]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Job not found' } });
    }

    const job = jobCheck.rows[0];

    // Check if staff member exists and is available
    const staffCheck = await db.query(
      `SELECT u.id, u.name
       FROM users u
       INNER JOIN staff_profiles sp ON u.id = sp.user_id
       WHERE u.id = $1
         AND u.deleted_at IS NULL
         AND sp.deleted_at IS NULL
         AND sp.employment_status = 'active'`,
      [staffId]
    );

    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Staff member not found or inactive' } });
    }

    // Check for conflicts
    const conflictCheck = await db.query(
      `SELECT j.id, j.title, j.start_time, j.end_time
       FROM job_staff_assignments jsa
       INNER JOIN jobs j ON jsa.job_id = j.id
       WHERE jsa.staff_id = $1
         AND j.deleted_at IS NULL
         AND (j.start_time, j.end_time) OVERLAPS ($2::timestamp, $3::timestamp)
         AND j.id != $4`,
      [staffId, job.start_time, job.end_time, jobId]
    );

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({
        error: {
          message: 'Staff member has a conflicting assignment',
          conflict: conflictCheck.rows[0]
        }
      });
    }

    // If this is primary, unset any existing primary assignments for this role
    if (isPrimary) {
      await db.query(
        `UPDATE job_staff_assignments
         SET is_primary = false
         WHERE job_id = $1 AND role = $2`,
        [jobId, role]
      );
    }

    // Assign staff to job
    const result = await db.query(
      `INSERT INTO job_staff_assignments (job_id, staff_id, role, is_primary)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (job_id, staff_id, role)
       DO UPDATE SET is_primary = $4, updated_at = NOW()
       RETURNING *`,
      [jobId, staffId, role, isPrimary || false]
    );

    // Create notification for staff member
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        staffId,
        'New Job Assignment',
        `You have been assigned to a job as ${role}`,
        'job_assignment',
        'job',
        jobId
      ]
    );

    res.json({
      success: true,
      message: 'Staff assigned successfully',
      assignment: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unassign staff from a job
 * DELETE /roster/jobs/:jobId/unassign-staff
 */
exports.unassignStaff = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { staffId, role } = req.body;

    const result = await db.query(
      'DELETE FROM job_staff_assignments WHERE job_id = $1 AND staff_id = $2 AND role = $3 RETURNING *',
      [jobId, staffId, role]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Assignment not found' } });
    }

    res.json({
      success: true,
      message: 'Staff unassigned successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign vehicle to a job
 * POST /roster/jobs/:jobId/assign-vehicle
 */
exports.assignVehicle = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { vehicleId, isPrimary } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ error: { message: 'Vehicle ID is required' } });
    }

    // Check if job exists
    const jobCheck = await db.query(
      'SELECT id, start_time, end_time FROM jobs WHERE id = $1 AND deleted_at IS NULL',
      [jobId]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Job not found' } });
    }

    const job = jobCheck.rows[0];

    // Check if vehicle exists and is available
    const vehicleCheck = await db.query(
      'SELECT id, registration, status FROM vehicles WHERE id = $1 AND deleted_at IS NULL',
      [vehicleId]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Vehicle not found' } });
    }

    if (vehicleCheck.rows[0].status !== 'available') {
      return res.status(400).json({ error: { message: 'Vehicle is not available' } });
    }

    // Check for conflicts
    const conflictCheck = await db.query(
      `SELECT j.id, j.title, j.start_time, j.end_time
       FROM job_vehicle_assignments jva
       INNER JOIN jobs j ON jva.job_id = j.id
       WHERE jva.vehicle_id = $1
         AND j.deleted_at IS NULL
         AND (j.start_time, j.end_time) OVERLAPS ($2::timestamp, $3::timestamp)
         AND j.id != $4`,
      [vehicleId, job.start_time, job.end_time, jobId]
    );

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({
        error: {
          message: 'Vehicle has a conflicting assignment',
          conflict: conflictCheck.rows[0]
        }
      });
    }

    // If this is primary, unset any existing primary vehicle assignments
    if (isPrimary) {
      await db.query(
        'UPDATE job_vehicle_assignments SET is_primary = false WHERE job_id = $1',
        [jobId]
      );
    }

    // Assign vehicle to job
    const result = await db.query(
      `INSERT INTO job_vehicle_assignments (job_id, vehicle_id, is_primary)
       VALUES ($1, $2, $3)
       ON CONFLICT (job_id, vehicle_id)
       DO UPDATE SET is_primary = $3, updated_at = NOW()
       RETURNING *`,
      [jobId, vehicleId, isPrimary || false]
    );

    res.json({
      success: true,
      message: 'Vehicle assigned successfully',
      assignment: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unassign vehicle from a job
 * DELETE /roster/jobs/:jobId/unassign-vehicle
 */
exports.unassignVehicle = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { vehicleId } = req.body;

    const result = await db.query(
      'DELETE FROM job_vehicle_assignments WHERE job_id = $1 AND vehicle_id = $2 RETURNING *',
      [jobId, vehicleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Assignment not found' } });
    }

    res.json({
      success: true,
      message: 'Vehicle unassigned successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign equipment to a job
 * POST /roster/jobs/:jobId/assign-equipment
 */
exports.assignEquipment = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { equipmentId } = req.body;

    if (!equipmentId) {
      return res.status(400).json({ error: { message: 'Equipment ID is required' } });
    }

    // Check if job and equipment exist
    const [jobCheck, equipmentCheck] = await Promise.all([
      db.query('SELECT id FROM jobs WHERE id = $1 AND deleted_at IS NULL', [jobId]),
      db.query('SELECT id, status FROM equipment WHERE id = $1 AND deleted_at IS NULL', [equipmentId])
    ]);

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Job not found' } });
    }

    if (equipmentCheck.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Equipment not found' } });
    }

    if (equipmentCheck.rows[0].status !== 'available') {
      return res.status(400).json({ error: { message: 'Equipment is not available' } });
    }

    // Assign equipment to job
    const result = await db.query(
      `INSERT INTO job_equipment_assignments (job_id, equipment_id)
       VALUES ($1, $2)
       ON CONFLICT (job_id, equipment_id) DO NOTHING
       RETURNING *`,
      [jobId, equipmentId]
    );

    res.json({
      success: true,
      message: 'Equipment assigned successfully',
      assignment: result.rows.length > 0 ? result.rows[0] : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unassign equipment from a job
 * DELETE /roster/jobs/:jobId/unassign-equipment
 */
exports.unassignEquipment = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { equipmentId } = req.body;

    const result = await db.query(
      'DELETE FROM job_equipment_assignments WHERE job_id = $1 AND equipment_id = $2 RETURNING *',
      [jobId, equipmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Assignment not found' } });
    }

    res.json({
      success: true,
      message: 'Equipment unassigned successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get job types
 * GET /roster/job-types
 */
exports.getJobTypes = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM job_types ORDER BY name ASC'
    );

    res.json({ jobTypes: result.rows });
  } catch (error) {
    next(error);
  }
};
