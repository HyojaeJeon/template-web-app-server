/**
 * AnimatedListItem - 리스트 아이템 애니메이션 래퍼
 * 순차적 페이드인 애니메이션 제공 (주문/매장 카드와 동일)
 *
 * 애니메이션 사양:
 * - opacity: 0 → 1
 * - translateY: 20 → 0
 * - duration: 300ms
 * - delay: Math.min(index * 80, 400)ms
 */
import React, { memo, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const AnimatedListItem = memo(({ children, index = 0, style }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = Math.min(index * 80, 400);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ translateY }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
});

AnimatedListItem.displayName = 'AnimatedListItem';

export default AnimatedListItem;
