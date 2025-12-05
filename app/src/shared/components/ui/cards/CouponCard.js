/**
 * CouponCard Component
 * 쿠폰 카드 컴포넌트
 * SOLID Principles - Single Responsibility, Open/Closed
 */
import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@providers/ThemeProvider';

// 쿠폰 타입 상수
const COUPON_TYPES = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
  FREE_DELIVERY: 'FREE_DELIVERY',
  CASHBACK: 'CASHBACK',
  FREE_ITEM: 'FREE_ITEM',
  COMBO_DEAL: 'COMBO_DEAL',
  FIRST_ORDER: 'FIRST_ORDER',
  LOYALTY_REWARD: 'LOYALTY_REWARD'};
import VNDFormatter from '@shared/components/ui/localization/VNDFormatter';

const CouponCard = memo(({
  coupon,
  onPress,
  onToggleFavorite,
  disabled = false,
  applied = false,
  style = {}}) => {
  const { t, i18n } = useTranslation(['coupon', 'common']);
  const { isDarkMode, colors: theme } = useTheme();

  // 현재 언어에 따른 쿠폰 정보
  const getCouponInfo = () => {
    const lang = i18n.language;
    return {
      name: lang === 'en' ? coupon.name : coupon.name,
      description: lang === 'en' ? coupon.description : coupon.description};
  };

  const { name, description } = getCouponInfo();

  // 할인 텍스트 생성
  const getDiscountText = () => {
    switch (coupon.couponType) {
      case COUPON_TYPES.PERCENTAGE:
        return `${coupon.discountValue}% ${t('coupon:off')}`;
      case COUPON_TYPES.FIXED_AMOUNT:
        return <VNDFormatter amount={coupon.discountValue} showSymbol />;
      case COUPON_TYPES.FREE_DELIVERY:
        return t('coupon:freeDelivery');
      default:
        return t('coupon:discount');
    }
  };

  // 최소 주문금액 텍스트
  const getMinOrderText = () => {
    if (coupon.minOrderAmount > 0) {
      return t('coupon:minOrder', {
        amount: <VNDFormatter amount={coupon.minOrderAmount} />});
    }
    return null;
  };

  // 유효기간 텍스트
  const getExpiryText = () => {
    const expiryDate = new Date(coupon.endDate);
    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return t('coupon:expired');
    } else if (diffDays <= 7) {
      return t('coupon:expiresSoon', { days: diffDays });
    } else {
      return t('coupon:validUntil', {
        date: expiryDate.toLocaleDateString()});
    }
  };

  // 사용 가능 횟수 텍스트
  const getUsageText = () => {
    const remaining = coupon.maxUsageCount - coupon.currentUsageCount;
    if (remaining <= 0) {
      return t('coupon:usedUp');
    } else if (remaining === 1) {
      return t('coupon:lastUse');
    } else {
      return t('coupon:usesRemaining', { count: remaining });
    }
  };

  // 쿠폰 상태에 따른 스타일
  const getCardStyle = () => {
    if (disabled) {
      return {
        backgroundColor: theme.bgDisabled,
        borderColor: theme.border,
        opacity: 0.6};
    }

    if (applied) {
      return {
        backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
        borderColor: theme.success,
        borderWidth: 2};
    }

    return {
      backgroundColor: theme.bgCard,
      borderColor: theme.border,
      borderWidth: 1};
  };

  // 쿠폰 색상에 따른 그라데이션
  const getGradientColors = () => {
    // 쿠폰 타입별 기본 색상 설정
    const typeColors = {
      [COUPON_TYPES.PERCENTAGE]: '#FF6B6B',
      [COUPON_TYPES.FIXED_AMOUNT]: '#FFC107',
      [COUPON_TYPES.FREE_DELIVERY]: '#4CAF50',
      [COUPON_TYPES.FIRST_ORDER]: '#9C27B0',
      [COUPON_TYPES.CASHBACK]: '#FF9800',
      [COUPON_TYPES.FREE_ITEM]: '#E91E63',
      [COUPON_TYPES.COMBO_DEAL]: '#00BCD4',
      [COUPON_TYPES.LOYALTY_REWARD]: '#795548'};

    const baseColor = typeColors[coupon.couponType] || theme.primary;
    return [baseColor, baseColor + '80']; // 80% 투명도
  };

  // 쿠폰 타입별 아이콘 설정
  const getCouponIcon = () => {
    const typeIcons = {
      [COUPON_TYPES.PERCENTAGE]: '[SUCCESS]',
      [COUPON_TYPES.FIXED_AMOUNT]: '💰',
      [COUPON_TYPES.FREE_DELIVERY]: '🚚',
      [COUPON_TYPES.FIRST_ORDER]: '⭐',
      [COUPON_TYPES.CASHBACK]: '💸',
      [COUPON_TYPES.FREE_ITEM]: '🎁',
      [COUPON_TYPES.COMBO_DEAL]: '[PACKAGE]',
      [COUPON_TYPES.LOYALTY_REWARD]: '🏆'};

    return coupon.imageUrl || typeIcons[coupon.couponType] || '🎟️';
  };

  return (
    <TouchableOpacity
      onPress={() => !disabled && onPress && onPress(coupon)}
      disabled={disabled}
      style={[
        {
          borderRadius: 16,
          marginBottom: 12,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.shadowOpacity,
          shadowRadius: 4,
          elevation: 3},
        getCardStyle(),
        style,
      ]}
    >
      <View className="flex-row overflow-hidden rounded-2xl">
        {/* 왼쪽 쿠폰 아이콘 섹션 */}
        <LinearGradient
          colors={getGradientColors()}
          className="w-20 items-center justify-center py-6"
        >
          <Text className="text-3xl mb-2">{getCouponIcon()}</Text>
          {applied && (
            <View className="bg-white rounded-full p-1">
              <Icon name="check" size={16} color="#10B981" />
            </View>
          )}
        </LinearGradient>

        {/* 쿠폰 정보 섹션 */}
        <View className="flex-1 p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-lg font-bold mb-1" style={{ color: theme.textPrimary }}>
                {name}
              </Text>
              <Text className="text-2xl font-bold mb-1" style={{ color: getGradientColors()[0] }}>
                {getDiscountText()}
              </Text>
              <Text className="text-sm mb-2" style={{ color: theme.textSecondary }} numberOfLines={2}>
                {description}
              </Text>
            </View>

            {/* 즐겨찾기 버튼 - 향후 기능 구현 예정 */}
            {onToggleFavorite && (
              <TouchableOpacity
                onPress={() => onToggleFavorite(coupon.id)}
                className="p-2"
              >
                <Icon
                  name={coupon.isFavorite ? 'favorite' : 'favorite-border'}
                  size={20}
                  color={coupon.isFavorite ? '#FF6B6B' : '#9CA3AF'}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* 최소 주문금액 */}
          {getMinOrderText() && (
            <Text className="text-xs mb-1" style={{ color: theme.textMuted }}>
              {getMinOrderText()}
            </Text>
          )}

          {/* 하단 정보 */}
          <View className="flex-row items-center justify-between">
            <Text className="text-xs" style={{ color: theme.textMuted }}>
              {getExpiryText()}
            </Text>
            <Text className="text-xs" style={{ color: theme.textMuted }}>
              {getUsageText()}
            </Text>
          </View>

          {/* 쿠폰 코드 */}
          <View className="mt-3 pt-3 border-dashed" style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-mono font-semibold" style={{ color: theme.textSecondary }}>
                {coupon.code}
              </Text>
              {applied ? (
                <View className="px-3 py-1 rounded-full" style={{ backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7' }}>
                  <Text className="text-xs font-semibold" style={{ color: theme.success }}>
                    {t('coupon:applied')}
                  </Text>
                </View>
              ) : (
                <View className="px-3 py-1 rounded-full" style={{ backgroundColor: theme.primary }}>
                  <Text className="text-xs font-semibold" style={{ color: theme.button.primaryText }}>
                    {t('coupon:use')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default CouponCard;
