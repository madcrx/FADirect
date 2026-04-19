import { apiClient } from './client';

export interface PreArrangementForm {
  id: string;
  arrangementId: string;
  sentToUserId: string;
  sentToName?: string;
  sentByUserId: string;
  sentByName?: string;
  status: 'sent' | 'in_progress' | 'completed' | 'cancelled';
  formData?: any;
  sentAt: string;
  completedAt?: string;
  notes?: string;
}

export interface PreArrangementFormResponse {
  form: PreArrangementForm;
}

export interface SendFormResponse {
  message: string;
  formId: string;
}

export interface UpdateFormResponse {
  message: string;
  form: {
    id: string;
    status: string;
    completedAt?: string;
  };
}

export const preArrangementFormsApi = {
  sendForm: async (arrangementId: string): Promise<SendFormResponse> => {
    const response = await apiClient.post<SendFormResponse>('/pre-arrangement-forms/send', {
      arrangementId,
    });
    return response.data;
  },

  getByArrangement: async (arrangementId: string): Promise<PreArrangementForm> => {
    const response = await apiClient.get<PreArrangementFormResponse>(
      `/pre-arrangement-forms/arrangement/${arrangementId}`
    );
    return response.data.form;
  },

  updateForm: async (
    formId: string,
    formData: any,
    status?: string
  ): Promise<UpdateFormResponse> => {
    const response = await apiClient.put<UpdateFormResponse>(`/pre-arrangement-forms/${formId}`, {
      formData,
      status,
    });
    return response.data;
  },

  deleteForm: async (formId: string): Promise<void> => {
    await apiClient.delete(`/pre-arrangement-forms/${formId}`);
  },
};
