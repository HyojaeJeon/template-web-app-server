/**
 * MembershipBenefitsDetail - 멤버십 혜택 상세 정보 컴포넌트
 * 등급별 혜택, 업그레이드 조건, 진행률 상세 표시
 * CLAUDE.md 가이드라인 준수: SOLID 원칙, DRY, WCAG 2.1, NativeWind v4
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import MembershipBadge from '@shared/components/ui/badges/MembershipBadge';
import { useTheme } from '@providers/ThemeProvider';

/**
 * MembershipBenefitsDetail 컴포넌트
 *
 * Single Responsibility: 멤버십 혜택 상세 정보 표시만 담당
 * Open/Closed: 새로운 혜택이나 등급 추가 시 수정 없이 확장 가능
 */
const MembershipBenefitsDetail = ({
  membership = {},
  isVisible = false,
  onClose,
  onUpgradePress,
  showUpgradeButton = true,
  style = {},
  testID = 'membership-benefits-detail',
}) => {
  const { t } = useTranslation('profile');
  const { t: tCommon } = useTranslation('common');
  const { isDarkMode, colors: theme } = useTheme();

  // 멤버십 등급별 혜택 정의
  const membershipTiers = useMemo(() => {
    console.log('[MembershipBenefitsDetail] 번역 디버깅:', {
      currentLanguage: t('membership.tiers.bronze'),
      testKey: t('membership.benefits.delivery_discount'),
      sampleDesc: t('membership.benefits.bronze.delivery_description'),
      rawT: typeof t,
      namespace: 'profile'
    });

    return {
      bronze: {
        name: t('membership.tiers.bronze'),
        color: '#CD7F32',
        icon: 'stars',
        emoji: '🥉',
        nextTier: 'silver',
        pointsRequired: 0,
        benefits: [
          {
            icon: 'local_shipping',
            title: t('membership.benefits.delivery_discount'),
            description: t('membership.benefits.bronze.delivery_description'),
            value: '5%'},
          {
            icon: 'loyalty',
            title: t('membership.benefits.points_earning'),
            description: t('membership.benefits.bronze.points_description'),
            value: '1x'},
          {
            icon: 'card_giftcard',
            title: t('membership.benefits.welcome_bonus'),
            description: t('membership.benefits.bronze.welcome_description'),
            value: '10,000 VND'},
        ],
      },
      silver: {
      name: t('membership.tiers.silver'),
      color: '#C0C0C0',
      icon: 'star',
      emoji: '🥈',
      nextTier: 'gold',
      pointsRequired: 1000,
      benefits: [
        {
          icon: 'local_shipping',
          title: t('membership.benefits.delivery_discount'),
          description: t('membership.benefits.silver.delivery_description'),
          value: '10%'},
        {
          icon: 'loyalty',
          title: t('membership.benefits.points_earning'),
          description: t('membership.benefits.silver.points_description'),
          value: '1.2x'},
        {
          icon: 'support_agent',
          title: t('membership.benefits.priority_support'),
          description: t('membership.benefits.silver.support_description'),
          value: tCommon('available')},
        {
          icon: 'access_time',
          title: t('membership.benefits.faster_delivery'),
          description: t('membership.benefits.silver.delivery_time_description'),
          value: '15분 단축'},
      ],
      },
      gold: {
      name: t('membership.tiers.gold'),
      color: '#FFD700',
      icon: 'star',
      emoji: '🥇',
      nextTier: 'platinum',
      pointsRequired: 5000,
      benefits: [
        {
          icon: 'local_shipping',
          title: t('membership.benefits.delivery_discount'),
          description: t('membership.benefits.gold.delivery_description'),
          value: '15%'},
        {
          icon: 'loyalty',
          title: t('membership.benefits.points_earning'),
          description: t('membership.benefits.gold.points_description'),
          value: '1.5x'},
        {
          icon: 'support_agent',
          title: t('membership.benefits.priority_support'),
          description: t('membership.benefits.gold.support_description'),
          value: '24/7'},
        {
          icon: 'card_giftcard',
          title: t('membership.benefits.monthly_coupon'),
          description: t('membership.benefits.gold.coupon_description'),
          value: '매월 5장'},
        {
          icon: 'event',
          title: t('membership.benefits.exclusive_deals'),
          description: t('membership.benefits.gold.deals_description'),
          value: tCommon('available')},
      ],
      },
      platinum: {
      name: t('membership.tiers.platinum'),
      color: '#E5E4E2',
      icon: 'workspace_premium',
      emoji: '💎',
      nextTier: 'diamond',
      pointsRequired: 15000,
      benefits: [
        {
          icon: 'local_shipping',
          title: t('membership.benefits.delivery_discount'),
          description: t('membership.benefits.platinum.delivery_description'),
          value: '20%'},
        {
          icon: 'loyalty',
          title: t('membership.benefits.points_earning'),
          description: t('membership.benefits.platinum.points_description'),
          value: '2x'},
        {
          icon: 'support_agent',
          title: t('membership.benefits.vip_support'),
          description: t('membership.benefits.platinum.support_description'),
          value: '전용 상담사'},
        {
          icon: 'card_giftcard',
          title: t('membership.benefits.premium_coupons'),
          description: t('membership.benefits.platinum.coupon_description'),
          value: '매월 10장'},
        {
          icon: 'event',
          title: t('membership.benefits.special_events'),
          description: t('membership.benefits.platinum.events_description'),
          value: '독점 이벤트'},
        {
          icon: 'store_menu',
          title: t('membership.benefits.chef_recommendations'),
          description: t('membership.benefits.platinum.chef_description'),
          value: '주간 추천'},
      ],
      },
      diamond: {
      name: t('membership.tiers.diamond'),
      color: '#B9F2FF',
      icon: 'diamond',
      emoji: '💠',
      nextTier: null,
      pointsRequired: 50000,
      benefits: [
        {
          icon: 'local_shipping',
          title: t('membership.benefits.free_delivery'),
          description: t('membership.benefits.diamond.delivery_description'),
          value: '무료 배송'},
        {
          icon: 'loyalty',
          title: t('membership.benefits.points_earning'),
          description: t('membership.benefits.diamond.points_description'),
          value: '2.5x'},
        {
          icon: 'support_agent',
          title: t('membership.benefits.concierge_service'),
          description: t('membership.benefits.diamond.concierge_description'),
          value: '개인 컨시어지'},
        {
          icon: 'card_giftcard',
          title: t('membership.benefits.unlimited_coupons'),
          description: t('membership.benefits.diamond.coupon_description'),
          value: '무제한 쿠폰'},
        {
          icon: 'event',
          title: t('membership.benefits.vip_events'),
          description: t('membership.benefits.diamond.events_description'),
          value: 'VIP 이벤트'},
        {
          icon: 'store_menu',
          title: t('membership.benefits.custom_menu'),
          description: t('membership.benefits.diamond.menu_description'),
          value: '맞춤 메뉴'},
        {
          icon: 'schedule',
          title: t('membership.benefits.priority_booking'),
          description: t('membership.benefits.diamond.booking_description'),
          value: '우선 예약'},
      ],
      },
    };
  }, [t]);

  // 현재 및 다음 등급 정보
  const currentTierKey = membership?.tier || 'bronze';
  const currentTier = membershipTiers[currentTierKey] || membershipTiers.bronze;
  const nextTier = currentTier.nextTier ? membershipTiers[currentTier.nextTier] : null;

  // 진행률 계산
  const progress = useMemo(() => {
    if (!nextTier || !membership?.pointsToNextTier || !membership?.totalPointsRequired) {
      return 100; // 최고 등급이면 100%
    }
    const currentProgress = membership.totalPointsRequired - membership.pointsToNextTier;
    return Math.min((currentProgress / membership.totalPointsRequired) * 100, 100);
  }, [membership, nextTier]);

  // 업그레이드 조건 계산
  const upgradeConditions = useMemo(() => {
    if (!nextTier) {return null;}

    return {
      pointsNeeded: membership?.pointsToNextTier || 0,
      ordersNeeded: Math.ceil((membership?.pointsToNextTier || 0) / 100), // 주문당 평균 100포인트 가정
      estimatedTime: Math.ceil((membership?.pointsToNextTier || 0) / 500), // 월평균 500포인트 가정
    };
  }, [membership, nextTier]);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={{ flex: 1, backgroundColor: theme.bgOverlay }}>
        <View
          style={[{
            flex: 1,
            backgroundColor: theme.bgPrimary,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            marginTop: 80,
            padding: 24,
          }, style]}
        >
          {/* 헤더 */}
          <View className="flex-row items-center justify-between mb-6">
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: theme.textPrimary,
                flex: 1,
                marginRight: 16,
              }}
              accessibilityRole="text"
              accessibilityLabel={t('membership.benefits_detail_title')}
            >
              {t('membership.membership_benefits')}
            </Text>
            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor: isDarkMode ? theme.bgCard : theme.bgSecondary,
              }}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={tCommon('close')}
              testID={`${testID}-close`}
            >
              <Icon name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 현재 등급 */}
            <View className="mb-8">
              <View className="flex-row items-center mb-4">
                <MembershipBadge
                  grade={membership?.tier || 'bronze'}
                  size="large"
                  variant="detailed"
                />
                <View className="ml-4 flex-1">
                  <Text style={{ fontSize: 20, fontWeight: '600', color: currentTier.color }}>{currentTier.name}</Text>
                  <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 4 }}>
                    {t('membership.current_tier')}
                  </Text>
                </View>
              </View>
            </View>

            {/* 다음 등급으로의 진행률 */}
            {nextTier && (
              <View
                style={{
                  backgroundColor: isDarkMode ? theme.glass : theme.bgTertiary,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 24,
                  borderWidth: isDarkMode ? 1 : 0,
                  borderColor: theme.border,
                }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text style={{ fontSize: 18, fontWeight: '500', color: theme.textPrimary }}>
                    {t('membership.progress_to_next', { tier: nextTier.name })}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: currentTier.color }}>
                    {Math.round(progress)}%
                  </Text>
                </View>
                <View style={{ height: 12, backgroundColor: theme.borderLight, borderRadius: 999, marginBottom: 12 }}>
                  <View style={{ height: '100%', borderRadius: 999, backgroundColor: currentTier.color, width: `${progress}%` }} />
                </View>
                <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center' }}>
                  {t('membership.points_remaining', {
                    points: (membership?.pointsToNextTier || 0).toLocaleString()})}
                </Text>
              </View>
            )}

            {/* 현재 등급 혜택 */}
            <View className="mb-8">
              <Text style={{ fontSize: 18, fontWeight: '600', color: theme.textPrimary, marginBottom: 16 }}>
                {t('membership.current_benefits')}
              </Text>
              {currentTier.benefits.map((benefit, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    padding: 16,
                    backgroundColor: isDarkMode ? theme.glass : theme.bgTertiary,
                    borderRadius: 16,
                    marginBottom: 12,
                    borderWidth: isDarkMode ? 1 : 0,
                    borderColor: theme.border,
                  }}
                >
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                    backgroundColor: currentTier.color + '20',
                  }}>
                    <Icon
                      name={benefit.icon}
                      size={24}
                      color={currentTier.color}
                    />
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontSize: 16, fontWeight: '500', color: theme.textPrimary, marginBottom: 4 }}>{benefit.title}</Text>
                    <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>
                      {benefit.description}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: currentTier.color }}>{benefit.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* 업그레이드 조건 */}
            {nextTier && upgradeConditions && (
              <View
                style={{
                  backgroundColor: isDarkMode ? `${theme.primary}15` : '#EEF2FF',
                  borderRadius: 16,
                  padding: 24,
                  marginBottom: 24,
                  borderWidth: isDarkMode ? 1 : 0,
                  borderColor: isDarkMode ? `${theme.primary}30` : 'transparent',
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '600', color: theme.textPrimary, marginBottom: 16 }}>
                  {t('membership.upgrade_to', { tier: nextTier.name })}
                </Text>
                <View className="mb-4">
                  <View className="flex-row items-center justify-between py-2">
                    <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                      {t('membership.points_needed')}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textPrimary }}>
                      {upgradeConditions.pointsNeeded.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between py-2">
                    <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                      {t('membership.orders_needed')}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textPrimary }}>
                      {upgradeConditions.ordersNeeded}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between py-2">
                    <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                      {t('membership.estimated_time')}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textPrimary }}>
                      {t('membership.months', { count: upgradeConditions.estimatedTime })}
                    </Text>
                  </View>
                </View>
                {onUpgradePress && showUpgradeButton && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: theme.primary,
                      borderRadius: 16,
                      paddingVertical: 12,
                      paddingHorizontal: 24,
                    }}
                    onPress={onUpgradePress}
                    accessibilityRole="button"
                    accessibilityLabel={t('membership.upgrade_now')}
                    testID={`${testID}-upgrade`}
                  >
                    <Text style={{
                      color: theme.button.primaryText,
                      textAlign: 'center',
                      fontWeight: '600',
                      fontSize: 16,
                    }}>
                      {t('membership.upgrade_now')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 최고 등급 알림 */}
            {!nextTier && (
              <View
                style={{
                  backgroundColor: isDarkMode ? `${theme.primary}20` : '#FFFBEB',
                  borderRadius: 16,
                  padding: 24,
                  marginBottom: 24,
                  borderWidth: isDarkMode ? 1 : 0,
                  borderColor: isDarkMode ? `${theme.primary}40` : 'transparent',
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '600', color: theme.primary, marginBottom: 8 }}>
                  {t('membership.max_tier_reached')}
                </Text>
                <Text style={{ textAlign: 'center', color: theme.textSecondary }}>
                  {t('membership.max_tier_message')}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(MembershipBenefitsDetail);
