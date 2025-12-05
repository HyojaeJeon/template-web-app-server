import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image} from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * CategoryFilter - 카테고리 필터 컴포넌트
 * 매장 검색 및 필터링에 사용되는 가로 스크롤 카테고리 선택기
 */
const CategoryFilter = ({
  categories = [],
  selectedCategory = null,
  onCategorySelect,
  showAll = true,
  horizontal = true,
  itemsPerRow = null,
  style,
  ...props
}) => {
  const { t } = useTranslation();

  const handleCategoryPress = (category) => {
    onCategorySelect?.(category?.id === selectedCategory ? null : category);
  };

  const renderCategoryItem = (category, index) => {
    const isSelected = selectedCategory === category?.id;
    const isAll = category?.id === 'all';

    return (
      <TouchableOpacity
        key={category?.id || index}
        onPress={() => handleCategoryPress(category)}
        className={`items-center justify-center rounded-lg border-2 ${
          isSelected
            ? 'bg-mint-50 border-mint-200'
            : 'bg-white border-gray-200'
        } ${horizontal ? 'mr-3' : 'mb-3'}`}
        style={[
          horizontal ? { width: 80, height: 80 } : { flex: 1, aspectRatio: 1 },
          !horizontal && itemsPerRow && { width: `${100 / itemsPerRow - 2}%` },
        ]}
        activeOpacity={0.7}
        {...props}
      >
        {/* 카테고리 아이콘 */}
        <View className="items-center justify-center flex-1">
          {category?.iconUrl ? (
            <Image
              source={{ uri: category.iconUrl }}
              className="w-8 h-8"
              resizeMode="contain"
            />
          ) : (
            <MaterialCommunityIcons
              name={isAll ? 'apps' : category?.icon || 'food'}
              size={24}
              color={isSelected ? '#2AC1BC' : '#6B7280'}
            />
          )}
        </View>

        {/* 카테고리 이름 */}
        <Text
          className={`text-xs font-medium text-center px-1 ${
            isSelected ? 'text-mint-700' : 'text-gray-700'
          }`}
          numberOfLines={2}
        >
          {isAll
            ? t('category.all')
            : category?.name || t('category.unknown')
          }
        </Text>

        {/* 매장 수 표시 */}
      </TouchableOpacity>
    );
  };

  // 전체 카테고리 추가
  const allCategory = {
    id: 'all',
    name: t('category.all'),
    icon: 'apps',
};

  const displayCategories = showAll ? [allCategory, ...categories] : categories;

  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        className="py-3 bg-white"
        style={style}
      >
        {displayCategories.map(renderCategoryItem)}
      </ScrollView>
    );
  }

  // 그리드 형태 렌더링
  const rows = [];
  const itemsPerRowCount = itemsPerRow || 3;

  for (let i = 0; i < displayCategories.length; i += itemsPerRowCount) {
    const rowItems = displayCategories.slice(i, i + itemsPerRowCount);
    rows.push(
      <View key={i} className="flex-row justify-between mb-3">
        {rowItems.map((category, index) => renderCategoryItem(category, i + index))}
        {/* 빈 공간 채우기 */}
        {rowItems.length < itemsPerRowCount &&
          Array.from({ length: itemsPerRowCount - rowItems.length }).map((_, emptyIndex) => (
            <View
              key={`empty-${i}-${emptyIndex}`}
              style={{ flex: 1, width: `${100 / itemsPerRowCount - 2}%` }}
            />
          ))
        }
      </View>
    );
  }

  return (
    <View className="px-4 py-3 bg-white" style={style}>
      {rows}
    </View>
  );
};

export default memo(CategoryFilter);
