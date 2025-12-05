/**
 * useScrollPosition.js - 스크롤 위치 추적 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 윈도우 및 요소의 스크롤 위치 추적
 * - 스크롤 방향 감지
 * - 스크롤 진행률 계산
 * - 성능 최적화된 스크롤 이벤트 처리
 * - 무한 스크롤 및 헤더 숨김에 활용
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * 기본 스크롤 위치 훅
 * @param {Object} options 설정 옵션
 * @param {number} options.throttleMs 스크롤 이벤트 쓰로틀 시간 (기본: 16ms)
 * @param {React.RefObject} options.element 추적할 요소 ref (기본: window)
 */
export const useScrollPosition = (options = {}) => {
  const { throttleMs = 16, element = null } = options
  
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 })
  const [prevScrollPosition, setPrevScrollPosition] = useState({ x: 0, y: 0 })
  
  const lastRun = useRef(Date.now())

  const handleScroll = useCallback(() => {
    const now = Date.now()
    if (now - lastRun.current >= throttleMs) {
      const target = element?.current || window
      const x = element?.current ? target.scrollLeft : target.scrollX
      const y = element?.current ? target.scrollTop : target.scrollY

      setPrevScrollPosition(scrollPosition)
      setScrollPosition({ x, y })
      lastRun.current = now
    }
  }, [throttleMs, element, scrollPosition])

  useEffect(() => {
    const target = element?.current || window
    target.addEventListener('scroll', handleScroll, { passive: true })
    
    // 초기 스크롤 위치 설정
    handleScroll()

    return () => target.removeEventListener('scroll', handleScroll)
  }, [handleScroll, element])

  return {
    scrollPosition,
    prevScrollPosition,
    scrollDirection: {
      x: scrollPosition.x > prevScrollPosition.x ? 'right' : scrollPosition.x < prevScrollPosition.x ? 'left' : null,
      y: scrollPosition.y > prevScrollPosition.y ? 'down' : scrollPosition.y < prevScrollPosition.y ? 'up' : null
    }
  }
}

/**
 * 스크롤 방향 감지 훅
 * @param {Object} options 설정 옵션
 * @param {number} options.threshold 방향 변경 감지 임계값 (기본: 10px)
 * @param {React.RefObject} options.element 추적할 요소 ref
 */
export const useScrollDirection = (options = {}) => {
  const { threshold = 10, element = null } = options
  
  const [scrollDirection, setScrollDirection] = useState(null)
  const [isScrollingUp, setIsScrollingUp] = useState(false)
  const [isScrollingDown, setIsScrollingDown] = useState(false)
  
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  const updateScrollDirection = useCallback(() => {
    const target = element?.current || window
    const scrollY = element?.current ? target.scrollTop : target.scrollY
    
    if (Math.abs(scrollY - lastScrollY.current) < threshold) {
      ticking.current = false
      return
    }

    const direction = scrollY > lastScrollY.current ? 'down' : 'up'
    setScrollDirection(direction)
    setIsScrollingUp(direction === 'up')
    setIsScrollingDown(direction === 'down')
    
    lastScrollY.current = scrollY > 0 ? scrollY : 0
    ticking.current = false
  }, [threshold, element])

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(updateScrollDirection)
      ticking.current = true
    }
  }, [updateScrollDirection])

  useEffect(() => {
    const target = element?.current || window
    target.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => target.removeEventListener('scroll', handleScroll)
  }, [handleScroll, element])

  return {
    scrollDirection,
    isScrollingUp,
    isScrollingDown
  }
}

/**
 * 스크롤 진행률 훅
 * @param {React.RefObject} element 추적할 요소 ref (기본: document.documentElement)
 */
