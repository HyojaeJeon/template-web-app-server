/**
 * OptimizedImage
 * - FastImage가 네이티브로 링크되면 FastImage 사용
 * - 링크되지 않았거나 사용 불가 시 RN Image로 자동 폴백
 * - FastImage의 API(priority/cacheControl/resizeMode) 유지, 폴백 시 합리적 매핑
 */
import React, { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Image as RNImage, UIManager, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

let RNFastImage = null;
try {
  // eslint-disable-next-line global-require
  RNFastImage = require('react-native-fast-image');
} catch (_) {
  RNFastImage = null;
}

const hasFastImageNative = (() => {
  try {
    const config = UIManager.getViewManagerConfig
      ? UIManager.getViewManagerConfig('FastImageView')
      : UIManager['FastImageView'];
    return !!(RNFastImage && config);
  } catch {
    return false;
  }
})();

const FastEnums = {
  resizeMode: {
    contain: 'contain',
    cover: 'cover',
    stretch: 'stretch',
    center: 'center',
    repeat: 'repeat',
  },
  priority: { low: 'low', normal: 'normal', high: 'high' },
  cacheControl: {
    immutable: 'immutable',
    web: 'web',
    cacheOnly: 'cacheOnly',
    default: 'default',
    reload: 'reload',
    forceCache: 'force-cache',
    onlyIfCached: 'only-if-cached',
  },
};

const mapCacheForRN = (cache) => {
  switch (cache) {
    case 'immutable':
      return 'force-cache';
    case 'web':
      return 'default';
    case 'cacheOnly':
      return 'only-if-cached';
    case 'default':
    case 'reload':
    case 'force-cache':
    case 'only-if-cached':
      return cache;
    default:
      return undefined;
  }
};

const OptimizedImage = memo((props) => {
  const {
    source,
    style,
    className = '',
    fallbackSource,
    showLoader = true,
    placeholder = 'none', // 'none' | 'shimmer' | 'color'
    placeholderColor = '#F3F4F6', // gray-100
    showError = true,
    resizeMode = FastEnums.resizeMode.cover,
    priority = FastEnums.priority.normal,
    cache = FastEnums.cacheControl.immutable,
    onLoad,
    onError,
    onLoadStart,
    onLoadEnd,
    accessible = true,
    accessibilityLabel,
    testID,
    ...rest
  } = props;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSource, setImageSource] = useState(source);
  const { t } = useTranslation(['accessibility', 'common', 'chat']);
  const imageOpacity = useRef(new Animated.Value(placeholder !== 'none' ? 0 : 1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const handleLoadStart = useCallback(() => {
    setLoading(true);
    setError(false);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoad = useCallback((e) => {
    setLoading(false);
    setError(false);
    // 부드러운 페이드인
    Animated.timing(imageOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    onLoad?.(e);
  }, [onLoad, imageOpacity]);

  const handleError = useCallback((e) => {
    setLoading(false);
    setError(true);
    if (fallbackSource && imageSource !== fallbackSource) {
      setImageSource(fallbackSource);
      setError(false);
      setLoading(true);
      return;
    }
    onError?.(e);
  }, [fallbackSource, imageSource, onError]);

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
    onLoadEnd?.();
  }, [onLoadEnd]);

  const usingFastImage = hasFastImageNative;

  const finalSource = useMemo(() => {
    if (!imageSource) return null;
    if (typeof imageSource === 'string') {
      if (usingFastImage) return { uri: imageSource, priority, cache };
      const rnCache = mapCacheForRN(cache);
      return rnCache ? { uri: imageSource, cache: rnCache } : { uri: imageSource };
    }
    if (typeof imageSource === 'object' && imageSource.uri) {
      if (usingFastImage) {
        return { ...imageSource, priority: imageSource.priority || priority, cache: imageSource.cache || cache };
      }
      const rnCache = mapCacheForRN(imageSource.cache || cache);
      const { cache: _c, priority: _p, ...restSource } = imageSource;
      return rnCache ? { ...restSource, cache: rnCache } : restSource;
    }
    return imageSource;
  }, [imageSource, usingFastImage, priority, cache]);

  // 로컬 require 소스는 스피너/플레이스홀더를 생략
  const isLocalRequire = useMemo(() => typeof source === 'number' || typeof imageSource === 'number', [source, imageSource]);

  useEffect(() => {
    if (loading && placeholder === 'shimmer' && !isLocalRequire) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0, duration: 900, useNativeDriver: true })
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    return undefined;
  }, [loading, placeholder, shimmerAnim, isLocalRequire]);

  const ContainerImage = usingFastImage ? RNFastImage : RNImage;
  const resolvedResizeMode = resizeMode;

  // Shimmer 스타일 계산
  const shimmerTranslateX = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 150] });

  return (
    <View className={`relative overflow-hidden ${className}`} style={style} testID={testID} accessible={accessible} accessibilityLabel={accessibilityLabel || t('accessibility:image')}>
      {/* 실제 이미지 */}
      <Animated.View style={[{ width: '100%', height: '100%' }, { opacity: imageOpacity }]}>
        <ContainerImage
          source={finalSource}
          style={[{ width: '100%', height: '100%' }, style]}
          resizeMode={resolvedResizeMode}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onError={handleError}
          onLoadEnd={handleLoadEnd}
          {...rest}
        />
      </Animated.View>

      {/* 플레이스홀더: 로딩 중 */}
      {loading && !isLocalRequire && placeholder !== 'none' && (
        <View className="absolute inset-0" style={{ backgroundColor: placeholderColor }}>
          {placeholder === 'shimmer' && (
            <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', transform: [{ translateX: shimmerTranslateX }] }}>
              <LinearGradient
                colors={['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0.0)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          )}
        </View>
      )}

      {/* 기존 스피너: 명시적 요청이 있고 로컬이미지가 아닐 때만 */}
      {loading && showLoader && !isLocalRequire && placeholder === 'none' && (
        <View className="absolute inset-0 bg-gray-100 items-center justify-center">
          <ActivityIndicator size="small" color="#2AC1BC" accessibilityLabel={t('common:actions.loading')} />
        </View>
      )}

      {/* 에러 */}
      {error && showError && (
        <View className="absolute inset-0 bg-gray-100 items-center justify-center">
          <Icon name="broken-image" size={24} color="#9CA3AF" accessibilityLabel={t('chat:failedToLoadImage')} />
          <Text className="text-xs text-gray-500 mt-1 text-center px-2">{t('chat:failedToLoadImage')}</Text>
        </View>
      )}
    </View>
  );
});

OptimizedImage.resizeMode = FastEnums.resizeMode;
OptimizedImage.priority = FastEnums.priority;
OptimizedImage.cacheControl = FastEnums.cacheControl;

OptimizedImage.preload = (sources) => {
  if (hasFastImageNative && RNFastImage?.preload) {
    return RNFastImage.preload(sources);
  }
  if (Array.isArray(sources)) {
    const tasks = sources
      .map((src) => (typeof src === 'string' ? src : src?.uri))
      .filter(Boolean)
      .map((uri) => RNImage.prefetch(uri));
    return Promise.allSettled(tasks);
  }
  return Promise.resolve();
};

OptimizedImage.clearMemoryCache = () => {
  if (hasFastImageNative && RNFastImage?.clearMemoryCache) {
    return RNFastImage.clearMemoryCache();
  }
  return Promise.resolve();
};

OptimizedImage.clearDiskCache = () => {
  if (hasFastImageNative && RNFastImage?.clearDiskCache) {
    return RNFastImage.clearDiskCache();
  }
  return Promise.resolve();
};

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
