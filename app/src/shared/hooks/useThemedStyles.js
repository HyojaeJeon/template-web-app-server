/**
 * useThemedStyles Hook
 * 테마 기반 스타일을 쉽게 적용하기 위한 헬퍼 훅
 *
 * Features:
 * - 다크/라이트 모드에 따른 스타일 자동 적용
 * - 공통 스타일 패턴 제공
 * - 성능 최적화된 스타일 캐싱
 */
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';

/**
 * useThemedStyles Hook
 * @returns {Object} 테마 기반 스타일 객체들
 */
export const useThemedStyles = () => {
  const { isDarkMode, colors: theme } = useTheme();

  const styles = useMemo(() => ({
    // 컨테이너 스타일
    container: {
      flex: 1,
      backgroundColor: theme.bgPrimary,
    },
    containerSecondary: {
      flex: 1,
      backgroundColor: theme.bgSecondary,
    },

    // 카드 스타일
    card: {
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
    },
    cardShadow: {
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      padding: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: 8,
      elevation: 3,
    },

    // 텍스트 스타일
    textTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    textSubtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    textBody: {
      fontSize: 16,
      color: theme.textPrimary,
    },
    textSecondary: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    textMuted: {
      fontSize: 12,
      color: theme.textMuted,
    },
    textLink: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '500',
    },

    // 섹션 헤더
    sectionHeader: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
      paddingHorizontal: 16,
      marginBottom: 16,
    },

    // 입력 스타일
    input: {
      backgroundColor: theme.input.bg,
      borderWidth: 1,
      borderColor: theme.input.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: theme.textPrimary,
    },
    inputFocused: {
      borderColor: theme.input.focusBorder,
      borderWidth: 2,
    },

    // 버튼 스타일
    buttonPrimary: {
      backgroundColor: theme.primary,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonPrimaryText: {
      color: theme.button.primaryText,
      fontSize: 16,
      fontWeight: '600',
    },
    buttonSecondary: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonSecondaryText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    buttonGhost: {
      backgroundColor: 'transparent',
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonGhostText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: '500',
    },

    // 글래스모피즘
    glass: {
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      borderRadius: 16,
    },

    // 구분선
    divider: {
      height: 1,
      backgroundColor: theme.divider,
    },

    // 리스트 아이템
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: theme.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },

    // 배지/태그
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: theme.primaryLight,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    badgeSuccess: {
      backgroundColor: theme.successLight,
    },
    badgeSuccessText: {
      color: theme.success,
    },
    badgeWarning: {
      backgroundColor: theme.warningLight,
    },
    badgeWarningText: {
      color: theme.warning,
    },
    badgeError: {
      backgroundColor: theme.errorLight,
    },
    badgeErrorText: {
      color: theme.error,
    },

    // 아이콘 배경
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // 헤더
    header: {
      backgroundColor: theme.header.bg,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.header.text,
    },

    // 탭바
    tabBar: {
      backgroundColor: theme.tabBar.bg,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },

    // 스켈레톤
    skeleton: {
      backgroundColor: theme.bgSecondary,
      borderRadius: 8,
    },

    // 오버레이
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.bgOverlay,
    },

    // 모달
    modal: {
      backgroundColor: theme.bgCard,
      borderRadius: 20,
      padding: 24,
    },

    // 스위치
    switchTrack: {
      false: theme.switchTrackOff,
      true: theme.switchTrackOn,
    },
    switchThumb: theme.switchThumb,
  }), [theme, isDarkMode]);

  return {
    styles,
    theme,
    isDarkMode,
    // 하위 호환성을 위해 colors도 함께 반환
    colors: theme,
  };
};

/**
 * 조건부 스타일 헬퍼
 */
export const useConditionalStyle = (baseStyle, condition, activeStyle) => {
  return useMemo(() => {
    if (condition) {
      return { ...baseStyle, ...activeStyle };
    }
    return baseStyle;
  }, [baseStyle, condition, activeStyle]);
};

/**
 * 테마 기반 색상 헬퍼
 */
export const useThemedColor = (lightColor, darkColor) => {
  const { isDarkMode } = useTheme();
  return isDarkMode ? darkColor : lightColor;
};

export default useThemedStyles;
