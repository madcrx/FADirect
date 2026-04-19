const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { schemas } = require('../validators');

// Public routes
router.post('/send-code', validateRequest(schemas.phoneAuth), authController.sendVerificationCode);
router.post('/verify-code', validateRequest(schemas.verifyCode), authController.verifyCode);

// Protected routes
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
