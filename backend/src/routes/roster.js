const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const rosterController = require('../controllers/rosterController');

/**
 * Roster Routes
 * Handles routing for job scheduling, resource assignments, and rostering board
 * Business logic is in controllers/rosterController.js
 */

// Job management
router.get('/jobs', authenticateToken, rosterController.getJobs);
router.get('/job-types', authenticateToken, rosterController.getJobTypes);

// Staff availability and assignments
router.get('/available-staff', authenticateToken, rosterController.getAvailableStaff);
router.post('/jobs/:jobId/assign-staff', authenticateToken, rosterController.assignStaff);
router.delete('/jobs/:jobId/unassign-staff', authenticateToken, rosterController.unassignStaff);

// Vehicle assignments
router.post('/jobs/:jobId/assign-vehicle', authenticateToken, rosterController.assignVehicle);
router.delete('/jobs/:jobId/unassign-vehicle', authenticateToken, rosterController.unassignVehicle);

// Equipment assignments
router.post('/jobs/:jobId/assign-equipment', authenticateToken, rosterController.assignEquipment);
router.delete('/jobs/:jobId/unassign-equipment', authenticateToken, rosterController.unassignEquipment);

module.exports = router;
