/**
 * @fileoverview 접근성 지원을 위한 커스텀 훅 모음
 * WCAG 2.1 AA 준수를 위한 React 훅들
 * 
 * @module AccessibilityHooks
 * @since 2024
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { announceToScreenReader, generateAriaId, getFocusableElements, trapFocus } from '../utils/accessibility';

/**
 * 키보드 네비게이션 지원 훅
 * @param {Object} options - 옵션 객체
 * @param {string[]} options.keys - 감지할 키 배열 (기본값: ['ArrowUp', 'ArrowDown', 'Enter', 'Space'])
 * @param {Function} options.onKeyDown - 키 입력 콜백
 * @param {boolean} options.preventDefault - preventDefault 호출 여부 (기본값: true)
 * @returns {Object} 키보드 네비게이션 관련 상태와 함수들
 */
export const useKeyboardNavigation = ({
  keys = ['ArrowUp', 'ArrowDown', 'Enter', 'Space'],
  onKeyDown = null,
  preventDefault = true
} = {}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  
  const handleKeyDown = useCallback((event) => {
    if (!keys.includes(event.key)) return;
    
    if (preventDefault) event.preventDefault();
    
    setIsKeyboardMode(true);
    
    if (onKeyDown) {
      onKeyDown(event, activeIndex, setActiveIndex);
    } else {
      // 기본 화살표 키 동작
      if (event.key === 'ArrowUp') {
        setActiveIndex(prev => Math.max(0, prev - 1));
      } else if (event.key === 'ArrowDown') {
        setActiveIndex(prev => prev + 1);
      }
    }
  }, [keys, onKeyDown, activeIndex, preventDefault]);
  
  const handleMouseMove = useCallback(() => {
    setIsKeyboardMode(false);
  }, []);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleKeyDown, handleMouseMove]);
  
  return {
    activeIndex,
    setActiveIndex,
    isKeyboardMode,
    setIsKeyboardMode
  };
};

/**
 * 스크린 리더 지원 훅
 * @returns {Object} 스크린 리더 관련 함수들
 */
export const useScreenReader = () => {
  const announce = useCallback((message, priority = 'polite', delay = 100) => {
    announceToScreenReader(message, priority, delay);
  }, []);
  
  const announceNavigation = useCallback((current, total, itemName = '항목') => {
    const message = `${current + 1}/${total} ${itemName}`;
    announce(message, 'polite', 200);
  }, [announce]);
  
  const announceStatus = useCallback((status, isError = false) => {
    announce(status, isError ? 'assertive' : 'polite');
  }, [announce]);
  
  const announceFormError = useCallback((field, error) => {
    announce(`${field}: ${error}`, 'assertive');
  }, [announce]);
  
  return {
    announce,
    announceNavigation,
    announceStatus,
    announceFormError
  };
};

/**
 * 포커스 관리 훅
 * @param {Object} options - 옵션 객체
 * @param {boolean} options.autoFocus - 마운트 시 자동 포커스 (기본값: false)
 * @param {boolean} options.restoreFocus - 언마운트 시 포커스 복원 (기본값: true)
 * @param {boolean} options.trapFocus - 포커스 트랩 활성화 (기본값: false)
 * @returns {Object} 포커스 관리 관련 함수들과 ref
 */
