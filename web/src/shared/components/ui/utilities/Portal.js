/**
 * 포털 컴포넌트 (점주용)
 * React Portal, 모달/오버레이 렌더링, WCAG 2.1 준수, Local 테마 적용
 */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const Portal = ({
  children,
  targetId = 'portal-root',
  createTarget = true,
  className = '',
  preventScroll = false,
  closeOnEscape = false,
  closeOnOutsideClick = false,
  onClose,
  zIndex = 1000,
  overlay = false,
  overlayClassName = '',
  overlayOpacity = 0.5,
  animationDuration = 300,
  animation = 'fade', // fade | slide | scale | none
  position = 'center', // center | top | bottom | left | right
  ...props
}) => {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [targetElement, setTargetElement] = useState(null);
  const portalRef = useRef(null);
  const previousFocus = useRef(null);
  const originalOverflow = useRef(null);

  // 마운트 시 타겟 요소 찾거나 생성
  useEffect(() => {
    let target = document.getElementById(targetId);
    
    if (!target && createTarget) {
      target = document.createElement('div');
      target.id = targetId;
      target.className = 'portal-container';
      document.body.appendChild(target);
    }

    if (target) {
      setTargetElement(target);
      setMounted(true);
    }

    return () => {
      if (createTarget && target && target.parentNode) {
        target.parentNode.removeChild(target);
      }
    };
  }, [targetId, createTarget]);

  // 스크롤 방지
  useEffect(() => {
    if (!mounted || !preventScroll) return;

    originalOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      if (originalOverflow.current !== null) {
        document.body.style.overflow = originalOverflow.current;
      }
    };
  }, [mounted, preventScroll]);

  // 포커스 관리
  useEffect(() => {
    if (!mounted) return;

    // 이전 포커스 저장
    previousFocus.current = document.activeElement;

    // 포털 내부로 포커스 이동
    if (portalRef.current) {
      const firstFocusable = getFocusableElements(portalRef.current)[0];
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    return () => {
      // 이전 포커스 복원
      if (previousFocus.current && previousFocus.current.focus) {
        previousFocus.current.focus();
      }
    };
  }, [mounted]);

  // ESC 키 처리
  useEffect(() => {
    if (!closeOnEscape || !mounted) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeOnEscape, mounted, onClose]);

  // 외부 클릭 처리
  useEffect(() => {
    if (!closeOnOutsideClick || !mounted) return;

    const handleOutsideClick = (event) => {
      if (portalRef.current && !portalRef.current.contains(event.target) && onClose) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [closeOnOutsideClick, mounted, onClose]);

  // 표시 애니메이션
  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  // 포커스 가능한 요소 찾기
  const getFocusableElements = (container) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors));
  };

  // 탭 트래핑
  const handleKeyDown = useCallback((event) => {
    if (event.key !== 'Tab' || !portalRef.current) return;

    const focusableElements = getFocusableElements(portalRef.current);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  }, []);

  // 애니메이션 클래스
  const getAnimationClasses = () => {
    const baseClass = 'transition-all duration-300 ease-out';
    
    switch (animation) {
      case 'fade':
        return `${baseClass} ${isVisible ? 'opacity-100' : 'opacity-0'}`;
      case 'slide':
        const slideDirection = position === 'top' ? '-translate-y-full' :
                             position === 'bottom' ? 'translate-y-full' :
                             position === 'left' ? '-translate-x-full' :
                             position === 'right' ? 'translate-x-full' : 
                             '-translate-y-4';
        return `${baseClass} transform ${isVisible ? 'translate-x-0 translate-y-0 opacity-100' : `${slideDirection} opacity-0`}`;
      case 'scale':
        return `${baseClass} transform ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`;
      case 'none':
        return '';
      default:
        return `${baseClass} ${isVisible ? 'opacity-100' : 'opacity-0'}`;
    }
  };

  // 위치별 클래스
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'items-start justify-center pt-16';
      case 'bottom':
        return 'items-end justify-center pb-16';
      case 'left':
        return 'items-center justify-start pl-16';
      case 'right':
        return 'items-center justify-end pr-16';
      case 'center':
      default:
        return 'items-center justify-center';
    }
  };

  if (!mounted || !targetElement) {
    return null;
  }

  const portalContent = (
    <div
      className={`fixed inset-0 flex ${getPositionClasses()}`}
      style={{ zIndex }}
      onKeyDown={handleKeyDown}
    >
      {/* 오버레이 */}
      {overlay && (
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            isVisible ? `opacity-${Math.round(overlayOpacity * 100)}` : 'opacity-0'
          } ${overlayClassName}`}
          onClick={closeOnOutsideClick ? onClose : undefined}
        />
      )}

      {/* 컨텐츠 */}
      <div
        ref={portalRef}
        className={`relative ${getAnimationClasses()} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label="포털 컨텐츠"
        {...props}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(portalContent, targetElement);
};

// 특수 포털 컴포넌트들

// 모달 포털
export const ModalPortal = ({ children, isOpen, onClose, ...props }) => {
  if (!isOpen) return null;

  return (
    <Portal
      overlay={true}
      preventScroll={true}
      closeOnEscape={true}
      closeOnOutsideClick={true}
      animation="scale"
      position="center"
      onClose={onClose}
      {...props}
    >
      {children}
    </Portal>
  );
};

// 드로어 포털
export const DrawerPortal = ({ children, isOpen, onClose, direction = 'right', ...props }) => {
  if (!isOpen) return null;

  return (
    <Portal
      overlay={true}
      preventScroll={true}
      closeOnEscape={true}
      closeOnOutsideClick={true}
      animation="slide"
      position={direction}
      onClose={onClose}
      {...props}
    >
      {children}
    </Portal>
  );
};

// 알림 포털 (상단)
export const NotificationPortal = ({ children, ...props }) => {
  return (
    <Portal
      targetId="notification-portal"
      createTarget={true}
      animation="slide"
      position="top"
      className="w-full max-w-sm mx-auto"
      zIndex={9999}
      {...props}
    >
      {children}
    </Portal>
  );
};

// 툴팁 포털
export const TooltipPortal = ({ children, targetRef, placement = 'top', ...props }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!targetRef.current) return;

    const updatePosition = () => {
      const rect = targetRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      let top = 0;
      let left = 0;

      switch (placement) {
        case 'top':
          top = rect.top + scrollTop - 8;
          left = rect.left + scrollLeft + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + scrollTop + 8;
          left = rect.left + scrollLeft + rect.width / 2;
          break;
        case 'left':
          top = rect.top + scrollTop + rect.height / 2;
          left = rect.left + scrollLeft - 8;
          break;
        case 'right':
          top = rect.top + scrollTop + rect.height / 2;
          left = rect.right + scrollLeft + 8;
          break;
      }

      setPosition({ top, left });
    };

    updatePosition();
    
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [targetRef, placement]);

  return (
    <Portal
      targetId="tooltip-portal"
      createTarget={true}
      animation="fade"
      zIndex={10000}
      className="absolute pointer-events-none"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: placement === 'top' || placement === 'bottom' 
          ? 'translateX(-50%)' 
          : placement === 'left' || placement === 'right'
          ? 'translateY(-50%)'
          : 'none'
      }}
      {...props}
    >
      {children}
    </Portal>
  );
};

// Context Provider for Portal Management
export const PortalProvider = ({ children }) => {
  useEffect(() => {
    // 기본 포털 루트들 생성
    const portals = [
      'portal-root',
      'modal-portal',
      'drawer-portal', 
      'notification-portal',
      'tooltip-portal'
    ];

    portals.forEach(id => {
      if (!document.getElementById(id)) {
        const portalRoot = document.createElement('div');
        portalRoot.id = id;
        portalRoot.className = `${id}-container`;
        document.body.appendChild(portalRoot);
      }
    });

    return () => {
      // 정리는 각 Portal 컴포넌트에서 담당
    };
  }, []);

  return children;
};

export default Portal;