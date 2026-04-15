import { apiClient } from './client';

export interface Arrangement {
  id: string;
  deceasedName: string;
  deceasedDateOfBirth: string | null;
  deceasedDateOfDeath: string | null;
  arrangerId: string;
  mournerId: string | null;
  arrangerName?: string;
  funeralType?: string;
  serviceDate: string | null;
  serviceLocation: string | null;
  notes: string | null;
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
  workflowSteps?: any[];
  currentStepIndex?: number;
  scheduledDate?: string | null;
}

export interface ArrangementsListResponse {
  arrangements: Arrangement[];
}

export interface ArrangementResponse {
  arrangement: Arrangement;
}

export interface CreateArrangementData {
  deceasedName: string;
  deceasedDateOfBirth?: string;
  deceasedDateOfDeath?: string;
  serviceDate?: string;
  serviceLocation?: string;
  notes?: string;
}

export interface UpdateArrangementData {
  deceasedName?: string;
  serviceDate?: string;
  serviceLocation?: string;
  notes?: string;
  status?: 'draft' | 'active' | 'completed';
}

export const arrangementsApi = {
  async getArrangements(): Promise<ArrangementsListResponse> {
    return apiClient.get<ArrangementsListResponse>('/arrangements');
  },

  async getArrangement(id: string): Promise<ArrangementResponse> {
    return apiClient.get<ArrangementResponse>(`/arrangements/${id}`);
  },

  async createArrangement(data: CreateArrangementData): Promise<ArrangementResponse> {
    return apiClient.post<ArrangementResponse>('/arrangements', data);
  },

  async updateArrangement(id: string, data: UpdateArrangementData): Promise<ArrangementResponse> {
    return apiClient.put<ArrangementResponse>(`/arrangements/${id}`, data);
  },
};
