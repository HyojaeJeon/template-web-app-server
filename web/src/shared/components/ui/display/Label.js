'use client';

import React from 'react';

/**
 * Label 컴포넌트 - WCAG 2.1 준수
 * 폼 필드나 다른 요소에 대한 라벨 표시
 */
const Label = ({
  children,
  htmlFor,
  required = false,
  disabled = false,
  size = 'md',
  weight = 'medium',
  gradient = false,
  className = '',
  icon,
  helper,
  error,
  ...props
}) => {
  // 사이즈별 스타일
  const sizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  // 폰트 웨이트 스타일
  const weightStyles = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  // 기본 텍스트 색상
  const colorClass = error 
    ? 'text-[#DA020E]' 
    : disabled 
    ? 'text-gray-400' 
    : gradient
    ? 'bg-gradient-to-r from-[#2ac1bc] to-[#00b14f] bg-clip-text text-transparent'
    : 'text-gray-700';

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={htmlFor}
        className={`
          inline-flex items-center gap-2
          ${sizeStyles[size]}
          ${weightStyles[weight]}
          ${colorClass}
          transition-colors duration-200
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${className}
        `}
        {...props}
      >
        {icon && (
          <span className="flex-shrink-0">
            {icon}
          </span>
        )}
        
        <span className="flex items-center gap-1">
          {children}
          {required && (
            <span 
              className="text-[#DA020E] ml-0.5"
              aria-label="required"
            >
              *
            </span>
          )}
        </span>
      </label>
      
      {helper && !error && (
        <span className="text-sm text-gray-500 mt-1">
          {helper}
        </span>
      )}
      
      {error && (
        <span 
          className="text-sm text-[#DA020E] mt-1 flex items-center gap-1"
          role="alert"
        >
          <svg 
            className="w-4 h-4 flex-shrink-0" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
};

export default Label;