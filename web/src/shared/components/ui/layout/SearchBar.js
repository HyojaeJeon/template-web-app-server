/**
 * 전역 검색바 컴포넌트
 * 자동완성, 검색 기록, 키보드 단축키 지원
 */
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '../hooks/data/useDebounce';
import { useLocalStorage } from '../hooks/data/useLocalStorage';
import { useClickOutside } from '../hooks/ui/useClickOutside';
import { useKeyPress } from '../hooks/ui/useKeyPress';

/**
 * 검색 제안 데이터 (다국어 지원)
 */
const SEARCH_SUGGESTIONS = {
  vi: [
    { 
      type: 'menu', 
      label: 'Quản lý thực đơn', 
      href: '/menu', 
      icon: '🍽️',
      keywords: ['thực đơn', 'món ăn', 'quản lý', 'menu', 'food']
    },
    { 
      type: 'order', 
      label: 'Đơn hàng mới', 
      href: '/orders/new', 
      icon: '🛒',
      keywords: ['đơn hàng', 'mới', 'order', 'new']
    },
    { 
      type: 'analytics', 
      label: 'Phân tích doanh thu', 
      href: '/analytics/sales', 
      icon: '📊',
      keywords: ['doanh thu', 'phân tích', 'thống kê', 'báo cáo', 'sales']
    },
    { 
      type: 'customer', 
      label: 'Phân tích khách hàng', 
      href: '/analytics/customers', 
      icon: '👥',
      keywords: ['khách hàng', 'phân tích', 'customer']
    },
    { 
      type: 'pos', 
      label: 'Tích hợp POS', 
      href: '/pos', 
      icon: '💳',
      keywords: ['pos', 'tích hợp', 'đồng bộ', 'integration']
    },
    { 
      type: 'settings', 
      label: 'Cài đặt', 
      href: '/settings', 
      icon: '⚙️',
      keywords: ['cài đặt', 'thiết lập', 'settings']
    },
    { 
      type: 'inventory', 
      label: 'Quản lý kho', 
      href: '/inventory', 
      icon: '📦',
      keywords: ['kho', 'tồn kho', 'quản lý', 'inventory']
    },
    { 
      type: 'review', 
      label: 'Quản lý đánh giá', 
      href: '/reviews', 
      icon: '⭐',
      keywords: ['đánh giá', 'review', 'rating']
    },
    { 
      type: 'delivery', 
      label: 'Quản lý giao hàng', 
      href: '/delivery', 
      icon: '🚚',
      keywords: ['giao hàng', 'vận chuyển', 'delivery']
    },
    { 
      type: 'promotions', 
      label: 'Khuyến mãi', 
      href: '/promotions', 
      icon: '🎉',
      keywords: ['khuyến mãi', 'ưu đãi', 'promotion']
    }
  ],
  ko: [
    { 
      type: 'menu', 
      label: '메뉴 관리', 
      href: '/menu', 
      icon: '🍽️',
      keywords: ['메뉴', '음식', '요리', '관리']
    },
    { 
      type: 'order', 
      label: '신규 주문', 
      href: '/orders/new', 
      icon: '🛒',
      keywords: ['주문', '신규', '새로운']
    },
    { 
      type: 'analytics', 
      label: '매출 분석', 
      href: '/analytics/sales', 
      icon: '📊',
      keywords: ['매출', '분석', '통계', '리포트']
    },
    { 
      type: 'customer', 
      label: '고객 분석', 
      href: '/analytics/customers', 
      icon: '👥',
      keywords: ['고객', '사용자', '분석']
    },
    { 
      type: 'pos', 
      label: 'POS 연동', 
      href: '/pos', 
      icon: '💳',
      keywords: ['pos', '연동', '동기화']
    },
    { 
      type: 'settings', 
      label: '설정', 
      href: '/settings', 
      icon: '⚙️',
      keywords: ['설정', '옵션', '환경설정']
    },
    { 
      type: 'inventory', 
      label: '재고 관리', 
      href: '/inventory', 
      icon: '📦',
      keywords: ['재고', '인벤토리', '창고']
    },
    { 
      type: 'review', 
      label: '리뷰 관리', 
      href: '/reviews', 
      icon: '⭐',
      keywords: ['리뷰', '평점', '후기']
    }
  ]
};

/**
 * 검색 결과 아이템 컴포넌트
 */
