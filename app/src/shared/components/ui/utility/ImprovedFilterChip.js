/**
 * ImprovedFilterChip - 상태가 명확한 필터 칩 컴포넌트
 * 44pt 터치 영역, 명확한 상태 피드백, 접근성 최적화
 */
import React, { memo } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

const ImprovedFilterChip = memo(({
  label,
  icon,
  isActive = false,
  isApplied = false,
  isDisabled = false,
  appliedCount = 0,
  onPress,
  variant = 'default', // 'default' | 'sort' | 'view'
  accessibilityLabel,
  accessibilityHint}) => {
  const { t } = useTranslation();

  // 상태별 스타일링
  const getChipStyles = () => {
    if (isDisabled) {
      return {
        container: 'bg-gray-100 border border-gray-200 opacity-50',
        text: 'text-gray-400',
        icon: '#9CA3AF'};
    }

    if (isApplied) {
      return {
        container: 'bg-mint-500 border border-mint-500',
        text: 'text-white',
        icon: '#FFFFFF'};
    }

    if (isActive) {
      return {
        container: 'bg-mint-50 border border-mint-200',
        text: 'text-mint-700',
        icon: '#059669'};
    }

    return {
      container: 'bg-white border border-gray-200',
      text: 'text-gray-700',
      icon: '#6B7280'};
  };

  const styles = getChipStyles();

  // 접근성 라벨 구성
  const getAccessibilityLabel = () => {
    const baseLabel = accessibilityLabel || label;
    const statusText = isApplied
      ? t('store.filter.applied')
      : isActive
        ? t('store.filter.active')
        : t('store.filter.inactive');

    const countText = appliedCount > 0
      ? t('store.filter.appliedCount', { count: appliedCount })
      : '';

    return `${baseLabel}, ${statusText}${countText}`;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`
        flex-row items-center px-3 py-2 rounded-xl mr-2 min-h-[44px]
        ${styles.container}
      `}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={accessibilityHint || t('store.filter.chipHint')}
      accessibilityState={{
        selected: isApplied,
        disabled: isDisabled}}
    >
      {/* 아이콘 */}
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={styles.icon}
          accessibilityElementsHidden={true}
        />
      )}

      {/* 라벨 */}
      <Text
        className={`text-sm font-medium ${icon ? 'ml-2' : ''} ${styles.text}`}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* 적용된 필터 개수 뱃지 */}
      {appliedCount > 0 && isApplied && (
        <View className="bg-white bg-opacity-20 rounded-full w-5 h-5 items-center justify-center ml-2">
          <Text className="text-white text-xs font-bold">
            {appliedCount > 9 ? '9+' : appliedCount}
          </Text>
        </View>
      )}

      {/* 정렬 방향 표시 (sort variant) */}
      {variant === 'sort' && isActive && (
        <MaterialCommunityIcons
          name="chevron-down"
          size={16}
          color={styles.icon}
          style={{ marginLeft: 4 }}
          accessibilityElementsHidden={true}
        />
      )}
    </TouchableOpacity>
  );
});


export default ImprovedFilterChip;
