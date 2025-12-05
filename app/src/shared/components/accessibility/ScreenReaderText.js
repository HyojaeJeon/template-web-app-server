/**
 * ScreenReaderText 컴포넌트
 * 스크린 리더 전용 텍스트 및 접근성 개선 기능 제공
 *
 * 기능:
 * - 시각적으로 숨김 처리된 스크린 리더 전용 텍스트
 * - 동적 접근성 알림
 * - 접근성 힌트 및 라벨 관리
 * - WCAG 2.1 가이드라인 준수
 */

import React, { memo, useCallback, useEffect, useRef } from 'react';
import { View, Text, findNodeHandle } from 'react-native';
import { SafeAccessibilityInfo } from '@shared/utils/platform/accessibility/accessibilityHelper';

const ScreenReaderText = memo(({
  children,
  type = 'text', // 'text' | 'announcement' | 'hint' | 'label'
  priority = 'polite', // 'polite' | 'assertive'
  delay = 0,
  style = {},
  visible = false, // 시각적 표시 여부
}) => {
  const textRef = useRef(null);

  // 접근성 알림
  const announceToScreenReader = useCallback((message) => {
    SafeAccessibilityInfo.announceForAccessibility(message);
  }, []);

  // 포커스 설정
  const focusOnElement = useCallback(() => {
    if (textRef.current) {
      const reactTag = findNodeHandle(textRef.current);
      if (reactTag) {
        SafeAccessibilityInfo.setAccessibilityFocus(reactTag);
      }
    }
  }, []);

  // 타입별 처리
  useEffect(() => {
    if (!children) {return;}

    const message = typeof children === 'string' ? children : children.toString();

    switch (type) {
      case 'announcement':
        const timeoutId = setTimeout(() => {
          announceToScreenReader(message);
        }, delay);
        return () => clearTimeout(timeoutId);

      case 'focus':
        const focusTimeoutId = setTimeout(() => {
          focusOnElement();
        }, delay);
        return () => clearTimeout(focusTimeoutId);

      default:
        // 일반 텍스트는 별도 처리 없음
        break;
    }
  }, [children, type, delay, announceToScreenReader, focusOnElement]);

  // 스크린 리더 전용 스타일
  const screenReaderOnlyStyle = {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
    opacity: 0,
    left: -9999};

  // 시각적 표시 스타일
  const visibleStyle = {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4};

  const textStyle = visible ? { ...visibleStyle, ...style } : { ...screenReaderOnlyStyle, ...style };

  // announcement 타입은 텍스트를 렌더링하지 않음
  if (type === 'announcement' || type === 'focus') {
    return null;
  }

  return (
    <View
      style={visible ? {} : { position: 'absolute' }}
      accessibilityElementsHidden={Boolean(!visible)}
      importantForAccessibility={Boolean(visible) ? 'yes' : 'no-hide-descendants'}
    >
      <Text
        ref={textRef}
        style={textStyle}
        accessibilityRole="text"
        accessibilityLiveRegion={priority}
        accessible={true}
        accessibilityLabel={typeof children === 'string' ? children : undefined}
      >
        {children}
      </Text>
    </View>
  );
});

// 편의 함수들
export const announceToScreenReader = (message, delay = 0) => {
  return (
    <ScreenReaderText
      type="announcement"
      delay={delay}
    >
      {message}
    </ScreenReaderText>
  );
};

export const focusOnScreenReader = (delay = 0) => {
  return (
    <ScreenReaderText
      type="focus"
      delay={delay}
    />
  );
};

export const screenReaderHint = (hint, visible = false) => {
  return (
    <ScreenReaderText
      type="hint"
      visible={visible}
    >
      {hint}
    </ScreenReaderText>
  );
};

export const screenReaderLabel = (label, visible = false) => {
  return (
    <ScreenReaderText
      type="label"
      visible={visible}
    >
      {label}
    </ScreenReaderText>
  );
};

export default ScreenReaderText;