export const useFocusManagement = ({
  autoFocus = false,
  restoreFocus = true,
  trapFocus: enableTrap = false
} = {}) => {
  const elementRef = useRef(null);
  const previousFocusRef = useRef(null);
  const trapCleanupRef = useRef(null);
  
  // 포커스 설정
  const setFocus = useCallback(() => {
    if (elementRef.current) {
      elementRef.current.focus();
    }
  }, []);
  
  // 포커스 트랩 활성화/비활성화
  const enableFocusTrap = useCallback((onEscape = null) => {
    if (elementRef.current) {
      trapCleanupRef.current = trapFocus(elementRef.current, onEscape);
    }
  }, []);
  
  const disableFocusTrap = useCallback(() => {
    if (trapCleanupRef.current) {
      trapCleanupRef.current();
      trapCleanupRef.current = null;
    }
  }, []);
  
  // 첫 번째 포커스 가능한 요소로 포커스 이동
  const focusFirstElement = useCallback(() => {
    if (elementRef.current) {
      const focusableElements = getFocusableElements(elementRef.current);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, []);
  
  useEffect(() => {
    // 현재 포커스된 요소 저장
    previousFocusRef.current = document.activeElement;
    
    // 자동 포커스
    if (autoFocus) {
      const timer = setTimeout(() => {
        setFocus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, setFocus]);
  
  useEffect(() => {
    // 포커스 트랩 설정
    if (enableTrap && elementRef.current) {
      enableFocusTrap();
    }
    
    return () => {
      // 포커스 복원
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
      
      // 포커스 트랩 정리
      disableFocusTrap();
    };
  }, [enableTrap, restoreFocus, enableFocusTrap, disableFocusTrap]);
  
  return {
    elementRef,
    setFocus,
    focusFirstElement,
    enableFocusTrap,
    disableFocusTrap
  };
};

/**
 * ARIA 속성 관리 훅
 * @param {string} prefix - ID 접두사 (기본값: 'component')
 * @returns {Object} ARIA 속성 관련 ID들과 함수들
 */
export const useAriaAttributes = (prefix = 'component') => {
  const [ids] = useState(() => ({
    main: generateAriaId(prefix),
    label: generateAriaId(`${prefix}-label`),
    description: generateAriaId(`${prefix}-description`),
    error: generateAriaId(`${prefix}-error`),
    help: generateAriaId(`${prefix}-help`)
  }));
  
  const getAriaProps = useCallback((options = {}) => {
    const {
      label,
      description,
      error,
      help,
      required = false,
      invalid = false,
      expanded,
      selected,
      checked,
      pressed,
      current
    } = options;
    
    const props = {
      id: ids.main
    };
    
    // 라벨 연결
    if (label) {
      props['aria-labelledby'] = ids.label;
    }
    
    // 설명 연결
    const describedBy = [];
    if (description) describedBy.push(ids.description);
    if (error) describedBy.push(ids.error);
    if (help) describedBy.push(ids.help);
    
    if (describedBy.length > 0) {
      props['aria-describedby'] = describedBy.join(' ');
    }
    
    // 상태 속성들
    if (required) props['aria-required'] = 'true';
    if (invalid) props['aria-invalid'] = 'true';
    if (expanded !== undefined) props['aria-expanded'] = expanded.toString();
    if (selected !== undefined) props['aria-selected'] = selected.toString();
    if (checked !== undefined) props['aria-checked'] = checked.toString();
    if (pressed !== undefined) props['aria-pressed'] = pressed.toString();
    if (current !== undefined) props['aria-current'] = current;
    
    return props;
  }, [ids]);
  
  const getLabelProps = useCallback(() => ({
    id: ids.label
  }), [ids.label]);
  
  const getDescriptionProps = useCallback(() => ({
    id: ids.description
  }), [ids.description]);
  
  const getErrorProps = useCallback(() => ({
    id: ids.error,
    role: 'alert',
    'aria-live': 'polite'
  }), [ids.error]);
  
  const getHelpProps = useCallback(() => ({
    id: ids.help
  }), [ids.help]);
  
  return {
    ids,
    getAriaProps,
    getLabelProps,
    getDescriptionProps,
    getErrorProps,
    getHelpProps
  };
};

/**
 * 라이브 영역 관리 훅 (실시간 업데이트 알림)
 * @param {'polite'|'assertive'} politeness - 알림 우선순위 (기본값: 'polite')
 * @returns {Object} 라이브 영역 관련 함수들과 ref
 */
export const useLiveRegion = (politeness = 'polite') => {
  const liveRegionRef = useRef(null);
  const [message, setMessage] = useState('');
  
  const announce = useCallback((newMessage, priority = politeness) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      setMessage(newMessage);
      
      // 메시지를 지우기 위해 짧은 지연 후 빈 문자열 설정
      setTimeout(() => {
        setMessage('');
      }, 1000);
    }
  }, [politeness]);
  
  return {
    liveRegionRef,
    message,
    announce,
    liveRegionProps: {
      ref: liveRegionRef,
      'aria-live': politeness,
      'aria-atomic': 'true',
      className: 'sr-only' // 스크린 리더 전용 클래스
    }
  };
};

/**
 * 색상 대비 검사 훅
 * @param {string} foreground - 전경색
 * @param {string} background - 배경색
 * @returns {Object} 색상 대비 검사 결과
 */
export const useColorContrast = (foreground, background) => {
  const [contrastResult, setContrastResult] = useState(null);
  
  useEffect(() => {
    const checkContrast = async () => {
      try {
        const { checkColorContrast } = await import('..//utils/accessibility');
        const result = checkColorContrast(foreground, background);
        setContrastResult(result);
      } catch (error) {
        console.error('색상 대비 검사 중 오류:', error);
        setContrastResult(null);
      }
    };
    
    if (foreground && background) {
      checkContrast();
    }
  }, [foreground, background]);
  
  return contrastResult;
};

/**
 * 모달/다이얼로그 접근성 훅
 * @param {Object} options - 옵션 객체
 * @param {boolean} options.isOpen - 모달 열림 상태
 * @param {Function} options.onClose - 모달 닫기 콜백
 * @param {string} options.closeOnEscape - ESC 키로 닫기 (기본값: true)
 * @returns {Object} 모달 접근성 관련 속성들과 함수들
 */
export const useModalAccessibility = ({
  isOpen = false,
  onClose = null,
  closeOnEscape = true
} = {}) => {
  const modalRef = useRef(null);
  const { elementRef, enableFocusTrap, disableFocusTrap } = useFocusManagement({
    autoFocus: false,
    restoreFocus: true,
    trapFocus: isOpen
  });
  const { announce } = useScreenReader();
  
  // ESC 키 처리
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && closeOnEscape && isOpen && onClose) {
        event.preventDefault();
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose, closeOnEscape]);
  
  // 모달 상태 변경 시 스크린 리더 알림
  useEffect(() => {
    if (isOpen) {
      announce('대화상자가 열렸습니다.', 'polite', 300);
    }
  }, [isOpen, announce]);
  
  // 포커스 트랩 관리
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // 첫 번째 포커스 가능한 요소에 포커스
      const focusableElements = getFocusableElements(modalRef.current);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [isOpen]);
  
  const getModalProps = useCallback(() => ({
    ref: (node) => {
      modalRef.current = node;
      elementRef.current = node;
    },
    role: 'dialog',
    'aria-modal': 'true',
    tabIndex: -1
  }), [elementRef]);
  
  return {
    modalRef,
    getModalProps
  };
};

/**
 * 통합 접근성 훅 - 모든 접근성 기능을 한번에 제공
 */
export const useAccessibility = () => {
  const keyboardNav = useKeyboardNavigation();
  const screenReader = useScreenReader();
  const focusManagement = useFocusManagement();
  const ariaAttributes = useAriaAttributes();
  const liveRegion = useLiveRegion();
  
  return {
    keyboardNav,
    screenReader,
    focusManagement,
    ariaAttributes,
    liveRegion
  };
};