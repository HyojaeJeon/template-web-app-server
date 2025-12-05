/**
 * Realtime Service Index - 기본 뼈대
 * Socket.IO 기반 실시간 통신 서비스
 */

import socketManager from '@services/realtime/SocketManager';
import ChatHandler from '@services/realtime/handlers/ChatHandler';
import NotificationHandler from '@services/realtime/handlers/NotificationHandler';

// ============================================
// React Hooks Export
// ============================================
export {
  useRealtime,
  useChat,
  useNotifications,
} from '@services/realtime/hooks/useRealtime';

// ============================================
// Constants Export
// ============================================
export {
  OUTGOING_EVENTS,
  INCOMING_EVENTS,
  EVENT_PRIORITY,
  ROOM_TYPES,
  CONNECTION_STATE,
  REALTIME_ERROR_CODES,
} from '@services/realtime/constants/events';

/**
 * RealtimeService Class - 기본 뼈대
 */
class RealtimeService {
  constructor() {
    this.socketManager = socketManager;
    this.handlers = {
      chat: ChatHandler,
      notification: NotificationHandler,
    };
    this.initialized = false;
  }

  async initialize({ toastInstance } = {}) {
    if (this.initialized) {
      console.log('[RealtimeService] Already initialized');
      return;
    }

    try {
      console.log('[RealtimeService] Starting initialization...');

      await this.socketManager.connect();

      // Initialize handlers
      if (this.handlers.chat?.initialize) {
        await this.handlers.chat.initialize();
      }
      if (this.handlers.notification?.initialize) {
        await this.handlers.notification.initialize(toastInstance);
      }

      this.initialized = true;
      console.log('[RealtimeService] Initialization completed');

    } catch (error) {
      console.error('[RealtimeService] Initialization failed:', error);
      throw error;
    }
  }

  isConnected() {
    return this.socketManager.isConnected();
  }

  emit(event, data) {
    if (!this.isConnected()) {
      console.warn('[RealtimeService] Cannot emit - not connected');
      return false;
    }
    return this.socketManager.emit(event, data);
  }

  on(event, handler) {
    return this.socketManager.on(event, handler);
  }

  off(event, handler) {
    return this.socketManager.off(event, handler);
  }

  joinRoom(type, id) {
    if (this.isConnected()) {
      return this.socketManager.joinRoom(type, id);
    }
  }

  leaveRoom(type, id) {
    if (this.isConnected()) {
      return this.socketManager.leaveRoom(type, id);
    }
  }

  async cleanup() {
    console.log('[RealtimeService] Starting cleanup...');

    const cleanupPromises = Object.values(this.handlers).map(handler => {
      if (handler?.cleanup) {
        return handler.cleanup();
      }
      return Promise.resolve();
    });

    await Promise.allSettled(cleanupPromises);

    this.socketManager.disconnect();
    this.initialized = false;

    console.log('[RealtimeService] Cleanup completed');
  }
}

const realtimeService = new RealtimeService();

export default realtimeService;
