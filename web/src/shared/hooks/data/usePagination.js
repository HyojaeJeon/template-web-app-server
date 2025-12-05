/**
 * usePagination.js - 페이지네이션 상태 관리 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 클라이언트 사이드 및 서버 사이드 페이지네이션 지원
 * - URL 동기화 및 브라우저 히스토리 관리
 * - 페이지 크기 동적 변경 지원
 * - 접근성 ARIA 라벨 자동 생성
 * - Local어 페이지네이션 텍스트 지원
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from '../../i18n'

/**
 * 페이지네이션 훅
 * @param {Object} options 설정 객체
 * @param {number} options.totalItems 전체 아이템 수
 * @param {number} options.initialPage 초기 페이지 (기본: 1)
 * @param {number} options.initialPageSize 초기 페이지 크기 (기본: 10)
 * @param {Array} options.pageSizeOptions 페이지 크기 옵션 (기본: [10, 20, 50, 100])
 * @param {boolean} options.serverSide 서버사이드 페이지네이션 여부 (기본: false)
 * @param {string} options.pageParam URL 페이지 파라미터명 (기본: 'page')
 * @param {string} options.pageSizeParam URL 페이지크기 파라미터명 (기본: 'pageSize')
 * @param {boolean} options.syncWithUrl URL 동기화 여부 (기본: true)
 * @param {Function} options.onPageChange 페이지 변경 콜백
 * @param {Function} options.onPageSizeChange 페이지 크기 변경 콜백
 * @param {number} options.siblingCount 현재 페이지 주변 페이지 수 (기본: 1)
 */