export const useScrollProgress = (element = null) => {
  const [scrollProgress, setScrollProgress] = useState(0)

  const calculateProgress = useCallback(() => {
    const target = element?.current || document.documentElement
    const scrollTop = element?.current 
      ? target.scrollTop 
      : window.scrollY || document.documentElement.scrollTop

    const scrollHeight = target.scrollHeight - target.clientHeight
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
    
    setScrollProgress(Math.min(100, Math.max(0, progress)))
  }, [element])

  useEffect(() => {
    const target = element?.current || window
    
    const handleScroll = () => {
      requestAnimationFrame(calculateProgress)
    }

    target.addEventListener('scroll', handleScroll, { passive: true })
    calculateProgress() // 초기 진행률 계산

    return () => target.removeEventListener('scroll', handleScroll)
  }, [calculateProgress, element])

  return scrollProgress
}

/**
 * 요소가 뷰포트에 보이는지 확인하는 훅
 * @param {React.RefObject} elementRef 추적할 요소 ref
 * @param {Object} options Intersection Observer 옵션
 */
export const useScrollVisibility = (elementRef, options = {}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [intersectionRatio, setIntersectionRatio] = useState(0)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
        setIntersectionRatio(entry.intersectionRatio)
      },
      {
        threshold: options.threshold || 0,
        rootMargin: options.rootMargin || '0px',
        root: options.root || null
      }
    )

    observer.observe(element)

    return () => observer.unobserve(element)
  }, [elementRef, options.threshold, options.rootMargin, options.root])

  return { isVisible, intersectionRatio }
}

/**
 * 부드러운 스크롤 훅
 */
export const useSmoothScroll = () => {
  const scrollTo = useCallback((target, options = {}) => {
    const { duration = 500, easing = 'easeInOutQuad', offset = 0 } = options
    
    let targetElement
    
    if (typeof target === 'string') {
      targetElement = document.querySelector(target)
    } else if (target instanceof HTMLElement) {
      targetElement = target
    } else if (typeof target === 'number') {
      // 숫자인 경우 Y 위치로 스크롤
      window.scrollTo({
        top: target + offset,
        behavior: 'smooth'
      })
      return
    }

    if (!targetElement) return

    const startPosition = window.scrollY
    const targetPosition = targetElement.offsetTop + offset
    const distance = targetPosition - startPosition
    const startTime = performance.now()

    const easingFunctions = {
      easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      easeOutQuart: t => 1 - (--t) * t * t * t,
      linear: t => t
    }

    const easingFunction = easingFunctions[easing] || easingFunctions.easeInOutQuad

    const animateScroll = (currentTime) => {
      const timeElapsed = currentTime - startTime
      const progress = Math.min(timeElapsed / duration, 1)
      const ease = easingFunction(progress)
      
      window.scrollTo(0, startPosition + distance * ease)
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)
  }, [])

  const scrollToTop = useCallback((options = {}) => {
    scrollTo(0, options)
  }, [scrollTo])

  const scrollToElement = useCallback((element, options = {}) => {
    scrollTo(element, options)
  }, [scrollTo])

  return { scrollTo, scrollToTop, scrollToElement }
}

/**
 * Local 특화 스크롤 훅
 * Local App에서 자주 사용하는 스크롤 패턴
 */
export const useVietnameseScroll = () => {
  const { scrollDirection, isScrollingUp } = useScrollDirection({ threshold: 50 })
  const scrollProgress = useScrollProgress()
  const { scrollToTop } = useSmoothScroll()
  
  // 헤더 숨김/표시 로직
  const [hideHeader, setHideHeader] = useState(false)
  
  useEffect(() => {
    setHideHeader(scrollDirection === 'down' && window.scrollY > 100)
  }, [scrollDirection])

  // Back to Top 버튼 표시 로직
  const [showBackToTop, setShowBackToTop] = useState(false)
  
  useEffect(() => {
    setShowBackToTop(window.scrollY > 300)
  }, [scrollProgress])

  return {
    scrollDirection,
    isScrollingUp,
    scrollProgress,
    hideHeader,
    showBackToTop,
    scrollToTop: () => scrollToTop({ duration: 800 }),
    // Local어 접근성 라벨
    backToTopLabel: 'Về đầu trang',
    scrollProgressLabel: `Tiến độ cuộn: ${Math.round(scrollProgress)}%`
  }
}

export default useScrollPosition