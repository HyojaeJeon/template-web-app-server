/**
 * useDebounce.js - 디바운스 처리 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 입력 지연 처리로 성능 최적화
 * - 검색, API 호출 최적화
 * - 메모리 누수 방지
 * - 접근성 고려한 디바운스 설정
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export const useDebounce = (value, delay = 300, options = {}) => {
  const {
    maxWait = 0,
    leading = false,
    trailing = true,
    immediate = false
  } = options;

  const [debouncedValue, setDebouncedValue] = useState(
    immediate ? value : (leading ? value : undefined)
  );
  
  const timeoutRef = useRef(null);
  const maxTimeoutRef = useRef(null);
  const previousValueRef = useRef(value);
  const leadingRef = useRef(leading);

  useEffect(() => {
    // 값이 변경되지 않았으면 스킵
    if (value === previousValueRef.current) {
      return;
    }

    const executeUpdate = () => {
      setDebouncedValue(value);
      previousValueRef.current = value;
      leadingRef.current = false;
    };

    // Leading 처리
    if (leading && leadingRef.current) {
      executeUpdate();
      leadingRef.current = false;
    }

    // 기존 타이머 제거
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Trailing 처리
    if (trailing) {
      timeoutRef.current = setTimeout(executeUpdate, delay);
    }

    // MaxWait 처리
    if (maxWait > 0 && !maxTimeoutRef.current) {
      maxTimeoutRef.current = setTimeout(executeUpdate, maxWait);
    }

    // 클린업
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
        maxTimeoutRef.current = null;
      }
    };
  }, [value, delay, maxWait, leading, trailing]);

  // 컴포넌트 언마운트 시 클린업
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

  return debouncedValue;
};

// 콜백 함수용 디바운스 훅
export const useDebouncedCallback = (callback, delay = 300, deps = [], options = {}) => {
  const {
    maxWait = 0,
    leading = false,
    trailing = true
  } = options;

  const timeoutRef = useRef(null);
  const maxTimeoutRef = useRef(null);
  const callbackRef = useRef(callback);
  const leadingRef = useRef(true);

  // 콜백 참조 업데이트
  useEffect(() => {
    callbackRef.current = callback;
  });

  const debouncedCallback = useCallback((...args) => {
    const executeCallback = () => {
      leadingRef.current = true;
      return callbackRef.current(...args);
    };

    // Leading 실행
    if (leading && leadingRef.current) {
      leadingRef.current = false;
      return executeCallback();
    }

    // 기존 타이머 제거
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Trailing 설정
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        executeCallback();
        timeoutRef.current = null;
      }, delay);
    }

    // MaxWait 설정
    if (maxWait > 0 && !maxTimeoutRef.current) {
      maxTimeoutRef.current = setTimeout(() => {
        executeCallback();
        maxTimeoutRef.current = null;
      }, maxWait);
    }
  }, [delay, maxWait, leading, trailing, ...deps]);

  // 즉시 실행
  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      return callbackRef.current();
    }
  }, []);

  // 취소
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
    leadingRef.current = true;
  }, []);

  // 펜딩 상태 확인
  const isPending = useCallback(() => {
    return timeoutRef.current !== null || maxTimeoutRef.current !== null;
  }, []);

  return {
    callback: debouncedCallback,
    flush,
    cancel,
    isPending
  };
};

// 검색용 특화 디바운스 훅
export const useSearchDebounce = (searchTerm, delay = 500) => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsSearching(true);
    
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, delay);

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [searchTerm, delay]);

  return {
    searchTerm: debouncedSearchTerm,
    isSearching,
    hasSearchTerm: debouncedSearchTerm.length > 0
  };
};

export default useDebounce;