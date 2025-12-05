import React, { memo } from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * FilterChips Component - 필터링을 위한 칩 형태의 선택 UI
 *
 * @param {Array} options - 선택 가능한 필터 옵션들 [{ id, label, value }]
 * @param {string} selected - 현재 선택된 옵션의 ID
 * @param {Function} onSelect - 선택 시 호출되는 콜백 함수
 * @param {boolean} showAll - "전체" 옵션 표시 여부
 * @param {string} containerStyle - 컨테이너 추가 스타일
 */
const FilterChips = memo(({
  options = [],
  selected = null,
  onSelect = () => {},
  showAll = true,
  containerStyle = ''
}) => {
  const { t } = useTranslation(['common']);

  const allOptions = showAll
    ? [{ id: 'all', label: t('common:filters.all'), value: 'all' }, ...options]
    : options;

  const renderChip = (option) => {
    const isSelected = selected === option.id;

    return (
      <TouchableOpacity
        key={option.id}
        onPress={() => onSelect(option.id, option.value)}
        className={`
          px-4 py-2 mr-2 rounded-full border
          ${isSelected
            ? 'bg-primary border-primary'
            : 'bg-white border-gray-200'
          }
        `}
        activeOpacity={0.7}
      >
        <Text
          className={`
            text-sm font-medium
            ${isSelected ? 'text-white' : 'text-gray-700'}
          `}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (allOptions.length === 0) {
    return null;
  }

  return (
    <View className={`${containerStyle}`}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 8
        }}
        className="flex-row"
      >
        {allOptions.map(renderChip)}
      </ScrollView>
    </View>
  );
});

FilterChips.displayName = 'FilterChips';

export { FilterChips };
export default FilterChips;