'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '@/shared/i18n';
import {
  ChevronDownIcon,
  FolderIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  STANDARD_CATEGORIES,
  getCategoryName,
  getCategoryDescription,
  searchCategories as searchStandardCategories
} from '@/shared/constants/categories';

/**
 * 하드코딩된 카테고리를 사용하는 CategorySelector
 * 표준 카테고리 목록에서 선택하도록 제한
 */
export default function CategorySelectorHardcoded({
  value,
  onChange,
  placeholder,
  required = false,
  className = "",
  error = null,
  showAll = false  // 전체 옵션 표시 여부
}) {
  const { t, currentLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // 전체 옵션
  const allOption = {
    id: 'all',
    key: 'all',
    code: 'ALL',
    nameVi: 'Tất cả',
    nameEn: 'All',
    nameKo: '전체',
    descriptionVi: 'Hiển thị tất cả',
    descriptionEn: 'Show all',
    descriptionKo: '전체 보기',
    sortOrder: 0,
    isActive: true
  };

  // 검색 필터링된 카테고리
  const filteredCategories = useMemo(() => {
    let categories = STANDARD_CATEGORIES;

    // 검색어가 있으면 필터링
    if (searchQuery) {
      categories = searchStandardCategories(searchQuery);
    }

    // showAll이 true이고 검색어가 없거나 'all'을 포함하면 전체 옵션 추가
    if (showAll) {
      if (!searchQuery ||
          'all'.includes(searchQuery.toLowerCase()) ||
          'tất cả'.toLowerCase().includes(searchQuery.toLowerCase()) ||
          '전체'.includes(searchQuery)) {
        categories = [allOption, ...categories];
      }
    }

    return categories;
  }, [searchQuery, showAll]);

  // 선택된 카테고리 찾기
  const selectedCategory = useMemo(() => {
    if (!value) return null;

    // 전체 옵션 확인
    if (showAll && value === 'all') {
      return allOption;
    }

    return STANDARD_CATEGORIES.find(cat => cat.id === value);
  }, [value, showAll]);

  // 현재 언어 코드 (vi, en, ko)
  const languageCode = useMemo(() => {
    // currentLocale이 'vn' 또는 'vi-VN'인 경우 'vi'로 변환
    if (currentLocale?.startsWith('vi') || currentLocale === 'vn') {
      return 'vi';
    }
    if (currentLocale?.startsWith('en')) {
      return 'en';
    }
    if (currentLocale?.startsWith('ko')) {
      return 'ko';
    }
    return 'vi'; // 기본값
  }, [currentLocale]);

  // 검색어 변경 핸들러
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // 검색어 초기화
  const clearSearch = () => {
    setSearchQuery('');
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 드롭다운 열기 핸들러
  const handleOpen = useCallback(() => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // 검색 input에 포커스
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // 카테고리 선택 핸들러
  const handleSelectCategory = (categoryId) => {
    onChange(categoryId);
    setIsOpen(false);
    setSearchQuery('');
  };

  // 카테고리 이름 가져오기
  const getCategoryDisplayName = (category) => {
    return getCategoryName(category.id, languageCode);
  };

  // 카테고리 설명 가져오기
  const getCategoryDisplayDescription = (category) => {
    return getCategoryDescription(category.id, languageCode);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 드롭다운 트리거 버튼 */}
      <button
        type="button"
        onClick={handleOpen}
        className={`
          w-full px-4 py-2.5 text-left
          bg-white dark:bg-gray-700
          border rounded-lg
          flex items-center justify-between
          transition-all duration-200
          ${error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
          }
          ${isOpen ? 'ring-2 ring-emerald-500/20 border-emerald-500' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedCategory ? (
            <>
              <FolderIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-gray-900 dark:text-white truncate">
                {getCategoryDisplayName(selectedCategory)}
              </span>
              {languageCode !== 'ko' && selectedCategory.nameKo && (
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  ({selectedCategory.nameKo})
                </span>
              )}
            </>
          ) : (
            <>
              <FolderIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-500 dark:text-gray-400">
                {placeholder || t('menu.placeholders.categoryName')}
              </span>
            </>
          )}
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 에러 메시지 */}
      {error && (
        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
          <ExclamationCircleIcon className="w-4 h-4" />
          {error}
        </p>
      )}

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* 검색 입력 */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={t('menu.placeholders.searchCategory') || '카테고리 검색...'}
                className="w-full pl-10 pr-10 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {filteredCategories.length > 0 ? (
            <>
              {/* 카테고리 목록 (스크롤 가능) */}
              <div
                className="max-h-60 overflow-y-auto overscroll-contain"
                onWheel={(e) => {
                  // 드롭다운 내부 스크롤 시 부모로 전파 방지
                  const element = e.currentTarget;
                  const isScrolledToTop = element.scrollTop === 0;
                  const isScrolledToBottom =
                    element.scrollHeight - element.scrollTop === element.clientHeight;

                  if ((e.deltaY < 0 && isScrolledToTop) ||
                      (e.deltaY > 0 && isScrolledToBottom)) {
                    return;
                  }

                  e.stopPropagation();
                }}
              >
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleSelectCategory(category.id)}
                    className={`
                      w-full px-4 py-3 text-left
                      flex items-center gap-3
                      transition-colors duration-150
                      hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                      ${value === category.id
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                        : 'text-gray-900 dark:text-white'
                      }
                    `}
                  >
                    <FolderIcon
                      className={`w-5 h-5 flex-shrink-0 ${
                        value === category.id
                          ? 'text-emerald-500'
                          : 'text-gray-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {getCategoryDisplayName(category)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {getCategoryDisplayDescription(category)}
                      </div>
                    </div>
                    {value === category.id && (
                      <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* 표준 카테고리 안내 메시지 */}
              <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {t('menu.messages.standardCategoriesOnly') || '표준 카테고리만 사용 가능합니다'}
                </p>
              </div>
            </>
          ) : (
            // 검색 결과 없음
            <div className="p-6 text-center">
              <FolderIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('menu.messages.noSearchResults') || '검색 결과가 없습니다'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {t('menu.messages.tryDifferentSearch') || '다른 검색어를 시도해보세요'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}