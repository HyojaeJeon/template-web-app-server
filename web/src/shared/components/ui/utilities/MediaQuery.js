/**
 * MediaQuery 컴포넌트
 * 반응형 미디어 쿼리를 위한 컴포넌트
 * WCAG 2.1 준수, 다크테마 지원
 */

import React, { useState, useEffect, useMemo } from 'react';

// Local 모바일 중심 브레이크포인트
const BREAKPOINTS = {
  XS: 320,    // 최소 모바일 (iPhone SE, 갤럭시 폴드)
  SM: 640,    // 모바일 (대부분의 스마트폰)
  MD: 768,    // 태블릿 세로
  LG: 1024,   // 태블릿 가로, 작은 데스크톱
  XL: 1280,   // 데스크톱
  XXL: 1536   // 대형 데스크톱
};

const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet', 
  DESKTOP: 'desktop',
  LARGE_DESKTOP: 'large_desktop'
};

const ORIENTATIONS = {
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape'
};

// 미디어 쿼리 훅
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e) => setMatches(e.matches);
    
    // 최신 브라우저 API 사용
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // 레거시 브라우저 지원
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
};

// 화면 정보 훅
const useScreenInfo = () => {
  const [screenInfo, setScreenInfo] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    deviceType: DEVICE_TYPES.DESKTOP,
    orientation: ORIENTATIONS.LANDSCAPE,
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    isRetina: typeof window !== 'undefined' ? window.devicePixelRatio > 1 : false
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateScreenInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pixelRatio = window.devicePixelRatio;
      
      // 디바이스 타입 결정
      let deviceType = DEVICE_TYPES.DESKTOP;
      if (width < BREAKPOINTS.SM) {
        deviceType = DEVICE_TYPES.MOBILE;
      } else if (width < BREAKPOINTS.LG) {
        deviceType = DEVICE_TYPES.TABLET;
      } else if (width >= BREAKPOINTS.XXL) {
        deviceType = DEVICE_TYPES.LARGE_DESKTOP;
      }

      // 방향 결정
      const orientation = width > height ? ORIENTATIONS.LANDSCAPE : ORIENTATIONS.PORTRAIT;

      setScreenInfo({
        width,
        height,
        deviceType,
        orientation,
        pixelRatio,
        isRetina: pixelRatio > 1
      });
    };

    updateScreenInfo();
    
    window.addEventListener('resize', updateScreenInfo);
    window.addEventListener('orientationchange', updateScreenInfo);

    return () => {
      window.removeEventListener('resize', updateScreenInfo);
      window.removeEventListener('orientationchange', updateScreenInfo);
    };
  }, []);

  return screenInfo;
};

