/**
 * PrimaryButton 컴포넌트 - Local App 디자인 시스템 v3.0
 * 모바일 최적화 버전: 정보 밀도 극대화, WCAG 2.1 준수
 * 
 * 모바일 최적화 특징:
 * - 30% 작은 패딩으로 공간 절약
 * - 터치 접근성 보장 (최소 44px 높이)
 * - 반응형 타이포그래피 (13px 모바일 기준)
 * - 배터리 효율적 애니메이션
 */

'use client';

import React from 'react';
import PropTypes from 'prop-types';
import * as HeroIcons from '@heroicons/react/24/outline';
import { MOBILE_COMPONENT_VARIANTS, MOBILE_TYPOGRAPHY, MOBILE_HEIGHTS, MOBILE_ANIMATIONS } from '../designTokens';

const PrimaryButton = ({ 
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
  compact = false,
  iconOnly = false,
  ...props
}) => {
  // 모바일 최적화 사이즈 시스템 (30% 더 컴팩트)
  const sizeClasses = {
    xs: compact ? MOBILE_COMPONENT_VARIANTS.button.compact.xs : 
        iconOnly ? MOBILE_COMPONENT_VARIANTS.button.iconOnly.xs :
        'px-3 py-2.5 text-xs min-h-[40px] gap-1.5 tracking-wide',
    sm: compact ? MOBILE_COMPONENT_VARIANTS.button.compact.sm :
        iconOnly ? MOBILE_COMPONENT_VARIANTS.button.iconOnly.sm :
        'px-4 py-3 text-sm min-h-[44px] gap-2 tracking-wide',
    md: compact ? MOBILE_COMPONENT_VARIANTS.button.compact.md :
        iconOnly ? MOBILE_COMPONENT_VARIANTS.button.iconOnly.md :
        'px-5 py-3.5 text-sm min-h-[48px] gap-2.5 tracking-wide md:px-6 md:py-4 md:text-base',
    lg: 'px-6 py-4 text-base min-h-[52px] gap-3 tracking-wide md:px-8 md:py-5 md:text-lg',
    xl: 'px-8 py-5 text-lg min-h-[56px] gap-3.5 tracking-wider md:px-10 md:py-6 md:text-xl'
  };

  // 모바일 최적화 버튼 디자인 (배터리 효율적 애니메이션 + 다크모드)
  const baseClasses = `
    group relative inline-flex flex-nowrap items-center justify-center overflow-hidden whitespace-nowrap
    font-semibold rounded-2xl border border-white/30 dark:border-white/20
    ${MOBILE_ANIMATIONS.normal}
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2AC1BC]/50 dark:focus-visible:ring-[#2AC1BC]/60 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900
    disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-75 dark:disabled:saturate-60
    ${MOBILE_ANIMATIONS.touch}

    bg-gradient-to-br from-[#2AC1BC] via-[#00B14F] to-[#26a5a0]
    dark:from-[#2AC1BC]/90 dark:via-[#00B14F]/85 dark:to-[#26a5a0]/80
    text-white shadow shadow-[#2AC1BC]/20 dark:shadow-[#2AC1BC]/30

    hover:shadow-xl hover:shadow-[#2AC1BC]/30 dark:hover:shadow-[#2AC1BC]/40
    active:shadow-md dark:active:shadow-[#2AC1BC]/20

    before:absolute before:inset-0 before:rounded-2xl
    before:bg-gradient-to-br before:from-white/20 before:via-transparent before:to-white/5
    dark:before:from-white/10 dark:before:via-transparent dark:before:to-white/0
    before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
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

  // 모바일 최적화 아이콘 크기 (정보 밀도 향상)
  const iconSizeClasses = {
    xs: 'w-3 h-3',     // 12px
    sm: 'w-3.5 h-3.5', // 14px 
    md: 'w-4 h-4',     // 16px
    lg: 'w-4 h-4',     // 16px (모바일에서 일관성)
    xl: 'w-5 h-5'      // 20px
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
      {/* 모바일 최적화 로딩 스피너 */}
      {loading && (
        <HeroIcons.ArrowPathIcon 
          className={`animate-spin ${iconSizeClasses[size]} text-white/95`}
          aria-hidden="true"
        />
      )}
      
      {/* 왼쪽 아이콘 */}
      {!loading && leftIcon && React.cloneElement(leftIcon, {
        className: `${iconSizeClasses[size]} text-white/95 flex-shrink-0`,
        'aria-hidden': true
      })}
      
      {/* 버튼 텍스트 (모바일 최적화 - 줄바꿈 방지) */}
      {!iconOnly && (
        <span className="relative font-semibold leading-tight truncate flex-shrink-0 whitespace-nowrap inline-flex items-center">
          {children}
        </span>
      )}
      
      {/* 오른쪽 아이콘 */}
      {!loading && rightIcon && React.cloneElement(rightIcon, {
        className: `${iconSizeClasses[size]} text-white/95 flex-shrink-0`,
        'aria-hidden': true
      })}
    </button>
  );
};

PrimaryButton.propTypes = {
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
  compact: PropTypes.bool,
  iconOnly: PropTypes.bool
};

export default PrimaryButton;