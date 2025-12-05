/**
 * HorizontalStoreCard - 혁신적인 "Living Card" 가로 스크롤 버전 v7.0
 * 디자인 컨셉: Organic Luxury (유기적 고급스러움)
 *
 * 홈스크린 가로 스크롤 섹션용 컴팩트 카드
 * - 3D 떠 있는 효과
 * - 글래스모피즘 오버레이
 * - 부드러운 마이크로 인터랙션
 *
 * UI 구조:
 * ┌─────────────────────────────────────────┐
 * │  [coverImage - 전체 높이]               │
 * │  ┌──────┐                    ┌────────┐ │
 * │  │🔥20%│                    │⭐ 4.8  │ │
 * │  └──────┘                    └────────┘ │
 * │                                         │
 * │  ╔═══════════════════════════════════╗  │
 * │  ║ [글래스모피즘 정보 패널]          ║  │
 * │  ║ ┌────┐ **매장명**                 ║  │
 * │  ║ │logo│ 한식 • 1.2km • 영업중      ║  │
 * │  ║ └────┘                            ║  │
 * │  ║ ──────────────────────────────    ║  │
 * │  ║ 🕐 25분  🚚 무료  [빠른배달]      ║  │
 * │  ╚═══════════════════════════════════╝  │
 * └─────────────────────────────────────────┘
 */
import React, { memo, useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  Animated
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
  console.log('[HorizontalStoreCard] Placeholder image not found');
}

// 액센트 컬러 (고정)
const ACCENT_COLORS = {
  accent: '#FFDD00',
  error: '#EF4444',
  orange: '#F97316',
  purple: '#8B5CF6',
  emerald: '#10B981',
};

