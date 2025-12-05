'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * useListPagePagination - 목록 페이지의 URL 기반 페이지네이션과 필터링을 관리하는 훅
 * 
 * @param {Object} options - 설정 옵션
 * @param {Array} options.urlKeys - URL 파라미터로 관리할 키들 (기본값: ['page', 'limit', 'status'])
 * @param {Object} options.defaultFilters - 기본 필터 값들
 * @param {Function} options.onFiltersChange - 필터 변경 시 호출할 콜백
 * 
 * @returns {Object} 페이지네이션 관련 상태와 함수들
 */
export const useListPagePagination = ({
  urlKeys = ['page', 'limit', 'status'],
  defaultFilters = {},
  onFiltersChange
} = {}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터에서 필터 상태 파싱
  const filters = useMemo(() => {
    const result = { ...defaultFilters };
    
    urlKeys.forEach(key => {
      const value = searchParams.get(key);
      if (value) {
        // 숫자 파라미터는 숫자로 변환
        if (key === 'page' || key === 'limit') {
          result[key] = parseInt(value, 10);
        } else {
          result[key] = value;
        }
      }
    });

    return result;
  }, [searchParams, urlKeys, defaultFilters]);

  // URL 파라미터 업데이트 함수
  const updateUrlParams = useCallback((newParams) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== '' && value !== null && value !== undefined) {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    
    // 페이지 파라미터가 1이면 제거 (깔끔한 URL)
    if (params.get('page') === '1') {
      params.delete('page');
    }
    
    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    
    router.push(newUrl, { scroll: false });
  }, [router, searchParams]);

  // 필터 변경 함수
  const handleFiltersChange = useCallback((newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    
    // 필터가 변경되면 첫 페이지로 이동 (page 파라미터가 명시적으로 전달되지 않은 경우)
    if (!newFilters.hasOwnProperty('page')) {
      updatedFilters.page = 1;
    }
    
    updateUrlParams(updatedFilters);
    
    if (onFiltersChange) {
      onFiltersChange(updatedFilters);
    }
  }, [filters, updateUrlParams, onFiltersChange]);

  // 페이지 변경 함수
  const handlePageChange = useCallback((newPage) => {
    handleFiltersChange({ page: newPage });
  }, [handleFiltersChange]);

  // 검색 핸들러
  const handleSearch = useCallback((searchTerm) => {
    handleFiltersChange({ search: searchTerm, page: 1 });
  }, [handleFiltersChange]);

  // 정렬 핸들러
  const handleSort = useCallback((sortBy, sortDirection = 'ASC') => {
    handleFiltersChange({ sortBy, sortDirection, page: 1 });
  }, [handleFiltersChange]);

  // 필터 초기화
  const resetFilters = useCallback(() => {
    const resetParams = {};
    urlKeys.forEach(key => {
      if (defaultFilters[key]) {
        resetParams[key] = defaultFilters[key];
      }
    });
    
    updateUrlParams(resetParams);
    
    if (onFiltersChange) {
      onFiltersChange(resetParams);
    }
  }, [urlKeys, defaultFilters, updateUrlParams, onFiltersChange]);

  return {
    // 현재 상태
    filters,
    currentPage: filters.page || 1,
    limit: filters.limit || 20,
    
    // 액션 함수들
    handleFiltersChange,
    handlePageChange,
    handleSearch,
    handleSort,
    resetFilters,
    
    // 유틸리티 함수
    updateUrlParams
  };
};

export default useListPagePagination;