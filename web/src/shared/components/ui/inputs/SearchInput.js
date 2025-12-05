'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * SearchInput - 검색 입력 컴포넌트 (WCAG 2.1 준수)
 * @param {Object} props
 * @param {string} props.value - 검색어 값
 * @param {function} props.onChange - 값 변경 핸들러
 * @param {function} props.onSearch - 검색 실행 핸들러
 * @param {function} props.onClear - 검색어 초기화 핸들러
 * @param {string} props.placeholder - 플레이스홀더 텍스트
 * @param {boolean} props.autoFocus - 자동 포커스 여부
 * @param {boolean} props.disabled - 비활성화 여부
 * @param {boolean} props.loading - 로딩 상태
 * @param {string} props.size - 크기 (sm, md, lg)
 * @param {string} props.variant - 변형 (default, outlined, filled)
 * @param {Object} props.suggestions - 자동완성 제안 목록
 * @param {boolean} props.showSuggestions - 제안 표시 여부
 * @param {string} props.error - 에러 메시지
 * @param {string} props.helperText - 도움말 텍스트
 * @param {string} props.className - 추가 클래스명
 * @param {string} props.ariaLabel - ARIA 라벨
 * @param {string} props.ariaDescribedBy - ARIA describedby
 */
const SearchInput = ({
  value = '',
  onChange,
  onSearch,
  onClear,
  placeholder = 'Search...',
  autoFocus = false,
  disabled = false,
  loading = false,
  size = 'md',
  variant = 'default',
  suggestions = [],
  showSuggestions = false,
  error = '',
  helperText = '',
  className = '',
  ariaLabel = 'Search',
  ariaDescribedBy = '',
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);

  // 크기별 스타일
  const sizeClasses = {
    sm: 'h-9 pl-9 pr-9 text-sm',
    md: 'h-11 pl-11 pr-11 text-base',
    lg: 'h-13 pl-13 pr-13 text-lg'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconPositionClasses = {
    sm: 'left-2.5',
    md: 'left-3',
    lg: 'left-3.5'
  };

  const clearPositionClasses = {
    sm: 'right-2.5',
    md: 'right-3',
    lg: 'right-3.5'
  };

  // 변형별 스타일
  const variantClasses = {
    default: `
      bg-white dark:bg-gray-800
      border-2 border-gray-200 dark:border-gray-700
      focus:border-emerald-500 dark:focus:border-emerald-400
      hover:border-gray-300 dark:hover:border-gray-600
    `,
    outlined: `
      bg-transparent
      border-2 border-emerald-500 dark:border-emerald-400
      focus:border-emerald-600 dark:focus:border-emerald-300
      hover:border-emerald-400 dark:hover:border-emerald-500
    `,
    filled: `
      bg-gray-50 dark:bg-gray-900
      border-2 border-transparent
      focus:border-emerald-500 dark:focus:border-emerald-400
      hover:bg-gray-100 dark:hover:bg-gray-800
    `
  };

  // 입력 변경 처리
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    onChange?.(newValue);
    setSelectedIndex(-1);
  }, [onChange]);

  // 검색 실행
  const handleSearch = useCallback((searchValue = value) => {
    onSearch?.(searchValue);
  }, [value, onSearch]);

  // 검색어 초기화
  const handleClear = useCallback(() => {
    onChange?.('');
    onClear?.();
    inputRef.current?.focus();
    setSelectedIndex(-1);
  }, [onChange, onClear]);

  // 키보드 네비게이션
  const handleKeyDown = useCallback((e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSearch(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, handleSearch]);

  // 선택된 제안 항목으로 스크롤
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  // 에러 또는 헬퍼 텍스트 ID 생성
  const helperId = helperText || error ? 'search-helper' : '';

  return (
    <div className={`relative ${className}`}>
      {/* 검색 입력 필드 */}
      <div className="relative">
        {/* 검색 아이콘 */}
        <MagnifyingGlassIcon
          className={`
            absolute ${iconPositionClasses[size]} top-1/2 -translate-y-1/2
            ${iconSizeClasses[size]}
            ${disabled ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}
            pointer-events-none
          `}
          aria-hidden="true"
        />

        {/* 검색 입력 */}
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`
            w-full
            ${sizeClasses[size]}
            ${variantClasses[variant]}
            rounded-xl
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20
            focus:outline-none
            ${error ? 'border-red-500 dark:border-red-400' : ''}
          `}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy || helperId}
          aria-invalid={error ? 'true' : 'false'}
          role="searchbox"
          aria-autocomplete="list"
          aria-controls={showSuggestions ? 'search-suggestions' : undefined}
          aria-activedescendant={
            selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined
          }
          {...rest}
        />

        {/* 초기화 버튼 */}
        {value && !loading && (
          <button
            onClick={handleClear}
            className={`
              absolute ${clearPositionClasses[size]} top-1/2 -translate-y-1/2
              p-1 rounded-lg
              text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
              hover:bg-gray-100 dark:hover:bg-gray-700
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-emerald-500/20
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            disabled={disabled}
            aria-label="Clear search"
          >
            <XMarkIcon className={iconSizeClasses[size]} />
          </button>
        )}

        {/* 로딩 스피너 */}
        {loading && (
          <div className={`absolute ${clearPositionClasses[size]} top-1/2 -translate-y-1/2`}>
            <div className={`${iconSizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-emerald-500`} />
          </div>
        )}
      </div>

      {/* 자동완성 제안 */}
      {showSuggestions && suggestions.length > 0 && isFocused && (
        <div
          id="search-suggestions"
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              ref={el => suggestionRefs.current[index] = el}
              id={`suggestion-${index}`}
              className={`
                w-full px-4 py-2 text-left
                hover:bg-gray-50 dark:hover:bg-gray-700
                focus:bg-gray-50 dark:focus:bg-gray-700
                focus:outline-none
                transition-colors duration-150
                ${selectedIndex === index ? 'bg-gray-50 dark:bg-gray-700' : ''}
              `}
              onClick={() => {
                handleSearch(suggestion);
                setIsFocused(false);
              }}
              role="option"
              aria-selected={selectedIndex === index}
            >
              <div className="flex items-center">
                <MagnifyingGlassIcon className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-900 dark:text-white">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 에러 또는 도움말 텍스트 */}
      {(error || helperText) && (
        <div
          id={helperId}
          className={`
            mt-1 text-sm
            ${error ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}
          `}
          role={error ? 'alert' : undefined}
        >
          {error || helperText}
        </div>
      )}
    </div>
  );
};

export default SearchInput;