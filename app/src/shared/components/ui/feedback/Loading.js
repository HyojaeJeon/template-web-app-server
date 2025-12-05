/**
 * Loading Component
 * Local App 공용 로딩 컴포넌트
 * - 전체 화면 로딩 스크린
 * - 커스텀 메시지 지원
 * - Local 테마 색상 적용 (다크모드 지원)
 * CLAUDE.md 가이드라인 준수
 */
import React, { memo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@providers/ThemeProvider';

const Loading = ({
  text,
  size = 'large',
  color = null, // null일 경우 테마에서 자동 설정
  className = '',
  fullScreen = true,
  ...props
}) => {
  const { t } = useTranslation(['common']);
  const { colors: theme } = useTheme();

  // 테마 기반 색상 (props로 전달된 color가 있으면 우선 사용)
  const indicatorColor = color || theme.primary;

  return (
    <View
      className={`items-center justify-center ${fullScreen ? 'flex-1' : 'py-8'} ${className}`}
      style={{ backgroundColor: fullScreen ? theme.bgPrimary : 'transparent' }}
      {...props}
    >
      <ActivityIndicator
        size={size}
        color={indicatorColor}
      />
      <Text
        className="mt-4 text-base text-center"
        style={{ color: theme.textSecondary }}
      >
        {text || t('common:loading')}
      </Text>
    </View>
  );
};

Loading.displayName = 'Loading';

export default memo(Loading);
export const LoadingSpinner = memo(Loading);
