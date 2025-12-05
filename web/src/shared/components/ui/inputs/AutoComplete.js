'use client'

import { forwardRef, useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from '@/shared/i18n'

/**
 * AutoComplete - 자동완성 입력 컴포넌트 (WCAG 2.1 준수)
 * 추천 항목 및 실시간 검색 지원
 * Local App 디자인 테마 적용
 */
const AutoComplete = forwardRef(({
  // 기본 props
  value = '',
  onChange,
  onSelect,
  placeholder = '',
  disabled = false,
  required = false,
  error = false,
  helperText = '',
  className = '',
  
  // 자동완성 관련
  suggestions = [],
  onSearch,
  minLength = 1,
  maxSuggestions = 10,
  debounceMs = 300,
  
  // 추천 항목 관련
  recentItems = [],
  popularItems = [],
  showRecent = true,
  showPopular = true,
  maxRecent = 5,
  maxPopular = 5,
  
  // UI 커스터마이징
  size = 'medium',
  variant = 'outline',
  showClearButton = true,
  showSearchIcon = true,
  highlightMatch = true,
  groupSuggestions = false,
  
  // 데이터 구조
  suggestionLabel = 'label',
  suggestionValue = 'value',
  suggestionCategory = 'category',
  
  // 렌더링 커스터마이징
  renderSuggestion,
  renderGroup,
  emptySuggestionMessage = 'No results found',
  loadingSuggestionMessage = 'Searching...',
  
  // 접근성
  label,
  id,
  name,
  autoComplete = 'off',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  
  ...props
}, ref) => {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState(value || '')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  const [localSuggestions, setLocalSuggestions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const debounceRef = useRef(null)
  
  // 사이즈별 클래스
  const sizeClasses = {
    small: 'h-8 text-sm px-3',
    medium: 'h-10 text-base px-4',
    large: 'h-12 text-lg px-5'
  }
  
  // 변형별 클래스
  const variantClasses = {
    outline: `
      border border-gray-300 dark:border-gray-600
      bg-white dark:bg-gray-800
      hover:border-primary-500 dark:hover:border-primary-400
      focus:border-primary-500 dark:focus:border-primary-400
      focus:ring-2 focus:ring-primary-500/20
    `,
    filled: `
      bg-gray-100 dark:bg-gray-700
      hover:bg-gray-200 dark:hover:bg-gray-600
      focus:bg-white dark:focus:bg-gray-800
      focus:ring-2 focus:ring-primary-500/20
    `,
    underline: `
      border-b border-gray-300 dark:border-gray-600
      hover:border-primary-500 dark:hover:border-primary-400
      focus:border-primary-500 dark:focus:border-primary-400
      bg-transparent
    `
  }
  
  // 에러 상태 클래스
  const errorClasses = error ? `
    border-red-500 dark:border-red-400
    hover:border-red-600 dark:hover:border-red-500
    focus:border-red-500 dark:focus:border-red-400
    focus:ring-red-500/20
  ` : ''
  
  // value prop 동기화
  useEffect(() => {
    setInputValue(value || '')
  }, [value])
  
  // 검색 함수
  const performSearch = useCallback(async (query) => {
    if (!onSearch) {
      // 로컬 필터링
      const filtered = suggestions.filter(item => {
        const label = typeof item === 'string' ? item : item[suggestionLabel]
        return label.toLowerCase().includes(query.toLowerCase())
      })
      setLocalSuggestions(filtered.slice(0, maxSuggestions))
      setIsSearching(false)
      return
    }
    
    setIsSearching(true)
    try {
      const results = await onSearch(query)
      setLocalSuggestions(results.slice(0, maxSuggestions))
    } catch (error) {
      console.error('AutoComplete search error:', error)
      setLocalSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }, [onSearch, suggestions, maxSuggestions, suggestionLabel])
  
  // 디바운스된 검색
  useEffect(() => {
    if (inputValue.length < minLength) {
      setLocalSuggestions([])
      setIsOpen(false)
      return
    }
    
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchTerm(inputValue)
      performSearch(inputValue)
      setIsOpen(true)
    }, debounceMs)
    
    return () => clearTimeout(debounceRef.current)
  }, [inputValue, minLength, debounceMs, performSearch])
  
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
  
  // 입력값 변경 처리
  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange?.(newValue)
    setHighlightedIndex(-1)
  }
  
  // 항목 선택 처리
  const handleSelect = (item) => {
    const value = typeof item === 'string' ? item : item[suggestionValue]
    const label = typeof item === 'string' ? item : item[suggestionLabel]
    
    setInputValue(label)
    onChange?.(value)
    onSelect?.(item)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }
  
  // Clear 버튼 클릭
  const handleClear = () => {
    setInputValue('')
    onChange?.('')
    setLocalSuggestions([])
    setSearchTerm('')
    inputRef.current?.focus()
  }
  
  // 키보드 네비게이션
  const handleKeyDown = (e) => {
    if (!isOpen && e.key === 'ArrowDown') {
      setIsOpen(true)
      return
    }
    
    if (!isOpen) return
    
    const allItems = getAllSuggestions()
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < allItems.length - 1 ? prev + 1 : prev
        )
        break
        
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
        
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < allItems.length) {
          handleSelect(allItems[highlightedIndex])
        }
        break
        
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
        
      case 'Tab':
        setIsOpen(false)
        break
    }
  }
  
  // 모든 추천 항목 가져오기
  const getAllSuggestions = () => {
    const items = []
    
    // 검색 결과
    if (inputValue.length >= minLength) {
      items.push(...localSuggestions)
    }
    // 최근 항목
    else if (showRecent && recentItems.length > 0 && !inputValue) {
      items.push(...recentItems.slice(0, maxRecent))
    }
    // 인기 항목
    else if (showPopular && popularItems.length > 0 && !inputValue) {
      items.push(...popularItems.slice(0, maxPopular))
    }
    
    return items
  }
  
  // 텍스트 하이라이트
  const highlightText = (text, highlight) => {
    if (!highlightMatch || !highlight) return text
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() 
        ? <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark>
        : part
    )
  }
  
  // 그룹별 추천 항목 정리
  const getGroupedSuggestions = () => {
    if (!groupSuggestions) {
      return { '': getAllSuggestions() }
    }
    
    const grouped = {}
    getAllSuggestions().forEach(item => {
      const category = item[suggestionCategory] || 'Other'
      if (!grouped[category]) grouped[category] = []
      grouped[category].push(item)
    })
    
    return grouped
  }
  
  const shouldShowDropdown = isOpen && (
    isSearching ||
    localSuggestions.length > 0 ||
    (!inputValue && showRecent && recentItems.length > 0) ||
    (!inputValue && showPopular && popularItems.length > 0)
  )
  
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
      
      {/* 입력 필드 */}
      <div className="relative">
        {showSearchIcon && (
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
        
        <input
          ref={inputRef || ref}
          type="text"
          id={id || name}
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length >= minLength && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          aria-label={ariaLabel || label}
          aria-describedby={ariaDescribedby}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls="autocomplete-listbox"
          aria-invalid={error}
          className={`
            w-full rounded-lg
            ${sizeClasses[size]}
            ${variantClasses[variant]}
            ${errorClasses}
            ${showSearchIcon ? 'pl-10' : ''}
            ${showClearButton && inputValue ? 'pr-10' : 'pr-4'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            transition-all duration-200
            text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none
          `}
          {...props}
        />
        
        {showClearButton && inputValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            aria-label={t('common.clear')}
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* 추천 드롭다운 */}
      {shouldShowDropdown && (
        <div 
          id="autocomplete-listbox"
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* 섹션 헤더 (최근/인기) */}
          {!inputValue && !isSearching && (
            <>
              {showRecent && recentItems.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                    {t('common.recent')}
                  </div>
                  <ul role="group" aria-label={t('common.recent')}>
                    {recentItems.slice(0, maxRecent).map((item, index) => (
                      <li
                        key={index}
                        role="option"
                        aria-selected={highlightedIndex === index}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`
                          px-4 py-2 cursor-pointer transition-colors
                          ${highlightedIndex === index 
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {renderSuggestion ? renderSuggestion(item) : (
                            <span>{typeof item === 'string' ? item : item[suggestionLabel]}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {showPopular && popularItems.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                    {t('common.popular')}
                  </div>
                  <ul role="group" aria-label={t('common.popular')}>
                    {popularItems.slice(0, maxPopular).map((item, index) => {
                      const actualIndex = (showRecent ? recentItems.slice(0, maxRecent).length : 0) + index
                      return (
                        <li
                          key={index}
                          role="option"
                          aria-selected={highlightedIndex === actualIndex}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setHighlightedIndex(actualIndex)}
                          className={`
                            px-4 py-2 cursor-pointer transition-colors
                            ${highlightedIndex === actualIndex 
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {renderSuggestion ? renderSuggestion(item) : (
                              <span>{typeof item === 'string' ? item : item[suggestionLabel]}</span>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </>
          )}
          
          {/* 검색 결과 */}
          {inputValue.length >= minLength && (
            <ul 
              ref={listRef}
              role="listbox"
              className="max-h-60 overflow-y-auto"
            >
              {isSearching ? (
                <li className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {loadingSuggestionMessage}
                  </div>
                </li>
              ) : localSuggestions.length === 0 ? (
                <li className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                  {emptySuggestionMessage}
                </li>
              ) : (
                Object.entries(getGroupedSuggestions()).map(([group, items]) => (
                  <li key={group}>
                    {group && groupSuggestions && (
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                        {renderGroup ? renderGroup(group) : group}
                      </div>
                    )}
                    <ul role="group" aria-label={group}>
                      {items.map((item, index) => {
                        const label = typeof item === 'string' ? item : item[suggestionLabel]
                        return (
                          <li
                            key={index}
                            role="option"
                            aria-selected={highlightedIndex === index}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`
                              px-4 py-2 cursor-pointer transition-colors
                              ${highlightedIndex === index 
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100'
                              }
                            `}
                          >
                            {renderSuggestion ? renderSuggestion(item, searchTerm) : (
                              <span>{highlightText(label, searchTerm)}</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                ))
              )}
            </ul>
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

AutoComplete.displayName = 'AutoComplete'

export default AutoComplete