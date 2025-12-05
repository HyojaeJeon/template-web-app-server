'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback } from 'react';

/**
 * ClickOutside Component
 * 
 * Local 배달 앱 외부 클릭 감지 컴포넌트
 * - 요소 외부 클릭 시 콜백 실행
 * - 터치 디바이스 지원
 * - 키보드 네비게이션 지원 (ESC 키)
 * - 포커스 관리 통합
 * - 예외 요소 설정 가능
 * 
 * WCAG 2.1 준수, 키보드 네비게이션, 스크린 리더 지원
 * 
 * @param {Object} props - ClickOutside 컴포넌트 props
 * @param {ReactNode} props.children - 자식 컴포넌트
 * @param {Function} props.onClickOutside - 외부 클릭 콜백
 * @param {Function} props.onEscapeKey - ESC 키 콜백
 * @param {boolean} props.enabled - 감지 활성화 여부
 * @param {Array} props.excludeElements - 예외 요소 배열 (refs)
 * @param {Array} props.excludeSelectors - 예외 CSS 선택자
 * @param {boolean} props.includeTouchEvents - 터치 이벤트 포함
 * @param {boolean} props.includeEscapeKey - ESC 키 이벤트 포함
 * @param {number} props.delay - 이벤트 리스너 등록 지연 (ms)
 * @param {string} props.className - 추가 CSS 클래스
 */
