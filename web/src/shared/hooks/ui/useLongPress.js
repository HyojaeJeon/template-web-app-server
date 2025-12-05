/**
 * useLongPress.js - 롱프레스 감지 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 터치 및 마우스 롱프레스 감지
 * - 모바일 친화적인 인터랙션
 * - 컨텍스트 메뉴 트리거에 활용
 * - 접근성 고려 (키보드 대안 제공)
 */

'use client'

import { useCallback, useRef, useState } from 'react'

/**
 * 롱프레스 감지 훅
 * @param {Function} onLongPress 롱프레스 시 실행할 콜백
 * @param {Object} options 설정 옵션
 */
export const useLongPress = (onLongPress, options = {}) => {
  const {
    threshold = 500,        // 롱프레스 인식 시간 (ms)
    onStart,               // 프레스 시작 콜백
    onFinish,              // 프레스 완료 콜백
    onCancel,              // 프레스 취소 콜백
    preventClick = true    // 롱프레스 후 클릭 이벤트 방지
  } = options

  const [isLongPressing, setIsLongPressing] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const timerRef = useRef(null)
  const progressTimerRef = useRef(null)
  const isLongPressRef = useRef(false)
  const startTimeRef = useRef(0)

  const start = useCallback((event) => {
    setIsLongPressing(true)
    setProgress(0)
    isLongPressRef.current = false
    startTimeRef.current = Date.now()
    
    onStart?.(event)

    // 진행률 업데이트
    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current
      const newProgress = Math.min((elapsed / threshold) * 100, 100)
      setProgress(newProgress)
      
      if (newProgress < 100 && isLongPressing) {
        progressTimerRef.current = requestAnimationFrame(updateProgress)
      }
    }
    updateProgress()

    // 롱프레스 타이머
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      onLongPress(event)
      onFinish?.(event)
    }, threshold)
  }, [onLongPress, onStart, onFinish, threshold, isLongPressing])

  const clear = useCallback((event, shouldPreventClick = false) => {
    setIsLongPressing(false)
    setProgress(0)
    
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    if (progressTimerRef.current) {
      cancelAnimationFrame(progressTimerRef.current)
    }

    if (shouldPreventClick && preventClick && isLongPressRef.current) {
      event?.preventDefault()
      event?.stopPropagation()
    }

    if (!isLongPressRef.current) {
      onCancel?.(event)
    }

    isLongPressRef.current = false
  }, [onCancel, preventClick])

  const handlers = {
    onMouseDown: start,
    onMouseUp: (e) => clear(e, true),
    onMouseLeave: (e) => clear(e, false),
    onTouchStart: start,
    onTouchEnd: (e) => clear(e, true),
    onClick: preventClick ? (e) => {
      if (isLongPressRef.current) {
        e.preventDefault()
        e.stopPropagation()
      }
    } : undefined
  }

  return {
    handlers,
    isLongPressing,
    progress
  }
}

/**
 * Local 특화 롱프레스 훅
 * Local 사용자 행동 패턴에 최적화
 */
export const useVietnameseLongPress = (onLongPress, options = {}) => {
  const vietnameseOptions = {
    threshold: 800, // Local 사용자들은 조금 더 긴 프레스를 선호
    ...options
  }

  const longPress = useLongPress(onLongPress, vietnameseOptions)

  return {
    ...longPress,
    // Local어 접근성 라벨
    ariaLabel: 'Nhấn và giữ để xem thêm tùy chọn',
    helpText: `Nhấn và giữ ${vietnameseOptions.threshold}ms để kích hoạt`
  }
}

export default useLongPress