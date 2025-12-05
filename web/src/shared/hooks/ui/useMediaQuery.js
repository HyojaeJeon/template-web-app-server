/**
 * useMediaQuery.js - 미디어 쿼리 상태 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - CSS 미디어 쿼리 상태 감지
 * - 반응형 컴포넌트 렌더링
 * - 다크 모드 감지
 * - 접근성 설정 감지 (prefers-reduced-motion 등)
 * - Local 디바이스 특화 쿼리
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * 기본 미디어 쿼리 훅
 * @param {string} query 미디어 쿼리 문자열
 * @param {boolean} defaultValue 기본값 (SSR 대응)
 */
export const useMediaQuery = (query, defaultValue = false) => {
  const [matches, setMatches] = useState(defaultValue)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handleChange = (event) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [query])

  return matches
}

/**
 * 다중 미디어 쿼리 훅
 * @param {Object} queries 쿼리 객체 { key: query }
 * @param {Object} defaultValues 기본값 객체
 */
export const useMultipleMediaQueries = (queries, defaultValues = {}) => {
  const [matches, setMatches] = useState(defaultValues)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQueries = Object.entries(queries).map(([key, query]) => ({
      key,
      mq: window.matchMedia(query)
    }))

    const updateMatches = () => {
      const newMatches = {}
      mediaQueries.forEach(({ key, mq }) => {
        newMatches[key] = mq.matches
      })
      setMatches(newMatches)
    }

    // 초기값 설정
    updateMatches()

    // 리스너 등록
    mediaQueries.forEach(({ mq }) => {
      mq.addEventListener('change', updateMatches)
    })

    return () => {
      mediaQueries.forEach(({ mq }) => {
        mq.removeEventListener('change', updateMatches)
      })
    }
  }, [queries])

  return matches
}

/**
 * 반응형 브레이크포인트 훅
 */
export const useBreakpoints = () => {
  const queries = {
    xs: '(min-width: 0px)',
    sm: '(min-width: 640px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 1024px)',
    xl: '(min-width: 1280px)',
    '2xl': '(min-width: 1536px)'
  }

  return useMultipleMediaQueries(queries, {
    xs: true,
    sm: false,
    md: false,
    lg: false,
    xl: false,
    '2xl': false
  })
}

/**
 * 다크 모드 감지 훅
 */
export const usePrefersColorScheme = () => {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const prefersLight = useMediaQuery('(prefers-color-scheme: light)')
  
  let scheme = 'light'
  if (prefersDark) scheme = 'dark'
  else if (prefersLight) scheme = 'light'
  else scheme = 'no-preference'

  return {
    scheme,
    prefersDark,
    prefersLight,
    hasPreference: prefersDark || prefersLight
  }
}

/**
 * 접근성 설정 감지 훅
 */
export const useAccessibilityPreferences = () => {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const prefersHighContrast = useMediaQuery('(prefers-contrast: high)')
  const prefersReducedTransparency = useMediaQuery('(prefers-reduced-transparency: reduce)')
  const prefersReducedData = useMediaQuery('(prefers-reduced-data: reduce)')

  return {
    prefersReducedMotion,
    prefersHighContrast,
    prefersReducedTransparency,
    prefersReducedData,
    // Local어 라벨들
    labels: {
      reducedMotion: 'Giảm chuyển động',
      highContrast: 'Độ t대비 cao',
      reducedTransparency: 'Giảm độ trong suốt',
      reducedData: 'Tiết kiệm dữ liệu'
    }
  }
}

/**
 * 디바이스 특성 감지 훅
 */
export const useDeviceCapabilities = () => {
  const canHover = useMediaQuery('(hover: hover)')
  const canFinePointer = useMediaQuery('(pointer: fine)')
  const isHighResolution = useMediaQuery('(min-resolution: 2dppx)')
  const supportsP3Color = useMediaQuery('(color-gamut: p3)')
  
  return {
    canHover,
    canFinePointer,
    isHighResolution,
    supportsP3Color,
    isTouchPrimary: !canHover && !canFinePointer,
    isMousePrimary: canHover && canFinePointer
  }
}

/**
 * 화면 방향 감지 훅
 */
export const useOrientation = () => {
  const isPortrait = useMediaQuery('(orientation: portrait)')
  const isLandscape = useMediaQuery('(orientation: landscape)')

  return {
    orientation: isPortrait ? 'portrait' : 'landscape',
    isPortrait,
    isLandscape
  }
}

/**
 * Local 특화 미디어 쿼리 훅
 * Local에서 인기 있는 디바이스와 사용 패턴을 고려
 */
