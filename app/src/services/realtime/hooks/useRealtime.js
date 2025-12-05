/**
 * useRealtime Hook
 * 실시간 통신 기능을 React 컴포넌트에서 쉽게 사용하기 위한 Hook
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import socketManager from '@services/realtime/SocketManager';
import { OUTGOING_EVENTS, CONNECTION_STATE } from '@services/realtime/constants/events';

/**
 * 기본 실시간 연결 Hook
 */
export const useRealtime = () => {
  const [connectionState, setConnectionState] = useState(CONNECTION_STATE.DISCONNECTED);
  const [error, setError] = useState(null);
  const isAuthenticated = useSelector(state => state.auth?.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const initializeConnection = async () => {
      try {
        setConnectionState(CONNECTION_STATE.CONNECTING);
        await socketManager.connect();
        setConnectionState(socketManager.isConnected ? CONNECTION_STATE.AUTHENTICATED : CONNECTION_STATE.DISCONNECTED);
        setError(null);
      } catch (err) {
        console.error('[useRealtime] Connection failed:', err);
        setConnectionState(CONNECTION_STATE.ERROR);
        setError(err.message);
      }
    };

    initializeConnection();

    // 연결 상태 리스너
    const handleConnectionChange = (state) => {
      setConnectionState(state);
    };

    // TODO: realtimeClient에 상태 변경 리스너 추가 필요

    return () => {
      // 컴포넌트 언마운트 시 정리하지 않음 (앱 전체에서 공유)
    };
  }, [isAuthenticated]);

  const emit = useCallback((event, data) => {
    return socketManager.emit(event, data);
  }, []);

  const on = useCallback((event, handler) => {
    socketManager.on(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    socketManager.off(event, handler);
  }, []);

  const joinRoom = useCallback((type, id) => {
    socketManager.joinRoom(type, id);
  }, []);

  const leaveRoom = useCallback((type, id) => {
    socketManager.leaveRoom(type, id);
  }, []);

  return {
    connectionState,
    isConnected: connectionState === CONNECTION_STATE.AUTHENTICATED,
    error,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
  };
};

/**
 * 채팅 전용 Hook
 */
export const useChat = (roomId) => {
  const { isConnected, emit, on, off, joinRoom, leaveRoom } = useRealtime();
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isConnected || !roomId) return;

    // 채팅방 참가
    joinRoom('chat', roomId);

    // 메시지 수신 핸들러
    const handleNewMessage = (data) => {
      if (data.roomId === roomId) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    // 타이핑 상태 핸들러
    const handleTypingStatus = (data) => {
      if (data.roomId === roomId) {
        if (data.isTyping) {
          setTypingUsers(prev => {
            const filtered = prev.filter(u => u.userId !== data.userId);
            return [...filtered, { userId: data.userId, userName: data.userName }];
          });
        } else {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }
      }
    };

    // 이벤트 등록
    on('chat:received', handleNewMessage);
    on('chat:typing_status', handleTypingStatus);

    return () => {
      // 정리
      off('chat:received', handleNewMessage);
      off('chat:typing_status', handleTypingStatus);
      leaveRoom('chat', roomId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isConnected, roomId, on, off, joinRoom, leaveRoom]);

  // 메시지 전송
  const sendMessage = useCallback((content, type = 'text', attachments = []) => {
    if (!isConnected || !roomId) return false;

    return emit(OUTGOING_EVENTS.CHAT.SEND_MESSAGE, {
      roomId,
      content,
      type,
      attachments,
    });
  }, [isConnected, roomId, emit]);

  // 타이핑 시작
  const startTyping = useCallback(() => {
    if (!isConnected || !roomId) return;

    emit(OUTGOING_EVENTS.CHAT.TYPING_START, { roomId });

    // 3초 후 자동으로 타이핑 중지
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [isConnected, roomId, emit]);

  // 타이핑 중지
  const stopTyping = useCallback(() => {
    if (!isConnected || !roomId) return;

    emit(OUTGOING_EVENTS.CHAT.TYPING_STOP, { roomId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [isConnected, roomId, emit]);

  // 메시지 읽음 처리
  const markAsRead = useCallback((messageIds) => {
    if (!isConnected || !roomId) return;

    emit(OUTGOING_EVENTS.CHAT.MARK_READ, {
      roomId,
      messageIds,
    });
  }, [isConnected, roomId, emit]);

  return {
    isConnected,
    messages,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
  };
};

/**
 * 알림 전용 Hook
 */
export const useNotifications = () => {
  const { isConnected, emit, on, off } = useRealtime();
  const notifications = useSelector(state => state.notification?.notifications || []);
  const unreadCount = useSelector(state => state.notification?.unreadCount || 0);

  // 알림 읽음 처리
  const markAsRead = useCallback((notificationId) => {
    if (!isConnected) return;

    emit(OUTGOING_EVENTS.NOTIFICATION.MARK_READ, {
      notificationId,
    });
  }, [isConnected, emit]);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(() => {
    if (!isConnected) return;

    emit(OUTGOING_EVENTS.NOTIFICATION.MARK_ALL_READ);
  }, [isConnected, emit]);

  return {
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
};