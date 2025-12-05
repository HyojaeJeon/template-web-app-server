/**
 * useDarkMode.js - 다크모드 전환 훅
 * Local App MVP - 웹 관리자 시스템
 * 
 * @description
 * - 시스템 테마 감지 및 수동 전환
 * - 로컬스토리지 지속성
 * - CSS 클래스 자동 토글
 * - 접근성 준수 (prefers-color-scheme 지원)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'store-theme';
const THEME_VALUES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

export const useDarkMode = (defaultTheme = THEME_VALUES.SYSTEM) => {
  const [theme, setThemeState] = useState(defaultTheme);
  const [isDark, setIsDark] = useState(false);
  const [systemPreference, setSystemPreference] = useState('light');

  // 시스템 테마 선호도 감지
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    // 초기 시스템 선호도 설정
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');

    // 시스템 테마 변경 감지
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // 로컬스토리지에서 저장된 테마 불러오기
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme && Object.values(THEME_VALUES).includes(savedTheme)) {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
  }, []);

  // 다크모드 상태 계산 및 DOM 업데이트
  useEffect(() => {
    const shouldBeDark = theme === THEME_VALUES.DARK || 
      (theme === THEME_VALUES.SYSTEM && systemPreference === 'dark');
    
    setIsDark(shouldBeDark);

    // DOM 클래스 업데이트
    if (typeof document !== 'undefined') {
      const htmlElement = document.documentElement;
      
      if (shouldBeDark) {
        htmlElement.classList.add('dark');
        htmlElement.classList.remove('light');
      } else {
        htmlElement.classList.add('light');
        htmlElement.classList.remove('dark');
      }

      // 메타 테마 컬러 업데이트 (모바일 브라우저용)
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', shouldBeDark ? '#1f2937' : '#ffffff');
      }

      // 접근성을 위한 색상 체계 선언
      htmlElement.style.colorScheme = shouldBeDark ? 'dark' : 'light';
    }
  }, [theme, systemPreference]);

  // 테마 설정 함수
  const setTheme = useCallback((newTheme) => {
    if (!Object.values(THEME_VALUES).includes(newTheme)) {
      console.warn(`Invalid theme: ${newTheme}`);
      return;
    }

    setThemeState(newTheme);

    // 로컬스토리지에 저장
    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }

    // 커스텀 이벤트 발생 (다른 컴포넌트에서 감지 가능)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('themeChange', {
        detail: { theme: newTheme, isDark: newTheme === THEME_VALUES.DARK || 
          (newTheme === THEME_VALUES.SYSTEM && systemPreference === 'dark') }
      }));
    }
  }, [systemPreference]);

  // 다크모드 토글
  const toggleDarkMode = useCallback(() => {
    const newTheme = isDark ? THEME_VALUES.LIGHT : THEME_VALUES.DARK;
    setTheme(newTheme);
  }, [isDark, setTheme]);

  // 시스템 테마 따르기
  const followSystemTheme = useCallback(() => {
    setTheme(THEME_VALUES.SYSTEM);
  }, [setTheme]);

  // 현재 유효한 테마 값 (시스템 테마가 해석된 값)
  const resolvedTheme = theme === THEME_VALUES.SYSTEM ? systemPreference : theme;

  return {
    // 현재 상태
    theme,           // 설정된 테마 ('light', 'dark', 'system')
    isDark,          // 현재 다크모드 여부
    resolvedTheme,   // 실제 적용된 테마 ('light' 또는 'dark')
    systemPreference, // 시스템 선호 테마
    
    // 액션 함수
    setTheme,        // 특정 테마 설정
    toggleDarkMode,  // 다크/라이트 토글
    followSystemTheme, // 시스템 테마 따르기
    
    // 유틸리티
    isSystemTheme: theme === THEME_VALUES.SYSTEM,
    themeValues: THEME_VALUES
  };
};

// 테마 변경 감지 훅
export const useThemeListener = (callback) => {
  useEffect(() => {
    const handleThemeChange = (event) => {
      callback(event.detail);
    };

    window.addEventListener('themeChange', handleThemeChange);

    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, [callback]);
};

// CSS 변수 기반 테마 색상 관리 훅
export const useThemeColors = () => {
  const { isDark } = useDarkMode();

  return {
    // Local 테마 색상
    primary: isDark ? '#2AC1BC' : '#2AC1BC',
    secondary: isDark ? '#00B14F' : '#00B14F',
    accent: isDark ? '#FFDD00' : '#DA020E',
    
    // 배경 색상
    background: isDark ? '#1f2937' : '#ffffff',
    surface: isDark ? '#374151' : '#f9fafb',
    
    // 텍스트 색상
    text: isDark ? '#f9fafb' : '#1f2937',
    textSecondary: isDark ? '#d1d5db' : '#6b7280',
    
    // 상태 색상
    success: isDark ? '#10b981' : '#059669',
    error: isDark ? '#ef4444' : '#dc2626',
    warning: isDark ? '#f59e0b' : '#d97706',
    info: isDark ? '#3b82f6' : '#2563eb',
    
    // Local 결제 서비스 색상 (다크모드 대응)
    momo: isDark ? '#b83fb8' : '#a855a7',
    zalopay: isDark ? '#3b82f6' : '#2563eb',
    vnpay: isDark ? '#ef4444' : '#dc2626',
    
    isDark
  };
};

export default useDarkMode;