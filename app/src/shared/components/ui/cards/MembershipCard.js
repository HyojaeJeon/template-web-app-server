/**
 * MembershipCard Component - 재사용 가능한 멤버십 카드
 * CLAUDE.md 가이드라인 준수: SOLID 원칙, DRY, WCAG 2.1
 * Local 배달 앱 특화 멤버십 시스템
 */
import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

/**
 * MembershipCard Component
 *
 * Single Responsibility: 멤버십 등급 및 혜택 정보 표시만 담당
 * Open/Closed: 새로운 멤버십 등급이나 혜택 추가 시 수정 없이 확장 가능
 *
 * @param {object} membership - 멤버십 정보 객체
 * @param {Function} onUpgradePress - 등급 업그레이드 클릭 핸들러
 * @param {Function} onBenefitsPress - 혜택 보기 클릭 핸들러
 */
const MembershipCard = memo(({
  membership = {
    currentGrade: 'bronze', // bronze, silver, gold, diamond, vip
    gradeName: '브론즈',
    totalOrders: 12,
    nextGrade: 'silver',
    nextGradeName: '실버',
    ordersToNext: 8,
    progressPercentage: 60,
    benefits: [
      { id: 'discount', name: '5% 할인', active: true },
      { id: 'points', name: '포인트 2배 적립', active: true },
      { id: 'delivery', name: '무료배송', active: false },
    ],
    gradeColor: '#CD7F32',
    since: '2024-03-15'},
  onUpgradePress = () => {},
  onBenefitsPress = () => {}}) => {
  const { t } = useTranslation(['profile', 'common']);

  // 등급별 색상 및 아이콘 매핑
  const getGradeInfo = (grade) => {
    const gradeMap = {
      bronze: {
        colors: ['#CD7F32', '#D4956A', '#E1AC95'],
        icon: 'workspace-premium',
        nextColor: '#C0C0C0'},
      silver: {
        colors: ['#C0C0C0', '#D3D3D3', '#E6E6E6'],
        icon: 'military-tech',
        nextColor: '#FFD700'},
      gold: {
        colors: ['#FFD700', '#FFDF33', '#FFE666'],
        icon: 'emoji-events',
        nextColor: '#B9F2FF'},
      diamond: {
        colors: ['#B9F2FF', '#87CEEB', '#ADD8E6'],
        icon: 'diamond',
        nextColor: '#9932CC'},
      vip: {
        colors: ['#9932CC', '#BA55D3', '#DA70D6'],
        icon: 'star',
        nextColor: '#9932CC'}};
    return gradeMap[grade] || gradeMap.bronze;
  };

  const gradeInfo = getGradeInfo(membership.currentGrade);

  // 카드 그림자 스타일
  const cardShadowStyle = {
    shadowColor: gradeInfo.colors[0],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8};

  const buttonShadowStyle = {
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6};

  return (
    <TouchableOpacity
      className="bg-white rounded-xl overflow-hidden border border-gray-200 mb-4"
      style={cardShadowStyle}
      onPress={onBenefitsPress}
      activeOpacity={0.95}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={t('profile:membership.card')}
      accessibilityHint={t('common:tapToViewDetails')}
    >
      {/* 헤더 그라데이션 */}
      <LinearGradient
        colors={gradeInfo.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 py-5"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="bg-white/20 rounded-xl p-3 mr-4">
              <MaterialIcons name={gradeInfo.icon} size={28} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold mb-1">
                {membership.gradeName} {t('profile:membership.member')}
              </Text>
              <Text className="text-white/90 text-sm font-medium">
                {t('profile:membership.since')}: {membership.since}
              </Text>
            </View>
          </View>
          <View className="bg-white/15 rounded-full px-4 py-2">
            <Text className="text-white font-bold text-sm">
              {membership.totalOrders}{t('profile:membership.orders')}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 py-5">
        {/* 다음 등급까지 진행률 */}
        {membership.nextGrade && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-900 font-semibold">
                {membership.nextGradeName} {t('profile:membership.until')}
              </Text>
              <Text className="text-sm text-gray-600">
                {membership.ordersToNext}{t('profile:membership.moreOrders')}
              </Text>
            </View>

            {/* 진행률 바 */}
            <View className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <LinearGradient
                colors={[gradeInfo.colors[0], gradeInfo.nextColor]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-full rounded-full"
                style={{ width: `${membership.progressPercentage}%` }}
              />
            </View>
            <Text className="text-xs text-gray-500 mt-2 text-center">
              {membership.progressPercentage}% {t('common:completed')}
            </Text>
          </View>
        )}

        {/* 혜택 리스트 */}
        <View className="mb-5">
          <Text className="text-gray-900 font-semibold mb-3">
            {t('profile:membership.currentBenefits')}
          </Text>
          <View className="space-y-2">
            {membership.benefits.map((benefit) => (
              <View key={benefit.id} className="flex-row items-center">
                <MaterialIcons
                  name={benefit.active ? 'check-circle' : 'radio-button-unchecked'}
                  size={18}
                  color={benefit.active ? '#00B14F' : '#9CA3AF'}
                />
                <Text className={`ml-2 text-sm ${
                  benefit.active ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {benefit.name}
                </Text>
                {!benefit.active && (
                  <Text className="ml-auto text-xs text-blue-600">
                    {membership.nextGradeName}부터
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* 액션 버튼들 */}
        <View className="flex-row" style={{ gap: 12 }}>
          <TouchableOpacity
            className="flex-1 bg-[#00B14F] rounded-xl py-3 px-4"
            style={buttonShadowStyle}
            onPress={onBenefitsPress}
          >
            <View className="flex-row items-center justify-center">
              <MaterialIcons name="card-giftcard" size={18} color="white" />
              <Text className="text-white font-bold text-sm ml-2">
                {t('profile:membership.viewBenefits')}
              </Text>
            </View>
          </TouchableOpacity>

          {membership.nextGrade && (
            <TouchableOpacity
              className="bg-white border border-gray-300 rounded-xl py-3 px-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 4}}
              onPress={onUpgradePress}
            >
              <View className="flex-row items-center justify-center">
                <MaterialIcons name="trending-up" size={18} color="#6B7280" />
                <Text className="text-gray-700 font-bold text-sm ml-2">
                  {t('profile:membership.upgrade')}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default MembershipCard;
