'use client';

import React from 'react';

/**
 * Tag 컴포넌트 - WCAG 2.1 준수
 * 카테고리나 키워드를 표시하는 태그 컴포넌트
 */
const Tag = ({
  children,
  variant = 'default',
  size = 'md',
  removable = false,
  onRemove,
  selected = false,
  disabled = false,
  icon,
  gradient = false,
  shadow = false,
  className = '',
  onClick,
  ...props
}) => {
  // 베리언트별 스타일
  const variantStyles = {
    default: selected
      ? gradient
        ? 'bg-gradient-to-r from-[#2ac1bc] to-[#00b14f] text-white border-transparent'
        : 'bg-[#2ac1bc] text-white border-[#2ac1bc]'
      : gradient
        ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 hover:from-gray-200 hover:to-gray-300'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
    primary: gradient
      ? 'bg-gradient-to-r from-[#2ac1bc] to-[#3ec8c3] text-white border-transparent'
      : 'bg-[#e8faf9] text-[#2ac1bc] border-[#2ac1bc]',
    success: gradient
      ? 'bg-gradient-to-r from-[#00b14f] to-[#00c458] text-white border-transparent'
      : 'bg-[#e8f8f0] text-[#00b14f] border-[#00b14f]',
    warning: gradient
      ? 'bg-gradient-to-r from-[#FFDD00] to-[#FFE555] text-gray-800 border-transparent'
      : 'bg-[#FFFACD] text-[#FF8C00] border-[#FFDD00]',
    error: gradient
      ? 'bg-gradient-to-r from-[#DA020E] to-[#FF1F2C] text-white border-transparent'
      : 'bg-[#FFE4E6] text-[#DA020E] border-[#DA020E]',
  };

  // 사이즈별 스타일
  const sizeStyles = {
    xs: 'px-2 py-0.5 text-xs gap-1',
    sm: 'px-2.5 py-1 text-sm gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2',
    xl: 'px-5 py-2.5 text-lg gap-2.5',
  };

  // 그림자 스타일
  const shadowStyle = shadow 
    ? variant === 'primary' 
      ? 'shadow-lg shadow-[#2ac1bc]/20' 
      : variant === 'success'
      ? 'shadow-lg shadow-[#00b14f]/20'
      : 'shadow-md'
    : '';

  const handleClick = (e) => {
    if (disabled) return;
    if (onClick) onClick(e);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (disabled || !onRemove) return;
    onRemove(e);
  };

  return (
    <span
      className={`
        inline-flex items-center
        border rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${shadowStyle}
        ${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer' : ''}
        transition-all duration-200
        ${className}
      `}
      role={onClick ? 'button' : 'status'}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      }}
      aria-selected={selected}
      aria-disabled={disabled}
      {...props}
    >
      {icon && (
        <span className="flex-shrink-0">
          {icon}
        </span>
      )}
      
      <span>{children}</span>
      
      {removable && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={disabled}
          className={`
            flex-shrink-0 ml-1 -mr-1
            hover:bg-black/10 rounded-full p-0.5
            transition-colors duration-200
            ${disabled ? 'cursor-not-allowed' : ''}
          `}
          aria-label={`Remove ${children}`}
        >
          <svg 
            className="w-3 h-3" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      )}
    </span>
  );
};

export default Tag;