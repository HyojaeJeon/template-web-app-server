/**
 * Apollo 기반 검색 Hook
 * searchSlice를 완전 대체하여 Apollo Cache 기반으로 검색 기능 제공
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useLazyQuery, useMutation } from '@apollo/client';
import {
  M_UNIFIED_SEARCH,
  M_SEARCH_SUGGESTIONS,
  M_SEARCH_HISTORY,
  M_POPULAR_SEARCHES,
  M_TRENDING_SEARCHES,
  M_SEARCH_MENU_ITEMS
} from '@gql/queries/search';
import {
  M_SAVE_SEARCH_HISTORY,
  M_CLEAR_SEARCH_HISTORY,
  M_REMOVE_SEARCH_HISTORY
} from '@gql/mutations/search';
import { debounce } from 'lodash';

// 검색 타입 ENUM (서버와 일치)
export const SEARCH_TYPE = {
  ALL: 'ALL',
  STORES: 'STORES',
  MENU_ITEMS: 'MENU_ITEMS'
};

// 정렬 기준 ENUM
export const SORT_BY = {
  RELEVANCE: 'RELEVANCE',
  DISTANCE: 'DISTANCE',
  RATING: 'RATING',
  DELIVERY_TIME: 'DELIVERY_TIME',
  PRICE_LOW: 'PRICE_LOW',
  PRICE_HIGH: 'PRICE_HIGH'
};

// 검색 제안 타입
export const SUGGESTION_TYPE = {
  STORE: 'STORE',
  MENU_ITEM: 'MENU_ITEM',
  CATEGORY: 'CATEGORY',
  CUISINE: 'CUISINE'
};

/**
 * Apollo 기반 통합 검색 Hook
 * @param {Object} options - 검색 옵션
 */
