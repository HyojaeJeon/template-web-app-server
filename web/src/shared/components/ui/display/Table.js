'use client';

import React from 'react';

/**
 * Table 컴포넌트 - WCAG 2.1 준수
 * ARIA grid role을 활용한 접근성 테이블
 */
const Table = ({
  columns,
  data,
  caption,
  variant = 'default',
  size = 'md',
  hoverable = true,
  striped = false,
  bordered = true,
  sticky = false,
  selectable = false,
  selectedRows = [],
  onRowSelect,
  onSort,
  sortColumn,
  sortDirection,
  className = '',
  emptyMessage = '데이터가 없습니다',
  loading = false,
  ...props
}) => {
  // 베리언트별 스타일
  const variantStyles = {
    default: 'bg-white dark:bg-gray-800',
    card: 'bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden',
    minimal: 'bg-transparent',
  };

  // 사이즈별 스타일
  const sizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  // 셀 패딩 스타일
  const cellPadding = {
    xs: 'px-2 py-1',
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-5 py-4',
    xl: 'px-6 py-5',
  };

  const handleRowClick = (row, index) => {
    if (selectable && onRowSelect) {
      onRowSelect(row, index);
    }
  };

  const handleSort = (column) => {
    if (onSort && column.sortable) {
      const newDirection = 
        sortColumn === column.key && sortDirection === 'asc' 
          ? 'desc' 
          : 'asc';
      onSort(column.key, newDirection);
    }
  };

  const isRowSelected = (row, index) => {
    if (!selectable) return false;
    return selectedRows.includes(index) || selectedRows.includes(row.id);
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className={`
        ${variantStyles[variant]}
        ${variant === 'card' ? '' : 'border border-gray-200 rounded-lg'}
        p-8
      `}>
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
      <div className={`
        ${variantStyles[variant]}
        ${variant === 'card' ? '' : 'border border-gray-200 rounded-lg'}
        p-8
      `}>
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
    <div className={`
      ${variantStyles[variant]}
      ${variant !== 'card' && bordered ? 'border border-gray-200 rounded-lg' : ''}
      ${className}
      overflow-x-auto
    `}>
      <table
        className={`
          w-full
          ${sizeStyles[size]}
        `}
        role="grid"
        aria-label={caption}
        {...props}
      >
        {caption && (
          <caption className="sr-only">
            {caption}
          </caption>
        )}
        
        <thead className={`
          ${variant === 'minimal' ? 'border-b-2' : 'bg-gray-50 dark:bg-gray-700 border-b'}
          border-gray-200 dark:border-gray-600
          ${sticky ? 'sticky top-0 z-10' : ''}
        `}>
          <tr role="row">
            {selectable && (
              <th
                scope="col"
                className={`
                  ${cellPadding[size]}
                  text-left font-semibold text-gray-900
                  w-12
                `}
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-[#2ac1bc] focus:ring-[#2ac1bc]"
                  onChange={(e) => {
                    if (onRowSelect) {
                      onRowSelect('all', e.target.checked);
                    }
                  }}
                  checked={selectedRows.length === data.length}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`
                  ${cellPadding[size]}
                  text-left font-semibold text-gray-900 dark:text-gray-100
                  ${column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''}
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
                <div className="flex items-center gap-1">
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
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              role="row"
              className={`
                ${hoverable ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : ''}
                ${striped && rowIndex % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-700/50' : ''}
                ${isRowSelected(row, rowIndex) ? 'bg-[#2ac1bc]/10 dark:bg-[#2ac1bc]/20' : ''}
                ${selectable ? 'cursor-pointer' : ''}
                transition-colors duration-150
              `}
              onClick={() => handleRowClick(row, rowIndex)}
              aria-selected={isRowSelected(row, rowIndex)}
            >
              {selectable && (
                <td className={cellPadding[size]}>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#2ac1bc] focus:ring-[#2ac1bc]"
                    checked={isRowSelected(row, rowIndex)}
                    onChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select row ${rowIndex + 1}`}
                  />
                </td>
              )}
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`
                    ${cellPadding[size]}
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : ''}
                    text-gray-900 dark:text-gray-100
                  `}
                >
                  {column.render
                    ? column.render(row, rowIndex)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;