'use client';

import { useMemo } from 'react';
import AccessibleChartWrapper, { EmptyChartState, ChartLoadingState } from './AccessibleChartWrapper';

/**
 * 게이지 차트 컴포넌트 (WCAG 2.1 준수)
 * KPI 표시에 최적화된 Local 테마 컬러와 다크모드 지원
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {number} props.value - 현재 값
 * @param {number} props.min - 최솟값
 * @param {number} props.max - 최댓값
 * @param {string} props.title - 차트 제목
 * @param {string} props.description - 차트 설명
 * @param {number} props.size - 차트 크기
 * @param {string} props.unit - 단위
 * @param {Array} props.thresholds - 임계값 배열 [{ value, color, label }]
 * @param {Function} props.formatter - 값 포맷터 함수
 * @param {boolean} props.showLabels - 레이블 표시 여부
 * @param {string} props.variant - 게이지 타입 ('full' | 'half')
 * @param {boolean} props.loading - 로딩 상태
 */
const GaugeChart = ({
  value = 0,
  min = 0,
  max = 100,
  title,
  description,
  size = 200,
  unit = '',
  thresholds = [],
  formatter,
  showLabels = true,
  variant = 'half',
  loading = false,
  className = ''
}) => {
  // 기본 임계값 설정 (Local 테마)
  const defaultThresholds = [
    { value: 30, color: '#DA020E', label: '위험' },      // 빨강
    { value: 60, color: '#FFDD00', label: '주의' },      // 골드
    { value: 80, color: '#00B14F', label: '양호' },      // 그린
    { value: 100, color: '#2AC1BC', label: '우수' }     // 민트
  ];

  const processedThresholds = thresholds.length > 0 ? thresholds : defaultThresholds;

  // 값 정규화 및 각도 계산
  const normalizedValue = useMemo(() => {
    return Math.max(min, Math.min(max, value));
  }, [value, min, max]);

  const percentage = useMemo(() => {
    return ((normalizedValue - min) / (max - min)) * 100;
  }, [normalizedValue, min, max]);

  const angle = useMemo(() => {
    const totalAngle = variant === 'full' ? 360 : 180;
    return (percentage / 100) * totalAngle;
  }, [percentage, variant]);

  const startAngle = variant === 'full' ? -90 : 180;
  const endAngle = startAngle + angle;

  // 현재 값에 해당하는 상태 결정
  const currentStatus = useMemo(() => {
    const sorted = [...processedThresholds].sort((a, b) => a.value - b.value);
    for (const threshold of sorted) {
      if (percentage <= (threshold.value / max) * 100) {
        return threshold;
      }
    }
    return sorted[sorted.length - 1];
  }, [percentage, processedThresholds, max]);

  // SVG 경로 생성
  const createArcPath = (start, end, innerRadius, outerRadius) => {
    const startAngleRad = (start * Math.PI) / 180;
    const endAngleRad = (end * Math.PI) / 180;
    
    const x1 = Math.cos(startAngleRad) * outerRadius;
    const y1 = Math.sin(startAngleRad) * outerRadius;
    const x2 = Math.cos(endAngleRad) * outerRadius;
    const y2 = Math.sin(endAngleRad) * outerRadius;

    const x3 = Math.cos(endAngleRad) * innerRadius;
    const y3 = Math.sin(endAngleRad) * innerRadius;
    const x4 = Math.cos(startAngleRad) * innerRadius;
    const y4 = Math.sin(startAngleRad) * innerRadius;

    const largeArcFlag = Math.abs(end - start) > 180 ? 1 : 0;

    return `
      M ${x1} ${y1}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}
      Z
    `;
  };

  // 바늘 경로 생성
  const createNeedlePath = (angle, length) => {
    const angleRad = (angle * Math.PI) / 180;
    const x = Math.cos(angleRad) * length;
    const y = Math.sin(angleRad) * length;
    
    const baseWidth = 3;
    const perpAngle1 = angleRad + Math.PI / 2;
    const perpAngle2 = angleRad - Math.PI / 2;
    
    const x1 = Math.cos(perpAngle1) * baseWidth;
    const y1 = Math.sin(perpAngle1) * baseWidth;
    const x2 = Math.cos(perpAngle2) * baseWidth;
    const y2 = Math.sin(perpAngle2) * baseWidth;

    return `M ${x1} ${y1} L ${x} ${y} L ${x2} ${y2} Z`;
  };

  const radius = (size - 40) / 2;
  const innerRadius = radius * 0.7;
  const needleLength = radius * 0.85;

  // 테이블 데이터
  const tableData = [
    { metric: '현재 값', value: normalizedValue, unit },
    { metric: '최솟값', value: min, unit },
    { metric: '최댓값', value: max, unit },
    { metric: '진행률', value: Math.round(percentage), unit: '%' },
    { metric: '상태', value: currentStatus.label, unit: '' }
  ];

  const tableColumns = [
    { key: 'metric', header: '지표', render: (value) => value },
    { key: 'value', header: '값', render: (value, row) => `${formatter ? formatter(value) : value}${row.unit}` }
  ];

  if (loading) {
    return <ChartLoadingState height={size} />;
  }

  return (
    <AccessibleChartWrapper
      title={title}
      description={description}
      data={tableData}
      columns={tableColumns}
      className={className}
      ariaLabel={`${title || '게이지 차트'} - 현재 값: ${normalizedValue}${unit}, 상태: ${currentStatus.label}`}
    >
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg
            width={size}
            height={variant === 'full' ? size : size / 2 + 40}
            viewBox={`0 0 ${size} ${variant === 'full' ? size : size / 2 + 40}`}
            className="w-full h-full"
            role="img"
            aria-label={`${title || '게이지'} - ${normalizedValue}${unit}`}
          >
            {/* 정의 영역 */}
            <defs>
              {/* 그라데이션 */}
              <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                {processedThresholds.map((threshold, index) => (
                  <stop 
                    key={index}
                    offset={`${(threshold.value / max) * 100}%`}
                    stopColor={threshold.color}
                  />
                ))}
              </linearGradient>

              <radialGradient id="needle-gradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#374151" />
                <stop offset="100%" stopColor="#111827" />
              </radialGradient>

              {/* 드롭 섀도우 */}
              <filter id="gauge-shadow">
                <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.1"/>
              </filter>
            </defs>

            {/* 차트 중심 */}
            <g transform={`translate(${size / 2}, ${variant === 'full' ? size / 2 : size / 2})`}>
              {/* 배경 호 */}
              <path
                d={createArcPath(
                  startAngle, 
                  startAngle + (variant === 'full' ? 360 : 180), 
                  innerRadius, 
                  radius
                )}
                fill="currentColor"
                className="text-gray-200 dark:text-gray-700"
              />

              {/* 임계값 구간들 */}
              {processedThresholds.map((threshold, index) => {
                const prevValue = index > 0 ? processedThresholds[index - 1].value : 0;
                const segmentStart = startAngle + (prevValue / max) * (variant === 'full' ? 360 : 180);
                const segmentEnd = startAngle + (threshold.value / max) * (variant === 'full' ? 360 : 180);

                return (
                  <path
                    key={index}
                    d={createArcPath(segmentStart, segmentEnd, innerRadius, radius)}
                    fill={threshold.color}
                    opacity="0.3"
                    className="transition-opacity duration-200 hover:opacity-50"
                  />
                );
              })}

              {/* 진행 표시 호 */}
              <path
                d={createArcPath(startAngle, endAngle, innerRadius, radius)}
                fill="url(#gauge-gradient)"
                filter="url(#gauge-shadow)"
                className="transition-all duration-500"
              />

              {/* 바늘 */}
              <g className="transition-transform duration-500" style={{ transform: `rotate(${endAngle}deg)` }}>
                <path
                  d={createNeedlePath(0, needleLength)}
                  fill="url(#needle-gradient)"
                  filter="url(#gauge-shadow)"
                />
              </g>

              {/* 중심점 */}
              <circle
                cx="0"
                cy="0"
                r="6"
                fill="url(#needle-gradient)"
                filter="url(#gauge-shadow)"
              />

              {/* 중앙 텍스트 */}
              <g transform="translate(0, 30)">
                <text
                  x="0"
                  y="-10"
                  textAnchor="middle"
                  className="text-2xl font-bold fill-gray-900 dark:fill-white"
                >
                  {formatter ? formatter(normalizedValue) : normalizedValue}{unit}
                </text>
                <text
                  x="0"
                  y="5"
                  textAnchor="middle"
                  className="text-sm fill-gray-600 dark:fill-gray-400"
                >
                  {title}
                </text>
                <text
                  x="0"
                  y="20"
                  textAnchor="middle"
                  className="text-xs font-medium"
                  fill={currentStatus.color}
                >
                  {currentStatus.label}
                </text>
              </g>

              {/* 스케일 마크 */}
              {showLabels && Array.from({ length: 6 }, (_, i) => {
                const scaleAngle = startAngle + (i / 5) * (variant === 'full' ? 360 : 180);
                const scaleValue = min + (i / 5) * (max - min);
                const markRadius = radius + 5;
                const textRadius = radius + 20;

                const markX = Math.cos((scaleAngle * Math.PI) / 180) * markRadius;
                const markY = Math.sin((scaleAngle * Math.PI) / 180) * markRadius;
                const textX = Math.cos((scaleAngle * Math.PI) / 180) * textRadius;
                const textY = Math.sin((scaleAngle * Math.PI) / 180) * textRadius;

                return (
                  <g key={i}>
                    <line
                      x1={Math.cos((scaleAngle * Math.PI) / 180) * radius}
                      y1={Math.sin((scaleAngle * Math.PI) / 180) * radius}
                      x2={markX}
                      y2={markY}
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-600 dark:text-gray-400"
                    />
                    <text
                      x={textX}
                      y={textY + 4}
                      textAnchor="middle"
                      className="text-xs fill-gray-600 dark:fill-gray-400"
                    >
                      {Math.round(scaleValue)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* 범례 */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          {processedThresholds.map((threshold, index) => (
            <div key={index} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: threshold.color }}
              />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {threshold.label}
              </span>
            </div>
          ))}
        </div>

        {/* 상세 정보 */}
        <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg w-full max-w-xs">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">진행률</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {Math.round(percentage)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">상태</div>
              <div 
                className="text-lg font-bold"
                style={{ color: currentStatus.color }}
              >
                {currentStatus.label}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccessibleChartWrapper>
  );
};

export default GaugeChart;