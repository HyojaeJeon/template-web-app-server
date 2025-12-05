/**
 * @fileoverview 메모이제이션 콜백 훅 - 콜백 함수 성능 최적화
 * @description 의존성 변경 시에만 콜백을 재생성하여 불필요한 리렌더링 방지
 */

import { useCallback, useMemo, useRef } from 'react';

/**
 * 깊은 비교를 통한 메모이제이션 콜백
 * 
 * @param {Function} callback - 메모이제이션할 콜백 함수
 * @param {Array} dependencies - 의존성 배열
 * @param {Object} options - 옵션
 * @param {boolean} [options.deepCompare=false] - 깊은 비교 여부
 * @returns {Function} 메모이제이션된 콜백
 */
export const useMemoizedCallback = (callback, dependencies = [], options = {}) => {
  const { deepCompare = false } = options;
  const prevDepsRef = useRef();
  const callbackRef = useRef(callback);

  // 깊은 비교 함수
  const deepEqual = useCallback((a, b) => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (let key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!deepEqual(a[key], b[key])) return false;
      }
      
      return true;
    }
    
    return false;
  }, []);

  // 의존성 비교
  const depsChanged = useMemo(() => {
    if (!prevDepsRef.current) return true;
    
    if (deepCompare) {
      return !deepEqual(prevDepsRef.current, dependencies);
    }
    
    if (prevDepsRef.current.length !== dependencies.length) return true;
    
    return dependencies.some((dep, index) => 
      !Object.is(dep, prevDepsRef.current[index])
    );
  }, [dependencies, deepCompare, deepEqual]);

  // 콜백 업데이트
  if (depsChanged) {
    callbackRef.current = callback;
    prevDepsRef.current = dependencies;
  }

  return useCallback((...args) => {
    return callbackRef.current(...args);
  }, [depsChanged]);
};

/**
 * 디바운스된 메모이제이션 콜백
 * 
 * @param {Function} callback - 콜백 함수
 * @param {Array} dependencies - 의존성 배열
 * @param {number} delay - 디바운스 지연 시간 (ms)
 * @returns {Function} 디바운스된 메모이제이션 콜백
 */
export const useDebouncedMemoizedCallback = (callback, dependencies, delay = 300) => {
  const timeoutRef = useRef();
  
  const memoizedCallback = useMemoizedCallback(callback, dependencies);
  
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      memoizedCallback(...args);
    }, delay);
  }, [memoizedCallback, delay]);
};

/**
 * 쓰로틀된 메모이제이션 콜백
 * 
 * @param {Function} callback - 콜백 함수
 * @param {Array} dependencies - 의존성 배열
 * @param {number} limit - 쓰로틀 제한 시간 (ms)
 * @returns {Function} 쓰로틀된 메모이제이션 콜백
 */
export const useThrottledMemoizedCallback = (callback, dependencies, limit = 300) => {
  const inThrottle = useRef(false);
  
  const memoizedCallback = useMemoizedCallback(callback, dependencies);
  
  return useCallback((...args) => {
    if (!inThrottle.current) {
      memoizedCallback(...args);
      inThrottle.current = true;
      
      setTimeout(() => {
        inThrottle.current = false;
      }, limit);
    }
  }, [memoizedCallback, limit]);
};

/**
 * 조건부 메모이제이션 콜백
 * 
 * @param {Function} callback - 콜백 함수
 * @param {Array} dependencies - 의존성 배열
 * @param {Function} condition - 실행 조건 함수
 * @returns {Function} 조건부 메모이제이션 콜백
 */
export const useConditionalMemoizedCallback = (callback, dependencies, condition) => {
  const memoizedCallback = useMemoizedCallback(callback, dependencies);
  
  return useCallback((...args) => {
    if (condition && condition(...args)) {
      return memoizedCallback(...args);
    }
  }, [memoizedCallback, condition]);
};

export default useMemoizedCallback;