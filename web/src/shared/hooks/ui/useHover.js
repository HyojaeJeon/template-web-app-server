/**
 * useHover.js - 호버 상태 감지 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 마우스 호버 상태 감지
 * - 터치 디바이스 호환성
 * - 지연 호버 효과
 * - 접근성 지원 (포커스 상태)
 */

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * 기본 호버 훅
 * @param {React.RefObject} ref 호버를 감지할 요소의 ref
 * @param {Object} options 옵션
 */
export const useHover = (ref, options = {}) => {
  const {
    enterDelay = 0,
    leaveDelay = 0,
    onEnter,
    onLeave
  } = options

  const [isHovering, setIsHovering] = useState(false)
  const enterTimeoutRef = useRef(null)
  const leaveTimeoutRef = useRef(null)

  const handleMouseEnter = useCallback(() => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
    }

    if (enterDelay) {
      enterTimeoutRef.current = setTimeout(() => {
        setIsHovering(true)
        onEnter?.()
      }, enterDelay)
    } else {
      setIsHovering(true)
      onEnter?.()
    }
  }, [enterDelay, onEnter])

  const handleMouseLeave = useCallback(() => {
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current)
    }

    if (leaveDelay) {
      leaveTimeoutRef.current = setTimeout(() => {
        setIsHovering(false)
        onLeave?.()
      }, leaveDelay)
    } else {
      setIsHovering(false)
      onLeave?.()
    }
  }, [leaveDelay, onLeave])

  useEffect(() => {
    const element = ref.current
    if (!element) return

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
      
      if (enterTimeoutRef.current) {
        clearTimeout(enterTimeoutRef.current)
      }
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current)
      }
    }
  }, [handleMouseEnter, handleMouseLeave])

  return isHovering
}

/**
 * Local 특화 호버 훅
 * 모바일 친화적 호버 효과
 */
export const useVietnameseHover = (ref, options = {}) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  const vietnameseOptions = {
    enterDelay: isTouchDevice ? 0 : 150, // 터치 디바이스에서는 즉시 반응
    leaveDelay: isTouchDevice ? 0 : 100,
    ...options
  }

  const isHovering = useHover(ref, vietnameseOptions)

  return {
    isHovering,
    isTouchDevice,
    shouldShowTooltip: isHovering && !isTouchDevice
  }
}

export default useHover