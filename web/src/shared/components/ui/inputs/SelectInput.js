'use client'

/**
 * SelectInput 컴포넌트 - Local App 디자인 시스템
 * WCAG 2.1 준수 선택 입력 필드 (키보드 네비게이션 지원)
 */

import React, { useState, useRef, useId, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/shared/i18n';
import debounce from 'lodash/debounce';

const SelectInput = ({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  multiple = false,
  searchable = false,
  clearable = false,
  size = 'medium',
  fullWidth = false,
  name,
  id,
  className = '',
  onFocus,
  onBlur,
  renderOption,
  getOptionLabel,
  getOptionValue,
  // 서버 기반 검색/페이징 지원 옵션
  serverSearch = false,
  onSearchChange = null,
  onLoadMore = null,
  hasMore = false,
  loading = false,
  ...props
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const selectRef = useRef(null);
  const buttonRef = useRef(null);
  const searchInputRef = useRef(null);
  const optionsRef = useRef([]);
  const generatedId = useId();
  const selectId = id || generatedId;

  // placeholder 기본값 설정
  const defaultPlaceholder = placeholder || t('common:selectInput.placeholder');

  // Get option label and value
  const getLabel = (option) => {
    if (getOptionLabel) return getOptionLabel(option);
    return typeof option === 'object' ? option.label : option;
  };

  const getValue = (option) => {
    if (getOptionValue) return getOptionValue(option);
    return typeof option === 'object' ? option.value : option;
  };

  // Filter options based on search (서버 검색 모드에서는 외부 제공 목록을 그대로 사용)
  const filteredOptions = serverSearch
    ? options
    : (searchable && searchTerm
        ? options.filter(option => getLabel(option).toLowerCase().includes(searchTerm.toLowerCase()))
        : options);

  // Get selected option(s)
  const getSelectedOption = () => {
    if (!value) return null;

    if (multiple) {
      return options.filter(option => value?.includes(getValue(option)));
    }

    // value와 option.value를 문자열로 변환하여 비교 (타입 불일치 해결)
    const valueStr = String(value);
    const selected = options.find(option => String(getValue(option)) === valueStr);

    return selected;
  };

  const selectedOption = getSelectedOption();

  // Handle option selection
  const handleSelect = (option, e) => {
    // 이벤트 전파 중지 - 부모 요소의 클릭 핸들러 방지
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const optionValue = getValue(option);

    if (multiple) {
      const newValue = value?.includes(optionValue)
        ? value.filter(v => v !== optionValue)
        : [...(value || []), optionValue];

      if (onChange) {
        onChange({ target: { value: newValue } });
      }
    } else {
      if (onChange) {
        onChange({ target: { value: optionValue } });
      }
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Handle clear
  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange({ target: { value: multiple ? [] : '' } });
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
        } else if (highlightedIndex >= 0) {
          e.preventDefault();
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        }
        break;
      
      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          setSearchTerm('');
        }
        break;
      
      case 'Home':
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(0);
        }
        break;
      
      case 'End':
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(filteredOptions.length - 1);
        }
        break;
      
      default:
        if (searchable && isOpen && e.key.length === 1) {
          searchInputRef.current?.focus();
        }
    }
  };

  // Update dropdown position
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // Helper: check if event target is inside this Select's portal
  const isTargetInsidePortal = (target) => {
    if (!target || typeof target.closest !== 'function') return false;
    const portalEl = target.closest('[data-select-portal="true"]');
    if (!portalEl) return false;
    return portalEl.getAttribute('data-select-owner') === selectId;
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInsideTrigger = selectRef.current && selectRef.current.contains(e.target);
      const clickedInsidePortal = isTargetInsidePortal(e.target);
      if (!clickedInsideTrigger && !clickedInsidePortal) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Debounced 검색 함수 생성 (300ms)
  const debouncedSearch = useMemo(
    () =>
      debounce((term) => {
        if (serverSearch && typeof onSearchChange === 'function') {
          onSearchChange(term);
        }
      }, 300),
    [serverSearch, onSearchChange]
  );

  // 컴포넌트 언마운트 시 debounce 취소
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // 서버 검색 모드: 검색어 변경 시 debounced 호출
  const handleSearchInputChange = useCallback((e) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  // 드롭다운 스크롤 하단 감지 → 추가 로드 요청
  const handleDropdownScroll = (e) => {
    if (!onLoadMore || !hasMore || loading) return;
    const el = e.currentTarget;
    const threshold = 50; // px
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      onLoadMore();
    }
  };

  // Update position when dropdown opens or window resizes/scrolls
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();

      const handlePositionUpdate = () => {
        updateDropdownPosition();
      };

      window.addEventListener('scroll', handlePositionUpdate, true);
      window.addEventListener('resize', handlePositionUpdate);

      return () => {
        window.removeEventListener('scroll', handlePositionUpdate, true);
        window.removeEventListener('resize', handlePositionUpdate);
      };
    }
  }, [isOpen]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [highlightedIndex]);

  const containerClasses = [
    'input-container',
    'select-input-container',
    `input-${size}`,
    fullWidth && 'input-full-width',
    disabled && 'input-disabled',
    error && 'input-error',
    isOpen && 'select-open',
    className
  ].filter(Boolean).join(' ');

  const displayValue = () => {
    if (!selectedOption) return defaultPlaceholder;

    if (multiple) {
      const selected = selectedOption;
      if (selected.length === 0) return defaultPlaceholder;
      if (selected.length === 1) return getLabel(selected[0]);
      return t('common:selectInput.itemsSelected', { count: selected.length });
    }

    return getLabel(selectedOption);
  };

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''} ${className}`} ref={selectRef}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label={t('common:selectInput.required')}>*</span>}
        </label>
      )}

      <div className="relative">
        <button
          ref={buttonRef}
          id={selectId}
          type="button"
          className={`
            w-full h-[42px] px-4 py-2 text-left text-sm bg-white dark:bg-gray-800 border rounded-lg
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900' : 'hover:border-gray-400 dark:hover:border-gray-500'}
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
            text-gray-900 dark:text-gray-100
            transition-colors duration-200
          `}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? `${selectId}-label` : undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
          }
        >
          <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
            {displayValue()}
          </span>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {clearable && value && !disabled && (
              <button
                type="button"
                className="mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 pointer-events-auto"
                onClick={handleClear}
                tabIndex={-1}
                aria-label={t('common:selectInput.clear')}
              >
                ✕
              </button>
            )}
            <span className="text-gray-400 dark:text-gray-500" aria-hidden="true">
              {isOpen ? '▲' : '▼'}
            </span>
          </div>
        </button>

        {isOpen && typeof window !== 'undefined' && createPortal(
          <div
            className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              minWidth: `${dropdownPosition.width}px`,
              width: 'max-content',
              maxWidth: '400px',
              marginTop: '4px'
            }}
            data-select-portal="true"
            data-select-owner={selectId}
            role="listbox"
            aria-multiselectable={multiple}
            onScroll={handleDropdownScroll}
          >
            {searchable && (
              <div className="px-2 pt-2 pb-2 border-b border-gray-200 dark:border-gray-600">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('common:selectInput.searchPlaceholder')}
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={t('common:selectInput.searchLabel')}
                />
              </div>
            )}

            <div className="py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? t('common:selectInput.noSearchResults') : t('common:selectInput.noOptions')}
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const optionValue = getValue(option);
                  const isSelected = multiple
                    ? value?.includes(optionValue)
                    : value === optionValue;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <button
                      key={optionValue}
                      type="button"
                      ref={el => optionsRef.current[index] = el}
                      className={`
                        w-full px-4 py-2 text-left cursor-pointer text-sm
                        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}
                        ${isHighlighted ? 'bg-gray-100 dark:bg-gray-600' : ''}
                        hover:bg-gray-100 dark:hover:bg-gray-600
                        transition-colors duration-150
                      `}
                      onClick={(e) => handleSelect(option, e)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      {multiple && (
                        <span className="mr-2" aria-hidden="true">
                          {isSelected ? '☑' : '☐'}
                        </span>
                      )}
                      {renderOption ? renderOption(option) : getLabel(option)}
                    </button>
                  );
                })
              )}
              {loading && (
                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{t('common:selectInput.loading')}</div>
              )}
              {!loading && !hasMore && filteredOptions.length > 0 && (
                <div className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500">{t('common:selectInput.allItemsLoaded')}</div>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>

      {error && (
        <span id={`${selectId}-error`} className="block mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </span>
      )}

      {!error && helperText && (
        <span id={`${selectId}-helper`} className="block mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </span>
      )}
    </div>
  );
};

export { SelectInput as Select };
export default SelectInput;
