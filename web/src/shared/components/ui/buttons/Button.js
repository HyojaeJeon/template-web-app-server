/**
 * Local App 테마 버튼 컴포넌트 (웹용)
 * WCAG 2.1 준수, 다크모드 지원, Local 브랜드 컬러 적용
 */
'use client';

import React, { forwardRef } from 'react';

const VietnamButton = forwardRef(({
  children,
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}, ref) => {
  // Local 테마 변형 스타일
  const variantStyles = {
    primary: `
      bg-gradient-to-r from-vietnam-mint to-vietnam-green
      hover:from-vietnam-green hover:to-vietnam-mint
      text-white shadow-lg hover:shadow-xl
      border border-vietnam-mint/20
      focus:ring-4 focus:ring-vietnam-mint/20
    `,
    secondary: `
      bg-white border-2 border-vietnam-mint
      text-vietnam-mint hover:bg-vietnam-mint hover:text-white
      transition-all duration-300
      focus:ring-4 focus:ring-vietnam-mint/20
    `,
    success: `
      bg-gradient-to-r from-vietnam-green to-green-500
      hover:from-green-500 hover:to-vietnam-green
      text-white shadow-lg hover:shadow-xl
      focus:ring-4 focus:ring-vietnam-green/20
    `,
    outline: `
      bg-transparent border-2 border-vietnam-green
      text-vietnam-green hover:bg-vietnam-green hover:text-white
      transition-all duration-300
      focus:ring-4 focus:ring-vietnam-green/20
    `,
    ghost: `
      bg-transparent text-vietnam-mint
      hover:bg-vietnam-mint/10 
      border border-vietnam-mint/30
      focus:ring-4 focus:ring-vietnam-mint/20
    `,
    error: `
      bg-gradient-to-r from-vietnam-error to-red-600
      hover:from-red-600 hover:to-vietnam-error
      text-white shadow-lg
      focus:ring-4 focus:ring-red-500/20
    `,
    warning: `
      bg-gradient-to-r from-vietnam-warning to-yellow-500
      hover:from-yellow-500 hover:to-vietnam-warning
      text-gray-800 shadow-lg
      focus:ring-4 focus:ring-yellow-500/20
    `,
    fab: `
      w-14 h-14 rounded-full bg-gradient-to-r from-vietnam-green to-vietnam-green-light
      text-white shadow-xl hover:shadow-2xl
      focus:ring-4 focus:ring-vietnam-green/20
    `
  };

  // 크기 스타일
  const sizeStyles = {
    xs: 'px-3 py-1.5 text-xs font-medium rounded-md',
    sm: 'px-4 py-2 text-sm font-medium rounded-lg',
    md: 'px-6 py-2.5 text-base font-semibold rounded-lg',
    lg: 'px-8 py-3 text-lg font-semibold rounded-xl',
    xl: 'px-10 py-4 text-xl font-bold rounded-2xl'
  };

  // 상태 스타일
  const stateStyles = disabled || loading ? `
    opacity-50 cursor-not-allowed pointer-events-none
  ` : `
    cursor-pointer hover:-translate-y-0.5 active:translate-y-0
    transform transition-all duration-200 ease-out
  `;

  // 전체 너비 스타일
  const widthStyle = fullWidth ? 'w-full' : '';

  // FAB 특별 처리
  const isFab = variant === 'fab';
  const finalSizeStyle = isFab ? '' : (sizeStyles[size] || sizeStyles.md);

  // 조합된 클래스명
  const combinedClassName = `
    inline-flex items-center justify-center gap-2
    font-semibold focus:outline-none
    ${variantStyles[variant] || variantStyles.primary}
    ${finalSizeStyle}
    ${stateStyles}
    ${widthStyle}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // 로딩 스피너
  const LoadingSpinner = () => (
    <svg 
      className="animate-spin h-4 w-4" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
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
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // 아이콘 렌더링
  const renderIcon = () => {
    if (loading) return <LoadingSpinner />;
    if (!icon) return null;
    
    if (typeof icon === 'string') {
      return <span className="text-lg">{icon}</span>;
    }
    
    return icon;
  };

  const iconElement = renderIcon();
  const displayText = children || title;

  return (
    <button
      ref={ref}
      type={type}
      className={combinedClassName}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {iconElement && iconPosition === 'left' && iconElement}
      {displayText && (
        <span className={loading ? 'opacity-70' : ''}>
          {displayText}
        </span>
      )}
      {iconElement && iconPosition === 'right' && iconElement}
      {isFab && !displayText && iconElement}
    </button>
  );
});

VietnamButton.displayName = 'VietnamButton';

export default VietnamButton;