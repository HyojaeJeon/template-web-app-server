/**
 * useWindowSize.js - 윈도우 크기 추적 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 윈도우 크기 변경 감지
 * - 반응형 레이아웃 처리
 * - 디바이스 타입 감지 (모바일/태블릿/데스크톱)
 * - 방향 변경 감지 (세로/가로)
 * - 성능 최적화된 리사이즈 이벤트 처리
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * 기본 윈도우 크기 훅
 * @param {Object} options 설정 옵션
 * @param {number} options.debounceMs 리사이즈 이벤트 디바운스 시간 (기본: 100ms)
 * @param {boolean} options.initialSize 초기 크기 사용 여부 (기본: true)
 */
export const useWindowSize = (options = {}) => {
  const { debounceMs = 100, initialSize = true } = options
  
  const getSize = useCallback(() => {
    if (typeof window === 'undefined') {
      return { width: 1200, height: 800 } // SSR 기본값
    }
    
    return {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }, [])

  const [windowSize, setWindowSize] = useState(initialSize ? getSize : { width: 0, height: 0 })
  const timeoutRef = useRef(null)

  const handleResize = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setWindowSize(getSize())
    }, debounceMs)
  }, [debounceMs, getSize])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 초기 크기 설정
    if (!initialSize) {
      setWindowSize(getSize())
    }

    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [handleResize, getSize, initialSize])

  return windowSize
}

/**
 * 브레이크포인트 기반 반응형 훅
 * @param {Object} breakpoints 커스텀 브레이크포인트
 */
export const useBreakpoint = (breakpoints = {}) => {
  const defaultBreakpoints = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
    ...breakpoints
  }

  const { width } = useWindowSize({ debounceMs: 50 })
  
  const [currentBreakpoint, setCurrentBreakpoint] = useState('xs')
  const [isAbove, setIsAbove] = useState({})
  const [isBelow, setIsBelow] = useState({})

  useEffect(() => {
    const breakpointEntries = Object.entries(defaultBreakpoints).sort(([,a], [,b]) => b - a)
    
    // 현재 브레이크포인트 찾기
    for (const [name, minWidth] of breakpointEntries) {
      if (width >= minWidth) {
        setCurrentBreakpoint(name)
        break
      }
    }

    // isAbove, isBelow 상태 업데이트
    const above = {}
    const below = {}
    
    Object.entries(defaultBreakpoints).forEach(([name, minWidth]) => {
      above[name] = width >= minWidth
      below[name] = width < minWidth
    })
    
    setIsAbove(above)
    setIsBelow(below)
  }, [width, defaultBreakpoints])

  return {
    width,
    currentBreakpoint,
    isAbove,
    isBelow,
    // 편의 메서드들
    isMobile: width < defaultBreakpoints.md,
    isTablet: width >= defaultBreakpoints.md && width < defaultBreakpoints.lg,
    isDesktop: width >= defaultBreakpoints.lg,
    isSmallScreen: width < defaultBreakpoints.sm,
    isLargeScreen: width >= defaultBreakpoints.xl
  }
}

/**
 * 디바이스 타입 및 방향 감지 훅
 */
