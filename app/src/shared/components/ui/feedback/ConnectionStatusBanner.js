/**
 * ConnectionStatusBanner Component
 * 연결 상태를 표시하는 배너 - Socket.IO 연결/재연결 상태 표시
 * CLAUDE.md 가이드라인 준수: 재사용 컴포넌트, NativeWind 스타일링
 */
import React, { memo, useEffect, useState } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  Dimensions} from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '@providers/ThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ConnectionStatusBanner = memo(({
  isConnected = false,
  isConnecting = false,
  reconnectAttempts = 0,
  maxReconnectAttempts = 3, // 재연결 시도를 3회로 제한
  connectionError = null,
  onRetryConnection,
  onDismiss,
  showDismissButton = true,
  position = 'top', // 'top' | 'bottom'
  autoHide = true,
  autoHideDelay = 3000,
  className = '',
  testID = 'connection-status-banner'}) => {
  const { t } = useTranslation(['common', 'network', 'realtime']);
  const { isDarkMode, colors: theme } = useTheme();

  // 애니메이션 값들
  const [slideAnim] = useState(new Animated.Value(position === 'top' ? -100 : 100));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [progressAnim] = useState(new Animated.Value(0));

  // 상태
  const [shouldShow, setShouldShow] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState(null);

  // 표시 조건 결정
  useEffect(() => {
    const shouldShowBanner = !isConnected || isConnecting || connectionError || reconnectAttempts > 0;
    setShouldShow(shouldShowBanner);
  }, [isConnected, isConnecting, connectionError, reconnectAttempts]);

  // 슬라이드 애니메이션
  useEffect(() => {
    if (shouldShow) {
      // 배너 표시
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8}).start();

      // 자동 숨김 설정
      if (autoHide && isConnected && !isConnecting && !connectionError) {
        const timer = setTimeout(() => {
          setShouldShow(false);
        }, autoHideDelay);
        setAutoHideTimer(timer);
      }
    } else {
      // 배너 숨김
      Animated.timing(slideAnim, {
        toValue: position === 'top' ? -100 : 100,
        duration: 300,
        useNativeDriver: true}).start();

      // 타이머 정리
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
        setAutoHideTimer(null);
      }
    }

    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, [shouldShow, slideAnim, position, autoHide, autoHideDelay, isConnected, isConnecting, connectionError, autoHideTimer]);

  // 펄스 애니메이션 (재연결 중일 때)
  useEffect(() => {
    if (isConnecting || reconnectAttempts > 0) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true}),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true}),
        ])
      );

      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [isConnecting, reconnectAttempts, pulseAnim]);

  // 재연결 진행률 애니메이션
  useEffect(() => {
    if (reconnectAttempts > 0) {
      const progress = reconnectAttempts / maxReconnectAttempts;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false}).start();
    } else {
      progressAnim.setValue(0);
    }
  }, [reconnectAttempts, maxReconnectAttempts, progressAnim]);

  // 상태별 설정
  const getStatusConfig = () => {
    if (connectionError) {
      return {
        type: 'error',
        backgroundColor: theme.errorBg,
        borderColor: theme.error,
        textColor: theme.error,
        iconColor: theme.error,
        icon: 'error',
        iconFamily: 'MaterialIcons'};
    }

    if (isConnecting || reconnectAttempts > 0) {
      return {
        type: 'warning',
        backgroundColor: theme.warningBg,
        borderColor: theme.warning,
        textColor: theme.warning,
        iconColor: theme.warning,
        icon: 'sync',
        iconFamily: 'MaterialIcons'};
    }

    if (!isConnected) {
      return {
        type: 'offline',
        backgroundColor: theme.bgSecondary,
        borderColor: theme.border,
        textColor: theme.textSecondary,
        iconColor: theme.textTertiary,
        icon: 'cloud-off',
        iconFamily: 'MaterialIcons'};
    }

    // 연결 성공
    return {
      type: 'success',
      backgroundColor: theme.successBg,
      borderColor: theme.success,
      textColor: theme.success,
      iconColor: theme.success,
      icon: 'check-circle',
      iconFamily: 'MaterialIcons'};
  };

  // 메시지 생성
  const getMessage = () => {
    if (connectionError) {
      return t('errors.network.connectionFailed', { ns: 'common' });
    }

    if (isConnecting && reconnectAttempts === 0) {
      return t('realtime:connection.connecting');
    }

    if (reconnectAttempts > 0) {
      return t('realtime:connection.retrying', {
        attempt: reconnectAttempts,
        max: maxReconnectAttempts,
      });
    }

    if (!isConnected) {
      return t('realtime:errors.connection_lost');
    }

    return t('network:restored');
  };

  // 액션 버튼 핸들러
  const handleRetry = () => {
    onRetryConnection?.();
  };

  const handleDismiss = () => {
    setShouldShow(false);
    onDismiss?.();
  };

  // 렌더링하지 않을 조건
  if (!shouldShow && slideAnim._value !== 0) {
    return null;
  }

  const statusConfig = getStatusConfig();
  const IconComponent = statusConfig.iconFamily === 'MaterialCommunityIcons'
    ? MaterialCommunityIcons
    : MaterialIcons;

  return (
    <Animated.View
      className={`absolute left-0 right-0 z-50 ${position === 'top' ? 'top-0' : 'bottom-0'} ${className}`}
      style={{
        transform: [{ translateY: slideAnim }]}}
      testID={testID}
    >
      <View
        className="mx-4 rounded-lg shadow-lg border"
        style={{
          backgroundColor: statusConfig.backgroundColor,
          borderColor: statusConfig.borderColor}}
      >
        {/* 재연결 진행률 바 */}
        {reconnectAttempts > 0 && (
          <View className="h-1 rounded-t-lg overflow-hidden" style={{ backgroundColor: theme.bgSecondary }}>
            <Animated.View
              className="h-1"
              style={{
                backgroundColor: theme.warning,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']})}}
            />
          </View>
        )}

        <View className="flex-row items-center justify-between p-4">
          <View className="flex-row items-center flex-1">
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <IconComponent
                name={statusConfig.icon}
                size={20}
                color={statusConfig.iconColor}
              />
            </Animated.View>

            <View className="ml-3 flex-1">
              <Text
                className="text-sm font-medium"
                style={{ color: statusConfig.textColor }}
              >
                {getMessage()}
              </Text>

              {/* 추가 정보 */}
              {connectionError && (
                <Text
                  className="text-xs mt-1"
                  style={{ color: statusConfig.textColor + '80' }}
                >
                  {t('network:tapToRetry')}
                </Text>
              )}

              {reconnectAttempts > 0 && (
                <Text
                  className="text-xs mt-1"
                  style={{ color: statusConfig.textColor + '80' }}
                >
                  {t('network:autoReconnecting')}
                </Text>
              )}
            </View>
          </View>

          {/* 액션 버튼들 */}
          <View className="flex-row items-center ml-2">
            {/* 재시도 버튼 */}
            {(connectionError || (!isConnected && !isConnecting)) && (
              <TouchableOpacity
                onPress={handleRetry}
                className="px-3 py-1 rounded-full mr-2"
                style={{ backgroundColor: statusConfig.iconColor + '20' }}
                testID={`${testID}-retry-button`}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: statusConfig.iconColor }}
                >
                  {t('common:actions.retry')}
                </Text>
              </TouchableOpacity>
            )}

            {/* 닫기 버튼 */}
            {showDismissButton && (isConnected || connectionError) && (
              <TouchableOpacity
                onPress={handleDismiss}
                className="p-1"
                testID={`${testID}-dismiss-button`}
              >
                <MaterialIcons
                  name="close"
                  size={16}
                  color={statusConfig.textColor + '60'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

export default ConnectionStatusBanner;
