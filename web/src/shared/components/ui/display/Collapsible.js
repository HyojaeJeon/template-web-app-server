'use client';

import React, { useState, useRef, useEffect } from 'react';

/**
 * Collapsible 컴포넌트
 * 
 * @component
 * @param {Object} props - 컴포넌트 속성
 * @param {React.ReactNode} props.children - 접을 수 있는 콘텐츠
 * @param {string} [props.title] - 헤더 제목
 * @param {React.ReactNode} [props.header] - 커스텀 헤더
 * @param {boolean} [props.defaultOpen=false] - 기본 펼침 상태
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {string} [props.contentClassName] - 콘텐츠 영역 CSS 클래스
 * @param {string} [props.headerClassName] - 헤더 영역 CSS 클래스
 * @param {Function} [props.onToggle] - 토글 이벤트 핸들러
 * @param {boolean} [props.disabled=false] - 비활성화 상태
 * @param {string} [props.variant='default'] - 스타일 변형 (default, bordered, elevated)
 * @param {string} [props.size='md'] - 크기 (sm, md, lg)
 * @param {React.ReactNode} [props.icon] - 헤더 아이콘
 * 
 * @example
 * ```jsx
 * <Collapsible title="접을 수 있는 섹션">
 *   <p>숨겨진 콘텐츠</p>
 * </Collapsible>
 * ```
 */
const Collapsible = ({
  children,
  title,
  header,
  defaultOpen = false,
  className = '',
  contentClassName = '',
  headerClassName = '',
  onToggle,
  disabled = false,
  variant = 'default',
  size = 'md',
  icon
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [height, setHeight] = useState(defaultOpen ? 'auto' : '0px');
  const contentRef = useRef(null);

  const handleToggle = () => {
    if (disabled) return;
    
    const newState = !isOpen;
    setIsOpen(newState);
    
    if (onToggle) {
      onToggle(newState);
    }
  };

  useEffect(() => {
    if (!contentRef.current) return;

    if (isOpen) {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(`${contentHeight}px`);
      
      const timeout = setTimeout(() => {
        setHeight('auto');
      }, 300);
      
      return () => clearTimeout(timeout);
    } else {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(`${contentHeight}px`);
      
      requestAnimationFrame(() => {
        setHeight('0px');
      });
    }
  }, [isOpen]);

  const sizeStyles = {
    sm: 'py-2 px-3 text-sm',
    md: 'py-3 px-4 text-base',
    lg: 'py-4 px-5 text-lg'
  };

  const variantStyles = {
    default: 'bg-white hover:bg-gray-50',
    bordered: 'bg-white border border-gray-200 rounded-lg',
    elevated: 'bg-white shadow-md hover:shadow-lg rounded-lg'
  };

  const containerClasses = `
    ${variantStyles[variant]}
    transition-all duration-300
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  const headerClasses = `
    flex items-center justify-between
    ${sizeStyles[size]}
    ${disabled ? '' : 'cursor-pointer'}
    transition-colors duration-200
    ${headerClassName}
  `;

  const contentClasses = `
    overflow-hidden
    transition-[height] duration-300 ease-in-out
    ${contentClassName}
  `;

  const chevronClasses = `
    w-5 h-5
    transition-transform duration-300
    ${isOpen ? 'rotate-180' : ''}
    ${disabled ? 'text-gray-300' : 'text-gray-500'}
  `;

  return (
    <div className={containerClasses}>
      <div 
        className={headerClasses}
        onClick={handleToggle}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        aria-expanded={isOpen}
        aria-controls="collapsible-content"
        aria-disabled={disabled}
      >
        {header || (
          <div className="flex items-center gap-3 flex-1">
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {title && (
              <h3 className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-800'}`}>
                {title}
              </h3>
            )}
          </div>
        )}
        
        <svg 
          className={chevronClasses}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </div>

      <div
        id="collapsible-content"
        className={contentClasses}
        style={{ height }}
        aria-hidden={!isOpen}
      >
        <div ref={contentRef} className={sizeStyles[size]}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Collapsible;