'use client';

import { useMemo } from 'react';
import { 
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import AccessibleChartWrapper, { EmptyChartState, ChartLoadingState } from './AccessibleChartWrapper';

/**
 * 원형 차트 컴포넌트 (WCAG 2.1 준수)
 * Local 테마 컬러와 다크모드 지원
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Array} props.data - 차트 데이터 [{ name, value, color? }]
 * @param {string} props.title - 차트 제목
 * @param {string} props.description - 차트 설명
 * @param {number} props.size - 차트 크기
 * @param {boolean} props.showLabels - 레이블 표시 여부
 * @param {boolean} props.showPercentage - 퍼센트 표시 여부
 * @param {Function} props.formatter - 값 포맷터 함수
 * @param {string} props.centerText - 중앙 텍스트
 * @param {boolean} props.loading - 로딩 상태
 */
const PieChart = ({
  data = [],
  title,
  description,
  size = 300,
  showLabels = true,
  showPercentage = true,
  formatter,
  centerText,
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
    '#F59E0B', // 앰버
    '#10B981', // 에메랄드
    '#F97316'  // 오렌지
  ];

  // 데이터 처리
  const processedData = useMemo(() => {
    if (!data.length) return [];

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return data.map((item, index) => ({
      ...item,
      color: item.color || defaultColors[index % defaultColors.length],
      percentage: (item.value / total) * 100
    }));
  }, [data]);

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0];
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.payload.color }}
          />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {data.name}
          </span>
        </div>
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          값: {formatter ? formatter(data.value) : data.value?.toLocaleString('vi-VN')}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          비율: {Math.round(data.payload.percentage * 100) / 100}%
        </div>
      </div>
    );
  };

  // 커스텀 레이블 렌더링 함수
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.05) return null; // 5% 미만은 레이블 숨김
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium drop-shadow-sm"
      >
        {showPercentage ? `${Math.round(percent * 100)}%` : name}
      </text>
    );
  };

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
          description="원형 차트에 표시할 데이터가 없습니다."
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
      ariaLabel={`${title || '원형 차트'} - ${data.length}개의 카테고리로 구성된 원형 그래프`}
    >
      <div className="flex flex-col items-center">
        <div className="w-full relative">
          <ResponsiveContainer width="100%" height={size}>
            <RechartsPieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={showLabels ? renderCustomLabel : false}
                outerRadius={size / 2 - 40}
                innerRadius={centerText ? size / 8 : 0}
                fill="#8884d8"
                dataKey="value"
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              
              {/* 툴팁 */}
              <Tooltip content={<CustomTooltip />} />
              
              {/* 범례 */}
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {value}
                  </span>
                )}
              />
            </RechartsPieChart>
          </ResponsiveContainer>

          {/* 중앙 텍스트 오버레이 */}
          {centerText && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white dark:bg-gray-800 rounded-full w-20 h-20 flex items-center justify-center shadow-sm">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {centerText}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 상세 범례 */}
        <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-md">
          {processedData.map((item, index) => (
            <div key={index} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatter ? formatter(item.value) : item.value?.toLocaleString('vi-VN')} 
                  ({Math.round(item.percentage * 100) / 100}%)
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 요약 정보 */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg w-full max-w-md text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            총 합계
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {formatter ? formatter(total) : total?.toLocaleString('vi-VN')}
          </div>
        </div>
      </div>
    </AccessibleChartWrapper>
  );
};

export default PieChart;