/**
 * Transition - CSS 트랜지션 애니메이션 컴포넌트
 * 
 * 접근성 특징:
 * - WCAG 2.1 AA 준수
 * - prefers-reduced-motion 미디어 쿼리 지원
 * - 애니메이션 완료 시 포커스 관리
 * - 스크린 리더 상태 알림
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

// 애니메이션 상태
const TRANSITION_STATES = {
  ENTERING: 'entering',
  ENTERED: 'entered', 
  EXITING: 'exiting',
  EXITED: 'exited'
};

// prefers-reduced-motion 감지
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const Transition = ({
  children,
  show = false,
  enter = '',
  enterFrom = '',
  enterTo = '',
  leave = '',
  leaveFrom = '',
  leaveTo = '',
  duration = 300,
  delay = 0,
  easing = 'ease-in-out',
  appear = false,
  onEnter = () => {},
  onEntering = () => {},
  onEntered = () => {},
  onExit = () => {},
  onExiting = () => {},
  onExited = () => {},
  className = '',
  as = 'div',
  unmountOnExit = true,
  mountOnEnter = true,
  timeout,
  disabled = false
}) => {
  const [state, setState] = useState(() => {
    if (show) {
      return appear ? TRANSITION_STATES.EXITED : TRANSITION_STATES.ENTERED;
    }
    return TRANSITION_STATES.EXITED;
  });
  
  const [mounted, setMounted] = useState(!mountOnEnter || show);
  const nodeRef = useRef(null);
  const timeoutRef = useRef(null);
  const delayTimeoutRef = useRef(null);

  // 실제 지속 시간 계산 (reduced motion 고려)
  const getActualDuration = useCallback(() => {
    if (disabled || prefersReducedMotion()) return 0;
    return timeout || duration;
  }, [disabled, timeout, duration]);

  // CSS 클래스 적용
  const applyClasses = useCallback((classNames) => {
    if (!nodeRef.current) return;
    
    const element = nodeRef.current;
    classNames.forEach(className => {
      if (className) {
        element.classList.add(className);
      }
    });
  }, []);

  // CSS 클래스 제거
  const removeClasses = useCallback((classNames) => {
    if (!nodeRef.current) return;
    
    const element = nodeRef.current;
    classNames.forEach(className => {
      if (className) {
        element.classList.remove(className);
      }
    });
  }, []);

  // 트랜지션 시작
  const performEnter = useCallback(() => {
    if (!nodeRef.current || state === TRANSITION_STATES.ENTERED) return;

    const element = nodeRef.current;
    const actualDuration = getActualDuration();

    // 진입 시작
    setState(TRANSITION_STATES.ENTERING);
    onEnter(element);
    onEntering(element);

    // 초기 상태 설정
    if (enterFrom) {
      applyClasses([enterFrom]);
    }

    // 트랜지션 스타일 적용
    if (enter && !prefersReducedMotion() && !disabled) {
      element.style.transition = `${enter} ${actualDuration}ms ${easing}`;
    }

    // 지연 후 최종 상태로 전환
    const startTransition = () => {
      if (enterFrom) {
        removeClasses([enterFrom]);
      }
      if (enterTo) {
        applyClasses([enterTo]);
      }

      // 애니메이션 완료 대기
      if (actualDuration > 0) {
        timeoutRef.current = setTimeout(() => {
          setState(TRANSITION_STATES.ENTERED);
          onEntered(element);
          
          // 트랜지션 스타일 제거
          element.style.transition = '';
          if (enterTo) {
            removeClasses([enterTo]);
          }
        }, actualDuration);
      } else {
        setState(TRANSITION_STATES.ENTERED);
        onEntered(element);
        if (enterTo) {
          removeClasses([enterTo]);
        }
      }
    };

    if (delay > 0) {
      delayTimeoutRef.current = setTimeout(startTransition, delay);
    } else {
      requestAnimationFrame(startTransition);
    }
  }, [state, getActualDuration, onEnter, onEntering, onEntered, enterFrom, enterTo, enter, easing, delay, disabled, applyClasses, removeClasses]);

  // 트랜지션 종료  
  const performExit = useCallback(() => {
    if (!nodeRef.current || state === TRANSITION_STATES.EXITED) return;

    const element = nodeRef.current;
    const actualDuration = getActualDuration();

    // 종료 시작
    setState(TRANSITION_STATES.EXITING);
    onExit(element);
    onExiting(element);

    // 초기 상태 설정
    if (leaveFrom) {
      applyClasses([leaveFrom]);
    }

    // 트랜지션 스타일 적용
    if (leave && !prefersReducedMotion() && !disabled) {
      element.style.transition = `${leave} ${actualDuration}ms ${easing}`;
    }

    const startTransition = () => {
      if (leaveFrom) {
        removeClasses([leaveFrom]);
      }
      if (leaveTo) {
        applyClasses([leaveTo]);
      }

      // 애니메이션 완료 대기
      if (actualDuration > 0) {
        timeoutRef.current = setTimeout(() => {
          setState(TRANSITION_STATES.EXITED);
          onExited(element);
          
          // 트랜지션 스타일 제거
          element.style.transition = '';
          if (leaveTo) {
            removeClasses([leaveTo]);
          }

          // 언마운트
          if (unmountOnExit) {
            setMounted(false);
          }
        }, actualDuration);
      } else {
        setState(TRANSITION_STATES.EXITED);
        onExited(element);
        if (leaveTo) {
          removeClasses([leaveTo]);
        }
        if (unmountOnExit) {
          setMounted(false);
        }
      }
    };

    if (delay > 0) {
      delayTimeoutRef.current = setTimeout(startTransition, delay);
    } else {
      requestAnimationFrame(startTransition);
    }
  }, [state, getActualDuration, onExit, onExiting, onExited, leaveFrom, leaveTo, leave, easing, delay, disabled, unmountOnExit, applyClasses, removeClasses]);

  // show prop 변경 감지
  useEffect(() => {
    if (show) {
      if (mountOnEnter && !mounted) {
        setMounted(true);
      }
      
      if (state === TRANSITION_STATES.EXITED) {
        // 다음 프레임에서 진입 시작
        requestAnimationFrame(() => {
          performEnter();
        });
      }
    } else {
      if (state === TRANSITION_STATES.ENTERED || state === TRANSITION_STATES.ENTERING) {
        performExit();
      }
    }
  }, [show, mounted, state, mountOnEnter, performEnter, performExit]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
  }, []);

  // 렌더링 조건 확인
  if (!mounted) {
    return null;
  }

  const Component = as;
  const transitionClass = [
    className,
    state === TRANSITION_STATES.ENTERING && 'transition-entering',
    state === TRANSITION_STATES.ENTERED && 'transition-entered',
    state === TRANSITION_STATES.EXITING && 'transition-exiting',
    state === TRANSITION_STATES.EXITED && 'transition-exited'
  ].filter(Boolean).join(' ');

  return (
    <Component
      ref={nodeRef}
      className={transitionClass}
      data-transition-state={state}
      role={state === TRANSITION_STATES.ENTERING || state === TRANSITION_STATES.EXITING ? 'status' : undefined}
      aria-live={state === TRANSITION_STATES.ENTERING || state === TRANSITION_STATES.EXITING ? 'polite' : undefined}
    >
      {typeof children === 'function' 
        ? children({ state, mounted })
        : children
      }
    </Component>
  );
};

Transition.propTypes = {
  /** 자식 요소 */
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  
  /** 표시 여부 */
  show: PropTypes.bool,
  
  /** 진입 트랜지션 CSS 속성 */
  enter: PropTypes.string,
  
  /** 진입 시작 클래스 */
  enterFrom: PropTypes.string,
  
  /** 진입 종료 클래스 */
  enterTo: PropTypes.string,
  
  /** 종료 트랜지션 CSS 속성 */
  leave: PropTypes.string,
  
  /** 종료 시작 클래스 */
  leaveFrom: PropTypes.string,
  
  /** 종료 종료 클래스 */
  leaveTo: PropTypes.string,
  
  /** 애니메이션 지속 시간 (ms) */
  duration: PropTypes.number,
  
  /** 애니메이션 지연 시간 (ms) */
  delay: PropTypes.number,
  
  /** 이징 함수 */
  easing: PropTypes.string,
  
  /** 초기 나타남 애니메이션 여부 */
  appear: PropTypes.bool,
  
  /** 진입 시작 콜백 */
  onEnter: PropTypes.func,
  
  /** 진입 중 콜백 */
  onEntering: PropTypes.func,
  
  /** 진입 완료 콜백 */
  onEntered: PropTypes.func,
  
  /** 종료 시작 콜백 */
  onExit: PropTypes.func,
  
  /** 종료 중 콜백 */
  onExiting: PropTypes.func,
  
  /** 종료 완료 콜백 */
  onExited: PropTypes.func,
  
  /** CSS 클래스 */
  className: PropTypes.string,
  
  /** 렌더링할 요소 타입 */
  as: PropTypes.elementType,
  
  /** 종료 시 언마운트 여부 */
  unmountOnExit: PropTypes.bool,
  
  /** 진입 시 마운트 여부 */
  mountOnEnter: PropTypes.bool,
  
  /** 타임아웃 오버라이드 */
  timeout: PropTypes.number,
  
  /** 애니메이션 비활성화 */
  disabled: PropTypes.bool
};

export default Transition;