'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';

/**
 * FocusLock Component
 * 
 * Local 배달 앱 포커스 잠금 컴포넌트
 * - 모달, 드롭다운 등에서 포커스 트랩 구현
 * - Tab 키 순환 네비게이션
 * - 키보드 접근성 준수
 * - 스크린 리더 호환성
 * - 자동 초점 복원
 * 
 * WCAG 2.1 준수, 키보드 네비게이션, 스크린 리더 지원
 * 
 * @param {Object} props - FocusLock 컴포넌트 props
 * @param {ReactNode} props.children - 자식 컴포넌트
 * @param {boolean} props.enabled - 포커스 잠금 활성화
 * @param {boolean} props.autoFocus - 자동 포커스 활성화
 * @param {boolean} props.restoreFocus - 종료 시 포커스 복원
 * @param {string} props.initialFocusSelector - 초기 포커스 선택자
 * @param {string} props.finalFocusSelector - 마지막 포커스 선택자
 * @param {Array} props.focusableSelectors - 포커스 가능한 요소 선택자
 * @param {Function} props.onEscape - ESC 키 콜백
 * @param {Function} props.onFocusLost - 포커스 손실 콜백
 * @param {string} props.className - 추가 CSS 클래스
 */
const FocusLock = forwardRef(({
  children,
  enabled = true,
  autoFocus = true,
  restoreFocus = true,
  initialFocusSelector,
  finalFocusSelector,
  focusableSelectors = [
    'button',
    '[href]',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ],
  onEscape,
  onFocusLost,
  className = '',
  ...props
}, ref) => {
  const containerRef = useRef(null);
  const previouslyFocusedElement = useRef(null);
  const firstFocusableElement = useRef(null);
  const lastFocusableElement = useRef(null);

  // 포커스 가능한 요소 찾기
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const selector = focusableSelectors.join(', ');
    const elements = containerRef.current.querySelectorAll(selector);
    
    return Array.from(elements).filter(element => {
      // 숨겨진 요소나 비활성화된 요소 제외
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
      }
      
      if (element.disabled || element.getAttribute('aria-hidden') === 'true') {
        return false;
      }
      
      return true;
    });
  }, [focusableSelectors]);

  // 포커스 가능한 요소 업데이트
  const updateFocusableElements = useCallback(() => {
    const focusableElements = getFocusableElements();
    
    if (focusableElements.length > 0) {
      // 초기 포커스 요소 찾기
      if (initialFocusSelector) {
        const initialElement = containerRef.current?.querySelector(initialFocusSelector);
        firstFocusableElement.current = initialElement || focusableElements[0];
      } else {
        firstFocusableElement.current = focusableElements[0];
      }
      
      // 마지막 포커스 요소 찾기
      if (finalFocusSelector) {
        const finalElement = containerRef.current?.querySelector(finalFocusSelector);
        lastFocusableElement.current = finalElement || focusableElements[focusableElements.length - 1];
      } else {
        lastFocusableElement.current = focusableElements[focusableElements.length - 1];
      }
    }
    
    return focusableElements;
  }, [initialFocusSelector, finalFocusSelector, getFocusableElements]);

  // ref 전달
  useImperativeHandle(ref, () => ({
    element: containerRef.current,
    focus: () => {
      if (firstFocusableElement.current) {
        firstFocusableElement.current.focus();
      }
    },
    focusFirst: () => {
      if (firstFocusableElement.current) {
        firstFocusableElement.current.focus();
      }
    },
    focusLast: () => {
      if (lastFocusableElement.current) {
        lastFocusableElement.current.focus();
      }
    },
    getFocusableElements,
    updateElements: updateFocusableElements
  }), [getFocusableElements, updateFocusableElements]);

  // 키보드 이벤트 처리
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      // ESC 키 처리
      if (event.key === 'Escape' || event.keyCode === 27) {
        if (onEscape) {
          onEscape(event);
          return;
        }
      }

      // Tab 키 처리
      if (event.key === 'Tab' || event.keyCode === 9) {
        const focusableElements = getFocusableElements();
        
        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const currentFocusIndex = focusableElements.indexOf(document.activeElement);
        
        if (event.shiftKey) {
          // Shift + Tab (역방향)
          if (currentFocusIndex <= 0) {
            event.preventDefault();
            focusableElements[focusableElements.length - 1].focus();
          }
        } else {
          // Tab (정방향)  
          if (currentFocusIndex >= focusableElements.length - 1) {
            event.preventDefault();
            focusableElements[0].focus();
          }
        }
      }
    };

    const handleFocusIn = (event) => {
      if (!containerRef.current) return;

      // 컨테이너 외부로 포커스가 이동한 경우
      if (!containerRef.current.contains(event.target)) {
        if (onFocusLost) {
          onFocusLost(event);
        } else {
          // 포커스를 다시 컨테이너 내부로 이동
          event.preventDefault();
          if (firstFocusableElement.current) {
            firstFocusableElement.current.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('focusin', handleFocusIn, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('focusin', handleFocusIn, true);
    };
  }, [enabled, getFocusableElements, onEscape, onFocusLost]);

  // 포커스 잠금 활성화/비활성화
  useEffect(() => {
    if (!enabled) return;

    // 현재 포커스된 요소 저장
    previouslyFocusedElement.current = document.activeElement;

    // 포커스 가능한 요소 업데이트
    const focusableElements = updateFocusableElements();

    // 자동 포커스
    if (autoFocus && focusableElements.length > 0) {
      // 약간의 지연을 두고 포커스 (DOM 렌더링 완료 후)
      setTimeout(() => {
        if (firstFocusableElement.current) {
          firstFocusableElement.current.focus();
        }
      }, 0);
    }

    // 컨테이너에 aria-modal 속성 추가
    if (containerRef.current) {
      containerRef.current.setAttribute('role', 'dialog');
      containerRef.current.setAttribute('aria-modal', 'true');
    }

    // cleanup
    return () => {
      // 포커스 복원
      if (restoreFocus && previouslyFocusedElement.current) {
        setTimeout(() => {
          if (previouslyFocusedElement.current && 
              typeof previouslyFocusedElement.current.focus === 'function') {
            try {
              previouslyFocusedElement.current.focus();
            } catch (error) {
              // 포커스 복원 실패 시 무시
              console.warn('Failed to restore focus:', error);
            }
          }
        }, 0);
      }

      // aria 속성 제거
      if (containerRef.current) {
        containerRef.current.removeAttribute('role');
        containerRef.current.removeAttribute('aria-modal');
      }
    };
  }, [enabled, autoFocus, restoreFocus, updateFocusableElements]);

  // DOM 변경 감지
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const observer = new MutationObserver(() => {
      updateFocusableElements();
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'tabindex', 'aria-hidden']
    });

    return () => {
      observer.disconnect();
    };
  }, [enabled, updateFocusableElements]);

  return (
    <div
      ref={containerRef}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
});

