import { apiClient } from './client';

export interface Leave {
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  leaveType: 'annual' | 'sick' | 'personal' | 'unpaid' | 'bereavement' | 'other';
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  staffName?: string;
  approverName?: string;
}

export interface LeaveListResponse {
  leave: Leave[];
}

export interface LeaveResponse {
  leave: Leave;
}

export interface CreateLeaveData {
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status?: string;
}

export const leaveApi = {
  getAllLeave: async (status?: string): Promise<Leave[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get<LeaveListResponse>('/staff-profiles/leave/all', { params });
    return response.data.leave;
  },

  getLeaveByStaff: async (staffId: string): Promise<Leave[]> => {
    const response = await apiClient.get<LeaveListResponse>(`/staff-profiles/${staffId}/leave`);
    return response.data.leave;
  },

  getMyLeave: async (): Promise<Leave[]> => {
    const response = await apiClient.get<LeaveListResponse>('/users/me/leave');
    return response.data.leave;
  },

  createLeave: async (staffId: string, data: CreateLeaveData): Promise<Leave> => {
    const response = await apiClient.post<LeaveResponse>(`/staff-profiles/${staffId}/leave`, data);
    return response.data.leave;
  },

  updateLeaveStatus: async (staffId: string, leaveId: string, status: string): Promise<void> => {
    await apiClient.put(`/staff-profiles/${staffId}/leave/${leaveId}`, { status });
  },

  deleteLeave: async (staffId: string, leaveId: string): Promise<void> => {
    await apiClient.delete(`/staff-profiles/${staffId}/leave/${leaveId}`);
  },
};
