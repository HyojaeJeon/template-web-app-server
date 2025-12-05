/**
 * SecondaryButton 컴포넌트 - 모바일 최적화 v3.0
 * Local App 디자인 시스템, WCAG 2.1 준수
 * 
 * 모바일 최적화 특징:
 * - 30% 작은 패딩으로 공간 절약
 * - 터치 접근성 44px 최소 높이 보장  
 * - 배터리 효율적 애니메이션
 * - 정보 밀도 극대화 레이아웃
 */

'use client';

import React from 'react';
import PropTypes from 'prop-types';
import * as HeroIcons from '@heroicons/react/24/outline';
import { MOBILE_COMPONENT_VARIANTS, MOBILE_ANIMATIONS, MOBILE_HEIGHTS } from '../designTokens';

const SecondaryButton = ({ 
  children,
  onClick,
  disabled = false,
  loading = false,
  size = 'md',
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  type = 'button',
  ariaLabel,
  className = '',
  variant = 'outline', // 'outline', 'ghost', 'filled'
  compact = false,
  iconOnly = false,
  ...props
}) => {
  // 모바일 최적화 사이즈 시스템 (30% 더 컴팩트)
  const sizeClasses = {
    xs: compact ? MOBILE_COMPONENT_VARIANTS.button.compact.xs : 
        iconOnly ? MOBILE_COMPONENT_VARIANTS.button.iconOnly.xs :
        'px-3 py-2 text-xs min-h-[36px] gap-1.5',
    sm: compact ? MOBILE_COMPONENT_VARIANTS.button.compact.sm :
        iconOnly ? MOBILE_COMPONENT_VARIANTS.button.iconOnly.sm :
        'px-3.5 py-2.5 text-sm min-h-[40px] gap-2',
    md: compact ? MOBILE_COMPONENT_VARIANTS.button.compact.md :
        iconOnly ? MOBILE_COMPONENT_VARIANTS.button.iconOnly.md :
        'px-4 py-2.5 text-sm min-h-[44px] gap-2 md:px-5 md:py-3 md:text-base',
    lg: 'px-5 py-3 text-base min-h-[48px] gap-2.5 md:px-6 md:py-4 md:text-lg',
    xl: 'px-6 py-4 text-lg min-h-[52px] gap-3 md:px-8 md:py-5 md:text-xl'
  };

  // 모바일 최적화 변형별 스타일 (배터리 효율적 + 다크모드)
  const variantClasses = {
    outline: `
      border border-[#2AC1BC]/60 dark:border-[#2AC1BC]/40
      bg-white/95 dark:bg-gray-800/95
      text-[#2AC1BC] dark:text-[#2AC1BC]/90
      shadow-md shadow-[#2AC1BC]/10 dark:shadow-[#2AC1BC]/20
      hover:border-[#2AC1BC] dark:hover:border-[#2AC1BC]/60
      hover:bg-[#2AC1BC]/5 dark:hover:bg-[#2AC1BC]/10
      hover:text-[#00B14F] dark:hover:text-[#2AC1BC]
      hover:shadow hover:shadow-[#2AC1BC]/20 dark:hover:shadow-[#2AC1BC]/30
      active:bg-[#2AC1BC]/10 dark:active:bg-[#2AC1BC]/15 active:shadow-sm
    `,
    ghost: `
      border border-transparent bg-transparent
      text-[#2AC1BC] dark:text-[#2AC1BC]/80
      hover:bg-[#2AC1BC]/8 dark:hover:bg-[#2AC1BC]/15
      hover:text-[#00B14F] dark:hover:text-[#2AC1BC]
      hover:shadow-md dark:hover:shadow-[#2AC1BC]/20
      hover:shadow-[#2AC1BC]/15
      active:bg-[#2AC1BC]/12 dark:active:bg-[#2AC1BC]/20
    `,
    filled: `
      bg-gradient-to-br from-[#2AC1BC]/20 to-[#00B14F]/15
      dark:from-[#2AC1BC]/15 dark:to-[#00B14F]/10
      border border-[#2AC1BC]/40 dark:border-[#2AC1BC]/30
      text-[#00B14F] dark:text-[#2AC1BC]/80
      shadow-md shadow-[#2AC1BC]/15 dark:shadow-[#2AC1BC]/25
      hover:bg-gradient-to-br hover:from-[#2AC1BC]/30 dark:hover:from-[#2AC1BC]/25
      hover:to-[#00B14F]/25 dark:hover:to-[#00B14F]/20
      hover:border-[#2AC1BC]/60 dark:hover:border-[#2AC1BC]/50
      hover:shadow hover:shadow-[#2AC1BC]/25 dark:hover:shadow-[#2AC1BC]/35
      active:bg-gradient-to-br active:from-[#2AC1BC]/35 dark:active:from-[#2AC1BC]/30
      active:to-[#00B14F]/30 dark:active:to-[#00B14F]/25
    `
  };

  // 모바일 최적화 기본 클래스 (배터리 효율적 + 다크모드)
  const baseClasses = `
    group relative inline-flex flex-nowrap items-center justify-center overflow-hidden whitespace-nowrap
    font-semibold rounded-xl
    ${MOBILE_ANIMATIONS.normal}
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2AC1BC]/50 dark:focus-visible:ring-[#2AC1BC]/60 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900
    disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-75 dark:disabled:saturate-60
    ${MOBILE_ANIMATIONS.touch}
    ${variantClasses[variant]}
  `;

  const widthClasses = fullWidth ? 'w-full' : '';
  
  const buttonClasses = [
    baseClasses,
    sizeClasses[size],
    widthClasses,
    loading && 'pointer-events-none',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  // Icon size based on button size
  const iconSizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      aria-disabled={disabled}
      {...props}
    >
      {/* Loading spinner with modern design */}
      {loading && (
        <HeroIcons.ArrowPathIcon 
          className={`animate-spin ${iconSizeClasses[size]} text-current`}
          aria-hidden="true"
        />
      )}
      
      {/* Left icon */}
      {!loading && leftIcon && React.cloneElement(leftIcon, {
        className: `${iconSizeClasses[size]} text-current flex-shrink-0`,
        'aria-hidden': true
      })}
      
      {/* Button text - 줄바꿈 방지 */}
      {!iconOnly && (
        <span className="relative z-10 font-medium tracking-wide flex-shrink-0 whitespace-nowrap inline-flex items-center">
          {children}
        </span>
      )}
      
      {/* Right icon */}
      {!loading && rightIcon && React.cloneElement(rightIcon, {
        className: `${iconSizeClasses[size]} text-current flex-shrink-0`,
        'aria-hidden': true
      })}
    </button>
  );
};

SecondaryButton.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  fullWidth: PropTypes.bool,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['outline', 'ghost', 'filled']),
  compact: PropTypes.bool,
  iconOnly: PropTypes.bool
};

export default SecondaryButton;