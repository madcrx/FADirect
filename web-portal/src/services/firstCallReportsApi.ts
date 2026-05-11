import api from './api';

export interface FirstCallReport {
  id: number;
  templateId: number;
  arrangementId: number | null;
  jobId: number | null;
  submittedBy: number;
  formData: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  submittedAt: string;
  processedAt: string | null;
  notes: string | null;
  processingError: string | null;
  submittedByName?: string;
  deceasedName?: string;
  removalDate?: string;
}

export interface SubmitReportRequest {
  formData: any;
}

export interface SubmitReportResponse {
  message: string;
  report: {
    id: number;
    arrangementId: number | null;
    jobId: number | null;
    status: string;
    submittedAt: string;
    processedAt: string | null;
    notes: string | null;
    error: string | null;
  };
}

export const firstCallReportsApi = {
  // Submit a new First Call Report
  submit: async (data: SubmitReportRequest): Promise<SubmitReportResponse> => {
    const response = await api.post('/first-call-reports', data);
    return response.data;
  },

  // Get all First Call Reports
  getAll: async (params?: {
    status?: string;
    submittedBy?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/first-call-reports', { params });
    return response.data;
  },

  // Get a specific First Call Report by ID
  getById: async (id: number): Promise<FirstCallReport> => {
    const response = await api.get(`/first-call-reports/${id}`);
    return response.data;
  },

  // Get First Call Reports by arrangement ID
  getByArrangement: async (arrangementId: number): Promise<FirstCallReport[]> => {
    const response = await api.get(`/first-call-reports/arrangement/${arrangementId}`);
    return response.data;
  },

  // Get First Call Reports by job ID
  getByJob: async (jobId: number): Promise<FirstCallReport[]> => {
    const response = await api.get(`/first-call-reports/job/${jobId}`);
    return response.data;
  },

  // Retry a failed First Call Report
  retry: async (id: number) => {
    const response = await api.post(`/first-call-reports/${id}/retry`);
    return response.data;
  },
};

export default firstCallReportsApi;
