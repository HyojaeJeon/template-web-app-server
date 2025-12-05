'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  SunIcon, 
  MoonIcon
} from '@heroicons/react/24/outline';

/**
 * next-themes와 호환되는 테마 토글 컴포넌트
 */
export default function NextThemesToggle({ className = '' }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`} />
    );
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon className="w-5 h-5" />;
      case 'dark':
        return <MoonIcon className="w-5 h-5" />;
      default:
        // system이나 기타 경우 기본적으로 라이트 모드 아이콘 표시
        return <SunIcon className="w-5 h-5" />;
    }
  };

  const getTooltip = () => {
    switch (theme) {
      case 'light':
        return '다크 모드로 전환';
      case 'dark':
        return '라이트 모드로 전환';
      default:
        return '다크 모드로 전환';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg transition-all duration-200
        bg-gray-100 hover:bg-gray-200 text-gray-700
        dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      title={getTooltip()}
      aria-label={getTooltip()}
    >
      {getIcon()}
    </button>
  );
}