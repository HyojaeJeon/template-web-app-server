/**
 * useThrottle.js - 쓰로틀 처리 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 고빈도 이벤트(스크롤, 리사이즈 등) 성능 최적화
 * - API 호출 빈도 제한으로 서버 부하 감소
 * - 검색 입력 최적화
 * - 실시간 데이터 업데이트 제어
 * - 메모리 누수 방지를 위한 cleanup 처리
 */

'use client'

import { useRef, useCallback, useEffect } from 'react'

/**
 * 기본 쓰로틀 훅
 * @param {Function} callback 쓰로틀할 함수
 * @param {number} delay 쓰로틀 지연 시간 (밀리초)
 * @param {Object} options 추가 옵션
 * @param {boolean} options.leading 첫 호출 즉시 실행 여부 (기본: true)
 * @param {boolean} options.trailing 마지막 호출 지연 실행 여부 (기본: true)
 */
export const useThrottle = (callback, delay, options = {}) => {
  const { leading = true, trailing = true } = options
  
  const lastCallTime = useRef(0)
  const timeoutId = useRef(null)
  const lastArgs = useRef(null)

  const clearTimer = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current)
      timeoutId.current = null
    }
  }, [])

  const throttledFunction = useCallback((...args) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime.current

    lastArgs.current = args

    // 첫 호출이거나 충분한 시간이 지난 경우
    if (lastCallTime.current === 0 || timeSinceLastCall >= delay) {
      if (leading) {
        lastCallTime.current = now
        callback(...args)
      }
      return
    }

    // 이미 예약된 호출이 없고, trailing이 활성화된 경우
    if (!timeoutId.current && trailing) {
      const remainingTime = delay - timeSinceLastCall
      
      timeoutId.current = setTimeout(() => {
        lastCallTime.current = Date.now()
        callback(...lastArgs.current)
        timeoutId.current = null
      }, remainingTime)
    }
  }, [callback, delay, leading, trailing])

  // cleanup
  useEffect(() => {
    return () => {
      clearTimer()
    }
  }, [clearTimer])

  // 강제 실행
  const flush = useCallback(() => {
    if (timeoutId.current && lastArgs.current) {
      clearTimer()
      lastCallTime.current = Date.now()
      callback(...lastArgs.current)
    }
  }, [callback, clearTimer])

  // 취소
  const cancel = useCallback(() => {
    clearTimer()
    lastCallTime.current = 0
    lastArgs.current = null
  }, [clearTimer])

  return {
    throttledFunction,
    flush,
    cancel,
    isPending: () => timeoutId.current !== null
  }
}

/**
 * 값 쓰로틀 훅
 * @param {any} value 쓰로틀할 값
 * @param {number} delay 지연 시간
 */
export const useThrottleValue = (value, delay) => {
  const { throttledFunction } = useThrottle((newValue, setValue) => {
    setValue(newValue)
  }, delay, { leading: true, trailing: false })

  const [throttledValue, setThrottledValue] = React.useState(value)

  React.useEffect(() => {
    throttledFunction(value, setThrottledValue)
  }, [value, throttledFunction])

  return throttledValue
}

/**
 * 스크롤 쓰로틀 훅
 */
export const useThrottleScroll = (callback, delay = 100) => {
  const { throttledFunction } = useThrottle(callback, delay)

  useEffect(() => {
    const handleScroll = (event) => {
      throttledFunction({
        scrollY: window.scrollY,
        scrollX: window.scrollX,
        scrollTop: event.target.scrollTop || document.documentElement.scrollTop,
        scrollLeft: event.target.scrollLeft || document.documentElement.scrollLeft,
        scrollDirection: window.scrollY > (handleScroll.lastScrollY || 0) ? 'down' : 'up'
      })
      handleScroll.lastScrollY = window.scrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [throttledFunction])
}

/**
 * 리사이즈 쓰로틀 훅
 */
export const useThrottleResize = (callback, delay = 250) => {
  const { throttledFunction } = useThrottle(callback, delay)

  useEffect(() => {
    const handleResize = () => {
      throttledFunction({
        width: window.innerWidth,
        height: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight
      })
    }

    window.addEventListener('resize', handleResize, { passive: true })
    
    // 초기 호출
    handleResize()
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [throttledFunction])
}

/**
 * API 호출 쓰로틀 훅
 */
export const useThrottleAPI = (apiFunction, delay = 1000) => {
  const { throttledFunction, flush, cancel } = useThrottle(apiFunction, delay, {
    leading: false,
    trailing: true
  })

  const callAPI = useCallback((...args) => {
    return new Promise((resolve, reject) => {
      const wrappedFunction = async () => {
        try {
          const result = await apiFunction(...args)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }
      throttledFunction(wrappedFunction)
    })
  }, [throttledFunction, apiFunction])

  return {
    callAPI,
    flush,
    cancel
  }
}

/**
 * 검색 쓰로틀 훅
 */
export const useThrottleSearch = (searchFunction, delay = 300) => {
  const searchRef = useRef('')
  const { throttledFunction, cancel } = useThrottle((query) => {
    if (query === searchRef.current) {
      searchFunction(query)
    }
  }, delay, { leading: false, trailing: true })

  const search = useCallback((query) => {
    searchRef.current = query
    if (query.trim() === '') {
      cancel()
      searchFunction('')
    } else {
      throttledFunction(query)
    }
  }, [throttledFunction, cancel, searchFunction])

  return {
    search,
    cancel: () => {
      cancel()
      searchRef.current = ''
    }
  }
}

/**
 * 마우스 이벤트 쓰로틀 훅
 */
export const useThrottleMouse = (callback, delay = 50) => {
  const { throttledFunction } = useThrottle(callback, delay, {
    leading: true,
    trailing: false
  })

  const handleMouseMove = useCallback((event) => {
    throttledFunction({
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY,
      movementX: event.movementX,
      movementY: event.movementY
    })
  }, [throttledFunction])

  return { handleMouseMove }
}

/**
 * 실시간 데이터 업데이트 쓰로틀 훅
 */
export const useThrottleRealtime = (updateFunction, delay = 1000) => {
  const queueRef = useRef([])
  const { throttledFunction, flush } = useThrottle(() => {
    if (queueRef.current.length > 0) {
      // 큐에 있는 모든 업데이트를 배치로 처리
      const updates = [...queueRef.current]
      queueRef.current = []
      updateFunction(updates)
    }
  }, delay, { leading: false, trailing: true })

  const addUpdate = useCallback((update) => {
    queueRef.current.push(update)
    throttledFunction()
  }, [throttledFunction])

  const flushUpdates = useCallback(() => {
    flush()
  }, [flush])

  return {
    addUpdate,
    flushUpdates,
    getPendingCount: () => queueRef.current.length
  }
}

export default useThrottle