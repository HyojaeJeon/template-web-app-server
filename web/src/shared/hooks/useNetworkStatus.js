/**
 * 네트워크 상태 감지 및 오프라인/온라인 상태 관리 훅
 * 오프라인 모드 지원, 데이터 동기화, 사용자 알림
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * 네트워크 품질 상태
 */
const NETWORK_QUALITY = {
  EXCELLENT: 'excellent', // < 100ms, > 10Mbps
  GOOD: 'good',          // < 200ms, > 5Mbps
  FAIR: 'fair',          // < 500ms, > 1Mbps
  POOR: 'poor',          // > 500ms, < 1Mbps
  OFFLINE: 'offline'     // 연결 없음
};

/**
 * 연결 타입별 설정
 */
const CONNECTION_TYPES = {
  '4g': { label: '4G', icon: '📶', priority: 4 },
  '3g': { label: '3G', icon: '📶', priority: 3 },
  '2g': { label: '2G', icon: '📶', priority: 2 },
  'wifi': { label: 'Wi-Fi', icon: '📶', priority: 5 },
  'ethernet': { label: 'Ethernet', icon: '🌐', priority: 6 },
  'unknown': { label: 'Unknown', icon: '📡', priority: 1 }
};

/**
 * 네트워크 상태 훅
 */
