'use client'

import { forwardRef, useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from '@/shared/i18n'

/**
 * MultiSelect - 다중 선택 컴포넌트 (WCAG 2.1 준수)
 * 태그 표시 및 검색 기능 지원
 * Local App 디자인 테마 적용
 */
const MultiSelect = forwardRef(({
  // 기본 props
  value = [],
  onChange,
  placeholder = '',
  disabled = false,
  required = false,
  error = false,
  helperText = '',
  className = '',
  
  // 옵션 관련
  options = [],
  optionLabel = 'label',
  optionValue = 'value',
  
  // 다중 선택 관련
  maxSelection,
  minSelection,
  allowDuplicates = false,
  
  // 검색 관련
  searchable = true,
  searchPlaceholder = 'Search...',
  minSearchLength = 0,
  
  // UI 커스터마이징
  size = 'medium',
  variant = 'outline',
  showClearAll = true,
  showSelectAll = true,
  showCounter = true,
  maxTagsVisible = 3,
  chipVariant = 'default',
  maxHeight = 300,
  
  // 태그 관련
  renderTag,
  onRemoveTag,
  tagClassName = '',
  
  // 접근성
  label,
  id,
  name,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  
  ...props
}, ref) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [selectedValues, setSelectedValues] = useState(Array.isArray(value) ? value : [])
  
  const containerRef = useRef(null)
  const searchInputRef = useRef(null)
  const listRef = useRef(null)
  const buttonRef = useRef(null)
  
  // 사이즈별 클래스
  const sizeClasses = {
    small: 'min-h-8 text-sm px-3 py-1',
    medium: 'min-h-10 text-base px-4 py-2',
    large: 'min-h-12 text-lg px-5 py-3'
  }
  
  // 변형별 클래스
  const variantClasses = {
    outline: `
      border border-gray-300 dark:border-gray-600
      bg-white dark:bg-gray-800
      hover:border-primary-500 dark:hover:border-primary-400
      focus-within:border-primary-500 dark:focus-within:border-primary-400
      focus-within:ring-2 focus-within:ring-primary-500/20
    `,
    filled: `
      bg-gray-100 dark:bg-gray-700
      hover:bg-gray-200 dark:hover:bg-gray-600
      focus-within:bg-white dark:focus-within:bg-gray-800
      focus-within:ring-2 focus-within:ring-primary-500/20
    `,
    underline: `
      border-b border-gray-300 dark:border-gray-600
      hover:border-primary-500 dark:hover:border-primary-400
      focus-within:border-primary-500 dark:focus-within:border-primary-400
    `
  }
  
  // 칩 변형별 클래스
  const chipVariantClasses = {
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
    gradient: 'bg-gradient-to-r from-primary-500 to-green-500 text-white',
    bordered: 'bg-transparent border border-gray-300 dark:border-gray-600'
  }
  
  // 에러 상태 클래스
  const errorClasses = error ? `
    border-red-500 dark:border-red-400
    hover:border-red-600 dark:hover:border-red-500
    focus-within:border-red-500 dark:focus-within:border-red-400
    focus-within:ring-red-500/20
  ` : ''
  
  // value prop 동기화
  useEffect(() => {
    setSelectedValues(Array.isArray(value) ? value : [])
  }, [value])
  
  // 필터링된 옵션
  const filteredOptions = searchQuery && searchQuery.length >= minSearchLength
    ? options.filter(opt => 
        opt[optionLabel].toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options
  
  // 선택된 옵션 객체들
  const selectedOptions = options.filter(opt => 
    selectedValues.includes(opt[optionValue])
  )
  
  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // 키보드 네비게이션
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
      return
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
        
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
        
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleToggleOption(filteredOptions[highlightedIndex])
        }
        break
        
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchQuery('')
        buttonRef.current?.focus()
        break
        
      case 'Tab':
        if (e.shiftKey && highlightedIndex === 0) {
          setIsOpen(false)
        }
        break
    }
  }, [isOpen, highlightedIndex, filteredOptions])
  
  // 옵션 토글
  const handleToggleOption = (option) => {
    const optionVal = option[optionValue]
    const isSelected = selectedValues.includes(optionVal)
    
    if (isSelected) {
      // 제거
      if (minSelection && selectedValues.length <= minSelection) {
        return // 최소 선택 개수 유지
      }
      const newValues = selectedValues.filter(v => v !== optionVal)
      setSelectedValues(newValues)
      onChange?.(newValues)
      onRemoveTag?.(option)
    } else {
      // 추가
      if (maxSelection && selectedValues.length >= maxSelection) {
        return // 최대 선택 개수 제한
      }
      const newValues = [...selectedValues, optionVal]
      setSelectedValues(newValues)
      onChange?.(newValues)
    }
  }
  
  // 태그 제거
  const handleRemoveTag = (option, e) => {
    e?.stopPropagation()
    handleToggleOption(option)
  }
  
  // 전체 선택
  const handleSelectAll = (e) => {
    e.stopPropagation()
    const allValues = filteredOptions.map(opt => opt[optionValue])
    const newValues = maxSelection 
      ? allValues.slice(0, maxSelection)
      : allValues
    setSelectedValues(newValues)
    onChange?.(newValues)
  }
  
  // 전체 해제
  const handleClearAll = (e) => {
    e.stopPropagation()
    setSelectedValues([])
    onChange?.([])
    setSearchQuery('')
  }
  
  // 드롭다운 토글
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen && searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
    }
  }
  
  // 보이는 태그들과 숨겨진 개수
  const visibleTags = maxTagsVisible > 0 
    ? selectedOptions.slice(0, maxTagsVisible)
    : selectedOptions
  const hiddenCount = selectedOptions.length - visibleTags.length
  
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label 
          htmlFor={id || name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* 선택 영역 */}
      <div
        ref={buttonRef}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="multiselect-listbox"
        aria-label={ariaLabel || label}
        aria-describedby={ariaDescribedby}
        aria-required={required}
        aria-invalid={error}
        aria-disabled={disabled}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        className={`
          relative w-full rounded-lg cursor-pointer
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${errorClasses}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          transition-all duration-200
        `}
      >
        <div className="flex items-center justify-between gap-2">
          {/* 선택된 태그들 */}
          <div className="flex-1 flex flex-wrap gap-1.5">
            {selectedValues.length === 0 ? (
              <span className="text-gray-500 dark:text-gray-400">
                {placeholder || t('common.selectOptions')}
              </span>
            ) : (
              <>
                {visibleTags.map((option) => (
                  <span
                    key={option[optionValue]}
                    className={`
                      inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm
                      ${chipVariantClasses[chipVariant]}
                      ${tagClassName}
                    `}
                  >
                    {renderTag ? renderTag(option) : option[optionLabel]}
                    
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveTag(option, e)}
                        className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5"
                        aria-label={t('common.remove', { item: option[optionLabel] })}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </span>
                ))}
                
                {hiddenCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    +{hiddenCount}
                  </span>
                )}
              </>
            )}
          </div>
          
          {/* 액션 버튼들 */}
          <div className="flex items-center gap-1">
            {showClearAll && selectedValues.length > 0 && !disabled && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                aria-label={t('common.clearAll')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            <svg
              className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {/* 카운터 표시 */}
        {showCounter && (
          <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-primary-500 text-white text-xs rounded-full">
            {selectedValues.length}
            {maxSelection && `/${maxSelection}`}
          </div>
        )}
      </div>
      
      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div 
          id="multiselect-listbox"
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
          {/* 검색 및 액션 바 */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              {searchable && (
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-9 pr-3 py-1.5 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    aria-label={t('common.search')}
                  />
                </div>
              )}
              
              {showSelectAll && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
                  disabled={maxSelection && filteredOptions.length > maxSelection}
                >
                  {t('common.selectAll')}
                </button>
              )}
            </div>
          </div>
          
          {/* 옵션 리스트 */}
          <ul
            ref={listRef}
            role="listbox"
            aria-multiselectable="true"
            style={{ maxHeight }}
            className="overflow-y-auto"
            aria-label={label}
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                {t('common.noResults')}
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = selectedValues.includes(option[optionValue])
                const isHighlighted = index === highlightedIndex
                const isDisabled = !isSelected && maxSelection && selectedValues.length >= maxSelection
                
                return (
                  <li
                    key={option[optionValue]}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled}
                    onClick={() => !isDisabled && handleToggleOption(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      px-4 py-2 cursor-pointer flex items-center justify-between
                      transition-colors duration-150
                      ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : ''}
                      ${isHighlighted && !isSelected ? 'bg-gray-100 dark:bg-gray-700' : ''}
                      ${!isSelected && !isHighlighted ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                      text-gray-900 dark:text-gray-100
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {/* 체크박스 */}
                      <div className={`
                        w-4 h-4 rounded border-2 flex items-center justify-center
                        ${isSelected 
                          ? 'bg-primary-500 border-primary-500' 
                          : 'border-gray-300 dark:border-gray-600'
                        }
                      `}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      
                      <span>{option[optionLabel]}</span>
                    </div>
                  </li>
                )
              })
            )}
          </ul>
          
          {/* 하단 정보 바 */}
          {(minSelection || maxSelection) && (
            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              {minSelection && (
                <span>{t('common.minSelection', { count: minSelection })}</span>
              )}
              {minSelection && maxSelection && <span> • </span>}
              {maxSelection && (
                <span>{t('common.maxSelection', { count: maxSelection })}</span>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* 헬퍼 텍스트 */}
      {helperText && (
        <p className={`mt-1 text-sm ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {helperText}
        </p>
      )}
    </div>
  )
})

MultiSelect.displayName = 'MultiSelect'

export default MultiSelect