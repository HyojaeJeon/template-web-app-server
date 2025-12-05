/**
 * SafeAreaWrapper Component
 * SafeArea가 적용된 재사용 가능한 래퍼 컴포넌트
 * 모든 스크린에서 일관된 SafeArea 적용을 보장
 */
import React, { memo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SafeAreaWrapper = memo(({
  children,
  includeTop = true,
  includeBottom = true,
  topOffset = 0,
  bottomOffset = 0,
  backgroundColor = 'transparent',
  className = '',
  style = {},
  ...props
}) => {
  const insets = useSafeAreaInsets();

  const containerStyle = {
    paddingTop: includeTop ? insets.top + topOffset : topOffset,
    paddingBottom: includeBottom ? insets.bottom + bottomOffset : bottomOffset,
    backgroundColor,
    ...style};

  return (
    <View
      className={`flex-1 ${className}`}
      style={containerStyle}
      {...props}
    >
      {children}
    </View>
  );
});


export default SafeAreaWrapper;
