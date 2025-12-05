/**
 * LoadingButton 컴포넌트 - Local App 디자인 시스템
 * WCAG 2.1 준수 로딩 상태 버튼 (Tailwind CSS 사용)
 */

'use client';

import React from 'react';

const LoadingButton = ({ 
  children,
  onClick,
  disabled = false,
  loading = false,
  loadingText = '처리중...',
  size = 'medium',
  fullWidth = false,
  variant = 'primary',
  className = '',
  ...props
}) => {
  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    small: 'px-3 py-1.5 text-sm min-h-[32px]',
    md: 'px-6 py-3 text-base min-h-[44px]',
    medium: 'px-6 py-3 text-base min-h-[44px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]',
    large: 'px-8 py-4 text-lg min-h-[56px]'
  };

  // Variant styles
  const variantClasses = {
    primary: `
      bg-gradient-to-r from-primary to-primary-dark
      text-white shadow-lg shadow-primary/25
      hover:from-primary-dark hover:to-primary-600
    `,
    secondary: `
      bg-gradient-to-r from-secondary to-secondary-dark
      text-white shadow-lg shadow-secondary/25
      hover:from-secondary-dark hover:to-secondary-700
    `,
    outline: `
      border-2 border-primary text-primary
      hover:bg-primary/10
    `,
    ghost: `
      text-primary hover:bg-primary/10
    `
  };

  // Base classes
  const baseClasses = `
    inline-flex items-center justify-center gap-2
    font-semibold rounded-xl whitespace-nowrap
    transition-all duration-200
    focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30
    disabled:opacity-50 disabled:cursor-not-allowed
    hover:shadow-xl hover:-translate-y-0.5
    active:translate-y-0 active:shadow-md
    relative overflow-hidden
  `;

  const widthClasses = fullWidth ? 'w-full' : '';
  
  const buttonClasses = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    widthClasses,
    (loading || disabled) && 'pointer-events-none',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  // Filter out props that shouldn't be passed to DOM
  const { isLoading, loadingText: _, ...domProps } = props;

  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled}
      {...domProps}
    >
      {/* Loading overlay effect */}
      {loading && (
        <div className="absolute inset-0 bg-white/20 animate-pulse" />
      )}
      
      {/* Content */}
      {loading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;