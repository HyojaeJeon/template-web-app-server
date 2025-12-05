/**
 * useFocus.js - 포커스 상태 관리 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 포커스 상태 감지 및 관리
 * - 접근성 준수 포커스 관리
 * - 키보드 네비게이션 지원
 * - 자동 포커스 및 포커스 트랩
 */

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * 포커스 상태 관리 훅
 */
export const useFocus = () => {
  const [isFocused, setIsFocused] = useState(false)
  const ref = useRef(null)

  const setFocus = useCallback(() => {
    ref.current?.focus()
  }, [])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  useEffect(() => {
    const element = ref.current
    if (!element) return

    element.addEventListener('focus', handleFocus)
    element.addEventListener('blur', handleBlur)

    return () => {
      element.removeEventListener('focus', handleFocus)
      element.removeEventListener('blur', handleBlur)
    }
  }, [handleFocus, handleBlur])

  return [ref, isFocused, setFocus]
}

/**
 * 자동 포커스 훅
 */
export const useAutoFocus = (shouldFocus = true, delay = 0) => {
  const ref = useRef(null)

  useEffect(() => {
    if (shouldFocus && ref.current) {
      if (delay > 0) {
        const timer = setTimeout(() => {
          ref.current?.focus()
        }, delay)
        return () => clearTimeout(timer)
      } else {
        ref.current.focus()
      }
    }
  }, [shouldFocus, delay])

  return ref
}

/**
 * 포커스 트랩 훅
 */
export const useFocusTrap = (isActive = true) => {
  const ref = useRef(null)

  useEffect(() => {
    if (!isActive || !ref.current) return

    const element = ref.current
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    return () => element.removeEventListener('keydown', handleKeyDown)
  }, [isActive])

  return ref
}

export default useFocus