export const usePagination = ({
  totalItems = 0,
  initialPage = 1,
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  serverSide = false,
  pageParam = 'page',
  pageSizeParam = 'pageSize',
  syncWithUrl = true,
  onPageChange,
  onPageSizeChange,
  siblingCount = 1
}) => {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // URL에서 초기값 가져오기
  const getInitialValues = useCallback(() => {
    if (!syncWithUrl) {
      return { page: initialPage, pageSize: initialPageSize }
    }
    
    const urlPage = parseInt(searchParams.get(pageParam)) || initialPage
    const urlPageSize = parseInt(searchParams.get(pageSizeParam)) || initialPageSize
    
    return {
      page: Math.max(1, urlPage),
      pageSize: pageSizeOptions.includes(urlPageSize) ? urlPageSize : initialPageSize
    }
  }, [syncWithUrl, searchParams, pageParam, pageSizeParam, initialPage, initialPageSize, pageSizeOptions])

  const { page: initPage, pageSize: initPageSize } = getInitialValues()
  
  const [currentPage, setCurrentPage] = useState(initPage)
  const [pageSize, setPageSize] = useState(initPageSize)

  // URL 업데이트
  const updateUrl = useCallback((newPage, newPageSize) => {
    if (!syncWithUrl) return
    
    const params = new URLSearchParams(searchParams)
    
    if (newPage > 1) {
      params.set(pageParam, newPage.toString())
    } else {
      params.delete(pageParam)
    }
    
    if (newPageSize !== initialPageSize) {
      params.set(pageSizeParam, newPageSize.toString())
    } else {
      params.delete(pageSizeParam)
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.push(newUrl, { scroll: false })
  }, [syncWithUrl, searchParams, router, pageParam, pageSizeParam, initialPageSize])

  // 페이지 계산
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pageSize) || 1
  }, [totalItems, pageSize])

  // 현재 페이지가 총 페이지를 초과하는 경우 조정
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  // 페이지 변경
  const goToPage = useCallback((page) => {
    const newPage = Math.max(1, Math.min(page, totalPages))
    if (newPage !== currentPage) {
      setCurrentPage(newPage)
      updateUrl(newPage, pageSize)
      onPageChange?.(newPage, pageSize)
    }
  }, [currentPage, totalPages, pageSize, updateUrl, onPageChange])

  // 다음 페이지
  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  // 이전 페이지
  const goToPreviousPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  // 첫 페이지
  const goToFirstPage = useCallback(() => {
    goToPage(1)
  }, [goToPage])

  // 마지막 페이지
  const goToLastPage = useCallback(() => {
    goToPage(totalPages)
  }, [goToPage, totalPages])

  // 페이지 크기 변경
  const changePageSize = useCallback((newPageSize) => {
    if (pageSizeOptions.includes(newPageSize) && newPageSize !== pageSize) {
      const newPage = Math.min(currentPage, Math.ceil(totalItems / newPageSize)) || 1
      setPageSize(newPageSize)
      setCurrentPage(newPage)
      updateUrl(newPage, newPageSize)
      onPageSizeChange?.(newPageSize, newPage)
    }
  }, [pageSize, currentPage, totalItems, pageSizeOptions, updateUrl, onPageSizeChange])

  // 페이지 범위 계산 (표시할 아이템)
  const itemRange = useMemo(() => {
    if (!serverSide) {
      const start = (currentPage - 1) * pageSize
      const end = Math.min(start + pageSize, totalItems)
      return { start, end }
    }
    
    // 서버사이드인 경우 표시용으로만 계산
    const start = Math.min((currentPage - 1) * pageSize + 1, totalItems)
    const end = Math.min(currentPage * pageSize, totalItems)
    return { start, end }
  }, [currentPage, pageSize, totalItems, serverSide])

  // 페이지네이션 버튼 배열 생성
  const pageNumbers = useMemo(() => {
    const pages = []
    
    // 총 페이지가 적은 경우 모든 페이지 표시
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
      return pages
    }
    
    // 시작과 끝 페이지 계산
    const leftBoundary = Math.max(1, currentPage - siblingCount)
    const rightBoundary = Math.min(totalPages, currentPage + siblingCount)
    
    // 첫 페이지 항상 표시
    pages.push(1)
    
    // 첫 페이지와 왼쪽 경계 사이에 gap이 있으면 '...' 추가
    if (leftBoundary > 2) {
      pages.push('...')
    }
    
    // 현재 페이지 주변 페이지들 추가
    for (let i = leftBoundary; i <= rightBoundary; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i)
      }
    }
    
    // 오른쪽 경계와 마지막 페이지 사이에 gap이 있으면 '...' 추가
    if (rightBoundary < totalPages - 1) {
      pages.push('...')
    }
    
    // 마지막 페이지 항상 표시 (단, 첫 페이지와 다른 경우)
    if (totalPages > 1) {
      pages.push(totalPages)
    }
    
    return pages
  }, [totalPages, currentPage, siblingCount])

  // 상태 플래그들
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages
  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  // ARIA 라벨 생성
  const getAriaLabels = useCallback(() => {
    return {
      pagination: t('common.navigation.pagination', { fallback: '페이지네이션' }),
      page: (page) => t('common.navigation.goToPage', { 
        page, 
        fallback: `${page}페이지로 이동`
      }),
      currentPage: t('common.navigation.currentPage', { 
        fallback: '현재 페이지'
      }),
      previous: t('common.actions.previous', { fallback: '이전' }),
      next: t('common.actions.next', { fallback: '다음' }),
      first: t('common.navigation.first', { fallback: '처음' }),
      last: t('common.navigation.last', { fallback: '마지막' })
    }
  }, [t])

  // 페이지네이션 정보 텍스트
  const getPaginationInfo = useCallback(() => {
    if (totalItems === 0) {
      return t('common.navigation.noResults', { fallback: '결과가 없습니다' })
    }
    
    return t('common.navigation.showingResults', {
      start: itemRange.start,
      end: itemRange.end,
      total: totalItems,
      fallback: `${itemRange.start}-${itemRange.end} / 총 ${totalItems}개`
    })
  }, [t, totalItems, itemRange])

  return {
    // 현재 상태
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    
    // 범위 정보
    itemRange,
    startItem: itemRange.start,
    endItem: itemRange.end,
    
    // 상태 플래그
    canGoPrevious,
    canGoNext,
    isFirstPage,
    isLastPage,
    hasPages: totalPages > 1,
    
    // 페이지 변경 액션
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    
    // 페이지 크기 관련
    changePageSize,
    pageSizeOptions,
    
    // UI 데이터
    pageNumbers,
    paginationInfo: getPaginationInfo(),
    ariaLabels: getAriaLabels(),
    
    // 옵션
    serverSide
  }
}

/**
 * 클라이언트 사이드 배열 페이지네이션 훅
 */
export const useClientPagination = (items = [], options = {}) => {
  const pagination = usePagination({
    ...options,
    totalItems: items.length,
    serverSide: false
  })

  // 현재 페이지의 아이템들
  const currentItems = useMemo(() => {
    const { start } = pagination.itemRange
    return items.slice(start, start + pagination.pageSize)
  }, [items, pagination.itemRange, pagination.pageSize])

  return {
    ...pagination,
    items: currentItems
  }
}

export default usePagination