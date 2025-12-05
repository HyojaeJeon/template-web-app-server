/**
 * AuthHeader.js - 인증 페이지 헤더 컴포넌트
 * 로그인/회원가입 페이지 상단에 언어 선택기 및 테마 선택기 표시
 * Local App MVP - 점주용 웹 시스템
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/shared/i18n';
import { useTheme } from '@/shared/contexts/ThemeContext';
import {
  Globe,
  Sun,
  Moon,
  Monitor,
  ChevronDown
} from 'lucide-react';

export default function AuthHeader() {
  const { language, setLanguage, t, languages } = useTranslation();
  const { theme, setTheme, systemTheme } = useTheme();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const langRef = useRef(null);
  const themeRef = useRef(null);

  // 언어 옵션
  const languageOptions = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  // 테마 옵션
  const themeOptions = [
    { value: 'light', icon: Sun, label: t('common.theme.light', 'Light') },
    { value: 'dark', icon: Moon, label: t('common.theme.dark', 'Dark') },
    { value: 'system', icon: Monitor, label: t('common.theme.system', 'System') }
  ];

  const currentLanguage = languageOptions.find(lang => lang.code === language) || languageOptions[0];
  const currentThemeOption = themeOptions.find(opt => opt.value === theme) || themeOptions[2];
  const effectiveTheme = theme === 'system' ? systemTheme : theme;

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setThemeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    setLangDropdownOpen(false);
  };

  const handleThemeChange = (themeValue) => {
    setTheme(themeValue);
    setThemeDropdownOpen(false);
  };

  return (
    <div className="absolute top-0 right-0 p-4 flex items-center gap-2 z-50">
      {/* 언어 선택기 */}
      <div className="relative" ref={langRef}>
        <button
          onClick={() => setLangDropdownOpen(!langDropdownOpen)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg
            transition-all duration-200
            ${effectiveTheme === 'dark' 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' 
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500
          `}
          aria-label={t('common.auth.selectLanguage', 'Select language')}
          aria-expanded={langDropdownOpen}
          aria-haspopup="listbox"
        >
          <Globe className="w-4 h-4" />
          <span className="text-lg">{currentLanguage.flag}</span>
          <span className="hidden sm:inline text-sm font-medium">
            {currentLanguage.name}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* 언어 드롭다운 */}
        {langDropdownOpen && (
          <div className={`
            absolute right-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden
            ${effectiveTheme === 'dark' 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
            }
          `}>
            {languageOptions.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`
                  w-full px-4 py-3 flex items-center gap-3
                  transition-colors duration-150
                  ${lang.code === language 
                    ? effectiveTheme === 'dark'
                      ? 'bg-blue-900/50 text-blue-300'
                      : 'bg-blue-50 text-blue-600'
                    : effectiveTheme === 'dark'
                      ? 'hover:bg-gray-700 text-gray-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }
                `}
                role="option"
                aria-selected={lang.code === language}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
                {lang.code === language && (
                  <span className="ml-auto">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 테마 선택기 */}
      <div className="relative" ref={themeRef}>
        <button
          onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg
            transition-all duration-200
            ${effectiveTheme === 'dark' 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' 
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500
          `}
          aria-label={t('common.auth.selectTheme', 'Select theme')}
          aria-expanded={themeDropdownOpen}
          aria-haspopup="listbox"
        >
          <currentThemeOption.icon className="w-4 h-4" />
          <span className="hidden sm:inline text-sm font-medium">
            {currentThemeOption.label}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${themeDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* 테마 드롭다운 */}
        {themeDropdownOpen && (
          <div className={`
            absolute right-0 mt-2 w-44 rounded-lg shadow-lg overflow-hidden
            ${effectiveTheme === 'dark' 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
            }
          `}>
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={`
                    w-full px-4 py-3 flex items-center gap-3
                    transition-colors duration-150
                    ${option.value === theme 
                      ? effectiveTheme === 'dark'
                        ? 'bg-blue-900/50 text-blue-300'
                        : 'bg-blue-50 text-blue-600'
                      : effectiveTheme === 'dark'
                        ? 'hover:bg-gray-700 text-gray-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }
                  `}
                  role="option"
                  aria-selected={option.value === theme}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{option.label}</span>
                  {option.value === theme && (
                    <span className="ml-auto">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}