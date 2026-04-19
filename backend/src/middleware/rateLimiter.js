const rateLimit = require('express-rate-limit');
const config = require('../config');
const { HTTP_STATUS } = require('../constants');

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: {
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

// Stricter rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.AUTH_RATE_LIMIT_MAX,
  message: {
    error: {
      message: 'Too many authentication attempts, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

// Rate limiter for file upload endpoints
const uploadLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: 20, // 20 uploads per 15 minutes
  message: {
    error: {
      message: 'Too many file uploads, please try again later.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
};
