/**
 * Core Type Definitions for FA Direct
 */

export type UserRole = 'arranger' | 'mourner';

export type FuneralType =
  | 'traditional'
  | 'cremation'
  | 'repatriation'
  | 'burial'
  | 'memorial'
  | 'direct_cremation';

export type ArrangementStatus =
  | 'initial_contact'
  | 'information_gathering'
  | 'service_planning'
  | 'documentation'
  | 'arrangements_confirmed'
  | 'service_scheduled'
  | 'completed';

export interface User {
  id: string;
  phoneNumber: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email?: string;
  organizationId?: string; // For funeral arrangers
  organizationName?: string;
  profilePhotoUrl?: string;
  createdAt: Date;
  lastSeen: Date;
  // Encryption keys
  identityKeyPair?: string; // Encrypted storage
  registrationId?: number;
  preKeys?: string; // Encrypted storage
  signedPreKey?: string; // Encrypted storage
}

export interface Organization {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phoneNumber: string;
  email: string;
  logoUrl?: string;
  timezone: string;
  locale: string;
  createdAt: Date;
}

export interface Arrangement {
  id: string;
  arrangerId: string;
  mournerId: string;
  deceasedName: string;
  funeralType: FuneralType;
  status: ArrangementStatus;
  createdAt: Date;
  updatedAt: Date;
  scheduledDate?: Date;
  workflowSteps: WorkflowStep[];
  currentStepIndex: number;
  metadata?: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: Date;
  requiredForms?: string[];
  requiredDocuments?: string[];
  icon?: string;
}

export interface Message {
  id: string;
  arrangementId: string;
  senderId: string;
  recipientId: string;
  encryptedContent: string; // E2EE encrypted message
  type: 'text' | 'image' | 'document' | 'form' | 'system';
  timestamp: Date;
  deliveredAt?: Date;
  readAt?: Date;
  attachments?: Attachment[];
  formId?: string;
  metadata?: Record<string, any>;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'pdf';
  size: number;
  url: string; // Firebase Storage URL
  encryptedUrl?: string; // E2EE encrypted file reference
  thumbnailUrl?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  funeralTypes: FuneralType[];
  workflowStep?: string;
  fields: FormField[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormField {
  id: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'number'
    | 'email'
    | 'phone'
    | 'date'
    | 'time'
    | 'select'
    | 'multiselect'
    | 'checkbox'
    | 'radio'
    | 'file'
    | 'signature';
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  defaultValue?: any;
  helpText?: string;
  order: number;
}

export interface FormSubmission {
  id: string;
  formTemplateId: string;
  arrangementId: string;
  submittedBy: string;
  submittedAt: Date;
  data: Record<string, any>;
  attachments?: Attachment[];
  signature?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

export interface Document {
  id: string;
  arrangementId: string;
  name: string;
  description?: string;
  category:
    | 'death_certificate'
    | 'burial_permit'
    | 'contract'
    | 'invoice'
    | 'receipt'
    | 'memorial_program'
    | 'other';
  fileUrl: string;
  encryptedFileUrl?: string;
  uploadedBy: string;
  uploadedAt: Date;
  size: number;
  mimeType: string;
  sharedWith: string[];
}

export interface Photo {
  id: string;
  arrangementId: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  uploadedBy: string;
  uploadedAt: Date;
  tags?: string[];
  category?: 'deceased' | 'family' | 'service' | 'flowers' | 'other';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type:
    | 'new_message'
    | 'form_request'
    | 'document_shared'
    | 'workflow_update'
    | 'appointment_reminder'
    | 'system';
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
}

// Redux State Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ArrangementsState {
  arrangements: Arrangement[];
  currentArrangement: Arrangement | null;
  isLoading: boolean;
  error: string | null;
}

export interface MessagesState {
  messages: Record<string, Message[]>; // Key: arrangementId
  isLoading: boolean;
  error: string | null;
}

export interface RootState {
  auth: AuthState;
  arrangements: ArrangementsState;
  messages: MessagesState;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PhoneAuth: undefined;
  VerifyCode: { verificationId: string; phoneNumber: string };
  UserSetup: { phoneNumber: string };
};

export type MainTabParamList = {
  Arrangements: undefined;
  Messages: { arrangementId?: string };
  Documents: undefined;
  Profile: undefined;
};

export type ArrangementStackParamList = {
  ArrangementList: undefined;
  ArrangementDetail: { arrangementId: string };
  CreateArrangement: undefined;
  WorkflowProgress: { arrangementId: string };
};

export type MessageStackParamList = {
  ConversationList: undefined;
  Chat: { arrangementId: string; recipientId: string };
  PhotoGallery: { arrangementId: string };
  DocumentViewer: { documentId: string };
};
