'use client';

import { useMemo } from 'react';
import { 
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import AccessibleChartWrapper, { EmptyChartState, ChartLoadingState } from './AccessibleChartWrapper';

/**
 * Recharts 기반 선 차트 컴포넌트 (WCAG 2.1 준수)
 * Local App MVP에 최적화된 디자인과 접근성
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Array} props.data - 차트 데이터
 * @param {Array} props.lines - 선 설정 배열 [{ dataKey, stroke, name, strokeWidth, dot }]
 * @param {string} props.xAxisDataKey - X축 데이터 키
 * @param {string} props.title - 차트 제목
 * @param {string} props.description - 차트 설명
 * @param {number} props.height - 차트 높이
 * @param {boolean} props.showGrid - 격자 표시 여부
 * @param {boolean} props.showTooltip - 툴팁 표시 여부
 * @param {boolean} props.showLegend - 범례 표시 여부
 * @param {boolean} props.showArea - 영역 채우기 여부
 * @param {Function} props.xAxisFormatter - X축 포맷터 함수
 * @param {Function} props.yAxisFormatter - Y축 포맷터 함수
 * @param {Function} props.tooltipFormatter - 툴팁 포맷터 함수
 * @param {boolean} props.loading - 로딩 상태
 * @param {boolean} props.animate - 애니메이션 여부
 */
const LineChart = ({
  data = [],
  lines = [],
  xAxisDataKey = 'name',
  title,
  description,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  showArea = false,
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  loading = false,
  animate = true,
  className = ''
}) => {
  // Local App 테마 색상
  const vietnamThemeColors = [
    '#2AC1BC', // 민트 (Primary)
    '#00B14F', // 그린 (Secondary)
    '#FFDD00', // 골드 (Warning)
    '#DA020E', // 레드 (Error)
    '#6366F1', // 인디고
    '#EC4899', // 핑크
    '#8B5CF6', // 보라
    '#F59E0B', // 앰버
    '#10B981', // 에메랄드
    '#F97316'  // 오렌지
  ];

  // 선 설정 처리
  const processedLines = useMemo(() => {
    if (!lines.length && data.length > 0) {
      // 자동으로 선 생성 (xAxisDataKey 제외)
      const keys = Object.keys(data[0] || {}).filter(key => key !== xAxisDataKey);
      return keys.map((key, index) => ({
        dataKey: key,
        name: key,
        stroke: vietnamThemeColors[index % vietnamThemeColors.length],
        strokeWidth: 3,
        dot: { fill: vietnamThemeColors[index % vietnamThemeColors.length], r: 4 },
        activeDot: { r: 6, stroke: vietnamThemeColors[index % vietnamThemeColors.length], strokeWidth: 2 }
      }));
    }
    
    return lines.map((line, index) => ({
      dataKey: line.dataKey || line.key,
      name: line.name || line.dataKey || line.key,
      stroke: line.stroke || line.color || vietnamThemeColors[index % vietnamThemeColors.length],
      strokeWidth: line.strokeWidth || 3,
      dot: line.dot || { fill: line.stroke || line.color || vietnamThemeColors[index % vietnamThemeColors.length], r: 4 },
      activeDot: line.activeDot || { r: 6, stroke: line.stroke || line.color || vietnamThemeColors[index % vietnamThemeColors.length], strokeWidth: 2 },
      ...line
    }));
  }, [data, lines, xAxisDataKey]);

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {xAxisFormatter ? xAxisFormatter(label) : label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-300">{entry.name}:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {tooltipFormatter ? tooltipFormatter(entry.value, entry.name) : entry.value?.toLocaleString('vi-VN')}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // 커스텀 범례 컴포넌트
  const CustomLegend = (props) => {
    const { payload } = props;
    if (!payload) return null;

    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // 테이블 컬럼 설정 (접근성용)
  const tableColumns = useMemo(() => [
    { 
      key: xAxisDataKey, 
      header: 'X축', 
      render: (value) => xAxisFormatter ? xAxisFormatter(value) : value 
    },
    ...processedLines.map(line => ({
      key: line.dataKey,
      header: line.name,
      render: (value) => tooltipFormatter ? tooltipFormatter(value, line.name) : (value?.toLocaleString('vi-VN') || '-')
    }))
  ], [xAxisDataKey, processedLines, xAxisFormatter, tooltipFormatter]);

  // 색상 맵 (접근성용)
  const colorMap = useMemo(() => {
    return processedLines.reduce((map, line) => {
      map[line.name] = line.stroke;
      return map;
    }, {});
  }, [processedLines]);

  if (loading) {
    return <ChartLoadingState height={height} title="라인 차트 로딩 중..." />;
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
          description="라인 차트에 표시할 데이터가 없습니다."
        />
      </AccessibleChartWrapper>
    );
  }

  return (
    <AccessibleChartWrapper
      title={title}
      description={description}
      data={data}
      columns={tableColumns}
      colorMap={colorMap}
      className={className}
      ariaLabel={`${title || '라인 차트'} - ${processedLines.length}개의 데이터 시리즈가 있는 선형 그래프`}
    >
      <div className="w-full">
        <ResponsiveContainer width="100%" height={height}>
          <RechartsLineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            {/* 격자 */}
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                className="opacity-30 stroke-gray-400 dark:stroke-gray-600"
              />
            )}
            
            {/* X축 */}
            <XAxis 
              dataKey={xAxisDataKey}
              tickFormatter={xAxisFormatter}
              className="text-xs fill-gray-600 dark:fill-gray-400"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
              tickLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
            />
            
            {/* Y축 */}
            <YAxis 
              tickFormatter={yAxisFormatter}
              className="text-xs fill-gray-600 dark:fill-gray-400"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
              tickLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
            />
            
            {/* 툴팁 */}
            {showTooltip && (
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ 
                  stroke: '#2AC1BC', 
                  strokeWidth: 1, 
                  strokeDasharray: '5 5' 
                }}
              />
            )}
            
            {/* 범례 */}
            {showLegend && <Legend content={<CustomLegend />} />}
            
            {/* 라인들 */}
            {processedLines.map((line, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.stroke}
                strokeWidth={line.strokeWidth}
                dot={line.dot}
                activeDot={line.activeDot}
                connectNulls={false}
                animationDuration={animate ? 1500 : 0}
                animationEasing="ease-out"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            
            {/* 참조선 (0선) */}
            <ReferenceLine 
              y={0} 
              stroke="#9CA3AF" 
              strokeDasharray="2 2" 
              strokeWidth={1}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
        
        {/* 사용 안내 */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 포인트에 마우스를 올려 상세 정보를 확인하세요
        </div>
      </div>
    </AccessibleChartWrapper>
  );
};

export default LineChart;