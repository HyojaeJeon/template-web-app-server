/**
 * SectionHeader - 접근성 강화된 섹션 헤더 컴포넌트
 * WCAG 2.1 AA 준수, 44pt 터치 타깃, VoiceOver 지원
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

const SectionHeader = ({
  title,
  titleKey,
  icon,
  iconColor = '#2AC1BC',
  actionText,
  actionKey,
  onActionPress,
  accessibilityLabel,
  accessibilityHint,
  namespace = 'home',
  showAction = true,
  backgroundColor = 'rgba(255, 255, 255, 0.60)',
  style,
  ...props
}) => {
  const { t, ready } = useTranslation([namespace, 'common']);

  // i18n 키 노출 방지 - 안전한 번역
  const safeTitle = () => {
    if (!ready) {return '···';} // 로딩 중 플레이스홀더

    try {
      if (titleKey) {
        const translated = t(titleKey);
        return translated === titleKey ? (title || '섹션') : translated;
      }
      return title || '섹션';
    } catch (error) {
      console.warn('Translation error for key:', titleKey, error);
      return title || '섹션';
    }
  };

  const displayTitle = safeTitle();
  const displayActionText = actionKey ? t(actionKey, actionText || '전체 보기') : (actionText || '전체 보기');

  return (
    <View
      className="flex-row items-center justify-between mb-4 rounded-lg px-3 py-2"
      style={[{ backgroundColor }, style]}
      accessibilityRole="banner"
      accessibilityLabel={accessibilityLabel || `${displayTitle} 섹션`}
      {...props}
    >
      {/* 좌측: 아이콘 + 타이틀 */}
      <View className="flex-row items-center flex-1">
        {icon && (
          <Icon
            name={icon}
            size={20}
            color={iconColor}
            accessibilityRole="image"
            accessibilityLabel={`${displayTitle} 아이콘`}
          />
        )}
        <Text
          className="text-xl font-semibold text-primary-900 ml-2"
          numberOfLines={1}
          adjustsFontSizeToFit
          accessibilityRole="header"
        >
          {displayTitle}
        </Text>
      </View>

      {/* 우측: 액션 버튼 */}
      {showAction && onActionPress && (
        <TouchableOpacity
          onPress={onActionPress}
          className="min-w-11 h-11 flex-row items-center justify-center px-3 rounded-lg"
          accessibilityRole="button"
          accessibilityLabel={displayActionText || '전체 보기'}
          accessibilityHint={accessibilityHint || '전체 목록을 볼 수 있습니다'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Text className="text-base font-medium text-primary-700 mr-1">
            {displayActionText}
          </Text>
          <Icon name="arrow-forward-ios" size={12} color="#1E7871" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SectionHeader;
