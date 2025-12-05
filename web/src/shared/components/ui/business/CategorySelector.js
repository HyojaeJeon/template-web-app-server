'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLazyQuery } from '@apollo/client';
import { useTranslation } from '@/shared/i18n';
import debounce from 'lodash/debounce';
import {
  ChevronDownIcon,
  PlusCircleIcon,
  FolderIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { S_GET_MENU_CATEGORIES } from '@/gql/queries/menu';

export default function CategorySelector({
  value,
  onChange,
  placeholder,
  required = false,
  className = "",
  error = null,
  categories: externalCategories = null, // 외부에서 전달받은 카테고리 목록
  loading: externalLoading = false,
  onOpen = null, // 드롭다운 열릴 때 호출되는 콜백 (외부 카테고리 로딩용)
  initialCategory = null, // 수정 모드에서 선택된 카테고리 정보 (표시용)
  showAllOption = false, // "전체" 옵션 표시 여부 (분석 페이지용)
  allOptionLabel = null, // "전체" 옵션 라벨 (기본: "전체")
  showAddButton = true, // 카테고리 추가 버튼 표시 여부
  size = 'default' // 크기: 'default' | 'small'
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState(externalCategories || []);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const searchInputRef = useRef(null);
  const router = useRouter();

  const ITEMS_PER_PAGE = 10;

  // 카테고리 데이터 lazy 로딩
  const [loadCategories, { loading, fetchMore }] = useLazyQuery(S_GET_MENU_CATEGORIES, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const newCategories = data?.sGetMenuCategories?.categories || [];
      const filtered = newCategories.filter(cat => cat.id !== 'all');
      setCategories(filtered);

      // GraphQL 응답의 hasNextPage를 사용
      const hasNextPage = data?.sGetMenuCategories?.hasNextPage || false;
      setHasMore(hasNextPage);
      setCurrentPage(1);
    },
    onError: (err) => {}
  });

  // "전체" 옵션 객체
  const allOption = useMemo(() => {
    if (!showAllOption) return null;
    return {
      id: 'ALL',
      name: allOptionLabel || t('common.all', '전체'),
      nameKo: null,
      isAllOption: true
    };
  }, [showAllOption, allOptionLabel, t]);

  // 선택된 카테고리 찾기 - categories, externalCategories, initialCategory에서 검색
  const selectedCategory = useMemo(() => {
    // "전체" 옵션 선택 시
    if (showAllOption && (value === 'ALL' || value === null || value === '')) {
      return allOption;
    }

    if (!value) return null;

    // categories에서 먼저 찾기
    if (Array.isArray(categories) && categories.length > 0) {
      const found = categories.find(cat => cat.id === value);
      if (found) return found;
    }

    // categories에 없으면 externalCategories에서 찾기
    if (Array.isArray(externalCategories) && externalCategories.length > 0) {
      const found = externalCategories.find(cat => cat.id === value);
      if (found) return found;
    }

    // 둘 다 없으면 initialCategory 사용 (수정 모드)
    if (initialCategory && initialCategory.id === value) {
      return initialCategory;
    }

    return null;
  }, [value, categories, externalCategories, initialCategory, showAllOption, allOption]);

  // externalCategories가 변경되면 categories state 업데이트
  useEffect(() => {
    if (externalCategories && externalCategories.length > 0) {
      setCategories(externalCategories);
      setHasMore(false); // 외부에서 제공된 카테고리는 인피니트 스크롤 비활성화
    }
  }, [externalCategories]);

  // debounce 함수를 useRef로 안정적으로 유지
  const debouncedSearchRef = useRef(
    debounce((loadCategoriesFn, query) => {
      loadCategoriesFn({
        variables: {
          includeInactive: false,
          limit: ITEMS_PER_PAGE,
          offset: 0,
          searchQuery: query || undefined
        }
      });
    }, 300) // 300ms 디바운스
  ).current;

  // 검색 쿼리 실행
  const performSearch = useCallback((query) => {
    debouncedSearchRef(loadCategories, query);
  }, [loadCategories]);

  // 검색어 변경 핸들러
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setCurrentPage(1);
    performSearch(query);
  };

  // 검색어 초기화
  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    loadCategories({
      variables: {
        includeInactive: false,
        limit: ITEMS_PER_PAGE,
        offset: 0
      }
    });
  };

  // 더 많은 카테고리 로드
  const loadMoreCategories = useCallback(async () => {
    if (loading || !hasMore) {
      return;
    }

    try {
      const { data } = await fetchMore({
        variables: {
          includeInactive: false,
          limit: ITEMS_PER_PAGE,
          offset: currentPage * ITEMS_PER_PAGE,
          searchQuery: searchQuery || undefined
        }
      });

      const newCategories = data?.sGetMenuCategories?.categories || [];
      const filtered = newCategories.filter(cat => cat.id !== 'all');
      const hasNextPage = data?.sGetMenuCategories?.hasNextPage || false;

      if (filtered.length > 0) {
        setCategories(prev => {
          const updated = [...prev, ...filtered];
          return updated;
        });
        setCurrentPage(prev => prev + 1);
        setHasMore(hasNextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setHasMore(false);
    }
  }, [loading, hasMore, currentPage, fetchMore, searchQuery]);

  // 외부에서 전달받은 카테고리 목록 동기화
  useEffect(() => {
    if (externalCategories && externalCategories.length > 0) {
      setCategories(externalCategories);
    }
  }, [externalCategories]);

  // Intersection Observer 설정
  useEffect(() => {
    // 카테고리가 없거나 더 이상 로드할 데이터가 없으면 중단
    if (categories.length === 0 || !hasMore) {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      return;
    }

    if (!isOpen || !scrollContainerRef.current || !sentinelRef.current) {
      return;
    }

    // 이전 observer 정리
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const options = {
      root: scrollContainerRef.current,
      rootMargin: '0px 0px 50px 0px', // 하단에서 50px 위에서 트리거
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;

      if (entry.isIntersecting) {
        // 더 로드할 데이터가 있고, 로딩 중이 아닐 때 트리거
        if (hasMore && !loading) {
          loadMoreCategories();
        }
      }
    }, options);

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isOpen, hasMore, loading, loadMoreCategories, categories.length]);

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

  // 컴포넌트 언마운트 시 debounce 정리
  useEffect(() => {
    return () => {
      debouncedSearchRef.cancel?.();
    };
  }, []);

  // ✅ value가 있는데 selectedCategory가 없으면 카테고리 미리 로드
  // localStorage에서 복원된 categoryId를 표시하기 위함
  const hasInitialLoadRef = useRef(false);

  useEffect(() => {
    // 이미 초기 로드를 수행했으면 스킵 (중복 방지)
    if (hasInitialLoadRef.current) return;

    // showAllOption이 true이고 value가 'ALL' 또는 null/빈문자열이면 초기 로드 스킵
    if (showAllOption && (value === 'ALL' || value === null || value === '')) {
      return;
    }

    // value가 있고, externalCategories가 없고, categories가 비어있을 때 로드
    if (value && !externalCategories && categories.length === 0) {
      hasInitialLoadRef.current = true;
      loadCategories({
        variables: {
          includeInactive: false,
          limit: ITEMS_PER_PAGE,
          offset: 0
        }
      });
    }
  }, [value, externalCategories, categories.length, loadCategories, showAllOption]);

  // 드롭다운 열기 핸들러
  const handleOpen = useCallback(() => {
    if (!isOpen) {
      setIsOpen(true);
      // 드롭다운 열릴 때 카테고리 로드
      if (!externalCategories) {
        // 내부 쿼리 사용
        loadCategories({
          variables: {
            includeInactive: false,
            limit: ITEMS_PER_PAGE,
            offset: 0
          }
        });
      } else if (onOpen) {
        // 외부 카테고리 사용 시 onOpen 콜백 호출
        onOpen();
      }
      // 검색 input에 포커스
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setIsOpen(false);
      setSearchQuery('');
    }
  }, [isOpen, loadCategories, externalCategories, onOpen]);

  // 카테고리 선택 핸들러
  const handleSelectCategory = (categoryId) => {
    onChange(categoryId);
    setIsOpen(false);
    setSearchQuery('');
  };

  // 카테고리 추가 페이지로 이동
  const handleAddCategory = () => {
    router.push('/dashboard/menu/categories');
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
                {selectedCategory.name}
              </span>
              {selectedCategory.nameKo && (
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

          {loading && categories.length === 0 ? (
            // 초기 로딩 상태
            <div className="p-6 text-center">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('menu.messages.loadingCategories')}
              </p>
            </div>
          ) : categories.length > 0 ? (
            <>
              {/* 카테고리 목록 (스크롤 가능) */}
              <div
                ref={scrollContainerRef}
                className="max-h-60 overflow-y-auto overscroll-contain"
                onWheel={(e) => {
                  // 드롭다운 내부 스크롤 시 부모로 전파 방지
                  const element = e.currentTarget;
                  const isScrolledToTop = element.scrollTop === 0;
                  const isScrolledToBottom =
                    element.scrollHeight - element.scrollTop === element.clientHeight;

                  // 스크롤 끝에 도달했을 때만 부모로 전파 방지
                  if ((e.deltaY < 0 && isScrolledToTop) ||
                      (e.deltaY > 0 && isScrolledToBottom)) {
                    // 끝에 도달한 경우 부모 스크롤 허용
                    return;
                  }

                  // 내부 스크롤 중이면 이벤트 전파 중단
                  e.stopPropagation();
                }}
              >
                {/* "전체" 옵션 (showAllOption=true일 때만 표시) */}
                {showAllOption && allOption && (
                  <button
                    key="all-option"
                    type="button"
                    onClick={() => handleSelectCategory('ALL')}
                    className={`
                      w-full px-4 py-3 text-left
                      flex items-center gap-3
                      transition-colors duration-150
                      hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                      ${value === 'ALL' || value === null || value === ''
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                        : 'text-gray-900 dark:text-white'
                      }
                      border-b border-gray-100 dark:border-gray-700
                    `}
                  >
                    <FolderIcon
                      className={`w-5 h-5 flex-shrink-0 ${
                        value === 'ALL' || value === null || value === ''
                          ? 'text-emerald-500'
                          : 'text-gray-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {allOption.name}
                      </div>
                    </div>
                    {(value === 'ALL' || value === null || value === '') && (
                      <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                    )}
                  </button>
                )}
                {categories.map((category) => (
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
                        {category.name}
                      </div>
                      {category.nameKo && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {category.nameKo}
                        </div>
                      )}
                    </div>
                    {value === category.id && (
                      <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                    )}
                  </button>
                ))}

                {/* Intersection Observer Sentinel */}
                <div ref={sentinelRef} className="h-1" />

                {/* 추가 로딩 인디케이터 */}
                {loading && categories.length > 0 && (
                  <div className="p-3 text-center">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                  </div>
                )}

                {/* 더 이상 데이터 없음 메시지 */}
                {!hasMore && !loading && categories.length > 0 && (
                  <div className="p-2 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {t('menu.messages.noMoreCategories')}
                    </p>
                  </div>
                )}
              </div>

              {/* 구분선 */}
              <div className="border-t border-gray-200 dark:border-gray-700" />
            </>
          ) : (
            // 카테고리 없음 상태 (최소 높이 유지)
            <div className="p-6 text-center" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <FolderIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {searchQuery
                  ? t('menu.messages.noSearchResults') || '검색 결과가 없습니다'
                  : t('menu.messages.noCategoriesFound') || '카테고리가 없습니다'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {searchQuery
                  ? (t('menu.messages.tryDifferentSearch') || '다른 검색어를 시도해보세요')
                  : (t('menu.messages.addCategoryFirst') || '먼저 카테고리를 추가해주세요')}
              </p>
            </div>
          )}

          {/* 카테고리 추가 버튼 (showAddButton=true일 때만 표시) */}
          {showAddButton && (
            <button
              type="button"
              onClick={handleAddCategory}
              className="w-full px-4 py-3 text-left
                flex items-center gap-3
                bg-gray-50 dark:bg-gray-900/50
                hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                text-emerald-600 dark:text-emerald-400
                transition-colors duration-150
                border-t border-gray-200 dark:border-gray-700
              "
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span className="font-medium">{t('menu.actions.addCategory')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
