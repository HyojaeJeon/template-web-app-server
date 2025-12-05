/**
 * useClickOutside.js - 외부 클릭 감지 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 요소 외부 클릭 이벤트 감지
 * - 드롭다운, 모달, 팝오버 닫기에 활용
 * - 키보드 이벤트 (ESC) 지원
 * - 터치 이벤트 지원 (모바일)
 * - 접근성 고려한 포커스 관리
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * 기본 외부 클릭 감지 훅
 * @param {React.RefObject} ref 감지할 요소의 ref
 * @param {Function} handler 외부 클릭 시 실행할 콜백
 * @param {boolean} enabled 훅 활성화 여부
 */
export const useClickOutside = (ref, handler, enabled = true) => {
  const savedHandler = useRef(handler)

  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    if (!enabled) return

    const handleClickOutside = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return
      }
      savedHandler.current(event)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [ref, enabled])
}

/**
 * 고급 외부 클릭 감지 훅
 * @param {Function} handler 외부 클릭 시 실행할 콜백
 * @param {Object} options 설정 옵션
 * @param {boolean} options.enabled 훅 활성화 여부 (기본: true)
 * @param {string[]} options.events 감지할 이벤트 타입들 (기본: ['mousedown', 'touchstart'])
 * @param {boolean} options.captureOnEscape ESC 키 감지 여부 (기본: true)
 * @param {string[]} options.ignoreSelectors 무시할 선택자들
 * @param {Function} options.condition 조건부 실행 함수
 */
export const useAdvancedClickOutside = (handler, options = {}) => {
  const {
    enabled = true,
    events = ['mousedown', 'touchstart'],
    captureOnEscape = true,
    ignoreSelectors = [],
    condition = () => true
  } = options

  const ref = useRef(null)
  const savedHandler = useRef(handler)

  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  const handleClickOutside = useCallback((event) => {
    if (!enabled || !condition()) return

    const element = ref.current
    if (!element || element.contains(event.target)) return

    // 무시할 선택자 확인
    if (ignoreSelectors.some(selector => {
      const ignoreElement = document.querySelector(selector)
      return ignoreElement && ignoreElement.contains(event.target)
    })) {
      return
    }

    savedHandler.current(event)
  }, [enabled, condition, ignoreSelectors])

  const handleEscapeKey = useCallback((event) => {
    if (!enabled || !condition() || !captureOnEscape) return
    
    if (event.key === 'Escape') {
      savedHandler.current(event)
    }
  }, [enabled, condition, captureOnEscape])

  useEffect(() => {
    if (!enabled) return

    events.forEach(eventName => {
      document.addEventListener(eventName, handleClickOutside, true)
    })

    if (captureOnEscape) {
      document.addEventListener('keydown', handleEscapeKey, true)
    }

    return () => {
      events.forEach(eventName => {
        document.removeEventListener(eventName, handleClickOutside, true)
      })
      
      if (captureOnEscape) {
        document.removeEventListener('keydown', handleEscapeKey, true)
      }
    }
  }, [enabled, events, captureOnEscape, handleClickOutside, handleEscapeKey])

  return ref
}

/**
 * Local 특화 외부 클릭 훅
 * Local UI 패턴에 특화된 외부 클릭 감지
 */
export const useVietnameseClickOutside = (handler, options = {}) => {
  const {
    enabled = true,
    ignoreNotifications = true, // 알림 영역 무시
    ignoreTooltips = true,      // 툴팁 무시
    ignorePopovers = true       // 팝오버 무시
  } = options

  const defaultIgnoreSelectors = []
  
  if (ignoreNotifications) {
    defaultIgnoreSelectors.push('.toast-container', '.notification-panel')
  }
  
  if (ignoreTooltips) {
    defaultIgnoreSelectors.push('.tooltip', '[role="tooltip"]')
  }
  
  if (ignorePopovers) {
    defaultIgnoreSelectors.push('.popover', '[role="dialog"]')
  }

  return useAdvancedClickOutside(handler, {
    ...options,
    enabled,
    ignoreSelectors: [
      ...defaultIgnoreSelectors,
      ...(options.ignoreSelectors || [])
    ]
  })
}

export default useClickOutside