'use client';

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

/**
 * AccessibleButton - WCAG 2.1 준수 고접근성 버튼 컴포넌트
 * 키보드 네비게이션, 스크린 리더 지원, 포커스 관리 최적화
 */
const AccessibleButton = forwardRef(({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  ariaLabel,
  ariaPressed,
  ariaExpanded,
  ariaDescribedBy,
  ariaControls,
  tabIndex = 0,
  role = 'button',
  className = '',
  ...props
}, ref) => {
  // Local 테마 색상 기반 variant 스타일
  const getVariantStyles = () => {
    const variants = {
      primary: `
        bg-gradient-to-r from-[#2ac1bc] to-[#3ec8c3] 
        text-white font-semibold
        shadow-md shadow-[#2ac1bc]/20
        hover:shadow-lg hover:shadow-[#2ac1bc]/30
        hover:-translate-y-0.5
        active:translate-y-0 active:shadow-sm
        focus-visible:ring-4 focus-visible:ring-[#2ac1bc]/20
      `,
      secondary: `
        bg-white 
        text-[#2ac1bc] font-semibold
        border-2 border-[#2ac1bc]
        shadow-sm
        hover:bg-[#e8faf9] hover:shadow-md
        active:bg-[#d0f5f3]
        focus-visible:ring-4 focus-visible:ring-[#2ac1bc]/20
      `,
      success: `
        bg-gradient-to-r from-[#00b14f] to-[#00c458]
        text-white font-semibold
        shadow-md shadow-[#00b14f]/20
        hover:shadow-lg hover:shadow-[#00b14f]/30
        hover:-translate-y-0.5
        active:translate-y-0 active:shadow-sm
        focus-visible:ring-4 focus-visible:ring-[#00b14f]/20
      `,
      danger: `
        bg-gradient-to-r from-[#DA020E] to-[#e63946]
        text-white font-semibold
        shadow-md shadow-[#DA020E]/20
        hover:shadow-lg hover:shadow-[#DA020E]/30
        hover:-translate-y-0.5
        active:translate-y-0 active:shadow-sm
        focus-visible:ring-4 focus-visible:ring-[#DA020E]/20
      `,
      ghost: `
        bg-transparent
        text-[#2ac1bc] font-medium
        hover:bg-[#2ac1bc]/5
        active:bg-[#2ac1bc]/10
        focus-visible:ring-4 focus-visible:ring-[#2ac1bc]/20
      `
    };
    return variants[variant] || variants.primary;
  };

  // 크기별 스타일
  const getSizeStyles = () => {
    const sizes = {
      xs: 'px-3 py-1.5 text-xs rounded-md',
      sm: 'px-4 py-2 text-sm rounded-lg',
      md: 'px-5 py-2.5 text-base rounded-lg',
      lg: 'px-6 py-3 text-lg rounded-xl',
      xl: 'px-8 py-4 text-xl rounded-xl'
    };
    return sizes[size] || sizes.md;
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && !loading) {
      e.preventDefault();
      onClick?.(e);
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
    }
  };

  // 비활성화 및 로딩 스타일
  const getStateStyles = () => {
    if (disabled) {
      return 'opacity-50 cursor-not-allowed pointer-events-none';
    }
    if (loading) {
      return 'opacity-75 cursor-wait pointer-events-none';
    }
    return 'cursor-pointer';
  };

  const buttonClasses = `
    inline-flex items-center justify-center
    transition-all duration-300 ease-in-out
    transform-gpu
    focus:outline-none
    ${getVariantStyles()}
    ${getSizeStyles()}
    ${getStateStyles()}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      ref={ref}
      type="button"
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      aria-describedby={ariaDescribedBy}
      aria-controls={ariaControls}
      aria-busy={loading}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : tabIndex}
      role={role}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
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
      )}
      {loading && <span className="sr-only">Loading...</span>}
      {children}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

AccessibleButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'ghost']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  ariaLabel: PropTypes.string,
  ariaPressed: PropTypes.bool,
  ariaExpanded: PropTypes.bool,
  ariaDescribedBy: PropTypes.string,
  ariaControls: PropTypes.string,
  tabIndex: PropTypes.number,
  role: PropTypes.string,
  className: PropTypes.string
};

export default AccessibleButton;