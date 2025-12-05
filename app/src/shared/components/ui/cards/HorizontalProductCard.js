/**
 * HorizontalProductCard Component
 *
 * Horizontal product card layout for list views
 * Single Responsibility - handles only horizontal card display
 *
 * Performance optimizations:
 * - React.memo for shallow prop comparison
 * - Memoized style objects and event handlers
 * - Optimized rendering with sub-component memoization
 *
 * Accessibility:
 * - Screen reader support with product descriptions
 * - Semantic roles and states
 * - WCAG compliant touch targets
 */
import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

import DiscountBadge from '@shared/components/ui/badges/DiscountBadge';
import StarRating from '@shared/components/ui/review/StarRating';
import PriceDisplay from '@shared/components/ui/utility/PriceDisplay';

const HorizontalProductCard = memo(({
  product = {},
  onFavorite,
  onAddToCart,
  onPress,
  isFavorite = false}) => {
  const { t } = useTranslation();

  if (!product || !product.id) {
    return null;
  }

  const cardStyle = useMemo(() => ({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3}), []);

  const handleFavorite = useCallback(() => {
    onFavorite?.(product?.id);
  }, [onFavorite, product?.id]);

  const handleAddToCart = useCallback(() => {
    onAddToCart?.(product?.id);
  }, [onAddToCart, product?.id]);

  const handlePress = useCallback(() => {
    onPress?.(product);
  }, [onPress, product]);

  const favoriteLabel = useMemo(() => {
    return isFavorite
      ? t('productCards.removeFromFavorites')
      : t('productCards.addToFavorites');
  }, [isFavorite, t]);

  const productAccessibilityLabel = useMemo(() => {
    const price = product?.salePrice || product?.originalPrice || 0;
    return `${product?.name || ''}, ${product?.description || ''}, ${t('productCards.price')}: ${price}원, ${t('productCards.rating')}: ${product?.rating || 0}점`;
  }, [product, t]);

  const ProductImage = memo(() => (
    <View className="relative">
      <View className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
        <LinearGradient
          colors={product?.imageColors || ['#FFF7ED', '#FED7AA', '#FB923C']}
          className="w-full h-full items-center justify-center"
        >
          <View
            className="absolute inset-0 opacity-15"
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          >
            <View className="flex-row flex-wrap justify-center items-center h-full">
              {Array.from({length: 4}).map((_, i) => (
                <Text key={i} className="text-sm opacity-40">
                  {product?.patternEmoji || '🍜'}
                </Text>
              ))}
            </View>
          </View>

          <View
            className="bg-white/30 rounded-full w-16 h-16 items-center justify-center"
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          >
            <Text className="text-2xl">{product?.emoji || '🍜'}</Text>
          </View>
        </LinearGradient>
      </View>

      {product?.discount && (
        <DiscountBadge
          discount={product?.discount}
          position="top-left"
          size="small"
        />
      )}
    </View>
  ));

  const ProductInfo = memo(() => (
    <View className="flex-1 p-3">
      <View className="flex-row justify-between items-start mb-1">
        <Text
          className="text-sm font-bold text-gray-900 flex-1"
          numberOfLines={1}
          accessibilityRole="header"
        >
          {product?.name || ''}
        </Text>
        <TouchableOpacity
          onPress={handleFavorite}
          className="ml-2"
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={favoriteLabel}
          accessibilityHint={t('productCards.favoriteHint')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon
            name={isFavorite ? 'favorite' : 'favorite_border'}
            size={16}
            color={isFavorite ? '#EF4444' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>

      <Text
        className="text-xs text-gray-600 mb-2"
        numberOfLines={1}
      >
        {product?.description || ''}
      </Text>

      <View className="mb-2">
        <StarRating rating={product?.rating || 0} size={12} />
      </View>

      <View className="flex-row justify-between items-center">
        <PriceDisplay
          originalPrice={product?.originalPrice}
          salePrice={product?.salePrice}
          size="small"
        />

        <TouchableOpacity
          onPress={handleAddToCart}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('productCards.addToCart')}
          accessibilityHint={t('productCards.addToCartHint')}
        >
          <LinearGradient
            colors={['#2AC1BC', '#00B14F']}
            className="rounded-full px-3 py-1"
          >
            <Icon
              name="add"
              size={14}
              color="#FFFFFF"
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  ));

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-white rounded-2xl mb-3 overflow-hidden flex-row"
      style={cardStyle}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={productAccessibilityLabel}
      activeOpacity={0.8}
    >
      <ProductImage />
      <ProductInfo />
    </TouchableOpacity>
  );
});


export default HorizontalProductCard;
