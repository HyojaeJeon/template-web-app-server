'use client';

import { useState, useEffect, useCallback, useMemo, forwardRef, useRef } from 'react';

/**
 * WindowSize Component
 * 
 * Local 배달 앱 윈도우 크기 추적 컴포넌트
 * - 실시간 윈도우 크기 모니터링
 * - 브레이크포인트 기반 반응형 처리
 * - 디바이스 타입 감지
 * - Local 모바일 환경 최적화
 * - 성능 최적화 (디바운스, 스로틀링)
 * 
 * WCAG 2.1 준수, 반응형 접근성 지원
 * 
 * @param {Object} props - WindowSize 컴포넌트 props
 * @param {ReactNode} props.children - 자식 컴포넌트 (render prop 패턴)
 * @param {number} props.debounceMs - 디바운스 지연시간
 * @param {number} props.throttleMs - 스로틀 지연시간
 * @param {boolean} props.trackOrientation - 방향 변경 추적
 * @param {boolean} props.trackVisualViewport - Visual Viewport API 사용
 * @param {Object} props.breakpoints - 커스텀 브레이크포인트
 * @param {Function} props.onResize - 크기 변경 콜백
 * @param {Function} props.onOrientationChange - 방향 변경 콜백
 * @param {Function} props.onBreakpointChange - 브레이크포인트 변경 콜백
 * @param {string} props.className - 추가 CSS 클래스
 */

// 기본 브레이크포인트 (Local 모바일 환경 고려)
const DEFAULT_BREAKPOINTS = {
  xs: 0,      // 초소형 디바이스
  sm: 640,    // 모바일
  md: 768,    // 태블릿
  lg: 1024,   // 데스크톱
  xl: 1280,   // 대형 데스크톱
  '2xl': 1536 // 초대형 화면
};

