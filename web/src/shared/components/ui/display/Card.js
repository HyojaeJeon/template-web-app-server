/**
 * Local App 테마 카드 컴포넌트
 * WCAG 2.1 준수, 다크모드 지원, Local 브랜드 컬러 적용
 */
'use client';

import React from 'react';

const VietnamCard = ({
  children,
  variant = 'default', // default, store, promotion, premium, order, menu-item
  onClick,
  disabled = false,
  className = '',
  style,
  title,
  subtitle,
  image,
  badge,
  overlayContent,
  accessibilityLabel,
  accessibilityHint,
  testID,
  ...props
}) => {
  const getVariantStyles = () => {
    const baseStyles = 'bg-white rounded-2xl shadow-sm transition-all duration-300';
    const darkMode = 'dark:bg-gray-800 dark:shadow-lg';
    const hoverStyles = onClick ? 'hover:shadow-md cursor-pointer active:shadow-sm transition-shadow duration-200' : '';
    
    switch (variant) {
      case 'store':
        return `${baseStyles} ${hoverStyles} overflow-hidden border-l-4 border-vietnam-mint shadow-lg shadow-gray-100/50 ${darkMode} dark:border-vietnam-mint dark:shadow-gray-900/20`;
      
      case 'promotion':
        return `${baseStyles} ${hoverStyles} bg-gradient-to-br from-vietnam-mint-pale to-white border border-vietnam-mint/20 shadow-lg shadow-vietnam-mint/10 ${darkMode} dark:from-vietnam-mint-dark/20 dark:to-gray-800 dark:border-vietnam-mint/30`;
      
      case 'premium':
        return `${baseStyles} ${hoverStyles} bg-gradient-to-br from-white to-vietnam-mint-pale border-2 border-vietnam-mint/30 shadow-xl shadow-vietnam-mint/15 relative overflow-hidden ${darkMode} dark:from-gray-800 dark:to-vietnam-mint-dark/20`;
      
      case 'order':
        return `${baseStyles} ${hoverStyles} border-l-4 border-vietnam-green shadow-md ${darkMode} dark:border-vietnam-green`;
      
      case 'menu-item':
        return `${baseStyles} ${hoverStyles} overflow-hidden shadow-md hover:shadow-lg ${darkMode}`;
      
      case 'weather':
        return `${baseStyles} ${hoverStyles} bg-gradient-to-br from-blue-50 to-white shadow-lg shadow-blue-100/50 ${darkMode} dark:from-blue-900/20 dark:to-gray-800`;
      
      default:
        return `${baseStyles} ${hoverStyles} ${darkMode}`;
    }
  };

  const renderPremiumBadge = () => {
    if (variant === 'premium') {
      return (
        <div className="absolute -top-1 -right-8 bg-gradient-to-r from-vietnam-mint to-vietnam-green px-10 py-1 rotate-45 transform">
          <span className="text-white text-xs font-bold tracking-wider">PREMIUM</span>
        </div>
      );
    }
    return null;
  };

  const renderBadge = () => {
    if (!badge) return null;
    
    return (
      <div className="absolute top-3 right-3 z-10">
        {typeof badge === 'string' ? (
          <div className="bg-vietnam-green rounded-full px-3 py-1 shadow-lg shadow-vietnam-green/20">
            <span className="text-white text-xs font-semibold">{badge}</span>
          </div>
        ) : (
          badge
        )}
      </div>
    );
  };

  const renderImage = () => {
    if (!image) return null;
    
    return (
      <div className="relative">
        <img 
          src={typeof image === 'string' ? image : image.uri}
          alt={`${title} 이미지`}
          className="w-full h-48 rounded-t-2xl object-cover"
        />
        {/* 이미지 오버레이 그라데이션 */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent rounded-t-2xl" />
        {overlayContent && (
          <div className="absolute bottom-4 left-4 right-4">
            {overlayContent}
          </div>
        )}
      </div>
    );
  };

  const renderHeader = () => {
    if (!title && !subtitle) return null;
    
    return (
      <div className={`${image ? 'p-4' : 'p-4 pb-0'}`}>
        {title && (
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {subtitle}
          </p>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (children) {
      return (
        <div className={`${title || subtitle ? 'px-4 pb-4' : 'p-4'}`}>
          {children}
        </div>
      );
    }
    return null;
  };

  const getAccessibilityProps = () => ({
    'aria-label': accessibilityLabel || title || '카드',
    'aria-describedby': accessibilityHint || (onClick ? '탭하여 자세히 보기' : undefined),
    role: onClick ? 'button' : 'article',
    'aria-disabled': disabled,
    tabIndex: onClick && !disabled ? 0 : undefined,
    onKeyDown: onClick && !disabled ? (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(e);
      }
    } : undefined
  });

  const CardContent = () => (
    <div className={`${getVariantStyles()} ${className}`} style={style}>
      {renderPremiumBadge()}
      {renderBadge()}
      {renderImage()}
      {renderHeader()}
      {renderContent()}
    </div>
  );

  if (onClick && !disabled) {
    return (
      <div
        onClick={onClick}
        data-testid={testID}
        {...getAccessibilityProps()}
        {...props}
      >
        <CardContent />
      </div>
    );
  }

  return (
    <div
      data-testid={testID}
      {...getAccessibilityProps()}
      {...props}
    >
      <CardContent />
    </div>
  );
};

export default VietnamCard;