/**
 * @fileoverview 트리맵 차트 컴포넌트 - WCAG 2.1 준수
 * 계층적 데이터 시각화용 트리맵 차트 컴포넌트
 * Local App 테마 색상 및 접근성 지원
 * 
 * @version 1.0.0
 * @author DeliveryVN Team
 */

'use client';

import React, { useId, useMemo } from 'react';
import AccessibleChartWrapper from './AccessibleChartWrapper';

/**
 * 트리맵 차트 컴포넌트
 * @param {Object} props
 * @param {Array} props.data - 트리맵 데이터 배열 [{name, value, children}]
 * @param {string} [props.title] - 차트 제목
 * @param {string} [props.description] - 차트 설명
 * @param {number} [props.width=600] - 차트 너비
 * @param {number} [props.height=400] - 차트 높이
 * @param {Object} [props.colors] - 차트 색상 설정
 * @param {Array} [props.categoryColors] - 카테고리별 색상
 * @param {boolean} [props.showDataTable] - 데이터 테이블 표시 여부
 * @param {Function} [props.onRectClick] - 사각형 클릭 핸들러
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {string} [props.ariaLabel] - 접근성 레이블
 * @returns {JSX.Element}
 */
const TreemapChart = ({
  data = [],
  title = '',
  description = '',
  width = 600,
  height = 400,
  colors = {
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    border: '#e2e8f0',
    text: '#334155',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
  },
  categoryColors = [
    '#2AC1BC', // 민트
    '#00B14F', // 그린
    '#FFDD00', // 골드
    '#DA020E', // 레드
    '#6366f1', // 인디고
    '#8b5cf6', // 바이올렛
    '#06b6d4', // 시안
    '#f59e0b'  // 앰버
  ],
  showDataTable = true,
  onRectClick,
  className = '',
  ariaLabel,
  ...props
}) => {
  const chartId = useId();
  
  // 차트 여백 설정
  const margin = { top: 40, right: 20, bottom: 20, left: 20 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // 트리맵 레이아웃 계산 (Squarified Treemap Algorithm)
  const processedData = useMemo(() => {
    if (!data.length) return [];

    // 데이터 정규화 및 총합 계산
    const normalizedData = data.map((item, index) => ({
      ...item,
      value: Math.max(0, item.value || 0),
      id: index,
      color: categoryColors[index % categoryColors.length]
    }));

    const totalValue = normalizedData.reduce((sum, item) => sum + item.value, 0);
    
    if (totalValue === 0) return [];

    // Squarified treemap 알고리즘 구현
    const squarify = (items, x = 0, y = 0, width = chartWidth, height = chartHeight) => {
      if (!items.length) return [];
      
      if (items.length === 1) {
        return [{
          ...items[0],
          x, y, width, height,
          area: width * height
        }];
      }

      const area = width * height;
      const sortedItems = items.sort((a, b) => b.value - a.value);
      
      // 가장 좋은 분할점 찾기
      let bestRatio = Infinity;
      let bestSplit = 1;
      
      for (let i = 1; i <= sortedItems.length; i++) {
        const leftItems = sortedItems.slice(0, i);
        const leftSum = leftItems.reduce((sum, item) => sum + item.value, 0);
        const leftRatio = leftSum / totalValue;
        
        let leftWidth, leftHeight;
        if (width >= height) {
          leftWidth = width * leftRatio;
          leftHeight = height;
        } else {
          leftWidth = width;
          leftHeight = height * leftRatio;
        }
        
        // 종횡비 계산
        const ratios = leftItems.map(item => {
          const itemRatio = item.value / leftSum;
          let itemWidth, itemHeight;
          
          if (width >= height) {
            itemWidth = leftWidth;
            itemHeight = leftHeight * itemRatio;
          } else {
            itemWidth = leftWidth * itemRatio;
            itemHeight = leftHeight;
          }
          
          return Math.max(itemWidth / itemHeight, itemHeight / itemWidth);
        });
        
        const maxRatio = Math.max(...ratios);
        if (maxRatio < bestRatio) {
          bestRatio = maxRatio;
          bestSplit = i;
        }
      }
      
      const leftItems = sortedItems.slice(0, bestSplit);
      const rightItems = sortedItems.slice(bestSplit);
      const leftSum = leftItems.reduce((sum, item) => sum + item.value, 0);
      const leftRatio = leftSum / totalValue;
      
      let leftX = x, leftY = y, leftWidth, leftHeight;
      let rightX, rightY, rightWidth, rightHeight;
      
      if (width >= height) {
        leftWidth = width * leftRatio;
        leftHeight = height;
        rightX = x + leftWidth;
        rightY = y;
        rightWidth = width - leftWidth;
        rightHeight = height;
      } else {
        leftWidth = width;
        leftHeight = height * leftRatio;
        rightX = x;
        rightY = y + leftHeight;
        rightWidth = width;
        rightHeight = height - leftHeight;
      }
      
      // 재귀적으로 분할
      const leftResult = leftItems.length === 1 ? 
        [{...leftItems[0], x: leftX, y: leftY, width: leftWidth, height: leftHeight, area: leftWidth * leftHeight}] :
        squarify(leftItems, leftX, leftY, leftWidth, leftHeight);
        
      const rightResult = rightItems.length === 0 ? [] :
        rightItems.length === 1 ? 
        [{...rightItems[0], x: rightX, y: rightY, width: rightWidth, height: rightHeight, area: rightWidth * rightHeight}] :
        squarify(rightItems, rightX, rightY, rightWidth, rightHeight);
      
      return [...leftResult, ...rightResult];
    };

    return squarify(normalizedData);
  }, [data, chartWidth, chartHeight, categoryColors]);

  // 데이터 테이블용 컬럼 정의
  const tableColumns = [
    { key: 'name', label: '이름', type: 'text' },
    { key: 'value', label: '값', type: 'number' },
    { key: 'percentage', label: '비율', type: 'percentage' }
  ];

  // 데이터 테이블용 데이터 변환
  const tableData = useMemo(() => {
    const totalValue = processedData.reduce((sum, item) => sum + item.value, 0);
    return processedData.map(item => ({
      ...item,
      percentage: totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0'
    }));
  }, [processedData]);

  // 텍스트가 사각형 안에 들어갈지 확인
  const shouldShowLabel = (rect) => {
    return rect.width > 60 && rect.height > 30;
  };

  const chartContent = (
    <div className={`relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`${chartId}-title ${chartId}-desc`}
        className="overflow-visible"
        style={{ background: colors.background }}
        {...props}
      >
        {/* 제목 */}
        {title && (
          <text
            id={`${chartId}-title`}
            x={width / 2}
            y={20}
            textAnchor="middle"
            className="fill-gray-900 dark:fill-gray-100 text-lg font-semibold"
          >
            {title}
          </text>
        )}

        {/* 차트 영역 */}
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* 트리맵 사각형 렌더링 */}
          {processedData.map((rect, index) => {
            const showLabel = shouldShowLabel(rect);
            const textColor = rect.color === '#FFDD00' ? '#000000' : '#ffffff';
            const totalValue = processedData.reduce((sum, item) => sum + item.value, 0);
            const percentage = totalValue > 0 ? ((rect.value / totalValue) * 100).toFixed(1) : '0';

            return (
              <g key={rect.id || index}>
                {/* 사각형 */}
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  fill={rect.color}
                  stroke={colors.border}
                  strokeWidth="2"
                  role="graphics-symbol"
                  aria-label={`${rect.name}: ${rect.value} (${percentage}%)`}
                  onClick={() => onRectClick?.(rect, index)}
                  className={`
                    hover:brightness-110 focus:brightness-110
                    focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50
                    transition-all duration-200
                    ${onRectClick ? 'cursor-pointer' : ''}
                  `}
                  tabIndex={onRectClick ? 0 : -1}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && onRectClick) {
                      e.preventDefault();
                      onRectClick(rect, index);
                    }
                  }}
                />

                {/* 레이블 */}
                {showLabel && (
                  <g>
                    {/* 이름 */}
                    <text
                      x={rect.x + rect.width / 2}
                      y={rect.y + rect.height / 2 - 8}
                      textAnchor="middle"
                      className="pointer-events-none text-sm font-semibold"
                      fill={textColor}
                    >
                      {rect.name}
                    </text>
                    
                    {/* 값과 비율 */}
                    <text
                      x={rect.x + rect.width / 2}
                      y={rect.y + rect.height / 2 + 8}
                      textAnchor="middle"
                      className="pointer-events-none text-xs"
                      fill={textColor}
                      fillOpacity="0.9"
                    >
                      {rect.value} ({percentage}%)
                    </text>
                  </g>
                )}

                {/* 작은 사각형용 외부 레이블 */}
                {!showLabel && rect.width > 20 && rect.height > 20 && (
                  <text
                    x={rect.x + rect.width / 2}
                    y={rect.y - 5}
                    textAnchor="middle"
                    className="fill-gray-700 dark:fill-gray-300 text-xs font-medium pointer-events-none"
                  >
                    {rect.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* 범례 (사각형이 작아서 레이블이 안 보이는 경우) */}
        {processedData.some(rect => !shouldShowLabel(rect)) && (
          <g transform={`translate(20, ${height - 100})`}>
            <rect
              x={-10}
              y={-10}
              width={Math.min(200, width - 40)}
              height={80}
              fill="white"
              fillOpacity="0.95"
              stroke={colors.border}
              strokeWidth="1"
              rx="4"
            />
            <text
              x={0}
              y={0}
              className="fill-gray-700 dark:fill-gray-300 text-sm font-semibold"
            >
              작은 항목들:
            </text>
            {processedData
              .filter(rect => !shouldShowLabel(rect))
              .slice(0, 3)
              .map((rect, index) => (
                <g key={`legend-${index}`} transform={`translate(0, ${(index + 1) * 16})`}>
                  <rect x={0} y={-8} width={12} height={12} fill={rect.color} />
                  <text
                    x={18}
                    y={2}
                    className="fill-gray-600 dark:fill-gray-400 text-xs"
                  >
                    {rect.name}: {rect.value}
                  </text>
                </g>
              ))}
            {processedData.filter(rect => !shouldShowLabel(rect)).length > 3 && (
              <text
                x={0}
                y={64}
                className="fill-gray-500 dark:fill-gray-500 text-xs"
              >
                ...기타 {processedData.filter(rect => !shouldShowLabel(rect)).length - 3}개 항목
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );

  return (
    <AccessibleChartWrapper
      title={title}
      description={description || '트리맵 차트: 계층적 데이터를 중첩된 사각형으로 표현하는 차트'}
      data={tableData}
      columns={tableColumns}
      showDataTable={showDataTable}
      ariaLabel={ariaLabel || `${title} 트리맵 차트`}
      colorMap={
        processedData.reduce((acc, item) => {
          acc[item.name] = item.name;
          return acc;
        }, {})
      }
    >
      {chartContent}
    </AccessibleChartWrapper>
  );
};

export default TreemapChart;