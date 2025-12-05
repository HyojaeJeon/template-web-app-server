import React, { memo } from 'react';
import { View, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '@shared/design/tokens';

const { height: screenHeight } = Dimensions.get('window');

/**
 * GradientBackground Component
 *
 * Local App을 위한 그라데이션 배경 컴포넌트
 * 다양한 테마와 시간대별 최적화된 그라데이션 제공
 */
const GradientBackground = memo(({
  variant = 'default',
  opacity = 1,
  style,
  children,
  ...props
}) => {

  // 그라데이션 패턴 정의 - 더욱 진하고 생동감 있는 효과
  const gradientConfigs = {
    // 기본 - 깔끔한 민트 → 화이트 (훨씬 더 강한 그라데이션)
    default: {
      colors: ['#5ED4D0', '#8FE1DD', '#E8FAF9', '#FFFFFF'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 }},

    // Local 테마 - 국기 색상 기반 (더욱 선명하고 강하게)
    vietnam: {
      colors: ['#FF9A9A', '#FFB84D', '#FFF2CC', '#FFFFFF'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 }},

    // 석양 모드 - 따뜻한 느낌 (더욱 강하게)
    sunset: {
      colors: ['#FF8A50', '#FFB84D', '#FFECD1', '#FFFFFF'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 }},

    // 프리미엄 - 브랜드 컬러 조합 (더욱 선명하게)
    premium: {
      colors: ['#5ED4D0', '#5BC392', '#8FD7B7', '#FFFFFF'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 }},

    // 아침 모드 - 신선한 느낌 (훨씬 더 생생하게)
    morning: {
      colors: ['#3EC8C3', '#5ED4D0', '#8FE1DD', '#FFFFFF'],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 }},

    // 저녁 모드 - 따뜻하고 편안한 느낌 (더욱 강하게)
    evening: {
      colors: ['#FF8A50', '#FFB84D', '#FFECD1', '#FFFFFF'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 }},

    // 프로모션 - 활동적인 느낌 (Local 노랑 기반, 매우 선명하게)
    promotion: {
      colors: ['#F59E0B', '#FBBF24', '#FDE68A', '#FFFFFF'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 }}};

  const config = gradientConfigs[variant] || gradientConfigs.default;

  return (
    <View style={[{ flex: 1 }, style]} {...props}>
      <LinearGradient
        colors={config.colors}
        start={config.start}
        end={config.end}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: opacity,
          zIndex: -1}}
      />
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
});

// 시간대별 자동 테마 선택 기능
GradientBackground.Auto = memo(({ children, ...props }) => {
  const getTimeBasedVariant = () => {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 11) {return 'morning';}    // 아침 (6-11시)
    if (hour >= 11 && hour < 14) {return 'default';}   // 점심 (11-14시)
    if (hour >= 14 && hour < 18) {return 'sunset';}    // 오후 (14-18시)
    if (hour >= 18 && hour < 22) {return 'evening';}   // 저녁 (18-22시)
    return 'premium';                                 // 밤 (22-6시)
  };

  return (
    <GradientBackground
      variant={getTimeBasedVariant()}
      {...props}
    >
      {children}
    </GradientBackground>
  );
});

// 화면별 최적화된 그라데이션
GradientBackground.Screen = memo(({
  screenType = 'home',
  children,
  ...props
}) => {
  const screenVariants = {
    home: 'default',
    store: 'premium',
    search: 'morning',
    profile: 'evening',
    promotion: 'promotion',
    vietnam: 'vietnam'};

  return (
    <GradientBackground
      variant={screenVariants[screenType] || 'default'}
      {...props}
    >
      {children}
    </GradientBackground>
  );
});

// 애니메이션이 있는 그라데이션 (향후 확장용)
GradientBackground.Animated = memo(({
  duration = 3000,
  children,
  ...props
}) => {
  // 애니메이션 기능은 필요시 확장 가능
  return (
    <GradientBackground {...props}>
      {children}
    </GradientBackground>
  );
});


export default GradientBackground;
