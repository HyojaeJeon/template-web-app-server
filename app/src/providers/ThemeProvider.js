/**
 * ThemeProvider - 앱 전체 다크/라이트 모드 관리
 *
 * Features:
 * - Light/Dark 테마 모드 지원 (앱 설정 기반)
 * - AsyncStorage 기반 테마 설정 영속화
 * - Night Market 디자인 시스템 통합
 * - theme.js 중앙 테마 사용
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { StatusBar, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '@shared/theme/theme';

// 테마 설정 저장 키
const THEME_STORAGE_KEY = '@app_theme_mode';

// 테마 모드 상수 (시스템 모드 제거)
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
};

// ThemeContext 생성
const ThemeContext = createContext(null);

/**
 * useTheme Hook
 * 테마 관련 상태와 함수에 접근
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

/**
 * ThemeProvider Component
 */
const ThemeProvider = ({ children }) => {
  // 테마 모드 상태 (light, dark) - 기본값: light
  const [themeMode, setThemeMode] = useState(THEME_MODES.LIGHT);

  // 초기 로딩 상태
  const [isLoading, setIsLoading] = useState(true);

  // 실제 적용되는 테마 계산
  const isDarkMode = useMemo(() => {
    return themeMode === THEME_MODES.DARK;
  }, [themeMode]);

  // 현재 테마 색상 (theme.js 사용)
  const colors = useMemo(() => {
    return isDarkMode ? darkTheme : lightTheme;
  }, [isDarkMode]);

  // 저장된 테마 설정 불러오기
  useEffect(() => {
    const loadThemeSettings = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && Object.values(THEME_MODES).includes(savedTheme)) {
          setThemeMode(savedTheme);
        }
      } catch (error) {
        console.error('테마 설정 불러오기 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemeSettings();
  }, []);

  // StatusBar 스타일 업데이트
  useEffect(() => {
    const barStyle = isDarkMode ? 'light-content' : 'dark-content';
    const bgColor = isDarkMode ? colors.bgPrimary : '#FFFFFF';

    StatusBar.setBarStyle(barStyle);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(bgColor);
    }
  }, [isDarkMode, colors]);

  // 테마 모드 변경 함수
  const setTheme = useCallback(async (mode) => {
    if (!Object.values(THEME_MODES).includes(mode)) {
      console.error('Invalid theme mode:', mode);
      return;
    }

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeMode(mode);
    } catch (error) {
      console.error('테마 설정 저장 실패:', error);
    }
  }, []);

  // 테마 토글 함수 (다크 ↔ 라이트)
  const toggleTheme = useCallback(() => {
    const newMode = isDarkMode ? THEME_MODES.LIGHT : THEME_MODES.DARK;
    setTheme(newMode);
  }, [isDarkMode, setTheme]);

  // Context 값
  const contextValue = useMemo(() => ({
    // 상태
    themeMode,
    isDarkMode,
    isLightMode: !isDarkMode,
    colors,
    theme: colors, // theme.js 호환성
    isLoading,

    // 테마 모드 상수
    THEME_MODES,

    // 함수
    setTheme,
    toggleTheme,

    // 유틸리티
    getColor: (colorKey) => colors[colorKey] || colorKey,

    // 스타일 헬퍼
    themedStyle: (lightStyle, darkStyle) => isDarkMode ? darkStyle : lightStyle,

    // 조건부 클래스명 (NativeWind용)
    cn: (lightClass, darkClass) => isDarkMode ? darkClass : lightClass,
  }), [themeMode, isDarkMode, colors, isLoading, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
