'use client'

/**
 * Pagination 컴포넌트 - Local App 디자인 시스템 v3.0
 * 모바일 최적화 버전: WCAG 2.1 준수, 다크모드 지원
 *
 * 디자인 특징:
 * - Local 테마 컬러 (민트/그린 그라데이션)
 * - 글래스모피즘 효과
 * - 터치 접근성 44px 최소 타겟
 * - 다크모드 완벽 지원
 * - 배터리 효율적 애니메이션
 */

import { useMemo } from 'react'
import { useTranslation } from '@/shared/i18n'
import { ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline'

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  showFirstLast = true,
  showPrevNext = true,
  disabled = false,
  size = 'medium',
  variant = 'default',
  className = '',
  previousLabel,
  nextLabel,
  firstLabel,
  lastLabel,
  ariaLabel,
  showPageInfo = true,
  compact = false
}) => {
  const { t } = useTranslation()

  // 번역 기본값 설정
  const labels = {
    previous: previousLabel || t('common.pagination.previous'),
    next: nextLabel || t('common.pagination.next'),
    first: firstLabel || t('common.pagination.first'),
    last: lastLabel || t('common.pagination.last'),
    ariaLabel: ariaLabel || t('common.pagination.navigation')
  }

  const range = (start, end) => {
    const length = end - start + 1
    return Array.from({ length }, (_, idx) => idx + start)
  }

  const paginationRange = useMemo(() => {
    const totalPageNumbers = siblingCount * 2 + 3 + boundaryCount * 2

    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages)
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

    const shouldShowLeftDots = leftSiblingIndex > boundaryCount + 2
    const shouldShowRightDots = rightSiblingIndex < totalPages - boundaryCount - 1

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount + boundaryCount
      const leftRange = range(1, leftItemCount)
      return [...leftRange, 'dots', ...range(totalPages - boundaryCount + 1, totalPages)]
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount + boundaryCount
      const rightRange = range(totalPages - rightItemCount + 1, totalPages)
      return [...range(1, boundaryCount), 'dots', ...rightRange]
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex)
      return [
        ...range(1, boundaryCount),
        'dots',
        ...middleRange,
        'dots',
        ...range(totalPages - boundaryCount + 1, totalPages)
      ]
    }

    return []
  }, [currentPage, totalPages, siblingCount, boundaryCount])

  const handlePageChange = (page) => {
    if (disabled || page === currentPage || page < 1 || page > totalPages) {
      return
    }
    onPageChange?.(page)
  }

  const handleKeyDown = (event, page) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handlePageChange(page)
    }
  }

  // 사이즈별 클래스 정의 (모바일 터치 타겟 최적화)
  const sizeConfig = {
    small: {
      button: 'min-w-[36px] h-9 px-2.5 text-xs gap-1',
      icon: 'w-3.5 h-3.5',
      gap: 'gap-1',
      text: 'text-xs'
    },
    medium: {
      button: 'min-w-[44px] h-11 px-3 text-sm gap-1.5',
      icon: 'w-4 h-4',
      gap: 'gap-1.5',
      text: 'text-sm'
    },
    large: {
      button: 'min-w-[52px] h-12 px-4 text-base gap-2',
      icon: 'w-5 h-5',
      gap: 'gap-2',
      text: 'text-base'
    }
  }

  const currentSize = sizeConfig[size] || sizeConfig.medium

  // 기본 버튼 스타일 (디자인 시스템 준수)
  const baseButtonClasses = `
    inline-flex items-center justify-center
    font-medium rounded-xl
    transition-all duration-200 ease-out
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2AC1BC]/50 focus-visible:ring-offset-2
    dark:focus-visible:ring-[#2AC1BC]/60 dark:focus-visible:ring-offset-gray-900
    disabled:opacity-40 disabled:cursor-not-allowed disabled:saturate-75
  `

  // 네비게이션 버튼 스타일 (이전/다음/처음/끝)
  const navButtonClasses = `
    ${baseButtonClasses}
    ${currentSize.button}
    border border-gray-200 dark:border-gray-600
    bg-white dark:bg-gray-800
    text-gray-600 dark:text-gray-300
    hover:text-[#2AC1BC] dark:hover:text-[#2AC1BC]
    hover:border-[#2AC1BC]/40 dark:hover:border-[#2AC1BC]/50
    hover:bg-gradient-to-br hover:from-[#2AC1BC]/5 hover:to-[#00B14F]/5
    dark:hover:from-[#2AC1BC]/10 dark:hover:to-[#00B14F]/10
    hover:shadow-sm hover:shadow-[#2AC1BC]/10
    active:bg-[#2AC1BC]/10 dark:active:bg-[#2AC1BC]/15
    disabled:hover:text-gray-400 disabled:hover:border-gray-200 disabled:hover:bg-transparent
    dark:disabled:hover:text-gray-500 dark:disabled:hover:border-gray-600
  `

  // 페이지 번호 버튼 스타일 (비활성)
  const pageButtonClasses = `
    ${baseButtonClasses}
    ${currentSize.button}
    border border-gray-200 dark:border-gray-600
    bg-white dark:bg-gray-800
    text-gray-700 dark:text-gray-300
    hover:text-[#2AC1BC] dark:hover:text-[#2AC1BC]
    hover:border-[#2AC1BC]/40 dark:hover:border-[#2AC1BC]/50
    hover:bg-gradient-to-br hover:from-[#2AC1BC]/5 hover:to-[#00B14F]/5
    dark:hover:from-[#2AC1BC]/10 dark:hover:to-[#00B14F]/10
    hover:shadow-sm hover:shadow-[#2AC1BC]/10
    active:bg-[#2AC1BC]/10 dark:active:bg-[#2AC1BC]/15
  `

  // 활성 페이지 버튼 스타일 (Local 테마 그라데이션)
  const activePageClasses = `
    ${baseButtonClasses}
    ${currentSize.button}
    border border-transparent
    bg-gradient-to-br from-[#2AC1BC] via-[#00B14F] to-[#26a5a0]
    dark:from-[#2AC1BC]/90 dark:via-[#00B14F]/85 dark:to-[#26a5a0]/80
    text-white font-semibold
    shadow-lg shadow-[#2AC1BC]/25 dark:shadow-[#2AC1BC]/35
    hover:shadow-xl hover:shadow-[#2AC1BC]/30 dark:hover:shadow-[#2AC1BC]/40
  `

  // Dots 스타일
  const dotsClasses = `
    px-1.5 py-2
    text-gray-400 dark:text-gray-500
    font-medium select-none
    ${currentSize.text}
  `

  // 컴팩트 모드일 때 레이블 숨김
  const showLabels = !compact

  return (
    <nav
      aria-label={labels.ariaLabel}
      className={`flex flex-col items-center ${currentSize.gap} ${className}`}
    >
      <ul className={`flex items-center ${currentSize.gap}`}>
        {/* First Page Button */}
        {showFirstLast && (
          <li>
            <button
              className={navButtonClasses}
              onClick={() => handlePageChange(1)}
              disabled={disabled || currentPage === 1}
              aria-label={labels.first}
              title={labels.first}
              type="button"
            >
              <ChevronDoubleLeftIcon className={currentSize.icon} aria-hidden="true" />
            </button>
          </li>
        )}

        {/* Previous Page Button */}
        {showPrevNext && (
          <li>
            <button
              className={navButtonClasses}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={disabled || currentPage === 1}
              aria-label={labels.previous}
              title={labels.previous}
              type="button"
            >
              <ChevronLeftIcon className={currentSize.icon} aria-hidden="true" />
              {showLabels && (
                <span className="hidden sm:inline ml-1">{labels.previous}</span>
              )}
            </button>
          </li>
        )}

        {/* Page Numbers */}
        {paginationRange.map((pageNumber, index) => {
          if (pageNumber === 'dots') {
            return (
              <li key={`dots-${index}`}>
                <span className={dotsClasses} aria-hidden="true">
                  ···
                </span>
              </li>
            )
          }

          const isActive = currentPage === pageNumber

          return (
            <li key={pageNumber}>
              <button
                className={isActive ? activePageClasses : pageButtonClasses}
                onClick={() => handlePageChange(pageNumber)}
                onKeyDown={(e) => handleKeyDown(e, pageNumber)}
                disabled={disabled}
                aria-label={t('common.pagination.goToPage', { page: pageNumber })}
                aria-current={isActive ? 'page' : undefined}
                title={t('common.pagination.pageTitle', { page: pageNumber })}
                type="button"
              >
                {pageNumber}
              </button>
            </li>
          )
        })}

        {/* Next Page Button */}
        {showPrevNext && (
          <li>
            <button
              className={navButtonClasses}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={disabled || currentPage === totalPages}
              aria-label={labels.next}
              title={labels.next}
              type="button"
            >
              {showLabels && (
                <span className="hidden sm:inline mr-1">{labels.next}</span>
              )}
              <ChevronRightIcon className={currentSize.icon} aria-hidden="true" />
            </button>
          </li>
        )}

        {/* Last Page Button */}
        {showFirstLast && (
          <li>
            <button
              className={navButtonClasses}
              onClick={() => handlePageChange(totalPages)}
              disabled={disabled || currentPage === totalPages}
              aria-label={labels.last}
              title={labels.last}
              type="button"
            >
              <ChevronDoubleRightIcon className={currentSize.icon} aria-hidden="true" />
            </button>
          </li>
        )}
      </ul>

      {/* Page Info */}
      {showPageInfo && (
        <div
          className={`${currentSize.text} text-gray-500 dark:text-gray-400 font-medium`}
          aria-live="polite"
        >
          <span className="tabular-nums">
            {t('common.pagination.pageInfo', { current: currentPage, total: totalPages })}
          </span>
        </div>
      )}
    </nav>
  )
}

export default Pagination
