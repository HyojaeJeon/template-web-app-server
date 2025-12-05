/**
 * OrderCard Component (New Design - Clean & Modern UI)
 * 새로운 디자인: Pill Badge, 명확한 정보 계층, Full-width CTA 버튼
 */
import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@providers/ThemeProvider';

import { formatVND } from '@shared/components/ui/localization/VNDFormatter';

const OrderCard = memo(({
  order,
  onPress,
  onReorder,
  onWriteReview,
  className = '',
  testID = 'order-card'}) => {
  const { t } = useTranslation(['order', 'common']);
  const { isDarkMode, colors: theme } = useTheme();

  // 🎨 상태별 Badge 스타일 (다크테마 지원)
  const getStatusConfig = (status) => {
    const norm = String(status || 'PENDING').toUpperCase();

    // 🔍 디버깅 로그 추가
    console.log('[OrderCard] Status Debug:', {
      orderNumber: order?.orderNumber,
      rawStatus: status,
      normalizedStatus: norm,
      orderObject: {
        id: order?.id,
        status: order?.status,
        totalAmount: order?.totalAmount || order?.total
      }
    });

    const map = {
      PENDING: {
        badgeColor: theme.warning,
        badgeBg: theme.warningLight,
        textColor: isDarkMode ? theme.warning : '#854D0E',
        icon: 'time-outline',
        label: 'pending'
      },
      CONFIRMED: {
        badgeColor: theme.success,
        badgeBg: theme.successLight,
        textColor: isDarkMode ? theme.success : '#14532D',
        icon: 'checkmark-circle-outline',
        label: 'confirmed'
      },
      PREPARING: {
        badgeColor: theme.success,
        badgeBg: theme.successLight,
        textColor: isDarkMode ? theme.success : '#14532D',
        icon: 'restaurant-outline',
        label: 'preparing'
      },
      READY: {
        badgeColor: theme.success,
        badgeBg: theme.successLight,
        textColor: isDarkMode ? theme.success : '#14532D',
        icon: 'bag-check-outline',
        label: 'ready'
      },
      PICKED_UP: {
        badgeColor: theme.success,
        badgeBg: theme.successLight,
        textColor: isDarkMode ? theme.success : '#14532D',
        icon: 'cube-outline',
        label: 'pickedUp'
      },
      OUT_FOR_DELIVERY: {
        badgeColor: theme.success,
        badgeBg: theme.successLight,
        textColor: isDarkMode ? theme.success : '#14532D',
        icon: 'bicycle-outline',
        label: 'outForDelivery'
      },
      DELIVERING: {
        badgeColor: theme.success,
        badgeBg: theme.successLight,
        textColor: isDarkMode ? theme.success : '#14532D',
        icon: 'bicycle-outline',
        label: 'outForDelivery'
      },
      DELIVERED: {
        badgeColor: theme.textMuted,
        badgeBg: theme.bgTertiary,
        textColor: theme.textSecondary,
        icon: 'checkmark-done-circle-outline',
        label: 'delivered'
      },
      CANCELLED: {
        badgeColor: theme.error,
        badgeBg: theme.errorLight,
        textColor: isDarkMode ? theme.error : '#991B1B',
        icon: 'close-circle-outline',
        label: 'cancelled'
      },
      REFUNDED: {
        badgeColor: theme.error,
        badgeBg: theme.errorLight,
        textColor: isDarkMode ? theme.error : '#991B1B',
        icon: 'arrow-undo-circle-outline',
        label: 'refunded'
      }
    };
    return map[norm] || map.PENDING;
  };

  const statusConfig = useMemo(() => getStatusConfig(order?.status), [order?.status]);

  // 📅 예상 시간 계산
  const estimatedTimeText = useMemo(() => {
    if (!order?.estimatedDeliveryTime) {return null;}

    const now = new Date();
    const estimated = new Date(order.estimatedDeliveryTime);
    const diffMinutes = Math.max(0, Math.ceil((estimated - now) / (1000 * 60)));

    if (diffMinutes === 0) {return t('order:deliveringSoon');}
    if (diffMinutes < 60) {return t('order:estimatedMinutes', { minutes: diffMinutes });}

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return t('order:estimatedTime', { hours, minutes });
  }, [order?.estimatedDeliveryTime, t]);

  // 🎯 주문 번호 포맷팅 (앞 4자리 + 끝 4자리)
  const formattedOrderNumber = useMemo(() => {
    const num = order?.orderNumber || '';
    if (num.length <= 8) return num;
    return `${num.slice(0, 4)}···${num.slice(-4)}`;
  }, [order?.orderNumber]);

  return (
    <TouchableOpacity
      onPress={() => onPress?.(order)}
      className={`mb-4 ${className}`}
      activeOpacity={0.95}
      testID={testID}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`주문 ${order?.orderNumber || 'N/A'}, ${t(`order:status.${order?.status || 'pending'}`)}`}
    >
      {/* Card with Shadow (다크테마 지원) */}
      <View
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: theme.bgCard,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.shadowOpacity,
          shadowRadius: 8,
          elevation: 3
        }}
      >
        {/* 상단: 상태 배지 (우측 상단 Pill 버튼) */}
        <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
          {/* 왼쪽: 주문번호 (작게) */}
          <Text className="text-xs" style={{ color: theme.textMuted }}>
            {formattedOrderNumber}
          </Text>

          {/* 오른쪽: 상태 Pill Badge */}
          <View
            className="px-3 py-1.5 rounded-full flex-row items-center"
            style={{
              backgroundColor: statusConfig.badgeBg
            }}
          >
            <Ionicons name={statusConfig.icon} size={14} color={statusConfig.badgeColor} />
            <Text
              className="text-xs font-bold ml-1"
              style={{ color: statusConfig.textColor }}
            >
              {t(`order:status.${statusConfig.label}`)}
            </Text>
          </View>
        </View>

        {/* 주문 내용 */}
        <View className="px-4 pb-4">
          {/* 가게명 */}
          <Text className="text-lg font-bold mb-2" style={{ color: theme.textPrimary }} numberOfLines={1}>
            {order?.store?.name || 'Unknown Store'}
          </Text>

          {/* 메뉴명 */}
          <View className="mb-3">
            <Text className="text-sm font-medium mb-1" style={{ color: theme.textSecondary }} numberOfLines={1}>
              {(order?.orderItems?.[0]?.name || order?.items?.[0]?.name || 'Unknown Item')}
              {((order?.orderItems?.length || order?.items?.length || 0) > 1) && (
                <Text style={{ color: theme.textMuted }}>
                  {' '}외 {(order?.orderItems?.length || order?.items?.length || 1) - 1}개
                </Text>
              )}
            </Text>
            {(() => {
              const opts = (order?.orderItems?.[0]?.options || order?.items?.[0]?.options || []);
              if (Array.isArray(opts) && opts.length > 0) {
                const label = opts.slice(0, 2).map(o => `${o.name}${o.quantity > 1 ? ` x${o.quantity}` : ''}`).join(', ');
                return (
                  <Text className="text-xs" style={{ color: theme.textMuted }} numberOfLines={1}>
                    {label}{opts.length > 2 ? ` 외 ${opts.length - 2}개` : ''}
                  </Text>
                );
              }
              return null;
            })()}
          </View>

          {/* 금액 */}
          <View className="flex-row items-center justify-between mb-3 pb-3" style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <Text className="text-sm" style={{ color: theme.textMuted }}>
              총 {(order?.orderItems?.length || order?.items?.length || 0)}개 항목
            </Text>
            <Text className="text-xl font-bold" style={{ color: theme.primary }}>
              {formatVND(order?.totalAmount || order?.total || 0)}
            </Text>
          </View>

          {/* 예상 배달 시간 (진행 중인 주문만) */}
          {estimatedTimeText && ['PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(String(order?.status).toUpperCase()) && (
            <View className="flex-row items-center mb-3">
              <MaterialCommunityIcons name="clock-outline" size={16} color={theme.textSecondary} />
              <Text className="text-sm font-medium ml-2" style={{ color: theme.textSecondary }}>
                {estimatedTimeText}
              </Text>
              {order?.isUrgent && (
                <View className="ml-2 px-2 py-1 rounded-full" style={{ backgroundColor: theme.errorLight }}>
                  <Text className="text-xs font-bold" style={{ color: theme.error }}>
                    {t('order:urgent')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* 액션 버튼 (Full-width CTA) */}
          {order?.status === 'DELIVERED' && (
            <>
              {/* 재주문 버튼 (Primary) */}
              <TouchableOpacity
                onPress={() => onReorder?.(order)}
                className="py-4 rounded-xl flex-row items-center justify-center mb-2"
                style={{
                  backgroundColor: theme.button.primary
                }}
                activeOpacity={0.8}
                testID={`${testID}-reorder`}
              >
                <MaterialIcons name="refresh" size={20} color={theme.button.primaryText} />
                <Text className="ml-2 text-base font-bold" style={{ color: theme.button.primaryText }}>
                  {t('order:reorder')}
                </Text>
              </TouchableOpacity>

              {/* 리뷰 작성 버튼 (Secondary Outline) */}
              {!order?.hasReview && (
                <TouchableOpacity
                  onPress={() => onWriteReview?.(order)}
                  className="py-4 rounded-xl flex-row items-center justify-center"
                  style={{
                    backgroundColor: theme.bgCard,
                    borderWidth: 2,
                    borderColor: theme.primary
                  }}
                  activeOpacity={0.8}
                  testID={`${testID}-review`}
                >
                  <MaterialIcons name="star" size={20} color={theme.primary} />
                  <Text className="ml-2 text-base font-bold" style={{ color: theme.primary }}>
                    {t('order:writeReview')}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* 진행 중인 주문 상태 메시지 (선택적) */}
          {['PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(String(order?.status).toUpperCase()) && (
            <View
              className="p-3 rounded-xl flex-row items-center"
              style={{ backgroundColor: isDarkMode ? theme.bgTertiary : '#EFF6FF', borderWidth: 1, borderColor: isDarkMode ? theme.border : '#DBEAFE' }}
            >
              <MaterialCommunityIcons name="information" size={18} color={theme.info} />
              <Text className="text-sm font-medium ml-2 flex-1" style={{ color: isDarkMode ? theme.info : '#1E40AF' }}>
                {order?.status === 'PREPARING' && '매장에서 음식을 준비하고 있어요'}
                {order?.status === 'READY' && '음식이 준비되었어요! 곧 배달을 시작합니다'}
                {order?.status === 'OUT_FOR_DELIVERY' && '배달 중입니다. 곧 도착할 예정이에요'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

OrderCard.displayName = 'OrderCard';

export default OrderCard;