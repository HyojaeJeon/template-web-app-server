/**
 * AppStateProvider
 * ================
 * 앱의 포그라운드/백그라운드 상태를 전역으로 관리하는 Provider
 *
 * 주요 기능:
 * 1. AppState 변화 감지 및 전역 상태 관리
 * 2. 백그라운드 진입/복귀 시 콜백 실행
 * 3. 실시간 앱 상태 조회 API 제공
 *
 * 사용 사례:
 * - Socket.IO: 포그라운드에서만 실시간 알림 처리
 * - FCM: 백그라운드에서 푸시 알림 수신
 * - Analytics: 앱 사용 시간 추적
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import logger from '@shared/utils/system/logger';

// ============================================
// Context 생성
// ============================================
const AppStateContext = createContext(null);

/**
 * AppStateProvider Component
 * --------------------------
 * 앱 상태를 추적하고 하위 컴포넌트에 제공
 *
 * @param {Object} props
 * @param {ReactNode} props.children - 하위 컴포넌트
 */
export const AppStateProvider = ({ children }) => {
  // ============================================
  // 상태 관리
  // ============================================
  // 현재 앱 상태: 'active' | 'background' | 'inactive'
  const [appState, setAppState] = useState(AppState.currentState);

  // 포그라운드 여부 (active 상태만 true)
  const [isForeground, setIsForeground] = useState(
    AppState.currentState === 'active'
  );

  // 마지막 앱 상태 변경 시간
  const [lastStateChange, setLastStateChange] = useState(Date.now());

  // AppState subscription ref
  const appStateSubscription = useRef(null);

  // ============================================
  // 앱 상태 변화 핸들러
  // ============================================
  const handleAppStateChange = useCallback((nextAppState) => {
    const previousState = appState;

    logger.info('[AppStateProvider] 📱 App state changed:', {
      from: previousState,
      to: nextAppState,
      timestamp: new Date().toISOString()
    });

    // 상태 업데이트
    setAppState(nextAppState);
    setIsForeground(nextAppState === 'active');
    setLastStateChange(Date.now());

    // ============================================
    // 백그라운드 → 포그라운드 복귀
    // ============================================
    if (
      (previousState === 'background' || previousState === 'inactive') &&
      nextAppState === 'active'
    ) {
      logger.info('[AppStateProvider] ✅ App became FOREGROUND');

      // 포그라운드 복귀 이벤트 발생
      // TODO: 필요시 이벤트 리스너 호출
    }

    // ============================================
    // 포그라운드 → 백그라운드 진입
    // ============================================
    if (
      previousState === 'active' &&
      (nextAppState === 'background' || nextAppState === 'inactive')
    ) {
      logger.info('[AppStateProvider] 🌑 App went to BACKGROUND');

      // 백그라운드 진입 이벤트 발생
      // TODO: 필요시 이벤트 리스너 호출
    }
  }, [appState]);

  // ============================================
  // AppState 리스너 등록
  // ============================================
  useEffect(() => {
    logger.info('[AppStateProvider] 🚀 Initializing AppState listener');

    // 초기 상태 설정
    const currentState = AppState.currentState;
    setAppState(currentState);
    setIsForeground(currentState === 'active');

    // AppState 변화 리스너 등록
    appStateSubscription.current = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    logger.info('[AppStateProvider] ✅ AppState listener registered:', {
      initialState: currentState,
      isForeground: currentState === 'active'
    });

    // Cleanup: 컴포넌트 언마운트 시 리스너 제거
    return () => {
      if (appStateSubscription.current) {
        appStateSubscription.current.remove();
        logger.info('[AppStateProvider] 🗑️ AppState listener removed');
      }
    };
  }, [handleAppStateChange]);

  // ============================================
  // Context Value
  // ============================================
  const value = {
    // 현재 앱 상태
    appState,

    // 포그라운드 여부 (boolean)
    isForeground,

    // 백그라운드 여부 (boolean)
    isBackground: !isForeground,

    // 마지막 상태 변경 시간 (timestamp)
    lastStateChange,

    // 앱 상태 체크 함수
    isAppActive: () => AppState.currentState === 'active',
    isAppBackground: () => AppState.currentState !== 'active'
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

/**
 * useAppState Hook
 * ----------------
 * 앱 상태를 조회하기 위한 커스텀 훅
 *
 * @returns {Object} 앱 상태 정보
 * @returns {string} .appState - 현재 앱 상태
 * @returns {boolean} .isForeground - 포그라운드 여부
 * @returns {boolean} .isBackground - 백그라운드 여부
 * @returns {number} .lastStateChange - 마지막 상태 변경 시간
 * @returns {Function} .isAppActive - 앱이 활성 상태인지 확인
 * @returns {Function} .isAppBackground - 앱이 백그라운드 상태인지 확인
 *
 * 사용 예시:
 * ```javascript
 * const MyComponent = () => {
 *   const { isForeground, isBackground } = useAppState();
 *
 *   useEffect(() => {
 *     if (isForeground) {
 *       console.log('App is in foreground');
 *     } else {
 *       console.log('App is in background');
 *     }
 *   }, [isForeground]);
 * };
 * ```
 */
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

export default AppStateProvider;
