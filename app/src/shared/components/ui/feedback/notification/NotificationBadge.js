/**
 * NotificationBadge Component
 * 알림 배지 컴포넌트
 * 채팅, 주문 등 다양한 알림 카운트 표시
 * CLAUDE.md 가이드라인 준수
 */

import React, { memo, useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import PropTypes from 'prop-types';

/**
 * 알림 배지 컴포넌트
 */
const NotificationBadge = memo(({
  count = 0,
  maxCount = 99,
  size = 'medium',
  color = 'red',
  showZero = false,
  animated = true,
  className = '',
  textClassName = '',
  style = {},
  testID = 'notification-badge'}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // 표시할 카운트 계산
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  // 배지를 표시할지 결정
  const shouldShow = showZero || count > 0;

  // 크기별 스타일 클래스 정의
  const sizeClasses = {
    small: 'min-w-[16px] h-4 px-1',
    medium: 'min-w-[20px] h-5 px-1.5',
    large: 'min-w-[24px] h-6 px-2'};

  const textSizeClasses = {
    small: 'text-[10px]',
    medium: 'text-xs',
    large: 'text-sm'};

  // 색상별 스타일 정의 (red는 탭 배지와 동일한 #DA020E 사용)
  const colorStyles = {
    red: { backgroundColor: '#DA020E' },
    blue: { backgroundColor: '#3B82F6' },
    green: { backgroundColor: '#22C55E' },
    yellow: { backgroundColor: '#EAB308' },
    orange: { backgroundColor: '#F97316' },
    purple: { backgroundColor: '#A855F7' },
    primary: { backgroundColor: '#2AC1BC' },
    gray: { backgroundColor: '#6B7280' }};

  // 애니메이션 효과
  useEffect(() => {
    if (!animated) {
      return;
    }

    if (shouldShow) {
      // 배지 표시 애니메이션
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true}),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 150,
          friction: 6,
          useNativeDriver: true}),
      ]).start();
    } else {
      // 배지 숨김 애니메이션
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true}),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true}),
      ]).start();
    }
  }, [shouldShow, animated, fadeAnim, scaleAnim]);

  if (!shouldShow) {
    return null;
  }

  const badgeContent = (
    <View
      className={`
        ${sizeClasses[size]}
        rounded-full
        items-center
        justify-center
        shadow-sm
        ${className}
      `}
      style={[colorStyles[color], style]}
      testID={testID}
      accessible={true}
      accessibilityLabel={`${count}개의 새 알림`}
      accessibilityRole="text"
    >
      <Text
        className={`
          text-white
          font-bold
          ${textSizeClasses[size]}
          ${textClassName}
        `}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.7}
      >
        {displayCount}
      </Text>
    </View>
  );

  // 애니메이션이 활성화된 경우
  if (animated) {
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]}}
      >
        {badgeContent}
      </Animated.View>
    );
  }

  // 애니메이션이 비활성화된 경우
  return badgeContent;
});

// PropTypes 정의
NotificationBadge.propTypes = {
  // 표시할 카운트 수
  count: PropTypes.number,

  // 최대 표시 카운트 (이 값을 초과하면 '99+'로 표시)
  maxCount: PropTypes.number,

  // 배지 크기 ('small', 'medium', 'large')
  size: PropTypes.oneOf(['small', 'medium', 'large']),

  // 배지 색상
  color: PropTypes.oneOf(['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'primary', 'gray']),

  // 카운트가 0일 때도 표시할지 여부
  showZero: PropTypes.bool,

  // 애니메이션 활성화 여부
  animated: PropTypes.bool,

  // 추가 CSS 클래스
  className: PropTypes.string,

  // 텍스트 추가 CSS 클래스
  textClassName: PropTypes.string,

  // 추가 스타일
  style: PropTypes.object,

  // 테스트 ID
  testID: PropTypes.string};


export default NotificationBadge;
