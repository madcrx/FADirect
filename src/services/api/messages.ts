import { apiClient } from './client';

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  arrangementId: string;
  encryptedContent: string;
  messageType: 'text' | 'document';
  read: boolean;
  senderName?: string;
  createdAt: string;
}

export interface MessagesListResponse {
  messages: Message[];
}

export interface SendMessageData {
  recipientId: string;
  arrangementId: string;
  encryptedContent: string;
  messageType?: 'text' | 'document';
}

export interface SendMessageResponse {
  message: Message;
}

export interface MarkReadResponse {
  success: boolean;
}

export const messagesApi = {
  async getMessages(arrangementId: string): Promise<MessagesListResponse> {
    return apiClient.get<MessagesListResponse>(`/messages/arrangement/${arrangementId}`);
  },

  async sendMessage(data: SendMessageData): Promise<SendMessageResponse> {
    return apiClient.post<SendMessageResponse>('/messages', data);
  },

  async markAsRead(messageId: string): Promise<MarkReadResponse> {
    return apiClient.put<MarkReadResponse>(`/messages/${messageId}/read`);
  },
};
