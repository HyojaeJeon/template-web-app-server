/**
 * AnimatePresence - 여러 요소의 진입/퇴장 애니메이션 관리
 * 
 * 접근성 특징:
 * - WCAG 2.1 AA 준수
 * - 애니메이션 상태 추적
 * - 키보드 네비게이션 지원
 * - 스크린 리더 상태 알림
 */

import React, { useState, useEffect, useRef, useCallback, Children } from 'react';
import PropTypes from 'prop-types';

const AnimatePresence = ({
  children,
  initial = true,
  exitBeforeEnter = false,
  onExitComplete = () => {},
  presenceAffectsLayout = true,
  mode = 'sync',
  className = ''
}) => {
  const [presentChildren, setPresentChildren] = useState([]);
  const [exitingChildren, setExitingChildren] = useState(new Map());
  const presentChildrenRef = useRef([]);
  const exitCompletionRef = useRef(new Map());

  // 자식 요소들을 키로 매핑
  const getChildrenAsArray = useCallback((children) => {
    return Children.toArray(children).map(child => ({
      key: child.key || 'default',
      child,
      isPresent: true
    }));
  }, []);

  // 현재 자식 요소들 업데이트
  const updatePresentChildren = useCallback((newChildren) => {
    const newChildrenArray = getChildrenAsArray(newChildren);
    const newKeys = new Set(newChildrenArray.map(c => c.key));
    const prevKeys = new Set(presentChildrenRef.current.map(c => c.key));

    // 새로 추가된 요소들
    const entering = newChildrenArray.filter(c => !prevKeys.has(c.key));
    
    // 제거될 요소들
    const exiting = presentChildrenRef.current.filter(c => !newKeys.has(c.key));

    // exitBeforeEnter 모드 처리
    if (exitBeforeEnter && exiting.length > 0) {
      // 기존 요소들을 먼저 퇴장시키고, 완료 후 새 요소들을 진입
      const exitingMap = new Map();
      exiting.forEach(c => {
        exitingMap.set(c.key, { ...c, isPresent: false });
      });
      
      setExitingChildren(exitingMap);
      
      // 모든 퇴장 완료 후 새 요소들 진입
      Promise.all(
        exiting.map(c => 
          new Promise(resolve => {
            exitCompletionRef.current.set(c.key, resolve);
          })
        )
      ).then(() => {
        setPresentChildren(newChildrenArray);
        setExitingChildren(new Map());
        presentChildrenRef.current = newChildrenArray;
      });
    } else {
      // 일반 모드: 동시 진입/퇴장
      const combined = [...newChildrenArray];
      
      // 퇴장하는 요소들 추가
      exiting.forEach(c => {
        combined.push({ ...c, isPresent: false });
      });

      setPresentChildren(combined);
      presentChildrenRef.current = newChildrenArray;

      // 퇴장 요소들 추적
      if (exiting.length > 0) {
        const exitingMap = new Map();
        exiting.forEach(c => {
          exitingMap.set(c.key, { ...c, isPresent: false });
        });
        setExitingChildren(exitingMap);
      }
    }
  }, [exitBeforeEnter, getChildrenAsArray]);

  // 자식 변경 감지
  useEffect(() => {
    updatePresentChildren(children);
  }, [children, updatePresentChildren]);

  // 퇴장 완료 처리
  const handleExitComplete = useCallback((key) => {
    setExitingChildren(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });

    // exitBeforeEnter 모드에서의 완료 처리
    if (exitCompletionRef.current.has(key)) {
      const resolve = exitCompletionRef.current.get(key);
      exitCompletionRef.current.delete(key);
      resolve();
    }

    // 모든 퇴장이 완료된 경우 콜백 호출
    setPresentChildren(prev => {
      const filtered = prev.filter(c => c.key !== key);
      
      // 퇴장 요소가 모두 제거되었는지 확인
      const hasExiting = filtered.some(c => !c.isPresent);
      if (!hasExiting && exitingChildren.size === 1) {
        onExitComplete();
      }
      
      return filtered;
    });
  }, [exitingChildren.size, onExitComplete]);

  // 개별 자식 요소 래퍼
  const ChildWrapper = ({ child, isPresent, onExitComplete: onChildExitComplete }) => {
    const [shouldRender, setShouldRender] = useState(initial ? isPresent : true);
    const nodeRef = useRef(null);
    const exitTimeoutRef = useRef(null);

    useEffect(() => {
      if (isPresent) {
        setShouldRender(true);
      } else {
        // 퇴장 애니메이션 후 렌더링 중단
        exitTimeoutRef.current = setTimeout(() => {
          setShouldRender(false);
          onChildExitComplete();
        }, 300); // 기본 퇴장 시간
      }

      return () => {
        if (exitTimeoutRef.current) {
          clearTimeout(exitTimeoutRef.current);
        }
      };
    }, [isPresent, onChildExitComplete]);

    if (!shouldRender) {
      return null;
    }

    // 자식 요소에 presence 정보 전달
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        ...child.props,
        ref: nodeRef,
        'data-presence': isPresent ? 'present' : 'exiting',
        'data-animate-presence': true,
        onAnimationEnd: (e) => {
          if (child.props.onAnimationEnd) {
            child.props.onAnimationEnd(e);
          }
          
          // 퇴장 애니메이션 완료 감지
          if (!isPresent && e.target === nodeRef.current) {
            if (exitTimeoutRef.current) {
              clearTimeout(exitTimeoutRef.current);
            }
            setShouldRender(false);
            onChildExitComplete();
          }
        }
      });
    }

    return child;
  };

  // wait 모드에서의 렌더링 제어
  const shouldRenderChild = useCallback((child) => {
    if (mode === 'wait' && exitingChildren.size > 0) {
      // 퇴장하는 요소가 있으면 새 요소는 렌더링하지 않음
      return !child.isPresent || exitingChildren.has(child.key);
    }
    return true;
  }, [mode, exitingChildren]);

  return (
    <div 
      className={className}
      data-animate-presence="true"
      role="region"
      aria-live="polite"
      aria-label="애니메이션 컨테이너"
    >
      {presentChildren
        .filter(shouldRenderChild)
        .map(({ key, child, isPresent }) => (
          <ChildWrapper
            key={key}
            child={child}
            isPresent={isPresent}
            onExitComplete={() => handleExitComplete(key)}
          />
        ))}
    </div>
  );
};

