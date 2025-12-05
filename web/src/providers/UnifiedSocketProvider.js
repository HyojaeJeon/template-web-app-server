/**
 * 통합 Socket Provider (기본 버전)
 *
 * 기본 소켓 연결 관리만 제공
 * - 연결/해제 관리
 * - 자동 재연결
 * - 상태 관리
 */

'use client';

import React, { createContext, useContext, useEffect, useReducer, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../shared/hooks/business/useAuth';
import { useToast } from '@/shared/providers/ToastProvider';
import { tokenManager } from '@/lib/apolloClient';

// ========================= 상태 관리 =========================

const initialState = {
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  reconnectAttempts: 0,
  lastHeartbeat: null,
  rooms: new Set(),
  settings: {
    reconnectAttempts: 5,
    heartbeatInterval: 30000
  }
};

const ACTION_TYPES = {
  CONNECTION_START: 'CONNECTION_START',
  CONNECTION_SUCCESS: 'CONNECTION_SUCCESS',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  CONNECTION_LOST: 'CONNECTION_LOST',
  ROOM_JOINED: 'ROOM_JOINED',
  ROOM_LEFT: 'ROOM_LEFT',
  UPDATE_HEARTBEAT: 'UPDATE_HEARTBEAT',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS'
};

const socketReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.CONNECTION_START:
      return {
        ...state,
        isConnecting: true,
        connectionError: null
      };

    case ACTION_TYPES.CONNECTION_SUCCESS:
      return {
        ...state,
        isConnected: true,
        isConnecting: false,
        connectionError: null,
        reconnectAttempts: 0,
        lastHeartbeat: new Date()
      };

    case ACTION_TYPES.CONNECTION_ERROR:
      return {
        ...state,
        isConnected: false,
        isConnecting: false,
        connectionError: action.payload,
        reconnectAttempts: state.reconnectAttempts + 1
      };

    case ACTION_TYPES.CONNECTION_LOST:
      return {
        ...state,
        isConnected: false,
        isConnecting: false,
        rooms: new Set()
      };

    case ACTION_TYPES.ROOM_JOINED:
      return {
        ...state,
        rooms: new Set([...state.rooms, action.payload.roomId])
      };

    case ACTION_TYPES.ROOM_LEFT:
      const newRooms = new Set(state.rooms);
      newRooms.delete(action.payload.roomId);
      return {
        ...state,
        rooms: newRooms
      };

    case ACTION_TYPES.UPDATE_HEARTBEAT:
      return {
        ...state,
        lastHeartbeat: new Date()
      };

    case ACTION_TYPES.UPDATE_SETTINGS:
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };

    default:
      return state;
  }
};

// ========================= Context =========================

const UnifiedSocketContext = createContext(null);

export const useUnifiedSocket = () => {
  const context = useContext(UnifiedSocketContext);
  if (!context) {
    throw new Error('useUnifiedSocket는 UnifiedSocketProvider 내에서만 사용할 수 있습니다.');
  }
  return context;
};

// ========================= Provider =========================

