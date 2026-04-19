const { body, param, query } = require('express-validator');
const { USER_ROLES, ARRANGEMENT_STATUS, WORKFLOW_STATUS, FILE_SEND_STATUS, FORM_STATUS, LEAVE_STATUS, LEAVE_TYPES, VALIDATION } = require('../constants');

// Common validation rules
const validators = {
  // UUID validation
  uuid: (field = 'id') =>
    param(field).isUUID().withMessage(`${field} must be a valid UUID`),

  // String validations
  requiredString: (field, maxLength = VALIDATION.MAX_TEXT_LENGTH) =>
    body(field)
      .trim()
      .notEmpty().withMessage(`${field} is required`)
      .isLength({ max: maxLength }).withMessage(`${field} must be less than ${maxLength} characters`),

  optionalString: (field, maxLength = VALIDATION.MAX_TEXT_LENGTH) =>
    body(field)
      .optional()
      .trim()
      .isLength({ max: maxLength }).withMessage(`${field} must be less than ${maxLength} characters`),

  // Email validation
  email: (field = 'email') =>
    body(field)
      .optional()
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),

  // Phone validation
  phone: (field = 'phone') =>
    body(field)
      .optional()
      .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Invalid phone number format')
      .isLength({ max: VALIDATION.MAX_PHONE_LENGTH }).withMessage('Phone number too long'),

  // Date validation
  date: (field) =>
    body(field)
      .optional()
      .isISO8601().withMessage(`${field} must be a valid date`),

  requiredDate: (field) =>
    body(field)
      .notEmpty().withMessage(`${field} is required`)
      .isISO8601().withMessage(`${field} must be a valid date`),

  // Boolean validation
  boolean: (field) =>
    body(field)
      .optional()
      .isBoolean().withMessage(`${field} must be a boolean`),

  // Integer validation
  integer: (field, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    body(field)
      .optional()
      .isInt({ min, max }).withMessage(`${field} must be an integer between ${min} and ${max}`),

  requiredInteger: (field, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    body(field)
      .notEmpty().withMessage(`${field} is required`)
      .isInt({ min, max }).withMessage(`${field} must be an integer between ${min} and ${max}`),

  // Enum validation
  enum: (field, allowedValues, valueName = 'value') =>
    body(field)
      .isIn(allowedValues).withMessage(`Invalid ${valueName}. Allowed: ${allowedValues.join(', ')}`),

  optionalEnum: (field, allowedValues, valueName = 'value') =>
    body(field)
      .optional()
      .isIn(allowedValues).withMessage(`Invalid ${valueName}. Allowed: ${allowedValues.join(', ')}`),

  // Pagination
  pagination: () => [
    query('limit')
      .optional()
      .isInt({ min: 1, max: VALIDATION.MAX_LIMIT }).withMessage('Limit must be between 1 and 100')
      .toInt(),
    query('offset')
      .optional()
      .isInt({ min: 0 }).withMessage('Offset must be non-negative')
      .toInt(),
  ],

  // Search
  search: (field = 'search') =>
    query(field)
      .optional()
      .trim()
      .isLength({ max: 255 }).withMessage('Search query too long'),
};

// Specific schema validators
const schemas = {
  // User/Auth schemas
  phoneAuth: [
    body('phoneNumber')
      .notEmpty().withMessage('Phone number is required')
      .matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Invalid phone number format')
      .isLength({ max: VALIDATION.MAX_PHONE_LENGTH }),
  ],

  verifyCode: [
    body('phoneNumber')
      .notEmpty().withMessage('Phone number is required')
      .matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Invalid phone number format'),
    body('code')
      .notEmpty().withMessage('Verification code is required')
      .matches(/^\d{6}$/).withMessage('Code must be 6 digits'),
  ],

  updateProfile: [
    validators.optionalString('name', VALIDATION.MAX_NAME_LENGTH),
    validators.email('email'),
    validators.phone('phoneNumber'),
    validators.optionalString('address'),
  ],

  // Arrangement schemas
  createArrangement: [
    validators.requiredString('deceasedName', VALIDATION.MAX_NAME_LENGTH),
    validators.date('deceasedDateOfBirth'),
    validators.date('deceasedDateOfDeath'),
    validators.date('serviceDate'),
    validators.optionalString('serviceLocation'),
    validators.optionalString('notes'),
    validators.optionalEnum('funeralType', ['burial', 'cremation', 'memorial', 'celebration_of_life'], 'funeral type'),
    validators.uuid('mournerId'),
  ],

  updateArrangement: [
    validators.optionalString('deceasedName', VALIDATION.MAX_NAME_LENGTH),
    validators.date('deceasedDateOfBirth'),
    validators.date('deceasedDateOfDeath'),
    validators.date('serviceDate'),
    validators.optionalString('serviceLocation'),
    validators.optionalString('notes'),
    validators.optionalEnum('status', Object.values(ARRANGEMENT_STATUS), 'status'),
    validators.optionalEnum('funeralType', ['burial', 'cremation', 'memorial', 'celebration_of_life'], 'funeral type'),
  ],

  // Message schemas
  sendMessage: [
    validators.uuid('recipientId'),
    validators.uuid('arrangementId'),
    validators.requiredString('encryptedContent'),
    validators.optionalEnum('messageType', ['text', 'file', 'voice'], 'message type'),
  ],

  // Document schemas
  uploadDocument: [
    validators.uuid('arrangementId'),
    validators.optionalString('caption', 255),
  ],

  // Leave schemas
  createLeave: [
    validators.requiredDate('startDate'),
    validators.requiredDate('endDate'),
    validators.enum('leaveType', Object.values(LEAVE_TYPES), 'leave type'),
    validators.requiredString('reason', 500),
  ],

  updateLeaveStatus: [
    validators.enum('status', Object.values(LEAVE_STATUS), 'status'),
  ],

  // File send schemas
  sendFile: [
    validators.requiredString('fileId'),
    validators.enum('fileType', ['document', 'photo', 'video', 'form'], 'file type'),
    validators.uuid('arrangementId'),
    validators.uuid('sentToUserId'),
    validators.optionalString('notes', 500),
  ],

  // Pre-arrangement form schemas
  sendForm: [
    validators.uuid('arrangementId'),
  ],

  updateForm: [
    body('formData').notEmpty().withMessage('Form data is required').isObject(),
    validators.optionalEnum('status', Object.values(FORM_STATUS), 'status'),
  ],

  // Notification schemas
  markNotificationRead: [
    validators.uuid('notificationId'),
  ],

  // Workflow schemas
  updateWorkflowStep: [
    validators.optionalEnum('status', Object.values(WORKFLOW_STATUS), 'status'),
    validators.optionalString('notes', 1000),
  ],

  // Staff/Roster schemas
  assignStaff: [
    validators.uuid('staffId'),
    validators.requiredString('role', 100),
  ],

  assignVehicle: [
    validators.uuid('vehicleId'),
  ],

  assignEquipment: [
    validators.uuid('equipmentId'),
  ],

  // Invoice schemas
  createInvoice: [
    validators.uuid('arrangementId'),
    validators.requiredInteger('totalAmount', 0),
    validators.date('dueDate'),
    body('items').isArray().withMessage('Items must be an array'),
  ],
};

module.exports = {
  validators,
  schemas,
};
