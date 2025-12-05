/**
 * Local App 테마 EmptyState 컴포넌트
 * WCAG 2.1 준수, 다크모드 지원, 장바구니 EmptyState 패턴과 완전히 동일하게 구현
 */
'use client';

import React from 'react';
import {
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  BellIcon,
  BuildingStorefrontIcon,
  InboxIcon
} from '@heroicons/react/24/outline';
import Button from '../buttons/Button';

const VietnamEmptyState = ({
  title,
  subtitle,
  image,
  illustration,
  variant = 'cart', // cart, search, orders, favorites, notifications, stores
  actionText,
  onActionPress,
  secondaryActionText,
  onSecondaryActionPress,
  size = 'medium', // small, medium, large
  className = '',
  style,
  testID,
  accessibilityLabel,
  children,
  ...props
}) => {
  const getDefaultContent = () => {
    switch (variant) {
      case 'cart':
        return {
          title: '장바구니가 비어있습니다',
          subtitle: '맛있는 음식을 주문해보세요!\n다양한 Local 요리가 기다리고 있어요.',
          illustration: ShoppingCartIcon,
          actionText: '음식 주문하기',
        };
      case 'search':
        return {
          title: '검색 결과가 없습니다',
          subtitle: '다른 검색어로 시도해보거나\n새로운 맛집을 발견해보세요.',
          illustration: MagnifyingGlassIcon,
          actionText: '다른 검색하기',
        };
      case 'orders':
        return {
          title: '주문 내역이 없습니다',
          subtitle: '첫 주문을 시작해보세요!\n신선한 Local 요리를 경험해보세요.',
          illustration: ClipboardDocumentListIcon,
          actionText: '주문하기',
        };
      case 'favorites':
        return {
          title: '즐겨찾기가 비어있습니다',
          subtitle: '좋아하는 음식점을 즐겨찾기에\n추가해보세요.',
          illustration: HeartIcon,
          actionText: '맛집 찾아보기',
        };
      case 'notifications':
        return {
          title: '알림이 없습니다',
          subtitle: '새로운 알림이 오면\n여기에서 확인하실 수 있습니다.',
          illustration: BellIcon,
          actionText: '설정하기',
        };
      case 'stores':
        return {
          title: '음식점이 없습니다',
          subtitle: '현재 지역에 배달 가능한\n음식점이 없습니다.',
          illustration: BuildingStorefrontIcon,
          actionText: '지역 변경하기',
        };
      default:
        return {
          title: '내용이 없습니다',
          subtitle: '새로운 항목을 추가해보세요.',
          illustration: InboxIcon,
          actionText: '시작하기',
        };
    }
  };

  const defaultContent = getDefaultContent();
  const finalTitle = title || defaultContent.title;
  const finalSubtitle = subtitle || defaultContent.subtitle;
  const finalActionText = actionText || defaultContent.actionText;
  const finalIllustration = illustration || defaultContent.illustration;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: 'py-8 px-4',
          illustration: 'text-4xl mb-4',
          title: 'text-lg font-bold',
          subtitle: 'text-sm',
          spacing: 'space-y-3',
        };
      case 'large':
        return {
          container: 'py-16 px-6',
          illustration: 'text-8xl mb-8',
          title: 'text-2xl font-bold',
          subtitle: 'text-lg',
          spacing: 'space-y-6',
        };
      case 'medium':
      default:
        return {
          container: 'py-12 px-6',
          illustration: 'text-6xl mb-6',
          title: 'text-xl font-bold',
          subtitle: 'text-base',
          spacing: 'space-y-4',
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const renderIllustration = () => {
    if (image) {
      return (
        <img 
          src={typeof image === 'string' ? image : image.uri}
          alt={`${finalTitle} 이미지`}
          className={`w-32 h-32 ${sizeStyles.spacing.includes('space-y-6') ? 'mb-8' : sizeStyles.spacing.includes('space-y-4') ? 'mb-6' : 'mb-4'} object-contain`}
        />
      );
    }

    if (finalIllustration) {
      // Heroicons 컴포넌트인지 확인
      if (typeof finalIllustration === 'function' || (finalIllustration && finalIllustration.$$typeof)) {
        const IconComponent = finalIllustration;
        const iconSize = size === 'small' ? 'w-16 h-16' : size === 'large' ? 'w-32 h-32' : 'w-24 h-24';
        const marginBottom = sizeStyles.spacing.includes('space-y-6') ? 'mb-8' : sizeStyles.spacing.includes('space-y-4') ? 'mb-6' : 'mb-4';
        
        return (
          <div className={`${marginBottom} text-center`}>
            <IconComponent 
              className={`${iconSize} mx-auto text-gray-400 dark:text-gray-500`} 
              strokeWidth={1}
            />
          </div>
        );
      }
      
      // 문자열 이모지나 기타 컨텐츠
      return (
        <div className={`${sizeStyles.illustration} text-center`}>
          {finalIllustration}
        </div>
      );
    }

    return null;
  };

  const renderActions = () => {
    if (!finalActionText && !secondaryActionText && !children) return null;

    return (
      <div className={`${sizeStyles.spacing.includes('space-y-6') ? 'mt-8' : sizeStyles.spacing.includes('space-y-4') ? 'mt-6' : 'mt-4'} ${sizeStyles.spacing}`}>
        {finalActionText && onActionPress && (
          <Button
            onClick={onActionPress}
            variant="primary"
            size={size === 'small' ? 'sm' : 'md'}
            className="mx-auto"
          >
            {finalActionText}
          </Button>
        )}

        {secondaryActionText && onSecondaryActionPress && (
          <Button
            onClick={onSecondaryActionPress}
            variant="secondary"
            size={size === 'small' ? 'sm' : 'md'}
            className="mx-auto"
          >
            {secondaryActionText}
          </Button>
        )}
        
        {children}
      </div>
    );
  };

  return (
    <div
      className={`${sizeStyles.container} ${sizeStyles.spacing} items-center justify-center text-center bg-transparent ${className}`}
      style={style}
      data-testid={testID}
      aria-label={accessibilityLabel || `${finalTitle}. ${finalSubtitle}`}
      role="status"
      {...props}
    >
      {renderIllustration()}
      
      <div className="items-center max-w-sm">
        <h2 className={`${sizeStyles.title} text-gray-900 dark:text-white text-center mb-2`}>
          {finalTitle}
        </h2>
        
        <p className={`${sizeStyles.subtitle} text-gray-600 dark:text-gray-300 text-center leading-relaxed`}>
          {finalSubtitle}
        </p>
      </div>
      
      {renderActions()}
    </div>
  );
};

export default VietnamEmptyState;