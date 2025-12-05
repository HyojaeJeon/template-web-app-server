/**
 * FilterChips - 접근성 중심의 필터 칩 컴포넌트
 * WCAG 2.1 AA 준수, 터치 타깃 최적화
 */
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, AccessibilityInfo } from 'react-native';
import { useTranslation } from 'react-i18next';

const FilterChips = ({
  chips = [],
  selectedChip,
  onChipSelect,
  variant = 'filled', // 'filled' | 'outlined'
  size = 'medium', // 'small' | 'medium' | 'large'
  scrollable = true,
  testID,
  accessible = true}) => {
  const { t } = useTranslation();

  const handleChipPress = useCallback((chipId) => {
    if (chipId !== selectedChip) {
      onChipSelect?.(chipId);

      // 접근성: 필터 변경 알림
      if (accessible) {
        const selectedChipData = chips.find(chip => chip.id === chipId);
        AccessibilityInfo.announceForAccessibility(
          t('coupon.accessibility.filterSelected', { filter: selectedChipData?.title || chipId })
        );
      }
    }
  }, [selectedChip, onChipSelect, chips, t, accessible]);

  const getChipStyles = (isSelected, variant, size) => {
    const baseClasses = 'items-center justify-center rounded-full';

    const sizeClasses = {
      small: 'px-3 py-1.5 min-h-[32px]',
      medium: 'px-4 py-2 min-h-[36px]',
      large: 'px-5 py-2.5 min-h-[40px]'};

    const variantClasses = {
      filled: isSelected
        ? 'bg-primary-600 border border-primary-600'
        : 'bg-chipBg border border-gray-200',
      outlined: isSelected
        ? 'bg-primary-50 border-2 border-primary-600'
        : 'bg-white border border-gray-300'};

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`;
  };

  const getTextStyles = (isSelected, variant) => {
    const baseClasses = 'font-medium';

    if (variant === 'filled') {
      return `${baseClasses} ${
        isSelected ? 'text-white' : 'text-onSurface-medium'
      }`;
    }

    if (variant === 'outlined') {
      return `${baseClasses} ${
        isSelected ? 'text-primary-600' : 'text-onSurface-medium'
      }`;
    }

    return baseClasses;
  };

  const renderChip = (chip) => {
    const isSelected = selectedChip === chip.id;

    return (
      <TouchableOpacity
        key={chip.id}
        onPress={() => handleChipPress(chip.id)}
        className={`${getChipStyles(isSelected, variant, size)} ${
          scrollable ? 'mr-3' : 'flex-1 mx-1'
        }`}
        testID={`${testID}-${chip.id}`}
        accessible={accessible}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={chip.accessibilityLabel || chip.title}
        accessibilityHint={chip.accessibilityHint || `Filter by ${chip.title}`}
      >
        <View className="flex-row items-center">
          <Text className={getTextStyles(isSelected, variant)}>
            {chip.title}
          </Text>
          {chip.count !== null && chip.count !== undefined && chip.count >= 0 && (
            <Text className={`ml-1 text-xs ${getTextStyles(isSelected, variant)}`}>
              ({chip.count})
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!chips || chips.length === 0) {
    return null;
  }

  const content = (
    <View className={scrollable ? 'flex-row' : 'flex-row flex-wrap'}>
      {chips.map(renderChip)}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-grow-0"
        contentContainerStyle={{ paddingHorizontal: 16 }}
        testID={testID}
        accessible={accessible}
        accessibilityRole="group"
        accessibilityLabel={t('coupon.accessibility.filterGroup', 'Filter options')}
      >
        {content}
      </ScrollView>
    );
  }

  return (
    <View
      className="px-4"
      testID={testID}
      accessible={accessible}
      accessibilityRole="group"
      accessibilityLabel={t('coupon.accessibility.filterGroup', 'Filter options')}
    >
      {content}
    </View>
  );
};

export default React.memo(FilterChips);