export const useSearch = (options = {}) => {
  // 로컬 상태 관리
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentFilters, setCurrentFilters] = useState({
    searchType: SEARCH_TYPE.ALL,
    sortBy: SORT_BY.RELEVANCE,
    minPrice: null,
    maxPrice: null,
    minRating: null,
    maxDistance: null,
    categoryIds: [],
    cuisineTypes: [],
    dietaryRestrictions: []
  });
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    hasMore: false
  });

  // GraphQL 쿼리들
  const [executeSearch, {
    data: searchData,
    loading: searchLoading,
    error: searchError
  }] = useLazyQuery(M_UNIFIED_SEARCH, {
    errorPolicy: 'partial',
    fetchPolicy: 'cache-and-network'
  });

  const [fetchSuggestions, {
    data: suggestionsData,
    loading: suggestionsLoading
  }] = useLazyQuery(M_SEARCH_SUGGESTIONS, {
    errorPolicy: 'ignore',
    fetchPolicy: 'cache-first'
  });

  const {
    data: historyData,
    loading: historyLoading,
    refetch: refetchHistory
  } = useQuery(M_SEARCH_HISTORY, {
    errorPolicy: 'ignore',
    fetchPolicy: 'cache-first'
  });

  const {
    data: popularData,
    loading: popularLoading
  } = useQuery(M_POPULAR_SEARCHES, {
    errorPolicy: 'ignore',
    fetchPolicy: 'cache-first'
  });

  const {
    data: trendingData,
    loading: trendingLoading
  } = useQuery(M_TRENDING_SEARCHES, {
    errorPolicy: 'ignore',
    fetchPolicy: 'cache-first'
  });

  const [searchMenuItems, {
    data: menuItemsData,
    loading: menuItemsLoading
  }] = useLazyQuery(M_SEARCH_MENU_ITEMS, {
    errorPolicy: 'partial',
    fetchPolicy: 'cache-and-network'
  });

  // GraphQL 뮤테이션들
  const [saveHistoryMutation] = useMutation(M_SAVE_SEARCH_HISTORY, {
    refetchQueries: [{ query: M_SEARCH_HISTORY }]
  });

  const [clearHistoryMutation] = useMutation(M_CLEAR_SEARCH_HISTORY, {
    refetchQueries: [{ query: M_SEARCH_HISTORY }]
  });

  const [removeHistoryMutation] = useMutation(M_REMOVE_SEARCH_HISTORY, {
    refetchQueries: [{ query: M_SEARCH_HISTORY }]
  });

  // 디바운스된 검색 함수
  const debouncedSearch = useCallback(
    debounce((query, filters) => {
      if (query.trim().length >= 2) {
        executeSearch({
          variables: {
            input: {
              query: query.trim(),
              searchType: filters.searchType,
              sortBy: filters.sortBy,
              minPrice: filters.minPrice,
              maxPrice: filters.maxPrice,
              minRating: filters.minRating,
              maxDistance: filters.maxDistance,
              categoryIds: filters.categoryIds,
              cuisineTypes: filters.cuisineTypes,
              dietaryRestrictions: filters.dietaryRestrictions,
              limit: pagination.limit,
              offset: pagination.offset
            }
          }
        });
      }
    }, 300),
    [executeSearch, pagination]
  );

  // 디바운스된 검색 제안 함수
  const debouncedSuggestions = useCallback(
    debounce((query) => {
      if (query.trim().length >= 2) {
        fetchSuggestions({
          variables: { query: query.trim() }
        });
      }
    }, 200),
    [fetchSuggestions]
  );

  // 검색 실행
  const search = useCallback((query = currentQuery, filters = currentFilters) => {
    const searchTerm = query.trim();
    if (!searchTerm) return;

    setCurrentQuery(searchTerm);
    setCurrentFilters(filters);
    debouncedSearch(searchTerm, filters);

    // 검색 기록 자동 저장
    if (searchTerm.length >= 2) {
      saveHistoryMutation({
        variables: {
          query: searchTerm,
          category: filters.searchType
        }
      }).catch(error => {
        console.warn('검색 기록 저장 실패:', error);
      });
    }
  }, [currentQuery, currentFilters, debouncedSearch, saveHistoryMutation]);

  // 검색 제안 가져오기
  const getSuggestions = useCallback((query) => {
    if (query.trim().length >= 2) {
      debouncedSuggestions(query);
    }
  }, [debouncedSuggestions]);

  // 메뉴 아이템 검색
  const searchMenuItemsHandler = useCallback(({
    query,
    storeId,
    categoryId,
    limit = 20,
    offset = 0
  }) => {
    searchMenuItems({
      variables: { query, storeId, categoryId, limit, offset }
    });
  }, [searchMenuItems]);

  // 검색 기록 관리
  const saveSearchHistory = useCallback(async (query, category) => {
    try {
      await saveHistoryMutation({
        variables: { query, category }
      });
    } catch (error) {
      console.warn('검색 기록 저장 실패:', error);
    }
  }, [saveHistoryMutation]);

  const clearSearchHistory = useCallback(async () => {
    try {
      await clearHistoryMutation();
    } catch (error) {
      console.warn('검색 기록 삭제 실패:', error);
    }
  }, [clearHistoryMutation]);

  const removeFromSearchHistory = useCallback(async (query) => {
    try {
      await removeHistoryMutation({
        variables: { query }
      });
    } catch (error) {
      console.warn('검색 기록 항목 삭제 실패:', error);
    }
  }, [removeHistoryMutation]);

  // 필터 관리
  const setSearchQuery = useCallback((query) => {
    setCurrentQuery(query);
  }, []);

  const setSearchFilters = useCallback((filters) => {
    setCurrentFilters(prev => ({
      ...prev,
      ...filters
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setCurrentFilters({
      searchType: SEARCH_TYPE.ALL,
      sortBy: SORT_BY.RELEVANCE,
      minPrice: null,
      maxPrice: null,
      minRating: null,
      maxDistance: null,
      categoryIds: [],
      cuisineTypes: [],
      dietaryRestrictions: []
    });
  }, []);

  const clearResults = useCallback(() => {
    setCurrentQuery('');
    setPagination({
      limit: 20,
      offset: 0,
      hasMore: false
    });
  }, []);

  const clearSuggestions = useCallback(() => {
    // Apollo Cache에서 suggestions 제거는 자동 처리
  }, []);

  const resetSearch = useCallback(() => {
    setCurrentQuery('');
    clearFilters();
    clearResults();
  }, [clearFilters, clearResults]);

  // 메모이제이션된 데이터 처리
  const searchResults = useMemo(() => {
    const data = searchData?.mUnifiedSearch;
    if (!data) {
      return {
        stores: [],
        menuItems: [],
        total: 0,
        menuItemCount: 0,
        suggestions: [],
        hasMore: false
      };
    }

    return {
      stores: data.stores || [],
      menuItems: data.menuItems || [],
      total: data.total || 0,
      menuItemCount: data.menuItemCount || 0,
      suggestions: data.suggestions || [],
      hasMore: data.hasMore || false
    };
  }, [searchData]);

  const searchSuggestions = useMemo(() => {
    return suggestionsData?.mSearchSuggestions || [];
  }, [suggestionsData]);

  const searchHistory = useMemo(() => {
    const data = historyData?.mSearchHistory;
    if (!data) {
      return {
        history: [],
        popular: [],
        recent: []
      };
    }

    return {
      history: data.history || [],
      popular: data.popular || [],
      recent: data.recent || []
    };
  }, [historyData]);

  const popularSearches = useMemo(() => {
    return popularData?.mPopularSearches || [];
  }, [popularData]);

  const trendingSearches = useMemo(() => {
    return trendingData?.mTrendingSearches || [];
  }, [trendingData]);

  const menuItemResults = useMemo(() => {
    return menuItemsData?.mSearchMenuItems || [];
  }, [menuItemsData]);

  // 필터링된 결과 계산
  const filteredStores = useMemo(() => {
    let stores = [...searchResults.stores];

    // 필터 적용
    if (currentFilters.minRating) {
      stores = stores.filter(s => s.rating >= currentFilters.minRating);
    }
    if (currentFilters.maxDistance) {
      stores = stores.filter(s => s.distance <= currentFilters.maxDistance);
    }
    if (currentFilters.categoryIds?.length > 0) {
      stores = stores.filter(s =>
        currentFilters.categoryIds.includes(s.category)
      );
    }

    // 정렬 적용
    switch (currentFilters.sortBy) {
      case SORT_BY.DISTANCE:
        stores.sort((a, b) => a.distance - b.distance);
        break;
      case SORT_BY.RATING:
        stores.sort((a, b) => b.rating - a.rating);
        break;
      case SORT_BY.DELIVERY_TIME:
        stores.sort((a, b) => a.estimatedDeliveryTime - b.estimatedDeliveryTime);
        break;
      default:
        // RELEVANCE - 원본 순서 유지
        break;
    }

    return stores;
  }, [searchResults.stores, currentFilters]);

  const filteredMenuItems = useMemo(() => {
    let menuItems = [...searchResults.menuItems];

    // 필터 적용
    if (currentFilters.minPrice !== null) {
      menuItems = menuItems.filter(item =>
        (item.discountedPrice || item.price) >= currentFilters.minPrice
      );
    }
    if (currentFilters.maxPrice !== null) {
      menuItems = menuItems.filter(item =>
        (item.discountedPrice || item.price) <= currentFilters.maxPrice
      );
    }
    if (currentFilters.categoryIds?.length > 0) {
      menuItems = menuItems.filter(item =>
        currentFilters.categoryIds.includes(item.category)
      );
    }

    // 정렬 적용
    switch (currentFilters.sortBy) {
      case SORT_BY.PRICE_LOW:
        menuItems.sort((a, b) =>
          (a.discountedPrice || a.price) - (b.discountedPrice || b.price)
        );
        break;
      case SORT_BY.PRICE_HIGH:
        menuItems.sort((a, b) =>
          (b.discountedPrice || b.price) - (a.discountedPrice || a.price)
        );
        break;
      case SORT_BY.RATING:
        menuItems.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        // RELEVANCE - 원본 순서 유지
        break;
    }

    return menuItems;
  }, [searchResults.menuItems, currentFilters]);

  // 상태 계산
  const hasResults = searchResults.total > 0;
  const isSearching = searchLoading;
  const hasActiveFilters = (
    currentFilters.searchType !== SEARCH_TYPE.ALL ||
    currentFilters.sortBy !== SORT_BY.RELEVANCE ||
    currentFilters.minPrice !== null ||
    currentFilters.maxPrice !== null ||
    currentFilters.minRating !== null ||
    currentFilters.maxDistance !== null ||
    currentFilters.categoryIds?.length > 0 ||
    currentFilters.cuisineTypes?.length > 0 ||
    currentFilters.dietaryRestrictions?.length > 0
  );

  const searchSummary = {
    query: currentQuery,
    totalResults: searchResults.total,
    menuItemCount: searchResults.menuItemCount,
    hasResults,
    isEmpty: searchResults.total === 0 && currentQuery.length > 0
  };

  const recentSearches = searchHistory.history.slice(0, 5);

  // 클린업
  useEffect(() => {
    return () => {
      debouncedSearch.cancel?.();
      debouncedSuggestions.cancel?.();
    };
  }, [debouncedSearch, debouncedSuggestions]);

  return {
    // 검색 결과
    searchResults,
    menuItemResults,
    filteredStores,
    filteredMenuItems,

    // 검색 상태
    currentQuery,
    currentFilters,
    pagination,

    // 검색 제안 및 기록
    searchSuggestions,
    searchHistory,
    popularSearches,
    trendingSearches,
    recentSearches,

    // 로딩 상태
    loading: {
      search: searchLoading,
      suggestions: suggestionsLoading,
      history: historyLoading,
      popular: popularLoading,
      trending: trendingLoading,
      menuItems: menuItemsLoading
    },

    // 에러 상태
    error: searchError,

    // 상태 플래그
    hasResults,
    isSearching,
    hasActiveFilters,
    searchSummary,

    // 액션 함수들
    search,
    getSuggestions,
    searchMenuItems: searchMenuItemsHandler,
    setSearchQuery,
    setSearchFilters,
    clearFilters,
    clearResults,
    clearSuggestions,
    resetSearch,

    // 검색 기록 관리
    saveSearchHistory,
    clearSearchHistory,
    removeFromSearchHistory,

    // 페이지네이션
    updatePagination: setPagination,

    // 유틸리티
    refetchHistory
  };
};

export default useSearch;