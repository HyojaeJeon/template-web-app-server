'use client'

import { forwardRef } from 'react'

/**
 * Grid - 반응형 그리드 레이아웃 컴포넌트 (WCAG 2.1 준수)
 * 유연한 그리드 시스템으로 다양한 레이아웃 구성
 * 다크 테마 지원
 */
const Grid = forwardRef(({
  children,
  cols = 12,
  gap = 4,
  responsive = true,
  className = '',
  ...props
}, ref) => {
  // 반응형 컬럼 클래스
  const getResponsiveClass = () => {
    if (!responsive) {
      return `grid-cols-${cols}`
    }
    
    // 모바일 퍼스트 반응형 설정
    switch (cols) {
      case 12:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-12'
      case 6:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
      case 2:
        return 'grid-cols-1 sm:grid-cols-2'
      default:
        return `grid-cols-${cols}`
    }
  }

  // 갭 클래스
  const gapClass = typeof gap === 'number' ? `gap-${gap}` : gap

  return (
    <div
      ref={ref}
      className={`
        grid
        ${getResponsiveClass()}
        ${gapClass}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
})

/**
 * GridItem - 그리드 아이템 컴포넌트
 */
export const GridItem = forwardRef(({
  children,
  span = 1,
  start,
  end,
  rowSpan = 1,
  rowStart,
  rowEnd,
  className = '',
  ...props
}, ref) => {
  const colSpanClass = span ? `col-span-${span}` : ''
  const colStartClass = start ? `col-start-${start}` : ''
  const colEndClass = end ? `col-end-${end}` : ''
  const rowSpanClass = rowSpan > 1 ? `row-span-${rowSpan}` : ''
  const rowStartClass = rowStart ? `row-start-${rowStart}` : ''
  const rowEndClass = rowEnd ? `row-end-${rowEnd}` : ''

  return (
    <div
      ref={ref}
      className={`
        ${colSpanClass}
        ${colStartClass}
        ${colEndClass}
        ${rowSpanClass}
        ${rowStartClass}
        ${rowEndClass}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
})

/**
 * ResponsiveGrid - 고급 반응형 그리드
 */
export const ResponsiveGrid = forwardRef(({
  children,
  mobile = 1,
  tablet = 2,
  desktop = 3,
  wide = 4,
  gap = 4,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`
        grid
        grid-cols-${mobile}
        sm:grid-cols-${tablet}
        md:grid-cols-${desktop}
        lg:grid-cols-${wide}
        gap-${gap}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
})

/**
 * AutoGrid - 자동 그리드 레이아웃
 */
export const AutoGrid = forwardRef(({
  children,
  minWidth = '250px',
  gap = 4,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`grid gap-${gap} ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`
      }}
      {...props}
    >
      {children}
    </div>
  )
})

/**
 * MasonryGrid - 메이슨리 스타일 그리드 (CSS 기반)
 */
export const MasonryGrid = forwardRef(({
  children,
  cols = 3,
  gap = 4,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`columns-${cols} gap-${gap} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})

/**
 * FlexGrid - Flexbox 기반 그리드
 */
export const FlexGrid = forwardRef(({
  children,
  direction = 'row',
  wrap = true,
  justify = 'start',
  align = 'stretch',
  gap = 4,
  className = '',
  ...props
}, ref) => {
  const directionClass = {
    row: 'flex-row',
    'row-reverse': 'flex-row-reverse',
    col: 'flex-col',
    'col-reverse': 'flex-col-reverse'
  }[direction] || 'flex-row'

  const justifyClass = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }[justify] || 'justify-start'

  const alignClass = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    baseline: 'items-baseline',
    stretch: 'items-stretch'
  }[align] || 'items-stretch'

  return (
    <div
      ref={ref}
      className={`
        flex
        ${directionClass}
        ${wrap ? 'flex-wrap' : 'flex-nowrap'}
        ${justifyClass}
        ${alignClass}
        gap-${gap}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
})

/**
 * DeliveryMenuGrid - Local App 메뉴 그리드
 */
export const DeliveryMenuGrid = forwardRef(({
  items = [],
  onItemClick,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
        gap-6
        ${className}
      `}
      {...props}
    >
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onItemClick?.(item)}
          className="
            bg-white dark:bg-gray-800
            rounded-2xl
            shadow-lg
            overflow-hidden
            cursor-pointer
            transform transition-all duration-300
            hover:scale-105 hover:shadow-xl
            group
          "
        >
          {/* 이미지 */}
          <div className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            )}
            {item.badge && (
              <span className="
                absolute top-3 left-3
                px-3 py-1
                bg-gradient-to-r from-[#2AC1BC] to-[#00B14F]
                text-white text-xs font-bold
                rounded-full
              ">
                {item.badge}
              </span>
            )}
            {item.discount && (
              <span className="
                absolute top-3 right-3
                px-3 py-1
                bg-red-500
                text-white text-sm font-bold
                rounded-full
              ">
                -{item.discount}%
              </span>
            )}
          </div>

          {/* 정보 */}
          <div className="p-4">
            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2 line-clamp-1">
              {item.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {item.description}
            </p>
            
            {/* 가격 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    {item.originalPrice.toLocaleString()}đ
                  </span>
                )}
                <span className="text-xl font-bold text-[#2AC1BC]">
                  {item.price.toLocaleString()}đ
                </span>
              </div>
              
              {/* 평점 */}
              {item.rating && (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.rating}
                  </span>
                </div>
              )}
            </div>

            {/* 배달 정보 */}
            {item.deliveryTime && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>🏍️</span>
                  <span>{item.deliveryTime}분</span>
                  {item.deliveryFee && (
                    <>
                      <span>•</span>
                      <span>{item.deliveryFee.toLocaleString()}đ</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
})

Grid.displayName = 'Grid'
GridItem.displayName = 'GridItem'
ResponsiveGrid.displayName = 'ResponsiveGrid'
AutoGrid.displayName = 'AutoGrid'
MasonryGrid.displayName = 'MasonryGrid'
FlexGrid.displayName = 'FlexGrid'
DeliveryMenuGrid.displayName = 'DeliveryMenuGrid'

export default Grid