FocusLock.displayName = 'FocusLock';

/**
 * 포커스 트랩 Hook
 * 
 * @param {boolean} enabled - 포커스 트랩 활성화
 * @param {Object} options - 옵션 설정
 * @returns {RefObject} 컨테이너 ref
 */
export const useFocusLock = (enabled = true, options = {}) => {
  const {
    autoFocus = true,
    restoreFocus = true,
    focusableSelectors = [
      'button',
      '[href]',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ],
    onEscape,
    onFocusLost
  } = options;

  const containerRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const selector = focusableSelectors.join(', ');
    const elements = containerRef.current.querySelectorAll(selector);
    
    return Array.from(elements).filter(element => {
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
      }
      
      if (element.disabled || element.getAttribute('aria-hidden') === 'true') {
        return false;
      }
      
      return true;
    });
  }, [focusableSelectors]);

  useEffect(() => {
    if (!enabled) return;

    previouslyFocusedElement.current = document.activeElement;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && onEscape) {
        onEscape(event);
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();
        
        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const currentFocusIndex = focusableElements.indexOf(document.activeElement);
        
        if (event.shiftKey) {
          if (currentFocusIndex <= 0) {
            event.preventDefault();
            focusableElements[focusableElements.length - 1].focus();
          }
        } else {
          if (currentFocusIndex >= focusableElements.length - 1) {
            event.preventDefault();
            focusableElements[0].focus();
          }
        }
      }
    };

    const handleFocusIn = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        if (onFocusLost) {
          onFocusLost(event);
        } else {
          event.preventDefault();
          const focusableElements = getFocusableElements();
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('focusin', handleFocusIn, true);

    if (autoFocus) {
      setTimeout(() => {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }, 0);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('focusin', handleFocusIn, true);

      if (restoreFocus && previouslyFocusedElement.current) {
        setTimeout(() => {
          try {
            previouslyFocusedElement.current?.focus();
          } catch (error) {
            console.warn('Failed to restore focus:', error);
          }
        }, 0);
      }
    };
  }, [enabled, autoFocus, restoreFocus, getFocusableElements, onEscape, onFocusLost]);

  return containerRef;
};

export default FocusLock;