/**
 * Application Constants
 */

// Australian timezone
export const DEFAULT_TIMEZONE = 'Australia/Sydney';

// Australian locale
export const DEFAULT_LOCALE = 'en-AU';

// Date formats (Australian standard: DD/MM/YYYY)
export const DATE_FORMAT = 'dd/MM/yyyy';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const DATETIME_FULL_FORMAT = 'EEEE, dd MMMM yyyy HH:mm';

// Phone number format
export const PHONE_COUNTRY_CODE = '+61';
export const PHONE_NUMBER_LENGTH = 9; // After country code

// File upload limits
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

// Supported file types
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic'];
export const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// Workflow templates for different funeral types
export const WORKFLOW_TEMPLATES = {
  traditional: [
    {
      title: 'Initial Contact & Information',
      description: 'Gather essential information about the deceased and family',
      icon: 'clipboard-text',
      order: 0,
    },
    {
      title: 'Documentation',
      description: 'Collect required documents and certificates',
      icon: 'file-document',
      order: 1,
    },
    {
      title: 'Service Planning',
      description: 'Plan ceremony details, music, readings, and eulogy',
      icon: 'calendar-check',
      order: 2,
    },
    {
      title: 'Casket & Burial Selection',
      description: 'Choose casket, burial plot, and memorial options',
      icon: 'coffin',
      order: 3,
    },
    {
      title: 'Memorial Details',
      description: 'Design order of service, select flowers and tributes',
      icon: 'flower',
      order: 4,
    },
    {
      title: 'Final Arrangements',
      description: 'Confirm all details and schedule',
      icon: 'check-circle',
      order: 5,
    },
    {
      title: 'Service Day',
      description: 'Funeral service and burial',
      icon: 'church',
      order: 6,
    },
  ],
  cremation: [
    {
      title: 'Initial Contact & Information',
      description: 'Gather essential information about the deceased and family',
      icon: 'clipboard-text',
      order: 0,
    },
    {
      title: 'Documentation',
      description: 'Collect required documents and certificates',
      icon: 'file-document',
      order: 1,
    },
    {
      title: 'Service Planning',
      description: 'Plan memorial service details',
      icon: 'calendar-check',
      order: 2,
    },
    {
      title: 'Cremation Options',
      description: 'Select urn and final resting place for ashes',
      icon: 'fire',
      order: 3,
    },
    {
      title: 'Memorial Details',
      description: 'Design order of service and select tributes',
      icon: 'flower',
      order: 4,
    },
    {
      title: 'Final Arrangements',
      description: 'Confirm all details and schedule',
      icon: 'check-circle',
      order: 5,
    },
  ],
  repatriation: [
    {
      title: 'Initial Contact',
      description: 'Gather information about deceased and destination',
      icon: 'clipboard-text',
      order: 0,
    },
    {
      title: 'Documentation & Permits',
      description: 'Obtain international transport permits and certificates',
      icon: 'file-certificate',
      order: 1,
    },
    {
      title: 'Embalming & Preparation',
      description: 'Prepare deceased for international transport',
      icon: 'medical-bag',
      order: 2,
    },
    {
      title: 'Transport Arrangements',
      description: 'Coordinate flights and logistics',
      icon: 'airplane',
      order: 3,
    },
    {
      title: 'Receiving Arrangements',
      description: 'Coordinate with receiving funeral director',
      icon: 'handshake',
      order: 4,
    },
    {
      title: 'Departure',
      description: 'Final checks and departure',
      icon: 'send',
      order: 5,
    },
  ],
  direct_cremation: [
    {
      title: 'Initial Contact',
      description: 'Gather essential information',
      icon: 'clipboard-text',
      order: 0,
    },
    {
      title: 'Documentation',
      description: 'Collect required certificates',
      icon: 'file-document',
      order: 1,
    },
    {
      title: 'Cremation Authorization',
      description: 'Complete cremation authorization forms',
      icon: 'file-sign',
      order: 2,
    },
    {
      title: 'Cremation',
      description: 'Proceed with cremation',
      icon: 'fire',
      order: 3,
    },
    {
      title: 'Ashes Collection',
      description: 'Collect or arrange delivery of ashes',
      icon: 'package',
      order: 4,
    },
  ],
  burial: [
    {
      title: 'Initial Contact & Information',
      description: 'Gather essential information',
      icon: 'clipboard-text',
      order: 0,
    },
    {
      title: 'Documentation',
      description: 'Collect required documents',
      icon: 'file-document',
      order: 1,
    },
    {
      title: 'Burial Plot Selection',
      description: 'Choose cemetery and plot location',
      icon: 'map-marker',
      order: 2,
    },
    {
      title: 'Casket Selection',
      description: 'Select casket and vault options',
      icon: 'coffin',
      order: 3,
    },
    {
      title: 'Service Planning',
      description: 'Plan graveside or chapel service',
      icon: 'calendar-check',
      order: 4,
    },
    {
      title: 'Final Arrangements',
      description: 'Confirm details and schedule',
      icon: 'check-circle',
      order: 5,
    },
  ],
  memorial: [
    {
      title: 'Initial Planning',
      description: 'Discuss memorial service preferences',
      icon: 'clipboard-text',
      order: 0,
    },
    {
      title: 'Venue Selection',
      description: 'Choose location for memorial service',
      icon: 'home',
      order: 1,
    },
    {
      title: 'Service Details',
      description: 'Plan ceremony, speakers, and tributes',
      icon: 'calendar-check',
      order: 2,
    },
    {
      title: 'Memorial Materials',
      description: 'Design programs and photo displays',
      icon: 'image-multiple',
      order: 3,
    },
    {
      title: 'Final Arrangements',
      description: 'Confirm all details',
      icon: 'check-circle',
      order: 4,
    },
  ],
};

// Australian states and territories
export const AUSTRALIAN_STATES = [
  { label: 'New South Wales', value: 'NSW' },
  { label: 'Victoria', value: 'VIC' },
  { label: 'Queensland', value: 'QLD' },
  { label: 'South Australia', value: 'SA' },
  { label: 'Western Australia', value: 'WA' },
  { label: 'Tasmania', value: 'TAS' },
  { label: 'Northern Territory', value: 'NT' },
  { label: 'Australian Capital Territory', value: 'ACT' },
];

// Message statuses
export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
} as const;

// Notification channels
export const NOTIFICATION_CHANNELS = {
  MESSAGES: 'messages',
  WORKFLOW: 'workflow',
  DOCUMENTS: 'documents',
  SYSTEM: 'system',
} as const;
