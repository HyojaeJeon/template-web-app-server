/**
 * 사이드바 상태 관리 훅
 * 반응형 브레이크포인트, 상태 저장, 키보드 네비게이션 지원
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMediaQuery } from './ui/useMediaQuery';
import { useLocalStorage } from './data/useLocalStorage';

const useSidebar = (initialState = { isOpen: true, variant: 'full' }) => {
  // 로컬 스토리지에 사이드바 상태 저장
  const [sidebarState, setSidebarState] = useLocalStorage('sidebar-state', initialState);
  
  // 미디어 쿼리로 브레이크포인트 감지
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');

  // 현재 사이드바 상태
  const [currentState, setCurrentState] = useState(() => {
    // 모바일에서는 기본적으로 닫힌 상태로 시작
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return {
        ...sidebarState,
        isOpen: false,
        variant: 'overlay'
      };
    }
    return sidebarState;
  });

  // 브레이크포인트에 따른 사이드바 변형 자동 조정
  useEffect(() => {
    let newVariant = 'full';
    let shouldBeOpen = currentState.isOpen;

    if (isMobile) {
      newVariant = 'overlay';
      // 모바일에서는 페이지 전환 시 자동으로 닫힘
      shouldBeOpen = false;
    } else if (isTablet) {
      newVariant = 'mini';
      shouldBeOpen = true;
    } else if (isDesktop) {
      newVariant = 'full';
      shouldBeOpen = true;
    }

    setCurrentState(prev => ({
      ...prev,
      variant: newVariant,
      isOpen: shouldBeOpen
    }));
  }, [isMobile, isTablet, isDesktop, currentState.isOpen]);

  // 사이드바 토글
  const toggle = useCallback((forceState) => {
    setCurrentState(prev => {
      const newState = {
        ...prev,
        isOpen: forceState !== undefined ? forceState : !prev.isOpen
      };
      
      // 데스크탑에서는 상태를 저장
      if (isDesktop) {
        setSidebarState(newState);
      }
      
      return newState;
    });
  }, [isDesktop, setSidebarState]);

  // 사이드바 열기
  const open = useCallback(() => {
    toggle(true);
  }, [toggle]);

  // 사이드바 닫기
  const close = useCallback(() => {
    toggle(false);
  }, [toggle]);

  // 사이드바 변형 변경
  const setVariant = useCallback((variant) => {
    setCurrentState(prev => {
      const newState = { ...prev, variant };
      setSidebarState(newState);
      return newState;
    });
  }, [setSidebarState]);

  // ESC 키로 모바일/태블릿에서 사이드바 닫기
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && currentState.isOpen && (isMobile || isTablet)) {
        close();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [currentState.isOpen, isMobile, isTablet, close]);

  // 모바일에서 라우트 변경 시 자동으로 사이드바 닫기
  useEffect(() => {
    const handleRouteChange = () => {
      if (isMobile && currentState.isOpen) {
        close();
      }
    };

    // Next.js 라우터 이벤트 감지
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleRouteChange);
      return () => window.removeEventListener('popstate', handleRouteChange);
    }
  }, [isMobile, currentState.isOpen, close]);

  // 사이드바 상태 정보
  const sidebarInfo = {
    isOpen: currentState.isOpen,
    variant: currentState.variant,
    isMobile,
    isTablet,
    isDesktop,
    isCollapsed: currentState.variant === 'mini',
    isOverlay: currentState.variant === 'overlay'
  };

  return {
    ...sidebarInfo,
    toggle,
    open,
    close,
    setVariant,
    // 편의 메서드들
    toggleOnMobile: isMobile ? toggle : () => {},
    closeOnMobile: isMobile ? close : () => {},
    // 스타일링을 위한 클래스 헬퍼
    getContainerClasses: () => {
      const baseClasses = 'transition-all duration-300 ease-in-out';
      
      if (currentState.variant === 'overlay') {
        return `${baseClasses} ${currentState.isOpen ? 'ml-0' : 'ml-0'}`;
      }
      
      if (currentState.variant === 'mini') {
        return `${baseClasses} ${currentState.isOpen ? 'ml-16' : 'ml-0'}`;
      }
      
      // full variant
      return `${baseClasses} ${currentState.isOpen ? 'ml-64' : 'ml-0'}`;
    },
    
    getSidebarClasses: () => {
      const baseClasses = 'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out';
      
      if (currentState.variant === 'overlay') {
        return `${baseClasses} fixed inset-y-0 left-0 z-50 w-64 ${
          currentState.isOpen ? 'translate-x-0' : '-translate-x-full'
        }`;
      }
      
      if (currentState.variant === 'mini') {
        return `${baseClasses} relative w-16`;
      }
      
      // full variant
      return `${baseClasses} relative w-64`;
    },
    
    getOverlayClasses: () => {
      if (currentState.variant === 'overlay' && currentState.isOpen) {
        return 'fixed inset-0 bg-black bg-opacity-50 z-40';
      }
      return 'hidden';
    }
  };
};

export default useSidebar;