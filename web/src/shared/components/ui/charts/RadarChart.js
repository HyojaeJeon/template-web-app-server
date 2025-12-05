'use client';

import { useMemo } from 'react';
import AccessibleChartWrapper, { ChartLegend, EmptyChartState, ChartLoadingState } from './AccessibleChartWrapper';

/**
 * 방사형(레이더) 차트 컴포넌트 (WCAG 2.1 준수)
 * 다차원 데이터의 시각적 비교를 위한 방사형 차트
 * Local 테마 컬러와 다크모드 지원
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Array} props.data - 차트 데이터 [{ category, series1, series2, ... }]
 * @param {Array} props.series - 시리즈 설정 배열 [{ key, color, name, fillOpacity? }]
 * @param {string} props.categoryKey - 카테고리 데이터 키 (축 레이블)
 * @param {string} props.title - 차트 제목
 * @param {string} props.description - 차트 설명
 * @param {number} props.size - 차트 크기 (지름)
 * @param {boolean} props.showGrid - 격자 표시 여부
 * @param {boolean} props.showTooltip - 툴팁 표시 여부  
 * @param {boolean} props.showLegend - 범례 표시 여부
 * @param {boolean} props.showLabels - 축 레이블 표시 여부
 * @param {Function} props.formatter - 값 포맷터 함수
 * @param {number} props.gridLevels - 격자 레벨 수 (기본 5)
 * @param {number} props.maxValue - 최대값 (자동 계산 또는 수동 설정)
 * @param {boolean} props.loading - 로딩 상태
 */
