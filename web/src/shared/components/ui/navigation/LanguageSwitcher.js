/**
 * LanguageSwitcher.js - 다국어 전환 컴포넌트
 * Local App MVP - 웹 관리자 시스템
 * 
 * @description
 * - Local어/한국어/영어 전환 지원
 * - WCAG 2.1 접근성 준수 (키보드 네비게이션, ARIA 지원)
 * - 실시간 언어 전환 및 페이지 메타데이터 업데이트
 * - 로컬 스토리지 지속성
 * - 다양한 디스플레이 변형 (dropdown, button, compact)
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useTranslation, SUPPORTED_LANGUAGES } from '../../../i18n';
import { useClickOutside } from '../../../hooks/ui/useClickOutside';
import { useKeyPress } from '../../../hooks/ui/useKeyPress';

export const LanguageSwitcher = ({
  variant = 'dropdown', // dropdown, button, compact, flag
  size = 'medium',      // small, medium, large
  showFlag = true,
  showName = true,
  showCode = false,
  position = 'bottom-right', // bottom-left, bottom-right, top-left, top-right
  className = '',
  dropdownClassName = '',
  buttonClassName = '',
  ariaLabel,
  onLanguageChange = null,
  ...props
}) => {
  const { language, setLanguage, languages, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // 외부 클릭으로 드롭다운 닫기
  useClickOutside(dropdownRef, () => setIsOpen(false));

  // ESC 키로 드롭다운 닫기
  useKeyPress('Escape', () => {
    if (isOpen) {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  });

  // 언어 변경 처리
  const handleLanguageChange = useCallback((newLanguage) => {
    if (newLanguage !== language) {
      setLanguage(newLanguage);
      
      // 성공 알림 (접근성)
      const message = t('common.accessibility.languageChanged', { 
        language: languages[newLanguage].name 
      });
      
      // 스크린 리더에게 알림
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);

      // 외부 콜백 호출
      if (onLanguageChange) {
        onLanguageChange(newLanguage, languages[newLanguage]);
      }
    }
    
    setIsOpen(false);
  }, [language, setLanguage, languages, t, onLanguageChange]);

  // 키보드 네비게이션
  const handleKeyDown = useCallback((event, languageCode) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLanguageChange(languageCode);
    }
  }, [handleLanguageChange]);

  // 현재 언어 정보
  const currentLanguage = languages[language];

  // 크기별 스타일
  const sizeClasses = {
    small: 'text-sm px-2 py-1',
    medium: 'text-base px-3 py-2', 
    large: 'text-lg px-4 py-3'
  };

  // 위치별 드롭다운 스타일
  const positionClasses = {
    'bottom-left': 'top-full left-0 mt-1',
    'bottom-right': 'top-full right-0 mt-1',
    'top-left': 'bottom-full left-0 mb-1',
    'top-right': 'bottom-full right-0 mb-1'
  };

  // 언어 옵션 렌더링
  const renderLanguageOption = useCallback((langCode, langInfo) => {
    const isSelected = langCode === language;
    const optionId = `language-option-${langCode}`;
    
    return (
      <div
        key={langCode}
        id={optionId}
        role="option"
        aria-selected={isSelected}
        tabIndex={0}
        className={`
          flex items-center space-x-2 px-3 py-2 cursor-pointer transition-colors
          ${isSelected 
            ? 'bg-primary-100 text-primary-900 dark:bg-primary-900/20 dark:text-primary-100' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }
          focus:outline-none focus:bg-primary-50 dark:focus:bg-primary-900/10
        `}
        onClick={() => handleLanguageChange(langCode)}
        onKeyDown={(e) => handleKeyDown(e, langCode)}
      >
        {showFlag && (
          <span 
            className="text-lg"
            role="img" 
            aria-label={`${langInfo.name} flag`}
          >
            {langInfo.flag}
          </span>
        )}
        
        <div className="flex-1 min-w-0">
          {showName && (
            <div className="font-medium truncate">
              {langInfo.name}
            </div>
          )}
          {showCode && (
            <div className="text-xs opacity-75 uppercase">
              {langInfo.code}
            </div>
          )}
        </div>
        
        {isSelected && (
          <svg 
            className="w-4 h-4 text-primary-600 dark:text-primary-400" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    );
  }, [language, showFlag, showName, showCode, handleLanguageChange, handleKeyDown]);

  // 컴팩트 버전
  if (variant === 'compact') {
    return (
      <button
        ref={buttonRef}
        className={`
          inline-flex items-center space-x-1 ${sizeClasses[size]} rounded-md 
          bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
          text-gray-700 dark:text-gray-300 transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${buttonClassName} ${className}
        `}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel || t('common.accessibility.selectLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        {...props}
      >
        <span className="text-sm">{currentLanguage.flag}</span>
        <span className="text-xs font-medium uppercase">{currentLanguage.code}</span>
        
        <svg 
          className="w-3 h-3 transition-transform duration-200" 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        
        {/* 드롭다운 메뉴 */}
        {isOpen && (
          <div
            ref={dropdownRef}
            role="listbox"
            aria-label={t('common.accessibility.languageOptions')}
            className={`
              absolute z-50 ${positionClasses[position]} min-w-[120px]
              bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              rounded-lg shadow-lg py-1 ${dropdownClassName}
            `}
          >
            {Object.entries(languages).map(([langCode, langInfo]) =>
              renderLanguageOption(langCode, langInfo)
            )}
          </div>
        )}
      </button>
    );
  }

  // 버튼 버전 (순환 전환)
  if (variant === 'button') {
    const languageKeys = Object.keys(languages);
    const currentIndex = languageKeys.indexOf(language);
    const nextLanguage = languageKeys[(currentIndex + 1) % languageKeys.length];
    const nextLanguageInfo = languages[nextLanguage];

    return (
      <button
        ref={buttonRef}
        className={`
          inline-flex items-center space-x-2 ${sizeClasses[size]} rounded-lg
          bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
          hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300
          transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${buttonClassName} ${className}
        `}
        onClick={() => handleLanguageChange(nextLanguage)}
        aria-label={ariaLabel || t('common.accessibility.switchTo', { 
          language: nextLanguageInfo.name 
        })}
        title={t('common.accessibility.clickToChange')}
        {...props}
      >
        {showFlag && (
          <span className="text-lg" role="img" aria-label={`${currentLanguage.name} flag`}>
            {currentLanguage.flag}
          </span>
        )}
        
        <div className="flex-1 text-left">
          {showName && (
            <div className="font-medium">
              {currentLanguage.name}
            </div>
          )}
          {showCode && (
            <div className="text-xs opacity-75 uppercase">
              {currentLanguage.code}
            </div>
          )}
        </div>
        
        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </button>
    );
  }

  // 플래그 버전
  if (variant === 'flag') {
    return (
      <div className="relative inline-block">
        <button
          ref={buttonRef}
          className={`
            inline-flex items-center justify-center ${sizeClasses[size]} rounded-full
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            ${buttonClassName} ${className}
          `}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={ariaLabel || t('common.accessibility.currentLanguage', { 
            language: currentLanguage.name 
          })}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          {...props}
        >
          <span 
            className="text-2xl" 
            role="img" 
            aria-label={`${currentLanguage.name} flag`}
          >
            {currentLanguage.flag}
          </span>
        </button>
        
        {/* 드롭다운 메뉴 */}
        {isOpen && (
          <div
            ref={dropdownRef}
            role="listbox"
            aria-label={t('common.accessibility.languageOptions')}
            className={`
              absolute z-50 ${positionClasses[position]} min-w-[140px]
              bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              rounded-lg shadow-lg py-1 ${dropdownClassName}
            `}
          >
            {Object.entries(languages).map(([langCode, langInfo]) =>
              renderLanguageOption(langCode, langInfo)
            )}
          </div>
        )}
      </div>
    );
  }

  // 기본 드롭다운 버전
  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        className={`
          inline-flex items-center justify-between ${sizeClasses[size]} rounded-lg
          bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
          hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300
          transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          min-w-[140px] ${buttonClassName}
        `}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel || t('common.accessibility.selectLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        {...props}
      >
        <div className="flex items-center space-x-2 flex-1">
          {showFlag && (
            <span 
              className="text-lg" 
              role="img" 
              aria-label={`${currentLanguage.name} flag`}
            >
              {currentLanguage.flag}
            </span>
          )}
          
          <div className="flex-1 text-left">
            {showName && (
              <div className="font-medium truncate">
                {currentLanguage.name}
              </div>
            )}
            {showCode && (
              <div className="text-xs opacity-75 uppercase">
                {currentLanguage.code}
              </div>
            )}
          </div>
        </div>
        
        <svg 
          className="w-4 h-4 transition-transform duration-200 ml-2" 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
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
          ref={dropdownRef}
          role="listbox"
          aria-label={t('common.accessibility.languageOptions')}
          className={`
            absolute z-50 ${positionClasses[position]} w-full
            bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
            rounded-lg shadow-lg py-1 ${dropdownClassName}
          `}
        >
          {Object.entries(languages).map(([langCode, langInfo]) =>
            renderLanguageOption(langCode, langInfo)
          )}
        </div>
      )}
    </div>
  );
};

// 언어 전환 훅 (간편한 사용을 위한)
export const useLanguageSwitcher = () => {
  const { language, setLanguage, languages, t } = useTranslation();
  
  const switchToNextLanguage = useCallback(() => {
    const languageKeys = Object.keys(languages);
    const currentIndex = languageKeys.indexOf(language);
    const nextLanguage = languageKeys[(currentIndex + 1) % languageKeys.length];
    setLanguage(nextLanguage);
  }, [language, languages, setLanguage]);
  
  const switchToLanguage = useCallback((targetLanguage) => {
    if (languages[targetLanguage]) {
      setLanguage(targetLanguage);
      return true;
    }
    return false;
  }, [languages, setLanguage]);
  
  const getCurrentLanguageInfo = useCallback(() => {
    return languages[language];
  }, [language, languages]);
  
  return {
    currentLanguage: language,
    currentLanguageInfo: getCurrentLanguageInfo(),
    availableLanguages: languages,
    switchToNextLanguage,
    switchToLanguage,
    t
  };
};

export default LanguageSwitcher;