/**
 * PremiumStoreCard - "Ethereal Float" Design v11.0
 * 떠있는 듯한 미니멀 프리미엄 카드 디자인
 *
 * Design System:
 * - 커버 이미지: 상하좌우 완전 라운드
 * - 정보 영역: 배경 없이 투명하게 떠있는 느낌
 * - 로고: 이미지와 정보를 연결하는 시각적 앵커
 * - 텍스트: 미세한 그림자로 가독성 확보
 */
import React, { memo, useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  Animated,
  Image,
  Dimensions,
  StyleSheet
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import OptimizedImage from '@shared/components/ui/images/OptimizedImage';
import { useTheme } from '@providers/ThemeProvider';

// 고정 액센트 컬러 (테마와 무관하게 의미적으로 고정)
const ACCENT_COLORS = {
  gold: '#F59E0B',      // 평점 배경
  goldLight: '#FCD34D', // 평점 별
  coral: '#F97316',     // HOT 배지
  error: '#EF4444',     // Closed, Sale, Heart
  success: '#10B981',   // NEW 배지
};

// 플레이스홀더 이미지
const STORE_PLACEHOLDER = require('@assets/images/store-placeholder.png');

const PremiumStoreCard = memo(({ store, onPress, navigation, width = 65, fullWidth = false, showFavoriteIcon = false, className = '', index = 0 }) => {
  const { t } = useTranslation(['common', 'store', 'categories']);
  const { colors: theme } = useTheme();

  // 애니메이션 값들
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;

  // 순차적 페이드인 애니메이션
  useEffect(() => {
    const delay = Math.min(index * 80, 400);

    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        tension: 60,
        friction: 10,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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
  const backgroundImage = store?.profileImage || store?.coverImage || null;
  const storeName = store?.nameKo || store?.name || '';

  // rating 처리
  const rawRating = store?.rating ?? store?.averageRating ?? null;
  const rating = typeof rawRating === 'number' ? rawRating : null;
  const reviewCount = store?.reviewCount || store?.totalRatings || 0;

  const estimatedDeliveryTime = store?.estimatedDeliveryTime || '25-35';
  const deliveryFee = store?.deliveryFee ?? 0;
  const minOrderAmount = store?.minOrderAmount || 0;

  // 영업 상태
  const isOpen = store?.isOpen === false || store?.status === 'CLOSED' ? false : true;

  // 배지 정보
  const isFeatured = store?.isFeatured || store?.isRecommended || false;
  const isNew = store?.isNewStore || store?.isNew ||
    (store?.createdAt && (Date.now() - new Date(store.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000);
  const showFreeDelivery = deliveryFee === 0;
  const hasPromotion = store?.hasPromotion || store?.promotions?.length > 0 ||
    store?.activePromotion || store?.promotion;
  const promotionDiscount = store?.promotion?.discountPercentage ||
    store?.activePromotion?.discountPercentage ||
    store?.promotions?.[0]?.discountPercentage || 0;

  // 클릭 핸들러
  const handlePress = () => {
    if (onPress) {
      onPress(store);
    } else if (navigation) {
      navigation.navigate('StoreDetail', { storeId: store.id });
    }
  };

  // 레이아웃 계산 (16:9 비율) - 좌우 패딩 12px씩 = 24px
  const cardWidth = fullWidth ? SCREEN_WIDTH - 24 : width;
  const imageHeight = (cardWidth * 9) / 16;
  const imageRadius = fullWidth ? 10 : 6;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          width: fullWidth ? '100%' : cardWidth,
          marginRight: fullWidth ? 0 : 12,
          marginBottom: fullWidth ? 12 : 0,
          paddingHorizontal: fullWidth ? 12 : 0,
          borderBottomWidth: fullWidth ? 0.5 : 0,
          borderBottomColor: fullWidth ? theme.border : 'transparent',
          opacity: cardOpacity,
          transform: [
            { translateY: cardTranslateY },
            { scale: scaleAnim },
          ],
        }
      ]}
    >
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={1}
        style={styles.touchContainer}
      >
        {/* ===== 커버 이미지 (완전 라운드) ===== */}
        <View style={[
          styles.imageContainer,
          {
            height: imageHeight,
            borderRadius: imageRadius,
          }
        ]}>
          {/* 배경 이미지 */}
          {backgroundImage ? (
            <OptimizedImage
              source={{ uri: backgroundImage }}
              style={[
                styles.coverImage,
                { borderRadius: imageRadius, opacity: !isOpen ? 0.5 : 1 }
              ]}
              resizeMode={OptimizedImage.resizeMode.cover}
              fallbackSource={STORE_PLACEHOLDER}
              placeholder="shimmer"
              showLoader={false}
            />
          ) : (
            <Image
              source={STORE_PLACEHOLDER}
              style={[
                styles.coverImage,
                { borderRadius: imageRadius, opacity: !isOpen ? 0.5 : 1 }
              ]}
              resizeMode="cover"
            />
          )}

          {/* 이미지 오버레이 그라데이션 */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={[styles.imageOverlay, { borderRadius: imageRadius }]}
          />

          {/* 평점 배지 */}
          <View style={styles.ratingContainer}>
            <View style={[
              styles.ratingBadge,
              { backgroundColor: rating >= 4.5 ? ACCENT_COLORS.gold : 'rgba(0,0,0,0.6)' }
            ]}>
              <Icon
                name="star"
                size={10}
                color={rating >= 4.5 ? '#FFF' : ACCENT_COLORS.goldLight}
              />
              <Text style={styles.ratingText}>
                {rating !== null && rating > 0 ? rating.toFixed(1) : 'New'}
              </Text>
            </View>
          </View>

          {/* 영업 종료 배지 */}
          {!isOpen && (
            <View style={styles.closedContainer}>
              <View style={styles.closedBadge}>
                <Text style={styles.closedText}>
                  {t('store:status.closed', 'Closed')}
                </Text>
              </View>
            </View>
          )}

          {/* 즐겨찾기 아이콘 */}
          {showFavoriteIcon && (
            <View style={styles.favoriteContainer}>
              <View style={styles.favoriteButton}>
                <Ionicons name="heart" size={12} color={ACCENT_COLORS.error} />
              </View>
            </View>
          )}
        </View>

        {/* ===== 정보 영역 (배경 없음) ===== */}
        <View style={styles.infoContainer}>
          {/* 매장명 */}
          <Text
            style={[
              styles.storeName,
              { fontSize: fullWidth ? 17 : 14, color: theme.textPrimary }
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {storeName}
          </Text>

          {/* 배달 정보 (1줄 표시) */}
          <Text style={[styles.deliveryText, { color: theme.textSecondary }]} numberOfLines={1}>
            {estimatedDeliveryTime}{t('common:time.min', '분')} · ₫{(deliveryFee / 1000).toFixed(0)}K · {t('store:card.minOrderLabel', '최소')} ₫{(minOrderAmount / 1000).toFixed(0)}K
          </Text>

          {/* 배지들 (간소화) */}
          <View style={styles.badgesRow}>
            {isNew && (
              <View style={[styles.badge, { backgroundColor: ACCENT_COLORS.success }]}>
                <Text style={styles.badgeText}>NEW</Text>
              </View>
            )}

            {isFeatured && !isNew && (
              <View style={[styles.badge, { backgroundColor: ACCENT_COLORS.coral }]}>
                <Text style={styles.badgeText}>HOT</Text>
              </View>
            )}

            {showFreeDelivery && (
              <View style={[styles.badgeOutline, { borderColor: theme.primary }]}>
                <Text style={[styles.badgeOutlineText, { color: theme.primary }]}>
                  Free
                </Text>
              </View>
            )}

            {hasPromotion && (
              <View style={[styles.badge, { backgroundColor: ACCENT_COLORS.error }]}>
                <Text style={styles.badgeText}>
                  {promotionDiscount > 0 ? `-${promotionDiscount / 100}%` : 'Sale'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
  },
  touchContainer: {
    // 터치 영역
  },

  // ===== 이미지 영역 =====
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // 평점
  ratingContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },

  // 영업종료
  closedContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  closedBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  closedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },

  // 즐겨찾기
  favoriteContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  favoriteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  // ===== 정보 영역 (배경 없음) =====
  infoContainer: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 4,
  },
  storeName: {
    color: '#F1F5F9',
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 20,
    marginBottom: 4,
  },

  // 배달 정보 (1줄)
  deliveryText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 8,
  },

  // 배지들
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    minHeight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  badgeOutline: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
    minHeight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeOutlineText: {
    fontSize: 8,
    fontWeight: '600',
  },
});

PremiumStoreCard.displayName = 'PremiumStoreCard';

export default PremiumStoreCard;