const RadarChart = ({
  data = [],
  series = [],
  categoryKey = 'category',
  title,
  description,
  size = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  showLabels = true,
  formatter,
  gridLevels = 5,
  maxValue,
  loading = false,
  className = ''
}) => {
  // 기본 Local 테마 색상
  const defaultColors = [
    '#2AC1BC', // 민트
    '#00B14F', // 그린
    '#FFDD00', // 골드
    '#DA020E', // 레드
    '#6366F1', // 인디고
    '#EC4899', // 핑크
    '#8B5CF6', // 보라
    '#F59E0B'  // 앰버
  ];

  // 시리즈 설정 처리
  const processedSeries = useMemo(() => {
    if (!series.length && data.length > 0) {
      const keys = Object.keys(data[0] || {}).filter(key => key !== categoryKey);
      return keys.map((key, index) => ({
        key,
        name: key,
        color: defaultColors[index % defaultColors.length],
        fillOpacity: 0.2,
        strokeWidth: 2
      }));
    }
    
    return series.map((s, index) => ({
      ...s,
      color: s.color || defaultColors[index % defaultColors.length],
      fillOpacity: s.fillOpacity || 0.2,
      strokeWidth: s.strokeWidth || 2
    }));
  }, [data, series, categoryKey]);

  // 차트 데이터 처리 및 스케일링
  const chartData = useMemo(() => {
    if (!data.length || !processedSeries.length) return null;

    const categories = data.map(d => d[categoryKey]);
    const categoryCount = categories.length;
    
    if (categoryCount === 0) return null;

    // 최대값 계산 (설정값이 있으면 사용, 없으면 자동 계산)
    let calculatedMaxValue = maxValue;
    if (!calculatedMaxValue) {
      const allValues = processedSeries.flatMap(s => 
        data.map(d => d[s.key] || 0)
      );
      calculatedMaxValue = Math.max(...allValues, 1) * 1.1; // 10% 패딩
    }

    const center = size / 2;
    const radius = (size - 100) / 2; // 여백 고려

    // 각도 계산 (12시 방향부터 시작)
    const angleStep = (2 * Math.PI) / categoryCount;
    
    // 카테고리별 좌표 계산
    const categoryPositions = categories.map((category, index) => {
      const angle = index * angleStep - Math.PI / 2; // -90도 오프셋 (12시 방향)
      return {
        category,
        angle,
        labelX: center + Math.cos(angle) * (radius + 30),
        labelY: center + Math.sin(angle) * (radius + 30)
      };
    });

    // 시리즈별 데이터 포인트 계산
    const seriesData = processedSeries.map(s => {
      const points = data.map((item, index) => {
        const value = item[s.key] || 0;
        const scaledValue = (value / calculatedMaxValue) * radius;
        const angle = index * angleStep - Math.PI / 2;
        
        return {
          x: center + Math.cos(angle) * scaledValue,
          y: center + Math.sin(angle) * scaledValue,
          value,
          originalValue: value,
          category: item[categoryKey],
          angle,
          scaledValue
        };
      });

      // 폴리곤 경로 생성
      const pathD = points.length > 0 
        ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`
        : '';

      return {
        ...s,
        points,
        pathD
      };
    });

    return {
      categories: categoryPositions,
      series: seriesData,
      maxValue: calculatedMaxValue,
      center,
      radius,
      angleStep
    };
  }, [data, processedSeries, categoryKey, maxValue, size]);

  // 격자 링 생성
  const gridRings = useMemo(() => {
    if (!chartData || !showGrid) return [];
    
    const { center, radius, maxValue } = chartData;
    
    return Array.from({ length: gridLevels }, (_, i) => {
      const level = i + 1;
      const ringRadius = (radius / gridLevels) * level;
      const value = (maxValue / gridLevels) * level;
      
      return {
        radius: ringRadius,
        value,
        cx: center,
        cy: center
      };
    });
  }, [chartData, showGrid, gridLevels]);

  // 격자 선 생성
  const gridLines = useMemo(() => {
    if (!chartData || !showGrid) return [];
    
    const { center, radius, categories } = chartData;
    
    return categories.map(cat => ({
      x1: center,
      y1: center,
      x2: center + Math.cos(cat.angle) * radius,
      y2: center + Math.sin(cat.angle) * radius
    }));
  }, [chartData, showGrid]);

  // 테이블 컬럼 설정
  const tableColumns = useMemo(() => [
    { key: categoryKey, header: '카테고리', render: (value) => value },
    ...processedSeries.map(s => ({
      key: s.key,
      header: s.name,
      render: (value) => formatter ? formatter(value) : value
    }))
  ], [categoryKey, processedSeries, formatter]);

  // 색상 맵
  const colorMap = useMemo(() => {
    return processedSeries.reduce((map, s) => {
      map[s.name] = s.color;
      return map;
    }, {});
  }, [processedSeries]);

  if (loading) {
    return <ChartLoadingState height={size + 100} />;
  }

  if (!data.length || !chartData) {
    return (
      <AccessibleChartWrapper
        title={title}
        description={description}
        className={className}
      >
        <EmptyChartState 
          title="데이터가 없습니다"
          description="방사형 차트에 표시할 데이터가 없습니다."
        />
      </AccessibleChartWrapper>
    );
  }

  const { categories, series: chartSeries, maxValue: chartMaxValue } = chartData;

  return (
    <AccessibleChartWrapper
      title={title}
      description={description}
      data={data}
      columns={tableColumns}
      colorMap={colorMap}
      className={className}
      ariaLabel={`${title || '방사형 차트'} - ${categories.length}개의 카테고리와 ${chartSeries.length}개의 시리즈가 있는 방사형 그래프`}
    >
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="w-full h-full"
            role="img"
            aria-label={title || '방사형 차트'}
          >
            {/* 정의 영역 */}
            <defs>
              {/* 그라데이션 */}
              {chartSeries.map((s, index) => (
                <radialGradient key={index} id={`radar-gradient-${index}`} cx="50%" cy="50%">
                  <stop offset="0%" stopColor={s.color} stopOpacity={s.fillOpacity * 1.5} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={s.fillOpacity * 0.5} />
                </radialGradient>
              ))}

              {/* 드롭 섀도우 */}
              <filter id="radar-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="1" dy="1" stdDeviation="2" floodOpacity="0.1"/>
              </filter>
            </defs>

            {/* 격자 시스템 */}
            {showGrid && (
              <g className="opacity-40">
                {/* 격자 링 */}
                {gridRings.map((ring, index) => (
                  <g key={`ring-${index}`}>
                    <circle
                      cx={ring.cx}
                      cy={ring.cy}
                      r={ring.radius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-gray-300 dark:text-gray-600"
                    />
                    {/* 값 레이블 */}
                    <text
                      x={ring.cx + 5}
                      y={ring.cy - ring.radius - 5}
                      className="text-xs fill-gray-500 dark:fill-gray-400"
                      textAnchor="middle"
                    >
                      {formatter ? formatter(ring.value) : Math.round(ring.value)}
                    </text>
                  </g>
                ))}

                {/* 격자 선 */}
                {gridLines.map((line, index) => (
                  <line
                    key={`line-${index}`}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-gray-300 dark:text-gray-600"
                  />
                ))}
              </g>
            )}

            {/* 데이터 시리즈 */}
            {chartSeries.map((s, seriesIndex) => (
              <g key={seriesIndex}>
                {/* 영역 채우기 */}
                <path
                  d={s.pathD}
                  fill={`url(#radar-gradient-${seriesIndex})`}
                  stroke={s.color}
                  strokeWidth={s.strokeWidth}
                  strokeLinejoin="round"
                  filter="url(#radar-shadow)"
                  className="transition-opacity duration-200 hover:opacity-80"
                />

                {/* 데이터 포인트 */}
                {s.points.map((point, pointIndex) => (
                  <circle
                    key={pointIndex}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill={s.color}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer hover:r-6 transition-all duration-200 drop-shadow-sm"
                    role="button"
                    tabIndex="0"
                    aria-label={`${s.name} - ${point.category}: ${formatter ? formatter(point.originalValue) : point.originalValue}`}
                  />
                ))}
              </g>
            ))}

            {/* 카테고리 레이블 */}
            {showLabels && categories.map((cat, index) => (
              <g key={index}>
                {/* 레이블 배경 */}
                <rect
                  x={cat.labelX - 30}
                  y={cat.labelY - 12}
                  width="60"
                  height="24"
                  rx="12"
                  fill="white"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-gray-200 dark:text-gray-700 dark:fill-gray-800 drop-shadow-sm"
                />
                
                {/* 레이블 텍스트 */}
                <text
                  x={cat.labelX}
                  y={cat.labelY + 4}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-700 dark:fill-gray-300"
                >
                  {cat.category}
                </text>
              </g>
            ))}

            {/* 중앙점 */}
            <circle
              cx={chartData.center}
              cy={chartData.center}
              r="3"
              fill="currentColor"
              className="text-gray-400 dark:text-gray-600"
            />
          </svg>
        </div>

        {/* 범례 */}
        {showLegend && (
          <div className="mt-6">
            <ChartLegend 
              payload={chartSeries.map(s => ({
                value: s.name,
                color: s.color
              }))}
              horizontal={true}
            />
          </div>
        )}

        {/* 통계 정보 */}
        {chartSeries.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg w-full max-w-md">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              통계 요약
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">카테고리 수:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {categories.length}개
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">최대값:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatter ? formatter(chartMaxValue) : Math.round(chartMaxValue)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">시리즈 수:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {chartSeries.length}개
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AccessibleChartWrapper>
  );
};

export default RadarChart;