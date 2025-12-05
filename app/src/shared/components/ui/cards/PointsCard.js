/**
 * PointsCard Component - 재사용 가능한 포인트 카드
 * CLAUDE.md 가이드라인 준수: SOLID 원칙, DRY, WCAG 2.1
 * Local 배달 앱 특화 포인트 시스템
 */
import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

/**
 * PointsCard Component
 *
 * Single Responsibility: 포인트 정보 및 관련 기능 표시만 담당
 * Open/Closed: 새로운 포인트 타입이나 기능 추가 시 수정 없이 확장 가능
 *
 * @param {object} points - 포인트 정보 객체
 * @param {Function} onHistoryPress - 포인트 내역 보기 클릭 핸들러
 * @param {Function} onUsePress - 포인트 사용하기 클릭 핸들러
 */
const PointsCard = memo(({
  points = {
    current: 12500,
    earned: 2800,
    used: 1500,
    expiringSoon: 500,
    expiryDate: '2024-12-31',
    earnRate: 2, // 100원당 2포인트
    recentTransactions: [
      { id: 1, type: 'earned', amount: 150, reason: '주문 적립', date: '2024-08-25' },
      { id: 2, type: 'used', amount: -500, reason: '할인 사용', date: '2024-08-24' },
      { id: 3, type: 'earned', amount: 200, reason: '리뷰 적립', date: '2024-08-23' },
    ]},
  onHistoryPress = () => {},
  onUsePress = () => {}}) => {
  const { t } = useTranslation(['profile', 'common']);

  // 포인트 포맷팅
  const formatPoints = (amount) => {
    if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + 'K';
    }
    return amount.toLocaleString();
  };

  // 카드 그림자 스타일
  const cardShadowStyle = {
    shadowColor: '#FFDD00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8};

  const buttonShadowStyle = {
    shadowColor: '#FFDD00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6};

  return (
    <TouchableOpacity
      className="bg-white rounded-xl overflow-hidden border border-gray-200 mb-4"
      style={cardShadowStyle}
      onPress={onHistoryPress}
      activeOpacity={0.95}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={t('profile:points.card')}
      accessibilityHint={t('common:tapToViewDetails')}
    >
      {/* 헤더 그라데이션 */}
      <LinearGradient
        colors={['#FFDD00', '#FFEF33', '#FFF566']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 py-5"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="bg-white/20 rounded-xl p-3 mr-4">
              <MaterialIcons name="stars" size={28} color="#D97706" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 text-lg font-bold mb-1">
                {t('profile:points.title')}
              </Text>
              <Text className="text-gray-800 text-sm font-medium">
                {points.earnRate}{t('profile:points.earnRate')}
              </Text>
            </View>
          </View>
          <View className="bg-white/15 rounded-full px-4 py-2">
            <Text className="text-gray-900 font-bold text-lg">
              {formatPoints(points.current)}P
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 py-5">
        {/* 포인트 통계 */}
        <View className="flex-row justify-between mb-6">
          <View className="flex-1 items-center">
            <View className="w-12 h-12 rounded-full bg-green-50 items-center justify-center mb-2">
              <MaterialIcons name="add-circle" size={24} color="#00B14F" />
            </View>
            <Text className="text-xl font-bold text-gray-900">
              +{formatPoints(points.earned)}
            </Text>
            <Text className="text-xs text-gray-600">
              {t('profile:points.earned')}
            </Text>
          </View>

          <View className="flex-1 items-center">
            <View className="w-12 h-12 rounded-full bg-red-50 items-center justify-center mb-2">
              <MaterialIcons name="remove-circle" size={24} color="#DA020E" />
            </View>
            <Text className="text-xl font-bold text-gray-900">
              -{formatPoints(points.used)}
            </Text>
            <Text className="text-xs text-gray-600">
              {t('profile:points.used')}
            </Text>
          </View>

          <View className="flex-1 items-center">
            <View className="w-12 h-12 rounded-full bg-orange-50 items-center justify-center mb-2">
              <MaterialIcons name="schedule" size={24} color="#F59E0B" />
            </View>
            <Text className="text-xl font-bold text-gray-900">
              {formatPoints(points.expiringSoon)}
            </Text>
            <Text className="text-xs text-gray-600">
              {t('profile:points.expiring')}
            </Text>
          </View>
        </View>

        {/* 만료 예정 알림 */}
        {points.expiringSoon > 0 && (
          <View className="bg-orange-50 rounded-xl p-4 mb-5 border border-orange-200">
            <View className="flex-row items-center">
              <MaterialIcons name="warning" size={18} color="#F59E0B" />
              <Text className="text-orange-800 text-sm font-medium ml-2 flex-1">
                {formatPoints(points.expiringSoon)}{t('profile:points.expiringWarning')} {points.expiryDate}
              </Text>
            </View>
          </View>
        )}

        {/* 최근 거래 내역 */}
        <View className="mb-5">
          <Text className="text-gray-900 font-semibold mb-3">
            {t('profile:points.recentTransactions')}
          </Text>
          <View className="space-y-3">
            {points.recentTransactions.slice(0, 3).map((transaction) => (
              <View key={transaction.id} className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <MaterialIcons
                    name={transaction.type === 'earned' ? 'add-circle-outline' : 'remove-circle-outline'}
                    size={18}
                    color={transaction.type === 'earned' ? '#00B14F' : '#DA020E'}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-medium text-gray-900">
                      {transaction.reason}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {transaction.date}
                    </Text>
                  </View>
                </View>
                <Text className={`text-sm font-bold ${
                  transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}P
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 액션 버튼들 */}
        <View className="flex-row" style={{ gap: 12 }}>
          <TouchableOpacity
            className="flex-1 bg-[#FFDD00] rounded-xl py-3 px-4"
            style={buttonShadowStyle}
            onPress={onUsePress}
          >
            <View className="flex-row items-center justify-center">
              <MaterialIcons name="redeem" size={18} color="#D97706" />
              <Text className="text-gray-900 font-bold text-sm ml-2">
                {t('profile:points.use')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white border border-gray-300 rounded-xl py-3 px-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 4}}
            onPress={onHistoryPress}
          >
            <View className="flex-row items-center justify-center">
              <MaterialIcons name="history" size={18} color="#6B7280" />
              <Text className="text-gray-700 font-bold text-sm ml-2">
                {t('profile:points.history')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default PointsCard;
