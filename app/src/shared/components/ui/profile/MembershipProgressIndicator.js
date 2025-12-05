/**
 * MembershipProgressIndicator - 멤버십 등급 진행률 표시 컴포넌트
 * 등급 업그레이드 진행률, 목표 달성도, 예상 시간 표시
 * CLAUDE.md 가이드라인 준수: SOLID 원칙, DRY, WCAG 2.1
 */
import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

/**
 * MembershipProgressIndicator 컴포넌트
 *
 * Single Responsibility: 멤버십 진행률 표시만 담당
 * Open/Closed: 새로운 진행률 스타일이나 애니메이션 추가 시 수정 없이 확장 가능
 */
const MembershipProgressIndicator = ({
  currentTier = 'bronze',
  nextTier = 'silver',
  currentPoints = 0,
  pointsToNext = 1000,
  totalPointsRequired = 1000,
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'horizontal', // 'horizontal', 'circular', 'minimal'
  animated = true,
  showDetails = true,
  showEstimate = true,
  onPress,
  style = {},
  testID = 'membership-progress'}) => {
  const { t } = useTranslation();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 진행률 계산
  const progress = useMemo(() => {
    if (totalPointsRequired === 0) {return 100;}
    const currentProgress = totalPointsRequired - pointsToNext;
    return Math.min((currentProgress / totalPointsRequired) * 100, 100);
  }, [pointsToNext, totalPointsRequired]);

  // 등급별 설정
  const tierConfig = useMemo(() => ({
    bronze: {
      name: t('profile.membership.tiers.bronze'),
      color: '#CD7F32',
      bgColor: '#FDF6E3',
      emoji: '🥉'},
    silver: {
      name: t('profile.membership.tiers.silver'),
      color: '#C0C0C0',
      bgColor: '#F8F9FA',
      emoji: '🥈'},
    gold: {
      name: t('profile.membership.tiers.gold'),
      color: '#FFD700',
      bgColor: '#FFFBF0',
      emoji: '🥇'},
    platinum: {
      name: t('profile.membership.tiers.platinum'),
      color: '#E5E4E2',
      bgColor: '#F7F7F7',
      emoji: '💎'},
    diamond: {
      name: t('profile.membership.tiers.diamond'),
      color: '#B9F2FF',
      bgColor: '#F0FBFF',
      emoji: '💠'}}), [t]);

  const currentTierConfig = tierConfig[currentTier] || tierConfig.bronze;
  const nextTierConfig = tierConfig[nextTier] || tierConfig.silver;

  // 예상 달성 시간 계산
  const estimatedTime = useMemo(() => {
    const avgPointsPerWeek = 200; // 주당 평균 포인트 (가정)
    const weeksToComplete = Math.ceil(pointsToNext / avgPointsPerWeek);
    return weeksToComplete;
  }, [pointsToNext]);

  // 애니메이션 효과
  useEffect(() => {
    if (animated) {
      // 진행률 애니메이션
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 1500,
        useNativeDriver: false}).start();

      // 펄스 애니메이션 (진행률이 90% 이상일 때)
      if (progress >= 90) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true}),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true}),
          ])
        ).start();
      }
    } else {
      progressAnim.setValue(progress);
      pulseAnim.setValue(1);
    }
  }, [progress, animated, progressAnim, pulseAnim]);

  // 스타일 계산
  const styles = useMemo(() => {

    return {
      container: [
        'bg-white rounded-xl p-4 shadow-sm border border-gray-100',
        size === 'small' && 'p-3',
        size === 'large' && 'p-6',
        style,
      ],
      header: [
        'flex-row items-center justify-between mb-3',
      ],
      currentTierInfo: [
        'flex-row items-center',
      ],
      tierEmoji: [
        'text-xl mr-2',
        size === 'small' && 'text-lg',
        size === 'large' && 'text-2xl',
      ],
      tierName: [
        'text-base font-medium text-gray-900',
        size === 'small' && 'text-sm',
        size === 'large' && 'text-lg',
      ],
      nextTierInfo: [
        'flex-row items-center',
      ],
      arrowIcon: [
        'mx-2 text-gray-400',
      ],
      progressSection: [
        variant === 'minimal' ? 'mb-2' : 'mb-4',
      ],
      progressLabel: [
        'flex-row items-center justify-between mb-2',
      ],
      progressText: [
        'text-sm text-gray-600',
        size === 'large' && 'text-base',
      ],
      progressPercentage: [
        'text-sm font-semibold',
        { color: currentTierConfig.color },
        size === 'large' && 'text-base',
      ],
      // 수평 진행률 바
      horizontalProgress: [
        variant === 'horizontal' && 'h-2 bg-gray-200 rounded-full mb-3',
        size === 'small' && 'h-1.5',
        size === 'large' && 'h-3',
      ],
      horizontalFill: [
        'h-full rounded-full',
        { backgroundColor: currentTierConfig.color },
      ],
      // 원형 진행률
      circularContainer: [
        variant === 'circular' && 'items-center mb-4',
      ],
      circularProgress: [
        variant === 'circular' && 'w-24 h-24 rounded-full border-4 border-gray-200 items-center justify-center',
        { borderTopColor: currentTierConfig.color },
        size === 'small' && 'w-16 h-16',
        size === 'large' && 'w-32 h-32',
      ],
      circularText: [
        'text-xs font-semibold',
        { color: currentTierConfig.color },
        size === 'large' && 'text-sm',
      ],
      detailsSection: [
        showDetails && variant !== 'minimal' && 'space-y-2',
      ],
      detailRow: [
        'flex-row items-center justify-between',
      ],
      detailLabel: [
        'text-xs text-gray-500',
        size === 'large' && 'text-sm',
      ],
      detailValue: [
        'text-xs text-gray-700 font-medium',
        size === 'large' && 'text-sm',
      ],
      estimateSection: [
        showEstimate && 'mt-3 pt-3 border-t border-gray-100',
      ],
      estimateText: [
        'text-xs text-center text-gray-500',
        size === 'large' && 'text-sm',
      ],
      nearCompletionBadge: [
        progress >= 80 && 'bg-gradient-to-r from-yellow-400 to-orange-400 px-2 py-1 rounded-full',
      ],
      nearCompletionText: [
        'text-xs text-white font-medium',
      ]};
  }, [size, variant, showDetails, showEstimate, currentTierConfig, progress, style]);

  const renderProgressContent = () => (
    <>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.currentTierInfo}>
          <Text style={styles.tierEmoji}>{currentTierConfig.emoji}</Text>
          <Text style={styles.tierName}>{currentTierConfig.name}</Text>
        </View>

        {nextTierConfig && (
          <>
            <Icon name="arrow-forward" size={16} style={styles.arrowIcon} />
            <View style={styles.nextTierInfo}>
              <Text style={styles.tierEmoji}>{nextTierConfig.emoji}</Text>
              <Text style={styles.tierName}>{nextTierConfig.name}</Text>
            </View>
          </>
        )}

        {progress >= 80 && (
          <View style={styles.nearCompletionBadge}>
            <Text style={styles.nearCompletionText}>
              {t('profile.membership.almost_there')}
            </Text>
          </View>
        )}
      </View>

      {/* 진행률 섹션 */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabel}>
          <Text style={styles.progressText}>
            {t('profile.membership.progress')}
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round(progress)}%
          </Text>
        </View>

        {/* 수평 진행률 바 */}
        {variant === 'horizontal' && (
          <View style={styles.horizontalProgress}>
            <Animated.View
              style={[
                styles.horizontalFill,
                {
                  width: animated
                    ? progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                        extrapolate: 'clamp'})
                    : `${progress}%`},
              ]}
            />
          </View>
        )}

        {/* 원형 진행률 */}
        {variant === 'circular' && (
          <Animated.View
            style={[
              styles.circularContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.circularProgress}>
              <Text style={styles.circularText}>
                {Math.round(progress)}%
              </Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* 상세 정보 */}
      {showDetails && variant !== 'minimal' && (
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {t('profile.membership.current_points')}
            </Text>
            <Text style={styles.detailValue}>
              {currentPoints.toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {t('profile.membership.points_needed')}
            </Text>
            <Text style={styles.detailValue}>
              {pointsToNext.toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {t('profile.membership.next_tier')}
            </Text>
            <Text style={styles.detailValue}>
              {nextTierConfig?.name || t('profile.membership.max_tier')}
            </Text>
          </View>
        </View>
      )}

      {/* 예상 시간 */}
      {showEstimate && nextTierConfig && (
        <View style={styles.estimateSection}>
          <Text style={styles.estimateText}>
            {estimatedTime <= 4
              ? t('profile.membership.upgrade_soon', { weeks: estimatedTime })
              : t('profile.membership.upgrade_estimate', { weeks: estimatedTime })
            }
          </Text>
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('profile.membership.progress_button_label', {
          current: currentTierConfig.name,
          next: nextTierConfig?.name,
          progress: Math.round(progress)})}
        testID={testID}
        activeOpacity={0.7}
      >
        {renderProgressContent()}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={t('profile.membership.progress_label', {
        current: currentTierConfig.name,
        next: nextTierConfig?.name,
        progress: Math.round(progress)})}
      testID={testID}
    >
      {renderProgressContent()}
    </View>
  );
};

export default React.memo(MembershipProgressIndicator);
