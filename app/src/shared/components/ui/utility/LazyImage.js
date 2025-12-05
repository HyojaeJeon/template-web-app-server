/**
 * LazyImage 컴포넌트
 * 이미지 lazy loading 및 성능 최적화 기능 제공
 *
 * 기능:
 * - 뷰포트에 들어올 때만 이미지 로드
 * - 로딩 스켈레톤 UI
 * - 에러 처리 및 fallback 이미지
 * - 캐싱 및 최적화
 * - 접근성 지원
 */

import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Image,
  Text,
  Animated,
  Dimensions,
  TouchableOpacity} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width: screenWidth } = Dimensions.get('window');

const LazyImage = memo(({
  source,
  style = {},
  width,
  height,
  borderRadius = 0,
  placeholder = null,
  fallbackIcon = 'image-not-supported',
  onLoad = null,
  onError = null,
  onPress = null,
  resizeMode = 'cover',
  quality = 'medium', // 'low' | 'medium' | 'high'
  lazy = true,
  threshold = 100, // 로드 시작할 거리 (px)
  accessibilityLabel,
  loadingComponent = null,
  errorComponent = null,
  testID,
  fadeDuration = 300}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const [imageLoaded, setImageLoaded] = useState(false);

  const viewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 뷰포트 감지
  const handleLayout = useCallback(() => {
    if (!lazy || inView) {return;}

    viewRef.current?.measureInWindow((x, y, width, height) => {
      const screenHeight = Dimensions.get('window').height;
      const isVisible = y < screenHeight + threshold && y + height > -threshold;

      if (isVisible && !inView) {
        setInView(true);
      }
    });
  }, [lazy, inView, threshold]);

  // 이미지 로드 성공 핸들러
  const handleLoad = useCallback(() => {
    setLoading(false);
    setImageLoaded(true);

    // 페이드 인 애니메이션
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: fadeDuration,
      useNativeDriver: true}).start();

    if (onLoad) {
      onLoad();
    }
  }, [fadeAnim, fadeDuration, onLoad]);

  // 이미지 로드 실패 핸들러
  const handleError = useCallback((errorEvent) => {
    setLoading(false);
    setError(true);

    if (onError) {
      onError(errorEvent);
    }
  }, [onError]);

  // 이미지 소스 최적화
  const getOptimizedSource = useCallback(() => {
    if (!source) {return null;}

    if (typeof source === 'string') {
      // URL에서 품질 파라미터 추가 (Cloudflare Images 등에서 지원)
      const qualityParams = {
        low: 'q_40',
        medium: 'q_70',
        high: 'q_90'};

      if (source.includes('cloudflare') || source.includes('cdn')) {
        const separator = source.includes('?') ? '&' : '?';
        return { uri: `${source}${separator}${qualityParams[quality]}` };
      }

      return { uri: source };
    }

    return source;
  }, [source, quality]);

  // 스켈레톤 로딩 컴포넌트
  const renderLoading = useCallback(() => {
    if (loadingComponent) {
      return loadingComponent;
    }

    return (
      <View
        className="bg-gray-200 items-center justify-center"
        style={[
          { width, height, borderRadius },
          style,
        ]}
      >
        <Animated.View
          className="bg-gray-300 rounded"
          style={{
            width: '60%',
            height: 4,
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 0.8]})}}
        />
      </View>
    );
  }, [loadingComponent, width, height, borderRadius, style, fadeAnim]);

  // 에러 상태 컴포넌트
  const renderError = useCallback(() => {
    if (errorComponent) {
      return errorComponent;
    }

    return (
      <View
        className="bg-gray-100 items-center justify-center"
        style={[
          { width, height, borderRadius },
          style,
        ]}
      >
        <MaterialIcons
          name={fallbackIcon}
          size={Math.min(width || 40, height || 40) * 0.4}
          color="#9CA3AF"
        />
        <Text className="text-xs text-gray-500 mt-2 text-center">
          이미지 로드 실패
        </Text>
      </View>
    );
  }, [errorComponent, width, height, borderRadius, style, fallbackIcon]);

  // 플레이스홀더 컴포넌트
  const renderPlaceholder = useCallback(() => {
    if (placeholder) {
      return placeholder;
    }

    return (
      <View
        className="bg-gray-200 items-center justify-center"
        style={[
          { width, height, borderRadius },
          style,
        ]}
      >
        <MaterialIcons
          name="image"
          size={Math.min(width || 40, height || 40) * 0.4}
          color="#D1D5DB"
        />
      </View>
    );
  }, [placeholder, width, height, borderRadius, style]);

  // 컨테이너 스타일
  const containerStyle = {
    width,
    height,
    borderRadius,
    overflow: 'hidden',
    ...style};

  // 이미지 스타일
  const imageStyle = {
    width: '100%',
    height: '100%',
    opacity: fadeAnim};

  const content = () => {
    // Lazy loading이 활성화되었지만 아직 뷰포트에 들어오지 않음
    if (lazy && !inView) {
      return renderPlaceholder();
    }

    // 에러 상태
    if (error) {
      return renderError();
    }

    // 로딩 중
    if (loading || !imageLoaded) {
      return (
        <>
          {renderLoading()}
          {inView && (
            <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              <Image
                source={getOptimizedSource()}
                style={imageStyle}
                resizeMode={resizeMode}
                onLoad={handleLoad}
                onError={handleError}
                accessibilityLabel={accessibilityLabel}
                testID={testID}
              />
            </Animated.View>
          )}
      </>
      );
    }

    // 이미지 로드 완료
    return (
      <Animated.View style={containerStyle}>
        <Image
          source={getOptimizedSource()}
          style={imageStyle}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
          accessibilityLabel={accessibilityLabel}
          testID={testID}
        />
      </Animated.View>
    );
  };

  const ImageContainer = onPress ? TouchableOpacity : View;

  return (
    <ImageContainer
      ref={viewRef}
      style={containerStyle}
      onLayout={handleLayout}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {content()}
    </ImageContainer>
  );
});

export default LazyImage;
