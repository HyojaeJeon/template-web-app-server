'use client';

/**
 * IconButton Component v3.0 - 모바일 최적화 버전
 * 현대적이고 세련된 아이콘 버튼 - WCAG 2.1 준수
 * Local App 디자인 시스템
 * 
 * 모바일 최적화 특징:
 * - 44px 최소 터치 타겟 보장
 * - 배터리 효율적 애니메이션
 * - 정보 밀도 극대화 레이아웃
 */

import React, { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';
import * as HeroIcons from '@heroicons/react/24/outline';
import { MOBILE_COMPONENT_VARIANTS, MOBILE_ANIMATIONS } from '../designTokens';

const IconButton = forwardRef(({
  icon,
  label,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ariaLabel,
  tooltip,
  badge,
  ...props
}, ref) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 모바일 최적화 크기별 클래스 (44px 최소 터치 타겟)
  const sizeClasses = {
    xs: 'w-10 h-10 text-xs min-w-[40px] min-h-[40px]',  // 40px (작은 화면용)
    sm: 'w-11 h-11 text-sm min-w-[44px] min-h-[44px]',  // 44px (표준 터치)
    md: 'w-12 h-12 text-base min-w-[48px] min-h-[48px]', // 48px
    lg: 'w-14 h-14 text-lg min-w-[52px] min-h-[52px]',   // 52px
    xl: 'w-16 h-16 text-xl min-w-[56px] min-h-[56px]'    // 56px
  };

  // 모바일 최적화 아이콘 크기
  const iconSizeClasses = {
    xs: 'w-4 h-4',     // 16px
    sm: 'w-4 h-4',     // 16px
    md: 'w-5 h-5',     // 20px
    lg: 'w-5 h-5',     // 20px
    xl: 'w-6 h-6'      // 24px
  };

  // 미세한 그라데이션을 사용한 현대적 변형별 클래스 (다크모드 포함)
  const variantClasses = {
    default: `
      bg-white dark:bg-gray-700
      border-2 border-gray-200/80 dark:border-gray-600/60
      text-gray-600 dark:text-gray-300
      hover:border-[#2AC1BC]/50 dark:hover:border-[#2AC1BC]/40
      hover:shadow-lg dark:hover:shadow-[#2AC1BC]/20
      hover:bg-gray-50/50 dark:hover:bg-gray-600/50
      hover:brightness-105 dark:hover:brightness-110
      active:bg-gray-100/70 dark:active:bg-gray-600/70
      active:brightness-95 dark:active:brightness-90
      shadow-sm hover:shadow-[#2AC1BC]/10 dark:hover:shadow-[#2AC1BC]/15
    `,
    primary: `
      bg-gradient-to-br from-[#2AC1BC]/95 via-[#2AC1BC] to-[#26a5a0]/95
      dark:from-[#2AC1BC]/80 dark:via-[#2AC1BC]/75 dark:to-[#26a5a0]/70
      text-white border-2 border-[#2AC1BC]/20 dark:border-[#2AC1BC]/30
      hover:shadow-lg hover:shadow-[#2AC1BC]/25 dark:hover:shadow-[#2AC1BC]/35
      hover:brightness-110 dark:hover:brightness-120
      active:shadow-md active:brightness-95 dark:active:brightness-85
      before:absolute before:inset-0 before:rounded-full
      before:bg-gradient-to-br before:from-white/15 dark:before:from-white/10
      before:to-transparent
      before:opacity-0 hover:before:opacity-100 before:transition-opacity
    `,
    secondary: `
      bg-gradient-to-br from-[#00B14F]/95 via-[#00B14F] to-[#00a047]/95
      dark:from-[#00B14F]/80 dark:via-[#00B14F]/75 dark:to-[#00a047]/70
      text-white border-2 border-[#00B14F]/20 dark:border-[#00B14F]/30
      hover:shadow-lg hover:shadow-[#00B14F]/25 dark:hover:shadow-[#00B14F]/35
      hover:brightness-110 dark:hover:brightness-120
      active:shadow-md active:brightness-95 dark:active:brightness-85
    `,
    ghost: `
      bg-transparent border-2 border-transparent
      text-gray-600 dark:text-gray-300
      hover:bg-[#2AC1BC]/8 dark:hover:bg-[#2AC1BC]/15
      hover:text-[#2AC1BC] dark:hover:text-[#2AC1BC]/90
      hover:brightness-110 dark:hover:brightness-120
      active:bg-[#2AC1BC]/12 dark:active:bg-[#2AC1BC]/20
      active:brightness-95 dark:active:brightness-90
    `,
    danger: `
      bg-gradient-to-br from-red-500/95 via-red-500 to-red-600/95
      dark:from-red-600/80 dark:via-red-600/75 dark:to-red-700/70
      text-white border-2 border-red-500/20 dark:border-red-600/30
      hover:shadow-lg hover:shadow-red-500/25 dark:hover:shadow-red-600/35
      hover:brightness-110 dark:hover:brightness-120
      active:shadow-md active:brightness-95 dark:active:brightness-85
    `
  };

  // 현대적인 베이스 클래스 (scale 효과 제거)
  const baseClasses = `
    relative inline-flex flex-nowrap items-center justify-center overflow-hidden
    rounded-full font-medium
    ${MOBILE_ANIMATIONS.normal}
    focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2AC1BC]/20
    disabled:opacity-50 disabled:cursor-not-allowed
    ${isPressed ? 'brightness-95' : ''}
    ${MOBILE_ANIMATIONS.touch}
  `;

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={ariaLabel || label}
      aria-busy={loading}
      aria-disabled={disabled}
      title={tooltip}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsPressed(false);
        setIsHovered(false);
      }}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {/* 로딩 스피너 - 현대적 디자인 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full">
          <HeroIcons.ArrowPathIcon 
            className={`animate-spin ${iconSizeClasses[size]} text-primary`}
            aria-hidden="true"
          />
        </div>
      )}

      {/* 아이콘 - HeroIcons 지원 */}
      <span className={`${loading ? 'invisible' : ''}`}>
        {React.isValidElement(icon) ? 
          React.cloneElement(icon, {
            className: `${iconSizeClasses[size]}`,
            'aria-hidden': true
          }) : 
          typeof icon === 'string' ? 
            <span className="font-semibold">{icon}</span> :
            icon
        }
      </span>

      {/* 현대적 배지 디자인 */}
      {badge && (
        <span 
          className="
            absolute -top-1 -right-1 z-10
            min-w-[18px] h-[18px] 
            flex items-center justify-center
            bg-gradient-to-br from-red-500 to-red-600
            text-white text-xs font-bold 
            rounded-full px-1 border-2 border-white
            shadow-lg
            animate-pulse
          "
        >
          {badge}
        </span>
      )}
    </button>
  );
});

IconButton.displayName = 'IconButton';

IconButton.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'primary', 'secondary', 'ghost', 'danger']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
  tooltip: PropTypes.string,
  badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default IconButton;