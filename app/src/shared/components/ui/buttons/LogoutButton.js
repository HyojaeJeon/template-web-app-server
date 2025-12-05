/**
 * LogoutButton Component
 * 로그아웃 버튼 재사용 컴포넌트 - Local 배달 앱 특화
 * CLAUDE.md 가이드라인 준수: SOLID 원칙, DRY, WCAG 2.1
 */
import React, { memo, useCallback } from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { useToast } from '@providers/ToastProvider';

/**
 * LogoutButton Component
 *
 * Single Responsibility: 로그아웃 기능만 담당
 * Open/Closed: 새로운 로그아웃 방식이나 스타일 추가 시 수정 없이 확장 가능
 */
const LogoutButton = memo(({
  onLogout = () => {},
  variant = 'default', // 'default', 'outline', 'text'
  size = 'medium', // 'small', 'medium', 'large'
  showIcon = true,
  showConfirm = true,
  isLoading = false,
  className = '',
  customTitle = null,
  customMessage = null,
  destructive = true}) => {
  const { t } = useTranslation(['profile', 'common']);
  const dispatch = useDispatch();
  const { showToast } = useToast();

  // 로그아웃 확인 처리
  const handleLogoutPress = useCallback(() => {
    if (isLoading) {return;}

    if (!showConfirm) {
      onLogout();
      return;
    }

    if (window.confirm && window.confirm(customMessage || t('profile:logout.message'))) {
      try {
        onLogout();
        showToast('profile:logout.success', { type: 'success' });
      } catch (error) {
        console.error('로그아웃 처리 중 오류:', error);
        showToast('OPERATION_FAILED', { type: 'error' });
      }
    } else {
      // React Native에서는 Alert 사용
      Alert.alert(
        customTitle || t('profile:logout.title'),
        customMessage || t('profile:logout.message'),
        [
          {
            text: t('common:actions.cancel'),
            style: 'cancel'
          },
          {
            text: t('profile:logout.confirm'),
            style: destructive ? 'destructive' : 'default',
            onPress: () => {
              try {
                onLogout();
                showToast('profile:logout.success', { type: 'success' });
              } catch (error) {
                console.error('로그아웃 처리 중 오류:', error);
                showToast('OPERATION_FAILED', { type: 'error' });
              }
            }
          }
        ]
      );
    }
  }, [isLoading, showConfirm, onLogout, customTitle, customMessage, t, destructive]);

  // 스타일 결정
  const getButtonStyles = useCallback(() => {
    const baseStyles = 'flex-row items-center justify-center rounded-lg';

    // 크기별 스타일
    const sizeStyles = {
      small: 'px-3 py-2 min-h-[36px]',
      medium: 'px-4 py-3 min-h-[44px]',
      large: 'px-6 py-4 min-h-[52px]'};

    // 변형별 스타일
    const variantStyles = {
      default: 'bg-red-500 active:bg-red-600',
      outline: 'border-2 border-red-500 bg-transparent active:bg-red-50',
      text: 'bg-transparent active:bg-red-50'};

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`;
  }, [size, variant]);

  const getTextStyles = useCallback(() => {
    const baseStyles = 'font-medium';

    // 크기별 텍스트 스타일
    const sizeStyles = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg'};

    // 변형별 텍스트 색상
    const variantStyles = {
      default: 'text-white',
      outline: 'text-red-500',
      text: 'text-red-500'};

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`;
  }, [size, variant]);

  const getIconSize = useCallback(() => {
    const sizes = {
      small: 16,
      medium: 18,
      large: 20};
    return sizes[size];
  }, [size]);

  const getIconColor = useCallback(() => {
    const colors = {
      default: 'white',
      outline: '#EF4444', // red-500
      text: '#EF4444', // red-500
    };
    return colors[variant];
  }, [variant]);

  return (
    <TouchableOpacity
      onPress={handleLogoutPress}
      disabled={isLoading}
      className={`${getButtonStyles()} ${className} ${isLoading ? 'opacity-50' : ''}`}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={t('profile:logout.title')}
      accessibilityHint={t('profile:logout.message')}
    >
      {showIcon && (
        <MaterialCommunityIcons
          name={isLoading ? 'loading' : 'logout'}
          size={getIconSize()}
          color={getIconColor()}
          style={{
            marginRight: 8,
            ...(isLoading && { transform: [{ rotate: '360deg' }] })}}
        />
      )}

      <Text className={getTextStyles()}>
        {isLoading
          ? t('common:actions.processing')
          : t('profile:logout.title')
        }
      </Text>
    </TouchableOpacity>
  );
});

LogoutButton.displayName = 'LogoutButton';

export default LogoutButton;
