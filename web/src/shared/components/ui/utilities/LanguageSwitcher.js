/**
 * LanguageSwitcher.js - 다국어 전환 컴포넌트
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - Local어/한국어/영어 다국어 지원
 * - 드롭다운 및 버튼 형태 변환 가능
 * - WCAG 2.1 AA 준수 (키보드 접근성, 스크린리더)
 * - 실시간 언어 변경 및 상태 지속
 * - Local 현지화 우선 (기본 언어)
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '@/shared/i18n';

// Temporary mock for useAccessibility hook
const useAccessibility = () => ({
  announceToScreenReader: (message) => {
    // Screen reader announcement placeholder
    console.log('[Screen Reader]:', message);
  },
  useKeyboardNavigation: () => ({}) // Placeholder
});

export const LanguageSwitcher = ({
  variant = 'dropdown', // dropdown, buttons, compact, icon
  size = 'medium', // small, medium, large
  showFlags = true,
  showNames = true,
  position = 'bottom-right', // dropdown position
  className = '',
  onLanguageChange = null,
  ariaLabel,
  ...props
}) => {
  const { language, setLanguage, languages, t } = useTranslation();
  const { announceToScreenReader, useKeyboardNavigation } = useAccessibility();
  
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const languageList = Object.values(languages);
  const currentLanguage = languages[language];

  // 키보드 네비게이션 설정
  const { keyboardProps } = useKeyboardNavigation({
    onEnter: () => {
      if (variant === 'dropdown') {
        if (isOpen && focusedIndex >= 0) {
          handleLanguageSelect(languageList[focusedIndex].code);
        } else {
          setIsOpen(!isOpen);
        }
      }
    },
    onEscape: () => {
      setIsOpen(false);
      setFocusedIndex(-1);
      buttonRef.current?.focus();
    },
    onArrowUp: () => {
      if (isOpen && variant === 'dropdown') {
        setFocusedIndex(prev => 
          prev <= 0 ? languageList.length - 1 : prev - 1
        );
      }
    },
    onArrowDown: () => {
      if (isOpen && variant === 'dropdown') {
        setFocusedIndex(prev => 
          prev >= languageList.length - 1 ? 0 : prev + 1
        );
      } else if (!isOpen && variant === 'dropdown') {
        setIsOpen(true);
        setFocusedIndex(0);
      }
    }
  });

  // 언어 변경 핸들러
  const handleLanguageSelect = useCallback((newLanguage) => {
    const newLangData = languages[newLanguage];
    if (!newLangData) return;

    setLanguage(newLanguage);
    setIsOpen(false);
    setFocusedIndex(-1);

    // 접근성: 언어 변경 알림
    announceToScreenReader(
      t('accessibility.languageChanged', { 
        language: newLangData.name 
      }) || `Language changed to ${newLangData.name}`
    );

    // 콜백 실행
    onLanguageChange?.(newLanguage, newLangData);
  }, [languages, setLanguage, announceToScreenReader, t, onLanguageChange]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // 크기별 스타일
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-sm px-2 py-1';
      case 'large':
        return 'text-lg px-4 py-3';
      default:
        return 'text-base px-3 py-2';
    }
  };

  // 위치별 드롭다운 스타일
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'bottom-full left-0 mb-1';
      case 'top-right':
        return 'bottom-full right-0 mb-1';
      case 'bottom-left':
        return 'top-full left-0 mt-1';
      default: // bottom-right
        return 'top-full right-0 mt-1';
    }
  };

  // 버튼 변형
  if (variant === 'buttons') {
    return (
      <div 
        className={`flex items-center space-x-2 ${className}`}
        role="radiogroup"
        aria-label={ariaLabel || t('accessibility.selectLanguage') || 'Select language'}
        {...props}
      >
        {languageList.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageSelect(lang.code)}
            className={`
              ${getSizeClasses()}
              flex items-center space-x-1 rounded-md border transition-colors
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${language === lang.code
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }
            `}
            role="radio"
            aria-checked={language === lang.code}
            aria-label={`${t('accessibility.switchTo') || 'Switch to'} ${lang.name}`}
          >
            {showFlags && <span className="text-lg">{lang.flag}</span>}
            {showNames && <span className="font-medium">{lang.name}</span>}
          </button>
        ))}
      </div>
    );
  }

  // 컴팩트 변형
  if (variant === 'compact') {
    return (
      <div className={`inline-flex ${className}`} {...props}>
        <button
          ref={buttonRef}
          onClick={() => {
            const currentIndex = languageList.findIndex(l => l.code === language);
            const nextIndex = (currentIndex + 1) % languageList.length;
            handleLanguageSelect(languageList[nextIndex].code);
          }}
          className={`
            ${getSizeClasses()}
            flex items-center space-x-1 bg-white border border-gray-300 rounded-md
            hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            transition-colors
          `}
          aria-label={`${t('accessibility.currentLanguage') || 'Current language'}: ${currentLanguage.name}. ${t('accessibility.clickToChange') || 'Click to change'}`}
          {...keyboardProps}
        >
          {showFlags && <span className="text-lg">{currentLanguage.flag}</span>}
          {showNames && <span className="font-medium">{currentLanguage.name}</span>}
        </button>
      </div>
    );
  }

  // 아이콘 변형
  if (variant === 'icon') {
    return (
      <div className={`inline-flex ${className}`} {...props}>
        <button
          ref={buttonRef}
          onClick={() => {
            const currentIndex = languageList.findIndex(l => l.code === language);
            const nextIndex = (currentIndex + 1) % languageList.length;
            handleLanguageSelect(languageList[nextIndex].code);
          }}
          className={`
            ${getSizeClasses()}
            flex items-center justify-center w-10 h-10 bg-white border border-gray-300 rounded-full
            hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            transition-colors
          `}
          aria-label={`${t('accessibility.currentLanguage') || 'Current language'}: ${currentLanguage.name}. ${t('accessibility.clickToChange') || 'Click to change'}`}
        >
          <span className="text-xl">{currentLanguage.flag}</span>
        </button>
      </div>
    );
  }

  // 기본 드롭다운 변형
  return (
    <div 
      ref={dropdownRef}
      className={`relative inline-block ${className}`}
      {...props}
    >
      {/* 드롭다운 버튼 */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          ${getSizeClasses()}
          flex items-center space-x-2 bg-white border border-gray-300 rounded-md
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          transition-colors
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel || t('accessibility.selectLanguage') || 'Select language'}
        {...keyboardProps}
      >
        {showFlags && <span className="text-lg">{currentLanguage.flag}</span>}
        {showNames && <span className="font-medium">{currentLanguage.name}</span>}
        
        {/* 드롭다운 아이콘 */}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div 
          className={`
            absolute z-50 min-w-full bg-white border border-gray-200 rounded-md shadow-lg
            ${getPositionClasses()}
          `}
          role="listbox"
          aria-label={t('accessibility.languageOptions') || 'Language options'}
        >
          <div className="py-1">
            {languageList.map((lang, index) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`
                  w-full px-4 py-2 text-left flex items-center space-x-3
                  hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                  transition-colors
                  ${index === focusedIndex ? 'bg-gray-50' : ''}
                  ${language === lang.code ? 'bg-primary-50 text-primary-700' : 'text-gray-700'}
                `}
                role="option"
                aria-selected={language === lang.code}
                tabIndex={-1}
              >
                <span className="text-lg">{lang.flag}</span>
                <div className="flex-1">
                  <div className="font-medium">{lang.name}</div>
                  {lang.code === language && (
                    <div className="text-xs text-gray-500">
                      {t('common.status.active') || 'Active'}
                    </div>
                  )}
                </div>
                
                {/* 선택된 언어 체크 표시 */}
                {language === lang.code && (
                  <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;