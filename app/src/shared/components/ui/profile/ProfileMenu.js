/**
 * ProfileMenu Component
 * 프로필 메뉴 아이템 재사용 컴포넌트 - Local 배달 앱 특화
 * CLAUDE.md 가이드라인 준수: SOLID 원칙, DRY, WCAG 2.1
 */
import React, { memo, useCallback } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

/**
 * ProfileMenu Component
 *
 * Single Responsibility: 프로필 메뉴 아이템 표시만 담당
 * Open/Closed: 새로운 메뉴 스타일이나 상태 추가 시 수정 없이 확장 가능
 */
const ProfileMenu = memo(({
  icon = 'help-circle',
  iconColor = '#6B7280',
  iconSize = 22,
  title = '',
  titleKey = '',
  subtitle = '',
  badge = null,
  showChevron = true,
  onPress = () => {},
  disabled = false,
  isDestructive = false,
  variant = 'default', // 'default', 'highlighted', 'warning', 'destructive'
  className = ''}) => {
  const { t } = useTranslation(['profile', 'common']);

  // 제목 텍스트 결정
  const getTitle = useCallback(() => {
    if (titleKey) {
      return t(titleKey, title || titleKey);
    }
    return title;
  }, [titleKey, title, t]);

  // 터치 처리
  const handlePress = useCallback(() => {
    if (!disabled) {
      onPress();
    }
  }, [disabled, onPress]);

  // 스타일 결정
  const getContainerStyles = useCallback(() => {
    const baseStyles = 'flex-row items-center py-4 px-4 bg-white';

    const variantStyles = {
      default: 'active:bg-gray-50',
      highlighted: 'bg-blue-50 active:bg-blue-100',
      warning: 'bg-orange-50 active:bg-orange-100',
      destructive: 'active:bg-red-50'};

    const currentVariant = isDestructive ? 'destructive' : variant;

    return `${baseStyles} ${variantStyles[currentVariant]} ${disabled ? 'opacity-50' : ''}`;
  }, [variant, isDestructive, disabled]);

  const getTitleStyles = useCallback(() => {
    const baseStyles = 'text-base font-medium flex-1';

    if (isDestructive) {
      return `${baseStyles} text-red-600`;
    }

    const variantStyles = {
      default: 'text-gray-900',
      highlighted: 'text-blue-900',
      warning: 'text-orange-900',
      destructive: 'text-red-600'};

    return `${baseStyles} ${variantStyles[variant]}`;
  }, [variant, isDestructive]);

  const getSubtitleStyles = useCallback(() => {
    const baseStyles = 'text-sm mt-1';

    if (isDestructive) {
      return `${baseStyles} text-red-500`;
    }

    const variantStyles = {
      default: 'text-gray-500',
      highlighted: 'text-blue-600',
      warning: 'text-orange-600',
      destructive: 'text-red-500'};

    return `${baseStyles} ${variantStyles[variant]}`;
  }, [variant, isDestructive]);

  const getIconColor = useCallback(() => {
    if (disabled) {return '#D1D5DB';} // gray-300
    if (isDestructive) {return '#EF4444';} // red-500

    const variantColors = {
      default: iconColor,
      highlighted: '#3B82F6', // blue-500
      warning: '#F59E0B', // amber-500
      destructive: '#EF4444', // red-500
    };

    return variantColors[variant] || iconColor;
  }, [variant, isDestructive, disabled, iconColor]);

  const getChevronColor = useCallback(() => {
    if (disabled) {return '#D1D5DB';} // gray-300
    if (isDestructive) {return '#EF4444';} // red-500

    const variantColors = {
      default: '#9CA3AF', // gray-400
      highlighted: '#60A5FA', // blue-400
      warning: '#FBBF24', // amber-400
      destructive: '#F87171', // red-400
    };

    return variantColors[variant];
  }, [variant, isDestructive, disabled]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      className={`${getContainerStyles()} ${className}`}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={getTitle()}
      accessibilityHint={subtitle}
      accessibilityState={{ disabled }}
    >
      {/* 아이콘 */}
      <View className="mr-4">
        <MaterialCommunityIcons
          name={icon}
          size={iconSize}
          color={getIconColor()}
        />

        {/* 뱃지 표시 */}
        {badge && typeof badge === 'number' && badge > 0 && (
          <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full items-center justify-center">
            <Text className="text-white text-xs font-bold">
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}

        {badge && typeof badge === 'string' && (
          <View className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        )}

        {badge && typeof badge === 'boolean' && badge && (
          <View className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full" />
        )}
      </View>

      {/* 텍스트 영역 */}
      <View className="flex-1">
        <Text className={getTitleStyles()}>
          {getTitle()}
        </Text>

        {subtitle && (
          <Text className={getSubtitleStyles()}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* 우측 요소들 */}
      <View className="flex-row items-center">
        {/* 커스텀 뱃지 (텍스트) */}
        {badge && typeof badge === 'object' && badge.text && (
          <View className={`px-2 py-1 rounded-full mr-2 ${
            badge.type === 'success' ? 'bg-green-100' :
            badge.type === 'warning' ? 'bg-orange-100' :
            badge.type === 'error' ? 'bg-red-100' :
            'bg-gray-100'
          }`}>
            <Text className={`text-xs font-medium ${
              badge.type === 'success' ? 'text-green-700' :
              badge.type === 'warning' ? 'text-orange-700' :
              badge.type === 'error' ? 'text-red-700' :
              'text-gray-700'
            }`}>
              {badge.text}
            </Text>
          </View>
        )}

        {/* 화살표 아이콘 */}
        {showChevron && (
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={getChevronColor()}
          />
        )}
      </View>
    </TouchableOpacity>
  );
});


export default ProfileMenu;
