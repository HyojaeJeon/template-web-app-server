'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/shared/i18n';
import PageLayout from '@/shared/components/ui/layout/PageLayout';
import { Card } from '@/shared/components/ui/display';
import { Button } from '@/shared/components/ui/buttons';
import { Loading, Alert } from '@/shared/components/ui/feedback';
import Pagination from '@/shared/components/ui/navigation/Pagination';
import { RefreshCw } from 'lucide-react';

/**
 * ListPageWrapper - 모든 목록 페이지에서 사용할 수 있는 재사용 가능한 래퍼 컴포넌트
 * 
 * @description
 * - URL 기반 페이지네이션 자동 처리
 * - 스크롤 가능한 컨텐츠 영역
 * - 통계 카드 영역 지원
 * - 탭 네비게이션 지원
 * - 통일된 로딩/에러 처리
 * - 빈 상태 표시
 * 
 * @example
 * <ListPageWrapper
 *   title="주문 관리"
 *   subtitle="매장의 주문을 관리하세요"
 *   breadcrumbs={[...]}
 *   filters={{ status: 'active', page: 1 }}
 *   loading={loading}
 *   error={error}
 *   data={orders}
 *   totalCount={100}
 *   totalPages={5}
 *   onFiltersChange={handleFiltersChange}
 *   statsCards={<StatsCards />}
 *   tabs={[{ key: 'all', label: '전체', count: 100 }]}
 *   emptyState={{ title: '주문이 없습니다', icon: Package }}
 * >
 *   {orders.map(order => <OrderCard key={order.id} order={order} />)}
 * </ListPageWrapper>
 */
