/**
 * useKeyPress.js - 키보드 입력 감지 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 특정 키 입력 감지
 * - 단축키 조합 구현 지원
 * - 접근성 준수 (키보드 네비게이션)
 * - Local어 키보드 지원
 * - 키 시퀀스 감지 (치트코드 등)
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * 기본 키 입력 감지 훅
 * @param {string|string[]} targetKey 감지할 키
 * @param {Function} handler 키 입력 시 실행할 핸들러
 * @param {Object} options 옵션
 */
export const useKeyPress = (targetKey, handler, options = {}) => {
  const {
    enabled = true,
    preventDefault = false,
    stopPropagation = false,
    element = null,
    eventType = 'keydown'
  } = options

  const savedHandler = useRef(handler)

  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    if (!enabled) return

    const handleKeyPress = (event) => {
      const isTargetKey = Array.isArray(targetKey) 
        ? targetKey.some(key => key.toLowerCase() === event.key.toLowerCase())
        : targetKey.toLowerCase() === event.key.toLowerCase()

      if (isTargetKey) {
        if (preventDefault) event.preventDefault()
        if (stopPropagation) event.stopPropagation()
        savedHandler.current(event)
      }
    }

    const eventTarget = element?.current || element || window
    eventTarget.addEventListener(eventType, handleKeyPress)

    return () => {
      eventTarget.removeEventListener(eventType, handleKeyPress)
    }
  }, [targetKey, enabled, preventDefault, stopPropagation, element, eventType])
}

/**
 * 키 조합(단축키) 감지 훅
 * @param {Object} shortcut 단축키 정의 { ctrl: true, key: 's' }
 * @param {Function} handler 단축키 실행 시 핸들러
 * @param {Object} options 옵션
 */
export const useKeyboardShortcut = (shortcut, handler, options = {}) => {
  const { enabled = true, preventDefault = true } = options
  const savedHandler = useRef(handler)

  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event) => {
      const {
        key,
        ctrl = false,
        shift = false,
        alt = false,
        meta = false
      } = shortcut

      const keyMatch = key.toLowerCase() === event.key.toLowerCase()
      const ctrlMatch = ctrl === (event.ctrlKey || event.metaKey) // Mac의 Cmd 키 지원
      const shiftMatch = shift === event.shiftKey
      const altMatch = alt === event.altKey
      const metaMatch = meta === event.metaKey

      if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
        if (preventDefault) event.preventDefault()
        savedHandler.current(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcut, enabled, preventDefault])
}

/**
 * 키 시퀀스 감지 훅 (치트코드 등)
 * @param {string[]} sequence 키 시퀀스 배열
 * @param {Function} handler 시퀀스 완료 시 핸들러
 * @param {Object} options 옵션
 */
export const useKeySequence = (sequence, handler, options = {}) => {
  const { timeout = 1000, enabled = true } = options
  const [currentSequence, setCurrentSequence] = useState([])
  const timeoutRef = useRef(null)
  const savedHandler = useRef(handler)

  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase()
      
      setCurrentSequence(prev => {
        const newSequence = [...prev, key]
        
        // 시퀀스가 맞는지 확인
        const isValidSequence = sequence.every((seqKey, index) => 
          newSequence[index] && seqKey.toLowerCase() === newSequence[index].toLowerCase()
        )

        if (isValidSequence && newSequence.length === sequence.length) {
          savedHandler.current(event)
          return []
        } else if (isValidSequence) {
          // 아직 진행 중
          return newSequence
        } else {
          // 시퀀스가 틀림, 리셋
          return key === sequence[0]?.toLowerCase() ? [key] : []
        }
      })

      // 타임아웃 리셋
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        setCurrentSequence([])
      }, timeout)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [sequence, timeout, enabled])

  return {
    currentSequence,
    progress: currentSequence.length / sequence.length
  }
}

/**
 * 방향키 네비게이션 훅
 * @param {Object} options 네비게이션 옵션
 */
