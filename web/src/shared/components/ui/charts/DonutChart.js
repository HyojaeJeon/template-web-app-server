'use client';

import { useMemo } from 'react';
import AccessibleChartWrapper, { EmptyChartState, ChartLoadingState } from './AccessibleChartWrapper';

/**
 * 도넛 차트 컴포넌트 (WCAG 2.1 준수)
 * Local 테마 컬러와 다크모드 지원
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Array} props.data - 차트 데이터 [{ name, value, color? }]
 * @param {string} props.title - 차트 제목
 * @param {string} props.description - 차트 설명
 * @param {number} props.size - 차트 크기
 * @param {number} props.innerRadius - 내부 반지름 (0-1 비율)
 * @param {boolean} props.showLabels - 레이블 표시 여부
 * @param {Object} props.centerContent - 중앙 콘텐츠 { value, label, subLabel }
 * @param {Function} props.formatter - 값 포맷터 함수
 * @param {boolean} props.loading - 로딩 상태
 */
const DonutChart = ({
  data = [],
  title,
  description,
  size = 280,
  innerRadius = 0.6,
  showLabels = true,
  centerContent,
  formatter,
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

  // 데이터 처리
  const processedData = useMemo(() => {
    if (!data.length) return [];

    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    return data.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const startAngle = currentAngle;
      const endAngle = currentAngle + (item.value / total) * 2 * Math.PI;
      currentAngle = endAngle;

      return {
        ...item,
        color: item.color || defaultColors[index % defaultColors.length],
        percentage,
        startAngle,
        endAngle
      };
    });
  }, [data]);

  // SVG 호 경로 생성
  const createArcPath = (startAngle, endAngle, innerR, outerR) => {
    const startAngleAdjusted = startAngle - Math.PI / 2; // 12시 방향부터 시작
    const endAngleAdjusted = endAngle - Math.PI / 2;
    
    const x1 = Math.cos(startAngleAdjusted) * outerR;
    const y1 = Math.sin(startAngleAdjusted) * outerR;
    const x2 = Math.cos(endAngleAdjusted) * outerR;
    const y2 = Math.sin(endAngleAdjusted) * outerR;

    const x3 = Math.cos(endAngleAdjusted) * innerR;
    const y3 = Math.sin(endAngleAdjusted) * innerR;
    const x4 = Math.cos(startAngleAdjusted) * innerR;
    const y4 = Math.sin(startAngleAdjusted) * innerR;

    const largeArcFlag = endAngleAdjusted - startAngleAdjusted > Math.PI ? 1 : 0;

    return `
      M ${x1} ${y1}
      A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x4} ${y4}
      Z
    `;
  };

  // 레이블 위치 계산
  const getLabelPosition = (startAngle, endAngle, radius) => {
    const angle = (startAngle + endAngle) / 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return { x, y };
  };

  const outerRadius = size / 2 - 30;
  const innerR = outerRadius * innerRadius;

  // 테이블 컬럼 설정
  const tableColumns = useMemo(() => [
    { key: 'name', header: '항목', render: (value) => value },
    { key: 'value', header: '값', render: (value) => formatter ? formatter(value) : value },
    { 
      key: 'percentage', 
      header: '비율', 
      render: (value, row) => `${Math.round(row.percentage * 100) / 100}%`
    }
  ], [formatter]);

  // 색상 맵
  const colorMap = useMemo(() => {
    return processedData.reduce((map, item) => {
      map[item.name] = item.color;
      return map;
    }, {});
  }, [processedData]);

  // 총합 계산
  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  if (loading) {
    return <ChartLoadingState height={size} />;
  }

  if (!data.length) {
    return (
      <AccessibleChartWrapper
        title={title}
        description={description}
        className={className}
      >
        <EmptyChartState 
          title="데이터가 없습니다"
          description="도넛 차트에 표시할 데이터가 없습니다."
        />
      </AccessibleChartWrapper>
    );
  }

  return (
    <AccessibleChartWrapper
      title={title}
      description={description}
      data={processedData}
      columns={tableColumns}
      colorMap={colorMap}
      className={className}
      ariaLabel={`${title || '도넛 차트'} - ${data.length}개의 카테고리로 구성된 도넛형 그래프`}
    >
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="w-full h-full"
            role="img"
            aria-label={title || '도넛 차트'}
          >
            {/* 정의 영역 */}
            <defs>
              {/* 그라데이션 */}
              {processedData.map((item, index) => (
                <linearGradient 
                  key={index} 
                  id={`donut-gradient-${index}`}
                  x1="0%" y1="0%" x2="100%" y2="100%"
                >
                  <stop offset="0%" stopColor={item.color} stopOpacity="1" />
                  <stop offset="100%" stopColor={item.color} stopOpacity="0.8" />
                </linearGradient>
              ))}

              {/* 드롭 섀도우 */}
              <filter id="donut-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.1"/>
              </filter>
            </defs>

            {/* 차트 중심을 화면 중앙으로 이동 */}
            <g transform={`translate(${size / 2}, ${size / 2})`}>
              {/* 배경 원 */}
              <circle
                cx="0"
                cy="0"
                r={outerRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-100 dark:text-gray-800"
              />

              {/* 도넛 조각들 */}
              {processedData.map((item, index) => (
                <g key={index}>
                  <path
                    d={createArcPath(item.startAngle, item.endAngle, innerR, outerRadius)}
                    fill={`url(#donut-gradient-${index})`}
                    stroke="white"
                    strokeWidth="2"
                    filter="url(#donut-shadow)"
                    className="hover:opacity-80 transition-all duration-200 cursor-pointer transform-origin-center hover:scale-105"
                    role="button"
                    tabIndex="0"
                    aria-label={`${item.name}: ${formatter ? formatter(item.value) : item.value} (${Math.round(item.percentage * 100) / 100}%)`}
                  />

                  {/* 라벨 */}
                  {showLabels && item.percentage >= 8 && (
                    <g>
                      {(() => {
                        const labelPos = getLabelPosition(item.startAngle, item.endAngle, (outerRadius + innerR) / 2);
                        return (
                          <>
                            <text
                              x={labelPos.x}
                              y={labelPos.y - 3}
                              textAnchor="middle"
                              className="text-xs font-medium fill-white pointer-events-none"
                            >
                              {item.name}
                            </text>
                            <text
                              x={labelPos.x}
                              y={labelPos.y + 8}
                              textAnchor="middle"
                              className="text-xs fill-white/80 pointer-events-none"
                            >
                              {Math.round(item.percentage)}%
                            </text>
                          </>
                        );
                      })()}
                    </g>
                  )}
                </g>
              ))}

              {/* 중앙 콘텐츠 */}
              <g>
                <circle
                  cx="0"
                  cy="0"
                  r={innerR}
                  fill="white"
                  stroke="none"
                  className="dark:fill-gray-800"
                />
                
                {centerContent ? (
                  <g>
                    <text
                      x="0"
                      y="-8"
                      textAnchor="middle"
                      className="text-2xl font-bold fill-gray-900 dark:fill-white"
                    >
                      {centerContent.value}
                    </text>
                    <text
                      x="0"
                      y="6"
                      textAnchor="middle"
                      className="text-sm fill-gray-600 dark:fill-gray-400"
                    >
                      {centerContent.label}
                    </text>
                    {centerContent.subLabel && (
                      <text
                        x="0"
                        y="18"
                        textAnchor="middle"
                        className="text-xs fill-gray-500 dark:fill-gray-500"
                      >
                        {centerContent.subLabel}
                      </text>
                    )}
                  </g>
                ) : (
                  <g>
                    <text
                      x="0"
                      y="-2"
                      textAnchor="middle"
                      className="text-xl font-bold fill-gray-900 dark:fill-white"
                    >
                      {formatter ? formatter(total) : total}
                    </text>
                    <text
                      x="0"
                      y="12"
                      textAnchor="middle"
                      className="text-sm fill-gray-600 dark:fill-gray-400"
                    >
                      총계
                    </text>
                  </g>
                )}
              </g>
            </g>
          </svg>
        </div>

        {/* 범례 */}
        <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-sm">
          {processedData.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0 border border-white shadow-sm"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {item.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(item.percentage * 10) / 10}%
                </div>
              </div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-right">
                {formatter ? formatter(item.value) : item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AccessibleChartWrapper>
  );
};

export default DonutChart;