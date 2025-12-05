/**
 * @fileoverview 쓰로틀된 상태 훅 - 상태 업데이트 빈도 제한으로 성능 최적화
 * @description 빈번한 상태 업데이트를 제한하여 렌더링 성능을 개선
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 쓰로틀된 상태 관리 훅
 * 
 * @param {*} initialValue - 초기값
 * @param {number} [limit=300] - 쓰로틀 제한 시간 (ms)
 * @param {Object} options - 추가 옵션
 * @param {boolean} [options.leading=true] - 첫 번째 호출 즉시 실행 여부
 * @param {boolean} [options.trailing=true] - 마지막 호출 지연 실행 여부
 * @returns {Array} [상태값, setter 함수, 즉시 setter 함수]
 */
export const useThrottledState = (initialValue, limit = 300, options = {}) => {
  const { leading = true, trailing = true } = options;
  
  const [state, setState] = useState(initialValue);
  const [pendingValue, setPendingValue] = useState(initialValue);
  const inThrottle = useRef(false);
  const lastCallTime = useRef(0);
  const timeoutRef = useRef();

  const throttledSetState = useCallback((newValue) => {
    const now = Date.now();
    setPendingValue(newValue);
    
    if (!inThrottle.current) {
      // Leading edge - 즉시 실행
      if (leading) {
        setState(newValue);
        lastCallTime.current = now;
      }
      
      inThrottle.current = true;
      
      setTimeout(() => {
        inThrottle.current = false;
        
        // Trailing edge - 마지막 값으로 업데이트
        if (trailing) {
          setState(pendingValue);
        }
      }, limit);
    } else if (trailing) {
      // 기존 타이머 클리어하고 새로운 타이머 설정
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setState(pendingValue);
        inThrottle.current = false;
      }, limit - (now - lastCallTime.current));
    }
  }, [limit, leading, trailing, pendingValue]);

  // 즉시 상태 업데이트 (쓰로틀 우회)
  const setStateImmediately = useCallback((newValue) => {
    setState(newValue);
    setPendingValue(newValue);
    
    // 진행 중인 쓰로틀 취소
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    inThrottle.current = false;
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, throttledSetState, setStateImmediately];
};

/**
 * 쓰로틀된 검색 상태 훅
 * 
 * @param {string} [initialQuery=''] - 초기 검색어
 * @param {number} [limit=500] - 쓰로틀 제한 시간
 * @returns {Object} 검색 상태와 메서드
 */
export const useThrottledSearch = (initialQuery = '', limit = 500) => {
  const [query, setQuery, setQueryImmediately] = useThrottledState(initialQuery, limit, {
    leading: false,
    trailing: true
  });
  
  const [inputValue, setInputValue] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);

  // 입력값 변경 핸들러
  const handleInputChange = useCallback((value) => {
    setInputValue(value);
    setIsSearching(true);
    setQuery(value);
  }, [setQuery]);

  // 검색 완료 처리
  useEffect(() => {
    if (query === inputValue) {
      setIsSearching(false);
    }
  }, [query, inputValue]);

  // 검색 초기화
  const clearSearch = useCallback(() => {
    setInputValue('');
    setQueryImmediately('');
    setIsSearching(false);
  }, [setQueryImmediately]);

  return {
    query,
    inputValue,
    isSearching,
    handleInputChange,
    clearSearch,
    setQuery: setQueryImmediately
  };
};

/**
 * 쓰로틀된 스크롤 상태 훅
 * 
 * @param {number} [limit=100] - 쓰로틀 제한 시간
 * @returns {Object} 스크롤 상태
 */
export const useThrottledScroll = (limit = 100) => {
  const [scrollPosition, setScrollPosition, setScrollImmediately] = useThrottledState(
    { x: 0, y: 0 },
    limit
  );

  const handleScroll = useCallback((event) => {
    const target = event.target === document ? window : event.target;
    setScrollPosition({
      x: target.scrollX || target.scrollLeft || 0,
      y: target.scrollY || target.scrollTop || 0
    });
  }, [setScrollPosition]);

  return {
    scrollPosition,
    handleScroll,
    setScrollPosition: setScrollImmediately
  };
};

export default useThrottledState;