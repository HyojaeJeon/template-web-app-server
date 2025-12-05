/**
 * useNotificationSystem.js - 점주앱 알림 시스템 통합 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 *
 * @description
 * - FCM (Firebase Cloud Messaging) 푸시 알림 관리
 * - 브라우저 알림 권한 및 서비스 워커 통합
 * - WebSocket 실시간 연결 상태 모니터링
 * - 알림 설정 페이지 전용 시스템 상태 관리
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUnifiedSocket } from '@/providers/UnifiedSocketProvider';
import { useAuth } from './useAuth';
import { browserNotificationService } from '@/shared/services/browserNotificationService';

/**
 * 알림 시스템 상태 관리 훅
 * @param {string} userId 사용자 ID (현재는 사용하지 않지만 확장성을 위해 유지)
 * @returns {Object} 알림 시스템 상태 및 제어 함수
 */
export const useNotificationSystem = (userId) => {
  const { storeAccount, isAuthenticated } = useAuth();
  const socket = useUnifiedSocket();

  // ============ 상태 관리 ============
  const [isInitialized, setIsInitialized] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('default'); // 'default' | 'granted' | 'denied'
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);

  // ============ 브라우저 알림 권한 확인 ============
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setError('이 브라우저는 알림을 지원하지 않습니다');
      return;
    }

    // 현재 권한 상태 확인
    setPermissionStatus(Notification.permission);
  }, []);

  // ============ 초기화 ============
  useEffect(() => {
    if (!isAuthenticated || !storeAccount) {
      setIsInitialized(false);
      return;
    }

    const initializeNotificationSystem = async () => {
      try {
        // 브라우저 알림 지원 확인
        if (!browserNotificationService.isNotificationSupported()) {
          throw new Error('브라우저가 알림을 지원하지 않습니다');
        }

        // 현재 권한 상태 확인
        const settings = browserNotificationService.getSettings();
        setPermissionStatus(settings.permission);

        // FCM 토큰이 있다면 가져오기 (실제 FCM 구현 시)
        // const token = await getFCMToken();
        // setFcmToken(token);

        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize notification system:', err);
        setError(err?.message || '알림 시스템 초기화 실패');
        setIsInitialized(false);
      }
    };

    initializeNotificationSystem();
  }, [isAuthenticated, storeAccount]);

  // ============ 알림 권한 요청 ============
  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setError('이 브라우저는 알림을 지원하지 않습니다');
      return { success: false, error: '브라우저 미지원' };
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        // FCM 토큰 등록 (실제 FCM 구현 시)
        // const token = await browserNotificationService.getToken();
        // setFcmToken(token);

        setError(null);
        return { success: true, permission };
      } else {
        setError('알림 권한이 거부되었습니다');
        return { success: false, permission };
      }
    } catch (err) {
      console.error('Failed to request notification permission:', err);
      setError(err?.message || '권한 요청 실패');
      return { success: false, error: err?.message };
    }
  }, []);

  // ============ FCM 토큰 갱신 (추후 구현) ============
  const refreshFcmToken = useCallback(async () => {
    try {
      // FCM 토큰 갱신 로직
      // const newToken = await browserNotificationService.refreshToken();
      // setFcmToken(newToken);

      return { success: true };
    } catch (err) {
      console.error('Failed to refresh FCM token:', err);
      return { success: false, error: err?.message };
    }
  }, []);

  // ============ 테스트 알림 발송 ============
  const sendTestNotification = useCallback(async (title = '테스트 알림', body = '알림 시스템이 정상 작동합니다') => {
    if (permissionStatus !== 'granted') {
      return { success: false, error: '알림 권한이 필요합니다' };
    }

    try {
      await browserNotificationService.showNotification({
        title,
        body,
        icon: '/logo.png',
        tag: 'test-notification'
      });

      return { success: true };
    } catch (err) {
      console.error('Failed to send test notification:', err);
      return { success: false, error: err?.message };
    }
  }, [permissionStatus]);

  // ============ 컴포넌트 언마운트 시 정리 ============
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ============ 반환 값 ============
  return {
    // 시스템 상태
    isInitialized,
    isConnected: socket?.state?.isConnected || false,
    fcmToken,
    permissionStatus,
    error,

    // 제어 함수
    requestPermission,
    refreshFcmToken,
    sendTestNotification,

    // 유틸리티
    isBrowserSupported: typeof window !== 'undefined' && 'Notification' in window,
    isPermissionGranted: permissionStatus === 'granted'
  };
};

export default useNotificationSystem;
