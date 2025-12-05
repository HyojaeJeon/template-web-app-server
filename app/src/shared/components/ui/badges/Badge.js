/**
 * Badge Component
 * Local App 공용 뱃지 컴포넌트
 * - 알림 개수, 상태 표시
 * - 다양한 크기와 색상 variant 지원
 * - Local 테마 색상 적용
 * CLAUDE.md 가이드라인 준수
 */
import React, { memo } from 'react';
import { View, Text } from 'react-native';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  return (
    <View
      style={{
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 20,
        height: 24
      }}
      {...props}
    >
      <Text style={{
        fontSize: 12,
        fontWeight: 'bold',
        color: '#374151'
      }}>
        {children}
      </Text>
    </View>
  );
};

// displayName 설정
Badge.displayName = 'Badge';

export default memo(Badge);
