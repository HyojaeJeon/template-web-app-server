'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Table from './Table';

/**
 * DataTable 컴포넌트 - WCAG 2.1 준수
 * 고급 기능이 포함된 데이터 테이블 (검색, 필터링, 페이지네이션)
 */
const DataTable = ({
  columns,
  data: initialData,
  caption,
  searchable = true,
  filterable = true,
  pageable = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  exportable = false,
  onExport,
  globalFilter = '',
  columnFilters = {},
  onGlobalFilterChange,
  onColumnFilterChange,
  className = '',
  ...tableProps
}) => {
  const [data, setData] = useState(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState(globalFilter);
  const [filters, setFilters] = useState(columnFilters);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // 정렬 처리
  const handleSort = (columnKey, direction) => {
    setSortConfig({ key: columnKey, direction });
  };

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    let filtered = [...initialData];

    // 전역 검색
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // 컬럼별 필터
    Object.keys(filters).forEach(columnKey => {
      const filterValue = filters[columnKey];
      if (filterValue && filterValue !== '') {
        filtered = filtered.filter(row =>
          String(row[columnKey]).toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    });

    // 정렬
    if (sortConfig.key && sortConfig.direction) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (sortConfig.direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    return filtered;
  }, [initialData, searchTerm, filters, sortConfig]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = pageable 
    ? filteredData.slice(startIndex, endIndex)
    : filteredData;

  // 페이지 변경 시 범위 체크
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // 검색어 변경 처리
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    if (onGlobalFilterChange) {
      onGlobalFilterChange(value);
    }
  };

  // 컬럼 필터 변경 처리
  const handleColumnFilterChange = (columnKey, value) => {
    const newFilters = { ...filters, [columnKey]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    if (onColumnFilterChange) {
      onColumnFilterChange(columnKey, value);
    }
  };

  // 내보내기 처리
  const handleExport = () => {
    if (onExport) {
      onExport(filteredData);
    } else {
      // 기본 CSV 내보내기
      const csv = [
        columns.map(col => col.label).join(','),
        ...filteredData.map(row =>
          columns.map(col => row[col.key]).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // 페이지 범위 계산
  const getPageRange = () => {
    const range = [];
    const maxPages = 5;
    let start = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let end = Math.min(totalPages, start + maxPages - 1);
    
    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 툴바 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        {/* 검색 */}
        {searchable && (
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ac1bc] focus:border-transparent"
                aria-label="테이블 검색"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          {exportable && (
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
              aria-label="데이터 내보내기"
            >
              <svg
                className="h-5 w-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              내보내기
            </button>
          )}
        </div>
      </div>

      {/* 컬럼 필터 */}
      {filterable && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {columns
            .filter(col => col.filterable !== false)
            .map(column => (
              <div key={column.key} className="min-w-[150px]">
                <input
                  type="text"
                  value={filters[column.key] || ''}
                  onChange={(e) => handleColumnFilterChange(column.key, e.target.value)}
                  placeholder={`${column.label} 필터`}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2ac1bc] focus:border-transparent"
                  aria-label={`${column.label} 필터`}
                />
              </div>
            ))}
        </div>
      )}

      {/* 테이블 */}
      <Table
        columns={columns}
        data={currentData}
        caption={caption}
        onSort={handleSort}
        sortColumn={sortConfig.key}
        sortDirection={sortConfig.direction}
        {...tableProps}
      />

      {/* 페이지네이션 */}
      {pageable && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* 페이지 정보 */}
          <div className="text-sm text-gray-700">
            전체 {filteredData.length}개 중 {startIndex + 1}-{Math.min(endIndex, filteredData.length)}개 표시
          </div>

          {/* 페이지 크기 선택 */}
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm text-gray-700">
              페이지당:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#2ac1bc] focus:border-transparent"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}개
                </option>
              ))}
            </select>
          </div>

          {/* 페이지 네비게이션 */}
          <nav className="flex items-center gap-1" aria-label="페이지 네비게이션">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="첫 페이지"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="이전 페이지"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {getPageRange().map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`
                  px-3 py-1 rounded-md text-sm font-medium
                  ${page === currentPage
                    ? 'bg-[#2ac1bc] text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                  }
                `}
                aria-label={`페이지 ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="다음 페이지"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="마지막 페이지"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default DataTable;