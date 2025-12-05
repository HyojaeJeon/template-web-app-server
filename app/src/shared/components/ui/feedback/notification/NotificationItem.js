/**
 * NotificationItem Component - 재사용 가능한 알림 아이템
 * CLAUDE.md 가이드라인 준수: SOLID 원칙, DRY, WCAG 2.1
 * Local 배달 앱 특화 알림 시스템
 */
import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

/**
 * NotificationItem Component
 *
 * Single Responsibility: 알림 아이템 표시 및 기본 액션 제공만 담당
 * Open/Closed: 새로운 알림 타입이나 액션 추가 시 수정 없이 확장 가능
 */
const NotificationItem = memo(({
  notification = {
    id: null,
    type: 'GENERAL',
    title: '',
    message: '',
    data: null,
    isRead: false,
    priority: 'NORMAL',
    imageUrl: null,
    actionUrl: null,
    createdAt: new Date().toISOString()},
  onPress = () => {},
  onMarkRead = () => {},
  onDelete = () => {},
  showActions = true,
  variant = 'default', // 'default', 'compact', 'minimal'
  className = ''}) => {
  const { t } = useTranslation(['notification', 'common']);

  // 알림 타입별 아이콘 가져오기
  const getNotificationIcon = useCallback(() => {
    const iconMap = {
      ORDER: 'receipt',
      DELIVERY: 'local-shipping',
      PROMOTION: 'local-offer',
      PAYMENT: 'payment',
      SYSTEM: 'info',
      GENERAL: 'notifications',
      CHAT: 'chat',
      REVIEW: 'star',
      SECURITY: 'security'};
    return iconMap[notification.type] || 'notifications';
  }, [notification.type]);

  // 알림 타입별 색상 가져오기
  const getNotificationColor = useCallback(() => {
    const colorMap = {
      ORDER: '#2AC1BC',
      DELIVERY: '#00B14F',
      PROMOTION: '#FFDD00',
      PAYMENT: '#3B82F6',
      SYSTEM: '#6B7280',
      GENERAL: '#6B7280',
      CHAT: '#8B5CF6',
      REVIEW: '#F59E0B',
      SECURITY: '#EF4444'};
    return colorMap[notification.type] || '#6B7280';
  }, [notification.type]);

  // 우선순위별 스타일 가져오기
  const getPriorityStyles = useCallback(() => {
    const priorityMap = {
      HIGH: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2'},
      NORMAL: {
        borderColor: 'transparent',
        backgroundColor: notification.isRead ? '#FAFAFA' : '#FFFFFF'},
      LOW: {
        borderColor: 'transparent',
        backgroundColor: '#F9FAFB'}};
    return priorityMap[notification.priority] || priorityMap.NORMAL;
  }, [notification.priority, notification.isRead]);

  // 시간 포맷팅
  const getFormattedTime = useCallback(() => {
    const now = new Date();
    const notificationDate = new Date(notification.createdAt);
    const diffInMs = now.getTime() - notificationDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return t('notification:time.justNow');
    } else if (diffInMinutes < 60) {
      return t('notification:time.minutesAgo', { minutes: diffInMinutes });
    } else if (diffInHours < 24) {
      return t('notification:time.hoursAgo', { hours: diffInHours });
    } else if (diffInDays < 7) {
      return t('notification:time.daysAgo', { days: diffInDays });
    } else {
      return notificationDate.toLocaleDateString('ko-KR');
    }
  }, [notification.createdAt, t]);

  // 알림 타입 라벨 가져오기
  const getTypeLabel = useCallback(() => {
    const labelMap = {
      ORDER: 'notification:types.order',
      DELIVERY: 'notification:types.delivery',
      PAYMENT: 'notification:types.payment',
      SYSTEM: 'notification:types.system',
      GENERAL: 'notification:types.general',
      CHAT: 'notification:types.chat',
      REVIEW: 'notification:types.review',
      SECURITY: 'notification:types.security'};
    return t(labelMap[notification.type] || labelMap.GENERAL);
  }, [notification.type, t]);

  // 카드 터치 핸들러
  const handleItemPress = useCallback(() => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    onPress(notification);
  }, [notification, onPress, onMarkRead]);

  // 읽음 표시 핸들러
  const handleMarkReadPress = useCallback((e) => {
    e.stopPropagation();
    onMarkRead(notification.id);
  }, [notification.id, onMarkRead]);

  // 삭제 핸들러
  const handleDeletePress = useCallback((e) => {
    e.stopPropagation();
    onDelete(notification.id);
  }, [notification.id, onDelete]);

  // 컨테이너 스타일
  const containerStyles = useMemo(() => {
    const priorityStyles = getPriorityStyles();
    const baseStyles = 'rounded-xl border mb-2';

    const variantStyles = {
      default: 'p-4',
      compact: 'p-3',
      minimal: 'px-4 py-3'};

    const opacityStyle = notification.isRead ? 'opacity-70' : '';

    return `${baseStyles} ${variantStyles[variant]} ${opacityStyle}`;
  }, [variant, notification.isRead, getPriorityStyles]);

  // 카드 그림자 스타일
  const cardShadowStyle = useMemo(() => ({
    shadowColor: notification.isRead ? '#9CA3AF' : getNotificationColor(),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: notification.isRead ? 0.05 : 0.1,
    shadowRadius: notification.isRead ? 2 : 4,
    elevation: notification.isRead ? 1 : 3,
    backgroundColor: getPriorityStyles().backgroundColor,
    borderColor: getPriorityStyles().borderColor,
    borderWidth: getPriorityStyles().borderColor === 'transparent' ? 0 : 1}), [notification.isRead, getNotificationColor, getPriorityStyles]);

  return (
    <TouchableOpacity
      className={`${containerStyles} ${className}`}
      style={cardShadowStyle}
      onPress={handleItemPress}
      activeOpacity={0.95}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}, ${notification.body}`}
      accessibilityHint={t('common:tapToViewDetails')}
      accessibilityState={{ selected: !notification.isRead }}
    >
      <View className="flex-row items-start">
        {/* 알림 타입 아이콘 */}
        <View className="mr-3 mt-1">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: `${getNotificationColor()}15` }}
          >
            <MaterialIcons
              name={getNotificationIcon()}
              size={20}
              color={getNotificationColor()}
            />
          </View>

          {/* 읽지 않은 표시 */}
          {!notification.isRead && (
            <View className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
          )}
        </View>

        {/* 알림 내용 */}
        <View className="flex-1">
          {/* 헤더 라인 */}
          <View className="flex-row items-center justify-between mb-1">
            <Text className={`text-sm font-medium ${
              notification.priority === 'HIGH' ? 'text-red-700' : 'text-gray-600'
            }`}>
              {getTypeLabel()}
            </Text>
            <Text className="text-xs text-gray-500">
              {getFormattedTime()}
            </Text>
          </View>

          {/* 제목 */}
          <Text className={`text-base font-bold mb-1 ${
            notification.isRead ? 'text-gray-700' : 'text-gray-900'
          }`}>
            {notification.title}
          </Text>

          {/* 메시지 */}
          <Text className={`text-sm mb-2 leading-5 ${
            notification.isRead ? 'text-gray-600' : 'text-gray-800'
          }`} numberOfLines={variant === 'minimal' ? 1 : 3}>
            {notification.body}
          </Text>

          {/* 이미지 (있는 경우) */}
          {notification.imageUrl && variant !== 'minimal' && (
            <Image
              source={{ uri: notification.imageUrl }}
              className="w-full h-32 rounded-lg mb-2"
              resizeMode="cover"
              accessible={true}
              accessibilityLabel={t('notification:image')}
            />
          )}

          {/* 우선순위 표시 */}
          {notification.priority === 'HIGH' && (
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="priority-high" size={16} color="#EF4444" />
              <Text className="text-red-600 text-xs font-medium ml-1">
                {t('notification:priority.high')}
              </Text>
            </View>
          )}

          {/* 액션 버튼들 */}
          {showActions && variant !== 'minimal' && (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center" style={{ gap: 12 }}>
                {!notification.isRead && (
                  <TouchableOpacity
                    className="flex-row items-center bg-blue-50 rounded-lg px-3 py-2"
                    onPress={handleMarkReadPress}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t('notification:actions.markAsRead')}
                  >
                    <MaterialIcons name="mark-email-read" size={16} color="#3B82F6" />
                    <Text className="text-blue-700 text-xs font-medium ml-1">
                      {t('notification:actions.read')}
                    </Text>
                  </TouchableOpacity>
                )}

                {notification.data?.actionUrl && (
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="open-in-app" size={16} color="#6B7280" />
                    <Text className="text-gray-600 text-xs ml-1">
                      {t('notification:actions.openApp')}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                className="p-2 rounded-lg"
                onPress={handleDeletePress}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('common:actions.delete')}
              >
                <MaterialIcons name="delete" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});


export default NotificationItem;
