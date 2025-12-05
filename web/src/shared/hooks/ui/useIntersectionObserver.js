/**
 * useIntersectionObserver.js - 요소 가시성 감지 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - Intersection Observer API를 활용한 요소 가시성 감지
 * - 지연 로딩, 무한 스크롤, 애니메이션 트리거에 활용
 * - 성능 최적화된 가시성 추적
 * - 다중 요소 관찰 지원
 * - Local 특화 스크롤 패턴 최적화
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * 기본 Intersection Observer 훅
 * @param {React.RefObject} elementRef 관찰할 요소의 ref
 * @param {Object} options Intersection Observer 옵션
 * @param {number|number[]} options.threshold 교차 임계값 (기본: 0)
 * @param {string} options.rootMargin 루트 마진 (기본: '0px')
 * @param {Element} options.root 루트 요소 (기본: viewport)
 * @param {boolean} options.enabled 옵저버 활성화 여부 (기본: true)
 */
export const useIntersectionObserver = (elementRef, options = {}) => {
  const {
    threshold = 0,
    rootMargin = '0px',
    root = null,
    enabled = true
  } = options

  const [isIntersecting, setIsIntersecting] = useState(false)
  const [intersectionRatio, setIntersectionRatio] = useState(0)
  const [entry, setEntry] = useState(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element || !enabled) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        setIntersectionRatio(entry.intersectionRatio)
        setEntry(entry)
      },
      { threshold, rootMargin, root }
    )

    observer.observe(element)

    return () => observer.unobserve(element)
  }, [elementRef, threshold, rootMargin, root, enabled])

  return {
    isIntersecting,
    intersectionRatio,
    entry
  }
}

/**
 * 다중 요소 Intersection Observer 훅
 * @param {Object} options Intersection Observer 옵션
 */
export const useMultipleIntersectionObserver = (options = {}) => {
  const [entries, setEntries] = useState(new Map())
  const observerRef = useRef(null)
  const elementsRef = useRef(new Set())

  // 요소 추가
  const addElement = useCallback((element) => {
    if (!element || !observerRef.current) return

    elementsRef.current.add(element)
    observerRef.current.observe(element)
  }, [])

  // 요소 제거
  const removeElement = useCallback((element) => {
    if (!element || !observerRef.current) return

    elementsRef.current.delete(element)
    observerRef.current.unobserve(element)
    setEntries(prev => {
      const newEntries = new Map(prev)
      newEntries.delete(element)
      return newEntries
    })
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (observedEntries) => {
        setEntries(prev => {
          const newEntries = new Map(prev)
          observedEntries.forEach(entry => {
            newEntries.set(entry.target, {
              isIntersecting: entry.isIntersecting,
              intersectionRatio: entry.intersectionRatio,
              entry
            })
          })
          return newEntries
        })
      },
      options
    )

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [options])

  return {
    entries,
    addElement,
    removeElement
  }
}

/**
 * 지연 로딩 훅
 * @param {React.RefObject} elementRef 관찰할 요소의 ref
 * @param {Object} options 옵션
 */
export const useLazyLoad = (elementRef, options = {}) => {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    triggerOnce = true
  } = options

  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)

  const { isIntersecting } = useIntersectionObserver(elementRef, {
    rootMargin,
    threshold,
    enabled: !triggerOnce || !hasBeenVisible
  })

  useEffect(() => {
    if (isIntersecting) {
      setIsVisible(true)
      if (triggerOnce) {
        setHasBeenVisible(true)
      }
    } else if (!triggerOnce) {
      setIsVisible(false)
    }
  }, [isIntersecting, triggerOnce])

  return {
    isVisible,
    hasBeenVisible,
    shouldLoad: isVisible
  }
}

/**
 * 무한 스크롤 훅
 * @param {Function} loadMore 추가 데이터 로드 함수
 * @param {Object} options 옵션
 */
