/**
 * 브레이크포인트 관리 훅 - 확장 버전
 * 반응형 디자인을 위한 현재 화면 크기 감지 및 브레이크포인트 제공
 * Local App 디자인 시스템에 최적화
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * 브레이크포인트 정의 (Tailwind CSS 호환)
 */
const BREAKPOINTS = {
  xs: 0,      // 모바일 초소형
  sm: 640,    // 모바일 대형
  md: 768,    // 태블릿
  lg: 1024,   // 데스크탑
  xl: 1280,   // 와이드 데스크탑
  '2xl': 1536, // 초대형 화면
  // 레거시 호환성
  mobile: 0,
  tablet: 640,
  desktop: 1024,
  xxl: 1536
};

/**
 * 디바이스 타입별 분류
 */
const DEVICE_TYPES = {
  mobile: 'mobile',     // xs, sm
  tablet: 'tablet',     // md
  desktop: 'desktop',   // lg, xl, 2xl
  tv: 'tv'             // 매우 큰 화면
};

export function useBreakpoint() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  const [currentBreakpoint, setCurrentBreakpoint] = useState('desktop');
  const [deviceType, setDeviceType] = useState('desktop');

  /**
   * 현재 브레이크포인트 계산
   */
  const calculateBreakpoint = useCallback((width) => {
    if (width >= BREAKPOINTS['2xl']) return '2xl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  }, []);

  /**
   * 디바이스 타입 계산
   */
  const calculateDeviceType = useCallback((width, height) => {
    // TV/대형 디스플레이
    if (width >= 1920 && height >= 1080) {
      return DEVICE_TYPES.tv;
    }
    
    // 데스크탑
    if (width >= BREAKPOINTS.lg) {
      return DEVICE_TYPES.desktop;
    }
    
    // 태블릿
    if (width >= BREAKPOINTS.md && width < BREAKPOINTS.lg) {
      return DEVICE_TYPES.tablet;
    }
    
    // 모바일
    return DEVICE_TYPES.mobile;
  }, []);

  /**
   * 윈도우 크기 변경 핸들러
   */
  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return;

    const newSize = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    setWindowSize(newSize);
    
    const newBreakpoint = calculateBreakpoint(newSize.width);
    const newDeviceType = calculateDeviceType(newSize.width, newSize.height);
    
    setCurrentBreakpoint(newBreakpoint);
    setDeviceType(newDeviceType);
  }, [calculateBreakpoint, calculateDeviceType]);

  // 윈도우 리사이즈 이벤트 리스너 등록
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 초기 값 설정
    handleResize();

    // 디바운싱을 위한 타이머
    let resizeTimer;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize, { passive: true });
    
    // 오리엔테이션 변경 감지 (모바일)
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 100);
    }, { passive: true });

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [handleResize]);

  /**
   * 특정 브레이크포인트 이상인지 확인
   */
  const isAbove = useCallback((breakpoint) => {
    const currentWidth = windowSize.width;
    const targetWidth = BREAKPOINTS[breakpoint];
    return currentWidth >= targetWidth;
  }, [windowSize.width]);

  /**
   * 특정 브레이크포인트 이하인지 확인
   */
  const isBelow = useCallback((breakpoint) => {
    const currentWidth = windowSize.width;
    const targetWidth = BREAKPOINTS[breakpoint];
    return currentWidth < targetWidth;
  }, [windowSize.width]);

  /**
   * 반응형 값 선택 헬퍼
   */
  const selectValue = useCallback((values) => {
    const orderedBreakpoints = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
    const currentIndex = orderedBreakpoints.indexOf(currentBreakpoint);
    
    for (let i = currentIndex; i < orderedBreakpoints.length; i++) {
      const bp = orderedBreakpoints[i];
      if (values[bp] !== undefined) {
        return values[bp];
      }
    }
    
    return values.default || null;
  }, [currentBreakpoint]);

  return {
    // 현재 상태
    windowSize,
    currentBreakpoint,
    deviceType,
    windowWidth: windowSize.width, // 레거시 호환성
    
    // 디바이스별 조건
    device: {
      isMobile: deviceType === DEVICE_TYPES.mobile,
      isTablet: deviceType === DEVICE_TYPES.tablet,
      isDesktop: deviceType === DEVICE_TYPES.desktop,
      isTV: deviceType === DEVICE_TYPES.tv,
      isTouchDevice: deviceType === DEVICE_TYPES.mobile || deviceType === DEVICE_TYPES.tablet
    },
    
    // 레거시 호환성 유지
    isMobile: currentBreakpoint === 'xs' || currentBreakpoint === 'sm',
    isTablet: currentBreakpoint === 'md',
    isDesktop: ['lg', 'xl', '2xl'].includes(currentBreakpoint),
    isXl: currentBreakpoint === 'xl' || currentBreakpoint === '2xl',
    isXxl: currentBreakpoint === '2xl',
    
    // 새로운 브레이크포인트 조건
    isXs: currentBreakpoint === 'xs',
    isSm: currentBreakpoint === 'sm',
    isMd: currentBreakpoint === 'md',
    isLg: currentBreakpoint === 'lg',
    is2xl: currentBreakpoint === '2xl',
    
    // 조건 확인 함수들
    isAbove,
    isBelow,
    
    // 헬퍼 함수들
    selectValue,
    
    // 상수
    breakpoints: BREAKPOINTS,
    BREAKPOINTS,
    DEVICE_TYPES
  };
}