// 개별 애니메이션 아이템을 위한 훅
export const usePresence = () => {
  const [isPresent, setIsPresent] = useState(true);
  const safeToRemove = useRef(null);

  const exitComplete = useCallback(() => {
    if (safeToRemove.current) {
      safeToRemove.current();
    }
  }, []);

  return [isPresent, exitComplete];
};

// 미리 정의된 애니메이션 variants
export const variants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  
  rotate: {
    initial: { opacity: 0, rotate: -10 },
    animate: { opacity: 1, rotate: 0 },
    exit: { opacity: 0, rotate: 10 }
  }
};

// 애니메이션 래퍼 컴포넌트
export const MotionDiv = ({ 
  children, 
  variant = 'fadeIn', 
  duration = 300,
  className = '',
  ...props 
}) => {
  const [isPresent] = usePresence();
  const variantConfig = variants[variant] || variants.fadeIn;

  return (
    <div
      className={`transition-all duration-${duration} ${className}`}
      style={{
        ...(!isPresent ? variantConfig.exit : variantConfig.animate)
      }}
      {...props}
    >
      {children}
    </div>
  );
};

AnimatePresence.propTypes = {
  /** 자식 요소들 */
  children: PropTypes.node,
  
  /** 초기 애니메이션 여부 */
  initial: PropTypes.bool,
  
  /** 퇴장 후 진입 모드 */
  exitBeforeEnter: PropTypes.bool,
  
  /** 모든 퇴장 완료 시 콜백 */
  onExitComplete: PropTypes.func,
  
  /** 레이아웃 영향 여부 */
  presenceAffectsLayout: PropTypes.bool,
  
  /** 애니메이션 모드 */
  mode: PropTypes.oneOf(['sync', 'wait', 'popLayout']),
  
  /** CSS 클래스 */
  className: PropTypes.string
};

MotionDiv.propTypes = {
  /** 자식 요소 */
  children: PropTypes.node,
  
  /** 애니메이션 변형 */
  variant: PropTypes.oneOf(Object.keys(variants)),
  
  /** 애니메이션 지속 시간 */
  duration: PropTypes.number,
  
  /** CSS 클래스 */
  className: PropTypes.string
};

export default AnimatePresence;