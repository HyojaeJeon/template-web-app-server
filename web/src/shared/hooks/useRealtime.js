/**
 * useRealtime Hook - UnifiedSocketProvider 호환성 래퍼
 * 
 * 기존 useRealtime API를 유지하면서 UnifiedSocketProvider와 통합
 * Local 배달 앱 MVP - 실시간 기능 호환성 보장
 */

'use client';

import { useMemo } from 'react';
import { useUnifiedSocket } from '../../providers/UnifiedSocketProvider';

/**
 * useRealtime Hook
 * 
 * 기존 코드와의 호환성을 위해 useUnifiedSocket을 래핑
 * UnifiedSocketProvider의 기능을 useRealtime 인터페이스로 제공
 */
export const useRealtime = () => {
  const unifiedSocket = useUnifiedSocket();

  // 기존 useRealtime API와 호환되는 인터페이스 제공
  const realtimeApi = useMemo(() => ({
    // 연결 상태
    isConnected: unifiedSocket.isConnected,
    connected: unifiedSocket.isConnected, // 별칭
    connectionStatus: unifiedSocket.isConnected ? 'connected' : 'disconnected',
    connectionQuality: unifiedSocket.connectionQuality,
    latency: unifiedSocket.latency,
    
    // 구독/구독해제 (기존 API 호환성)
    subscribe: (eventName, callback, namespace = '/main') => {
      return unifiedSocket.subscribeToRealtime(eventName, callback, namespace);
    },
    
    unsubscribe: (eventName, callback, namespace = '/main') => {
      return unifiedSocket.unsubscribeFromRealtime(eventName, callback, namespace);
    },
    
    // 메시지 전송 (기존 API 호환성)
    emit: (event, data, namespace = '/main') => {
      return unifiedSocket.sendMessage(event, data, namespace);
    },
    
    send: (event, data, namespace = '/main') => {
      return unifiedSocket.sendMessage(event, data, namespace);
    },
    
    // 채팅 관련 기능
    sendMessage: unifiedSocket.sendChatMessage,
    markAsRead: unifiedSocket.markMessageAsRead,
    startTyping: unifiedSocket.startTyping,
    stopTyping: unifiedSocket.stopTyping,
    
    // 주문 관리
    updateOrderStatus: unifiedSocket.updateOrderStatus,
    
    // 방 관리
    joinRoom: unifiedSocket.joinRoom,
    leaveRoom: unifiedSocket.leaveRoom,
    joinChatRoom: unifiedSocket.joinChatRoom,
    leaveChatRoom: unifiedSocket.leaveChatRoom,
    
    // 상태 정보
    stats: unifiedSocket.stats,
    getConnectionInfo: unifiedSocket.getConnectionInfo,
    
    // 실시간 이벤트 데이터
    chatEvents: unifiedSocket.chatEvents || [],
    orderEvents: unifiedSocket.orderEvents || [],
    notifications: unifiedSocket.notifications || [],
    
    // 네임스페이스 상태
    namespaces: unifiedSocket.namespaces,
    isNamespaceConnected: unifiedSocket.isNamespaceConnected,
    
    // 연결 관리 (기존 API 호환성)
    connect: unifiedSocket.connect,
    disconnect: unifiedSocket.disconnect,
    
    // 설정
    settings: unifiedSocket.settings,
    updateSettings: unifiedSocket.updateSettings,
    
    // 알림
    playNotificationSound: unifiedSocket.playNotificationSound,
    
    // 성능 모니터링
    getPerformanceMetrics: unifiedSocket.getPerformanceMetrics,
    resetPerformanceMetrics: unifiedSocket.resetPerformanceMetrics,
    
    // Local 특화 기능
    enableVietnameseOptimization: unifiedSocket.enableVietnameseOptimization,
    adaptToNetworkQuality: unifiedSocket.adaptToNetworkQuality,
    
    // 우선순위 메시지 (고급 기능)
    sendUrgentMessage: unifiedSocket.sendUrgentMessage,
    sendBatchedMessage: unifiedSocket.sendBatchedMessage,
    sendHighPriorityMessage: unifiedSocket.sendHighPriorityMessage,
    
    // 퀴ック 응답 (채팅 기능)
    sendQuickReply: unifiedSocket.sendQuickReply,
    
    // 모니터링 메트릭
    sendMonitoringMetric: unifiedSocket.sendMonitoringMetric,
    
    // 레거시 호환성을 위한 별칭들
    on: (eventName, callback, namespace = '/main') => {
      return unifiedSocket.subscribeToRealtime(eventName, callback, namespace);
    },
    
    off: (eventName, callback, namespace = '/main') => {
      return unifiedSocket.unsubscribeFromRealtime(eventName, callback, namespace);
    },
    
    // 연결 이벤트 헬퍼
    onConnect: (callback) => {
      return unifiedSocket.subscribeToRealtime('connect', callback);
    },
    
    onDisconnect: (callback) => {
      return unifiedSocket.subscribeToRealtime('disconnect', callback);
    },
    
    onReconnect: (callback) => {
      return unifiedSocket.subscribeToRealtime('reconnect', callback);
    },
    
    // 채팅 이벤트 헬퍼
    onNewMessage: (callback) => {
      return unifiedSocket.subscribeToRealtime('chat:new_message', callback, '/chat');
    },
    
    onOrderUpdate: (callback) => {
      return unifiedSocket.subscribeToRealtime('order:status_updated', callback);
    },
    
    onNewOrder: (callback) => {
      return unifiedSocket.subscribeToRealtime('order:created', callback);
    },
    
    // 유틸리티 함수들
    isReady: () => unifiedSocket.isConnected && unifiedSocket.isNamespaceConnected('/main'),
    
    getChatStatus: () => ({
      connected: unifiedSocket.isNamespaceConnected('/chat'),
      messageCount: unifiedSocket.chatEvents?.length || 0,
      lastMessage: unifiedSocket.chatEvents?.[0] || null
    }),
    
    getOrderStatus: () => ({
      connected: unifiedSocket.isConnected,
      orderCount: unifiedSocket.orderEvents?.length || 0,
      lastOrder: unifiedSocket.orderEvents?.[0] || null
    }),
    
    // 디버깅 도구 (개발 환경)
    debug: process.env.NODE_ENV === 'development' ? {
      logConnectionInfo: () => {
        console.log('🔌 useRealtime 연결 정보:', unifiedSocket.getConnectionInfo());
      },
      logPerformanceMetrics: () => {
        console.log('📊 useRealtime 성능 메트릭:', unifiedSocket.getPerformanceMetrics());
      },
      logCurrentState: () => {
        console.log('📋 useRealtime 현재 상태:', {
          connected: unifiedSocket.isConnected,
          namespaces: unifiedSocket.namespaces,
          stats: unifiedSocket.stats,
          chatEvents: unifiedSocket.chatEvents?.length || 0,
          orderEvents: unifiedSocket.orderEvents?.length || 0,
          notifications: unifiedSocket.notifications?.length || 0
        });
      }
    } : {}
    
  }), [unifiedSocket]);

  return realtimeApi;
};

export default useRealtime;