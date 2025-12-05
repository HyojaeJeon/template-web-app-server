/**
 * Local App 테마 뱃지 컴포넌트
 * WCAG 2.1 준수, 다크모드 지원, Local 브랜드 컬러 적용
 */
'use client';

import React from 'react';

const VietnamBadge = ({
  children,
  text,
  variant = 'default', // default, pos-online, pos-offline, delivery, discount, premium, new, hot, warning, error
  size = 'medium', // small, medium, large
  shape = 'rounded', // rounded, pill, square
  position = null, // null, top-right, top-left, bottom-right, bottom-left
  count = null, // 숫자 카운트 표시
  pulse = false, // 펄스 애니메이션
  className = '',
  style,
  icon: Icon = null,
  accessibilityLabel,
  testID,
  ...props
}) => {
  const getVariantStyles = () => {
    const baseStyles = 'flex-row items-center justify-center';
    
    switch (variant) {
      case 'pos-online':
        return `${baseStyles} bg-gradient-to-r from-vietnam-green to-vietnam-green-light shadow-lg shadow-vietnam-green/20 dark:shadow-vietnam-green/30`;
      
      case 'pos-offline':
        return `${baseStyles} bg-gradient-to-r from-gray-400 to-gray-500 shadow-lg shadow-gray-400/20 dark:shadow-gray-400/30`;
      
      case 'delivery':
        return `${baseStyles} bg-gradient-to-r from-vietnam-mint to-vietnam-mint-light shadow-lg shadow-vietnam-mint/20 dark:shadow-vietnam-mint/30`;
      
      case 'discount':
        return `${baseStyles} bg-gradient-to-r from-vietnam-error to-red-500 shadow-lg shadow-red-500/20 dark:shadow-red-500/30`;
      
      case 'premium':
        return `${baseStyles} bg-gradient-to-r from-vietnam-mint via-vietnam-green to-vietnam-green-light shadow-lg shadow-vietnam-mint/25 dark:shadow-vietnam-mint/35`;
      
      case 'new':
        return `${baseStyles} bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-500/20 dark:shadow-purple-500/30`;
      
      case 'hot':
        return `${baseStyles} bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/20 dark:shadow-orange-500/30`;
      
      case 'warning':
        return `${baseStyles} bg-gradient-to-r from-vietnam-warning to-yellow-400 shadow-lg shadow-yellow-400/20 dark:shadow-yellow-400/30`;
      
      case 'error':
        return `${baseStyles} bg-gradient-to-r from-vietnam-error to-red-500 shadow-lg shadow-red-500/20 dark:shadow-red-500/30`;
      
      case 'outline':
        return `${baseStyles} bg-transparent border-2 border-vietnam-mint dark:border-vietnam-mint`;
      
      default:
        return `${baseStyles} bg-gray-100 dark:bg-gray-700`;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'px-2 py-1 text-xs min-h-[20px]';
      case 'large':
        return 'px-4 py-2 text-base min-h-[32px]';
      case 'medium':
      default:
        return 'px-3 py-1.5 text-sm min-h-[24px]';
    }
  };

  const getShapeStyles = () => {
    switch (shape) {
      case 'pill':
        return 'rounded-full';
      case 'square':
        return 'rounded-none';
      case 'rounded':
      default:
        return 'rounded-lg';
    }
  };

  const getPositionStyles = () => {
    if (!position) return '';
    
    const basePosition = 'absolute z-10';
    switch (position) {
      case 'top-right':
        return `${basePosition} -top-2 -right-2`;
      case 'top-left':
        return `${basePosition} -top-2 -left-2`;
      case 'bottom-right':
        return `${basePosition} -bottom-2 -right-2`;
      case 'bottom-left':
        return `${basePosition} -bottom-2 -left-2`;
      default:
        return basePosition;
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') {
      return 'text-vietnam-mint dark:text-vietnam-mint';
    }
    if (variant === 'default') {
      return 'text-gray-700 dark:text-gray-300';
    }
    return 'text-white';
  };

  const renderPulseAnimation = () => {
    if (!pulse) return null;
    
    return (
      <div className="absolute inset-0 rounded-full animate-pulse">
        <div className={`w-full h-full rounded-full ${getVariantStyles()} opacity-75`} />
      </div>
    );
  };

  const renderStatusDot = () => {
    if (variant === 'pos-online' || variant === 'pos-offline') {
      return (
        <div className={`w-2 h-2 rounded-full mr-1 ${variant === 'pos-online' ? 'bg-white animate-pulse' : 'bg-white/70'}`} />
      );
    }
    return null;
  };

  const renderContent = () => {
    if (count !== null) {
      return (
        <span className={`${getTextColor()} font-bold ${getSizeStyles().includes('text-xs') ? 'text-xs' : getSizeStyles().includes('text-base') ? 'text-base' : 'text-sm'}`}>
          {count > 99 ? '99+' : count}
        </span>
      );
    }

    return (
      <>
        {Icon && (
          <Icon 
            size={size === 'small' ? 12 : size === 'large' ? 18 : 14} 
            color={variant === 'outline' ? '#2AC1BC' : variant === 'default' ? '#374151' : 'white'}
            className={text || children ? 'mr-1' : ''}
          />
        )}
        {renderStatusDot()}
        {(text || children) && (
          <span className={`${getTextColor()} font-semibold ${getSizeStyles().includes('text-xs') ? 'text-xs' : getSizeStyles().includes('text-base') ? 'text-base' : 'text-sm'}`}>
            {children || text}
          </span>
        )}
      </>
    );
  };

  return (
    <div
      className={`${getVariantStyles()} ${getSizeStyles()} ${getShapeStyles()} ${getPositionStyles()} ${className}`}
      style={style}
      aria-label={accessibilityLabel || text || children || `${count}개의 알림`}
      role="status"
      data-testid={testID}
      {...props}
    >
      {renderPulseAnimation()}
      {renderContent()}
    </div>
  );
};

export default VietnamBadge;