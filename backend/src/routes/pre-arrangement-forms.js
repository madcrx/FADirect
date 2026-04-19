const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { schemas, validators } = require('../validators');

// Send pre-arrangement form to mourner
router.post('/send', authenticateToken, validateRequest(schemas.sendForm), async (req, res, next) => {
  try {
    const { arrangementId } = req.body;

    if (!arrangementId) {
      return res.status(400).json({ error: { message: 'Arrangement ID is required' } });
    }

    // Get arrangement details
    const arrangement = await db.query(
      'SELECT id, mourner_id, mourner_name, mourner_email FROM arrangements WHERE id = $1 AND deleted_at IS NULL',
      [arrangementId]
    );

    if (arrangement.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Arrangement not found' } });
    }

    const arr = arrangement.rows[0];

    if (!arr.mourner_id) {
      return res.status(400).json({ error: { message: 'No mourner associated with this arrangement' } });
    }

    // Check if form already exists
    const existing = await db.query(
      'SELECT id FROM pre_arrangement_forms WHERE arrangement_id = $1',
      [arrangementId]
    );

    let formId;
    if (existing.rows.length > 0) {
      // Update existing form
      const result = await db.query(
        `UPDATE pre_arrangement_forms
         SET status = 'sent', sent_at = NOW(), updated_at = NOW()
         WHERE arrangement_id = $1
         RETURNING id`,
        [arrangementId]
      );
      formId = result.rows[0].id;
    } else {
      // Create new form
      const result = await db.query(
        `INSERT INTO pre_arrangement_forms (
          arrangement_id, sent_to_user_id, sent_by_user_id, status
        ) VALUES ($1, $2, $3, 'sent') RETURNING id`,
        [arrangementId, arr.mourner_id, req.user.id]
      );
      formId = result.rows[0].id;
    }

    // Create or update workflow step for Pre-Arrangement Form
    const workflowStep = await db.query(
      `SELECT id FROM workflow_steps WHERE arrangement_id = $1 AND title = 'Pre-Arrangement Form'`,
      [arrangementId]
    );

    if (workflowStep.rows.length > 0) {
      // Update existing workflow step
      await db.query(
        `UPDATE workflow_steps SET status = 'in_progress', updated_at = NOW() WHERE id = $1`,
        [workflowStep.rows[0].id]
      );
    } else {
      // Create new workflow step as the first step
      await db.query(
        `INSERT INTO workflow_steps (arrangement_id, title, description, step_order, status)
         VALUES ($1, 'Pre-Arrangement Form', 'Collect initial information from the family', -1, 'in_progress')`,
        [arrangementId]
      );
    }

    // Create notification for mourner
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        arr.mourner_id,
        'Pre-Arrangement Form',
        `Please complete the pre-arrangement form for ${arr.mourner_name || 'your loved one'}`,
        'form_sent',
        'pre_arrangement_form',
        formId
      ]
    );

    res.status(201).json({
      message: 'Pre-arrangement form sent successfully',
      formId
    });
  } catch (error) {
    next(error);
  }
});

