/**
 * CategoryIcon - 홈화면 카테고리 아이콘 컴포넌트
 * 참고 이미지 디자인 패턴 적용
 */
import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useTranslation } from 'react-i18next';

const CategoryIcon = memo(({
  category,
  onPress,
  isActive = false,
  size = 'medium', // 'small', 'medium', 'large'
  className = ''}) => {
  const { t } = useTranslation(['home', 'common']);

  const getSizeStyles = () => {
    const sizes = {
      small: { container: 'w-16 h-16', icon: 20, text: 'text-xs' },
      medium: { container: 'w-20 h-20', icon: 24, text: 'text-sm' },
      large: { container: 'w-24 h-24', icon: 28, text: 'text-base' }};
    return sizes[size];
  };

  const sizeStyles = getSizeStyles();

  // 카테고리별 아이콘과 색상 매핑
  const categoryConfig = {
    pho: { icon: 'ramen-dining', color: '#F59E0B', emoji: '🍜' },
    com: { icon: 'rice-bowl', color: '#10B981', emoji: '🍚' },
    bun: { icon: 'soup-kitchen', color: '#EF4444', emoji: '🍲' },
    banh: { icon: 'bakery-dining', color: '#8B5CF6', emoji: '🥖' },
    drink: { icon: 'local-drink', color: '#3B82F6', emoji: '🧋' },
    dessert: { icon: 'cake', color: '#EC4899', emoji: '🍰' },
    chicken: { icon: 'restaurant', color: '#F97316', emoji: '🍗' },
    pizza: { icon: 'local-pizza', color: '#EF4444', emoji: '🍕' },
    burger: { icon: 'lunch-dining', color: '#F59E0B', emoji: '🍔' },
    fastfood: { icon: 'fastfood', color: '#10B981', emoji: '🍟' },
    default: { icon: 'restaurant-menu', color: '#6B7280', emoji: '🍽️' }};

  const config = categoryConfig[category?.id] || categoryConfig.default;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(category)}
      className={`items-center mb-4 ${className}`}
      accessible
      accessibilityLabel={`${category?.name || t('home.category.default')} 카테고리`}
      accessibilityHint={t('home.category.hint')}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      {/* 아이콘 컨테이너 */}
      <View
        className={`${sizeStyles.container} rounded-2xl items-center justify-center mb-2 ${
          isActive ? 'bg-primary-100' : 'bg-gray-50'
        }`}
        style={{
          borderWidth: isActive ? 2 : 1,
          borderColor: isActive ? config.color : '#E5E7EB'}}
      >
        {/* 이모지 또는 아이콘 */}
        {category?.useEmoji ? (
          <Text style={{ fontSize: sizeStyles.icon * 1.5 }}>
            {config.emoji}
          </Text>
        ) : (
          <Icon
            name={config.icon}
            size={sizeStyles.icon}
            color={isActive ? config.color : '#6B7280'}
          />
        )}
      </View>

      {/* 카테고리 이름 */}
      <Text
        className={`${sizeStyles.text} ${
          isActive ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
        }`}
        numberOfLines={1}
      >
        {category?.name || t('home.category.default')}
      </Text>

      {/* 활성 상태 인디케이터 */}
      {isActive && (
        <View
          className="w-1 h-1 rounded-full mt-1"
          style={{ backgroundColor: config.color }}
        />
      )}
    </TouchableOpacity>
  );
});


export default CategoryIcon;
