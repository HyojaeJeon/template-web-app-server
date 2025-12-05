/**
 * ==================================================================================
 * NetworkProvider - 네트워크 연결 상태 관리
 * ==================================================================================
 *
 * 🎯 목적:
 * - 네트워크 연결 상태 실시간 감지
 * - 연결 끊김 시 사용자에게 Toast 알림
 * - 연결 복구 시 자동으로 Toast 제거 및 Apollo 쿼리 재시도
 *
 * 📊 동작 방식:
 * 1. NetInfo로 네트워크 상태 감지
 * 2. 연결 끊김 → 다국어 Toast 표시
 * 3. 연결 복구 → Toast 제거 + Apollo 쿼리 재시도
 *
 * 🔧 통합:
 * - Apollo Client handleNetworkStatusChange 활용
 * - Toast 시스템과 연동
 * - i18n 다국어 지원
 *
 * ==================================================================================
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useToast } from '@providers/ToastProvider';
import { handleNetworkStatusChange } from '@services/apollo/apolloClient';
import logger from '@shared/utils/system/logger';
import { useTranslation } from 'react-i18next';

// ==================================================================================
// 🎯 Context 생성
// ==================================================================================
const NetworkContext = createContext({
  isConnected: true,
  isInternetReachable: true,
  connectionType: 'unknown'
});

// ==================================================================================
// 🔧 NetworkProvider 컴포넌트
// ==================================================================================
export const NetworkProvider = ({ children }) => {
  const { t } = useTranslation(['network']);
  const { showToast, removeToast } = useToast();
  const [networkState, setNetworkState] = useState({
    isConnected: true,
    isInternetReachable: true,
    connectionType: 'unknown'
  });

  // Toast ID 관리 (중복 표시 방지)
  const networkToastIdRef = useRef(null);
  // 이전 연결 상태 추적 (상태 변화 감지용)
  const previousConnectedRef = useRef(true);

  useEffect(() => {
    // 네트워크 상태 변경 리스너
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state?.isConnected ?? false;
      const isInternetReachable = state?.isInternetReachable ?? false;
      const connectionType = state?.type ?? 'unknown';

      logger.info('🌐 네트워크 상태 변경:', {
        isConnected,
        isInternetReachable,
        connectionType,
        details: state?.details
      });

      // 상태 업데이트
      setNetworkState({
        isConnected,
        isInternetReachable,
        connectionType
      });

      // 실제 인터넷 연결 가능 여부 판단
      // - WiFi/Cellular 연결 + 인터넷 도달 가능 → 온라인
      // - 연결 끊김 또는 인터넷 도달 불가 → 오프라인
      const isOnline = isConnected && isInternetReachable;
      const wasOnline = previousConnectedRef.current;

      // 상태 변화가 있을 때만 처리
      if (wasOnline !== isOnline) {
        if (!isOnline) {
          // ❌ 오프라인 전환: Toast 표시
          logger.warn('❌ 네트워크 연결 끊김');

          // 기존 Toast가 있으면 제거
          if (networkToastIdRef.current) {
            removeToast(networkToastIdRef.current);
          }

          // 새로운 오프라인 Toast 표시
          const toastId = showToast('network:checkConnection', { type: 'error', duration: 0, position: 'top' });
          networkToastIdRef.current = toastId;
        } else {
          // ✅ 온라인 복구: Toast 제거 + Apollo 쿼리 재시도
          logger.info('✅ 네트워크 연결 복구');

          // 오프라인 Toast 제거
          if (networkToastIdRef.current) {
            removeToast(networkToastIdRef.current);
            networkToastIdRef.current = null;
          }

          // Apollo Client에 네트워크 복구 알림 (활성 쿼리 재시도)
          handleNetworkStatusChange(true);

          // 복구 Toast 표시 (1.5초 후 자동 제거)
          showToast('network:connectedDesc', { type: 'success', duration: 1500, position: 'top' });
        }

        // 이전 상태 업데이트
        previousConnectedRef.current = isOnline;
      }
    });

    // 초기 네트워크 상태 확인
    NetInfo.fetch().then((state) => {
      const isConnected = state?.isConnected ?? false;
      const isInternetReachable = state?.isInternetReachable ?? false;
      const connectionType = state?.type ?? 'unknown';

      logger.info('🌐 초기 네트워크 상태:', {
        isConnected,
        isInternetReachable,
        connectionType
      });

      setNetworkState({
        isConnected,
        isInternetReachable,
        connectionType
      });

      const isOnline = isConnected && isInternetReachable;
      previousConnectedRef.current = isOnline;

      // 초기 상태가 오프라인이면 Toast 표시
      if (!isOnline) {
        const toastId = showToast('network:checkConnection', { type: 'error', duration: 0, position: 'top' });
        networkToastIdRef.current = toastId;
      }
    });

    // 클린업
    return () => {
      unsubscribe();
      // Toast 정리
      if (networkToastIdRef.current) {
        removeToast(networkToastIdRef.current);
        networkToastIdRef.current = null;
      }
    };
  }, [t, showToast, removeToast]);

  return (
    <NetworkContext.Provider value={networkState}>
      {children}
    </NetworkContext.Provider>
  );
};

// ==================================================================================
// 🪝 useNetwork Hook
// ==================================================================================
/**
 * 네트워크 상태를 가져오는 Hook
 *
 * @returns {Object} 네트워크 상태
 * - isConnected: 네트워크 연결 여부
 * - isInternetReachable: 인터넷 도달 가능 여부
 * - connectionType: 연결 타입 (wifi, cellular, none 등)
 *
 * @example
 * const { isConnected, isInternetReachable } = useNetwork();
 * if (!isConnected) {
 *   // 오프라인 UI 표시
 * }
 */
export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};

// displayName 설정
NetworkProvider.displayName = 'NetworkProvider';

export default NetworkProvider;
