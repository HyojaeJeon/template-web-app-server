/**
 * Web Socket.IO React Hook (JavaScript 버전)
 * 웹 클라이언트에서 실시간 Socket 연결을 관리하는 React Hook
 *
 * TypeScript → JavaScript 변환 완료 (2025-09-17)
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthContext } from '@/providers/AuthProvider';
import { StoreSocketClient } from '@/lib/socket-client';

/**
 * UseSocketConfig 타입 (주석으로 문서화):
 * {
 *   autoConnect?: boolean,
 *   reconnectAttempts?: number,
 *   debug?: boolean
 * }
 *
 * UseSocketReturn 타입:
 * {
 *   socket: StoreSocketClient | null,
 *   connectionStatus: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR',
 *   isConnected: boolean,
 *   isConnecting: boolean,
 *   connect: () => Promise<void>,
 *   disconnect: () => void,
 *   emit: (event: string, data?: any) => void,
 *   on: (event: string, listener: Function) => void,
 *   off: (event: string, listener?: Function) => void,
 *   joinStoreRoom: (storeId: string) => void,
 *   leaveStoreRoom: (storeId: string) => void
 * }
 */

/**
 * Web Socket.IO 연결을 관리하는 React Hook
 * @param {Object} config - Socket 설정
 * @param {boolean} config.autoConnect - 자동 연결 여부
 * @param {number} config.reconnectAttempts - 재연결 시도 횟수
 * @param {boolean} config.debug - 디버그 모드
 * @returns {Object} Socket 관련 상태 및 함수들
 */
export const useSocket = (config = {}) => {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    debug = process.env.NODE_ENV === 'development'
  } = config;

  const { user, accessStoreToken } = useAuthContext();
  const socketRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');

  // Socket 클라이언트 초기화
  const initializeSocket = useCallback(() => {
    if (!socketRef.current && accessStoreToken) {
      socketRef.current = new StoreSocketClient({
        token: accessStoreToken,
        reconnectAttempts,
        debug,
        onConnectionChange: (status) => {
          setConnectionStatus(status);
          if (debug) {
            console.log(`🔌 Socket connection status: ${status}`);
          }
        }
      });
    }
    return socketRef.current;
  }, [accessStoreToken, reconnectAttempts, debug]);

  // Socket 연결
  const connect = useCallback(async () => {
    if (!accessStoreToken) {
      console.warn('❌ Socket 연결 실패: 인증 토큰이 없습니다');
      return;
    }

    const socket = initializeSocket();
    if (socket) {
      try {
        await socket.connect();
        if (debug) {
          console.log('✅ Socket 연결 성공');
        }
      } catch (error) {
        console.error('❌ Socket 연결 실패:', error);
      }
    }
  }, [accessStoreToken, initializeSocket, debug]);

  // Socket 연결 해제
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      if (debug) {
        console.log('🔌 Socket 연결 해제');
      }
    }
  }, [debug]);

  // 이벤트 발송
  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('❌ Socket이 연결되지 않았습니다');
    }
  }, []);

  // 이벤트 리스너 등록
  const on = useCallback((event, listener) => {
    if (socketRef.current) {
      socketRef.current.on(event, listener);
    }
  }, []);

  // 이벤트 리스너 제거
  const off = useCallback((event, listener) => {
    if (socketRef.current) {
      socketRef.current.off(event, listener);
    }
  }, []);

  // 매장 룸 참가
  const joinStoreRoom = useCallback((storeId) => {
    if (socketRef.current) {
      socketRef.current.joinStoreRoom(storeId);
      if (debug) {
        console.log(`🏪 매장 룸 참가: ${storeId}`);
      }
    }
  }, [debug]);

  // 매장 룸 나가기
  const leaveStoreRoom = useCallback((storeId) => {
    if (socketRef.current) {
      socketRef.current.leaveStoreRoom(storeId);
      if (debug) {
        console.log(`🏪 매장 룸 나가기: ${storeId}`);
      }
    }
  }, [debug]);

  // 자동 연결 처리
  useEffect(() => {
    if (autoConnect && accessStoreToken && user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, accessStoreToken, user, connect, disconnect]);

  // 토큰 변경 시 재연결
  useEffect(() => {
    if (socketRef.current && accessStoreToken) {
      disconnect();
      setTimeout(() => {
        connect();
      }, 100);
    }
  }, [accessStoreToken, connect, disconnect]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const isConnected = connectionStatus === 'CONNECTED';
  const isConnecting = connectionStatus === 'CONNECTING';

  return {
    socket: socketRef.current,
    connectionStatus,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    emit,
    on,
    off,
    joinStoreRoom,
    leaveStoreRoom
  };
};