'use client';

import { useMemo } from 'react';
import { 
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import AccessibleChartWrapper, { EmptyChartState, ChartLoadingState } from './AccessibleChartWrapper';

/**
 * Recharts 기반 막대 차트 컴포넌트 (WCAG 2.1 준수)
 * Local App MVP에 최적화된 디자인과 접근성
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Array} props.data - 차트 데이터
 * @param {Array} props.bars - 막대 설정 배열 [{ dataKey, fill, name }]
 * @param {string} props.xAxisDataKey - X축 데이터 키
 * @param {string} props.title - 차트 제목
 * @param {string} props.description - 차트 설명
 * @param {number} props.height - 차트 높이
 * @param {boolean} props.horizontal - 수평 막대 차트 여부
 * @param {boolean} props.stacked - 스택형 차트 여부
 * @param {boolean} props.showGrid - 격자 표시 여부
 * @param {boolean} props.showTooltip - 툴팁 표시 여부
 * @param {boolean} props.showLegend - 범례 표시 여부
 * @param {Function} props.xAxisFormatter - X축 포맷터 함수
 * @param {Function} props.yAxisFormatter - Y축 포맷터 함수
 * @param {Function} props.tooltipFormatter - 툴팁 포맷터 함수
 * @param {boolean} props.loading - 로딩 상태
 * @param {boolean} props.animate - 애니메이션 여부
 */
const BarChart = ({
  data = [],
  bars = [],
  xAxisDataKey = 'name',
  title,
  description,
  height = 300,
  horizontal = false,
  stacked = false,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
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

  // 막대 설정 처리
  const processedBars = useMemo(() => {
    if (!bars.length && data.length > 0) {
      // 자동으로 막대 생성 (xAxisDataKey 제외)
      const keys = Object.keys(data[0] || {}).filter(key => key !== xAxisDataKey);
      return keys.map((key, index) => ({
        dataKey: key,
        name: key,
        fill: vietnamThemeColors[index % vietnamThemeColors.length],
        radius: [2, 2, 0, 0] // 둥근 모서리
      }));
    }
    
    return bars.map((bar, index) => ({
      dataKey: bar.dataKey || bar.key,
      name: bar.name || bar.dataKey || bar.key,
      fill: bar.fill || bar.color || vietnamThemeColors[index % vietnamThemeColors.length],
      radius: bar.radius || [2, 2, 0, 0],
      ...bar
    }));
  }, [data, bars, xAxisDataKey]);

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
              className="w-3 h-3 rounded-sm" 
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
              className="w-3 h-3 rounded-sm" 
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
    ...processedBars.map(bar => ({
      key: bar.dataKey,
      header: bar.name,
      render: (value) => tooltipFormatter ? tooltipFormatter(value, bar.name) : (value?.toLocaleString('vi-VN') || '-')
    }))
  ], [xAxisDataKey, processedBars, xAxisFormatter, tooltipFormatter]);

  // 색상 맵 (접근성용)
  const colorMap = useMemo(() => {
    return processedBars.reduce((map, bar) => {
      map[bar.name] = bar.fill;
      return map;
    }, {});
  }, [processedBars]);


  if (loading) {
    return <ChartLoadingState height={height} title="막대 차트 로딩 중..." />;
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
          description="막대 차트에 표시할 데이터가 없습니다."
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
      ariaLabel={`${title || '막대 차트'} - ${processedBars.length}개의 데이터 시리즈가 있는 ${horizontal ? '수평' : '수직'} 막대 그래프`}
    >
      <div className="w-full">
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart
            data={data}
            layout={horizontal ? 'verticalLayout' : undefined}
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
              dataKey={horizontal ? undefined : xAxisDataKey}
              type={horizontal ? 'number' : 'category'}
              tickFormatter={horizontal ? yAxisFormatter : xAxisFormatter}
              className="text-xs fill-gray-600 dark:fill-gray-400"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
              tickLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
            />
            
            {/* Y축 */}
            <YAxis 
              dataKey={horizontal ? xAxisDataKey : undefined}
              type={horizontal ? 'category' : 'number'}
              tickFormatter={horizontal ? xAxisFormatter : yAxisFormatter}
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
                  fill: 'rgba(42, 193, 188, 0.1)',
                  stroke: '#2AC1BC',
                  strokeWidth: 1
                }}
              />
            )}
            
            {/* 범례 */}
            {showLegend && <Legend content={<CustomLegend />} />}
            
            {/* 막대들 */}
            {processedBars.map((bar, index) => (
              <Bar
                key={index}
                dataKey={bar.dataKey}
                name={bar.name}
                fill={bar.fill}
                radius={bar.radius}
                stackId={stacked ? 'stack' : undefined}
                animationDuration={animate ? 1500 : 0}
                animationEasing="ease-out"
              >
                {/* 각 막대에 개별 색상 적용 */}
                {data.map((entry, entryIndex) => (
                  <Cell 
                    key={`cell-${entryIndex}`} 
                    fill={bar.fill}
                    stroke={bar.fill}
                    strokeWidth={1}
                  />
                ))}
              </Bar>
            ))}
            
            {/* 참조선 (0선) */}
            <ReferenceLine 
              x={horizontal ? 0 : undefined}
              y={horizontal ? undefined : 0}
              stroke="#9CA3AF" 
              strokeDasharray="2 2" 
              strokeWidth={1}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
        
        {/* 사용 안내 */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 막대에 마우스를 올려 상세 정보를 확인하세요
        </div>
      </div>
    </AccessibleChartWrapper>
  );
};

export default BarChart;