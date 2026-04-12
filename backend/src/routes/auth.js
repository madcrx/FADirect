const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/send-code', authController.sendVerificationCode);
router.post('/verify-code', authController.verifyCode);

// Protected routes
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
