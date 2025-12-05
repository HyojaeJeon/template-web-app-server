'use client';

import { useEffect, useState } from 'react';

/**
 * useSafePathname - usePathname을 안전하게 사용하는 커스텀 훅
 * Router Context 초기화 전에 호출해도 안전하게 처리
 * SSR/하이드레이션 타이밍 이슈 해결
 */
export function useSafePathname() {
  const [pathname, setPathname] = useState('/');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 클라이언트에서만 실행
    if (typeof window === 'undefined') {
      return;
    }

    // 즉시 window.location으로 pathname 설정
    const currentPath = window.location.pathname;
    setPathname(currentPath);
    setIsReady(true);

    // pathname 변경 감지를 위한 리스너 추가
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
    };

    // popstate 이벤트로 브라우저 뒤로가기/앞으로가기 감지
    window.addEventListener('popstate', handleLocationChange);
    
    // 정리 함수
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  return { pathname, isReady };
}

/**
 * withSafePathname - 컴포넌트를 안전한 pathname 사용으로 감싸는 HOC
 */
export function withSafePathname(Component) {
  const WrappedComponent = (props) => {
    const { pathname, isReady } = useSafePathname();
    
    // Router Context가 준비되지 않았으면 로딩 상태 표시
    if (!isReady) {
      return null; // 또는 로딩 스피너
    }

    return <Component {...props} pathname={pathname} />;
  };

  WrappedComponent.displayName = `withSafePathname(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

/**
 * SafePathnameProvider - Router Context 안전성을 위한 Provider
 * 모든 pathname 의존 컴포넌트를 감싸는 Context
 */
import { createContext, useContext } from 'react';

const SafePathnameContext = createContext({ pathname: null, isReady: false });

export function SafePathnameProvider({ children }) {
  const [pathname, setPathname] = useState('/');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // RouterContext 초기화 대기
    const timer = setTimeout(() => {
      try {
        const currentPathname = usePathname();
        setPathname(currentPathname);
        setIsReady(true);
      } catch (error) {
        console.warn('Router Context initialization delayed');
        setPathname('/dashboard'); // 기본값
        setIsReady(true);
      }
    }, 100); // 100ms 지연으로 Router Context 초기화 대기

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafePathnameContext.Provider value={{ pathname, isReady }}>
      {children}
    </SafePathnameContext.Provider>
  );
}

export function useSafePathnameContext() {
  return useContext(SafePathnameContext);
}