export const useArrowKeyNavigation = (options = {}) => {
  const {
    onUp,
    onDown,
    onLeft,
    onRight,
    enabled = true,
    preventDefault = true,
    element = null
  } = options

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return

    switch (event.key) {
      case 'ArrowUp':
        if (preventDefault) event.preventDefault()
        onUp?.(event)
        break
      case 'ArrowDown':
        if (preventDefault) event.preventDefault()
        onDown?.(event)
        break
      case 'ArrowLeft':
        if (preventDefault) event.preventDefault()
        onLeft?.(event)
        break
      case 'ArrowRight':
        if (preventDefault) event.preventDefault()
        onRight?.(event)
        break
      default:
        break
    }
  }, [onUp, onDown, onLeft, onRight, enabled, preventDefault])

  useEffect(() => {
    const eventTarget = element?.current || element || window
    eventTarget.addEventListener('keydown', handleKeyDown)
    
    return () => {
      eventTarget.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, element])
}

/**
 * Local 특화 키보드 훅
 * Local어 키보드와 일반적인 Local 사용자 패턴 지원
 */
export const useVietnameseKeyboard = (options = {}) => {
  const [isVietnameseMode, setIsVietnameseMode] = useState(false)
  const [inputMethod, setInputMethod] = useState('telex') // telex, vni, viqr

  // Local어 입력기 감지
  useEffect(() => {
    const detectInputMethod = (event) => {
      // Telex 방식 감지 (aa -> â, oo -> ô 등)
      if (event.key.length === 1 && /[aeiou]/.test(event.key)) {
        // Local어 입력 방식 추정 로직
        setIsVietnameseMode(true)
        setInputMethod('telex')
      }
    }

    window.addEventListener('keydown', detectInputMethod)
    return () => window.removeEventListener('keydown', detectInputMethod)
  }, [])

  // Local어 키보드 단축키들
  const shortcuts = {
    // 자주 사용하는 Local 앱 기능들
    newOrder: { ctrl: true, key: 'n' },        // Đơn hàng mới
    search: { ctrl: true, key: 'f' },          // Tìm kiếm
    settings: { ctrl: true, key: ',' },        // Cài đặt
    refresh: { key: 'F5' },                    // Làm mới
    help: { key: 'F1' },                       // Trợ giúp
    print: { ctrl: true, key: 'p' }            // In
  }

  return {
    isVietnameseMode,
    inputMethod,
    shortcuts,
    // Local어 접근성 라벨들
    labels: {
      newOrder: 'Tạo đơn hàng mới (Ctrl+N)',
      search: 'Tìm kiếm (Ctrl+F)', 
      settings: 'Cài đặt (Ctrl+,)',
      refresh: 'Làm mới (F5)',
      help: 'Trợ giúp (F1)',
      print: 'In (Ctrl+P)'
    }
  }
}

/**
 * 게임 컨트롤러 스타일 키 감지 훅
 * WASD, 스페이스바 등 게이미피케이션에 활용
 */
export const useGameKeys = (handlers = {}, options = {}) => {
  const { enabled = true } = options
  const [pressedKeys, setPressedKeys] = useState(new Set())

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return

    const key = event.key.toLowerCase()
    setPressedKeys(prev => new Set([...prev, key]))

    // 개별 키 핸들러 실행
    switch (key) {
      case 'w':
      case 'arrowup':
        handlers.up?.(event)
        break
      case 's':
      case 'arrowdown':
        handlers.down?.(event)
        break
      case 'a':
      case 'arrowleft':
        handlers.left?.(event)
        break
      case 'd':
      case 'arrowright':
        handlers.right?.(event)
        break
      case ' ':
        event.preventDefault()
        handlers.action?.(event)
        break
      case 'enter':
        handlers.confirm?.(event)
        break
      case 'escape':
        handlers.cancel?.(event)
        break
    }
  }, [handlers, enabled])

  const handleKeyUp = useCallback((event) => {
    const key = event.key.toLowerCase()
    setPressedKeys(prev => {
      const newSet = new Set(prev)
      newSet.delete(key)
      return newSet
    })
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  return {
    pressedKeys: Array.from(pressedKeys),
    isPressed: (key) => pressedKeys.has(key.toLowerCase())
  }
}

export default useKeyPress