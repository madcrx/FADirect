export interface User {
  id: string;
  email: string;
  name: string;
  role: Array<'admin' | 'management' | 'arranger' | 'conductor' | 'funeral_director_assistant' | 'embalmer' | 'hearse_driver' | 'coach_driver' | 'mourner'>;
  phoneNumber: string;
  organizationId?: string;
  organizationName?: string;
  createdAt: string;
  lastSeen: string;
}

export interface Arrangement {
  id: string;
  arrangerId: string;
  arrangerName?: string;
  mournerId: string | null;
  mournerName?: string;
  mournerPhone?: string;
  mournerEmail?: string;
  mournerRelationship?: string;
  deceasedName: string;
  deceasedDateOfBirth: string | null;
  deceasedDateOfDeath: string | null;
  deceasedAddressLine1?: string;
  deceasedAddressLine2?: string;
  deceasedCity?: string;
  deceasedState?: string;
  deceasedPostcode?: string;
  deceasedCountry?: string;
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  nextOfKinEmail?: string;
  locationOfDeceased?: string;
  funeralType: 'traditional' | 'cremation' | 'repatriation' | 'burial' | 'memorial' | 'direct_cremation';
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  jobId?: string | null;
  serviceDate: string | null;
  serviceLocation: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  workflowSteps?: WorkflowStep[];
  currentStepIndex?: number;
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: string;
  assignedTo?: string;
  dueDate?: string;
}

export interface Message {
  id: string;
  arrangementId: string;
  senderId: string;
  senderName?: string;
  recipientId: string;
  content: string;
  timestamp: string;
  readAt?: string;
}

export interface Document {
  id: string;
  arrangementId: string;
  uploadedBy: string;
  uploaderName?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  documentType: string | null;
  createdAt: string;
}

export interface Photo {
  id: string;
  arrangementId: string;
  uploadedBy: string;
  uploaderName?: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl: string;
  caption: string | null;
  createdAt: string;
}

export interface PriceList {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  arrangementId: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface DashboardStats {
  totalArrangements: number;
  activeArrangements: number;
  completedThisMonth: number;
  totalRevenue: number;
  pendingPayments: number;
  recentArrangements: Arrangement[];
}
