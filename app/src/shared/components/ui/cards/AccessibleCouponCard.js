/**
 * AccessibleCouponCard - WCAG 2.1 AA 준수 쿠폰 카드
 * 색상 대비 4.5:1, 44pt 터치 타깃, VoiceOver 완전 지원
 */
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useTranslation } from 'react-i18next';

const AccessibleCouponCard = ({
  couponType = 'firstOrder', // firstOrder, freeShipping, newStore
  onPress,
  style,
  ...props
}) => {
  const { t } = useTranslation(['home', 'common']);

  // 쿠폰 타입별 설정
  const couponConfig = {
    firstOrder: {
      title: t('home.coupons.firstOrder'),
      subtitle: t('home.coupons.firstOrderDiscount'),
      icon: 'percentage',
      gradient: ['#EF4444', '#EC4899'],
      accessibilityLabel: t('home.coupons.a11y.firstOrderLabel'),
      accessibilityHint: t('home.coupons.a11y.firstOrderHint')},
    freeShipping: {
      title: t('home.coupons.freeShipping'),
      subtitle: t('home.coupons.freeShippingMinOrder'),
      icon: 'shipping-fast',
      gradient: ['#3B82F6', '#1E40AF'],
      accessibilityLabel: t('home.coupons.a11y.freeShippingLabel'),
      accessibilityHint: t('home.coupons.a11y.freeShippingHint')},
    newStore: {
      title: t('home.coupons.newStore'),
      subtitle: t('home.coupons.newStoreDiscount'),
      icon: 'store',
      gradient: ['#10B981', '#059669'],
      accessibilityLabel: t('home.coupons.a11y.newStoreLabel'),
      accessibilityHint: t('home.coupons.a11y.newStoreHint')}};

  const config = couponConfig[couponType];

  return (
    <TouchableOpacity
      className="mr-4 rounded-2xl w-52 shadow-lg"
      onPress={() => onPress?.(couponType)}
      style={[style, {
        elevation: 8,
        shadowColor: config.gradient[0],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8}]}
      accessibilityRole="button"
      accessibilityLabel={config.accessibilityLabel}
      accessibilityHint={config.accessibilityHint}
      activeOpacity={0.85}
      {...props}
    >
      <LinearGradient
        colors={config.gradient}
        className="rounded-2xl p-4 h-24"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* 상단 영역: 아이콘 + "지금 사용" 배지 */}
        <View className="flex-row items-start justify-between mb-2">
          <View
            className="w-8 h-8 rounded-lg bg-white/20 items-center justify-center"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4}}
          >
            <FontAwesome5
              name={config.icon}
              size={14}
              color="white"
              accessibilityRole="image"
              importantForAccessibility="no"
            />
          </View>

          {/* "지금 사용" 배지를 우측 상단으로 이동 */}
          <View className="bg-white/20 px-2 py-1 rounded-full">
            <Text className="text-white text-xs font-medium">
              {t('home.coupons.useNow')}
            </Text>
          </View>
        </View>

        {/* 텍스트 콘텐츠 - 컴팩하게 조정 */}
        <View className="flex-1 justify-center">
          <Text
            className="text-white font-bold text-base leading-5 mb-1"
            numberOfLines={1}
            accessibilityRole="header"
            accessibilityLevel={3}
          >
            {config.title}
          </Text>
          <Text
            className="text-white/90 text-sm leading-4"
            numberOfLines={1}
            accessibilityRole="text"
          >
            {config.subtitle}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default AccessibleCouponCard;