const WindowSize = forwardRef(({
  children,
  debounceMs = 150,
  throttleMs = 16, // ~60fps
  trackOrientation = true,
  trackVisualViewport = true,
  breakpoints = DEFAULT_BREAKPOINTS,
  onResize,
  onOrientationChange,
  onBreakpointChange,
  className = '',
  ...props
}, ref) => {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
    innerWidth: 0,
    innerHeight: 0,
    outerWidth: 0,
    outerHeight: 0,
    devicePixelRatio: 1,
    orientation: 'portrait',
    breakpoint: 'xs',
    isMobile: false,
    isTablet: false,
    isDesktop: false
  });

  const debounceTimer = useRef(null);
  const throttleTimer = useRef(null);
  const lastUpdateTime = useRef(0);
  const containerRef = useRef(null);

  // 현재 브레이크포인트 계산
  const getCurrentBreakpoint = useCallback((width) => {
    const sortedBreakpoints = Object.entries(breakpoints)
      .sort(([,a], [,b]) => b - a);
    
    for (const [name, minWidth] of sortedBreakpoints) {
      if (width >= minWidth) {
        return name;
      }
    }
    
    return 'xs';
  }, [breakpoints]);

  // 디바이스 타입 감지
  const getDeviceType = useCallback((width) => {
    return {
      isMobile: width < breakpoints.md,
      isTablet: width >= breakpoints.md && width < breakpoints.lg,
      isDesktop: width >= breakpoints.lg
    };
  }, [breakpoints]);

  // 윈도우 크기 정보 수집
  const getWindowInfo = useCallback(() => {
    if (typeof window === 'undefined') return windowSize;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getCurrentBreakpoint(width);
    const deviceType = getDeviceType(width);
    
    // Visual Viewport API 지원 확인
    const visualViewport = trackVisualViewport && window.visualViewport;
    const vvWidth = visualViewport?.width || width;
    const vvHeight = visualViewport?.height || height;

    return {
      width: vvWidth,
      height: vvHeight,
      innerWidth: width,
      innerHeight: height,
      outerWidth: window.outerWidth || width,
      outerHeight: window.outerHeight || height,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: width > height ? 'landscape' : 'portrait',
      breakpoint,
      ...deviceType
    };
  }, [getCurrentBreakpoint, getDeviceType, trackVisualViewport, windowSize]);

  // 스로틀된 업데이트
  const throttledUpdate = useCallback(() => {
    const now = Date.now();
    
    if (throttleTimer.current) {
      clearTimeout(throttleTimer.current);
    }

    const timeSinceLastUpdate = now - lastUpdateTime.current;
    
    if (timeSinceLastUpdate >= throttleMs) {
      const newSize = getWindowInfo();
      const oldBreakpoint = windowSize.breakpoint;
      const oldOrientation = windowSize.orientation;
      
      setWindowSize(newSize);
      lastUpdateTime.current = now;

      // 콜백 실행
      if (onResize) {
        onResize(newSize);
      }

      if (trackOrientation && oldOrientation !== newSize.orientation && onOrientationChange) {
        onOrientationChange(newSize.orientation, newSize);
      }

      if (oldBreakpoint !== newSize.breakpoint && onBreakpointChange) {
        onBreakpointChange(newSize.breakpoint, oldBreakpoint, newSize);
      }
    } else {
      throttleTimer.current = setTimeout(() => {
        throttledUpdate();
      }, throttleMs - timeSinceLastUpdate);
    }
  }, [getWindowInfo, throttleMs, windowSize, onResize, trackOrientation, onOrientationChange, onBreakpointChange]);

  // 디바운스된 업데이트
  const debouncedUpdate = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      throttledUpdate();
    }, debounceMs);
  }, [throttledUpdate, debounceMs]);

  // 초기 크기 설정
  useEffect(() => {
    const initialSize = getWindowInfo();
    setWindowSize(initialSize);
    lastUpdateTime.current = Date.now();
  }, [getWindowInfo]);

  // 이벤트 리스너 등록
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      debouncedUpdate();
    };

    const handleOrientationChange = () => {
      if (trackOrientation) {
        // 방향 변경 후 약간의 지연
        setTimeout(debouncedUpdate, 100);
      }
    };

    const handleVisualViewportResize = () => {
      if (trackVisualViewport) {
        throttledUpdate();
      }
    };

    // 리스너 등록
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true });

    // Visual Viewport API 지원시
    if (trackVisualViewport && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize, { passive: true });
    }

    // cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      
      if (trackVisualViewport && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
      }

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (throttleTimer.current) {
        clearTimeout(throttleTimer.current);
      }
    };
  }, [debouncedUpdate, throttledUpdate, trackOrientation, trackVisualViewport]);

  // 편의 속성들
  const derived = useMemo(() => ({
    aspectRatio: windowSize.width / windowSize.height || 0,
    isLandscape: windowSize.orientation === 'landscape',
    isPortrait: windowSize.orientation === 'portrait',
    isSmallScreen: windowSize.width < breakpoints.md,
    isLargeScreen: windowSize.width >= breakpoints.xl,
    hasKeyboard: trackVisualViewport && window.visualViewport ? 
      windowSize.height < window.visualViewport.height : false,
    // Local 모바일 환경 고려한 속성들
    isVietnameseMobile: windowSize.isMobile && windowSize.width <= 414, // iPhone 6+/7+/8+ 기준
    isVietnameseTablet: windowSize.isTablet && windowSize.width >= 768 && windowSize.width <= 1024
  }), [windowSize, breakpoints, trackVisualViewport]);

  // ref 전달
  useImperativeHandle(ref, () => ({
    element: containerRef.current,
    size: windowSize,
    ...derived,
    refresh: () => {
      const newSize = getWindowInfo();
      setWindowSize(newSize);
    },
    getBreakpoint: getCurrentBreakpoint,
    isBreakpoint: (bp) => windowSize.breakpoint === bp,
    isAtLeast: (bp) => {
      const currentValue = breakpoints[windowSize.breakpoint] || 0;
      const targetValue = breakpoints[bp] || 0;
      return currentValue >= targetValue;
    }
  }), [windowSize, derived, getWindowInfo, getCurrentBreakpoint, breakpoints]);

  const contextValue = {
    ...windowSize,
    ...derived
  };

  if (typeof children === 'function') {
    return (
      <div ref={containerRef} className={className} {...props}>
        {children(contextValue)}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className} {...props}>
      {children}
    </div>
  );
});

WindowSize.displayName = 'WindowSize';

/**
 * 윈도우 크기 추적 Hook
 * 
 * @param {Object} options - 옵션 설정
 * @returns {Object} 윈도우 크기 정보
 */
