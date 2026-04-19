import { apiClient } from './client';

export interface FileSend {
  id: string;
  fileId: string;
  fileType: 'document' | 'photo' | 'video' | 'form';
  arrangementId: string;
  sentToUserId: string;
  sentToName?: string;
  sentByUserId: string;
  sentByName?: string;
  status: 'sent' | 'viewed' | 'returned' | 'cancelled';
  sentAt: string;
  viewedAt?: string;
  returnedAt?: string;
  notes?: string;
}

export interface FileSendsListResponse {
  fileSends: FileSend[];
}

export interface FileSendResponse {
  message: string;
  fileSend: {
    id: string;
    fileId: string;
    fileType: string;
    arrangementId: string;
    status: string;
    sentAt: string;
  };
}

export interface SendFileData {
  fileId: string;
  fileType: string;
  arrangementId: string;
  sentToUserId: string;
  notes?: string;
}

export const fileSendsApi = {
  sendFile: async (data: SendFileData): Promise<FileSendResponse> => {
    const response = await apiClient.post<FileSendResponse>('/file-sends', data);
    return response.data;
  },

  getByArrangement: async (arrangementId: string): Promise<FileSend[]> => {
    const response = await apiClient.get<FileSendsListResponse>(
      `/file-sends/arrangement/${arrangementId}`
    );
    return response.data.fileSends;
  },

  getMyReceivedFiles: async (): Promise<FileSend[]> => {
    const response = await apiClient.get<FileSendsListResponse>('/file-sends/my-received');
    return response.data.fileSends;
  },

  updateStatus: async (fileSendId: string, status: string): Promise<void> => {
    await apiClient.put(`/file-sends/${fileSendId}/status`, { status });
  },

  markAsViewed: async (fileSendId: string): Promise<void> => {
    await apiClient.post(`/file-sends/${fileSendId}/viewed`);
  },

  deleteFileSend: async (fileSendId: string): Promise<void> => {
    await apiClient.delete(`/file-sends/${fileSendId}`);
  },
};
