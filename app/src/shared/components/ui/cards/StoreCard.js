/**
 * StoreCard - 혁신적인 "Living Card" 디자인 v7.0
 * 두 가지 뷰 모드 지원: 카드형(card) + 리스트형(list)
 *
 * 디자인 컨셉: Organic Luxury (유기적 고급스러움)
 * - 이미지가 떠 있는 3D 효과
 * - 글래스모피즘 정보 패널
 * - 동적 그라데이션과 빛 효과
 * - 마이크로 인터랙션 애니메이션
 *
 * @param {string} variant - 'card' (기본) | 'list' (리스트형)
 */
import React, { memo, useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  Animated,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import OptimizedImage from '@shared/components/ui/images/OptimizedImage';
import { useTheme } from '@providers/ThemeProvider';

// 플레이스홀더 이미지
let STORE_PLACEHOLDER = null;
let LOGO_PLACEHOLDER = null;
try {
  STORE_PLACEHOLDER = require('@assets/images/store_banner.png');
  LOGO_PLACEHOLDER = require('@assets/images/store_logo_placeholder.png');
} catch (error) {
  console.log('[StoreCard] Placeholder image not found');
}

// 테마 컬러 (accent 색상 - 고정)
const ACCENT_COLORS = {
  accent: '#FFDD00',
  error: '#EF4444',
  orange: '#F97316',
  purple: '#8B5CF6',
  emerald: '#10B981',
};

// ===== 카드형 뷰 컴포넌트 =====
const CardView = memo(({
  store,
  storeName,
  logoUrl,
  coverImage,
  cuisineType,
  rating,
  reviewCount,
  estimatedDeliveryTime,
  deliveryFee,
  minOrderAmount,
  distance,
  isOpen,
  isFavorite,
  isFeatured,
  isNew,
  isFastDelivery,
  hasPromotion,
  promotion,
  couponsCount,
  showFreeDelivery,
  isFirstOrderDiscount,
  firstOrderDiscountAmount,
  showTags,
  onPress,
  onFavoritePress,
  scaleAnim,
  handlePressIn,
  handlePressOut,
  t,
  testID,
  className,
  theme,
  isDarkMode
}) => (
  <Animated.View
    style={{
      transform: [{ scale: scaleAnim }],
      marginBottom: 20,
    }}
  >
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onPress?.(store)}
      className={`overflow-hidden ${className}`}
      testID={testID}
      activeOpacity={1}
      style={{
        borderRadius: 24,
        backgroundColor: theme.bgCard,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDarkMode ? 0.3 : 0.12,
        shadowRadius: 20,
        elevation: 10,
      }}
    >
      {/* 메인 이미지 영역 */}
      <View className="relative" style={{ height: 260 }}>
        {/* 배경 이미지 */}
        <OptimizedImage
          source={
            coverImage
              ? { uri: coverImage }
              : (logoUrl ? { uri: logoUrl } : STORE_PLACEHOLDER)
          }
          style={{
            width: '100%',
            height: '100%',
            opacity: !isOpen ? 0.4 : 1,
          }}
          resizeMode={OptimizedImage.resizeMode?.cover || 'cover'}
          fallbackSource={STORE_PLACEHOLDER}
          placeholder="shimmer"
          showLoader={false}
        />

        {/* 상단 그라데이션 */}
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'transparent']}
          className="absolute top-0 left-0 right-0"
          style={{ height: 80 }}
        />

        {/* 하단 대형 그라데이션 */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.85)']}
          locations={[0, 0.4, 1]}
          className="absolute bottom-0 left-0 right-0"
          style={{ height: 180 }}
        />

        {/* 상단 좌측: 프로모션/할인 뱃지 */}
        {hasPromotion && (
          <View className="absolute top-3 left-3">
            <View
              className="flex-row items-center px-3 py-2 rounded-xl"
              style={{
                backgroundColor: ACCENT_COLORS.error,
                shadowColor: ACCENT_COLORS.error,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <MaterialCommunityIcons name="fire" size={16} color="#FFF" />
              <Text className="text-white text-xs font-black ml-1.5 tracking-wide">
                {promotion?.discountPercent
                  ? `${promotion.discountPercent}% OFF`
                  : t('common:promotion')
                }
              </Text>
            </View>
          </View>
        )}

        {/* 상단 우측: 평점 뱃지 */}
        <View className="absolute top-3 right-3">
          <View
            className="flex-row items-center px-3 py-2 rounded-xl"
            style={{
              backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: theme.shadowOpacity,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Icon name="star" size={16} color={ACCENT_COLORS.accent} />
            <Text className="text-sm font-black ml-1" style={{ color: theme.textPrimary }}>
              {rating > 0 ? rating.toFixed(1) : t('store:card.new')}
            </Text>
            {reviewCount > 0 && (
              <Text className="text-xs ml-1" style={{ color: theme.textMuted }}>
                ({reviewCount > 999 ? '999+' : reviewCount})
              </Text>
            )}
          </View>
        </View>

        {/* 하단: 글래스모피즘 정보 패널 */}
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          {/* 로고 + 매장 정보 + 즐겨찾기 */}
          <View className="flex-row items-start mb-3">
            {/* 로고 이미지 */}
            {logoUrl && (
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: theme.bgCard,
                  overflow: 'hidden',
                  marginRight: 12,
                  shadowColor: theme.shadow,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: theme.shadowOpacity,
                  shadowRadius: 12,
                  elevation: 10,
                  borderWidth: 3,
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.9)',
                }}
              >
                <OptimizedImage
                  source={{ uri: logoUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode={OptimizedImage.resizeMode?.cover || 'cover'}
                  fallbackSource={LOGO_PLACEHOLDER}
                  placeholder="shimmer"
                  showLoader={false}
                />
              </View>
            )}

            {/* 매장명 & 카테고리 */}
            <View className="flex-1" style={{ marginTop: logoUrl ? 4 : 0 }}>
              <Text
                className="text-white text-lg font-black mb-1"
                numberOfLines={1}
                style={{
                  textShadowColor: 'rgba(0, 0, 0, 0.5)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                }}
              >
                {storeName}
              </Text>
              <View className="flex-row items-center flex-wrap">
                <Text className="text-white/80 text-xs font-medium">
                  {cuisineType}
                </Text>
                {distance && (
                  <>
                    <View className="w-1 h-1 rounded-full bg-white/50 mx-2" />
                    <Text className="text-white/80 text-xs font-medium">
                      {distance.toFixed(1)}km
                    </Text>
                  </>
                )}
                <View className="w-1 h-1 rounded-full bg-white/50 mx-2" />
                <View className="flex-row items-center">
                  <View
                    className={`w-2 h-2 rounded-full mr-1 ${isOpen ? 'bg-green-400' : 'bg-gray-400'}`}
                    style={{
                      shadowColor: isOpen ? '#4ADE80' : '#9CA3AF',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 4,
                    }}
                  />
                  <Text className={`text-xs font-semibold ${isOpen ? 'text-green-400' : 'text-gray-400'}`}>
                    {isOpen ? t('store:status.open') : t('store:status.closed')}
                  </Text>
                </View>
              </View>
            </View>

            {/* 즐겨찾기 버튼 */}
            {onFavoritePress && (
              <TouchableOpacity
                onPress={() => onFavoritePress(store)}
                className="ml-2"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: isFavorite ? theme.primary : 'rgba(255, 255, 255, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: isFavorite ? theme.primary : '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isFavorite ? 0.4 : 0.2,
                  shadowRadius: 8,
                  elevation: 5,
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={20}
                  color={isFavorite ? '#FFFFFF' : 'rgba(255,255,255,0.9)'}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* 구분선 */}
          <View
            className="mb-3"
            style={{
              height: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            }}
          />

          {/* 배달 정보 */}
          <View className="flex-row items-center justify-between mb-3">
            {/* 배달 시간 */}
            <View className="flex-row items-center">
              <View
                className="w-8 h-8 rounded-xl items-center justify-center mr-2"
                style={{ backgroundColor: `${theme.primary}33` }}
              >
                <Ionicons name="time" size={16} color={theme.primary} />
              </View>
              <View>
                <Text className="text-white/60 text-[10px] font-medium">
                  {t('store:card.deliveryTime')}
                </Text>
                <Text className="text-white text-xs font-bold">
                  {estimatedDeliveryTime}{t('common:time.minutes')}
                </Text>
              </View>
            </View>

            {/* 배달비 */}
            <View className="flex-row items-center">
              <View
                className="w-8 h-8 rounded-xl items-center justify-center mr-2"
                style={{ backgroundColor: `${theme.secondary}33` }}
              >
                <MaterialCommunityIcons name="bike-fast" size={16} color={theme.secondary} />
              </View>
              <View>
                <Text className="text-white/60 text-[10px] font-medium">
                  {t('store:card.deliveryFee')}
                </Text>
                <Text className="text-white text-xs font-bold">
                  {deliveryFee > 0
                    ? `₫${deliveryFee.toLocaleString()}`
                    : t('store:card.free')
                  }
                </Text>
              </View>
            </View>

            {/* 최소주문 */}
            <View className="flex-row items-center">
              <View
                className="w-8 h-8 rounded-xl items-center justify-center mr-2"
                style={{ backgroundColor: 'rgba(255, 221, 0, 0.2)' }}
              >
                <MaterialCommunityIcons name="wallet" size={16} color={ACCENT_COLORS.accent} />
              </View>
              <View>
                <Text className="text-white/60 text-[10px] font-medium">
                  {t('store:card.minOrder')}
                </Text>
                <Text className="text-white text-xs font-bold">
                  ₫{minOrderAmount > 0 ? minOrderAmount.toLocaleString() : '0'}
                </Text>
              </View>
            </View>
          </View>

          {/* 태그/뱃지 영역 */}
          {showTags && (couponsCount > 0 || showFreeDelivery || isFirstOrderDiscount || isNew || isFastDelivery || isFeatured) && (
            <View className="flex-row flex-wrap gap-2">
              {isFeatured && (
                <View
                  className="flex-row items-center px-2.5 py-1.5 rounded-lg"
                  style={{ backgroundColor: 'rgba(255, 221, 0, 0.25)' }}
                >
                  <Icon name="star" size={12} color={ACCENT_COLORS.accent} />
                  <Text className="text-[11px] font-bold ml-1" style={{ color: ACCENT_COLORS.accent }}>
                    {t('store:badges.recommended')}
                  </Text>
                </View>
              )}

              {isNew && (
                <View
                  className="flex-row items-center px-2.5 py-1.5 rounded-lg"
                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.25)' }}
                >
                  <MaterialCommunityIcons name="new-box" size={12} color={ACCENT_COLORS.emerald} />
                  <Text className="text-[11px] font-bold ml-1 text-emerald-400">
                    {t('store:card.new')}
                  </Text>
                </View>
              )}

              {isFastDelivery && (
                <View
                  className="flex-row items-center px-2.5 py-1.5 rounded-lg"
                  style={{ backgroundColor: `${theme.primary}40` }}
                >
                  <Ionicons name="flash" size={12} color={theme.primary} />
                  <Text className="text-[11px] font-bold ml-1" style={{ color: theme.primary }}>
                    {t('store:badges.fastDelivery')}
                  </Text>
                </View>
              )}

              {couponsCount > 0 && (
                <View
                  className="flex-row items-center px-2.5 py-1.5 rounded-lg"
                  style={{ backgroundColor: 'rgba(139, 92, 246, 0.25)' }}
                >
                  <MaterialCommunityIcons name="ticket-percent" size={12} color={ACCENT_COLORS.purple} />
                  <Text className="text-[11px] font-bold ml-1" style={{ color: ACCENT_COLORS.purple }}>
                    {t('store:badges.coupons', { count: couponsCount })}
                  </Text>
                </View>
              )}

              {showFreeDelivery && (
                <View
                  className="flex-row items-center px-2.5 py-1.5 rounded-lg"
                  style={{ backgroundColor: `${theme.secondary}40` }}
                >
                  <MaterialCommunityIcons name="truck-delivery" size={12} color={theme.secondary} />
                  <Text className="text-[11px] font-bold ml-1" style={{ color: theme.secondary }}>
                    {t('store:card.freeDelivery')}
                  </Text>
                </View>
              )}

              {isFirstOrderDiscount && (
                <View
                  className="flex-row items-center px-2.5 py-1.5 rounded-lg"
                  style={{ backgroundColor: 'rgba(249, 115, 22, 0.25)' }}
                >
                  <MaterialCommunityIcons name="gift" size={12} color={ACCENT_COLORS.orange} />
                  <Text className="text-[11px] font-bold ml-1" style={{ color: ACCENT_COLORS.orange }}>
                    {t('store:badges.firstOrderDiscount', {
                      amount: `₫${firstOrderDiscountAmount.toLocaleString()}`
                    })}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 영업 종료 뱃지 - 프로모션/평점과 동일한 Y축 위치 */}
        {!isOpen && !hasPromotion && (
          <View className="absolute top-3 left-3">
            <View
              className="flex-row items-center px-3 py-2 rounded-xl"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
              }}
            >
              <Text className="text-white text-xs font-bold">
                {t('store:status.closed')}
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  </Animated.View>
));

// ===== 리스트형 뷰 컴포넌트 =====
const ListView = memo(({
  store,
  storeName,
  logoUrl,
  rating,
  reviewCount,
  estimatedDeliveryTime,
  deliveryFee,
  isOpen,
  couponsCount,
  isPickupAvailable,
  isMembershipStore,
  showFreeDelivery,
  originalDeliveryFee,
  hasPromotion,
  showTags,
  rank,
  onPress,
  navigation,
  scaleAnim,
  handlePressIn,
  handlePressOut,
  t,
  testID,
  className,
  theme,
  isDarkMode
}) => (
  <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        if (onPress) {
          onPress(store);
        } else if (navigation) {
          navigation.navigate('StoreDetail', { storeId: store?.id });
        }
      }}
      className={`px-4 py-3 ${className}`}
      style={{ backgroundColor: theme.bgCard }}
      testID={testID}
      activeOpacity={0.95}
    >
      <View className="flex-row">
        {/* 좌측: 프로필 이미지 */}
        <View className="relative mr-3">
          <View
            className="w-24 h-24 rounded-2xl overflow-hidden"
            style={{
              backgroundColor: theme.bgInput,
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: theme.shadowOpacity,
              shadowRadius: 8,
              elevation: 3
            }}
          >
            <OptimizedImage
              source={logoUrl ? { uri: logoUrl } : LOGO_PLACEHOLDER}
              style={{
                width: '100%',
                height: '100%',
                opacity: !isOpen ? 0.5 : 1
              }}
              resizeMode={OptimizedImage.resizeMode?.cover || 'cover'}
              fallbackSource={LOGO_PLACEHOLDER}
              placeholder="shimmer"
              showLoader={false}
            />
          </View>

          {/* 순위 뱃지 */}
          {rank && (
            <View
              className="absolute -top-1 -left-1 rounded-lg px-2 py-0.5"
              style={{
                backgroundColor: theme.bgCard,
                shadowColor: theme.shadow,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: theme.shadowOpacity,
                shadowRadius: 2,
                elevation: 2
              }}
            >
              <Text className="text-xs font-bold" style={{ color: theme.textPrimary }}>
                {rank}{t('store:rank')}
              </Text>
            </View>
          )}
        </View>

        {/* 우측: 매장 정보 */}
        <View className={`flex-1 justify-center ${!isOpen ? 'opacity-60' : ''}`}>
          {/* 1행: 매장명 + 평점 */}
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-bold flex-1 mr-2" style={{ color: theme.textPrimary }} numberOfLines={1}>
              {storeName}
            </Text>
            <View className="flex-row items-center">
              <Icon name="star" size={16} color="#FFD700" />
              <Text className="text-sm font-bold ml-0.5" style={{ color: theme.textPrimary }}>
                {rating > 0 ? rating.toFixed(1) : t('store:card.new')}
              </Text>
              <Text className="text-xs ml-0.5" style={{ color: theme.textMuted }}>
                ({reviewCount})
              </Text>
            </View>
          </View>

          {/* 2행: 무료배달 정보 */}
          <View className="flex-row items-center mb-1">
            {showFreeDelivery ? (
              <>
                <Text className="text-sm font-semibold" style={{ color: isDarkMode ? '#A78BFA' : '#8B5CF6' }}>
                  {t('store:card.freeDeliveryApplied')}
                </Text>
                {originalDeliveryFee > 0 && (
                  <Text className="text-sm ml-2 line-through" style={{ color: theme.textDisabled }}>
                    ₫{originalDeliveryFee.toLocaleString()}
                  </Text>
                )}
              </>
            ) : (
              <Text className="text-sm" style={{ color: theme.textSecondary }}>
                {t('store:deliveryFee')}: ₫{deliveryFee.toLocaleString()}
              </Text>
            )}
          </View>

          {/* 3행: 배달 시간 */}
          <View className="flex-row items-center mb-2">
            <Ionicons name="home-outline" size={14} color={theme.primary} />
            <Text className="text-sm ml-1" style={{ color: theme.textSecondary }}>
              {t('common:time.about')} {estimatedDeliveryTime}{t('common:time.minutes')}
            </Text>
          </View>

          {/* 4행: 태그들 */}
          {showTags && (
            <View className="flex-row items-center flex-wrap gap-1.5">
              {isMembershipStore && (
                <View className="rounded px-2 py-1 flex-row items-center" style={{ backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)' }}>
                  <MaterialCommunityIcons name="star-circle" size={12} color={ACCENT_COLORS.emerald} />
                  <Text className="text-[10px] font-semibold ml-0.5" style={{ color: ACCENT_COLORS.emerald }}>
                    {t('store:badges.membership')}
                  </Text>
                </View>
              )}

              {couponsCount > 0 && (
                <View className="rounded px-2 py-1 flex-row items-center" style={{ borderWidth: 1, borderColor: theme.border }}>
                  <Text className="text-[10px] font-medium" style={{ color: theme.textSecondary }}>
                    {t('store:badges.maxCoupon', { amount: '₫3,000' })}
                  </Text>
                </View>
              )}

              {isPickupAvailable && (
                <View className="rounded px-2 py-1 flex-row items-center" style={{ borderWidth: 1, borderColor: theme.border }}>
                  <Text className="text-[10px] font-medium" style={{ color: theme.textSecondary }}>
                    {t('store:badges.pickupAvailable')}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  </Animated.View>
));

// ===== 메인 StoreCard 컴포넌트 =====
const StoreCard = memo(({
  store,
  onPress,
  onFavoritePress,
  navigation,
  variant = 'card', // 'card' | 'list'
  rank,
  showTags = true,
  className = '',
  testID
}) => {
  // Early return for invalid store data
  if (!store || typeof store !== 'object') {
    console.warn('[StoreCard] Invalid store data:', store);
    return null;
  }

  const { t } = useTranslation(['common', 'store', 'categories']);
  const { isDarkMode, colors: theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // 마운트 애니메이션 (카드형에서만)
  useEffect(() => {
    if (variant === 'card') {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [variant]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: variant === 'card' ? 0.965 : 0.98,
      friction: 8,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // 안전한 데이터 처리
  const coverImage = store?.coverImage || store?.bannerUrl || null;
  const logoUrl = store?.logoUrl || store?.profileImage || store?.coverImage || null;
  const storeName = store?.nameKo || store?.name || '';
  const rating = store?.rating || 0;
  const reviewCount = store?.reviewCount || store?.totalRatings || 0;

  // 카테고리 번역 처리
  const cuisineType = store?.cuisineType
    ? t(`categories:categoryShort.${store.cuisineType}`, {
        defaultValue: store?.category?.nameKo || store?.category?.name || t('store:general')
      })
    : (store?.category?.nameKo || store?.category?.name || store?.description || t('store:defaultDescription'));

  const estimatedDeliveryTime = store?.estimatedDeliveryTime || '25-35';
  const deliveryFee = store?.deliveryFee || 0;
  const minOrderAmount = store?.minOrderAmount || 0;
  const distance = store?.distance || null;
  // isOpen이 명시적으로 false이거나 status가 CLOSED일 때만 영업종료로 표시
  const isOpen = store?.isOpen === false || store?.status === 'CLOSED' ? false : true;
  const isFavorite = store?.isFavorite || false;
  const isFeatured = store?.isFeatured || store?.isPromoted || false;
  const promotion = store?.promotion;
  const couponsCount = store?.coupons?.length || store?.couponsCount || 0;
  const isFirstOrderDiscount = store?.isFirstOrderDiscount || store?.firstOrderDiscount || false;
  const firstOrderDiscountAmount = store?.firstOrderDiscountAmount || 5000;
  const isNew = store?.isNewStore || store?.isNew || false;
  const isFastDelivery = store?.estimatedDeliveryTime && parseInt(store.estimatedDeliveryTime) <= 25;
  const isPickupAvailable = store?.isPickupAvailable || store?.pickupAvailable || false;
  const isMembershipStore = store?.isMembershipStore || store?.membershipStore || false;

  // 배지 표시 여부
  const showFreeDelivery = deliveryFee === 0;
  const hasPromotion = !!promotion || store?.hasActivePromotion;
  const originalDeliveryFee = store?.originalDeliveryFee || (showFreeDelivery && deliveryFee === 0 ? 3700 : deliveryFee);

  // 공통 props
  const commonProps = {
    store,
    storeName,
    logoUrl,
    rating,
    reviewCount,
    estimatedDeliveryTime,
    deliveryFee,
    isOpen,
    showTags,
    scaleAnim,
    handlePressIn,
    handlePressOut,
    t,
    testID,
    className,
    theme,
    isDarkMode,
  };

  if (variant === 'list') {
    return (
      <ListView
        {...commonProps}
        couponsCount={couponsCount}
        isPickupAvailable={isPickupAvailable}
        isMembershipStore={isMembershipStore}
        showFreeDelivery={showFreeDelivery}
        originalDeliveryFee={originalDeliveryFee}
        hasPromotion={hasPromotion}
        rank={rank}
        onPress={onPress}
        navigation={navigation}
      />
    );
  }

  return (
    <CardView
      {...commonProps}
      coverImage={coverImage}
      cuisineType={cuisineType}
      minOrderAmount={minOrderAmount}
      distance={distance}
      isFavorite={isFavorite}
      isFeatured={isFeatured}
      isNew={isNew}
      isFastDelivery={isFastDelivery}
      hasPromotion={hasPromotion}
      promotion={promotion}
      couponsCount={couponsCount}
      showFreeDelivery={showFreeDelivery}
      isFirstOrderDiscount={isFirstOrderDiscount}
      firstOrderDiscountAmount={firstOrderDiscountAmount}
      onPress={onPress}
      onFavoritePress={onFavoritePress}
    />
  );
});

StoreCard.displayName = 'StoreCard';

export default StoreCard;
