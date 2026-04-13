// MESSAGE SERVICE DISABLED - Using custom REST API backend instead
// This file is stubbed to prevent Supabase imports from being bundled

console.log('⚠️ MessageService disabled - use messagesApi from @services/api');

import { Message, Attachment } from '@types/index';

/**
 * Stubbed Message Service - DO NOT USE
 * Use messagesApi from src/services/api/messages.ts instead
 */

export class MessageService {
  static async sendMessage(_data: any): Promise<Message> {
    throw new Error('MessageService disabled - use messagesApi.sendMessage()');
  }

  static async getMessages(_arrangementId: string): Promise<Message[]> {
    return [];
  }

  static async markAsRead(_messageId: string): Promise<void> {
    throw new Error('MessageService disabled - use messagesApi.markAsRead()');
  }

  static listenToMessages(_arrangementId: string, _callback: (messages: Message[]) => void): () => void {
    return () => {}; // No-op unsubscribe
  }

  static async getUnreadCount(_userId: string): Promise<number> {
    return 0;
  }
}