const ListPageWrapper = ({
  // 페이지 기본 정보
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  showRealtimeClock = false,
  
  // 데이터 & 상태
  loading = false,
  error = null,
  data = [],
  totalCount = 0,
  totalPages = 1,
  
  // 필터링 & 페이지네이션
  filters = {},
  onFiltersChange,
  urlParamKeys = ['page', 'limit', 'status'], // URL에서 관리할 파라미터 키들
  
  // UI 구성 요소
  statsCards,
  tabs,
  selectedTab,
  onTabChange,
  searchComponent,
  filterComponent,
  
  // 빈 상태
  emptyState = {
    title: 'common.empty.noData',
    description: 'common.empty.noDataDescription',
    icon: null,
    action: null
  },
  
  // 스타일링
  className = '',
  contentClassName = '',
  
  // 자식 컴포넌트
  children
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((newPage) => {
    updateUrlParams({ page: newPage });
    if (onFiltersChange) {
      onFiltersChange({ ...filters, page: newPage });
    }
  }, [updateUrlParams, onFiltersChange, filters]);

  // 필터 변경 핸들러
  const handleFilterChange = useCallback((newFilters) => {
    const updatedFilters = { ...newFilters, page: 1 }; // 필터 변경 시 첫 페이지로
    updateUrlParams(updatedFilters);
    if (onFiltersChange) {
      onFiltersChange(updatedFilters);
    }
  }, [updateUrlParams, onFiltersChange]);

  // 탭 변경 핸들러
  const handleTabChange = useCallback((tabKey) => {
    if (onTabChange) {
      onTabChange(tabKey);
    }
  }, [onTabChange]);

  // 새로고침 핸들러
  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  // 현재 페이지 정보
  const currentPage = filters.page || 1;
  const limit = filters.limit || 20;

  // 에러 메시지 결정 함수
  const getErrorMessage = (error) => {
    if (!error) return t('common.errors.unknownError');

    // GraphQL 에러 처리
    if (error.networkError) {
      return t('common.errors.networkError');
    }

    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      const graphqlError = error.graphQLErrors[0];
      if (graphqlError.extensions?.code === 'UNAUTHENTICATED') {
        return t('common.errors.accessDenied');
      }
    }

    // 기본 에러 메시지
    if (error.message?.includes('Failed to fetch')) {
      return t('common.errors.loadFailed');
    }

    return error.message || t('common.errors.loadingError');
  };

  // 에러 상태
  if (error) {
    return (
      <PageLayout
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        className={className}
        maxWidth="full"
      >
        <Alert variant="error" className="mb-6" showIcon={true}>
          <div className="flex items-center justify-between gap-4">
            <div className="text-red-800 dark:text-red-300 flex-1 min-w-0">
              {getErrorMessage(error)}
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw />}
              className="flex-shrink-0 border-red-300 hover:border-red-400 hover:bg-red-50 dark:border-red-700 dark:hover:border-red-600 dark:hover:bg-red-950/50 text-red-700 dark:text-red-300"
            >
              {t('common.actions.retry')}
            </Button>
          </div>
        </Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={title}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
      actions={actions}
      showRealtimeClock={showRealtimeClock}
      className={className}
      contentClassName="flex flex-col"
      maxWidth="full"
    >
      <div className="flex flex-col">
        {/* 통계 카드 영역 */}
        {statsCards && (
          <div className="mb-6 flex-shrink-0">
            {statsCards}
          </div>
        )}

        {/* 검색 및 필터 영역 */}
        {(searchComponent || filterComponent) && (
          <div className="mb-6 flex-shrink-0">
            {searchComponent && filterComponent ? (
              <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                <div className="flex-1 w-full sm:w-auto">
                  {searchComponent}
                </div>
                <div className="w-full">
                  {filterComponent}
                </div>
              </div>
            ) : (
              <>
                {searchComponent && (
                  <div className="w-full">
                    {searchComponent}
                  </div>
                )}
                {filterComponent && (
                  <div className="w-full">
                    {filterComponent}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 탭 네비게이션 */}
        {tabs && tabs.length > 0 && (
          <div className="mb-6 flex-shrink-0">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      selectedTab === tab.key
                        ? 'border-vietnam-mint text-vietnam-mint'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {t(tab.label)}
                    {tab.count !== undefined && (
                      <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2.5 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* 메인 컨텐츠 영역 */}
        <div className={contentClassName || ''}>
          {/* 로딩 상태 */}
          {loading ? (
            <div className="min-h-[500px] flex items-center justify-center">
              <Loading size="large" />
            </div>
          ) : (
            <div>
              <div className="space-y-4 pb-6">
                {/* 빈 상태 체크 */}
                {(!data || data.length === 0) ? (
                  <Card className="p-12 flex items-center justify-center min-h-[500px]">
                    <div className="flex flex-col items-center justify-center text-center max-w-md">
                      {emptyState.icon && (
                        <div className="w-16 h-16 text-gray-400 mb-4 flex items-center justify-center">
                          <emptyState.icon className="w-full h-full" />
                        </div>
                      )}
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {t(emptyState.title)}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {t(emptyState.description)}
                      </p>
                      {emptyState.action && (
                        <div className="mt-4 flex items-center justify-center">
                          {emptyState.action}
                        </div>
                      )}
                    </div>
                  </Card>
                ) : (
                  children
                )}
              </div>
            </div>
          )}
        </div>

        {/* 페이지네이션 - 항상 하단에 고정 */}
        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-4 border-t border-gray-200 dark:border-gray-700 mt-6 flex-shrink-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('common.pagination.showing', {
                start: (currentPage - 1) * limit + 1,
                end: Math.min(currentPage * limit, totalCount),
                total: totalCount
              })}
            </p>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              siblingCount={1}
              boundaryCount={1}
              showFirstLast={true}
              showPrevNext={true}
              size="medium"
              previousLabel={t('common.pagination.previous')}
              nextLabel={t('common.pagination.next')}
              firstLabel={t('common.pagination.first')}
              lastLabel={t('common.pagination.last')}
              ariaLabel={`${title} 페이지 탐색`}
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ListPageWrapper;