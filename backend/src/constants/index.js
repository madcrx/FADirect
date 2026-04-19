// User roles
const USER_ROLES = {
  ADMIN: 'admin',
  ARRANGER: 'arranger',
  MOURNER: 'mourner',
  MANAGEMENT: 'management',
};

// Arrangement statuses
const ARRANGEMENT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  INITIAL_CONTACT: 'initial_contact',
  INFORMATION_GATHERING: 'information_gathering',
  SERVICE_PLANNING: 'service_planning',
  DOCUMENTATION: 'documentation',
  ARRANGEMENTS_CONFIRMED: 'arrangements_confirmed',
  SERVICE_SCHEDULED: 'service_scheduled',
};

// Workflow step statuses
const WORKFLOW_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
};

// File send statuses
const FILE_SEND_STATUS = {
  SENT: 'sent',
  VIEWED: 'viewed',
  RETURNED: 'returned',
  CANCELLED: 'cancelled',
};

// Pre-arrangement form statuses
const FORM_STATUS = {
  SENT: 'sent',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Leave statuses
const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

// Leave types
const LEAVE_TYPES = {
  ANNUAL: 'annual',
  SICK: 'sick',
  PERSONAL: 'personal',
  UNPAID: 'unpaid',
  BEREAVEMENT: 'bereavement',
  OTHER: 'other',
};

// Notification types
const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  DOCUMENT_SENT: 'document_sent',
  DOCUMENT_RETURNED: 'document_returned',
  FORM_SENT: 'form_sent',
  FORM_COMPLETED: 'form_completed',
  LEAVE_REQUEST: 'leave_request',
  LEAVE_APPROVED: 'leave_approved',
  LEAVE_REJECTED: 'leave_rejected',
  GENERAL: 'general',
};

// File types
const FILE_TYPES = {
  DOCUMENT: 'document',
  PHOTO: 'photo',
  VIDEO: 'video',
  FORM: 'form',
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

// Validation constraints
const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_PHONE_LENGTH: 20,
  MAX_NAME_LENGTH: 255,
  MAX_TEXT_LENGTH: 1000,
  MIN_JWT_SECRET_LENGTH: 32,
};

// Default pagination
const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0,
};

module.exports = {
  USER_ROLES,
  ARRANGEMENT_STATUS,
  WORKFLOW_STATUS,
  FILE_SEND_STATUS,
  FORM_STATUS,
  LEAVE_STATUS,
  LEAVE_TYPES,
  NOTIFICATION_TYPES,
  FILE_TYPES,
  HTTP_STATUS,
  VALIDATION,
  PAGINATION,
};
