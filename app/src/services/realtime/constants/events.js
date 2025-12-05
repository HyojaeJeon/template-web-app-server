/**
 * Realtime Event Constants - 기본 뼈대
 */

// ============================================
// Client to Server Events (Outgoing)
// ============================================
export const OUTGOING_EVENTS = {
  // Connection & Auth
  AUTHENTICATE: 'authenticate',
  LOGOUT: 'logout',
  HEARTBEAT: 'heartbeat',

  // Chat System
  CHAT: {
    JOIN_ROOM: 'chat:join_room',
    LEAVE_ROOM: 'chat:leave_room',
    SEND_MESSAGE: 'chat:send_message',
    TYPING_START: 'chat:typing_start',
    TYPING_STOP: 'chat:typing_stop',
    MARK_READ: 'chat:message_read',
  },

  // Notifications
  NOTIFICATION: {
    MARK_READ: 'notification:mark_read',
    MARK_ALL_READ: 'notification:mark_all_read',
  },
};

// ============================================
// Server to Client Events (Incoming)
// ============================================
export const INCOMING_EVENTS = {
  // Connection Status
  CONNECTION: {
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'connection:error',
    AUTHENTICATED: 'authenticated',
  },

  // Chat Messages
  CHAT: {
    MESSAGE_RECEIVED: 'chat:received',
    USER_JOINED: 'chat:user_joined',
    USER_LEFT: 'chat:user_left',
    TYPING_STATUS: 'chat:typing_status',
    ROOM_UPDATED: 'chat:room_updated',
  },

  // Notifications
  NOTIFICATION: {
    RECEIVED: 'notification:received',
    BATCH_RECEIVED: 'notification:batch_received',
  },

  // System Events
  SYSTEM: {
    ALERT: 'system:alert',
    MAINTENANCE: 'system:maintenance',
    UPDATE_REQUIRED: 'system:update_required',
  },
};

// ============================================
// Event Priorities
// ============================================
export const EVENT_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
};

// ============================================
// Room Types
// ============================================
export const ROOM_TYPES = {
  CHAT: 'chat',
  USER: 'user',
};

// ============================================
// Connection States
// ============================================
export const CONNECTION_STATE = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  AUTHENTICATED: 'authenticated',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
};

// ============================================
// Error Codes
// ============================================
export const REALTIME_ERROR_CODES = {
  // Connection Errors (1xxx)
  CONNECTION_FAILED: 1001,
  CONNECTION_TIMEOUT: 1002,
  CONNECTION_REFUSED: 1003,

  // Authentication Errors (2xxx)
  AUTH_FAILED: 2001,
  AUTH_EXPIRED: 2002,
  AUTH_INVALID: 2003,

  // Room Errors (3xxx)
  ROOM_NOT_FOUND: 3001,
  ROOM_ACCESS_DENIED: 3002,
  ROOM_FULL: 3003,

  // Message Errors (4xxx)
  MESSAGE_SEND_FAILED: 4001,
  MESSAGE_TOO_LARGE: 4002,
  MESSAGE_RATE_LIMITED: 4003,
};
