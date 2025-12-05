'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Popover 컴포넌트 - WCAG 2.1 준수
 * 클릭 시 표시되는 팝오버 컴포넌트
 */
const Popover = ({
  children,
  content,
  title,
  position = 'bottom',
  trigger = 'click',
  variant = 'default',
  size = 'md',
  arrow = true,
  disabled = false,
  closeOnClickOutside = true,
  closeOnEsc = true,
  maxWidth = 320,
  className = '',
  onOpen,
  onClose,
  zIndex = 50,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const popoverId = useRef(`popover-${Math.random().toString(36).substr(2, 9)}`);

  // 베리언트별 스타일
  const variantStyles = {
    default: 'bg-white text-gray-900 shadow-lg border border-gray-200',
    dark: 'bg-gray-900 text-white shadow-xl',
    primary: 'bg-[#2ac1bc] text-white shadow-lg',
    success: 'bg-[#00b14f] text-white shadow-lg',
    warning: 'bg-[#FFDD00] text-gray-800 shadow-lg',
    error: 'bg-[#DA020E] text-white shadow-lg',
  };

  // 사이즈별 스타일
  const sizeStyles = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-sm',
    lg: 'p-5 text-base',
    xl: 'p-6 text-lg',
  };

  // 화살표 스타일
  const arrowStyles = {
    default: 'border-white',
    dark: 'border-gray-900',
    primary: 'border-[#2ac1bc]',
    success: 'border-[#00b14f]',
    warning: 'border-[#FFDD00]',
    error: 'border-[#DA020E]',
  };

  // 위치 계산
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const spacing = 10;
    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - popoverRect.height - spacing;
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + spacing;
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
        left = triggerRect.left - popoverRect.width - spacing;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
        left = triggerRect.right + spacing;
        break;
      case 'top-start':
        top = triggerRect.top - popoverRect.height - spacing;
        left = triggerRect.left;
        break;
      case 'top-end':
        top = triggerRect.top - popoverRect.height - spacing;
        left = triggerRect.right - popoverRect.width;
        break;
      case 'bottom-start':
        top = triggerRect.bottom + spacing;
        left = triggerRect.left;
        break;
      case 'bottom-end':
        top = triggerRect.bottom + spacing;
        left = triggerRect.right - popoverRect.width;
        break;
      default:
        break;
    }

    // 뷰포트 경계 체크
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    if (left < spacing) left = spacing;
    if (left + popoverRect.width > viewport.width) {
      left = viewport.width - popoverRect.width - spacing;
    }
    if (top < spacing) top = spacing;
    if (top + popoverRect.height > viewport.height) {
      top = viewport.height - popoverRect.height - spacing;
    }

    setPopoverPosition({ top, left });
  }, [position]);

  // 팝오버 열기
  const openPopover = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    if (onOpen) onOpen();
  }, [disabled, onOpen]);

  // 팝오버 닫기
  const closePopover = useCallback(() => {
    setIsOpen(false);
    if (onClose) onClose();
  }, [onClose]);

  // 트리거 클릭 핸들러
  const handleTriggerClick = useCallback(() => {
    if (trigger === 'click') {
      if (isOpen) {
        closePopover();
      } else {
        openPopover();
      }
    }
  }, [trigger, isOpen, openPopover, closePopover]);

  // 트리거 호버 핸들러
  const handleTriggerHover = useCallback(() => {
    if (trigger === 'hover') {
      openPopover();
    }
  }, [trigger, openPopover]);

  const handleTriggerLeave = useCallback(() => {
    if (trigger === 'hover') {
      closePopover();
    }
  }, [trigger, closePopover]);

  // 외부 클릭 핸들러
  useEffect(() => {
    if (isOpen && closeOnClickOutside) {
      const handleClickOutside = (event) => {
        if (
          popoverRef.current &&
          !popoverRef.current.contains(event.target) &&
          triggerRef.current &&
          !triggerRef.current.contains(event.target)
        ) {
          closePopover();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, closeOnClickOutside, closePopover]);

  // ESC 키 핸들러
  useEffect(() => {
    if (isOpen && closeOnEsc) {
      const handleEscape = (event) => {
        if (event.key === 'Escape') {
          closePopover();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, closeOnEsc, closePopover]);

  // 위치 업데이트
  useEffect(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen, calculatePosition]);

  // 리사이즈 핸들러
  useEffect(() => {
    if (isOpen) {
      const handleResize = () => calculatePosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize);
      };
    }
  }, [isOpen, calculatePosition]);

  // 화살표 위치 계산
  const getArrowPosition = () => {
    switch (position) {
      case 'top':
      case 'top-start':
      case 'top-end':
        return 'bottom-[-6px] left-1/2 -translate-x-1/2 border-t-[7px] border-x-[7px] border-x-transparent';
      case 'bottom':
      case 'bottom-start':
      case 'bottom-end':
        return 'top-[-6px] left-1/2 -translate-x-1/2 border-b-[7px] border-x-[7px] border-x-transparent';
      case 'left':
        return 'right-[-6px] top-1/2 -translate-y-1/2 border-l-[7px] border-y-[7px] border-y-transparent';
      case 'right':
        return 'left-[-6px] top-1/2 -translate-y-1/2 border-r-[7px] border-y-[7px] border-y-transparent';
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
        onClick={handleTriggerClick}
        onMouseEnter={handleTriggerHover}
        onMouseLeave={handleTriggerLeave}
        aria-expanded={isOpen}
        aria-controls={popoverId.current}
        aria-haspopup="true"
        className="inline-block"
        {...props}
      >
        {children}
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          id={popoverId.current}
          role="dialog"
          aria-labelledby={title ? `${popoverId.current}-title` : undefined}
          className={`
            fixed rounded-lg
            ${variantStyles[variant]}
            ${sizeStyles[size]}
            ${className}
            transition-all duration-200 transform
            ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          `}
          style={{
            top: popoverPosition.top,
            left: popoverPosition.left,
            maxWidth: maxWidth,
            zIndex: zIndex,
          }}
        >
          {/* 헤더 */}
          {title && (
            <div 
              id={`${popoverId.current}-title`}
              className={`
                font-semibold mb-3 pb-3 border-b
                ${variant === 'default' ? 'border-gray-200' : 'border-white/20'}
              `}
            >
              {title}
            </div>
          )}

          {/* 컨텐츠 */}
          <div>{content}</div>

          {/* 화살표 */}
          {arrow && (
            <span 
              className={`
                absolute w-0 h-0
                ${getArrowPosition()}
                ${arrowStyles[variant]}
                ${variant === 'default' ? 'drop-shadow-md' : ''}
              `}
              aria-hidden="true"
            />
          )}
        </div>
      )}
    </>
  );
};

export default Popover;