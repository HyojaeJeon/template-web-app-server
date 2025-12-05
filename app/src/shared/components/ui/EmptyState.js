/**
 * EmptyState - 통합 빈 상태 컴포넌트
 * 모든 빈 상태 화면을 하나의 컴포넌트로 관리
 * 장바구니 EmptyState 디자인 패턴 준수
 */
import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '@providers/ToastProvider';
import { useTheme } from '@providers/ThemeProvider';
import StandardButton from '@shared/components/ui/buttons/StandardButton';

const EmptyState = memo(function EmptyState({
  // 타입 설정
  type = 'default',
  variant, // 'simple' for store detail tabs

  // 커스텀 설정 (타입 설정을 오버라이드)
  icon,
  iconSize = 80,
  iconColor,
  backgroundColor,
  title,
  description,
  primaryAction,
  secondaryActions,
  tips,

  // 기능 설정
  onRefresh,
  refreshing = false,
  showRefresh = true,

  // 스타일
  style = {},
  containerStyle = {},

  // 테스트
  testID = 'empty-state',

  ...props
}) {
  // 테마 훅 사용
  const { isDarkMode, colors: theme } = useTheme();

  // 안전한 translation 훅 사용
  let t = null;
  try {
    const translation = useTranslation();
    t = translation?.t;
    if (typeof t !== 'function') {
      t = (key, fallback = key) => fallback;
    }
  } catch (error) {
    console.warn('EmptyState: Translation not available:', error);
    t = (key, fallback = key) => fallback;
  }

  // 안전한 Toast 훅 사용
  let showToast = null;
  try {
    const toastContext = useToast();
    showToast = toastContext?.showToast;
  } catch (error) {
    console.warn('EmptyState: Toast context not available:', error);
    showToast = () => console.log('Toast not available');
  }

  // Safe navigation
  let navigation = null;
  try {
    navigation = useNavigation();
  } catch (error) {
    console.warn('EmptyState: Navigation context not found');
  }

  // Safe navigation helper function
  const safeNavigate = useCallback((routeName, params = {}) => {
    if (navigation) {
      try {
        navigation.navigate(routeName, params);
      } catch (error) {
        console.error(`EmptyState: Navigation to ${routeName} failed:`, error);
        showToast('OPERATION_FAILED');
      }
    } else {
      console.warn('EmptyState: Navigation not available');
      // Optional: You might want to show a different toast message for navigation not available
      // showToast('NAVIGATION_NOT_AVAILABLE');
    }
  }, [navigation, showToast])

  // 심플 디자인 (매장 상세 전용) - 아이콘 그림자 + 민트 타이틀
  const simpleDesign = variant === 'simple';

  // 타입별 기본 설정
  const typeConfigs = useMemo(() => ({
    // 기본
    default: {
      icon: 'inbox-outline',
      iconColor: theme.textMuted,
      backgroundColor: isDarkMode ? theme.bgTertiary : '#9CA3AF20',
      title: t('common:emptyTitle'),
      description: t('common:emptyDescription')
    },

    // 장바구니 (개선된 디자인 v2)
    cart: {
      icon: 'cart-outline',        // 장바구니 아이콘 (직관적)
      iconColor: theme.primary,     // 브랜드 컬러
      backgroundColor: theme.bgSecondary,   // 테마 기반 배경
      title: t('cart:empty.title', t('cart:emptyTitle')),
      description: t('cart:empty.description', t('cart:emptyDescription')),
      primaryAction: {
        label: t('cart:browseStores'),
        icon: 'store-search',
        onPress: () => {
          // Tab Navigator로 StoreTab 이동
          if (navigation) {
            navigation.navigate('StoreTab');
          }
        }
      },
      secondaryActions: [
        {
          label: t('cart:viewRecentOrders'),
          icon: 'clock-outline',
          onPress: () => {
            // ProfileTab 내의 OrderHistory로 이동
            if (navigation) {
              navigation.navigate('ProfileTab', { screen: 'OrderHistory' });
            }
          },
          variant: 'outline'
        },
        {
          label: t('common:refresh'),
          icon: 'refresh',
          onPress: null, // onRefresh prop으로 처리됨
          variant: 'outline'
        }
      ],
      enhancedDesign: true
    },

    // 주문 - 진행중 (개선된 디자인)
    'order-ongoing': {
      icon: 'clipboard-text-outline',    // Vector 아이콘
      iconColor: isDarkMode ? theme.secondary : '#00695C',  // 브랜드 딥그린
      backgroundColor: theme.bgSecondary,         // 테마 기반 배경
      title: t('order:emptyOngoing'),
      description: t('order:emptyOngoingDesc'),
      primaryAction: {
        label: t('order:startOrdering'),
        icon: 'store-search',
        onPress: () => {
          if (navigation) {
            navigation.navigate('StoreTab');
          }
        }
      },
      secondaryActions: [
        {
          label: t('order:viewHistory'),
          icon: 'history',
          onPress: () => {
            // ProfileTab 내의 OrderHistory로 이동
            if (navigation) {
              navigation.navigate('ProfileTab', { screen: 'OrderHistory' });
            }
          },
          variant: 'outline'
        }
      ],
      enhancedDesign: true
    },

    // 주문 - 내역 (개선된 디자인)
    'order-history': {
      icon: 'receipt-text-outline',      // Vector 아이콘
      iconColor: isDarkMode ? theme.secondary : '#00695C',  // 브랜드 딥그린
      backgroundColor: theme.bgSecondary,         // 테마 기반 배경
      title: t('order:emptyHistory'),
      description: t('order:emptyHistoryDesc'),
      primaryAction: {
        label: t('order:makeFirstOrder'),
        icon: 'food-variant',
        onPress: () => {
          if (navigation) {
            navigation.navigate('StoreTab');
          }
        }
      },
      enhancedDesign: true
    },

    // 홈 - 매장 없음
    'home-no-stores': {
      icon: 'store-off',
      iconColor: theme.primary,
      backgroundColor: theme.primaryLight,
      title: t('home.emptyState.noStores.title'),
      description: t('home.emptyState.noStores.description'),
      primaryAction: {
        label: t('home.emptyState.noStores.action'),
        icon: 'map-marker',
        onPress: () => safeNavigate('LocationScreen')
      }
    },

    // 홈 - 검색 결과 없음
    'home-search': {
      icon: 'magnify-off',
      iconColor: theme.textSecondary,
      backgroundColor: isDarkMode ? theme.bgTertiary : '#6B728020',
      title: t('home.emptyState.noSearchResults.title'),
      description: t('home.emptyState.noSearchResults.description'),
      primaryAction: {
        label: t('home.emptyState.noSearchResults.action'),
        icon: 'magnify',
        onPress: () => safeNavigate('SearchScreen')
      }
    },

    // 홈 - 오프라인
    'home-offline': {
      icon: 'wifi-off',
      iconColor: theme.error,
      backgroundColor: theme.errorLight,
      title: t('home.emptyState.offline.title'),
      description: t('home.emptyState.offline.description'),
      primaryAction: {
        label: t('home.emptyState.offline.action'),
        icon: 'refresh',
        onPress: onRefresh
      }
    },

    // 홈 - 오류
    'home-error': {
      icon: 'alert-circle-outline',
      iconColor: theme.warning,
      backgroundColor: theme.warningLight,
      title: t('home.emptyState.error.title'),
      description: t('home.emptyState.error.description'),
      primaryAction: {
        label: t('home.emptyState.error.action'),
        icon: 'refresh',
        onPress: onRefresh
      }
    },

    // 리뷰
    'review': {
      icon: 'star-off',
      iconColor: theme.star,
      backgroundColor: isDarkMode ? theme.bgTertiary : '#FFA50020',
      title: t('review:emptyTitle'),
      description: t('review:emptyDescription'),
      primaryAction: {
        label: t('review:writeReview'),
        icon: 'pencil',
        onPress: () => safeNavigate('WriteReview')
      }
    },

    // 알림
    'notification': {
      icon: 'bell-off-outline',
      iconColor: theme.textMuted,
      backgroundColor: isDarkMode ? theme.bgTertiary : '#9CA3AF20',
      title: t('notification:emptyTitle'),
      description: t('notification:emptyDescription')
    },

    // 쿠폰 - 내 쿠폰
    'coupon-my': {
      icon: 'ticket-percent-outline',
      iconColor: theme.primary,
      backgroundColor: theme.primaryLight,
      title: t('coupon.emptyStates.myEmpty.title'),
      description: t('coupon.emptyStates.myEmpty.description'),
      primaryAction: {
        label: t('coupon.emptyStates.myEmpty.actionText'),
        icon: 'gift',
        onPress: () => safeNavigate('CouponAvailable')
      }
    },

    // 쿠폰 - 받을 수 있는 쿠폰
    'coupon-available': {
      icon: 'gift-outline',
      iconColor: theme.success,
      backgroundColor: theme.successLight,
      title: t('coupon.emptyStates.availableEmpty.title'),
      description: t('coupon.emptyStates.availableEmpty.description')
    },

    // 주소
    'address': {
      icon: 'map-marker-off',
      iconColor: theme.primary,
      backgroundColor: theme.primaryLight,
      title: t('address:emptyTitle'),
      description: t('address:emptyDescription'),
      primaryAction: {
        label: t('address:addAddress'),
        icon: 'map-marker-plus',
        onPress: () => safeNavigate('AddAddress')
      }
    },

    // 결제 내역
    'payment-history': {
      icon: 'credit-card-off-outline',
      iconColor: theme.textSecondary,
      backgroundColor: isDarkMode ? theme.bgTertiary : '#6B728020',
      title: t('payment:emptyHistory'),
      description: t('payment:emptyHistoryDesc'),
      primaryAction: {
        label: t('payment:startOrdering'),
        icon: 'store-search',
        onPress: () => safeNavigate('Home')
      }
    },

    // 포인트 내역 (개선된 디자인)
    'points-history': {
      icon: 'star-outline',              // Vector 아이콘
      iconColor: theme.gold,               // 포인트 골드색
      backgroundColor: theme.bgSecondary,         // 테마 기반 배경
      title: t('point:emptyHistory'),
      description: t('point:emptyHistoryDesc'),
      primaryAction: {
        label: t('point:startOrdering'),
        icon: 'store-search',
        onPress: () => {
          if (navigation) {
            navigation.navigate('StoreTab');
          }
        }
      },
      secondaryActions: [
        {
          label: t('common:refresh'),
          icon: 'refresh',
          onPress: null, // onRefresh prop으로 처리됨
          variant: 'outline'
        }
      ],
      enhancedDesign: true
    },

    // 검색 결과 없음
    'search': {
      icon: 'magnify-off',
      iconColor: theme.textSecondary,
      backgroundColor: isDarkMode ? theme.bgTertiary : '#6B728020',
      title: t('search:emptyTitle'),
      description: t('search:emptyDescription'),
      primaryAction: {
        label: t('search:clearSearch'),
        icon: 'close-circle-outline',
        onPress: () => {
          if (navigation) {
            try {
              navigation.goBack();
            } catch (error) {
              console.error('EmptyState: goBack failed:', error);
            }
          }
        }
      }
    },

    // 즐겨찾기 - 매장 (개선된 디자인)
    'favorite-stores': {
      icon: 'heart-off-outline',
      iconColor: theme.error,
      backgroundColor: theme.bgSecondary,
      title: t('favorites:noStores'),
      description: t('favorites:noStoresDesc'),
      primaryAction: {
        label: t('favorites:empty.stores.button'),
        icon: 'store-search',
        onPress: () => {
          if (navigation) {
            navigation.navigate('StoreTab');
          }
        }
      },
      enhancedDesign: true
    },

    // 즐겨찾기 - 메뉴 (개선된 디자인)
    'favorite-menus': {
      icon: 'heart-off-outline',
      iconColor: theme.error,
      backgroundColor: theme.bgSecondary,
      title: t('favorites:noMenus'),
      description: t('favorites:noMenusDesc'),
      primaryAction: {
        label: t('favorites:empty.menus.button'),
        icon: 'food-variant',
        onPress: () => {
          if (navigation) {
            navigation.navigate('PopularMenus');
          }
        }
      },
      enhancedDesign: true
    },

    // 즐겨찾기 - 기본 (개선된 디자인)
    'favorite': {
      icon: 'heart-off-outline',
      iconColor: theme.error,
      backgroundColor: theme.bgSecondary,
      title: t('favorite:emptyTitle'),
      description: t('favorite:emptyDescription'),
      primaryAction: {
        label: t('favorite:browseStores'),
        icon: 'store-search',
        onPress: () => {
          if (navigation) {
            navigation.navigate('StoreTab');
          }
        }
      },
      enhancedDesign: true
    },

    // 저장된 위치
    'saved-locations': {
      icon: 'map-marker-off-outline',
      iconColor: theme.primary,
      backgroundColor: theme.primaryLight,
      title: t('location:emptySavedLocations'),
      description: t('location:emptySavedLocationsDesc'),
      primaryAction: {
        label: t('location:addLocation'),
        icon: 'map-marker-plus',
        onPress: () => safeNavigate('AddLocation')
      }
    },

    // 필터링 결과 없음
    'filtered': {
      icon: 'filter-variant-remove',
      iconColor: theme.textSecondary,
      backgroundColor: isDarkMode ? theme.bgTertiary : '#6B728020',
      title: t('filter:emptyTitle'),
      description: t('filter:emptyDescription'),
      primaryAction: {
        label: t('filter:clearFilters'),
        icon: 'filter-off-outline',
        onPress: () => {
          if (navigation) {
            try {
              navigation.goBack();
            } catch (error) {
              console.error('EmptyState: goBack failed:', error);
            }
          }
        }
      }
    },

    // 권한 필요
    'permission': {
      icon: 'shield-lock-outline',
      iconColor: theme.warning,
      backgroundColor: theme.warningLight,
      title: t('permission:required'),
      description: t('permission:description'),
      primaryAction: {
        label: t('permission:openSettings'),
        icon: 'cog-outline',
        onPress: () => {
          // 설정 열기 로직
        }
      }
    }
  }), [t, navigation, onRefresh, showToast, theme, isDarkMode]);

  // 최종 설정 결정
  const config = useMemo(() => {
    const typeConfig = typeConfigs[type] || typeConfigs.default;

    return {
      icon: icon || typeConfig.icon,
      iconSize,
      iconColor: iconColor || typeConfig.iconColor,
      backgroundColor: backgroundColor || typeConfig.backgroundColor,
      title: title || typeConfig.title,
      description: description || typeConfig.description,
      primaryAction: primaryAction || typeConfig.primaryAction,
      secondaryActions: secondaryActions || typeConfig.secondaryActions || [],
      tips: tips || typeConfig.tips || [],
      enhancedDesign: typeConfig.enhancedDesign || false
    };
  }, [type, typeConfigs, icon, iconSize, iconColor, backgroundColor, title, description, primaryAction, secondaryActions, tips]);

  // 새로고침 액션 추가
  const finalSecondaryActions = useMemo(() => {
    const actions = [...config.secondaryActions];

    if (showRefresh && onRefresh && !actions.find(a => a.icon === 'refresh')) {
      actions.push({
        label: t('common:refresh'),
        icon: 'refresh',
        onPress: onRefresh,
        variant: 'secondary'
      });
    }

    return actions;
  }, [config.secondaryActions, showRefresh, onRefresh, t]);

  // 메인 컨텐츠
  const renderContent = () => {
    // 심플 디자인 (매장 상세 전용) - 동심원 글로우 + 회전 아이콘 + 브랜드 타이틀
    if (simpleDesign) {
      return (
        <View
          className="items-center justify-center py-20"
          style={{ minHeight: 350, backgroundColor: theme.bgPrimary }}
          testID={testID}
        >
          {/* 아이콘 + 퍼지는 글로우 효과 */}
          <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            {/* 퍼지는 배경 원들 - 바깥에서 안으로 점점 진해짐 */}
            <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: config.iconColor, opacity: 0.06 }} />
            <View style={{ position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: config.iconColor, opacity: 0.10 }} />
            <View style={{ position: 'absolute', width: 72, height: 72, borderRadius: 36, backgroundColor: config.iconColor, opacity: 0.15 }} />

            {/* 아이콘 배경 - 회전 */}
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundColor: config.iconColor,
                transform: [{ rotate: '-12deg' }],
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon name={config.icon} size={28} color={theme.textInverse} />
            </View>
          </View>

          {/* 제목 - 브랜드 컬러 */}
          {config.title && (
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: config.iconColor, textAlign: 'center', marginBottom: 8 }}>
              {config.title}
            </Text>
          )}

          {/* 설명 */}
          {config.description && (
            <Text style={{ fontSize: 14, color: theme.textMuted, textAlign: 'center', paddingHorizontal: 32 }}>
              {config.description}
            </Text>
          )}
        </View>
      );
    }

    // 개선된 장바구니 디자인 (풀스크린 테마 배경)
    if (config.enhancedDesign) {
      return (
        <View
          className="flex-1"
          style={{ backgroundColor: theme.bgPrimary }}
          testID={testID}
        >
          {/* 중앙 정렬 컨텐츠 */}
          <View className="flex-1 justify-center items-center px-6">
            {/* 아이콘 (80px, 직관적) */}
            <View className="mb-6">
              <Icon name={config.icon} size={80} color={config.iconColor} />
            </View>

            {/* 제목 (Bold, 테마 기반) */}
            {config.title && (
              <Text className="text-lg font-bold text-center mb-2" style={{ color: theme.textPrimary }}>
                {config.title}
              </Text>
            )}

            {/* 설명 (Small, 테마 기반) */}
            {config.description && (
              <Text className="text-sm text-center mb-8" style={{ color: theme.textSecondary }}>
                {config.description}
              </Text>
            )}

            {/* 버튼 그룹 (전체 width 사용) */}
            <View className="w-full">
            {/* Primary CTA - 브랜드 컬러 기반 */}
            {config.primaryAction && (
              <View className="mb-3">
                <TouchableOpacity
                  onPress={config.primaryAction.onPress}
                  className="rounded-xl flex-row items-center justify-center"
                  style={{
                    backgroundColor: theme.button.primary,
                    height: 48,
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3
                  }}
                  activeOpacity={0.8}
                >
                  <Icon name={config.primaryAction.icon} size={20} color={theme.button.primaryText} />
                  <Text className="text-base font-bold ml-2" style={{ color: theme.button.primaryText }}>
                    {config.primaryAction.label}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Secondary CTA - Gray Outline (통일된 스타일) */}
            {finalSecondaryActions.length > 0 && (
              <View>
                {finalSecondaryActions.map((action, index) => {
                  // 새로고침 버튼은 onRefresh prop이 있을 때만 표시
                  if (action.label === t('common:refresh') && !onRefresh) {
                    return null;
                  }

                  const handlePress = action.label === t('common:refresh')
                    ? onRefresh
                    : action.onPress;

                  // 마지막 버튼인지 확인
                  const isLastButton = index === finalSecondaryActions.length - 1;

                  return (
                    <TouchableOpacity
                      key={`secondary-${index}`}
                      onPress={handlePress}
                      className="rounded-xl flex-row items-center justify-center"
                      style={{
                        height: 48,
                        borderWidth: 2,
                        borderColor: theme.border,
                        backgroundColor: theme.bgCard,
                        marginBottom: isLastButton ? 0 : 12
                      }}
                      activeOpacity={0.7}
                    >
                      <Icon name={action.icon} size={20} color={theme.textPrimary} />
                      <Text className="font-semibold ml-2" style={{ color: theme.textPrimary }}>
                        {action.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            </View>
          </View>
        </View>
      );
    }

    // 기본 디자인 (기존 코드 유지)
    return (
      <View
        className="flex-1 items-center justify-center px-8"
        style={style}
        testID={testID}
        accessibilityRole="none"
        accessibilityLabel={config.title}
      >
        {/* 아이콘 배경 - 그림자 효과 추가 */}
        <View
          className="w-24 h-24 rounded-2xl items-center justify-center mb-6"
          style={{
            backgroundColor: config.backgroundColor,
            shadowColor: config.iconColor,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 8,
            transform: [{ rotate: '-12deg' }]
          }}
        >
          <Icon name={config.icon} size={48} color={config.iconColor} />
        </View>

        {/* 제목 - 브랜드 컬러 */}
        {config.title && (
          <Text className="text-xl font-bold text-center mb-2" style={{ color: theme.primary }}>
            {config.title}
          </Text>
        )}

        {/* 설명 */}
        {config.description && (
          <Text className="text-sm text-center mb-8 leading-5" style={{ color: theme.textSecondary }}>
            {config.description}
          </Text>
        )}

        {/* 주요 액션 버튼 */}
        {config.primaryAction && (
          <View className="w-full mb-4">
            <StandardButton
              variant="primary"
              size="large"
              fullWidth={true}
              icon={config.primaryAction.icon}
              onPress={config.primaryAction.onPress}
              gradient={true}
            >
              {config.primaryAction.label}
            </StandardButton>
          </View>
        )}

        {/* 보조 액션 버튼들 */}
        {finalSecondaryActions.length > 0 && (
          <View className="w-full space-y-3 mb-8">
            {finalSecondaryActions.map((action, index) => (
              <StandardButton
                key={`secondary-${index}`}
                variant={action.variant || 'outline'}
                size="medium"
                fullWidth={true}
                icon={action.icon}
                onPress={action.onPress}
              >
                {action.label}
              </StandardButton>
            ))}
          </View>
        )}

        {/* 팁 섹션 */}
        {config.tips.length > 0 && (
          <View className="w-full">
            <Text className="text-sm font-medium mb-3 text-center" style={{ color: theme.textPrimary }}>
              💡 유용한 팁
            </Text>
            {config.tips.map((tip, index) => (
              <View key={`tip-${index}`} className="flex-row items-start mb-2 px-4">
                <Icon
                  name={tip.icon || 'lightbulb-outline'}
                  size={16}
                  color={tip.color || config.iconColor}
                  style={{ marginTop: 2, marginRight: 8 }}
                />
                <Text className="flex-1 text-sm leading-5" style={{ color: theme.textSecondary }}>
                  {tip.text}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // RefreshControl이 있는 경우
  if (onRefresh) {
    return (
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: theme.bgPrimary }}
        contentContainerStyle={{ flex: 1, ...containerStyle }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={theme.gradientPrimary}
            tintColor={theme.primary}
            title={t('common.pullToRefresh')}
          />
        }
        {...props}
      >
        {renderContent()}
      </ScrollView>
    );
  }

  // RefreshControl이 없는 경우
  return (
    <View className="flex-1" style={{ backgroundColor: theme.bgPrimary, ...containerStyle }} {...props}>
      {renderContent()}
    </View>
  );
});

export default EmptyState;
