/**
 * UnifiedSocketProvider
 * ======================
 * Socket.IO 실시간 통신을 위한 React Context Provider
 *
 * 주요 기능:
 * 1. Socket.IO 연결 생명주기 관리
 * 2. 인증 토큰 기반 자동 연결/재연결
 * 3. 네트워크 상태 감지 및 대응
 * 4. 앱 상태(포그라운드/백그라운드) 처리
 * 5. 도메인별 룸 관리 (채팅 등)
 */

import { createContext, useContext, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import socketManager, { CONNECTION_STATE } from '@services/realtime/SocketManager';
import { useToast } from '@providers/ToastProvider';

// ============================================
// Socket Context 생성
// ============================================
const SocketContext = createContext(null);

/**
 * UnifiedSocketProvider Component
 */
export const UnifiedSocketProvider = ({ children }) => {
  // ============================================
  // Redux 상태 구독
  // ============================================
  const isAuthenticated = useSelector(state => state.auth?.isAuthenticated);
  const accessToken = useSelector(state => state.auth?.accessToken);
  const currentUserId = useSelector(state => state.auth?.user?.id);

  const { showToast } = useToast();

  // ============================================
  // Socket 연결 옵션 설정
  // ============================================
  const socketOptions = useMemo(() => ({
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
  }), []);

  // ============================================
  // 외부 스토어 구독 (React 18+ 패턴)
  // ============================================
  const subscribe = useCallback((cb) => socketManager.subscribe(cb), []);
  const getSnapshot = useCallback(() => socketManager.getSnapshot(), []);
  const { status, error } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // ============================================
  // Effect 1: 인증 상태 변화 처리
  // ============================================
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      socketManager.setToken(accessToken);

      const currentStatus = socketManager.getSnapshot().status;
      if (currentStatus === CONNECTION_STATE.CONNECTING || currentStatus === CONNECTION_STATE.AUTHENTICATED) {
        return;
      }

      if (!socketManager.isConnected()) {
        socketManager.connect(accessToken, socketOptions)
          .catch(err => {
            console.error('[UnifiedSocketProvider] Connection failed:', err);
            if (!err.message?.includes('Authentication')) {
              showToast('NETWORK_ERROR');
            }
          });
      }
    } else {
      socketManager.disconnect();
    }
  }, [isAuthenticated, accessToken, socketOptions, showToast]);

  // ============================================
  // Effect 2: 네트워크 상태 변화 감지
  // ============================================
  useEffect(() => {
    let reconnectTimer = null;

    const unsubscribe = NetInfo.addEventListener(state => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      if (!state.isConnected) {
        socketManager.disconnect();
      } else if (state.isConnected && isAuthenticated && accessToken) {
        const currentStatus = socketManager.getSnapshot().status;
        if (currentStatus === CONNECTION_STATE.CONNECTING || currentStatus === CONNECTION_STATE.AUTHENTICATED) {
          return;
        }

        reconnectTimer = setTimeout(() => {
          if (!socketManager.isConnected()) {
            socketManager.connect(accessToken, socketOptions).catch(console.error);
          }
        }, 1000);
      }
    });

    return () => {
      unsubscribe();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [isAuthenticated, accessToken, socketOptions]);

  // ============================================
  // Effect 3: 앱 상태 변화 감지
  // ============================================
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && isAuthenticated && accessToken) {
        const currentStatus = socketManager.getSnapshot().status;
        if (currentStatus === CONNECTION_STATE.CONNECTING || currentStatus === CONNECTION_STATE.AUTHENTICATED) {
          if (socketManager.isConnected()) {
            socketManager.emit('app:state', { state: 'foreground' });
          }
          return;
        }

        if (!socketManager.isConnected()) {
          socketManager.connect(accessToken, socketOptions)
            .then(() => socketManager.emit('app:state', { state: 'foreground' }))
            .catch(console.error);
        }
      } else if (nextAppState === 'background') {
        if (socketManager.isConnected()) {
          socketManager.emit('app:state', { state: 'background' });
        }
      }
    });

    return () => subscription?.remove();
  }, [isAuthenticated, accessToken, socketOptions]);

  // ============================================
  // 이벤트 핸들러 등록 (확장 가능한 구조)
  // ============================================
  // 채팅 메시지 수신 핸들러
  const handleChatReceived = useCallback((message) => {
    __DEV__ && console.log('[Socket] chat:received:', message?.id);
    // TODO: 채팅 메시지 처리 로직 구현
    // - Apollo Cache 업데이트
    // - Reactive Variable 업데이트
    // - 알림 처리
  }, []);

  // 채팅 타이핑 상태 핸들러
  const handleChatTyping = useCallback((data) => {
    __DEV__ && console.log('[Socket] chat:typing:', data?.roomId);
    // TODO: 타이핑 상태 처리 로직 구현
  }, []);

  // 그룹 채팅 메시지 수신 핸들러
  const handleGroupChatReceived = useCallback((message) => {
    __DEV__ && console.log('[Socket] group:chat:received:', message?.id);
    // TODO: 그룹 채팅 메시지 처리 로직 구현
  }, []);

  // ============================================
  // Effect 4: Socket 이벤트 리스너 등록
  // ============================================
  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return;
    if (status !== CONNECTION_STATE.AUTHENTICATED) return;

    // 채팅 이벤트 등록
    const chatReceivedHandlers = socketManager.eventHandlers.get('chat:received');
    if (!chatReceivedHandlers?.has(handleChatReceived)) {
      socketManager.on('chat:received', handleChatReceived);
    }

    const chatTypingHandlers = socketManager.eventHandlers.get('chat:typing');
    if (!chatTypingHandlers?.has(handleChatTyping)) {
      socketManager.on('chat:typing', handleChatTyping);
    }

    // 그룹 채팅 이벤트 등록
    const groupChatHandlers = socketManager.eventHandlers.get('group:chat:received');
    if (!groupChatHandlers?.has(handleGroupChatReceived)) {
      socketManager.on('group:chat:received', handleGroupChatReceived);
    }

    __DEV__ && console.log('[UnifiedSocketProvider] Event listeners registered');
  }, [isAuthenticated, currentUserId, status, handleChatReceived, handleChatTyping, handleGroupChatReceived]);

  // ============================================
  // Effect 5: 컴포넌트 언마운트 시 정리
  // ============================================
  useEffect(() => {
    return () => {
      socketManager.off('chat:received', handleChatReceived);
      socketManager.off('chat:typing', handleChatTyping);
      socketManager.off('group:chat:received', handleGroupChatReceived);
      __DEV__ && console.log('[UnifiedSocketProvider] Listeners removed');
    };
  }, [handleChatReceived, handleChatTyping, handleGroupChatReceived]);

  // ============================================
  // Context Value 생성
  // ============================================
  const value = useMemo(() => ({
    // 연결 상태
    isConnected: status === CONNECTION_STATE.AUTHENTICATED,
    isConnecting: status === CONNECTION_STATE.CONNECTING,
    connectionState: status,
    connectionError: error,

    // 기본 Socket.IO 메서드
    emit: socketManager.emit.bind(socketManager),
    on: socketManager.on.bind(socketManager),
    off: socketManager.off.bind(socketManager),

    // 룸 관리
    joinRoom: socketManager.joinRoom.bind(socketManager),
    leaveRoom: socketManager.leaveRoom.bind(socketManager),

    // 채팅 헬퍼
    joinChat: (chatId) => socketManager.joinRoom('chat', chatId),
    leaveChat: (chatId) => socketManager.leaveRoom('chat', chatId),

    // 그룹 채팅 헬퍼
    joinGroupChat: (groupId) => socketManager.joinRoom('group', groupId),
    leaveGroupChat: (groupId) => socketManager.leaveRoom('group', groupId),

    // 연결 관리
    reconnect: () => {
      if (accessToken) {
        socketManager.connect(accessToken, socketOptions)
          .catch(err => {
            console.error('[Socket] Reconnect failed:', err);
            showToast('NETWORK_ERROR');
          });
      }
    },
    disconnect: socketManager.disconnect.bind(socketManager),

    // 디버깅 (개발 환경만)
    ...(__DEV__ ? {
      rooms: socketManager.getConnectionState().rooms
    } : {})
  }), [status, error, accessToken, socketOptions, showToast]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * useSocket Hook
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within UnifiedSocketProvider');
  }
  return context;
};

export default UnifiedSocketProvider;