export const useInfiniteScroll = (loadMore, options = {}) => {
  const {
    rootMargin = '100px',
    threshold = 0.1,
    enabled = true,
    hasMore = true
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const triggerRef = useRef(null)

  const { isIntersecting } = useIntersectionObserver(triggerRef, {
    rootMargin,
    threshold,
    enabled: enabled && hasMore && !isLoading
  })

  useEffect(() => {
    if (isIntersecting && enabled && hasMore && !isLoading) {
      setIsLoading(true)
      setError(null)

      Promise.resolve(loadMore())
        .then(() => {
          setIsLoading(false)
        })
        .catch((err) => {
          setError(err)
          setIsLoading(false)
        })
    }
  }, [isIntersecting, enabled, hasMore, isLoading, loadMore])

  return {
    triggerRef,
    isLoading,
    error
  }
}

/**
 * 애니메이션 트리거 훅
 * @param {React.RefObject} elementRef 관찰할 요소의 ref
 * @param {Object} options 옵션
 */
export const useAnimationTrigger = (elementRef, options = {}) => {
  const {
    threshold = 0.5,
    rootMargin = '0px',
    triggerOnce = true,
    delay = 0
  } = options

  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const timeoutRef = useRef(null)

  const { isIntersecting } = useIntersectionObserver(elementRef, {
    threshold,
    rootMargin,
    enabled: !triggerOnce || !hasAnimated
  })

  useEffect(() => {
    if (isIntersecting && (!triggerOnce || !hasAnimated)) {
      if (delay > 0) {
        timeoutRef.current = setTimeout(() => {
          setShouldAnimate(true)
          if (triggerOnce) {
            setHasAnimated(true)
          }
        }, delay)
      } else {
        setShouldAnimate(true)
        if (triggerOnce) {
          setHasAnimated(true)
        }
      }
    } else if (!triggerOnce && !isIntersecting) {
      setShouldAnimate(false)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isIntersecting, triggerOnce, hasAnimated, delay])

  return {
    shouldAnimate,
    hasAnimated,
    isIntersecting
  }
}

/**
 * 스크롤 진행률 추적 훅
 * @param {React.RefObject} elementRef 관찰할 요소의 ref
 */
export const useScrollProgress = (elementRef) => {
  const [progress, setProgress] = useState(0)

  const { entry } = useIntersectionObserver(elementRef, {
    threshold: Array.from({ length: 101 }, (_, i) => i / 100), // 0~100% 세밀하게 추적
    rootMargin: '0px'
  })

  useEffect(() => {
    if (entry) {
      setProgress(Math.round(entry.intersectionRatio * 100))
    }
  }, [entry])

  return progress
}

/**
 * Local 특화 가시성 훅
 * Local 사용자의 스크롤 패턴을 고려한 최적화
 */
export const useVietnameseVisibility = (elementRef, options = {}) => {
  const {
    // Local 모바일 사용자는 빠르게 스크롤하는 경향
    rootMargin = '200px',
    threshold = 0.25,
    trackScrollSpeed = true
  } = options

  const [scrollSpeed, setScrollSpeed] = useState(0)
  const [isSlowScrolling, setIsSlowScrolling] = useState(true)
  const lastScrollTime = useRef(Date.now())
  const lastScrollY = useRef(0)

  const visibility = useIntersectionObserver(elementRef, {
    rootMargin,
    threshold
  })

  // 스크롤 속도 추적
  useEffect(() => {
    if (!trackScrollSpeed) return

    const handleScroll = () => {
      const now = Date.now()
      const currentScrollY = window.scrollY
      const timeDiff = now - lastScrollTime.current
      const scrollDiff = Math.abs(currentScrollY - lastScrollY.current)
      
      if (timeDiff > 0) {
        const speed = scrollDiff / timeDiff
        setScrollSpeed(speed)
        setIsSlowScrolling(speed < 0.5) // 느린 스크롤 임계값
      }

      lastScrollTime.current = now
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [trackScrollSpeed])

  return {
    ...visibility,
    scrollSpeed,
    isSlowScrolling,
    // Local 특화 권장사항
    shouldShowDetailedContent: visibility.isIntersecting && isSlowScrolling,
    shouldPreloadContent: visibility.intersectionRatio > 0.1,
    // Local어 접근성 라벨
    visibilityLabel: visibility.isIntersecting ? 'Hiển thị' : 'Ẩn',
    progressLabel: `Tiến độ hiển thị: ${Math.round(visibility.intersectionRatio * 100)}%`
  }
}

/**
 * 컴포넌트 등장 효과 훅
 * @param {React.RefObject} elementRef 관찰할 요소의 ref
 * @param {Object} options 옵션
 */
export const useRevealOnScroll = (elementRef, options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    animationDelay = 0,
    animationDuration = 600,
    animationType = 'fadeInUp'
  } = options

  const [isRevealed, setIsRevealed] = useState(false)
  const [animationClass, setAnimationClass] = useState('')

  const { isIntersecting } = useIntersectionObserver(elementRef, {
    threshold,
    rootMargin,
    enabled: !isRevealed
  })

  useEffect(() => {
    if (isIntersecting && !isRevealed) {
      setTimeout(() => {
        setIsRevealed(true)
        setAnimationClass(`animate-${animationType}`)
      }, animationDelay)
    }
  }, [isIntersecting, isRevealed, animationDelay, animationType])

  return {
    isRevealed,
    animationClass,
    style: {
      animationDuration: `${animationDuration}ms`,
      opacity: isRevealed ? 1 : 0,
      transform: isRevealed ? 'none' : 'translateY(20px)'
    }
  }
}

export default useIntersectionObserver