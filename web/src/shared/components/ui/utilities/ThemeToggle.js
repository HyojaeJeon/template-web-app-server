'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * 다크/라이트 테마 토글 컴포넌트
 * Tailwind CSS 다크 모드와 연동
 */
export default function ThemeToggle({ 
  className = '',
  showLabel = false,
  size = 'md' 
}) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 마운트 후에만 테마 확인 (하이드레이션 에러 방지)
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 하이드레이션 전까지는 렌더링하지 않음
  if (!mounted) {
    return (
      <div className={`
        ${size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'}
        bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse
        ${className}
      `} />
    );
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base', 
    lg: 'w-12 h-12 text-lg'
  };

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleTheme}
        className={`
          ${sizeClasses[size]}
          relative inline-flex items-center justify-center
          bg-white dark:bg-gray-800 
          border border-gray-300 dark:border-gray-600
          rounded-full shadow-sm hover:shadow-md
          transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          group overflow-hidden
        `}
        type="button"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {/* 배경 애니메이션 */}
        <div className={`
          absolute inset-0 rounded-full transition-all duration-500
          ${isDark 
            ? 'bg-gradient-to-br from-indigo-900 to-purple-900' 
            : 'bg-gradient-to-br from-yellow-200 to-orange-200'
          }
        `} />
        
        {/* 아이콘 컨테이너 */}
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          <div className={`
            absolute inset-0 flex items-center justify-center transition-all duration-500 transform
            ${isDark ? 'rotate-0 opacity-100' : 'rotate-180 opacity-0'}
          `}>
            <Moon 
              size={iconSize[size]} 
              className="text-yellow-300 drop-shadow-sm" 
            />
          </div>
          
          <div className={`
            absolute inset-0 flex items-center justify-center transition-all duration-500 transform
            ${isDark ? '-rotate-180 opacity-0' : 'rotate-0 opacity-100'}
          `}>
            <Sun 
              size={iconSize[size]} 
              className="text-orange-500 drop-shadow-sm" 
            />
          </div>
        </div>

        {/* 호버 이펙트 */}
        <div className="
          absolute inset-0 rounded-full 
          bg-gradient-to-r from-primary/10 to-secondary/10 
          opacity-0 group-hover:opacity-100 
          transition-opacity duration-300
        " />
      </button>

      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDark ? '다크 모드' : '라이트 모드'}
        </span>
      )}
    </div>
  );
}