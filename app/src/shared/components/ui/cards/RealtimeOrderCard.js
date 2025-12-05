/**
 * RealtimeOrderCard - 실시간 주문 추적 카드 컴포넌트
 * 주문 상태를 실시간으로 표시
 * 기존 OrderCard 패턴을 참고하여 구현
 * server/src/graphql 준수, 접근성 및 Local 현지화 적용
 */
import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated} from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Components
import VNDFormatter from '@shared/components/ui/localization/VNDFormatter';

// Utils
import { colors } from '@shared/design/tokens';

const RealtimeOrderCard = memo(({
  order,
  onOrderPress = () => {},
  onTrackDelivery = () => {},
  compact = false}) => {
  const { t } = useTranslation();
  const [pulseAnim] = useState(new Animated.Value(1));

  // 주문 상태별 스타일 설정
  const getStatusConfig = (status) => {
    const statusMap = {
      'PENDING': {
        bg: colors.gray[100],
        text: colors.gray[800],
        icon: 'clock-outline',
        pulse: false,
        labelKey: 'order.status.pending'},
      'COOKING': {
        bg: colors.yellow[100],
        text: colors.yellow[800],
        icon: 'chef-hat',
        pulse: true,
        labelKey: 'order.status.cooking'},
      'READY': {
        bg: colors.green[100],
        text: colors.green[800],
        icon: 'check-circle',
        pulse: true,
        labelKey: 'order.status.ready'},
      'DELIVERING': {
        bg: colors.mint[100],
        text: colors.mint[800],
        icon: 'truck-delivery',
        pulse: true,
        labelKey: 'order.status.delivering'},
      'DELIVERED': {
        bg: colors.green[100],
        text: colors.green[800],
        icon: 'check-circle',
        pulse: false,
        labelKey: 'order.status.delivered'},
      'CANCELLED': {
        bg: colors.red[100],
        text: colors.red[800],
        icon: 'close-circle',
        pulse: false,
        labelKey: 'order.status.cancelled'}};
    return statusMap[status] || statusMap.PENDING;
  };

  const statusConfig = getStatusConfig(order.status);

  // 펄스 애니메이션 효과
  useEffect(() => {
    if (statusConfig.pulse) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true}),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true}),
        ]).start(() => pulse());
      };
      pulse();
    }
  }, [statusConfig.pulse, pulseAnim]);

  // 예상 시간 계산
  const getEstimatedTime = useCallback(() => {
    if (!order.estimatedTime) {return null;}

    const now = new Date();
    const estimated = new Date(order.estimatedTime);
    const diffInMinutes = Math.ceil((estimated - now) / (1000 * 60));

    if (diffInMinutes <= 0) {
      return t('order.time.overdue');
    } else if (diffInMinutes < 60) {
      return t('order.time.minutes', { minutes: diffInMinutes });
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return t('order.time.hoursMinutes', { hours, minutes });
    }
  }, [order.estimatedTime, t]);


  if (compact) {
    return (
      <TouchableOpacity
        onPress={() => onOrderPress(order)}
        className="bg-white rounded-lg p-3 border border-gray-200 mb-2"
        activeOpacity={0.8}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Animated.View
              className="w-3 h-3 rounded-full mr-3"
              style={{
                backgroundColor: statusConfig.bg,
                transform: [{ scale: statusConfig.pulse ? pulseAnim : 1 }]}}
            />
            <View className="flex-1">
              <Text className="font-medium text-gray-900" numberOfLines={1}>
                {order.storeName}
              </Text>
              <Text className="text-sm text-gray-600">
                {t(statusConfig.labelKey)}
              </Text>
            </View>
          </View>
          <VNDFormatter value={order.totalAmount} className="font-bold text-gray-900" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => onOrderPress(order)}
      className="bg-white rounded-lg p-4 border border-gray-200 mb-4 shadow-md"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3}}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={t('order.accessibility.orderCard', { orderNumber: order.orderNumber })}
    >
      {/* 주문 헤더 */}
      <View className="flex-row justify-between items-center mb-3">
        <View>
          <Text className="text-sm text-gray-600 font-medium">
            #{order.orderNumber}
          </Text>
          <Text className="text-xs text-gray-500">
            {new Date(order.createdAt).toLocaleString()}
          </Text>
        </View>

        <Animated.View
          className="rounded-full px-3 py-1 flex-row items-center"
          style={{
            backgroundColor: statusConfig.bg,
            transform: [{ scale: statusConfig.pulse ? pulseAnim : 1 }]}}
        >
          <MaterialCommunityIcons
            name={statusConfig.icon}
            size={14}
            color={statusConfig.text}
          />
          <Text
            className="text-xs font-bold ml-1"
            style={{ color: statusConfig.text }}
          >
            {t(statusConfig.labelKey)}
          </Text>
        </Animated.View>
      </View>

      {/* 매장 정보 */}
      <View className="flex-row items-center mb-3">
        <View className="bg-mint-100 rounded-lg p-2 mr-3">
          <MaterialCommunityIcons name="store" size={20} color={colors.mint[600]} />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
            {order.storeName}
          </Text>
          <Text className="text-sm text-gray-600" numberOfLines={1}>
            {order.items?.map(item => item.name).join(', ')} 외 {order.itemCount}개
          </Text>
        </View>
      </View>

      {/* 예상 시간 & 총 금액 */}
      <View className="flex-row justify-between items-center mb-3">
        {getEstimatedTime() && (
          <View className="flex-row items-center">
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={colors.gray[500]}
            />
            <Text className="text-sm text-gray-600 ml-1">
              {getEstimatedTime()}
            </Text>
          </View>
        )}

        <View className="bg-gray-50 rounded-lg px-3 py-2">
          <VNDFormatter
            value={order.totalAmount}
            className="text-lg font-bold text-gray-900"
          />
        </View>
      </View>

      {/* 액션 버튼들 */}
      {(order.status === 'DELIVERING' || order.status === 'READY') && (
        <TouchableOpacity
          className="bg-mint-500 rounded-lg py-3 flex-row items-center justify-center"
          onPress={() => onTrackDelivery(order)}
          accessibilityRole="button"
          accessibilityLabel={t('order.actions.trackDelivery')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="map-marker-path" size={16} color="white" />
          <Text className="text-white font-semibold text-sm ml-2">
            {t('order.actions.trackDelivery')}
          </Text>
        </TouchableOpacity>
      )}

      {/* 주문 취소 버튼 (대기 상태일 때만) */}
      {order.status === 'PENDING' && (
        <TouchableOpacity
          className="border border-red-200 rounded-lg py-2 flex-row items-center justify-center mt-2"
          onPress={() => onOrderPress(order)}
          accessibilityRole="button"
          accessibilityLabel={t('order.actions.cancelOrder')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="close" size={16} color={colors.red[600]} />
          <Text className="text-red-600 font-medium text-sm ml-1">
            {t('order.actions.cancelOrder')}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
});

export default RealtimeOrderCard;