export const useVietnameseDeviceQueries = () => {
  const queries = {
    // Local에서 인기 있는 모바일 디바이스 크기들
    smallMobile: '(max-width: 360px)',      // Galaxy S/iPhone SE 크기
    standardMobile: '(min-width: 361px) and (max-width: 414px)', // iPhone 표준 크기
    largeMobile: '(min-width: 415px) and (max-width: 480px)',    // iPhone Plus/Max 크기
    
    // 태블릿 크기 (Local에서 인기 있는 iPad/Android 태블릿)
    smallTablet: '(min-width: 481px) and (max-width: 768px)',
    largeTablet: '(min-width: 769px) and (max-width: 1024px)',
    
    // 데스크톱/노트북
    laptop: '(min-width: 1025px) and (max-width: 1440px)',
    desktop: '(min-width: 1441px)',
    
    // 특별한 비율들
    ultraWide: '(min-aspect-ratio: 21/9)',
    square: '(aspect-ratio: 1/1)',
    
    // Local 카페/공유 오피스에서 자주 보는 저해상도 화면
    lowDensity: '(max-resolution: 1dppx)',
    
    // Local에서 인기 있는 저사양 안드로이드 디바이스 감지
    lowEndDevice: '(max-width: 480px) and (max-resolution: 1.5dppx)'
  }

  const matches = useMultipleMediaQueries(queries, {
    smallMobile: false,
    standardMobile: false,
    largeMobile: false,
    smallTablet: false,
    largeTablet: false,
    laptop: false,
    desktop: false,
    ultraWide: false,
    square: false,
    lowDensity: false,
    lowEndDevice: false
  })

  return {
    ...matches,
    // 편의 메서드들
    isMobileDevice: matches.smallMobile || matches.standardMobile || matches.largeMobile,
    isTabletDevice: matches.smallTablet || matches.largeTablet,
    isDesktopDevice: matches.laptop || matches.desktop,
    
    // Local 특화 최적화 플래그들
    needsLightweightUI: matches.lowEndDevice,
    canShowComplexAnimations: !matches.lowEndDevice && !matches.lowDensity,
    shouldUseInfiniteScroll: matches.isMobileDevice || matches.isTabletDevice,
    
    // Local 음식점 관리 최적화
    isOptimalForPOSManagement: matches.isTabletDevice || matches.isDesktopDevice,
    needsMobileOptimization: matches.isMobileDevice,
    
    // Local어 디바이스 타입 라벨
    deviceTypeLabel: (() => {
      if (matches.isMobileDevice) return 'Điện thoại di động'
      if (matches.isTabletDevice) return 'Máy tính bảng'
      if (matches.isDesktopDevice) return 'Máy tính để bàn'
      return 'Không xác định'
    })()
  }
}

/**
 * 동적 미디어 쿼리 생성 함수
 */
export const createMediaQueryHook = (baseQuery, variations = {}) => {
  return (customQuery = '') => {
    const finalQuery = customQuery || baseQuery
    return useMediaQuery(finalQuery)
  }
}

/**
 * 조건부 미디어 쿼리 훅
 * 특정 조건에서만 미디어 쿼리를 활성화
 */
export const useConditionalMediaQuery = (query, condition = true, defaultValue = false) => {
  const mediaQueryResult = useMediaQuery(query, defaultValue)
  
  return condition ? mediaQueryResult : defaultValue
}

/**
 * 미디어 쿼리 디버깅 훅
 * 개발 환경에서 현재 매치되는 모든 쿼리 확인
 */
export const useMediaQueryDebug = () => {
  const commonQueries = {
    'Mobile (max-width: 768px)': '(max-width: 768px)',
    'Tablet (768px - 1024px)': '(min-width: 768px) and (max-width: 1024px)',
    'Desktop (min-width: 1024px)': '(min-width: 1024px)',
    'Dark Mode': '(prefers-color-scheme: dark)',
    'Reduced Motion': '(prefers-reduced-motion: reduce)',
    'High DPI': '(min-resolution: 2dppx)',
    'Portrait': '(orientation: portrait)',
    'Landscape': '(orientation: landscape)',
    'Can Hover': '(hover: hover)',
    'Touch Device': '(pointer: coarse)'
  }

  const results = useMultipleMediaQueries(commonQueries)
  
  // 개발 환경에서만 콘솔에 출력
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const activeQueries = Object.entries(results)
        .filter(([_, matches]) => matches)
        .map(([query, _]) => query)
      
      console.log('🔍 Active Media Queries:', activeQueries)
    }
  }, [results])

  return results
}

export default useMediaQuery