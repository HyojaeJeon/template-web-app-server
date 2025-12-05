/**
 * OfflineIndicator - 오프라인 상태 표시 컴포넌트
 * 네트워크 연결 상태에 따라 자동으로 표시/숨김
 * 캐시된 데이터 정보와 온라인 복구 안내 제공
 */
import React, { memo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  HapticFeedback} from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Services
// import offlineManager from '@shared/services/OfflineManager'; // removed

// Components
import { useToast } from '@providers/ToastProvider';

// Utils
import { useTheme } from '@providers/ThemeProvider';

const OfflineIndicator = memo(({
  showCacheInfo = false,
  position = 'top', // 'top' | 'bottom'
  compact = false}) => {
  const { t } = useTranslation();
  const { isDarkMode, colors: theme } = useTheme();
  const { showToast } = useToast();
  const [isOffline, setIsOffline] = useState(false);
  const [cacheStats, setCacheStats] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // 초기 네트워크 상태 확인
    checkNetworkStatus();

    // 네트워크 상태 변경 리스너 등록
    const unsubscribe = offlineManager.addNetworkListener(handleNetworkChange);

    return unsubscribe;
  }, []);

  useEffect(() => {
    // 오프라인 상태 변경 시 애니메이션
    Animated.timing(fadeAnim, {
      toValue: isOffline ? 1 : 0,
      duration: 300,
      useNativeDriver: true}).start();

    // 캐시 정보 로드
    if (isOffline && showCacheInfo) {
      loadCacheStats();
    }
  }, [isOffline, showCacheInfo, fadeAnim]);

  const checkNetworkStatus = async () => {
    const isOnline = await offlineManager.isNetworkOnline();
    setIsOffline(!isOnline);
  };

  const handleNetworkChange = ({ isOnline, wasOnline }) => {
    setIsOffline(!isOnline);

    // 네트워크 복구 시 토스트 알림
    if (isOnline && !wasOnline) {
      if (HapticFeedback) {
        HapticFeedback.notificationAsync(HapticFeedback.NotificationFeedbackType.Success);
      }

      showToast('network:restoredDesc', { type: 'success', duration: 3000 });
    }
    // 네트워크 끊김 시 햅틱 피드백
    else if (!isOnline && wasOnline) {
      if (HapticFeedback) {
        HapticFeedback.notificationAsync(HapticFeedback.NotificationFeedbackType.Warning);
      }
    }
  };

  const loadCacheStats = async () => {
    try {
      const stats = await offlineManager.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('캐시 통계 로드 실패:', error);
    }
  };

  const handleRetryConnection = async () => {
    if (HapticFeedback) {
      HapticFeedback.impact(HapticFeedback.ImpactFeedbackStyle.Light);
    }

    const isOnline = await offlineManager.isNetworkOnline();
    if (isOnline) {
      setIsOffline(false);
      showToast('network:connectedDesc', { type: 'success' });
    } else {
      showToast('network:checkConnection', { type: 'warning' });
    }
  };

  if (!isOffline) {return null;}

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: position === 'top' ? [-50, 0] : [50, 0]})}]}}
      className={`absolute left-0 right-0 z-50 ${
        position === 'top' ? 'top-0' : 'bottom-0'
      }`}
    >
      <View className="px-4 py-3 shadow-lg" style={{ backgroundColor: theme.warning }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <MaterialCommunityIcons
              name="wifi-off"
              size={20}
              color="white"
            />

            <View className="ml-3 flex-1">
              {compact ? (
                <Text className="text-white font-medium text-sm">
                  {t('network.offline')}
                </Text>
              ) : (
                <>
                  <Text className="text-white font-semibold text-sm">
                    {t('network.offline')}
                  </Text>
                  <Text className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    {t('network.offlineDesc')}
                  </Text>
      </>
              )}
            </View>
          </View>

          {/* 재시도 버튼 */}
          <TouchableOpacity
            onPress={handleRetryConnection}
            className="ml-3 px-3 py-1 rounded"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            accessibilityRole="button"
            accessibilityLabel={t('network.retry')}
          >
            <Text className="text-white font-medium text-xs">
              {t('network.retry')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 캐시 정보 */}
        {showCacheInfo && cacheStats && !compact && (
          <View className="mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.3)' }}>
            <Text className="text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              {t('cache.availableData')}:
            </Text>

            <View className="flex-row justify-between">
              {/* 매장 정보 */}
              <View className="flex-row items-center">
                <MaterialCommunityIcons
                  name="store"
                  size={14}
                  color="white"
                />
                <Text className="text-white text-xs ml-1">
                  {t('cache.stores', { count: cacheStats.stores.count })}
                </Text>
              </View>

              {/* 이미지 캐시 */}
              <View className="flex-row items-center">
                <MaterialCommunityIcons
                  name="image-multiple"
                  size={14}
                  color="white"
                />
                <Text className="text-white text-xs ml-1">
                  {t('cache.images', { size: cacheStats.images.formattedSize })}
                </Text>
              </View>
            </View>

            {/* 마지막 업데이트 */}
            {cacheStats.stores.lastUpdated && (
              <Text className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                {t('cache.lastUpdate')}: {' '}
                {cacheStats.stores.lastUpdated.toLocaleString()}
              </Text>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
});

/**
 * 오프라인 상태를 감지하는 Hook
 */
export const useOfflineStatus = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const isOnline = await offlineManager.isNetworkOnline();
      setIsOffline(!isOnline);
    };

    checkStatus();

    const unsubscribe = offlineManager.addNetworkListener(({ isOnline }) => {
      setIsOffline(!isOnline);
    });

    return unsubscribe;
  }, []);

  return { isOffline, isOnline: !isOffline };
};

/**
 * 오프라인 데이터 로더 Hook
 */
export const useOfflineData = (dataType) => {
  const [cachedData, setCachedData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOfflineData();
  }, [dataType]);

  const loadOfflineData = async () => {
    try {
      setLoading(true);

      let data = null;
      switch (dataType) {
        case 'stores':
          data = await offlineManager.getCachedStoreData();
          break;
        case 'menus':
          // storeId가 필요한 경우 별도 처리
          break;
        default:
          break;
      }

      setCachedData(data);
    } catch (error) {
      console.error('오프라인 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return { cachedData, loading, reload: loadOfflineData };
};

export default OfflineIndicator;
