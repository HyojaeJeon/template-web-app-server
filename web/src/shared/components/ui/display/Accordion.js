'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Accordion 컴포넌트 - WCAG 2.1 준수
 * 접기/펼치기 가능한 아코디언 컴포넌트
 */
const Accordion = ({
  items = [],
  defaultExpanded = [],
  expandedItems,
  onExpandChange,
  multiple = true,
  variant = 'default',
  size = 'md',
  showIcon = true,
  iconPosition = 'right',
  animated = true,
  bordered = true,
  className = '',
  ...props
}) => {
  const [internalExpanded, setInternalExpanded] = useState(
    expandedItems !== undefined ? expandedItems : defaultExpanded
  );
  const contentRefs = useRef({});

  // 베리언트별 스타일
  const variantStyles = {
    default: {
      container: 'bg-white',
      header: 'bg-gray-50 hover:bg-gray-100',
      content: 'bg-white',
      border: 'border-gray-200',
    },
    primary: {
      container: 'bg-white',
      header: 'bg-[#e8faf9] hover:bg-[#d4f5f3]',
      content: 'bg-white',
      border: 'border-[#2ac1bc]',
    },
    minimal: {
      container: 'bg-transparent',
      header: 'bg-transparent hover:bg-gray-50',
      content: 'bg-transparent',
      border: 'border-gray-200',
    },
    card: {
      container: 'bg-white shadow-lg',
      header: 'bg-white hover:bg-gray-50',
      content: 'bg-gray-50',
      border: 'border-gray-200',
    },
  };

  // 사이즈별 스타일
  const sizeStyles = {
    sm: {
      header: 'px-3 py-2 text-sm',
      content: 'px-3 py-2 text-sm',
      icon: 'w-4 h-4',
    },
    md: {
      header: 'px-4 py-3 text-base',
      content: 'px-4 py-3 text-base',
      icon: 'w-5 h-5',
    },
    lg: {
      header: 'px-5 py-4 text-lg',
      content: 'px-5 py-4 text-lg',
      icon: 'w-6 h-6',
    },
    xl: {
      header: 'px-6 py-5 text-xl',
      content: 'px-6 py-5 text-xl',
      icon: 'w-7 h-7',
    },
  };

  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];

  // 확장 상태 확인
  const isExpanded = useCallback((id) => {
    const expanded = expandedItems !== undefined ? expandedItems : internalExpanded;
    return Array.isArray(expanded) ? expanded.includes(id) : expanded === id;
  }, [expandedItems, internalExpanded]);

  // 확장 토글
  const toggleExpanded = useCallback((id) => {
    let newExpanded;

    if (multiple) {
      const currentExpanded = expandedItems !== undefined ? expandedItems : internalExpanded;
      if (isExpanded(id)) {
        newExpanded = currentExpanded.filter(item => item !== id);
      } else {
        newExpanded = [...currentExpanded, id];
      }
    } else {
      newExpanded = isExpanded(id) ? null : id;
    }

    if (expandedItems === undefined) {
      setInternalExpanded(newExpanded);
    }
    
    if (onExpandChange) {
      onExpandChange(newExpanded);
    }
  }, [multiple, expandedItems, internalExpanded, isExpanded, onExpandChange]);

  // 키보드 네비게이션
  const handleKeyDown = useCallback((e, id, index) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        toggleExpanded(id);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (index > 0) {
          const prevButton = e.target.parentElement.previousElementSibling?.querySelector('button');
          prevButton?.focus();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (index < items.length - 1) {
          const nextButton = e.target.parentElement.nextElementSibling?.querySelector('button');
          nextButton?.focus();
        }
        break;
      case 'Home':
        e.preventDefault();
        const firstButton = e.target.closest('[role="region"]')?.querySelector('button');
        firstButton?.focus();
        break;
      case 'End':
        e.preventDefault();
        const buttons = e.target.closest('[role="region"]')?.querySelectorAll('button');
        buttons?.[buttons.length - 1]?.focus();
        break;
      default:
        break;
    }
  }, [toggleExpanded, items.length]);

  // 컨텐츠 높이 설정 (애니메이션용)
  useEffect(() => {
    Object.keys(contentRefs.current).forEach(id => {
      const element = contentRefs.current[id];
      if (element) {
        if (isExpanded(id)) {
          element.style.maxHeight = `${element.scrollHeight}px`;
        } else {
          element.style.maxHeight = '0px';
        }
      }
    });
  }, [isExpanded, items]);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      className={`
        ${currentVariant.container}
        ${bordered ? `border ${currentVariant.border} rounded-lg` : ''}
        ${className}
      `}
      role="region"
      aria-label="아코디언"
      {...props}
    >
      {items.map((item, index) => {
        const expanded = isExpanded(item.id);
        const isFirst = index === 0;
        const isLast = index === items.length - 1;

        return (
          <div
            key={item.id}
            className={`
              ${!isFirst && bordered ? `border-t ${currentVariant.border}` : ''}
              ${isFirst && bordered ? 'rounded-t-lg overflow-hidden' : ''}
              ${isLast && bordered ? 'rounded-b-lg overflow-hidden' : ''}
            `}
          >
            {/* 헤더 */}
            <button
              onClick={() => toggleExpanded(item.id)}
              onKeyDown={(e) => handleKeyDown(e, item.id, index)}
              className={`
                w-full flex items-center justify-between
                ${currentSize.header}
                ${currentVariant.header}
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-[#2ac1bc] focus:ring-inset
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              aria-expanded={expanded}
              aria-controls={`accordion-content-${item.id}`}
              disabled={item.disabled}
            >
              <div className="flex items-center gap-3 flex-1">
                {/* 왼쪽 아이콘 */}
                {showIcon && iconPosition === 'left' && (
                  <svg
                    className={`
                      ${currentSize.icon}
                      text-gray-600
                      transition-transform duration-200
                      ${expanded ? 'rotate-90' : ''}
                    `}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}

                {/* 아이템 아이콘 */}
                {item.icon && (
                  <span className="flex-shrink-0">
                    {item.icon}
                  </span>
                )}

                {/* 제목 */}
                <span className="font-medium text-left">
                  {item.title}
                </span>

                {/* 서브타이틀 */}
                {item.subtitle && (
                  <span className="text-sm text-gray-500 ml-2">
                    {item.subtitle}
                  </span>
                )}

                {/* 배지 */}
                {item.badge && (
                  <span className="ml-auto mr-3 px-2 py-1 text-xs bg-[#2ac1bc] text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* 오른쪽 아이콘 */}
              {showIcon && iconPosition === 'right' && (
                <svg
                  className={`
                    ${currentSize.icon}
                    text-gray-600
                    transition-transform duration-200
                    ${expanded ? 'rotate-90' : ''}
                  `}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </button>

            {/* 컨텐츠 */}
            <div
              ref={(el) => {
                if (el) contentRefs.current[item.id] = el;
              }}
              id={`accordion-content-${item.id}`}
              className={`
                overflow-hidden
                ${animated ? 'transition-all duration-300 ease-in-out' : ''}
                ${expanded ? '' : 'max-h-0'}
              `}
              aria-hidden={!expanded}
            >
              <div
                className={`
                  ${currentSize.content}
                  ${currentVariant.content}
                  ${item.contentClassName || ''}
                `}
              >
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;