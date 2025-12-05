'use client';

import React from 'react';

/**
 * Chip 컴포넌트 - WCAG 2.1 준수
 * 작은 정보 표시를 위한 칩 컴포넌트
 */
const Chip = ({
  label,
  icon,
  avatar,
  onDelete,
  onClick,
  variant = 'default',
  color = 'default',
  size = 'md',
  disabled = false,
  selected = false,
  gradient = false,
  outlined = false,
  className = '',
  ...props
}) => {
  // 색상별 스타일
  const colorStyles = {
    default: {
      filled: selected
        ? gradient
          ? 'bg-gradient-to-r from-[#2ac1bc] to-[#00b14f] text-white border-transparent'
          : 'bg-[#2ac1bc] text-white border-[#2ac1bc]'
        : gradient
          ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300'
          : 'bg-gray-100 text-gray-700 border-gray-300',
      outlined: selected
        ? 'bg-[#2ac1bc]/10 text-[#2ac1bc] border-[#2ac1bc]'
        : 'bg-white text-gray-700 border-gray-300',
    },
    primary: {
      filled: gradient
        ? 'bg-gradient-to-r from-[#2ac1bc] to-[#3ec8c3] text-white border-transparent'
        : 'bg-[#2ac1bc] text-white border-[#2ac1bc]',
      outlined: 'bg-white text-[#2ac1bc] border-[#2ac1bc]',
    },
    success: {
      filled: gradient
        ? 'bg-gradient-to-r from-[#00b14f] to-[#00c458] text-white border-transparent'
        : 'bg-[#00b14f] text-white border-[#00b14f]',
      outlined: 'bg-white text-[#00b14f] border-[#00b14f]',
    },
    warning: {
      filled: gradient
        ? 'bg-gradient-to-r from-[#FFDD00] to-[#FFE555] text-gray-800 border-transparent'
        : 'bg-[#FFDD00] text-gray-800 border-[#FFDD00]',
      outlined: 'bg-white text-[#FF8C00] border-[#FFDD00]',
    },
    error: {
      filled: gradient
        ? 'bg-gradient-to-r from-[#DA020E] to-[#FF1F2C] text-white border-transparent'
        : 'bg-[#DA020E] text-white border-[#DA020E]',
      outlined: 'bg-white text-[#DA020E] border-[#DA020E]',
    },
    info: {
      filled: gradient
        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-transparent'
        : 'bg-blue-500 text-white border-blue-500',
      outlined: 'bg-white text-blue-500 border-blue-500',
    },
  };

  // 사이즈별 스타일
  const sizeStyles = {
    xs: 'h-5 px-2 text-xs gap-1',
    sm: 'h-6 px-2.5 text-sm gap-1',
    md: 'h-8 px-3 text-sm gap-1.5',
    lg: 'h-10 px-4 text-base gap-2',
    xl: 'h-12 px-5 text-lg gap-2',
  };

  // 아바타 사이즈
  const avatarSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  const currentColorStyle = outlined 
    ? colorStyles[color].outlined 
    : colorStyles[color].filled;

  const handleClick = (e) => {
    if (disabled) return;
    if (onClick) onClick(e);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (disabled || !onDelete) return;
    onDelete(e);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onClick) onClick(e);
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (onDelete) {
        e.preventDefault();
        onDelete(e);
      }
    }
  };

  return (
    <div
      className={`
        inline-flex items-center justify-center
        rounded-full border
        ${sizeStyles[size]}
        ${currentColorStyle}
        ${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer' : ''}
        ${onClick && !disabled ? 'hover:shadow-md' : ''}
        transition-all duration-200
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : 'status'}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-selected={selected}
      aria-disabled={disabled}
      {...props}
    >
      {/* 아바타 */}
      {avatar && (
        <div className={`
          ${avatarSizes[size]}
          -ml-1 mr-1
          rounded-full overflow-hidden
          flex-shrink-0
        `}>
          {typeof avatar === 'string' ? (
            <img 
              src={avatar} 
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            avatar
          )}
        </div>
      )}

      {/* 아이콘 */}
      {icon && !avatar && (
        <span className="flex-shrink-0">
          {icon}
        </span>
      )}

      {/* 라벨 */}
      <span className="truncate">
        {label}
      </span>

      {/* 삭제 버튼 */}
      {onDelete && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={disabled}
          className={`
            flex-shrink-0 -mr-1 ml-1
            hover:bg-black/10 rounded-full
            transition-colors duration-200
            ${disabled ? 'cursor-not-allowed' : ''}
            ${size === 'xs' ? 'p-0.5' : 'p-1'}
          `}
          aria-label={`Remove ${label}`}
        >
          <svg 
            className={`
              ${size === 'xs' || size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}
            `}
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
    </div>
  );
};

export default Chip;