export const useNetworkStatus = (options = {}) => {
  const {
    onOnline = null,
    onOffline = null,
    onQualityChange = null,
    pingInterval = 300000, // 5분마다 핑 테스트 (서버 부하 최소화)
    enableQualityCheck = false // 핑 테스트 기본값을 false로 변경
  } = options;

  // 상태 관리
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [networkQuality, setNetworkQuality] = useState(NETWORK_QUALITY.GOOD);
  const [connectionType, setConnectionType] = useState('unknown');
  const [latency, setLatency] = useState(null);
  const [downlink, setDownlink] = useState(null);
  const [effectiveType, setEffectiveType] = useState('4g');
  const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  /**
   * 핑 테스트로 네트워크 품질 측정
   */
  const measureNetworkQuality = useCallback(async () => {
    if (!isOnline) {
      setNetworkQuality(NETWORK_QUALITY.OFFLINE);
      return;
    }

    try {
      const start = Date.now();
      
      // 서버 상태 확인으로 네트워크 품질 측정 (프록시 사용)
      const pingUrl = `/api/health?t=${start}`;
      
      await fetch(pingUrl, {
        method: 'GET',
        cache: 'no-cache',
        mode: 'cors'
      });

      const latencyMs = Date.now() - start;
      setLatency(latencyMs);

      // 네트워크 품질 결정
      let quality;
      if (latencyMs < 100) {
        quality = NETWORK_QUALITY.EXCELLENT;
      } else if (latencyMs < 200) {
        quality = NETWORK_QUALITY.GOOD;
      } else if (latencyMs < 500) {
        quality = NETWORK_QUALITY.FAIR;
      } else {
        quality = NETWORK_QUALITY.POOR;
      }

      setNetworkQuality(quality);

    } catch (error) {
      console.warn('네트워크 품질 측정 실패:', error);
      setNetworkQuality(NETWORK_QUALITY.POOR);
    }
  }, [isOnline]);

  /**
   * 연결 정보 업데이트
   */
  const updateConnectionInfo = useCallback(() => {
    if (typeof navigator === 'undefined') return;

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      setConnectionType(connection.type || connection.effectiveType || 'unknown');
      setDownlink(connection.downlink);
      setEffectiveType(connection.effectiveType);
    }
  }, []);

  /**
   * 재연결 시도
   */
  const attemptReconnection = useCallback(async () => {
    if (isReconnecting) return;
    
    setIsReconnecting(true);
    setReconnectAttempts(prev => prev + 1);

    try {
      await measureNetworkQuality();
      
      if (navigator.onLine) {
        setIsOnline(true);
        setReconnectAttempts(0);
        setLastOnlineTime(Date.now());
        
        if (onOnline) {
          onOnline();
        }
      }
    } catch (error) {
      console.warn('재연결 실패:', error);
    } finally {
      setIsReconnecting(false);
    }
  }, [isReconnecting, measureNetworkQuality, onOnline]);

  /**
   * 온라인 상태 변경 핸들러
   */
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnlineTime(Date.now());
    setReconnectAttempts(0);
    updateConnectionInfo();
    
    // 핑 테스트 제거 - 브라우저 기본 감지만 사용
    setNetworkQuality(NETWORK_QUALITY.GOOD); // 기본값으로 설정

    if (onOnline) {
      onOnline();
    }
  }, [updateConnectionInfo, onOnline]);

  /**
   * 오프라인 상태 변경 핸들러
   */
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setNetworkQuality(NETWORK_QUALITY.OFFLINE);
    
    if (onOffline) {
      onOffline();
    }
  }, [onOffline]);

  /**
   * 연결 변경 핸들러
   */
  const handleConnectionChange = useCallback(() => {
    updateConnectionInfo();
    
    // 핑 테스트 제거 - 연결 정보만 업데이트
  }, [updateConnectionInfo]);

  // 이벤트 리스너 등록
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 온라인/오프라인 이벤트
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 연결 변경 이벤트
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // 초기 상태 설정 (핑 테스트 제거)
    updateConnectionInfo();
    
    // 핑 테스트는 제거 - 브라우저 기본 API만 사용

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [handleOnline, handleOffline, handleConnectionChange, updateConnectionInfo, measureNetworkQuality, enableQualityCheck, isOnline]);

  // 주기적 네트워크 품질 체크 - 완전 비활성화
  useEffect(() => {
    // 핑 테스트는 불필요하므로 완전히 비활성화
    // 브라우저의 navigator.onLine과 connection API로 충분함
    return;
  }, []);

  // 네트워크 품질 변경 콜백
  useEffect(() => {
    if (onQualityChange) {
      onQualityChange(networkQuality);
    }
  }, [networkQuality, onQualityChange]);

  /**
   * 수동 재연결 시도
   */
  const reconnect = useCallback(() => {
    if (!isReconnecting) {
      attemptReconnection();
    }
  }, [attemptReconnection, isReconnecting]);

  /**
   * 네트워크 상태 요약 정보
   */
  const getNetworkInfo = useCallback(() => {
    const connectionInfo = CONNECTION_TYPES[connectionType] || CONNECTION_TYPES.unknown;
    
    return {
      isOnline,
      networkQuality,
      connectionType,
      connectionInfo,
      latency,
      downlink,
      effectiveType,
      lastOnlineTime,
      reconnectAttempts,
      isReconnecting,
      // 상태 아이콘
      statusIcon: isOnline 
        ? (networkQuality === NETWORK_QUALITY.EXCELLENT ? '🟢' :
           networkQuality === NETWORK_QUALITY.GOOD ? '🟡' :
           networkQuality === NETWORK_QUALITY.FAIR ? '🟠' : '🔴')
        : '⚫',
      // 상태 텍스트 (Local어)
      statusText: isOnline 
        ? (networkQuality === NETWORK_QUALITY.EXCELLENT ? 'Tuyệt vời' :
           networkQuality === NETWORK_QUALITY.GOOD ? 'Tốt' :
           networkQuality === NETWORK_QUALITY.FAIR ? 'Khá' : 'Kém')
        : 'Ngoại tuyến'
    };
  }, [
    isOnline, networkQuality, connectionType, latency, downlink, 
    effectiveType, lastOnlineTime, reconnectAttempts, isReconnecting
  ]);

  return {
    // 상태
    isOnline,
    networkQuality,
    connectionType,
    latency,
    downlink,
    effectiveType,
    lastOnlineTime,
    reconnectAttempts,
    isReconnecting,
    
    // 액션
    reconnect,
    measureNetworkQuality,
    
    // 유틸리티
    getNetworkInfo,
    
    // 상수
    NETWORK_QUALITY,
    CONNECTION_TYPES
  };
};

export default useNetworkStatus;