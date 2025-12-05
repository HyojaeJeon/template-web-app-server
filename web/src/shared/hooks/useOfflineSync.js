/**
 * 오프라인 데이터 동기화 훅
 * 오프라인 상태에서 데이터 저장, 온라인 복귀 시 자동 동기화
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useNetworkStatus from './useNetworkStatus';

/**
 * 동기화 상태
 */
const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error'
};

/**
 * 동기화 우선순위
 */
const SYNC_PRIORITY = {
  HIGH: 1,    // 주문, 결제 등 중요한 데이터
  MEDIUM: 2,  // 메뉴, 고객 정보
  LOW: 3      // 로그, 통계 등
};

/**
 * 오프라인 동기화 훅
 */
export const useOfflineSync = (options = {}) => {
  const {
    storageKey = 'offline_sync_queue',
    maxRetries = 3,
    retryDelay = 5000,
    enableStorage = true,
    onSyncStart = null,
    onSyncComplete = null,
    onSyncError = null
  } = options;

  const { isOnline } = useNetworkStatus();
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE);
  const [syncQueue, setSyncQueue] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncStats, setSyncStats] = useState({
    totalItems: 0,
    syncedItems: 0,
    failedItems: 0
  });

  const syncInProgressRef = useRef(false);
  const retryTimeoutRef = useRef(null);

  /**
   * 로컬 스토리지에서 동기화 큐 로드
   */
  const loadSyncQueue = useCallback(() => {
    if (!enableStorage || typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('동기화 큐 로드 실패:', error);
      return [];
    }
  }, [storageKey, enableStorage]);

  /**
   * 로컬 스토리지에 동기화 큐 저장
   */
  const saveSyncQueue = useCallback((queue) => {
    if (!enableStorage || typeof window === 'undefined') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(queue));
    } catch (error) {
      console.error('동기화 큐 저장 실패:', error);
    }
  }, [storageKey, enableStorage]);

  /**
   * 동기화 아이템을 큐에 추가
   */
  const addToSyncQueue = useCallback((item) => {
    const syncItem = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      retryCount: 0,
      priority: item.priority || SYNC_PRIORITY.MEDIUM,
      ...item
    };

    setSyncQueue(prev => {
      const newQueue = [...prev, syncItem];
      // 우선순위로 정렬 (숫자가 낮을수록 높은 우선순위)
      newQueue.sort((a, b) => a.priority - b.priority);
      saveSyncQueue(newQueue);
      return newQueue;
    });

    return syncItem.id;
  }, [saveSyncQueue]);

  /**
   * 동기화 아이템을 큐에서 제거
   */
  const removeFromSyncQueue = useCallback((itemId) => {
    setSyncQueue(prev => {
      const newQueue = prev.filter(item => item.id !== itemId);
      saveSyncQueue(newQueue);
      return newQueue;
    });
  }, [saveSyncQueue]);

  /**
   * 개별 아이템 동기화 수행
   */
  const syncItem = useCallback(async (item) => {
    const { type, data, endpoint, method = 'POST', priority } = item;

    try {
      // API 호출 시뮬레이션 (실제로는 GraphQL mutation이나 REST API 호출)
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          // JWT 토큰 등 인증 헤더 추가
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // 성공 시 큐에서 제거
      removeFromSyncQueue(item.id);
      
      return { success: true, result };

    } catch (error) {
      console.error(`동기화 실패 - ${type}:`, error);
      
      // 재시도 횟수 증가
      setSyncQueue(prev => {
        const newQueue = prev.map(queueItem => 
          queueItem.id === item.id 
            ? { ...queueItem, retryCount: queueItem.retryCount + 1 }
            : queueItem
        );
        saveSyncQueue(newQueue);
        return newQueue;
      });

      return { success: false, error: error.message };
    }
  }, [removeFromSyncQueue, saveSyncQueue]);

  /**
   * 전체 동기화 수행
   */
  const performSync = useCallback(async () => {
    if (!isOnline || syncInProgressRef.current || syncQueue.length === 0) {
      return;
    }

    syncInProgressRef.current = true;
    setSyncStatus(SYNC_STATUS.SYNCING);

    if (onSyncStart) {
      onSyncStart(syncQueue.length);
    }

    const stats = {
      totalItems: syncQueue.length,
      syncedItems: 0,
      failedItems: 0
    };

    try {
      // 우선순위별로 동기화 수행
      for (const item of syncQueue) {
        // 최대 재시도 횟수 초과한 아이템은 건너뛰기
        if (item.retryCount >= maxRetries) {
          console.warn(`최대 재시도 횟수 초과 - ${item.type}:`, item);
          removeFromSyncQueue(item.id);
          stats.failedItems++;
          continue;
        }

        const result = await syncItem(item);
        
        if (result.success) {
          stats.syncedItems++;
        } else {
          stats.failedItems++;
          
          // 재시도 딜레이
          if (item.retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }

        // 동기화 상태 업데이트
        setSyncStats({ ...stats });
      }

      setSyncStatus(SYNC_STATUS.SUCCESS);
      setLastSyncTime(Date.now());

      if (onSyncComplete) {
        onSyncComplete(stats);
      }

    } catch (error) {
      console.error('동기화 중 오류:', error);
      setSyncStatus(SYNC_STATUS.ERROR);
      
      if (onSyncError) {
        onSyncError(error, stats);
      }
    } finally {
      syncInProgressRef.current = false;
      
      // 실패한 아이템이 있으면 재시도 스케줄링
      if (syncQueue.length > 0) {
        retryTimeoutRef.current = setTimeout(() => {
          performSync();
        }, retryDelay * 2);
      }
    }
  }, [
    isOnline, syncQueue, maxRetries, retryDelay, syncItem, removeFromSyncQueue,
    onSyncStart, onSyncComplete, onSyncError
  ]);

  /**
   * 수동 동기화 시작
   */
  const startSync = useCallback(() => {
    if (isOnline && !syncInProgressRef.current) {
      performSync();
    }
  }, [isOnline, performSync]);

  /**
   * 동기화 큐 초기화
   */
  const clearSyncQueue = useCallback(() => {
    setSyncQueue([]);
    saveSyncQueue([]);
    setSyncStats({ totalItems: 0, syncedItems: 0, failedItems: 0 });
  }, [saveSyncQueue]);

  /**
   * 특정 타입의 아이템들 제거
   */
  const removeItemsByType = useCallback((type) => {
    setSyncQueue(prev => {
      const newQueue = prev.filter(item => item.type !== type);
      saveSyncQueue(newQueue);
      return newQueue;
    });
  }, [saveSyncQueue]);

  // 초기 로드
  useEffect(() => {
    const initialQueue = loadSyncQueue();
    setSyncQueue(initialQueue);
  }, [loadSyncQueue]);

  // 온라인 상태 변경 시 자동 동기화
  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      // 온라인 복귀 후 잠시 대기 후 동기화 시작
      const timeout = setTimeout(() => {
        performSync();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [isOnline, syncQueue.length, performSync]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    // 상태
    syncStatus,
    syncQueue,
    lastSyncTime,
    syncStats,
    isOnline,
    
    // 액션
    addToSyncQueue,
    removeFromSyncQueue,
    startSync,
    clearSyncQueue,
    removeItemsByType,
    
    // 유틸리티
    queueSize: syncQueue.length,
    
    // 상수
    SYNC_STATUS,
    SYNC_PRIORITY
  };
};

export default useOfflineSync;