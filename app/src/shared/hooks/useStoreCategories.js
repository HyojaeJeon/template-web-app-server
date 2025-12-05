/**
 * Apollo 기반 매장 카테고리 Hook
 * storeSlice의 categories 기능을 Apollo Cache로 대체
 */

import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { M_GET_STORE_CATEGORIES } from '@gql/queries/store';

/**
 * 매장 카테고리 조회 Hook
 * @param {Object} options - 쿼리 옵션
 */
export const useStoreCategories = (options = {}) => {
  const {
    includeInactive = false,
    sortBy = 'ORDER'
  } = options;

  const {
    data,
    loading,
    error,
    refetch
  } = useQuery(M_GET_STORE_CATEGORIES, {
    variables: {
      includeInactive,
      sortBy
    },
    errorPolicy: 'partial',
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true
  });

  // 메모이제이션된 카테고리 데이터
  const categories = useMemo(() => {
    return data?.mGetStoreCategories || [];
  }, [data]);

  // 카테고리 검색
  const findCategoryById = useMemo(() => {
    return (categoryId) => {
      return categories.find(category => category.id === categoryId);
    };
  }, [categories]);

  const findCategoryBySlug = useMemo(() => {
    return (slug) => {
      return categories.find(category => category.slug === slug);
    };
  }, [categories]);

  // 활성 카테고리만 필터링
  const activeCategories = useMemo(() => {
    return categories.filter(category => category.isActive);
  }, [categories]);

  // 카테고리 통계
  const categoryStats = useMemo(() => {
    return {
      total: categories.length,
      active: activeCategories.length,
      inactive: categories.length - activeCategories.length
    };
  }, [categories, activeCategories]);

  return {
    // 카테고리 데이터
    categories,
    activeCategories,

    // 상태
    loading,
    error,

    // 유틸리티 함수
    findCategoryById,
    findCategoryBySlug,
    categoryStats,

    // 액션
    refetch,

    // 플래그
    hasCategories: categories.length > 0,
    isEmpty: !loading && categories.length === 0
  };
};

export default useStoreCategories;