/**
 * MemorizedOrderCard - 메모이제이션이 적용된 주문 카드
 * React.memo, useMemo, useCallback으로 불필요한 리렌더링 방지
 * CLAUDE.md 가이드라인 준수: SOLID 원칙, 성능 최적화, WCAG 2.1
 */
import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

// VND 포맷터 (메모이제이션)
const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0}).format(amount);
};

// 주문 상태 아이콘 매핑 (메모이제이션)
const STATUS_CONFIG = {
  pending: { icon: 'clock-outline', color: '#FFA500', bgColor: '#FFF7ED' },
  confirmed: { icon: 'check-circle', color: '#2AC1BC', bgColor: '#F0FDFA' },
  preparing: { icon: 'chef-hat', color: '#FF6B6B', bgColor: '#FEF2F2' },
  ready: { icon: 'package-variant-closed', color: '#4ECDC4', bgColor: '#ECFEFF' },
  outForDelivery: { icon: 'truck-delivery', color: '#45B7D1', bgColor: '#EFF6FF' },
  delivered: { icon: 'check-all', color: '#96CEB4', bgColor: '#ECFCCB' },
  cancelled: { icon: 'close-circle', color: '#EF4444', bgColor: '#FEF2F2' }};

const MemorizedOrderCard = memo(({
  order,
  onPress,
  onTrackPress,
  showActions = true,
  compact = false}) => {
  const { t } = useTranslation(['order', 'common']);

  // 주문 상태 정보 메모이제이션
  const statusInfo = useMemo(() => {
    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    return {
      ...config,
      label: t(`order.status.${order.status}`)};
  }, [order.status, t]);

  // 총 아이템 수 계산 메모이제이션
  const totalItems = useMemo(() => {
    return order.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;
  }, [order.items]);

  // 예상 배달 시간 계산 메모이제이션
  const estimatedTime = useMemo(() => {
    if (!order.estimatedDeliveryTime) {return null;}

    const now = new Date();
    const estimated = new Date(order.estimatedDeliveryTime);
    const diffMinutes = Math.ceil((estimated - now) / (1000 * 60));

    if (diffMinutes <= 0) {return t('order.arrivingSoon');}
    if (diffMinutes < 60) {return t('order.estimatedMinutes', { minutes: diffMinutes });}

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return t('order.estimatedTime', { hours, minutes });
  }, [order.estimatedDeliveryTime, t]);

  // 매장 이미지 URI 메모이제이션
  const storeImageUri = useMemo(() => {
    return order.store?.image || 'https://via.placeholder.com/60x60?text=Store';
  }, [order.store?.image]);

  // 카드 프레스 핸들러
  const handleCardPress = useCallback(() => {
    onPress?.(order);
  }, [onPress, order]);

  // 추적 버튼 핸들러
  const handleTrackPress = useCallback((event) => {
    event.stopPropagation();
    onTrackPress?.(order);
  }, [onTrackPress, order]);

  // 주문 날짜 포맷팅 메모이제이션
  const formattedDate = useMemo(() => {
    if (!order.createdAt) {return '';}

    const date = new Date(order.createdAt);
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'}).format(date);
  }, [order.createdAt]);

  // 컴팩트 버전
  if (compact) {
    return (
      <TouchableOpacity
        onPress={handleCardPress}
        className="bg-white mx-4 mb-2 rounded-lg border border-gray-200 p-3"
        accessibilityRole="button"
        accessibilityLabel={`주문 ${order.orderNumber}, 상태: ${statusInfo.label}`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <View
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: statusInfo.color }}
              />
              <Text className="text-sm font-medium text-gray-900">
                {order.orderNumber}
              </Text>
              <Text className="text-xs text-gray-500 ml-2">
                {formattedDate}
              </Text>
            </View>
            <Text className="text-sm text-gray-600 mb-1" numberOfLines={1}>
              {order.store?.name}
            </Text>
            <Text className="text-xs text-gray-500">
              {totalItems}개 아이템 • {formatVND(order.totalAmount)}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="#9CA3AF"
          />
        </View>
      </TouchableOpacity>
    );
  }

  // 일반 버전
  return (
    <TouchableOpacity
      onPress={handleCardPress}
      className="bg-white mx-4 mb-4 rounded-xl border border-gray-200 shadow-sm"
      accessibilityRole="button"
      accessibilityLabel={`주문 ${order.orderNumber}, 상태: ${statusInfo.label}`}
    >
      {/* 헤더 */}
      <View className="flex-row items-center justify-between p-4 pb-2">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 mb-1">
            {order.orderNumber}
          </Text>
          <Text className="text-sm text-gray-500">
            {formattedDate}
          </Text>
        </View>

        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: statusInfo.bgColor }}
        >
          <View className="flex-row items-center">
            <MaterialCommunityIcons
              name={statusInfo.icon}
              size={16}
              color={statusInfo.color}
            />
            <Text
              className="text-sm font-medium ml-1"
              style={{ color: statusInfo.color }}
            >
              {statusInfo.label}
            </Text>
          </View>
        </View>
      </View>

      {/* 매장 정보 */}
      <View className="flex-row items-center px-4 pb-2">
        <Image
          source={{ uri: storeImageUri }}
          className="w-12 h-12 rounded-lg"
          style={{ backgroundColor: '#F3F4F6' }}
        />
        <View className="flex-1 ml-3">
          <Text className="text-base font-medium text-gray-900" numberOfLines={1}>
            {order.store?.name}
          </Text>
          <Text className="text-sm text-gray-500" numberOfLines={1}>
            {order.store?.address}
          </Text>
        </View>
      </View>

      {/* 주문 아이템 미리보기 */}
      <View className="px-4 pb-2">
        <Text className="text-sm text-gray-600" numberOfLines={2}>
          {order.items?.map((item, index) =>
            `${item.name} × ${item.quantity}${index < order.items.length - 1 ? ', ' : ''}`
          ).join('')}
        </Text>
      </View>

      {/* 예상 시간 (배달 중인 경우) */}
      {estimatedTime && order.status === 'outForDelivery' && (
        <View className="mx-4 mb-3 p-2 bg-mint-50 rounded-lg border-l-4 border-mint-400">
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="clock-fast" size={16} color="#2AC1BC" />
            <Text className="text-mint-700 font-medium ml-2">
              예상 도착: {estimatedTime}
            </Text>
          </View>
        </View>
      )}

      {/* 하단 정보 및 액션 */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-4 border-t border-gray-100">
        <View>
          <Text className="text-base font-bold text-gray-900">
            {formatVND(order.totalAmount)}
          </Text>
          <Text className="text-xs text-gray-500">
            {totalItems}개 아이템
          </Text>
        </View>

        {showActions && (
          <View className="flex-row">
            {(order.status === 'outForDelivery' || order.status === 'ready') && (
              <TouchableOpacity
                onPress={handleTrackPress}
                className="bg-mint-500 px-4 py-2 rounded-lg flex-row items-center"
                accessibilityRole="button"
                accessibilityLabel="주문 추적하기"
              >
                <MaterialCommunityIcons name="map-marker-path" size={16} color="white" />
                <Text className="text-white font-medium ml-1">
                  {t('order.track')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});


// Props 비교 함수 (성능 최적화)
const areEqual = (prevProps, nextProps) => {
  // 주문 정보의 핵심 필드만 비교
  const prevOrder = prevProps.order;
  const nextOrder = nextProps.order;

  if (!prevOrder || !nextOrder) {return false;}

  return (
    prevOrder.id === nextOrder.id &&
    prevOrder.status === nextOrder.status &&
    prevOrder.estimatedDeliveryTime === nextOrder.estimatedDeliveryTime &&
    prevOrder.totalAmount === nextOrder.totalAmount &&
    prevProps.compact === nextProps.compact &&
    prevProps.showActions === nextProps.showActions
  );
};

export default memo(MemorizedOrderCard, areEqual);
