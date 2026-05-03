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

// Shift confirmation (for mobile app)
router.get('/my-shifts', authenticateToken, rosterController.getMyShifts);
router.post('/assignments/:assignmentId/confirm', authenticateToken, rosterController.confirmShift);
router.post('/assignments/:assignmentId/decline', authenticateToken, rosterController.declineShift);
router.get('/notifications', authenticateToken, rosterController.getRosterNotifications);
router.put('/notifications/:notificationId/read', authenticateToken, rosterController.markNotificationRead);

// Push notification token management
router.post('/register-device', authenticateToken, rosterController.registerDevice);
router.delete('/unregister-device', authenticateToken, rosterController.unregisterDevice);

module.exports = router;