const MediaQuery = ({ 
  children,
  minWidth = null,
  maxWidth = null,
  minHeight = null,
  maxHeight = null,
  orientation = null,
  deviceType = null,
  query = null,
  inverse = false,
  fallback = null,
  className = '',
  ...props 
}) => {
  // 커스텀 쿼리가 제공되면 직접 사용
  const customMatches = useMediaQuery(query || '');
  const screenInfo = useScreenInfo();

  // 조건 확인
  const matches = useMemo(() => {
    if (query) return customMatches;

    let result = true;

    // 폭 조건
    if (minWidth && screenInfo.width < minWidth) result = false;
    if (maxWidth && screenInfo.width > maxWidth) result = false;

    // 높이 조건
    if (minHeight && screenInfo.height < minHeight) result = false;
    if (maxHeight && screenInfo.height > maxHeight) result = false;

    // 방향 조건
    if (orientation && screenInfo.orientation !== orientation) result = false;

    // 디바이스 타입 조건
    if (deviceType && screenInfo.deviceType !== deviceType) result = false;

    return inverse ? !result : result;
  }, [
    query, 
    customMatches, 
    minWidth, 
    maxWidth, 
    minHeight, 
    maxHeight, 
    orientation, 
    deviceType, 
    inverse,
    screenInfo
  ]);

  // 조건에 맞지 않으면 fallback 렌더링
  if (!matches) {
    return fallback ? (
      <div className={className} {...props}>
        {fallback}
      </div>
    ) : null;
  }

  // children이 함수면 화면 정보를 전달
  if (typeof children === 'function') {
    return (
      <div className={className} {...props}>
        {children(screenInfo)}
      </div>
    );
  }

  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

// 사전 정의된 미디어 쿼리 컴포넌트들
export const Mobile = (props) => (
  <MediaQuery deviceType={DEVICE_TYPES.MOBILE} {...props} />
);

export const MobileOnly = (props) => (
  <MediaQuery maxWidth={BREAKPOINTS.SM - 1} {...props} />
);

export const Tablet = (props) => (
  <MediaQuery deviceType={DEVICE_TYPES.TABLET} {...props} />
);

export const TabletOnly = (props) => (
  <MediaQuery 
    minWidth={BREAKPOINTS.SM} 
    maxWidth={BREAKPOINTS.LG - 1} 
    {...props} 
  />
);

export const Desktop = (props) => (
  <MediaQuery deviceType={DEVICE_TYPES.DESKTOP} {...props} />
);

export const DesktopOnly = (props) => (
  <MediaQuery minWidth={BREAKPOINTS.LG} {...props} />
);

export const LargeDesktop = (props) => (
  <MediaQuery deviceType={DEVICE_TYPES.LARGE_DESKTOP} {...props} />
);

export const Portrait = (props) => (
  <MediaQuery orientation={ORIENTATIONS.PORTRAIT} {...props} />
);

export const Landscape = (props) => (
  <MediaQuery orientation={ORIENTATIONS.LANDSCAPE} {...props} />
);

export const Retina = (props) => (
  <MediaQuery query="(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)" {...props} />
);

export const TouchDevice = (props) => (
  <MediaQuery query="(hover: none) and (pointer: coarse)" {...props} />
);

export const MouseDevice = (props) => (
  <MediaQuery query="(hover: hover) and (pointer: fine)" {...props} />
);

// 다크모드 지원
export const DarkMode = (props) => (
  <MediaQuery query="(prefers-color-scheme: dark)" {...props} />
);

export const LightMode = (props) => (
  <MediaQuery query="(prefers-color-scheme: light)" {...props} />
);

// 접근성 관련 미디어 쿼리
export const ReducedMotion = (props) => (
  <MediaQuery query="(prefers-reduced-motion: reduce)" {...props} />
);

export const HighContrast = (props) => (
  <MediaQuery query="(prefers-contrast: high)" {...props} />
);

// Local어 지원을 위한 폰트 크기 조절
export const LargeFontSize = (props) => (
  <MediaQuery query="(min-resolution: 120dpi) and (max-width: 768px)" {...props} />
);

// 복합 조건 컴포넌트
export const MobilePortrait = (props) => (
  <MediaQuery 
    deviceType={DEVICE_TYPES.MOBILE} 
    orientation={ORIENTATIONS.PORTRAIT} 
    {...props} 
  />
);

export const MobileLandscape = (props) => (
  <MediaQuery 
    deviceType={DEVICE_TYPES.MOBILE} 
    orientation={ORIENTATIONS.LANDSCAPE} 
    {...props} 
  />
);

export const TabletPortrait = (props) => (
  <MediaQuery 
    deviceType={DEVICE_TYPES.TABLET} 
    orientation={ORIENTATIONS.PORTRAIT} 
    {...props} 
  />
);

export const TabletLandscape = (props) => (
  <MediaQuery 
    deviceType={DEVICE_TYPES.TABLET} 
    orientation={ORIENTATIONS.LANDSCAPE} 
    {...props} 
  />
);

// Local 특화 반응형 컴포넌트
export const VietnameseText = ({ children, ...props }) => {
  return (
    <MediaQuery {...props}>
      {(screenInfo) => (
        <div 
          style={{
            fontSize: screenInfo.deviceType === DEVICE_TYPES.MOBILE ? '14px' : '16px',
            lineHeight: screenInfo.deviceType === DEVICE_TYPES.MOBILE ? '1.5' : '1.6',
            // Local어 특수 문자 지원
            fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
          }}
        >
          {children}
        </div>
      )}
    </MediaQuery>
  );
};

// HOC for responsive components
export const withMediaQuery = (Component, mediaQueryProps) => {
  return React.forwardRef((props, ref) => (
    <MediaQuery {...mediaQueryProps}>
      <Component {...props} ref={ref} />
    </MediaQuery>
  ));
};

// Export hooks and constants
export { useMediaQuery, useScreenInfo, BREAKPOINTS, DEVICE_TYPES, ORIENTATIONS };
export default MediaQuery;