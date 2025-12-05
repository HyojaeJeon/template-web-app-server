/**
 * SaveButton Component
 * 저장 버튼 재사용 컴포넌트 - Local 배달 앱 특화
 * CLAUDE.md 가이드라인 준수: SOLID 원칙, DRY, WCAG 2.1
 */
import React, { memo, useCallback } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useToast } from '@providers/ToastProvider';

/**
 * SaveButton Component
 *
 * Single Responsibility: 저장 기능과 상태 표시만 담당
 * Open/Closed: 새로운 저장 타입이나 스타일 추가 시 수정 없이 확장 가능
 */
const SaveButton = memo(({
  onSave = () => {},
  isLoading = false,
  isSaving = false,
  disabled = false,
  hasChanges = true,
  variant = 'primary', // 'primary', 'secondary', 'outline'
  size = 'medium', // 'small', 'medium', 'large'
  showIcon = true,
  className = '',
  customLabel = null,
  preventDuplicateSave = true,
  showSuccessToast = true,
  successMessage = null,
  errorMessage = null}) => {
  const { t } = useTranslation(['common', 'profile']);
  const { showToast } = useToast();

  // 저장 처리
  const handleSave = useCallback(async () => {
    // 중복 저장 방지
    if (preventDuplicateSave && (isLoading || isSaving)) {
      return;
    }

    // 변경사항이 없는 경우
    if (!hasChanges) {
      showToast('NO_CHANGES', { type: 'info' });
      return;
    }

    try {
      await onSave();

      // 성공 토스트 표시
      if (showSuccessToast) {
        showToast(successMessage || 'SAVE_SUCCESS', { type: 'success' });
      }
    } catch (error) {
      console.error('저장 처리 중 오류:', error);

      // 에러 토스트 표시
      showToast(errorMessage || 'SAVE_ERROR', { type: 'error' });
    }
  }, [
    isLoading,
    isSaving,
    hasChanges,
    onSave,
    preventDuplicateSave,
    showSuccessToast,
    successMessage,
    errorMessage,
    t,
  ]);

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
      primary: hasChanges && !disabled ?
        'bg-primary-500 active:bg-primary-600' :
        'bg-gray-300',
      secondary: hasChanges && !disabled ?
        'bg-gray-600 active:bg-gray-700' :
        'bg-gray-300',
      outline: hasChanges && !disabled ?
        'border-2 border-primary-500 bg-transparent active:bg-primary-50' :
        'border-2 border-gray-300 bg-transparent'};

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`;
  }, [size, variant, hasChanges, disabled]);

  const getTextStyles = useCallback(() => {
    const baseStyles = 'font-semibold';

    // 크기별 텍스트 스타일
    const sizeStyles = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg'};

    // 변형별 텍스트 색상
    const getTextColor = () => {
      if (!hasChanges || disabled) {return 'text-gray-500';}

      switch (variant) {
        case 'primary':
        case 'secondary':
          return 'text-white';
        case 'outline':
          return 'text-primary-500';
        default:
          return 'text-white';
      }
    };

    return `${baseStyles} ${sizeStyles[size]} ${getTextColor()}`;
  }, [size, variant, hasChanges, disabled]);

  const getIconSize = useCallback(() => {
    const sizes = {
      small: 16,
      medium: 18,
      large: 20};
    return sizes[size];
  }, [size]);

  const getIconColor = useCallback(() => {
    if (!hasChanges || disabled) {return '#9CA3AF';} // gray-400

    switch (variant) {
      case 'primary':
      case 'secondary':
        return 'white';
      case 'outline':
        return '#2AC1BC'; // primary-500
      default:
        return 'white';
    }
  }, [variant, hasChanges, disabled]);

  // 버튼 텍스트 결정
  const getButtonText = useCallback(() => {
    if (customLabel) {return customLabel;}

    if (isSaving || isLoading) {
      return t('common:actions.saving');
    }

    if (!hasChanges) {
      return t('common:actions.saved');
    }

    return t('common:actions.save');
  }, [customLabel, isSaving, isLoading, hasChanges, t]);

  // 아이콘 결정
  const getIcon = useCallback(() => {
    if (isSaving || isLoading) {return 'loading';}
    if (!hasChanges) {return 'check';}
    return 'content-save';
  }, [isSaving, isLoading, hasChanges]);

  const isButtonDisabled = disabled || (preventDuplicateSave && (isLoading || isSaving));

  return (
    <TouchableOpacity
      onPress={handleSave}
      disabled={isButtonDisabled}
      className={`${getButtonStyles()} ${className} ${isButtonDisabled ? 'opacity-60' : ''}`}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={getButtonText()}
      accessibilityState={{
        disabled: isButtonDisabled,
        busy: isSaving || isLoading}}
    >
      {showIcon && (
        <MaterialCommunityIcons
          name={getIcon()}
          size={getIconSize()}
          color={getIconColor()}
          style={{
            marginRight: 8,
            ...(isSaving || isLoading ? { transform: [{ rotate: '360deg' }] } : {})}}
        />
      )}

      <Text className={getTextStyles()}>
        {getButtonText()}
      </Text>

      {/* 저장 진행률 표시 (옵션) */}
      {(isSaving || isLoading) && (
        <View className="absolute inset-0 rounded-lg bg-black/10 items-center justify-center">
          <View className="bg-white/20 px-2 py-1 rounded">
            <Text className="text-white text-xs font-medium">
              {t('common:actions.processing')}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
});

SaveButton.displayName = 'SaveButton';

export default SaveButton;