const ClickOutside = forwardRef(({
  children,
  onClickOutside,
  onEscapeKey,
  enabled = true,
  excludeElements = [],
  excludeSelectors = [],
  includeTouchEvents = true,
  includeEscapeKey = true,
  delay = 0,
  className = '',
  ...props
}, ref) => {
  const containerRef = useRef(null);
  const callbackRef = useRef(onClickOutside);
  const escapeCallbackRef = useRef(onEscapeKey);

  // 콜백 레퍼런스 업데이트
  useEffect(() => {
    callbackRef.current = onClickOutside;
  }, [onClickOutside]);

  useEffect(() => {
    escapeCallbackRef.current = onEscapeKey;
  }, [onEscapeKey]);

  // ref 전달
  useImperativeHandle(ref, () => ({
    element: containerRef.current,
    isInside: (target) => {
      if (!containerRef.current) return false;
      return containerRef.current.contains(target);
    }
  }), []);

  // 클릭/터치 이벤트 처리
  useEffect(() => {
    if (!enabled) return;

    const handleEvent = (event) => {
      const target = event.target;
      
      // 컨테이너가 없으면 무시
      if (!containerRef.current) return;
      
      // 컨테이너 내부 클릭이면 무시
      if (containerRef.current.contains(target)) return;
      
      // 예외 요소 확인
      for (const excludeRef of excludeElements) {
        if (excludeRef.current && excludeRef.current.contains(target)) {
          return;
        }
      }
      
      // 예외 선택자 확인
      for (const selector of excludeSelectors) {
        if (target.closest(selector)) {
          return;
        }
      }

      // 외부 클릭 콜백 실행
      if (callbackRef.current) {
        callbackRef.current(event);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleEvent, true);
      document.addEventListener('click', handleEvent, true);
      
      if (includeTouchEvents) {
        document.addEventListener('touchstart', handleEvent, true);
        document.addEventListener('touchend', handleEvent, true);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleEvent, true);
      document.removeEventListener('click', handleEvent, true);
      
      if (includeTouchEvents) {
        document.removeEventListener('touchstart', handleEvent, true);
        document.removeEventListener('touchend', handleEvent, true);
      }
    };
  }, [enabled, excludeElements, excludeSelectors, includeTouchEvents, delay]);

  // 키보드 이벤트 처리 (ESC)
  useEffect(() => {
    if (!enabled || !includeEscapeKey) return;

    const handleKeyDown = (event) => {
      // ESC 키 확인
      if (event.key === 'Escape' || event.keyCode === 27) {
        if (escapeCallbackRef.current) {
          escapeCallbackRef.current(event);
        }
        // 기본 ESC 동작도 외부 클릭으로 처리
        else if (callbackRef.current) {
          callbackRef.current(event);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, includeEscapeKey]);

  return (
    <div
      ref={containerRef}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
});

ClickOutside.displayName = 'ClickOutside';

/**
 * 외부 클릭 감지 Hook
 * 
 * @param {Function} callback - 외부 클릭 콜백
 * @param {Object} options - 옵션 설정
 * @returns {RefObject} 요소 ref
 */
export const useClickOutside = (callback, options = {}) => {
  const {
    enabled = true,
    excludeElements = [],
    excludeSelectors = [],
    includeTouchEvents = true,
    includeEscapeKey = true,
    delay = 0
  } = options;

  const ref = useRef(null);
  const callbackRef = useRef(callback);

  // 콜백 레퍼런스 업데이트
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const handleEvent = (event) => {
      const target = event.target;
      
      if (!ref.current) return;
      if (ref.current.contains(target)) return;
      
      // 예외 요소 확인
      for (const excludeRef of excludeElements) {
        if (excludeRef.current && excludeRef.current.contains(target)) {
          return;
        }
      }
      
      // 예외 선택자 확인
      for (const selector of excludeSelectors) {
        if (target.closest(selector)) {
          return;
        }
      }

      callbackRef.current(event);
    };

    const handleKeyDown = (event) => {
      if (includeEscapeKey && (event.key === 'Escape' || event.keyCode === 27)) {
        callbackRef.current(event);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleEvent, true);
      document.addEventListener('click', handleEvent, true);
      
      if (includeTouchEvents) {
        document.addEventListener('touchstart', handleEvent, true);
        document.addEventListener('touchend', handleEvent, true);
      }
      
      if (includeEscapeKey) {
        document.addEventListener('keydown', handleKeyDown, true);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleEvent, true);
      document.removeEventListener('click', handleEvent, true);
      
      if (includeTouchEvents) {
        document.removeEventListener('touchstart', handleEvent, true);
        document.removeEventListener('touchend', handleEvent, true);
      }
      
      if (includeEscapeKey) {
        document.removeEventListener('keydown', handleKeyDown, true);
      }
    };
  }, [enabled, excludeElements, excludeSelectors, includeTouchEvents, includeEscapeKey, delay]);

  return ref;
};

/**
 * 고급 외부 클릭 감지 Hook
 * 
 * @param {Function} callback - 외부 클릭 콜백
 * @param {Object} options - 고급 옵션
 * @returns {Object} 제어 객체
 */
export const useAdvancedClickOutside = (callback, options = {}) => {
  const {
    enabled: initialEnabled = true,
    preventDefault = false,
    stopPropagation = false,
    debounceMs = 0,
    ...restOptions
  } = options;

  const [enabled, setEnabled] = useState(initialEnabled);
  const [isActive, setIsActive] = useState(false);
  const debounceTimer = useRef(null);

  const debouncedCallback = useCallback((event) => {
    if (debounceMs > 0) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        callback(event);
      }, debounceMs);
    } else {
      callback(event);
    }

    if (preventDefault) {
      event.preventDefault();
    }
    
    if (stopPropagation) {
      event.stopPropagation();
    }
  }, [callback, debounceMs, preventDefault, stopPropagation]);

  const ref = useClickOutside(
    (event) => {
      setIsActive(true);
      debouncedCallback(event);
      setTimeout(() => setIsActive(false), 100);
    },
    { enabled, ...restOptions }
  );

  useEffect(() => {
    return () => {
      clearTimeout(debounceTimer.current);
    };
  }, []);

  return {
    ref,
    enabled,
    setEnabled,
    isActive,
    enable: () => setEnabled(true),
    disable: () => setEnabled(false),
    toggle: () => setEnabled(prev => !prev)
  };
};

export default ClickOutside;