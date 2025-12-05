'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * VirtualTable 컴포넌트 - WCAG 2.1 준수
 * 대용량 데이터를 위한 가상 스크롤 테이블
 */
const VirtualTable = ({
  columns,
  data,
  rowHeight = 48,
  visibleRows = 10,
  headerHeight = 48,
  variant = 'default',
  striped = false,
  hoverable = true,
  selectable = false,
  selectedRows = [],
  onRowSelect,
  onSort,
  sortColumn,
  sortDirection,
  loading = false,
  emptyMessage = '데이터가 없습니다',
  className = '',
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef(null);
  const scrollElementRef = useRef(null);

  // 베리언트별 스타일
  const variantStyles = {
    default: 'bg-white border border-gray-200',
    card: 'bg-white shadow-lg rounded-lg overflow-hidden',
    minimal: 'bg-transparent',
  };

  // 전체 높이 계산
  const totalHeight = useMemo(() => data.length * rowHeight, [data.length, rowHeight]);

  // 가시 범위 계산
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / rowHeight);
    const end = Math.min(start + visibleRows + 1, data.length);
    return { start, end };
  }, [scrollTop, rowHeight, visibleRows, data.length]);

  // 가시 데이터
  const visibleData = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end);
  }, [data, visibleRange]);

  // 컨테이너 높이 설정
  useEffect(() => {
    if (containerRef.current) {
      const height = visibleRows * rowHeight + headerHeight;
      setContainerHeight(height);
    }
  }, [visibleRows, rowHeight, headerHeight]);

  // 스크롤 핸들러
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // 정렬 핸들러
  const handleSort = useCallback((column) => {
    if (onSort && column.sortable) {
      const newDirection = 
        sortColumn === column.key && sortDirection === 'asc' 
          ? 'desc' 
          : 'asc';
      onSort(column.key, newDirection);
    }
  }, [onSort, sortColumn, sortDirection]);

  // 행 선택 핸들러
  const handleRowClick = useCallback((row, index) => {
    if (selectable && onRowSelect) {
      const actualIndex = visibleRange.start + index;
      onRowSelect(row, actualIndex);
    }
  }, [selectable, onRowSelect, visibleRange.start]);

  // 행 선택 체크
  const isRowSelected = useCallback((row, index) => {
    if (!selectable) return false;
    const actualIndex = visibleRange.start + index;
    return selectedRows.includes(actualIndex) || selectedRows.includes(row.id);
  }, [selectable, selectedRows, visibleRange.start]);

  // 전체 선택 핸들러
  const handleSelectAll = useCallback((checked) => {
    if (onRowSelect) {
      onRowSelect('all', checked);
    }
  }, [onRowSelect]);

  // 키보드 네비게이션
  const handleKeyDown = useCallback((e) => {
    if (!scrollElementRef.current) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        scrollElementRef.current.scrollTop += rowHeight;
        break;
      case 'ArrowUp':
        e.preventDefault();
        scrollElementRef.current.scrollTop -= rowHeight;
        break;
      case 'PageDown':
        e.preventDefault();
        scrollElementRef.current.scrollTop += rowHeight * visibleRows;
        break;
      case 'PageUp':
        e.preventDefault();
        scrollElementRef.current.scrollTop -= rowHeight * visibleRows;
        break;
      case 'Home':
        if (e.ctrlKey) {
          e.preventDefault();
          scrollElementRef.current.scrollTop = 0;
        }
        break;
      case 'End':
        if (e.ctrlKey) {
          e.preventDefault();
          scrollElementRef.current.scrollTop = totalHeight;
        }
        break;
    }
  }, [rowHeight, visibleRows, totalHeight]);

  // 로딩 상태
  if (loading) {
    return (
      <div className={`${variantStyles[variant]} p-8 rounded-lg`}>
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2ac1bc]"></div>
          <span className="ml-3 text-gray-500">로딩 중...</span>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (!data || data.length === 0) {
    return (
      <div className={`${variantStyles[variant]} p-8 rounded-lg`}>
        <div className="text-center text-gray-500">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400 mb-3"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`${variantStyles[variant]} ${className} rounded-lg`}
      style={{ height: containerHeight }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="가상 스크롤 테이블"
    >
      {/* 헤더 */}
      <div 
        className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200"
        style={{ height: headerHeight }}
      >
        <div className="flex items-center h-full">
          {selectable && (
            <div className="w-12 px-4">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-[#2ac1bc] focus:ring-[#2ac1bc]"
                onChange={(e) => handleSelectAll(e.target.checked)}
                checked={selectedRows.length === data.length && data.length > 0}
                aria-label="전체 선택"
              />
            </div>
          )}
          {columns.map((column) => (
            <div
              key={column.key}
              className={`
                flex-1 px-4 font-semibold text-gray-900
                ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                ${column.width ? `w-${column.width}` : ''}
                ${column.align === 'center' ? 'text-center' : ''}
                ${column.align === 'right' ? 'text-right' : ''}
              `}
              onClick={() => handleSort(column)}
              aria-sort={
                sortColumn === column.key
                  ? sortDirection === 'asc' ? 'ascending' : 'descending'
                  : 'none'
              }
            >
              <div className="flex items-center gap-1 h-full">
                {column.label}
                {column.sortable && (
                  <span className="text-gray-400">
                    {sortColumn === column.key ? (
                      sortDirection === 'asc' ? '↑' : '↓'
                    ) : (
                      '↕'
                    )}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 가상 스크롤 컨테이너 */}
      <div 
        ref={scrollElementRef}
        className="overflow-y-auto"
        style={{ height: containerHeight - headerHeight }}
        onScroll={handleScroll}
        role="grid"
        aria-rowcount={data.length}
      >
        {/* 스페이서 (상단) */}
        <div style={{ height: visibleRange.start * rowHeight }} />
        
        {/* 가시 행들 */}
        {visibleData.map((row, index) => {
          const actualIndex = visibleRange.start + index;
          const selected = isRowSelected(row, index);
          
          return (
            <div
              key={row.id || actualIndex}
              className={`
                flex items-center border-b border-gray-100
                ${hoverable ? 'hover:bg-gray-50' : ''}
                ${striped && actualIndex % 2 === 1 ? 'bg-gray-50/50' : ''}
                ${selected ? 'bg-[#2ac1bc]/10' : ''}
                ${selectable ? 'cursor-pointer' : ''}
                transition-colors duration-150
              `}
              style={{ height: rowHeight }}
              onClick={() => handleRowClick(row, index)}
              role="row"
              aria-rowindex={actualIndex + 1}
              aria-selected={selected}
            >
              {selectable && (
                <div className="w-12 px-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#2ac1bc] focus:ring-[#2ac1bc]"
                    checked={selected}
                    onChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`행 ${actualIndex + 1} 선택`}
                  />
                </div>
              )}
              {columns.map((column) => (
                <div
                  key={column.key}
                  className={`
                    flex-1 px-4 text-gray-900
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : ''}
                  `}
                  role="gridcell"
                >
                  {column.render
                    ? column.render(row[column.key], row, actualIndex)
                    : row[column.key]}
                </div>
              ))}
            </div>
          );
        })}
        
        {/* 스페이서 (하단) */}
        <div style={{ height: (data.length - visibleRange.end) * rowHeight }} />
      </div>

      {/* 스크롤바 인디케이터 */}
      <div 
        className="absolute right-0 top-0 w-1 bg-gray-200 rounded-full"
        style={{ height: containerHeight }}
      >
        <div 
          className="absolute w-full bg-[#2ac1bc] rounded-full transition-all duration-150"
          style={{
            height: `${(visibleRows / data.length) * 100}%`,
            top: `${(scrollTop / totalHeight) * 100}%`,
            minHeight: '20px'
          }}
        />
      </div>
    </div>
  );
};

export default VirtualTable;