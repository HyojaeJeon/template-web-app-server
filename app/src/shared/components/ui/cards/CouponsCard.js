/**
 * CouponsCard Component - 재사용 가능한 쿠폰 카드
 * CLAUDE.md 가이드라인 준수: SOLID 원칙, DRY, WCAG 2.1
 * Local 배달 앱 특화 쿠폰 시스템
 */
import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

/**
 * CouponsCard Component
 *
 * Single Responsibility: 쿠폰 현황 및 관련 기능 표시만 담당
 * Open/Closed: 새로운 쿠폰 타입이나 기능 추가 시 수정 없이 확장 가능
 *
 * @param {object} coupons - 쿠폰 정보 객체
 * @param {Function} onViewAllPress - 전체 쿠폰 보기 클릭 핸들러
 * @param {Function} onGetCouponsPress - 쿠폰 받기 클릭 핸들러
 */
const CouponsCard = memo(({
  coupons = {
    total: 8,
    available: 5,
    used: 2,
    expired: 1,
    expiringSoon: 2,
    expiringSoonDate: '2024-09-05',
    featured: [
      {
        id: 'WELCOME30',
        title: '신규 가입 축하 쿠폰',
        discount: '30%',
        minOrder: '50,000₫',
        expiryDate: '2024-09-30',
        category: 'new_user'},
      {
        id: 'DELIVERY',
        title: '무료배송 쿠폰',
        discount: '배송비 무료',
        minOrder: '30,000₫',
        expiryDate: '2024-10-15',
        category: 'delivery'},
      {
        id: 'VIETNAM20',
        title: 'Local 음식 할인',
        discount: '20%',
        minOrder: '80,000₫',
        expiryDate: '2024-09-20',
        category: 'vietnamese'},
    ]},
  onViewAllPress = () => {},
  onGetCouponsPress = () => {}}) => {
  const { t } = useTranslation(['profile', 'common']);

  // 쿠폰 카테고리별 색상 매핑
  const getCategoryColor = (category) => {
    const colorMap = {
      new_user: ['#2AC1BC', '#4DD0E1', '#80DEEA'],
      delivery: ['#00B14F', '#4CAF50', '#81C784'],
      vietnamese: ['#DA020E', '#E57373', '#FFCDD2'],
      percentage: ['#FF6B35', '#FF8A65', '#FFAB91'],
      default: ['#6B7280', '#9CA3AF', '#D1D5DB']};
    return colorMap[category] || colorMap.default;
  };

  // 카드 그림자 스타일
  const cardShadowStyle = {
    shadowColor: '#2AC1BC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8};

  const buttonShadowStyle = {
    shadowColor: '#2AC1BC',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6};

  return (
    <TouchableOpacity
      className="bg-white rounded-xl overflow-hidden border border-gray-200 mb-4"
      style={cardShadowStyle}
      onPress={onViewAllPress}
      activeOpacity={0.95}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={t('profile:coupons.card')}
      accessibilityHint={t('common:tapToViewDetails')}
    >
      {/* 헤더 그라데이션 */}
      <LinearGradient
        colors={['#2AC1BC', '#4DD0E1', '#80DEEA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 py-5"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="bg-white/20 rounded-xl p-3 mr-4">
              <MaterialIcons name="confirmation-number" size={28} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold mb-1">
                {t('profile:coupons.title')}
              </Text>
              <Text className="text-white/90 text-sm font-medium">
                {coupons.available}{t('profile:coupons.available')}
              </Text>
            </View>
          </View>
          <View className="bg-white/15 rounded-full px-4 py-2">
            <Text className="text-white font-bold text-lg">
              {coupons.total}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 py-5">
        {/* 쿠폰 통계 */}
        <View className="flex-row justify-between mb-6">
          <View className="flex-1 items-center">
            <View className="w-12 h-12 rounded-full bg-green-50 items-center justify-center mb-2">
              <MaterialIcons name="redeem" size={24} color="#00B14F" />
            </View>
            <Text className="text-xl font-bold text-gray-900">
              {coupons.available}
            </Text>
            <Text className="text-xs text-gray-600">
              {t('profile:coupons.available')}
            </Text>
          </View>

          <View className="flex-1 items-center">
            <View className="w-12 h-12 rounded-full bg-gray-50 items-center justify-center mb-2">
              <MaterialIcons name="check-circle" size={24} color="#6B7280" />
            </View>
            <Text className="text-xl font-bold text-gray-900">
              {coupons.used}
            </Text>
            <Text className="text-xs text-gray-600">
              {t('profile:coupons.used')}
            </Text>
          </View>

          <View className="flex-1 items-center">
            <View className="w-12 h-12 rounded-full bg-orange-50 items-center justify-center mb-2">
              <MaterialIcons name="schedule" size={24} color="#F59E0B" />
            </View>
            <Text className="text-xl font-bold text-gray-900">
              {coupons.expiringSoon}
            </Text>
            <Text className="text-xs text-gray-600">
              {t('profile:coupons.expiring')}
            </Text>
          </View>
        </View>

        {/* 만료 임박 알림 */}
        {coupons.expiringSoon > 0 && (
          <View className="bg-orange-50 rounded-xl p-4 mb-5 border border-orange-200">
            <View className="flex-row items-center">
              <MaterialIcons name="warning" size={18} color="#F59E0B" />
              <Text className="text-orange-800 text-sm font-medium ml-2 flex-1">
                {coupons.expiringSoon}{t('profile:coupons.expiringSoon')} {coupons.expiringSoonDate}
              </Text>
            </View>
          </View>
        )}

        {/* 주요 쿠폰 미리보기 */}
        <View className="mb-5">
          <Text className="text-gray-900 font-semibold mb-3">
            {t('profile:coupons.featured')}
          </Text>
          <View className="space-y-3">
            {coupons.featured.slice(0, 3).map((coupon) => {
              const colors = getCategoryColor(coupon.category);
              return (
                <View key={coupon.id} className="flex-row items-center bg-gray-50 rounded-lg p-3">
                  <View
                    className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                    style={{ backgroundColor: colors[0] + '20' }}
                  >
                    <MaterialIcons
                      name={coupon.category === 'delivery' ? 'local-shipping' :
                            coupon.category === 'new_user' ? 'card-giftcard' : 'percent'}
                      size={20}
                      color={colors[0]}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">
                      {coupon.title}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {coupon.discount} • {t('profile:coupons.minOrder')} {coupon.minOrder}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-gray-500">
                      ~{coupon.expiryDate.split('-')[1]}/{coupon.expiryDate.split('-')[2]}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 액션 버튼들 */}
        <View className="flex-row" style={{ gap: 12 }}>
          <TouchableOpacity
            className="flex-1 bg-[#2AC1BC] rounded-xl py-3 px-4"
            style={buttonShadowStyle}
            onPress={onViewAllPress}
          >
            <View className="flex-row items-center justify-center">
              <MaterialIcons name="confirmation-number" size={18} color="white" />
              <Text className="text-white font-bold text-sm ml-2">
                {t('profile:coupons.viewAll')}
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
            onPress={onGetCouponsPress}
          >
            <View className="flex-row items-center justify-center">
              <MaterialIcons name="add-circle-outline" size={18} color="#6B7280" />
              <Text className="text-gray-700 font-bold text-sm ml-2">
                {t('profile:coupons.getMore')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default CouponsCard;
