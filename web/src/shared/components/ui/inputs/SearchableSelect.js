'use client'

import { useState, useEffect, useRef, useCallback, forwardRef } from 'react'

/**
 * SearchableSelect - 검색 가능한 셀렉트 컴포넌트 (WCAG 2.1 준수)
 * API 연동 및 무한스크롤 지원
 * 다크 테마 지원
 */
const SearchableSelect = forwardRef(({
  options = [],
  value,
  onChange,
  onSearch,
  onLoadMore,
  placeholder = '선택하세요...',
  searchPlaceholder = '검색...',
  disabled = false,
  loading = false,
  hasMore = false,
  labelKey = 'label',
  valueKey = 'value',
  groupBy,
  renderOption,
  renderValue,
  clearable = true,
  multiple = false,
  maxSelection,
  noOptionsMessage = '검색 결과가 없습니다',
  loadingMessage = '로딩 중...',
  className = '',
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [selectedValues, setSelectedValues] = useState(
    multiple ? (value || []) : value ? [value] : []
  )

  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)
  const listRef = useRef(null)
  const observerRef = useRef(null)
  const lastOptionRef = useRef(null)

  // 무한스크롤을 위한 Intersection Observer 설정
  useEffect(() => {
    if (loading || !hasMore || !onLoadMore) return

    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
        }
      },
      { threshold: 1.0 }
    )

    if (lastOptionRef.current) {
      observerRef.current.observe(lastOptionRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loading, hasMore, onLoadMore])

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 검색 디바운싱
  useEffect(() => {
    if (!onSearch) return

    const timer = setTimeout(() => {
      onSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, onSearch])

  // 키보드 네비게이션
  const handleKeyDown = useCallback((e) => {
    if (disabled) return

    const filteredOptions = getFilteredOptions()
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex])
        }
        break
      
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
      
      case ' ':
        if (!isOpen) {
          e.preventDefault()
          setIsOpen(true)
        }
        break
    }
  }, [highlightedIndex, disabled])

  // 옵션 필터링
  const getFilteredOptions = () => {
    if (!searchQuery || onSearch) return options
    
    return options.filter(option => 
      option[labelKey].toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // 옵션 선택 처리
  const handleSelect = (option) => {
    if (multiple) {
      const optionValue = option[valueKey]
      const isSelected = selectedValues.includes(optionValue)
      
      if (isSelected) {
        const newValues = selectedValues.filter(v => v !== optionValue)
        setSelectedValues(newValues)
        onChange?.(newValues)
      } else {
        if (maxSelection && selectedValues.length >= maxSelection) {
          return
        }
        const newValues = [...selectedValues, optionValue]
        setSelectedValues(newValues)
        onChange?.(newValues)
      }
    } else {
      setSelectedValues([option[valueKey]])
      onChange?.(option[valueKey])
      setIsOpen(false)
    }
  }

  // 선택 초기화
  const handleClear = (e) => {
    e.stopPropagation()
    setSelectedValues([])
    onChange?.(multiple ? [] : null)
    setSearchQuery('')
  }

  // 선택된 옵션 가져오기
  const getSelectedOptions = () => {
    return options.filter(option => 
      selectedValues.includes(option[valueKey])
    )
  }

  // 그룹별로 옵션 정리
  const getGroupedOptions = () => {
    const filtered = getFilteredOptions()
    
    if (!groupBy) return { '': filtered }
    
    return filtered.reduce((groups, option) => {
      const group = option[groupBy] || ''
      if (!groups[group]) groups[group] = []
      groups[group].push(option)
      return groups
    }, {})
  }

  const selectedOptions = getSelectedOptions()
  const groupedOptions = getGroupedOptions()

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* 선택 박스 */}
      <div
        ref={ref}
        className={`
          min-h-[48px] w-full
          px-4 py-3
          bg-white dark:bg-gray-800
          border-2 border-gray-300 dark:border-gray-600
          rounded-xl
          transition-all duration-200
          cursor-pointer
          ${isOpen 
            ? 'border-[#2AC1BC] ring-4 ring-[#2AC1BC]/20' 
            : 'hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900' 
            : ''
          }
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
        {...props}
      >
        <div className="flex items-center justify-between gap-2">
          {/* 선택된 값 표시 */}
          <div className="flex-1 flex flex-wrap gap-2">
            {selectedOptions.length > 0 ? (
              multiple ? (
                selectedOptions.map(option => (
                  <span
                    key={option[valueKey]}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] text-white rounded-full text-sm"
                  >
                    {renderValue ? renderValue(option) : option[labelKey]}
                    <button
                      className="hover:bg-white/20 rounded-full p-0.5"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelect(option)
                      }}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-gray-900 dark:text-gray-100">
                  {renderValue ? renderValue(selectedOptions[0]) : selectedOptions[0][labelKey]}
                </span>
              )
            ) : (
              <span className="text-gray-400 dark:text-gray-500">
                {placeholder}
              </span>
            )}
          </div>

          {/* 아이콘들 */}
          <div className="flex items-center gap-2">
            {clearable && selectedOptions.length > 0 && (
              <button
                className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1"
                onClick={handleClear}
              >
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-xl">
          {/* 검색 입력 */}
          <div className="p-3 border-b dark:border-gray-700">
            <input
              ref={searchInputRef}
              type="text"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2AC1BC]"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* 옵션 리스트 */}
          <div 
            ref={listRef}
            className="max-h-60 overflow-y-auto"
            role="listbox"
            aria-multiselectable={multiple}
          >
            {loading && !options.length ? (
              <div className="p-4 text-center text-gray-500">
                {loadingMessage}
              </div>
            ) : Object.entries(groupedOptions).length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {noOptionsMessage}
              </div>
            ) : (
              Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
                <div key={groupName}>
                  {groupName && (
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                      {groupName}
                    </div>
                  )}
                  {groupOptions.map((option, index) => {
                    const optionValue = option[valueKey]
                    const isSelected = selectedValues.includes(optionValue)
                    const isHighlighted = highlightedIndex === getFilteredOptions().indexOf(option)
                    const isLastOption = index === groupOptions.length - 1 && 
                                       groupName === Object.keys(groupedOptions).slice(-1)[0]

                    return (
                      <div
                        key={optionValue}
                        ref={isLastOption ? lastOptionRef : null}
                        className={`
                          px-4 py-3
                          cursor-pointer
                          transition-colors
                          ${isSelected 
                            ? 'bg-gradient-to-r from-[#2AC1BC]/10 to-[#00B14F]/10 text-[#2AC1BC]' 
                            : ''
                          }
                          ${isHighlighted 
                            ? 'bg-gray-100 dark:bg-gray-700' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }
                        `}
                        onClick={() => handleSelect(option)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="flex items-center justify-between">
                          {renderOption ? renderOption(option) : (
                            <span>{option[labelKey]}</span>
                          )}
                          {isSelected && (
                            <svg className="w-5 h-5 text-[#2AC1BC]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
            
            {/* 로딩 인디케이터 (추가 로드) */}
            {loading && options.length > 0 && (
              <div className="p-3 text-center">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm">더 불러오는 중...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

SearchableSelect.displayName = 'SearchableSelect'

export default SearchableSelect