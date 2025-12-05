'use client';

/**
 * ThemeToggle.js - 다크/라이트 테마 토글 버튼
 * Local App MVP - 점주용 웹 시스템
 * 
 * @description
 * - 다크/라이트 모드 전환 토글
 * - 시스템 테마 감지 지원
 * - 로컬 스토리지 상태 저장
 * - 부드러운 애니메이션 효과
 * - WCAG 2.1 접근성 준수
 */

import { useState, useEffect } from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

const ThemeToggle = ({ size = 'md', className = '' }) => {
  const [theme, setTheme] = useState('system');
  const [mounted, setMounted] = useState(false);

  // 클라이언트 마운트 후에만 실행
  useEffect(() => {
    setMounted(true);
    
    // 로컬 스토리지에서 테마 설정 로드
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
    
    // 초기 테마 적용
    applyTheme(savedTheme);
  }, []);

  // 시스템 테마 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const handleThemeChange = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];
    
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // 현재 실제 적용된 테마 감지
  const getActualTheme = () => {
    if (!mounted) return 'light';
    
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  const actualTheme = getActualTheme();

  // 사이즈별 스타일
  const sizeStyles = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  // 아이콘 사이즈
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // 테마별 아이콘
  const getIcon = () => {
    const iconClass = iconSizes[size];
    
    switch (theme) {
      case 'dark':
        return <MoonIcon className={iconClass} />;
      case 'light':
        return <SunIcon className={iconClass} />;
      case 'system':
      default:
        return <ComputerDesktopIcon className={iconClass} />;
    }
  };

  // 테마별 툴팁 텍스트
  const getTooltipText = () => {
    switch (theme) {
      case 'dark':
        return '다크 모드 → 시스템 설정';
      case 'light':
        return '라이트 모드 → 다크 모드';
      case 'system':
      default:
        return '시스템 설정 → 라이트 모드';
    }
  };

  if (!mounted) {
    // 서버사이드 렌더링 시 기본 아이콘 표시
    return (
      <div className={`${sizeStyles[size]} ${className} animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg`} />
    );
  }

  return (
    <button
      onClick={handleThemeChange}
      className={`
        ${sizeStyles[size]}
        relative rounded-lg transition-all duration-300 ease-in-out
        bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
        border border-gray-200 dark:border-gray-700
        text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100
        shadow-sm hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-vietnam-mint/50 focus:ring-offset-2
        group overflow-hidden
        ${className}
      `}
      title={getTooltipText()}
      aria-label={`현재 테마: ${theme === 'system' ? '시스템 설정' : theme === 'dark' ? '다크 모드' : '라이트 모드'}`}
    >
      {/* 배경 그라데이션 효과 */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
        ${actualTheme === 'dark' 
          ? 'bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-indigo-500/20'
          : 'bg-gradient-to-br from-amber-300/20 via-yellow-300/20 to-orange-300/20'
        }
      `} />
      
      {/* 아이콘 컨테이너 */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <div className={`
          transform transition-all duration-300 ease-in-out
          ${theme === 'system' ? 'scale-110' : 'scale-100'}
          ${actualTheme === 'dark' ? 'text-blue-400' : 'text-amber-500'}
        `}>
          {getIcon()}
        </div>
      </div>
      
      {/* 테마 인디케이터 */}
      <div className={`
        absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900
        transition-all duration-300 shadow-sm
        ${theme === 'dark' ? 'bg-blue-500' : ''}
        ${theme === 'light' ? 'bg-amber-500' : ''}
        ${theme === 'system' ? 'bg-gray-500' : ''}
      `} />
    </button>
  );
};

export default ThemeToggle;