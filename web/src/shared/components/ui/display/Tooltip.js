'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Tooltip 컴포넌트 - WCAG 2.1 준수
 * 호버 시 표시되는 툴팁 (ARIA describedby 지원)
 */
const Tooltip = ({
  children,
  content,
  position = 'top',
  trigger = 'hover',
  delay = 200,
  variant = 'default',
  size = 'md',
  arrow = true,
  disabled = false,
  maxWidth = 250,
  className = '',
  zIndex = 50,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);

  // 베리언트별 스타일
  const variantStyles = {
    default: 'bg-gray-900 text-white',
    primary: 'bg-[#2ac1bc] text-white',
    success: 'bg-[#00b14f] text-white',
    warning: 'bg-[#FFDD00] text-gray-800',
    error: 'bg-[#DA020E] text-white',
    light: 'bg-white text-gray-900 shadow-lg border border-gray-200',
  };

  // 사이즈별 스타일
  const sizeStyles = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-2.5 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
    xl: 'px-5 py-3 text-lg',
  };

  // 화살표 스타일
  const arrowStyles = {
    default: 'border-gray-900',
    primary: 'border-[#2ac1bc]',
    success: 'border-[#00b14f]',
    warning: 'border-[#FFDD00]',
    error: 'border-[#DA020E]',
    light: 'border-white',
  };

  // 위치 계산
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const spacing = 8;
    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - spacing;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + spacing;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - spacing;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + spacing;
        break;
      case 'top-start':
        top = triggerRect.top - tooltipRect.height - spacing;
        left = triggerRect.left;
        break;
      case 'top-end':
        top = triggerRect.top - tooltipRect.height - spacing;
        left = triggerRect.right - tooltipRect.width;
        break;
      case 'bottom-start':
        top = triggerRect.bottom + spacing;
        left = triggerRect.left;
        break;
      case 'bottom-end':
        top = triggerRect.bottom + spacing;
        left = triggerRect.right - tooltipRect.width;
        break;
      default:
        break;
    }

    // 뷰포트 경계 체크
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    if (left < 0) left = spacing;
    if (left + tooltipRect.width > viewport.width) {
      left = viewport.width - tooltipRect.width - spacing;
    }
    if (top < 0) top = spacing;
    if (top + tooltipRect.height > viewport.height) {
      top = viewport.height - tooltipRect.height - spacing;
    }

    setTooltipPosition({ top, left });
  }, [position]);

  // 툴팁 표시
  const showTooltip = useCallback(() => {
    if (disabled) return;
    
    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      setIsVisible(true);
    }
  }, [disabled, delay]);

  // 툴팁 숨김
  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  // 이벤트 핸들러
  const handleMouseEnter = useCallback(() => {
    if (trigger === 'hover') showTooltip();
  }, [trigger, showTooltip]);

  const handleMouseLeave = useCallback(() => {
    if (trigger === 'hover') hideTooltip();
  }, [trigger, hideTooltip]);

  const handleClick = useCallback(() => {
    if (trigger === 'click') {
      if (isVisible) {
        hideTooltip();
      } else {
        showTooltip();
      }
    }
  }, [trigger, isVisible, showTooltip, hideTooltip]);

  const handleFocus = useCallback(() => {
    if (trigger === 'hover' || trigger === 'focus') showTooltip();
  }, [trigger, showTooltip]);

  const handleBlur = useCallback(() => {
    if (trigger === 'hover' || trigger === 'focus') hideTooltip();
  }, [trigger, hideTooltip]);

  // 위치 업데이트
  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible, calculatePosition]);

  // 리사이즈 핸들러
  useEffect(() => {
    if (isVisible) {
      const handleResize = () => calculatePosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize);
      };
    }
  }, [isVisible, calculatePosition]);

  // 클린업
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 화살표 위치 계산
  const getArrowPosition = () => {
    switch (position) {
      case 'top':
      case 'top-start':
      case 'top-end':
        return 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-[5px] border-x-[5px] border-x-transparent';
      case 'bottom':
      case 'bottom-start':
      case 'bottom-end':
        return 'top-[-4px] left-1/2 -translate-x-1/2 border-b-[5px] border-x-[5px] border-x-transparent';
      case 'left':
        return 'right-[-4px] top-1/2 -translate-y-1/2 border-l-[5px] border-y-[5px] border-y-transparent';
      case 'right':
        return 'left-[-4px] top-1/2 -translate-y-1/2 border-r-[5px] border-y-[5px] border-y-transparent';
      default:
        return '';
    }
  };

  if (!content || disabled) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-describedby={isVisible ? tooltipId.current : undefined}
        className="inline-block"
        {...props}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId.current}
          role="tooltip"
          className={`
            fixed rounded-lg
            ${variantStyles[variant]}
            ${sizeStyles[size]}
            ${className}
            transition-opacity duration-200
            ${isVisible ? 'opacity-100' : 'opacity-0'}
            pointer-events-none
          `}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            maxWidth: maxWidth,
            zIndex: zIndex,
          }}
        >
          {content}
          
          {arrow && (
            <span 
              className={`
                absolute w-0 h-0
                ${getArrowPosition()}
                ${arrowStyles[variant]}
              `}
              aria-hidden="true"
            />
          )}
        </div>
      )}
    </>
  );
};

export default Tooltip;