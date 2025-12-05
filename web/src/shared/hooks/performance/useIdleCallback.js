/**
 * @fileoverview 유휴 콜백 훅 - 브라우저 유휴 시간 활용으로 성능 최적화
 * @description requestIdleCallback을 활용하여 메인 스레드를 블로킹하지 않고 작업 수행
 */

import { useCallback, useRef, useEffect } from 'react';

/**
 * 브라우저 유휴 시간을 활용한 콜백 실행 훅
 * 
 * @param {Function} callback - 유휴 시간에 실행할 콜백
 * @param {Object} options - RequestIdleCallback 옵션
 * @param {number} [options.timeout=5000] - 최대 대기 시간 (ms)
 * @returns {Object} 유휴 콜백 제어 메서드
 */
export const useIdleCallback = (callback, options = {}) => {
  const { timeout = 5000 } = options;
  const callbackRef = useRef(callback);
  const idleIdRef = useRef();

  // 콜백 레퍼런스 업데이트
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // requestIdleCallback 폴리필
  const requestIdleCallback = useCallback((cb, opts) => {
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      return window.requestIdleCallback(cb, opts);
    }
    
    // 폴리필: setTimeout으로 대체
    return setTimeout(() => {
      const start = Date.now();
      cb({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
      });
    }, 1);
  }, []);

  const cancelIdleCallback = useCallback((id) => {
    if (typeof window !== 'undefined' && window.cancelIdleCallback) {
      return window.cancelIdleCallback(id);
    }
    
    // 폴리필: clearTimeout으로 대체
    return clearTimeout(id);
  }, []);

  // 유휴 콜백 실행
  const executeIdle = useCallback((args = []) => {
    // 기존 유휴 콜백 취소
    if (idleIdRef.current) {
      cancelIdleCallback(idleIdRef.current);
    }

    idleIdRef.current = requestIdleCallback((deadline) => {
      try {
        callbackRef.current(deadline, ...args);
      } catch (error) {
        console.error('Idle callback error:', error);
      }
    }, { timeout });
  }, [requestIdleCallback, cancelIdleCallback, timeout]);

  // 유휴 콜백 취소
  const cancelIdle = useCallback(() => {
    if (idleIdRef.current) {
      cancelIdleCallback(idleIdRef.current);
      idleIdRef.current = null;
    }
  }, [cancelIdleCallback]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cancelIdle();
    };
  }, [cancelIdle]);

  return {
    executeIdle,
    cancelIdle
  };
};

/**
 * 유휴 시간 배치 처리 훅
 * 
 * @param {Object} options - 배치 처리 옵션
 * @param {number} [options.batchSize=10] - 배치 크기
 * @param {number} [options.timeout=5000] - 최대 대기 시간
 * @returns {Object} 배치 처리 메서드
 */
export const useIdleBatch = (options = {}) => {
  const { batchSize = 10, timeout = 5000 } = options;
  const queueRef = useRef([]);
  const processingRef = useRef(false);

  const { executeIdle, cancelIdle } = useIdleCallback(() => {}, { timeout });

  // 배치 처리 실행
  const processBatch = useCallback(() => {
    if (processingRef.current || queueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;

    executeIdle([queueRef.current.splice(0, batchSize)]);

    // 남은 작업이 있으면 다음 유휴 시간에 계속 처리
    if (queueRef.current.length > 0) {
      setTimeout(() => {
        processingRef.current = false;
        processBatch();
      }, 0);
    } else {
      processingRef.current = false;
    }
  }, [executeIdle, batchSize]);

  // 작업 추가
  const addTask = useCallback((task) => {
    queueRef.current.push(task);
    processBatch();
  }, [processBatch]);

  // 여러 작업 추가
  const addTasks = useCallback((tasks) => {
    queueRef.current.push(...tasks);
    processBatch();
  }, [processBatch]);

  // 큐 비우기
  const clearQueue = useCallback(() => {
    queueRef.current = [];
    cancelIdle();
    processingRef.current = false;
  }, [cancelIdle]);

  // 큐 상태
  const getQueueStatus = useCallback(() => ({
    queueLength: queueRef.current.length,
    isProcessing: processingRef.current
  }), []);

  return {
    addTask,
    addTasks,
    clearQueue,
    getQueueStatus
  };
};

/**
 * 유휴 시간 프리페치 훅
 * 
 * @param {Function} prefetchFunction - 프리페치 함수
 * @param {Array} dependencies - 의존성 배열
 * @param {Object} options - 옵션
 * @returns {Object} 프리페치 상태와 메서드
 */
export const useIdlePrefetch = (prefetchFunction, dependencies = [], options = {}) => {
  const { delay = 1000, timeout = 3000 } = options;
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [prefetchError, setPrefetchError] = useState(null);

  const { executeIdle, cancelIdle } = useIdleCallback(async (deadline) => {
    setIsPrefetching(true);
    setPrefetchError(null);
    
    try {
      await prefetchFunction(deadline);
    } catch (error) {
      setPrefetchError(error);
    } finally {
      setIsPrefetching(false);
    }
  }, { timeout });

  // 의존성 변경 시 프리페치 실행
  useEffect(() => {
    const timer = setTimeout(() => {
      executeIdle();
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelIdle();
    };
  }, dependencies);

  return {
    isPrefetching,
    prefetchError,
    cancelPrefetch: cancelIdle
  };
};

export default useDebouncedState;