const HorizontalStoreCard = memo(({
  store,
  navigation,
  width = 260,
  showFavoriteIcon = false,
  onPress,
  onFavoritePress
}) => {
  const { t } = useTranslation(['common', 'store', 'categories']);
  const { isDarkMode, colors: theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // 마운트 애니메이션
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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

  const handlePress = () => {
    if (onPress) {
      onPress(store);
    } else if (navigation) {
      navigation.navigate('StoreDetail', { storeId: store?.id });
    }
  };

  // 안전한 데이터 처리
  const coverImage = store?.coverImage || null;
  const logoUrl = store?.logoUrl || store?.profileImage || null;
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
  const distance = store?.distance || null;
  // isOpen이 명시적으로 false이거나 status가 CLOSED일 때만 영업종료로 표시
  const isOpen = store?.isOpen === false || store?.status === 'CLOSED' ? false : true;
  const isFavorite = store?.isFavorite || false;
  const isFeatured = store?.isFeatured || false;
  const promotion = store?.promotion;
  const isNew = store?.isNewStore || false;

  // 배지 표시 여부
  const isFastDelivery = store?.estimatedDeliveryTime && parseInt(store.estimatedDeliveryTime) <= 25;
  const showFreeDelivery = deliveryFee === 0;
  const hasPromotion = !!promotion || store?.hasActivePromotion;

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        width: width,
        marginRight: 16,
      }}
    >
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        className="overflow-hidden"
        activeOpacity={1}
        style={{
          borderRadius: 20,
          backgroundColor: theme.bgCard,
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        {/* 메인 이미지 영역 */}
        <View className="relative" style={{ height: 200 }}>
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
            colors={['rgba(0,0,0,0.3)', 'transparent']}
            className="absolute top-0 left-0 right-0"
            style={{ height: 60 }}
          />

          {/* 하단 대형 그라데이션 */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.85)']}
            locations={[0, 0.35, 1]}
            className="absolute bottom-0 left-0 right-0"
            style={{ height: 150 }}
          />

          {/* 상단 좌측: 프로모션/신규 뱃지 */}
          <View className="absolute top-2.5 left-2.5 flex-row gap-1.5">
            {hasPromotion && (
              <View
                className="flex-row items-center px-2.5 py-1.5 rounded-lg"
                style={{
                  backgroundColor: ACCENT_COLORS.error,
                  shadowColor: ACCENT_COLORS.error,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <MaterialCommunityIcons name="fire" size={12} color="#FFF" />
                <Text className="text-white text-[10px] font-black ml-1">
                  {promotion?.discountPercent
                    ? `${promotion.discountPercent}%`
                    : t('common:discount')
                  }
                </Text>
              </View>
            )}

            {isNew && !hasPromotion && (
              <View
                className="flex-row items-center px-2.5 py-1.5 rounded-lg"
                style={{
                  backgroundColor: ACCENT_COLORS.emerald,
                  shadowColor: ACCENT_COLORS.emerald,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <MaterialCommunityIcons name="new-box" size={12} color="#FFF" />
                <Text className="text-white text-[10px] font-black ml-1">
                  {t('store:card.new')}
                </Text>
              </View>
            )}

            {isFeatured && !hasPromotion && !isNew && (
              <View
                className="flex-row items-center px-2.5 py-1.5 rounded-lg"
                style={{
                  backgroundColor: ACCENT_COLORS.accent,
                  shadowColor: ACCENT_COLORS.accent,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <Icon name="star" size={12} color="#000" />
                <Text className="text-black text-[10px] font-black ml-1">
                  {t('store:badges.recommended')}
                </Text>
              </View>
            )}
          </View>

          {/* 상단 우측: 평점 뱃지 */}
          <View className="absolute top-2.5 right-2.5">
            <View
              className="flex-row items-center px-2.5 py-1.5 rounded-lg"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.12,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <Icon name="star" size={14} color={ACCENT_COLORS.accent} />
              <Text className="text-gray-900 text-xs font-black ml-0.5">
                {rating > 0 ? rating.toFixed(1) : t('store:card.new')}
              </Text>
              {reviewCount > 0 && (
                <Text className="text-gray-400 text-[10px] ml-0.5">
                  ({reviewCount > 99 ? '99+' : reviewCount})
                </Text>
              )}
            </View>
          </View>

          {/* 즐겨찾기 아이콘 */}
          {showFavoriteIcon && onFavoritePress && (
            <TouchableOpacity
              onPress={() => onFavoritePress?.(store)}
              className="absolute top-2.5"
              style={{
                right: rating > 0 ? 80 : 65,
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: isFavorite ? theme.primary : 'rgba(255, 255, 255, 0.25)',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: isFavorite ? theme.primary : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 3,
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={16}
                color={isFavorite ? '#FFFFFF' : 'rgba(255,255,255,0.9)'}
              />
            </TouchableOpacity>
          )}

          {/* 하단: 글래스모피즘 정보 패널 */}
          <View className="absolute bottom-0 left-0 right-0 px-3 pb-3">
            {/* 로고 + 매장 정보 */}
            <View className="flex-row items-center mb-2">
              {/* 로고 이미지 */}
              {logoUrl && (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: '#FFFFFF',
                    overflow: 'hidden',
                    marginRight: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 6,
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.85)',
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
              <View className="flex-1">
                <Text
                  className="text-white text-base font-black mb-0.5"
                  numberOfLines={1}
                  style={{
                    textShadowColor: 'rgba(0, 0, 0, 0.5)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }}
                >
                  {storeName}
                </Text>
                <View className="flex-row items-center flex-wrap">
                  <Text className="text-white/75 text-[11px] font-medium">
                    {cuisineType}
                  </Text>
                  {distance && (
                    <>
                      <View className="w-1 h-1 rounded-full bg-white/40 mx-1.5" />
                      <Text className="text-white/75 text-[11px] font-medium">
                        {distance.toFixed(1)}km
                      </Text>
                    </>
                  )}
                  <View className="w-1 h-1 rounded-full bg-white/40 mx-1.5" />
                  <View className="flex-row items-center">
                    <View
                      className={`w-1.5 h-1.5 rounded-full mr-1 ${isOpen ? 'bg-green-400' : 'bg-gray-400'}`}
                      style={{
                        shadowColor: isOpen ? '#4ADE80' : '#9CA3AF',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.7,
                        shadowRadius: 3,
                      }}
                    />
                    <Text className={`text-[10px] font-semibold ${isOpen ? 'text-green-400' : 'text-gray-400'}`}>
                      {isOpen ? t('store:status.open') : t('store:status.closed')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 구분선 */}
            <View
              className="mb-2"
              style={{
                height: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
              }}
            />

            {/* 배달 정보 + 태그 */}
            <View className="flex-row items-center justify-between">
              {/* 배달 시간 */}
              <View className="flex-row items-center">
                <View
                  className="w-6 h-6 rounded-lg items-center justify-center mr-1.5"
                  style={{ backgroundColor: `${theme.primary}40` }}
                >
                  <Ionicons name="time" size={12} color={theme.primary} />
                </View>
                <Text className="text-white text-[11px] font-bold">
                  {estimatedDeliveryTime}{t('common:time.minutes')}
                </Text>
              </View>

              {/* 배달비 */}
              <View className="flex-row items-center">
                <View
                  className="w-6 h-6 rounded-lg items-center justify-center mr-1.5"
                  style={{ backgroundColor: `${theme.secondary}40` }}
                >
                  <MaterialCommunityIcons name="bike-fast" size={12} color={theme.secondary} />
                </View>
                <Text className="text-white text-[11px] font-bold">
                  {deliveryFee > 0
                    ? `₫${deliveryFee.toLocaleString()}`
                    : t('store:card.free')
                  }
                </Text>
              </View>

              {/* 태그 (빠른배달 또는 무료배달) */}
              {(isFastDelivery || showFreeDelivery) && (
                <View
                  className="flex-row items-center px-2 py-1 rounded-md"
                  style={{
                    backgroundColor: isFastDelivery
                      ? `${theme.primary}4D`
                      : `${theme.secondary}4D`,
                  }}
                >
                  <Ionicons
                    name={isFastDelivery ? "flash" : "gift"}
                    size={10}
                    color={isFastDelivery ? theme.primary : theme.secondary}
                  />
                  <Text
                    className="text-[9px] font-bold ml-0.5"
                    style={{ color: isFastDelivery ? theme.primary : theme.secondary }}
                  >
                    {isFastDelivery
                      ? t('store:badges.fastDelivery')
                      : t('store:card.freeDelivery')
                    }
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 영업 종료 뱃지 - 이미지 중앙 하단 */}
          {!isOpen && (
            <View className="absolute bottom-16 left-0 right-0 items-center">
              <View
                className="px-4 py-2 rounded-xl"
                style={{ backgroundColor: 'rgba(75, 85, 99, 0.9)' }}
              >
                <Text className="text-white text-sm font-bold">
                  {t('store:status.closed')}
                </Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

HorizontalStoreCard.displayName = 'HorizontalStoreCard';

export default HorizontalStoreCard;
