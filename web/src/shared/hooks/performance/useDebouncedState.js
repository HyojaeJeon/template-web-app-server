/**
 * @fileoverview 디바운스된 상태 훅 - 상태 업데이트 지연으로 성능 최적화
 * @description 연속된 상태 업데이트를 지연시켜 API 호출 빈도와 렌더링 횟수를 줄임
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 디바운스된 상태 관리 훅
 * 
 * @param {*} initialValue - 초기값
 * @param {number} [delay=300] - 디바운스 지연 시간 (ms)
 * @param {Object} options - 추가 옵션
 * @param {boolean} [options.leading=false] - 첫 번째 호출 즉시 실행 여부
 * @param {number} [options.maxWait] - 최대 대기 시간
 * @returns {Array} [디바운스된 값, 즉시값, setter 함수, 즉시 setter 함수]
 */
export const useDebouncedState = (initialValue, delay = 300, options = {}) => {
  const { leading = false, maxWait } = options;
  
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const [immediateValue, setImmediateValue] = useState(initialValue);
  const timeoutRef = useRef();
  const maxTimeoutRef = useRef();
  const lastCallTime = useRef(0);

  const updateDebouncedValue = useCallback((value) => {
    setDebouncedValue(value);
  }, []);

  const setValue = useCallback((newValue) => {
    const now = Date.now();
    setImmediateValue(newValue);
    lastCallTime.current = now;

    // Leading edge 실행
    if (leading && debouncedValue === initialValue) {
      updateDebouncedValue(newValue);
    }

    // 기존 타이머 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 새로운 디바운스 타이머 설정
    timeoutRef.current = setTimeout(() => {
      updateDebouncedValue(newValue);
      
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    }, delay);

    // maxWait 설정이 있는 경우
    if (maxWait && !maxTimeoutRef.current) {
      maxTimeoutRef.current = setTimeout(() => {
        updateDebouncedValue(newValue);
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        maxTimeoutRef.current = null;
      }, maxWait);
    }
  }, [delay, leading, maxWait, updateDebouncedValue, debouncedValue, initialValue]);

  // 즉시 업데이트 (디바운스 우회)
  const setValueImmediately = useCallback((newValue) => {
    setImmediateValue(newValue);
    setDebouncedValue(newValue);
    
    // 모든 타이머 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
  }, []);

  // 펜딩 상태 확인
  const isPending = immediateValue !== debouncedValue;

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, []);

  return [debouncedValue, immediateValue, setValue, setValueImmediately, isPending];
};

/**
 * 디바운스된 검색 훅
 * 
 * @param {string} [initialQuery=''] - 초기 검색어
 * @param {number} [delay=500] - 디바운스 지연 시간
 * @returns {Object} 검색 상태와 메서드
 */
export const useDebouncedSearch = (initialQuery = '', delay = 500) => {
  const [searchQuery, inputQuery, setQuery, setQueryImmediately, isPending] = 
    useDebouncedState(initialQuery, delay);

  const [isSearching, setIsSearching] = useState(false);
  const searchId = useRef(0);

  // 검색 실행
  const executeSearch = useCallback(async (query, searchCallback) => {
    if (!searchCallback) return;
    
    const currentSearchId = ++searchId.current;
    setIsSearching(true);
    
    try {
      const result = await searchCallback(query);
      
      // 최신 검색인지 확인 (경쟁 상태 방지)
      if (currentSearchId === searchId.current) {
        setIsSearching(false);
        return result;
      }
    } catch (error) {
      if (currentSearchId === searchId.current) {
        setIsSearching(false);
        throw error;
      }
    }
  }, []);

  // 검색 취소
  const cancelSearch = useCallback(() => {
    searchId.current++;
    setIsSearching(false);
  }, []);

  // 검색 초기화
  const resetSearch = useCallback(() => {
    setQueryImmediately('');
    cancelSearch();
  }, [setQueryImmediately, cancelSearch]);

  return {
    searchQuery,
    inputQuery,
    isPending,
    isSearching,
    setQuery,
    setQueryImmediately,
    executeSearch,
    cancelSearch,
    resetSearch
  };
};

/**
 * 디바운스된 API 호출 훅
 * 
 * @param {Function} apiCall - API 호출 함수
 * @param {number} [delay=500] - 디바운스 지연 시간
 * @returns {Object} API 호출 상태와 메서드
 */
export const useDebouncedAPI = (apiCall, delay = 500) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [, , callAPI] = useDebouncedState(null, delay, {
    leading: false
  });

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const debouncedExecute = useCallback((...args) => {
    callAPI(() => execute(...args));
  }, [callAPI, execute]);

  return {
    data,
    loading,
    error,
    execute: debouncedExecute,
    executeImmediately: execute
  };
};

export default useDebouncedState;