// Get form by arrangement ID
router.get('/arrangement/:arrangementId', authenticateToken, validateRequest([validators.uuid('arrangementId')]), async (req, res, next) => {
  try {
    const { arrangementId } = req.params;

    const result = await db.query(
      `SELECT
        paf.*,
        u_to.name as sent_to_name,
        u_by.name as sent_by_name
       FROM pre_arrangement_forms paf
       LEFT JOIN users u_to ON paf.sent_to_user_id = u_to.id
       LEFT JOIN users u_by ON paf.sent_by_user_id = u_by.id
       WHERE paf.arrangement_id = $1`,
      [arrangementId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Form not found' } });
    }

    const form = result.rows[0];
    res.json({
      form: {
        id: form.id,
        arrangementId: form.arrangement_id,
        sentToUserId: form.sent_to_user_id,
        sentToName: form.sent_to_name,
        sentByUserId: form.sent_by_user_id,
        sentByName: form.sent_by_name,
        status: form.status,
        formData: form.form_data,
        sentAt: form.sent_at,
        completedAt: form.completed_at,
        notes: form.notes,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Submit/Update form data
router.put('/:id', authenticateToken, validateRequest([validators.uuid('id'), ...schemas.updateForm]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { formData, status } = req.body;

    if (!formData) {
      return res.status(400).json({ error: { message: 'Form data is required' } });
    }

    const updateFields = ['form_data = $1', 'updated_at = NOW()'];
    const params = [JSON.stringify(formData), id];

    if (status) {
      if (!['sent', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: { message: 'Invalid status' } });
      }
      updateFields.push(`status = $${params.length + 1}`);
      params.push(status);

      if (status === 'completed') {
        updateFields.push('completed_at = NOW()');
      }
    }

    const result = await db.query(
      `UPDATE pre_arrangement_forms
       SET ${updateFields.join(', ')}
       WHERE id = $2
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Form not found' } });
    }

    const form = result.rows[0];

    // If form is completed, auto-populate arrangement data
    if (status === 'completed' && formData) {
      await autoPopulateArrangement(form.arrangement_id, formData);

      // Mark workflow step as completed
      await db.query(
        `UPDATE workflow_steps
         SET status = 'completed', completed_at = NOW(), updated_at = NOW()
         WHERE arrangement_id = $1 AND title = 'Pre-Arrangement Form'`,
        [form.arrangement_id]
      );

      // Move to next workflow step (Initial Contact)
      await db.query(
        `UPDATE workflow_steps
         SET status = 'in_progress'
         WHERE arrangement_id = $1 AND title = 'Initial Contact'`,
        [form.arrangement_id]
      );

      // Notify arranger
      if (form.sent_by_user_id) {
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            form.sent_by_user_id,
            'Pre-Arrangement Form Completed',
            'A mourner has completed and submitted their pre-arrangement form',
            'form_completed',
            'pre_arrangement_form',
            id
          ]
        );
      }
    }

    res.json({
      message: 'Form updated successfully',
      form: {
        id: form.id,
        status: form.status,
        completedAt: form.completed_at,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to auto-populate arrangement from form data
async function autoPopulateArrangement(arrangementId, formData) {
  try {
    const updates = [];
    const params = [arrangementId];
    let paramIndex = 2;

    // Map form data to arrangement fields
    if (formData.deceased?.fullName) {
      updates.push(`deceased_name = $${paramIndex++}`);
      params.push(formData.deceased.fullName);
    }
    if (formData.deceased?.dateOfBirth) {
      updates.push(`deceased_date_of_birth = $${paramIndex++}`);
      params.push(formData.deceased.dateOfBirth);
    }
    if (formData.deceased?.dateOfDeath) {
      updates.push(`deceased_date_of_death = $${paramIndex++}`);
      params.push(formData.deceased.dateOfDeath);
    }
    if (formData.deceased?.gender) {
      updates.push(`deceased_gender = $${paramIndex++}`);
      params.push(formData.deceased.gender);
    }
    if (formData.deceased?.occupation) {
      updates.push(`deceased_occupation = $${paramIndex++}`);
      params.push(formData.deceased.occupation);
    }
    if (formData.deceased?.religion) {
      updates.push(`deceased_religion = $${paramIndex++}`);
      params.push(formData.deceased.religion);
    }

    // Next of kin
    if (formData.nextOfKin) {
      updates.push(`next_of_kin_name = $${paramIndex++}`);
      params.push(formData.nextOfKin.fullName);
      updates.push(`next_of_kin_relationship = $${paramIndex++}`);
      params.push(formData.nextOfKin.relationship);
      updates.push(`next_of_kin_phone = $${paramIndex++}`);
      params.push(formData.nextOfKin.phone);
      updates.push(`next_of_kin_email = $${paramIndex++}`);
      params.push(formData.nextOfKin.email);
    }

    // Service preferences
    if (formData.funeralPreferences?.serviceType) {
      const serviceTypeMap = {
        'Burial': 'burial',
        'Cremation': 'cremation',
        'Memorial Service': 'memorial',
        'No Service': 'memorial'
      };
      const funeralType = serviceTypeMap[formData.funeralPreferences.serviceType] || 'traditional';
      updates.push(`funeral_type = $${paramIndex++}`);
      params.push(funeralType);
    }

    if (formData.funeralPreferences?.serviceLocation) {
      updates.push(`service_location = $${paramIndex++}`);
      params.push(formData.funeralPreferences.serviceLocation);
    }

    if (formData.funeralPreferences?.preferredDate) {
      updates.push(`service_date = $${paramIndex++}`);
      params.push(formData.funeralPreferences.preferredDate);
    }

    // Only update if there are fields to update
    if (updates.length > 0) {
      await db.query(
        `UPDATE arrangements
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $1`,
        params
      );
    }
  } catch (error) {
    console.error('Error auto-populating arrangement:', error);
    // Don't throw - this is a best-effort operation
  }
}

// Delete form
router.delete('/:id', authenticateToken, validateRequest([validators.uuid('id')]), async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM pre_arrangement_forms WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Form not found' } });
    }

    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
