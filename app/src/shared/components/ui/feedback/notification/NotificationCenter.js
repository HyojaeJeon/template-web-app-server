/**
 * NotificationCenter Component
 * 실시간 알림 센터 컴포넌트
 * 인앱 알림 표시 및 관리
 * CLAUDE.md 가이드라인 준수
 */

import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, PanGestureHandler } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useChat } from '@features/chat/hooks/useChat';

/**
 * 개별 알림 아이템 컴포넌트
 */
const NotificationItem = memo(({
  notification,
  onPress,
  onDismiss,
  style = {},
  testID}) => {
  const { t } = useTranslation(['common', 'chat']);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // 알림 등장 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true}),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true}),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleDismiss = useCallback(() => {
    // 알림 제거 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true}),
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true}),
    ]).start(() => {
      onDismiss?.(notification.id);
    });
  }, [notification.id, onDismiss, fadeAnim, slideAnim]);

  const handlePress = useCallback(() => {
    onPress?.(notification);
  }, [notification, onPress]);

  // 알림 타입별 아이콘 및 색상
  const getNotificationStyle = (type) => {
    switch (type) {
      case 'newMessage':
        return { icon: 'message-text', color: '#2AC1BC', bgColor: '#F0FDFA' };
      case 'storeStatus':
        return { icon: 'store', color: '#00B14F', bgColor: '#F0FDF4' };
      case 'orderUpdate':
        return { icon: 'package-variant', color: '#FFDD00', bgColor: '#FEFCE8' };
      case 'system':
        return { icon: 'bell', color: '#6B7280', bgColor: '#F9FAFB' };
      default:
        return { icon: 'information', color: '#3B82F6', bgColor: '#EFF6FF' };
    }
  };

  const notificationStyle = getNotificationStyle(notification.type);

  // 시간 포맷팅
  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) {
      return t('common:time.justNow');
    } else if (diffInMinutes < 60) {
      return t('common:time.minutesAgo', { count: diffInMinutes });
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return t('common:time.hoursAgo', { count: hours });
    } else {
      return time.toLocaleDateString();
    }
  };

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]},
        style,
      ]}
      testID={testID}
    >
      <TouchableOpacity
        onPress={handlePress}
        className="mx-4 mb-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100"
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel={`${notification.title} - ${notification.body}`}
        accessibilityHint={t('common:accessibility.tapToView')}
      >
        <View className="flex-row items-start">
          {/* 알림 아이콘 */}
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: notificationStyle.bgColor }}
          >
            <Icon
              name={notificationStyle.icon}
              size={20}
              color={notificationStyle.color}
            />
          </View>

          {/* 알림 내용 */}
          <View className="flex-1 pr-2">
            <Text className="text-gray-900 font-medium text-sm mb-1" numberOfLines={1}>
              {notification.title}
            </Text>

            <Text className="text-gray-600 text-sm mb-2" numberOfLines={2}>
              {notification.body}
            </Text>

            <Text className="text-gray-400 text-xs">
              {formatTime(notification.timestamp)}
            </Text>
          </View>

          {/* 제거 버튼 */}
          <TouchableOpacity
            onPress={handleDismiss}
            className="w-6 h-6 items-center justify-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible={true}
            accessibilityLabel={t('common:actions.dismiss')}
            accessibilityRole="button"
          >
            <Icon
              name="close"
              size={16}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>

        {/* 우선순위 표시 */}
        {notification.priority === 'high' && (
          <View className="absolute top-2 right-2">
            <View className="w-2 h-2 bg-red-500 rounded-full" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

/**
 * 알림 센터 메인 컴포넌트
 */
const NotificationCenter = memo(({
  visible = false,
  onClose,
  maxNotifications = 10,
  autoHideDuration = 5000,
  className = '',
  testID = 'notification-center'}) => {
  const { t } = useTranslation(['common', 'chat']);
  const {
    lastNotification,
    totalUnreadCount,
    markAllAsRead} = useChat();

  // 상태
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(visible);

  // 애니메이션
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const containerAnim = useRef(new Animated.Value(0)).current;

  // 새 알림 추가
  useEffect(() => {
    if (lastNotification) {
      const newNotification = {
        id: `${lastNotification.type}_${lastNotification.timestamp}`,
        type: lastNotification.type,
        title: getNotificationTitle(lastNotification.type, lastNotification.data),
        message: getNotificationMessage(lastNotification.type, lastNotification.data),
        timestamp: lastNotification.timestamp,
        priority: getNotificationPriority(lastNotification.type),
        data: lastNotification.data};

      setNotifications(prev => {
        const filtered = prev.filter(n => n.id !== newNotification.id);
        const updated = [newNotification, ...filtered].slice(0, maxNotifications);
        return updated;
      });

      // 자동 제거 타이머 설정
      if (autoHideDuration > 0) {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        }, autoHideDuration);
      }
    }
  }, [lastNotification, maxNotifications, autoHideDuration]);

  // 알림 타입별 제목 생성
  const getNotificationTitle = (type, data) => {
    switch (type) {
      case 'newMessage':
        return data?.message?.sender?.name || t('chat:notification.newMessage');
      case 'storeStatus':
        return t('chat:notification.storeStatus');
      case 'orderUpdate':
        return t('common:notification.orderUpdate');
      default:
        return t('common:notification.title');
    }
  };

  // 알림 타입별 메시지 생성
  const getNotificationMessage = (type, data) => {
    switch (type) {
      case 'newMessage':
        return data?.message?.content || t('chat:notification.newMessageReceived');
      case 'storeStatus':
        return data?.status === 'online'
          ? t('chat:notification.storeOnline')
          : t('chat:notification.storeOffline');
      case 'orderUpdate':
        return t('common:notification.orderStatusChanged', { status: data?.status });
      default:
        return t('common:notification.message');
    }
  };

  // 알림 우선순위 결정
  const getNotificationPriority = (type) => {
    switch (type) {
      case 'orderUpdate':
        return 'high';
      case 'newMessage':
        return 'medium';
      default:
        return 'normal';
    }
  };

  // 표시/숨김 애니메이션
  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true}),
        Animated.spring(containerAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true}),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true}),
        Animated.timing(containerAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true}),
      ]).start(() => {
        setIsVisible(false);
      });
    }
  }, [visible, overlayAnim, containerAnim]);

  // 알림 클릭 처리
  const handleNotificationPress = useCallback((notification) => {
    console.log('알림 클릭:', notification);
    onClose?.();
  }, [onClose]);

  // 알림 제거 처리
  const handleNotificationDismiss = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // 모든 알림 제거
  const handleClearAll = useCallback(() => {
    setNotifications([]);
    markAllAsRead();
  }, [markAllAsRead]);

  // 오버레이 클릭 처리
  const handleOverlayPress = useCallback(() => {
    onClose?.();
  }, [onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <View
      className="absolute inset-0 z-50"
      testID={testID}
    >
      {/* 반투명 오버레이 */}
      <Animated.View
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5]}) }}
      />

      <TouchableOpacity
        className="absolute inset-0"
        onPress={handleOverlayPress}
        activeOpacity={1}
      />

      {/* 알림 센터 컨테이너 */}
      <Animated.View
        className={`absolute top-0 left-0 right-0 bg-gray-50 ${className}`}
        style={{
          opacity: containerAnim,
          transform: [{
            translateY: containerAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-100, 0]})}],
          maxHeight: '70%'}}
      >
        {/* 헤더 */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200 bg-white">
          <Text className="text-lg font-semibold text-gray-900">
            {t('common:notification.center')}
          </Text>

          <View className="flex-row items-center">
            {notifications.length > 0 && (
              <TouchableOpacity
                onPress={handleClearAll}
                className="mr-4 px-3 py-1 bg-gray-100 rounded-full"
                accessible={true}
                accessibilityLabel={t('common:actions.clearAll')}
              >
                <Text className="text-sm text-gray-600 font-medium">
                  {t('common:actions.clearAll')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 items-center justify-center"
              accessible={true}
              accessibilityLabel={t('common:actions.close')}
            >
              <Icon name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 알림 목록 */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16 }}
        >
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onPress={handleNotificationPress}
                onDismiss={handleNotificationDismiss}
                testID={`notification-item-${notification.id}`}
              />
            ))
          ) : (
            <View className="flex-1 items-center justify-center py-16">
              <Icon
                name="bell-outline"
                size={48}
                color="#D1D5DB"
              />
              <Text className="text-gray-400 text-center mt-4 text-base">
                {t('common:notification.empty')}
              </Text>
              <Text className="text-gray-400 text-center mt-2 text-sm px-8">
                {t('common:notification.emptyDescription')}
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
});


export default NotificationCenter;
