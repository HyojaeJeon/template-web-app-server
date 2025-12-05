/**
 * 테마 컨텍스트
 * 라이트/다크 모드 전환 및 시스템 테마 자동 감지
 */

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  systemTheme: 'light'
});

/**
 * 테마 프로바이더
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('system');
  const [systemTheme, setSystemTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  // 시스템 테마 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 초기 테마 설정
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
    setMounted(true);
  }, []);

  // 테마 적용
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const effectiveTheme = theme === 'system' ? systemTheme : theme;

    console.log('Applying theme:', { theme, systemTheme, effectiveTheme }); // 디버깅용

    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      console.log('Dark theme applied, html classes:', root.className); // 디버깅용
    } else {
      root.classList.remove('dark');
      console.log('Light theme applied, html classes:', root.className); // 디버깅용
    }

    // 메타 테마 컬러 업데이트
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        effectiveTheme === 'dark' ? '#1f2937' : '#ffffff'
      );
    }
  }, [theme, systemTheme, mounted]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    console.log('Toggle theme:', theme, '->', newTheme); // 디버깅용
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleSetTheme = (newTheme) => {
    console.log('Set theme:', newTheme); // 디버깅용
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // 현재 적용된 테마 (system일 경우 실제 테마 반환)
  const currentTheme = theme === 'system' ? systemTheme : theme;

  const value = {
    theme,
    currentTheme,
    systemTheme,
    toggleTheme,
    setTheme: handleSetTheme,
    mounted
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * 테마 훅
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

/**
 * 테마 토글 버튼 컴포넌트
 */
export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, currentTheme, mounted } = useTheme();

  // SSR 방지
  if (!mounted) {
    return (
      <div className={`w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`} />
    );
  }

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'dark':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        );
      case 'system':
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const getTooltip = () => {
    switch (theme) {
      case 'light':
        return 'Chuyển sang chế độ tối';
      case 'dark':
        return 'Chuyển sang chế độ hệ thống';
      case 'system':
      default:
        return 'Chuyển sang chế độ sáng';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg transition-colors
        bg-gray-100 hover:bg-gray-200 text-gray-700
        dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300
        focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-2
        ${className}
      `}
      title={getTooltip()}
      aria-label={getTooltip()}
    >
      {getIcon()}
    </button>
  );
}

export default ThemeContext;