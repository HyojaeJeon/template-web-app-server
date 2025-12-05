'use client';

import React, { useState, useCallback, useMemo } from 'react';

/**
 * TreeTable 컴포넌트 - WCAG 2.1 준수
 * 계층 구조를 표현하는 트리 테이블
 */
const TreeTable = ({
  columns,
  data,
  childrenKey = 'children',
  idKey = 'id',
  expandedRows = [],
  onExpand,
  variant = 'default',
  striped = false,
  hoverable = true,
  selectable = false,
  selectedRows = [],
  onRowSelect,
  showLines = true,
  indentSize = 24,
  loading = false,
  emptyMessage = '데이터가 없습니다',
  className = '',
  ...props
}) => {
  const [internalExpandedRows, setInternalExpandedRows] = useState(expandedRows);
  const [internalSelectedRows, setInternalSelectedRows] = useState(selectedRows);

  // 베리언트별 스타일
  const variantStyles = {
    default: 'bg-white border border-gray-200',
    card: 'bg-white shadow-lg rounded-lg overflow-hidden',
    minimal: 'bg-transparent',
  };

  // 확장 상태 관리
  const isExpanded = useCallback((rowId) => {
    return internalExpandedRows.includes(rowId);
  }, [internalExpandedRows]);

  // 선택 상태 관리
  const isSelected = useCallback((rowId) => {
    return internalSelectedRows.includes(rowId);
  }, [internalSelectedRows]);

  // 확장 토글
  const handleExpand = useCallback((rowId, hasChildren) => {
    if (!hasChildren) return;

    const newExpanded = isExpanded(rowId)
      ? internalExpandedRows.filter(id => id !== rowId)
      : [...internalExpandedRows, rowId];
    
    setInternalExpandedRows(newExpanded);
    if (onExpand) onExpand(newExpanded);
  }, [internalExpandedRows, isExpanded, onExpand]);

  // 행 선택
  const handleRowSelect = useCallback((rowId) => {
    if (!selectable) return;

    const newSelected = isSelected(rowId)
      ? internalSelectedRows.filter(id => id !== rowId)
      : [...internalSelectedRows, rowId];
    
    setInternalSelectedRows(newSelected);
    if (onRowSelect) onRowSelect(newSelected);
  }, [internalSelectedRows, isSelected, selectable, onRowSelect]);

  // 모든 자식 ID 가져오기
  const getAllChildIds = useCallback((node) => {
    let ids = [node[idKey]];
    if (node[childrenKey] && node[childrenKey].length > 0) {
      node[childrenKey].forEach(child => {
        ids = [...ids, ...getAllChildIds(child)];
      });
    }
    return ids;
  }, [idKey, childrenKey]);

  // 부모와 함께 선택
  const handleSelectWithChildren = useCallback((node, checked) => {
    if (!selectable) return;

    const allIds = getAllChildIds(node);
    let newSelected;

    if (checked) {
      newSelected = [...new Set([...internalSelectedRows, ...allIds])];
    } else {
      newSelected = internalSelectedRows.filter(id => !allIds.includes(id));
    }

    setInternalSelectedRows(newSelected);
    if (onRowSelect) onRowSelect(newSelected);
  }, [selectable, getAllChildIds, internalSelectedRows, onRowSelect]);

  // 플랫 데이터 생성 (렌더링용)
  const flattenData = useMemo(() => {
    const flatten = (nodes, level = 0, parentExpanded = true) => {
      let result = [];
      
      nodes.forEach((node) => {
        const hasChildren = node[childrenKey] && node[childrenKey].length > 0;
        const expanded = isExpanded(node[idKey]);
        
        result.push({
          ...node,
          _level: level,
          _hasChildren: hasChildren,
          _expanded: expanded,
          _visible: parentExpanded,
        });

        if (hasChildren && expanded) {
          const children = flatten(node[childrenKey], level + 1, parentExpanded && expanded);
          result = [...result, ...children];
        }
      });

      return result;
    };

    return flatten(data);
  }, [data, childrenKey, idKey, isExpanded]);

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
    <div className={`${variantStyles[variant]} ${className} rounded-lg overflow-hidden`}>
      <table
        className="w-full text-sm"
        role="treegrid"
        aria-label="트리 테이블"
        {...props}
      >
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {selectable && (
              <th className="w-12 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-[#2ac1bc] focus:ring-[#2ac1bc]"
                  onChange={(e) => {
                    if (e.target.checked) {
                      const allIds = data.reduce((acc, node) => {
                        return [...acc, ...getAllChildIds(node)];
                      }, []);
                      setInternalSelectedRows(allIds);
                      if (onRowSelect) onRowSelect(allIds);
                    } else {
                      setInternalSelectedRows([]);
                      if (onRowSelect) onRowSelect([]);
                    }
                  }}
                  checked={
                    internalSelectedRows.length > 0 &&
                    internalSelectedRows.length === flattenData.filter(row => row._visible).length
                  }
                  aria-label="전체 선택"
                />
              </th>
            )}
            {columns.map((column, index) => (
              <th
                key={column.key}
                className={`
                  px-4 py-3 text-left font-semibold text-gray-900
                  ${column.width ? `w-${column.width}` : ''}
                  ${column.align === 'center' ? 'text-center' : ''}
                  ${column.align === 'right' ? 'text-right' : ''}
                  ${index === 0 ? 'min-w-[200px]' : ''}
                `}
                scope="col"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {flattenData.filter(row => row._visible).map((row, rowIndex) => {
            const selected = isSelected(row[idKey]);
            const hasChildren = row._hasChildren;
            const expanded = row._expanded;
            const level = row._level;

            return (
              <tr
                key={row[idKey]}
                className={`
                  border-b border-gray-100
                  ${hoverable ? 'hover:bg-gray-50' : ''}
                  ${striped && rowIndex % 2 === 1 ? 'bg-gray-50/50' : ''}
                  ${selected ? 'bg-[#2ac1bc]/10' : ''}
                  ${selectable ? 'cursor-pointer' : ''}
                  transition-colors duration-150
                `}
                onClick={() => handleRowSelect(row[idKey])}
                role="row"
                aria-level={level + 1}
                aria-expanded={hasChildren ? expanded : undefined}
                aria-selected={selected}
              >
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#2ac1bc] focus:ring-[#2ac1bc]"
                      checked={selected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectWithChildren(row, e.target.checked);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`행 선택: ${row[columns[0].key]}`}
                    />
                  </td>
                )}
                {columns.map((column, columnIndex) => (
                  <td
                    key={column.key}
                    className={`
                      px-4 py-3 text-gray-900
                      ${column.align === 'center' ? 'text-center' : ''}
                      ${column.align === 'right' ? 'text-right' : ''}
                    `}
                  >
                    {columnIndex === 0 ? (
                      <div 
                        className="flex items-center"
                        style={{ paddingLeft: level * indentSize }}
                      >
                        {/* 트리 라인 */}
                        {showLines && level > 0 && (
                          <div className="relative mr-2">
                            {[...Array(level)].map((_, i) => (
                              <span
                                key={i}
                                className="absolute border-l border-gray-300"
                                style={{
                                  left: i * indentSize - (level * indentSize) + 8,
                                  top: -12,
                                  bottom: rowIndex === flattenData.length - 1 ? '50%' : -12,
                                }}
                              />
                            ))}
                            <span
                              className="absolute border-b border-gray-300"
                              style={{
                                left: -16,
                                top: '50%',
                                width: 16,
                              }}
                            />
                          </div>
                        )}
                        
                        {/* 확장/축소 버튼 */}
                        {hasChildren ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExpand(row[idKey], hasChildren);
                            }}
                            className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors duration-150"
                            aria-label={expanded ? '축소' : '확장'}
                          >
                            <svg
                              className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                                expanded ? 'rotate-90' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        ) : (
                          <span className="w-6 inline-block" />
                        )}
                        
                        {/* 콘텐츠 */}
                        {column.render
                          ? column.render(row[column.key], row, rowIndex)
                          : row[column.key]}
                      </div>
                    ) : column.render ? (
                      column.render(row[column.key], row, rowIndex)
                    ) : (
                      row[column.key]
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TreeTable;