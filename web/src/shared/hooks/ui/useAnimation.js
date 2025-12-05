/**
 * useAnimation.js - 애니메이션 제어 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - CSS 애니메이션 제어
 * - 접근성 고려 (prefers-reduced-motion)
 * - 시퀀스 애니메이션 지원
 * - 성능 최적화된 애니메이션
 */

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * 애니메이션 제어 훅
 */
export const useAnimation = (options = {}) => {
  const {
    duration = 300,
    easing = 'ease',
    delay = 0,
    fillMode = 'both',
    respectMotionPreference = true
  } = options

  const [isAnimating, setIsAnimating] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const ref = useRef(null)

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (respectMotionPreference) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)
      
      const handleChange = (e) => setPrefersReducedMotion(e.matches)
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [respectMotionPreference])

  const animate = useCallback((keyframes, customOptions = {}) => {
    const element = ref.current
    if (!element || (prefersReducedMotion && respectMotionPreference)) return

    const animationOptions = {
      duration: customOptions.duration || duration,
      easing: customOptions.easing || easing,
      delay: customOptions.delay || delay,
      fill: customOptions.fillMode || fillMode,
      ...customOptions
    }

    setIsAnimating(true)
    setHasCompleted(false)

    const animation = element.animate(keyframes, animationOptions)

    animation.addEventListener('finish', () => {
      setIsAnimating(false)
      setHasCompleted(true)
    })

    return animation
  }, [duration, easing, delay, fillMode, prefersReducedMotion, respectMotionPreference])

  return {
    ref,
    animate,
    isAnimating,
    hasCompleted,
    prefersReducedMotion
  }
}

/**
 * Local 특화 애니메이션 훅
 */
export const useVietnameseAnimation = (options = {}) => {
  const vietnameseOptions = {
    duration: 250, // Local 사용자들이 선호하는 빠른 애니메이션
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // Material Design easing
    ...options
  }

  const animation = useAnimation(vietnameseOptions)

  // Local 앱에서 자주 사용하는 애니메이션들
  const fadeIn = useCallback(() => {
    return animation.animate([
      { opacity: 0 },
      { opacity: 1 }
    ])
  }, [animation])

  const slideInUp = useCallback(() => {
    return animation.animate([
      { transform: 'translateY(20px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ])
  }, [animation])

  const pulse = useCallback(() => {
    return animation.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(1)' }
    ], { duration: 200 })
  }, [animation])

  return {
    ...animation,
    fadeIn,
    slideInUp,
    pulse
  }
}

export default useAnimation