export const useDeviceDetection = () => {
  const { width, height } = useWindowSize({ debounceMs: 100 })
  
  const [deviceInfo, setDeviceInfo] = useState({
    type: 'desktop',
    orientation: 'landscape',
    isPortrait: false,
    isLandscape: true,
    pixelRatio: 1,
    isTouchDevice: false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateDeviceInfo = () => {
      const isPortrait = height > width
      const aspectRatio = width / height
      
      let deviceType = 'desktop'
      if (width <= 480) {
        deviceType = 'mobile'
      } else if (width <= 1024) {
        deviceType = 'tablet'
      }

      setDeviceInfo({
        type: deviceType,
        orientation: isPortrait ? 'portrait' : 'landscape',
        isPortrait,
        isLandscape: !isPortrait,
        aspectRatio,
        pixelRatio: window.devicePixelRatio || 1,
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        isHighDensity: window.devicePixelRatio > 1.5,
        // Local 모바일 디바이스 최적화
        isVietnameseMobile: deviceType === 'mobile' && (
          /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        )
      })
    }

    updateDeviceInfo()
    
    // 방향 변경 감지
    const handleOrientationChange = () => {
      setTimeout(updateDeviceInfo, 100) // 방향 변경 후 약간의 지연
    }

    window.addEventListener('orientationchange', handleOrientationChange)
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [width, height])

  return deviceInfo
}

/**
 * 뷰포트 크기 훅 (스크롤바 제외)
 */
export const useViewportSize = () => {
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateSize = () => {
      setViewportSize({
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight
      })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return viewportSize
}

/**
 * 컨테이너 요소 크기 추적 훅
 * @param {React.RefObject} elementRef 추적할 요소의 ref
 */
export const useElementSize = (elementRef) => {
  const [elementSize, setElementSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const updateSize = () => {
      const rect = element.getBoundingClientRect()
      setElementSize({
        width: rect.width,
        height: rect.height
      })
    }

    // ResizeObserver 사용 (지원되는 경우)
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        updateSize()
      })

      resizeObserver.observe(element)
      updateSize() // 초기 크기 설정

      return () => resizeObserver.unobserve(element)
    } else {
      // 폴백: 윈도우 리사이즈 이벤트 사용
      updateSize()
      window.addEventListener('resize', updateSize)
      
      return () => window.removeEventListener('resize', updateSize)
    }
  }, [elementRef])

  return elementSize
}

/**
 * Local 특화 반응형 훅
 * Local 디바이스 및 해상도에 최적화된 브레이크포인트
 */
export const useVietnameseResponsive = () => {
  // Local에서 인기 있는 디바이스 해상도 고려
  const vietnameseBreakpoints = {
    mobile: 0,      // 320px 이상 (iPhone SE, Android 기본)
    phablet: 480,   // 480px 이상 (큰 안드로이드 폰)
    tablet: 768,    // 768px 이상 (iPad, 안드로이드 태블릿)
    laptop: 1024,   // 1024px 이상 (노트북)
    desktop: 1440   // 1440px 이상 (데스크톱)
  }

  const breakpoint = useBreakpoint(vietnameseBreakpoints)
  const device = useDeviceDetection()
  
  // Local 사용자 행동 패턴 기반 최적화
  const isOptimalForOrdering = device.type === 'mobile' && device.isPortrait
  const needsLargerTouchTargets = device.isTouchDevice && breakpoint.width < 600
  const shouldShowMobileNavigation = breakpoint.isMobile || (device.isTouchDevice && breakpoint.isTablet)

  return {
    ...breakpoint,
    device,
    // Local 특화 플래그들
    isOptimalForOrdering,
    needsLargerTouchTargets,
    shouldShowMobileNavigation,
    // Local어 라벨들
    deviceLabels: {
      mobile: 'Điện thoại di động',
      tablet: 'Máy tính bảng',
      desktop: 'Máy tính để bàn',
      portrait: 'Chế độ dọc',
      landscape: 'Chế độ ngang'
    },
    // Local 음식점 관리자를 위한 최적화
    isManagerFriendly: breakpoint.isDesktop || (breakpoint.isTablet && device.isLandscape),
    showAdvancedControls: breakpoint.width >= 1024,
    useCompactLayout: breakpoint.width < 768
  }
}

/**
 * 윈도우 크기 변경 감지 훅
 */
export const useWindowSizeChange = (callback, dependencies = []) => {
  const { width, height } = useWindowSize()
  const prevSize = useRef({ width, height })

  useEffect(() => {
    if (prevSize.current.width !== width || prevSize.current.height !== height) {
      callback({ 
        current: { width, height }, 
        previous: prevSize.current,
        widthChanged: prevSize.current.width !== width,
        heightChanged: prevSize.current.height !== height
      })
      prevSize.current = { width, height }
    }
  }, [width, height, callback, ...dependencies])
}

export default useWindowSize