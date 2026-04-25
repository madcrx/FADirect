import { io, Socket } from 'socket.io-client';

type RosterEventCallback = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, RosterEventCallback[]> = new Map();

  /**
   * Initialize and connect to WebSocket server
   */
  connect() {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      console.warn('No auth token found, skipping WebSocket connection');
      return;
    }

    // Connect to WebSocket server
    this.socket = io('http://localhost:3000', {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
    });

    // Re-attach all listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket?.on(event, callback);
      });
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Subscribe to roster events
   */
  on(event: string, callback: RosterEventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);

    // Attach listener to socket if already connected
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Unsubscribe from roster events
   */
  off(event: string, callback: RosterEventCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }

    // Remove listener from socket
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const socketService = new SocketService();

// Roster event types for type safety
export const RosterEvents = {
  STAFF_ASSIGNED: 'roster:staff-assigned',
  STAFF_UNASSIGNED: 'roster:staff-unassigned',
  VEHICLE_ASSIGNED: 'roster:vehicle-assigned',
  VEHICLE_UNASSIGNED: 'roster:vehicle-unassigned',
  EQUIPMENT_ASSIGNED: 'roster:equipment-assigned',
  EQUIPMENT_UNASSIGNED: 'roster:equipment-unassigned',
  JOB_UPDATED: 'roster:job-updated',
  JOB_CREATED: 'roster:job-created',
  JOB_DELETED: 'roster:job-deleted',
} as const;
