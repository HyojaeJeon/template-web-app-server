/**
 * 권한 기반 사이드바 메뉴 컴포넌트
 * 동적 메뉴 구조, 알림 배지, 아코디언 서브메뉴 지원
 */
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '../hooks/usePermissions';

/**
 * 메뉴 아이템 컴포넌트
 */
const MenuItem = ({ 
  item, 
  index, 
  isActive, 
  isSubmenuOpen, 
  onSubmenuToggle, 
  variant, 
  itemRef,
  level = 0 
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const indentClass = level > 0 ? `ml-${level * 4}` : '';

  // 권한 확인
  const { hasPermission } = usePermissions();
  
  if (item.permission && !hasPermission(item.permission)) {
    return null;
  }

  // POS 상태 표시 색상
  const getPOSStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'disconnected': return 'bg-red-500';
      case 'error': return 'bg-red-500 animate-pulse';
      default: return 'bg-gray-400';
    }
  };

  // 알림 배지 렌더링
  const renderBadge = (badge) => {
    if (!badge) return null;
    
    const badgeValue = typeof badge === 'object' ? badge.value : badge;
    const badgeType = typeof badge === 'object' ? badge.type : 'default';
    
    const badgeClasses = {
      default: 'bg-primary-500 text-white',
      urgent: 'bg-red-500 text-white animate-pulse',
      warning: 'bg-yellow-500 text-black',
      success: 'bg-green-500 text-white',
      info: 'bg-blue-500 text-white'
    };

    return (
      <span 
        className={`
          ml-auto px-2 py-0.5 text-xs font-medium rounded-full min-w-[20px] text-center
          ${badgeClasses[badgeType] || badgeClasses.default}
        `}
        aria-label={`${badgeValue}개의 알림`}
      >
        {badgeValue}
      </span>
    );
  };

  // 상태 인디케이터 렌더링
  const renderStatusIndicator = (status) => {
    if (!status) return null;
    
    return (
      <div 
        className={`ml-auto w-2 h-2 rounded-full ${getPOSStatusColor(status)}`}
        aria-label={`상태: ${status}`}
        title={status}
      />
    );
  };

  if (hasChildren) {
    return (
      <div className={indentClass}>
        <button
          ref={itemRef}
          onClick={() => onSubmenuToggle(item.id)}
          className={`
            w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group
            ${isActive 
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-expanded={isSubmenuOpen}
          aria-haspopup="true"
          disabled={item.disabled}
          title={variant === 'mini' ? item.label : undefined}
        >
          {/* 아이콘 */}
          {item.icon && (
            <span className="flex-shrink-0 mr-3 text-current">
              {item.icon}
            </span>
          )}
          
          {variant !== 'mini' && (
            <>
              {/* 라벨 */}
              <span className="flex-1 text-left">{item.label}</span>
              
              {/* 배지 */}
              {renderBadge(item.badge)}
              
              {/* 상태 인디케이터 */}
              {renderStatusIndicator(item.status)}
              
              {/* 확장/축소 화살표 */}
              <svg 
                className={`
                  ml-2 w-4 h-4 transform transition-transform duration-200 flex-shrink-0
                  ${isSubmenuOpen ? 'rotate-90' : 'rotate-0'}
                `} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>

        {/* 서브메뉴 */}
        {isSubmenuOpen && variant !== 'mini' && (
          <div 
            className="mt-1 space-y-1 pl-6"
            role="group"
            aria-labelledby={`menu-${item.id}`}
          >
            {item.children.map((child, childIndex) => (
              <MenuItem
                key={child.id || child.href}
                item={child}
                index={childIndex}
                isActive={isActive}
                variant={variant}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // 단일 메뉴 아이템 (링크)
  return (
    <div className={indentClass}>
      <Link
        ref={itemRef}
        href={item.href}
        className={`
          flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group
          ${isActive 
            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
          ${item.disabled 
            ? 'opacity-50 cursor-not-allowed pointer-events-none' 
            : 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50'
          }
        `}
        title={variant === 'mini' ? item.label : undefined}
        aria-current={isActive ? 'page' : undefined}
      >
        {/* 아이콘 */}
        {item.icon && (
          <span className="flex-shrink-0 mr-3 text-current">
            {item.icon}
          </span>
        )}
        
        {variant !== 'mini' && (
          <>
            {/* 라벨 */}
            <span className="flex-1">{item.label}</span>
            
            {/* 배지 */}
            {renderBadge(item.badge)}
            
            {/* 상태 인디케이터 */}
            {renderStatusIndicator(item.status)}
            
            {/* 외부 링크 표시 */}
            {item.external && (
              <svg className="ml-2 w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
              </svg>
            )}
          </>
        )}
      </Link>
    </div>
  );
};

/**
 * 사이드바 메뉴 컴포넌트
 */
const SidebarMenu = ({ 
  menuItems = [], 
  variant = 'full',
  className = '',
  onItemClick,
  searchQuery = '',
  ...props 
}) => {
  const pathname = usePathname();
  const [activeSubmenu, setActiveSubmenu] = useState(new Set());
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const itemRefs = useRef([]);

  // 활성 상태 확인
  const isActive = (href) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  // 검색 필터링
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery) return menuItems;
    
    const filterItems = (items) => {
      return items.filter(item => {
        // 라벨에서 검색
        const labelMatch = item.label.toLowerCase().includes(searchQuery.toLowerCase());
        
        // 자식 메뉴에서 검색
        const childMatch = item.children ? 
          filterItems(item.children).length > 0 : false;
        
        return labelMatch || childMatch;
      }).map(item => ({
        ...item,
        children: item.children ? filterItems(item.children) : undefined
      }));
    };
    
    return filterItems(menuItems);
  }, [menuItems, searchQuery]);

  // 서브메뉴 토글
  const handleSubmenuToggle = (itemId) => {
    setActiveSubmenu(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // 활성 메뉴의 부모 서브메뉴 자동 열기
  useEffect(() => {
    const findParentMenus = (items, targetHref, parents = []) => {
      for (const item of items) {
        if (item.href === targetHref) {
          return parents;
        }
        if (item.children) {
          const found = findParentMenus(item.children, targetHref, [...parents, item.id]);
          if (found) return found;
        }
      }
      return null;
    };

    const parentMenus = findParentMenus(filteredMenuItems, pathname);
    if (parentMenus) {
      setActiveSubmenu(new Set(parentMenus));
    }
  }, [pathname, filteredMenuItems]);

  // 키보드 네비게이션
  const handleKeyDown = (e) => {
    const allItems = [];
    
    const collectItems = (items) => {
      items.forEach(item => {
        allItems.push(item);
        if (item.children && activeSubmenu.has(item.id)) {
          collectItems(item.children);
        }
      });
    };
    
    collectItems(filteredMenuItems);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % allItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev <= 0 ? allItems.length - 1 : prev - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
          itemRefs.current[focusedIndex].click();
        }
        break;
    }
  };

  // 포커스 관리
  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex].focus();
    }
  }, [focusedIndex]);

  return (
    <nav 
      className={`flex-1 px-3 py-4 space-y-1 overflow-y-auto ${className}`}
      role="navigation"
      aria-label="주요 네비게이션"
      onKeyDown={handleKeyDown}
      {...props}
    >
      {/* 검색 결과가 없을 때 */}
      {searchQuery && filteredMenuItems.length === 0 && (
        <div className="px-3 py-8 text-center">
          <div className="text-gray-400 dark:text-gray-600 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            '{searchQuery}'에 대한 결과가 없습니다.
          </p>
        </div>
      )}

      {/* 메뉴 아이템 렌더링 */}
      {filteredMenuItems.map((item, index) => (
        <MenuItem
          key={item.id}
          item={item}
          index={index}
          isActive={isActive(item.href)}
          isSubmenuOpen={activeSubmenu.has(item.id)}
          onSubmenuToggle={handleSubmenuToggle}
          variant={variant}
          itemRef={el => itemRefs.current[index] = el}
        />
      ))}
    </nav>
  );
};

export default SidebarMenu;