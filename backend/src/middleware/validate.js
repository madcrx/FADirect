const { validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../constants');

/**
 * Middleware to handle validation errors from express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: {
        message: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
          value: err.value,
        })),
      },
    });
  }

  next();
};

/**
 * Helper to create validation middleware chain
 * Usage: router.post('/path', validateRequest(schemas.createUser), handler)
 */
const validateRequest = (validationRules) => {
  return [
    ...validationRules,
    validate,
  ];
};

module.exports = {
  validate,
  validateRequest,
};
