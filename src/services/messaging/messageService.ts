import { firestore, COLLECTIONS, getTimestamp } from '@services/firebase/config';
import { Message, Attachment } from '@types/index';
import { encryptMessage, decryptMessage } from '@services/encryption/signalProtocol';

/**
 * Message Service
 * Handles secure end-to-end encrypted messaging
 */

export class MessageService {
  /**
   * Send an encrypted message
   */
  static async sendMessage(data: {
    arrangementId: string;
    senderId: string;
    recipientId: string;
    content: string;
    type?: Message['type'];
    attachments?: Attachment[];
  }): Promise<Message> {
    try {
      // Encrypt the message content using Signal Protocol
      const encryptedContent = await encryptMessage(data.recipientId, data.content);

      const message: Omit<Message, 'id'> = {
        arrangementId: data.arrangementId,
        senderId: data.senderId,
        recipientId: data.recipientId,
        encryptedContent,
        type: data.type || 'text',
        timestamp: new Date(),
        attachments: data.attachments,
      };

      const docRef = await firestore()
        .collection(COLLECTIONS.MESSAGES)
        .add({
          ...message,
          timestamp: getTimestamp(),
        });

      return {
        ...message,
        id: docRef.id,
      };
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw new Error(error.message || 'Failed to send message');
    }
  }

  /**
   * Get messages for an arrangement
   */
  static async getMessages(arrangementId: string): Promise<Message[]> {
    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.MESSAGES)
        .where('arrangementId', '==', arrangementId)
        .orderBy('timestamp', 'asc')
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          timestamp: data.timestamp?.toDate(),
          deliveredAt: data.deliveredAt?.toDate(),
          readAt: data.readAt?.toDate(),
        } as Message;
      });
    } catch (error: any) {
      console.error('Error getting messages:', error);
      throw new Error(error.message || 'Failed to get messages');
    }
  }

  /**
   * Decrypt a message
   */
  static async decryptMessageContent(message: Message, currentUserId: string): Promise<string> {
    try {
      // Determine who sent the message
      const senderId = message.senderId === currentUserId ? currentUserId : message.senderId;

      // Decrypt using Signal Protocol
      const decryptedContent = await decryptMessage(senderId, message.encryptedContent);

      return decryptedContent;
    } catch (error: any) {
      console.error('Error decrypting message:', error);
      return '[Unable to decrypt message]';
    }
  }

  /**
   * Mark message as delivered
   */
  static async markAsDelivered(messageId: string): Promise<void> {
    try {
      await firestore().collection(COLLECTIONS.MESSAGES).doc(messageId).update({
        deliveredAt: getTimestamp(),
      });
    } catch (error) {
      console.error('Error marking message as delivered:', error);
    }
  }

  /**
   * Mark message as read
   */
  static async markAsRead(messageId: string): Promise<void> {
    try {
      await firestore().collection(COLLECTIONS.MESSAGES).doc(messageId).update({
        readAt: getTimestamp(),
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  /**
   * Listen to new messages for an arrangement
   */
  static onMessagesChanged(
    arrangementId: string,
    callback: (messages: Message[]) => void,
  ) {
    return firestore()
      .collection(COLLECTIONS.MESSAGES)
      .where('arrangementId', '==', arrangementId)
      .orderBy('timestamp', 'asc')
      .onSnapshot(
        snapshot => {
          const messages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              timestamp: data.timestamp?.toDate(),
              deliveredAt: data.deliveredAt?.toDate(),
              readAt: data.readAt?.toDate(),
            } as Message;
          });
          callback(messages);
        },
        error => {
          console.error('Error listening to messages:', error);
        },
      );
  }
}
