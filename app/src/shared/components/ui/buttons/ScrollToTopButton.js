/**
 * ScrollToTopButton - 스크롤 투 탑 플로팅 버튼
 * 모든 리스트 스크린에서 재사용 가능한 컴포넌트
 *
 * 주의: 컴포넌트 언마운트 시 애니메이션 상태가 초기화되는 문제 방지를 위해
 * visible=false일 때도 렌더링을 유지하고 scale/opacity 애니메이션으로 숨김 처리
 */
import React, { memo, useEffect, useRef } from 'react';
import { TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '@providers/ThemeProvider';

const ScrollToTopButton = memo(({
  visible = false,
  onPress,
  bottom = 24,
  right = 16,
  size = 44,
  iconSize = 22,
  backgroundColor: bgColorProp,
  iconColor: iconColorProp,
}) => {
  const { colors: theme } = useTheme();
  const backgroundColor = bgColorProp || theme.primary;
  const iconColor = iconColorProp || theme.textInverse;
  const animValue = useRef(new Animated.Value(visible ? 1 : 0)).current;

  // 표시/숨김 애니메이션 - 컴포넌트 언마운트 없이 애니메이션만으로 처리
  useEffect(() => {
    if (visible) {
      Animated.spring(animValue, {
        toValue: 1,
        friction: 4,
        tension: 180,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animValue, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, animValue]);

  // 항상 렌더링 - 애니메이션으로 표시/숨김 처리
  // scale과 opacity 모두 적용하여 부드러운 전환
  return (
    <Animated.View
      style={{
        position: 'absolute',
        right,
        bottom,
        zIndex: 9999,
        elevation: 9999,
        transform: [{ scale: animValue }],
        opacity: animValue,
      }}
      // visible이 false면 터치 이벤트 무시
      pointerEvents={visible ? 'box-none' : 'none'}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 12,
        }}
      >
        <Icon name="arrow-upward" size={iconSize} color={iconColor} />
      </TouchableOpacity>
    </Animated.View>
  );
});

ScrollToTopButton.displayName = 'ScrollToTopButton';

export default ScrollToTopButton;