const SearchResultItem = ({ 
  item, 
  isSelected, 
  onClick,
  onMouseEnter 
}) => {
  return (
    <button
      className={`
        w-full flex items-center px-4 py-3 text-left transition-all duration-200 rounded-md mx-2
        ${isSelected 
          ? 'bg-vietnam-mint/10 dark:bg-vietnam-mint/20 text-vietnam-mint dark:text-vietnam-mint border-l-2 border-vietnam-mint' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200'
        }
      `}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <span className="text-lg mr-3">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.label}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {item.href}
        </div>
      </div>
      {item.type && (
        <span className="ml-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
          {item.type}
        </span>
      )}
    </button>
  );
};

/**
 * 검색 기록 아이템 컴포넌트
 */
const SearchHistoryItem = ({ 
  query, 
  onSelect, 
  onRemove, 
  isSelected,
  onMouseEnter 
}) => {
  return (
    <div 
      className={`
        flex items-center px-4 py-2 transition-colors duration-200
        ${isSelected 
          ? 'bg-gray-50 dark:bg-gray-800' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
        }
      `}
      onMouseEnter={onMouseEnter}
    >
      <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <button
        className="flex-1 text-left text-sm text-gray-700 dark:text-gray-200"
        onClick={() => onSelect(query)}
      >
        {query}
      </button>
      <button
        className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(query);
        }}
        aria-label="검색 기록 삭제"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

/**
 * 검색바 컴포넌트
 */
