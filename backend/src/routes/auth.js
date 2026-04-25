const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { schemas } = require('../validators');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes - with rate limiting to prevent abuse
router.post('/send-code', authLimiter, validateRequest(schemas.phoneAuth), authController.sendVerificationCode);
router.post('/verify-code', authLimiter, validateRequest(schemas.verifyCode), authController.verifyCode);

// Protected routes
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
