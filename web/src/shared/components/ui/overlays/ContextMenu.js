/**
 * ContextMenu.js - 컨텍스트 메뉴 컴포넌트 (점주용)
 * WCAG 2.1 준수, 다크모드 지원, Local 테마 적용
 */
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

const ContextMenu = ({
  children,
  menu = [],
  onMenuClick,
  className = '',
  disabled = false,
  trigger = 'contextmenu',
  closeOnClick = true,
  closeOnScroll = true,
  position = 'auto',
  offsetX = 0,
  offsetY = 0,
  ariaLabel = '컨텍스트 메뉴',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const focusedIndexRef = useRef(-1);

  // 메뉴 위치 계산
  const calculateMenuPosition = useCallback((clientX, clientY) => {
    if (!menuRef.current) return { x: clientX, y: clientY };

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = clientX + offsetX;
    let y = clientY + offsetY;

    // 자동 위치 조정
    if (position === 'auto') {
      // 오른쪽 경계 체크
      if (x + menuRect.width > viewportWidth) {
        x = clientX - menuRect.width - offsetX;
      }

      // 하단 경계 체크
      if (y + menuRect.height > viewportHeight) {
        y = clientY - menuRect.height - offsetY;
      }

      // 왼쪽 경계 체크
      if (x < 0) {
        x = 10;
      }

      // 상단 경계 체크
      if (y < 0) {
        y = 10;
      }
    } else {
      // 수동 위치 설정
      switch (position) {
        case 'top':
          x = clientX - menuRect.width / 2;
          y = clientY - menuRect.height - 10;
          break;
        case 'bottom':
          x = clientX - menuRect.width / 2;
          y = clientY + 10;
          break;
        case 'left':
          x = clientX - menuRect.width - 10;
          y = clientY - menuRect.height / 2;
          break;
        case 'right':
          x = clientX + 10;
          y = clientY - menuRect.height / 2;
          break;
        default:
          break;
      }
    }

    return { x, y };
  }, [position, offsetX, offsetY]);

  // 메뉴 열기
  const openMenu = useCallback((event) => {
    if (disabled || menu.length === 0) return;

    event.preventDefault();
    event.stopPropagation();

    const { clientX, clientY } = event;
    setMenuPosition(calculateMenuPosition(clientX, clientY));
    setIsOpen(true);
    focusedIndexRef.current = -1;

    // 다음 프레임에서 메뉴에 포커스
    requestAnimationFrame(() => {
      if (menuRef.current) {
        menuRef.current.focus();
      }
    });
  }, [disabled, menu.length, calculateMenuPosition]);

  // 메뉴 닫기
  const closeMenu = useCallback(() => {
    setIsOpen(false);
    focusedIndexRef.current = -1;
    
    // 원래 트리거 요소에 포커스 복원
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, []);

  // 메뉴 아이템 클릭
  const handleMenuClick = useCallback((item, index, event) => {
    if (item.disabled) {
      event.preventDefault();
      return;
    }

    // 개별 아이템 클릭 핸들러 호출
    if (item.onClick) {
      item.onClick(event, item);
    }

    // 전체 메뉴 클릭 핸들러 호출
    if (onMenuClick) {
      onMenuClick(item, index, event);
    }

    // 메뉴 닫기 (설정에 따라)
    if (closeOnClick && !item.keepOpen) {
      closeMenu();
    }
  }, [onMenuClick, closeOnClick, closeMenu]);

  // 키보드 네비게이션
  const handleMenuKeyDown = useCallback((event) => {
    const enabledItems = menu.filter(item => !item.disabled && !item.divider);
    
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        closeMenu();
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        focusedIndexRef.current = focusedIndexRef.current < enabledItems.length - 1 
          ? focusedIndexRef.current + 1 
          : 0;
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        focusedIndexRef.current = focusedIndexRef.current > 0 
          ? focusedIndexRef.current - 1 
          : enabledItems.length - 1;
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndexRef.current >= 0) {
          const focusedItem = enabledItems[focusedIndexRef.current];
          const originalIndex = menu.indexOf(focusedItem);
          handleMenuClick(focusedItem, originalIndex, event);
        }
        break;
        
      case 'Home':
        event.preventDefault();
        focusedIndexRef.current = 0;
        break;
        
      case 'End':
        event.preventDefault();
        focusedIndexRef.current = enabledItems.length - 1;
        break;
        
      default:
        // 문자 키로 검색
        if (event.key.length === 1) {
          const char = event.key.toLowerCase();
          const currentIndex = focusedIndexRef.current;
          
          // 현재 포커스 다음부터 검색
          let foundIndex = enabledItems.findIndex((item, index) => 
            index > currentIndex && 
            item.label && 
            item.label.toLowerCase().startsWith(char)
          );
          
          // 찾지 못하면 처음부터 검색
          if (foundIndex === -1) {
            foundIndex = enabledItems.findIndex(item => 
              item.label && 
              item.label.toLowerCase().startsWith(char)
            );
          }
          
          if (foundIndex !== -1) {
            focusedIndexRef.current = foundIndex;
          }
        }
        break;
    }
  }, [menu, handleMenuClick, closeMenu]);

  // 트리거 이벤트 핸들러
  const handleTriggerEvent = useCallback((event) => {
    if (trigger === 'contextmenu' && event.type === 'contextmenu') {
      openMenu(event);
    } else if (trigger === 'click' && event.type === 'click') {
      if (isOpen) {
        closeMenu();
      } else {
        openMenu(event);
      }
    } else if (trigger === 'doubleclick' && event.type === 'dblclick') {
      openMenu(event);
    }
  }, [trigger, isOpen, openMenu, closeMenu]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('focusin', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('focusin', handleClickOutside);
    };
  }, [isOpen, closeMenu]);

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen && closeOnScroll) {
        closeMenu();
      }
    };

    if (isOpen && closeOnScroll) {
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, closeOnScroll, closeMenu]);

  // 윈도우 리사이즈 감지
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        closeMenu();
      }
    };

    if (isOpen) {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, closeMenu]);

  // 메뉴 아이템 아이콘 렌더링
  const renderItemIcon = useCallback((item) => {
    if (!item.icon) return null;

    if (typeof item.icon === 'string') {
      // 아이콘 이름으로 기본 아이콘 렌더링
      const iconClasses = "w-4 h-4 mr-3 flex-shrink-0";
      
      switch (item.icon) {
        case 'copy':
          return (
            <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          );
        case 'edit':
          return (
            <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          );
        case 'delete':
          return (
            <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          );
        case 'share':
          return (
            <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          );
        case 'download':
          return (
            <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          );
        default:
          return (
            <div className={`${iconClasses} rounded bg-gray-200 dark:bg-gray-700`}></div>
          );
      }
    }

    // 커스텀 아이콘 컴포넌트
    return (
      <span className="w-4 h-4 mr-3 flex-shrink-0" aria-hidden="true">
        {item.icon}
      </span>
    );
  }, []);

  // 메뉴 아이템 렌더링
  const renderMenuItem = useCallback((item, index) => {
    // 구분선
    if (item.divider) {
      return (
        <div
          key={`divider-${index}`}
          className="my-1 border-t border-gray-200 dark:border-gray-600"
          role="separator"
          aria-orientation="horizontal"
        />
      );
    }

    const isEnabled = !item.disabled;
    const isFocused = focusedIndexRef.current === menu.filter(item => !item.disabled && !item.divider).indexOf(item);
    
    return (
      <button
        key={item.id || index}
        type="button"
        onClick={(event) => handleMenuClick(item, index, event)}
        disabled={!isEnabled}
        className={`
          w-full flex items-center px-4 py-2 text-left text-sm transition-colors duration-150
          focus:outline-none
          ${isEnabled
            ? `text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 
               focus:bg-gray-100 dark:focus:bg-gray-700
               ${isFocused ? 'bg-gray-100 dark:bg-gray-700' : ''}
               ${item.variant === 'danger' 
                 ? 'hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400' 
                 : ''
               }`
            : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }
        `}
        role="menuitem"
        tabIndex={-1}
      >
        {renderItemIcon(item)}
        
        <span className="flex-1 min-w-0">
          {item.label}
        </span>
        
        {/* 키보드 단축키 표시 */}
        {item.shortcut && (
          <span className="ml-3 text-xs text-gray-400 dark:text-gray-500 font-mono">
            {item.shortcut}
          </span>
        )}
        
        {/* 서브메뉴 화살표 */}
        {item.submenu && item.submenu.length > 0 && (
          <svg 
            className="w-4 h-4 ml-2 text-gray-400 dark:text-gray-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>
    );
  }, [menu, handleMenuClick, renderItemIcon]);

  return (
    <>
      {/* 트리거 요소 */}
      <div
        ref={containerRef}
        className={className}
        onContextMenu={trigger === 'contextmenu' ? handleTriggerEvent : undefined}
        onClick={trigger === 'click' ? handleTriggerEvent : undefined}
        onDoubleClick={trigger === 'doubleclick' ? handleTriggerEvent : undefined}
        {...props}
      >
        <div ref={triggerRef} tabIndex={disabled ? -1 : 0}>
          {children}
        </div>
      </div>

      {/* 컨텍스트 메뉴 */}
      {isOpen && (
        <>
          {/* 오버레이 */}
          <div 
            className="fixed inset-0 z-40" 
            aria-hidden="true"
          />
          
          {/* 메뉴 */}
          <div
            ref={menuRef}
            className="fixed z-50 min-w-[160px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 focus:outline-none"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
            }}
            role="menu"
            aria-orientation="vertical"
            aria-label={ariaLabel}
            tabIndex={-1}
            onKeyDown={handleMenuKeyDown}
          >
            {menu.map((item, index) => renderMenuItem(item, index))}
            
            {/* 메뉴가 비어있을 때 */}
            {menu.length === 0 && (
              <div className="px-4 py-2 text-sm text-gray-400 dark:text-gray-500">
                사용 가능한 옵션이 없습니다
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default ContextMenu;