const SearchBar = ({
  placeholder = null, // null이면 언어에 따라 자동 설정
  className = '',
  variant = 'default', // 'default', 'compact', 'expanded'
  showShortcut = true,
  maxHistory = 5,
  maxSuggestions = 8,
  locale = 'vi', // 기본값을 Local어로 설정
  onSearchSubmit,
  ...props
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useLocalStorage('search-history', []);
  
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  
  // 디바운스된 검색어
  const debouncedQuery = useDebounce(query, 300);
  
  // 현재 언어에 맞는 제안 데이터
  const suggestions = SEARCH_SUGGESTIONS[locale] || SEARCH_SUGGESTIONS.vi;

  // 검색 결과 필터링
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    
    const queryLower = debouncedQuery.toLowerCase();
    return suggestions
      .filter(item => 
        item.label.toLowerCase().includes(queryLower) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(queryLower))
      )
      .slice(0, maxSuggestions);
  }, [debouncedQuery, maxSuggestions, suggestions]);
  
  // 검색 기록 필터링
  const filteredHistory = useMemo(() => {
    if (query.trim()) return [];
    return searchHistory.slice(0, maxHistory);
  }, [searchHistory, query, maxHistory]);
  
  // 전체 결과 (검색 결과 + 검색 기록)
  const allResults = [...searchResults, ...filteredHistory.map(h => ({ type: 'history', query: h }))];

  // 외부 클릭 감지
  useClickOutside(searchRef, () => setIsOpen(false));

  // Cmd/Ctrl + K 단축키
  useKeyPress(['cmd+k', 'ctrl+k'], (e) => {
    e.preventDefault();
    inputRef.current?.focus();
    setIsOpen(true);
  });

  // ESC 키로 닫기
  useKeyPress('escape', () => {
    if (isOpen) {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  });

  // 키보드 네비게이션
  const handleKeyDown = (e) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allResults.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleResultSelect(allResults[selectedIndex]);
        } else if (query.trim()) {
          handleSearchSubmit();
        }
        break;
        
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // 검색 실행
  const handleSearchSubmit = () => {
    if (!query.trim()) return;
    
    // 검색 기록에 추가
    const newHistory = [
      query.trim(),
      ...searchHistory.filter(h => h !== query.trim())
    ].slice(0, maxHistory);
    setSearchHistory(newHistory);
    
    // 콜백 실행
    if (onSearchSubmit) {
      onSearchSubmit(query.trim());
    } else {
      // 기본: 통합 검색 페이지로 이동
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
    
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  // 결과 선택 처리
  const handleResultSelect = (result) => {
    if (result.type === 'history') {
      setQuery(result.query);
      handleSearchSubmit();
    } else if (result.href) {
      router.push(result.href);
      setIsOpen(false);
      setQuery('');
    }
  };

  // 검색 기록 삭제
  const removeFromHistory = (queryToRemove) => {
    setSearchHistory(prev => prev.filter(h => h !== queryToRemove));
  };

  // 다국어 텍스트
  const texts = {
    vi: {
      placeholder: 'Tìm kiếm thực đơn, đơn hàng, khách hàng...',
      noResults: 'Không tìm thấy kết quả cho',
      recentSearches: 'Tìm kiếm gần đây',
      searchTip: 'Tìm kiếm nhanh thực đơn, đơn hàng, phân tích...',
      removeHistory: 'Xóa lịch sử tìm kiếm',
      executeSearch: 'Thực hiện tìm kiếm',
      search: 'Tìm kiếm'
    },
    ko: {
      placeholder: '메뉴, 주문, 고객 등을 검색하세요...',
      noResults: '검색 결과가 없습니다',
      recentSearches: '최근 검색',
      searchTip: '메뉴, 주문, 분석 등을 빠르게 찾아보세요',
      removeHistory: '검색 기록 삭제',
      executeSearch: '검색 실행',
      search: '검색'
    }
  };

  const currentTexts = texts[locale] || texts.vi;

  // 검색창 스타일
  const getSearchBarClasses = () => {
    const baseClasses = 'relative';
    
    switch (variant) {
      case 'compact':
        return `${baseClasses} w-64`;
      case 'expanded':
        return `${baseClasses} w-full max-w-2xl`;
      default:
        return `${baseClasses} w-96`;
    }
  };

  return (
    <div className={`${getSearchBarClasses()} ${className}`} ref={searchRef} {...props}>
      {/* 검색 입력 필드 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-4 w-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="
            block w-full pl-10 pr-16 py-2.5 border border-gray-300 dark:border-gray-600 
            rounded-lg bg-white dark:bg-gray-800 
            text-gray-900 dark:text-white 
            placeholder-gray-500 dark:placeholder-gray-400
            focus:ring-2 focus:ring-vietnam-mint focus:border-vietnam-mint
            hover:border-gray-400 dark:hover:border-gray-500
            transition-all duration-200
            shadow-sm dark:shadow-none
          "
          placeholder={placeholder || currentTexts.placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={currentTexts.search}
        />
        
        {/* 키보드 단축키 표시 */}
        {showShortcut && !isOpen && !query && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
              ⌘K
            </kbd>
          </div>
        )}
        
        {/* 검색 버튼 */}
        {query && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
              onClick={handleSearchSubmit}
              className="text-gray-400 hover:text-vietnam-mint dark:hover:text-vietnam-mint transition-colors duration-200"
              aria-label={currentTexts.executeSearch}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden backdrop-blur-sm">
          {/* 검색 결과가 있을 때 */}
          {(searchResults.length > 0 || filteredHistory.length > 0) ? (
            <div ref={resultsRef} role="listbox" className="divide-y divide-gray-100 dark:divide-gray-700">
              {/* 검색 결과 */}
              {searchResults.map((result, index) => (
                <SearchResultItem
                  key={result.href}
                  item={result}
                  isSelected={selectedIndex === index}
                  onClick={() => handleResultSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                />
              ))}
              
              {/* 검색 기록 */}
              {filteredHistory.length > 0 && (
                <>
                  {searchResults.length > 0 && (
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                      {currentTexts.recentSearches}
                    </div>
                  )}
                  {filteredHistory.map((historyQuery, index) => (
                    <SearchHistoryItem
                      key={historyQuery}
                      query={historyQuery}
                      isSelected={selectedIndex === searchResults.length + index}
                      onSelect={(q) => {
                        setQuery(q);
                        handleSearchSubmit();
                      }}
                      onRemove={removeFromHistory}
                      onMouseEnter={() => setSelectedIndex(searchResults.length + index)}
                    />
                  ))}
                </>
              )}
            </div>
          ) : query.trim() ? (
            // 검색 결과가 없을 때
            <div className="px-4 py-8 text-center">
              <div className="text-gray-400 dark:text-gray-600 mb-3">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {currentTexts.noResults} <strong>"{query}"</strong>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {locale === 'vi' ? 'Thử tìm kiếm với từ khóa khác' : '다른 키워드로 시도해보세요'}
              </p>
            </div>
          ) : (
            // 빈 상태 (팁 표시)
            <div className="px-4 py-6 text-center">
              <div className="text-gray-400 dark:text-gray-600 mb-3">
                <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {currentTexts.searchTip}
              </p>
              {/* 인기 검색어 힌트 */}
              <div className="mt-3 flex flex-wrap justify-center gap-1">
                {suggestions.slice(0, 3).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(item.label);
                      handleResultSelect(item);
                    }}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-vietnam-mint hover:text-white transition-colors duration-200"
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;