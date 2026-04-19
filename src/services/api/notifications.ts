import { apiClient } from './client';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'message' | 'document_sent' | 'document_returned' | 'form_sent' | 'form_completed' | 'leave_request' | 'leave_approved' | 'leave_rejected' | 'general';
  entityType?: string;
  entityId?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationsListResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface MarkReadResponse {
  message: string;
}

export const notificationsApi = {
  getAll: async (unreadOnly?: boolean): Promise<{ notifications: Notification[]; unreadCount: number }> => {
    const params = unreadOnly ? { unreadOnly: 'true' } : {};
    const response = await apiClient.get<NotificationsListResponse>('/notifications', { params });
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await apiClient.put<MarkReadResponse>(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put<MarkReadResponse>('/notifications/mark-all-read');
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<NotificationsListResponse>('/notifications', {
      params: { unreadOnly: 'true' },
    });
    return response.data.unreadCount;
  },
};
