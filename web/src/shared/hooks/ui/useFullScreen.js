/**
 * useFullScreen.js - 전체화면 제어 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - Fullscreen API 제어
 * - 크로스 브라우저 호환성
 * - 키오스크 모드 지원
 * - 모바일 전체화면 최적화
 */

'use client'

import { useState, useCallback, useEffect } from 'react'

/**
 * 전체화면 제어 훅
 */
export const useFullScreen = (elementRef = null) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported(
      !!(document.fullscreenEnabled || 
         document.webkitFullscreenEnabled || 
         document.mozFullScreenEnabled ||
         document.msFullscreenEnabled)
    )

    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(document.fullscreenElement ||
           document.webkitFullscreenElement ||
           document.mozFullScreenElement ||
           document.msFullscreenElement)
      )
    }

    // 다양한 브라우저 이벤트 리스너 등록
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  const enterFullscreen = useCallback(async () => {
    if (!isSupported) return false

    const element = elementRef?.current || document.documentElement

    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen()
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen()
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen()
      }
      return true
    } catch (error) {
      console.error('Failed to enter fullscreen:', error)
      return false
    }
  }, [elementRef, isSupported])

  const exitFullscreen = useCallback(async () => {
    if (!isSupported || !isFullscreen) return false

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen()
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen()
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen()
      }
      return true
    } catch (error) {
      console.error('Failed to exit fullscreen:', error)
      return false
    }
  }, [isSupported, isFullscreen])

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      return exitFullscreen()
    } else {
      return enterFullscreen()
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen])

  return {
    isFullscreen,
    isSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen
  }
}

/**
 * Local 특화 전체화면 훅
 */
export const useVietnameseFullScreen = (elementRef = null) => {
  const fullscreen = useFullScreen(elementRef)
  
  return {
    ...fullscreen,
    // Local어 라벨들
    labels: {
      enterFullscreen: 'Vào chế độ toàn màn hình',
      exitFullscreen: 'Thoát chế độ toàn màn hình',
      toggleFullscreen: 'Chuyển đổi chế độ toàn màn hình',
      notSupported: 'Trình duyệt không hỗ trợ chế độ toàn màn hình'
    }
  }
}

export default useFullScreen