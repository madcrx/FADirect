const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all arrangements for current user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    // Get arrangements
    const arrangementsResult = await db.query(
      `SELECT a.*, u.name as arranger_name
       FROM arrangements a
       LEFT JOIN users u ON a.arranger_id = u.id
       LEFT JOIN arrangement_participants ap ON a.id = ap.arrangement_id
       WHERE (a.arranger_id = $1 OR ap.user_id = $1)
         AND a.deleted_at IS NULL
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );

    // Get workflow steps for each arrangement
    const arrangementsWithSteps = await Promise.all(
      arrangementsResult.rows.map(async (arrangement) => {
        const stepsResult = await db.query(
          `SELECT id, title, description, step_order as "order", status, assigned_to, due_date, completed_at
           FROM workflow_steps
           WHERE arrangement_id = $1
           ORDER BY step_order ASC`,
          [arrangement.id]
        );

        return {
          id: arrangement.id,
          arrangerId: arrangement.arranger_id,
          mournerId: arrangement.mourner_id,
          deceasedName: arrangement.deceased_name,
          deceasedDateOfBirth: arrangement.deceased_date_of_birth,
          deceasedDateOfDeath: arrangement.deceased_date_of_death,
          funeralType: arrangement.funeral_type || 'burial',
          status: arrangement.status,
          jobId: arrangement.job_id,
          serviceDate: arrangement.service_date,
          serviceLocation: arrangement.service_location,
          notes: arrangement.notes,
          mournerPhone: arrangement.mourner_phone,
          mournerName: arrangement.mourner_name,
          mournerEmail: arrangement.mourner_email,
          mournerRelationship: arrangement.mourner_relationship,
          deceasedAddressLine1: arrangement.deceased_address_line1,
          deceasedAddressLine2: arrangement.deceased_address_line2,
          deceasedCity: arrangement.deceased_city,
          deceasedState: arrangement.deceased_state,
          deceasedPostcode: arrangement.deceased_postcode,
          deceasedCountry: arrangement.deceased_country,
          nextOfKinName: arrangement.next_of_kin_name,
          nextOfKinRelationship: arrangement.next_of_kin_relationship,
          nextOfKinPhone: arrangement.next_of_kin_phone,
          nextOfKinEmail: arrangement.next_of_kin_email,
          locationOfDeceased: arrangement.location_of_deceased,
          createdAt: arrangement.created_at,
          updatedAt: arrangement.updated_at,
          scheduledDate: arrangement.service_date,
          workflowSteps: stepsResult.rows,
          currentStepIndex: arrangement.current_step_index || 0,
        };
      })
    );

    res.json({ arrangements: arrangementsWithSteps });
  } catch (error) {
    next(error);
  }
});

// Get single arrangement
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    // Check if user has access to this arrangement
    const accessCheck = await db.query(
      `SELECT a.* FROM arrangements a
       LEFT JOIN arrangement_participants ap ON a.id = ap.arrangement_id
       WHERE a.id = $1
         AND (a.arranger_id = $2 OR a.mourner_id = $2 OR ap.user_id = $2)
         AND a.deleted_at IS NULL`,
      [req.params.id, req.user.id]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        error: { message: 'Access denied: You do not have permission to view this arrangement' }
      });
    }

    const arrangement = accessCheck.rows[0];

    // Get workflow steps
    const stepsResult = await db.query(
      `SELECT id, title, description, step_order as "order", status, assigned_to, due_date, completed_at
       FROM workflow_steps
       WHERE arrangement_id = $1
       ORDER BY step_order ASC`,
      [arrangement.id]
    );

    res.json({
      arrangement: {
        id: arrangement.id,
        arrangerId: arrangement.arranger_id,
        mournerId: arrangement.mourner_id,
        deceasedName: arrangement.deceased_name,
        deceasedDateOfBirth: arrangement.deceased_date_of_birth,
        deceasedDateOfDeath: arrangement.deceased_date_of_death,
        funeralType: arrangement.funeral_type || 'burial',
        status: arrangement.status,
        jobId: arrangement.job_id,
        serviceDate: arrangement.service_date,
        serviceLocation: arrangement.service_location,
        notes: arrangement.notes,
        mournerPhone: arrangement.mourner_phone,
        mournerName: arrangement.mourner_name,
        mournerEmail: arrangement.mourner_email,
        mournerRelationship: arrangement.mourner_relationship,
        deceasedAddressLine1: arrangement.deceased_address_line1,
        deceasedAddressLine2: arrangement.deceased_address_line2,
        deceasedCity: arrangement.deceased_city,
        deceasedState: arrangement.deceased_state,
        deceasedPostcode: arrangement.deceased_postcode,
        deceasedCountry: arrangement.deceased_country,
        nextOfKinName: arrangement.next_of_kin_name,
        nextOfKinRelationship: arrangement.next_of_kin_relationship,
        nextOfKinPhone: arrangement.next_of_kin_phone,
        nextOfKinEmail: arrangement.next_of_kin_email,
        locationOfDeceased: arrangement.location_of_deceased,
        createdAt: arrangement.created_at,
        updatedAt: arrangement.updated_at,
        scheduledDate: arrangement.service_date,
        workflowSteps: stepsResult.rows,
        currentStepIndex: arrangement.current_step_index || 0,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create arrangement
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      deceasedName, deceasedDateOfBirth, deceasedDateOfDeath, serviceDate, serviceLocation, notes, funeralType,
      mournerId, jobId, mournerPhone, mournerName, mournerEmail, mournerRelationship,
      deceasedAddressLine1, deceasedAddressLine2, deceasedCity, deceasedState, deceasedPostcode, deceasedCountry,
      nextOfKinName, nextOfKinRelationship, nextOfKinPhone, nextOfKinEmail,
      locationOfDeceased, arrangerId
    } = req.body;

    const result = await db.query(
      `INSERT INTO arrangements (
        deceased_name, deceased_date_of_birth, deceased_date_of_death, arranger_id, mourner_id, funeral_type, job_id,
        service_date, service_location, notes, mourner_phone, mourner_name, mourner_email, mourner_relationship,
        deceased_address_line1, deceased_address_line2, deceased_city, deceased_state, deceased_postcode, deceased_country,
        next_of_kin_name, next_of_kin_relationship, next_of_kin_phone, next_of_kin_email,
        location_of_deceased, status
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, 'draft') RETURNING *`,
      [
        deceasedName, deceasedDateOfBirth, deceasedDateOfDeath,
        arrangerId || req.user.id, mournerId, funeralType || 'burial', jobId,
        serviceDate, serviceLocation, notes, mournerPhone, mournerName, mournerEmail, mournerRelationship,
        deceasedAddressLine1, deceasedAddressLine2, deceasedCity, deceasedState, deceasedPostcode, deceasedCountry || 'Australia',
        nextOfKinName, nextOfKinRelationship, nextOfKinPhone, nextOfKinEmail,
        locationOfDeceased
      ]
    );

    const arrangement = result.rows[0];

    // Create default workflow steps
    const defaultSteps = [
      { title: 'Initial Contact', description: 'First contact with family', order: 0 },
      { title: 'Information Gathering', description: 'Collect necessary information', order: 1 },
      { title: 'Service Planning', description: 'Plan the service details', order: 2 },
      { title: 'Documentation', description: 'Complete required paperwork', order: 3 },
      { title: 'Arrangements Confirmed', description: 'Finalize all arrangements', order: 4 },
      { title: 'Service Scheduled', description: 'Schedule the service', order: 5 },
    ];

    const stepsPromises = defaultSteps.map(step =>
      db.query(
        `INSERT INTO workflow_steps (arrangement_id, title, description, step_order, status)
         VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
        [arrangement.id, step.title, step.description, step.order]
      )
    );

    const stepsResults = await Promise.all(stepsPromises);
    const workflowSteps = stepsResults.map(r => ({
      id: r.rows[0].id,
      title: r.rows[0].title,
      description: r.rows[0].description,
      order: r.rows[0].step_order,
      status: r.rows[0].status,
    }));

    res.status(201).json({
      arrangement: {
        id: arrangement.id,
        arrangerId: arrangement.arranger_id,
        mournerId: arrangement.mourner_id,
        deceasedName: arrangement.deceased_name,
        deceasedDateOfBirth: arrangement.deceased_date_of_birth,
        deceasedDateOfDeath: arrangement.deceased_date_of_death,
        funeralType: arrangement.funeral_type,
        status: arrangement.status,
        jobId: arrangement.job_id,
        serviceDate: arrangement.service_date,
        serviceLocation: arrangement.service_location,
        notes: arrangement.notes,
        mournerPhone: arrangement.mourner_phone,
        mournerName: arrangement.mourner_name,
        mournerEmail: arrangement.mourner_email,
        mournerRelationship: arrangement.mourner_relationship,
        deceasedAddressLine1: arrangement.deceased_address_line1,
        deceasedAddressLine2: arrangement.deceased_address_line2,
        deceasedCity: arrangement.deceased_city,
        deceasedState: arrangement.deceased_state,
        deceasedPostcode: arrangement.deceased_postcode,
        deceasedCountry: arrangement.deceased_country,
        nextOfKinName: arrangement.next_of_kin_name,
        nextOfKinRelationship: arrangement.next_of_kin_relationship,
        nextOfKinPhone: arrangement.next_of_kin_phone,
        nextOfKinEmail: arrangement.next_of_kin_email,
        locationOfDeceased: arrangement.location_of_deceased,
        createdAt: arrangement.created_at,
        updatedAt: arrangement.updated_at,
        scheduledDate: arrangement.service_date,
        workflowSteps,
        currentStepIndex: 0,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update arrangement
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const {
      deceasedName, serviceDate, serviceLocation, notes, status, funeralType, currentStepIndex, jobId,
      mournerPhone, mournerName, mournerEmail, mournerRelationship,
      deceasedAddressLine1, deceasedAddressLine2, deceasedCity, deceasedState, deceasedPostcode, deceasedCountry,
      nextOfKinName, nextOfKinRelationship, nextOfKinPhone, nextOfKinEmail,
      locationOfDeceased, arrangerId, deceasedDateOfBirth, deceasedDateOfDeath
    } = req.body;

    const result = await db.query(
      `UPDATE arrangements
       SET deceased_name = COALESCE($1, deceased_name),
           deceased_date_of_birth = COALESCE($2, deceased_date_of_birth),
           deceased_date_of_death = COALESCE($3, deceased_date_of_death),
           service_date = COALESCE($4, service_date),
           service_location = COALESCE($5, service_location),
           notes = COALESCE($6, notes),
           status = COALESCE($7, status),
           funeral_type = COALESCE($8, funeral_type),
           current_step_index = COALESCE($9, current_step_index),
           job_id = $10,
           mourner_phone = COALESCE($11, mourner_phone),
           mourner_name = COALESCE($12, mourner_name),
           mourner_email = COALESCE($13, mourner_email),
           mourner_relationship = COALESCE($14, mourner_relationship),
           deceased_address_line1 = COALESCE($15, deceased_address_line1),
           deceased_address_line2 = COALESCE($16, deceased_address_line2),
           deceased_city = COALESCE($17, deceased_city),
           deceased_state = COALESCE($18, deceased_state),
           deceased_postcode = COALESCE($19, deceased_postcode),
           deceased_country = COALESCE($20, deceased_country),
           next_of_kin_name = COALESCE($21, next_of_kin_name),
           next_of_kin_relationship = COALESCE($22, next_of_kin_relationship),
           next_of_kin_phone = COALESCE($23, next_of_kin_phone),
           next_of_kin_email = COALESCE($24, next_of_kin_email),
           location_of_deceased = COALESCE($25, location_of_deceased),
           arranger_id = COALESCE($26, arranger_id)
       WHERE id = $27 AND arranger_id = $28
       RETURNING *`,
      [
        deceasedName, deceasedDateOfBirth, deceasedDateOfDeath, serviceDate, serviceLocation, notes, status, funeralType, currentStepIndex, jobId,
        mournerPhone, mournerName, mournerEmail, mournerRelationship,
        deceasedAddressLine1, deceasedAddressLine2, deceasedCity, deceasedState, deceasedPostcode, deceasedCountry,
        nextOfKinName, nextOfKinRelationship, nextOfKinPhone, nextOfKinEmail,
        locationOfDeceased, arrangerId,
        req.params.id, req.user.id
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Arrangement not found or unauthorized' } });
    }

    const arrangement = result.rows[0];

    // Get workflow steps
    const stepsResult = await db.query(
      `SELECT id, title, description, step_order as "order", status, assigned_to, due_date, completed_at
       FROM workflow_steps
       WHERE arrangement_id = $1
       ORDER BY step_order ASC`,
      [arrangement.id]
    );

    res.json({
      arrangement: {
        id: arrangement.id,
        arrangerId: arrangement.arranger_id,
        mournerId: arrangement.mourner_id,
        deceasedName: arrangement.deceased_name,
        deceasedDateOfBirth: arrangement.deceased_date_of_birth,
        deceasedDateOfDeath: arrangement.deceased_date_of_death,
        funeralType: arrangement.funeral_type,
        status: arrangement.status,
        jobId: arrangement.job_id,
        serviceDate: arrangement.service_date,
        serviceLocation: arrangement.service_location,
        notes: arrangement.notes,
        mournerPhone: arrangement.mourner_phone,
        mournerName: arrangement.mourner_name,
        mournerEmail: arrangement.mourner_email,
        mournerRelationship: arrangement.mourner_relationship,
        deceasedAddressLine1: arrangement.deceased_address_line1,
        deceasedAddressLine2: arrangement.deceased_address_line2,
        deceasedCity: arrangement.deceased_city,
        deceasedState: arrangement.deceased_state,
        deceasedPostcode: arrangement.deceased_postcode,
        deceasedCountry: arrangement.deceased_country,
        nextOfKinName: arrangement.next_of_kin_name,
        nextOfKinRelationship: arrangement.next_of_kin_relationship,
        nextOfKinPhone: arrangement.next_of_kin_phone,
        nextOfKinEmail: arrangement.next_of_kin_email,
        locationOfDeceased: arrangement.location_of_deceased,
        createdAt: arrangement.created_at,
        updatedAt: arrangement.updated_at,
        scheduledDate: arrangement.service_date,
        workflowSteps: stepsResult.rows,
        currentStepIndex: arrangement.current_step_index || 0,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Soft delete arrangement (arranger or admin)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    // Check if arrangement exists
    const arrangement = await db.query(
      'SELECT arranger_id FROM arrangements WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );

    if (arrangement.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Arrangement not found' } });
    }

    // Check if user is arranger or admin
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const isAdmin = userRoles.includes('admin');
    const isArranger = arrangement.rows[0].arranger_id === req.user.id;

    if (!isAdmin && !isArranger) {
      return res.status(403).json({ error: { message: 'Only arrangers or admins can delete arrangements' } });
    }

    // Soft delete
    await db.query(
      'UPDATE arrangements SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.params.id]
    );

    res.json({ success: true, message: 'Arrangement deleted' });
  } catch (error) {
    next(error);
  }
});

// Update workflow step
router.put('/:id/workflow/:stepId', authenticateToken, async (req, res, next) => {
  try {
    const { id, stepId } = req.params;
    const { status, notes } = req.body;

    // Check if step exists for this arrangement
    const stepResult = await db.query(
      `SELECT ws.*, a.arranger_id
       FROM workflow_steps ws
       JOIN arrangements a ON ws.arrangement_id = a.id
       WHERE ws.id = $1 AND ws.arrangement_id = $2`,
      [stepId, id]
    );

    if (stepResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Workflow step not found' } });
    }

    // Update step
    const updateResult = await db.query(
      `UPDATE workflow_steps
       SET status = COALESCE($1, status),
           description = COALESCE($2, description),
           completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
       WHERE id = $3
       RETURNING *`,
      [status, notes, stepId]
    );

    res.json({
      step: {
        id: updateResult.rows[0].id,
        title: updateResult.rows[0].title,
        description: updateResult.rows[0].description,
        order: updateResult.rows[0].step_order,
        status: updateResult.rows[0].status,
        completedAt: updateResult.rows[0].completed_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create workflow step
router.post('/:id/workflow', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, order } = req.body;

    if (!title) {
      return res.status(400).json({ error: { message: 'Title is required' } });
    }

    const result = await db.query(
      `INSERT INTO workflow_steps (arrangement_id, title, description, step_order, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [id, title, description || null, order || 0]
    );

    res.status(201).json({
      step: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        description: result.rows[0].description,
        order: result.rows[0].step_order,
        status: result.rows[0].status,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get mourners with contact details for autocomplete
router.get('/lookup/mourners', authenticateToken, async (req, res, next) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT DISTINCT
        mourner_phone as phone,
        mourner_name as name,
        mourner_email as email,
        mourner_relationship as relationship
      FROM arrangements
      WHERE mourner_phone IS NOT NULL
        AND deleted_at IS NULL
    `;

    const params = [];
    if (search) {
      query += ` AND (mourner_phone ILIKE $1 OR mourner_name ILIKE $1)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY mourner_name ASC LIMIT 50`;

    const result = await db.query(query, params);

    res.json({
      mourners: result.rows.map(row => ({
        phone: row.phone,
        name: row.name,
        email: row.email,
        relationship: row.relationship,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get staff members with arranger role
router.get('/lookup/arrangers', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT u.id, u.name, u.phone_number as phone, sp.photo_url
      FROM users u
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      WHERE 'arranger' = ANY(u.role)
        AND u.deleted_at IS NULL
      ORDER BY u.name ASC
    `);

    res.json({
      arrangers: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        photoUrl: row.photo_url,
      }))
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
