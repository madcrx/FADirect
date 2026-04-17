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
          funeralType: arrangement.funeral_type || 'burial',
          status: arrangement.status,
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
    const result = await db.query('SELECT * FROM arrangements WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Arrangement not found' } });
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
        funeralType: arrangement.funeral_type || 'burial',
        status: arrangement.status,
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
    const { deceasedName, deceasedDateOfBirth, deceasedDateOfDeath, serviceDate, serviceLocation, notes, funeralType, mournerId } = req.body;

    const result = await db.query(
      `INSERT INTO arrangements (deceased_name, deceased_date_of_birth, deceased_date_of_death, arranger_id, mourner_id, funeral_type, service_date, service_location, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft') RETURNING *`,
      [deceasedName, deceasedDateOfBirth, deceasedDateOfDeath, req.user.id, mournerId, funeralType || 'burial', serviceDate, serviceLocation, notes]
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
        funeralType: arrangement.funeral_type,
        status: arrangement.status,
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
    const { deceasedName, serviceDate, serviceLocation, notes, status, funeralType, currentStepIndex } = req.body;
    const result = await db.query(
      `UPDATE arrangements
       SET deceased_name = COALESCE($1, deceased_name),
           service_date = COALESCE($2, service_date),
           service_location = COALESCE($3, service_location),
           notes = COALESCE($4, notes),
           status = COALESCE($5, status),
           funeral_type = COALESCE($6, funeral_type),
           current_step_index = COALESCE($7, current_step_index)
       WHERE id = $8 AND arranger_id = $9
       RETURNING *`,
      [deceasedName, serviceDate, serviceLocation, notes, status, funeralType, currentStepIndex, req.params.id, req.user.id]
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
        funeralType: arrangement.funeral_type,
        status: arrangement.status,
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

module.exports = router;