export const useWindowSize = (options = {}) => {
  const {
    debounceMs = 150,
    throttleMs = 16,
    trackOrientation = true,
    trackVisualViewport = true,
    breakpoints = DEFAULT_BREAKPOINTS,
    onResize,
    onOrientationChange,
    onBreakpointChange
  } = options;

  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
    innerWidth: 0,
    innerHeight: 0,
    outerWidth: 0,
    outerHeight: 0,
    devicePixelRatio: 1,
    orientation: 'portrait',
    breakpoint: 'xs',
    isMobile: false,
    isTablet: false,
    isDesktop: false
  });

  const debounceTimer = useRef(null);
  const throttleTimer = useRef(null);
  const lastUpdateTime = useRef(0);

  const getCurrentBreakpoint = useCallback((width) => {
    const sortedBreakpoints = Object.entries(breakpoints)
      .sort(([,a], [,b]) => b - a);
    
    for (const [name, minWidth] of sortedBreakpoints) {
      if (width >= minWidth) {
        return name;
      }
    }
    return 'xs';
  }, [breakpoints]);

  const getDeviceType = useCallback((width) => ({
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg
  }), [breakpoints]);

  const getWindowInfo = useCallback(() => {
    if (typeof window === 'undefined') return windowSize;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getCurrentBreakpoint(width);
    const deviceType = getDeviceType(width);
    
    const visualViewport = trackVisualViewport && window.visualViewport;
    const vvWidth = visualViewport?.width || width;
    const vvHeight = visualViewport?.height || height;

    return {
      width: vvWidth,
      height: vvHeight,
      innerWidth: width,
      innerHeight: height,
      outerWidth: window.outerWidth || width,
      outerHeight: window.outerHeight || height,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: width > height ? 'landscape' : 'portrait',
      breakpoint,
      ...deviceType
    };
  }, [getCurrentBreakpoint, getDeviceType, trackVisualViewport, windowSize]);

  const updateWindowSize = useCallback(() => {
    const newSize = getWindowInfo();
    const oldBreakpoint = windowSize.breakpoint;
    const oldOrientation = windowSize.orientation;
    
    setWindowSize(newSize);

    if (onResize) onResize(newSize);
    if (trackOrientation && oldOrientation !== newSize.orientation && onOrientationChange) {
      onOrientationChange(newSize.orientation, newSize);
    }
    if (oldBreakpoint !== newSize.breakpoint && onBreakpointChange) {
      onBreakpointChange(newSize.breakpoint, oldBreakpoint, newSize);
    }
  }, [getWindowInfo, windowSize, onResize, trackOrientation, onOrientationChange, onBreakpointChange]);

  useEffect(() => {
    const initialSize = getWindowInfo();
    setWindowSize(initialSize);
    lastUpdateTime.current = Date.now();
  }, [getWindowInfo]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        const now = Date.now();
        
        if (throttleTimer.current) {
          clearTimeout(throttleTimer.current);
        }

        const timeSinceLastUpdate = now - lastUpdateTime.current;
        
        if (timeSinceLastUpdate >= throttleMs) {
          updateWindowSize();
          lastUpdateTime.current = now;
        } else {
          throttleTimer.current = setTimeout(() => {
            updateWindowSize();
            lastUpdateTime.current = Date.now();
          }, throttleMs - timeSinceLastUpdate);
        }
      }, debounceMs);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    if (trackVisualViewport && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize, { passive: true });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      
      if (trackVisualViewport && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (throttleTimer.current) {
        clearTimeout(throttleTimer.current);
      }
    };
  }, [debounceMs, throttleMs, updateWindowSize, trackVisualViewport]);

  const derived = useMemo(() => ({
    aspectRatio: windowSize.width / windowSize.height || 0,
    isLandscape: windowSize.orientation === 'landscape',
    isPortrait: windowSize.orientation === 'portrait',
    isSmallScreen: windowSize.width < breakpoints.md,
    isLargeScreen: windowSize.width >= breakpoints.xl,
    hasKeyboard: trackVisualViewport && window.visualViewport ? 
      windowSize.height < window.visualViewport.height : false,
    isVietnameseMobile: windowSize.isMobile && windowSize.width <= 414,
    isVietnameseTablet: windowSize.isTablet && windowSize.width >= 768 && windowSize.width <= 1024
  }), [windowSize, breakpoints, trackVisualViewport]);

  return {
    ...windowSize,
    ...derived,
    refresh: updateWindowSize,
    isBreakpoint: useCallback((bp) => windowSize.breakpoint === bp, [windowSize.breakpoint]),
    isAtLeast: useCallback((bp) => {
      const currentValue = breakpoints[windowSize.breakpoint] || 0;
      const targetValue = breakpoints[bp] || 0;
      return currentValue >= targetValue;
    }, [windowSize.breakpoint, breakpoints])
  };
};

/**
 * 브레이크포인트 매치 Hook
 * 
 * @param {string|Object} query - 브레이크포인트 쿼리
 * @param {Object} breakpoints - 커스텀 브레이크포인트
 * @returns {boolean} 매치 여부
 */
export const useBreakpoint = (query, breakpoints = DEFAULT_BREAKPOINTS) => {
  const { breakpoint, width } = useWindowSize({ breakpoints });

  return useMemo(() => {
    if (typeof query === 'string') {
      return breakpoint === query;
    }

    if (typeof query === 'object') {
      const { min, max, only } = query;
      
      if (only) return breakpoint === only;
      
      const minWidth = min ? breakpoints[min] || 0 : 0;
      const maxWidth = max ? breakpoints[max] || Infinity : Infinity;
      
      return width >= minWidth && width < maxWidth;
    }

    return false;
  }, [query, breakpoint, width, breakpoints]);
};

export default WindowSize;