export const UnifiedSocketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(socketReducer, initialState);
  const { storeAccount, storeId, isAuthenticated } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const socketRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // ========================= Heartbeat =========================

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        const startTime = Date.now();
        socketRef.current.emit('ping', { timestamp: startTime });
        dispatch({ type: ACTION_TYPES.UPDATE_HEARTBEAT });
      }
    }, state.settings.heartbeatInterval);
  }, [state.settings.heartbeatInterval]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // ========================= Reconnect =========================

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (state.reconnectAttempts < state.settings.reconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000);

      reconnectTimeoutRef.current = setTimeout(() => {
        if (!socketRef.current?.connected) {
          connectSocket();
        }
      }, delay);
    }
  }, [state.reconnectAttempts, state.settings.reconnectAttempts]);

  // ========================= Socket 연결 =========================

  const connectSocket = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!isAuthenticated || !storeId) return;
    if (socketRef.current?.connected) return;

    dispatch({ type: ACTION_TYPES.CONNECTION_START });

    try {
      const serverUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:4000'
        : 'https://api.template.com';

      const token = tokenManager.getAccessToken();

      if (!token) {
        dispatch({ type: ACTION_TYPES.CONNECTION_ERROR, payload: 'No authentication token' });
        return;
      }

      const socketOptions = {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket'],
        auth: {
          token,
          clientType: 'store-admin',
          storeId,
          userId: storeAccount?.id
        }
      };

      socketRef.current = io(serverUrl, socketOptions);
      setupSocketEventHandlers();

    } catch (error) {
      console.error('Socket 연결 오류:', error);
      dispatch({ type: ACTION_TYPES.CONNECTION_ERROR, payload: error.message });
      scheduleReconnect();
    }
  }, [isAuthenticated, storeId, storeAccount?.id]);

  // ========================= Event Handlers =========================

  const setupSocketEventHandlers = useCallback(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    socket.off('connect');
    socket.off('disconnect');
    socket.off('connect_error');
    socket.off('reconnect');

    socket.on('connect', () => {
      console.log('Socket 연결 성공:', socket.id);
      dispatch({ type: ACTION_TYPES.CONNECTION_SUCCESS });
      showSuccess('실시간 연결 성공');
      startHeartbeat();

      // 기본 room 참여
      const storeRoomId = `store:${storeId}`;
      socket.emit('joinRoom', { roomId: storeRoomId });
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket 연결 해제:', reason);
      dispatch({ type: ACTION_TYPES.CONNECTION_LOST });
      stopHeartbeat();
      showWarning('실시간 연결 끊김');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket 연결 에러:', error);
      dispatch({ type: ACTION_TYPES.CONNECTION_ERROR, payload: error.message });

      if (state.reconnectAttempts >= state.settings.reconnectAttempts) {
        showError('서버 연결에 실패했습니다');
      }
    });

    socket.on('reconnect', () => {
      console.log('Socket 재연결 성공');
      showSuccess('실시간 연결 재연결됨');

      const storeRoomId = `store:${storeId}`;
      socket.emit('joinRoom', { roomId: storeRoomId });
    });

    socket.on('pong', () => {
      dispatch({ type: ACTION_TYPES.UPDATE_HEARTBEAT });
    });

  }, [storeId, showSuccess, showError, showWarning, startHeartbeat, stopHeartbeat, state.reconnectAttempts, state.settings.reconnectAttempts]);

  // ========================= Socket 해제 =========================

  const disconnectSocket = useCallback(() => {
    stopHeartbeat();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    dispatch({ type: ACTION_TYPES.CONNECTION_LOST });
  }, [stopHeartbeat]);

  // ========================= Room 관리 =========================

  const joinRoom = useCallback((roomId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('joinRoom', { roomId });
      dispatch({ type: ACTION_TYPES.ROOM_JOINED, payload: { roomId } });
    }
  }, []);

  const leaveRoom = useCallback((roomId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leaveRoom', { roomId });
      dispatch({ type: ACTION_TYPES.ROOM_LEFT, payload: { roomId } });
    }
  }, []);

  // ========================= 이벤트 emit =========================

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
      return true;
    }
    return false;
  }, []);

  // ========================= 이벤트 구독 =========================

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  // ========================= Lifecycle =========================

  useEffect(() => {
    if (isAuthenticated && storeId) {
      connectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, storeId]);

  // ========================= Context Value =========================

  const contextValue = {
    // 상태
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    connectionError: state.connectionError,
    reconnectAttempts: state.reconnectAttempts,
    rooms: state.rooms,

    // 연결 관리
    connect: connectSocket,
    disconnect: disconnectSocket,

    // Room 관리
    joinRoom,
    leaveRoom,

    // 이벤트
    emit,
    on,
    off,

    // Socket 인스턴스 (고급 사용)
    socket: socketRef.current
  };

  return (
    <UnifiedSocketContext.Provider value={contextValue}>
      {children}
    </UnifiedSocketContext.Provider>
  );
};

export default UnifiedSocketProvider;
