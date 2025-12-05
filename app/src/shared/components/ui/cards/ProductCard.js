/**
 * ProductCard Component
 * 추천 상품 시스템을 위한 재사용 가능한 상품 카드 컴포넌트
 * Follows SOLID Principles - Open/Closed, Single Responsibility
 */
import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import OptimizedImage from '@shared/components/ui/images/OptimizedImage';

const ProductCard = memo(({
  id,
  title,
  price,
  originalPrice,
  discount,
  rating,
  reviewCount,
  deliveryTime,
  deliveryFee,
  tags = [],
  image,
  category,
  style = 'default', // default, horizontal, compact
  isFavorite = false,
  isRecommended = false,
  recommendationReason = null,
  onPress,
  onToggleFavorite,
  onAddToCart}) => {
  const { t } = useTranslation(['common', 'ui', 'menu', 'order']);

  // 가격 포맷팅
  const formatPrice = (price, currency = '₫') => {
    if (typeof price !== 'number') {return '0' + currency;}
    return price.toLocaleString() + currency;
  };

  // 할인율 계산
  const calculateDiscountPercentage = (originalPrice, salePrice) => {
    if (!originalPrice || !salePrice || salePrice >= originalPrice) {return 0;}
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };

  // 무료배송 여부
  const isFreeDelivery = (fee) => !fee || fee === 0;

  const handleToggleFavorite = () => {
    onToggleFavorite && onToggleFavorite(id);
  };

  const handlePress = () => {
    onPress && onPress(id);
  };

  const handleAddToCart = () => {
    onAddToCart && onAddToCart(id);
  };

  const renderImage = () => (
    <View className={`relative ${style === 'horizontal' ? 'w-20 h-20 mr-4' : 'w-full h-32 mb-3'}`}>
      <View
        className={`bg-gray-200 rounded-xl items-center justify-center ${style === 'horizontal' ? 'w-20 h-20' : 'w-full h-32'}`}
      >
        {image ? (
          typeof image === 'string' && image.startsWith('http') ? (
            <OptimizedImage
              source={{ uri: image }}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 12
              }}
              resizeMode={OptimizedImage.resizeMode.cover}
              priority={OptimizedImage.priority.normal}
              cache={OptimizedImage.cacheControl.web}
              accessible={true}
              accessibilityLabel={`${title} 상품 이미지`}
            />
          ) : (
            <Text className="text-2xl">{image}</Text>
          )
        ) : (
          <Icon name="store" size={24} color="#9CA3AF" />
        )}
      </View>

      {/* 추천 배지 */}
      {isRecommended && (
        <View className="absolute -top-2 -left-2">
          <LinearGradient
            colors={['#FF6B6B', '#FF8E8E']}
            className="px-2 py-1 rounded-full"
          >
            <Text className="text-xs font-bold text-white">{t('ui:featured')}</Text>
          </LinearGradient>
        </View>
      )}

      {/* 할인 배지 */}
      {discount > 0 && (
        <View className="absolute top-2 right-2">
          <LinearGradient
            colors={['#FF6B6B', '#FF8E8E']}
            className="px-2 py-1 rounded-full"
          >
            <Text className="text-xs font-bold text-white">-{discount}%</Text>
          </LinearGradient>
        </View>
      )}

      {/* 즐겨찾기 버튼 */}
      <TouchableOpacity
        onPress={handleToggleFavorite}
        className="absolute bottom-2 right-2 w-6 h-6 bg-white/90 rounded-full items-center justify-center"
      >
        <Icon
          name={isFavorite ? 'favorite' : 'favorite-border'}
          size={14}
          color={isFavorite ? '#FF6B6B' : '#9CA3AF'}
        />
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => (
    <View className={style === 'horizontal' ? 'flex-1' : ''}>
      {/* 제목 */}
      <Text
        className="font-semibold text-gray-900 text-base mb-1"
        numberOfLines={style === 'compact' ? 1 : 2}
      >
        {title}
      </Text>

      {/* 추천 이유 */}
      {isRecommended && recommendationReason && (
        <Text className="text-xs text-primary mb-2" numberOfLines={1}>
          [INFO] {recommendationReason}
        </Text>
      )}

      {/* 카테고리 */}
      {category && (
        <Text className="text-xs text-gray-500 mb-2">{category}</Text>
      )}

      {/* 가격 정보 */}
      <View className="flex-row items-center mb-2">
        <Text className="text-lg font-bold text-gray-900 mr-2">
          {formatPrice(price)}
        </Text>
        {originalPrice && originalPrice > price && (
          <Text className="text-sm text-gray-500 line-through">
            {formatPrice(originalPrice)}
          </Text>
        )}
      </View>

      {/* 평점 및 리뷰 */}
      {rating > 0 && (
        <View className="flex-row items-center mb-2">
          <Icon name="star" size={14} color="#FFC107" />
          <Text className="text-sm text-gray-700 ml-1">
            {rating} ({reviewCount || 0})
          </Text>
        </View>
      )}

      {/* 배송 정보 */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-gray-600">
          {deliveryTime}{t('common:common.time.minutes')}
        </Text>
        <Text className={`text-sm ${isFreeDelivery(deliveryFee) ? 'text-green-600 font-semibold' : 'text-gray-600'}`}>
          {isFreeDelivery(deliveryFee) ? t('common:common.free') : `${t('order:detail.deliveryFee')} ${formatPrice(deliveryFee)}`}
        </Text>
      </View>

      {/* 태그 */}
      {tags.length > 0 && (
        <View className="flex-row flex-wrap mb-2">
          {tags.slice(0, style === 'compact' ? 2 : 3).map((tag, index) => (
            <View key={index} className="bg-gray-100 px-2 py-1 rounded-full mr-1 mb-1">
              <Text className="text-xs text-gray-600">{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderActionButtons = () => {
    if (style === 'compact') {return null;}

    return (
      <View className="flex-row mt-3 space-x-2">
        <TouchableOpacity
          onPress={handlePress}
          className="flex-1 bg-gray-100 py-2 rounded-lg"
        >
          <Text className="text-center text-sm text-gray-700">{t('common:common.actions.viewOnMap')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAddToCart}
          className="flex-1 bg-primary py-2 rounded-lg"
        >
          <Text className="text-center text-sm text-white font-semibold">{t('menu:menu.item.addToCart')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 스타일별 레이아웃 렌더링
  if (style === 'horizontal') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        className="bg-white rounded-xl p-4 mb-3 flex-row"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2}}
      >
        {renderImage()}
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`bg-white rounded-xl p-4 ${style === 'compact' ? 'w-40' : 'w-full'} mr-3`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2}}
    >
      {renderImage()}
      {renderContent()}
      {renderActionButtons()}
    </TouchableOpacity>
  );
});

export default ProductCard;
