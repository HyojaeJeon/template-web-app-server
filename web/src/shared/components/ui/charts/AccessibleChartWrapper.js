'use client';

import { useState } from 'react';
import { EyeOff, Table, BarChart3 } from 'lucide-react';

/**
 * 접근성 차트 래퍼 컴포넌트 (WCAG 2.1 준수)
 * 모든 차트 컴포넌트의 기본 래퍼로 사용
 * Local 테마 컬러와 다크모드 지원
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {React.ReactNode} props.children - 차트 컴포넌트
 * @param {string} props.title - 차트 제목
 * @param {string} props.description - 차트 설명
 * @param {Array} props.data - 차트 데이터 (테이블 대체용)
 * @param {Array} props.columns - 테이블 컬럼 정보
 * @param {boolean} props.showDataTable - 데이터 테이블 표시 여부
 * @param {string} props.ariaLabel - ARIA 레이블
 * @param {Function} props.onDataTableToggle - 데이터 테이블 토글 핸들러
 * @param {Object} props.colorMap - 색상 매핑 정보 (색맹 지원용)
 */
const AccessibleChartWrapper = ({
  children,
  title,
  description,
  data = [],
  columns = [],
  showDataTable = false,
  ariaLabel,
  onDataTableToggle,
  colorMap = {},
  className = ''
}) => {
  const [isDataTableVisible, setIsDataTableVisible] = useState(showDataTable);
  const [isHighContrastMode, setIsHighContrastMode] = useState(false);

  const handleDataTableToggle = () => {
    const newState = !isDataTableVisible;
    setIsDataTableVisible(newState);
    onDataTableToggle?.(newState);
  };

  const renderDataTable = () => {
    if (!data.length || !columns.length) return null;

    return (
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <caption className="sr-only">
            {title} 데이터 테이블 - {description}
          </caption>
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderColorLegend = () => {
    if (!Object.keys(colorMap).length) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          색상 범례
        </h4>
        <div className="flex flex-wrap gap-3">
          {Object.entries(colorMap).map(([label, color]) => (
            <div key={label} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`chart-wrapper ${className}`}>
      {/* 차트 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        {/* 접근성 도구 */}
        <div className="flex items-center gap-2 ml-4">
          {/* 고대비 모드 토글 */}
          <button
            onClick={() => setIsHighContrastMode(!isHighContrastMode)}
            className={`p-2 rounded-md border transition-colors
              ${isHighContrastMode 
                ? 'bg-mint-100 border-mint-300 text-mint-700 dark:bg-mint-900 dark:border-mint-600 dark:text-mint-300' 
                : 'bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'
              }
              hover:bg-gray-200 dark:hover:bg-gray-600
              focus:outline-none focus:ring-2 focus:ring-mint-500 dark:focus:ring-mint-400`}
            aria-label={isHighContrastMode ? "고대비 모드 비활성화" : "고대비 모드 활성화"}
            title="고대비 모드 전환"
          >
            <EyeOff className="w-4 h-4" />
          </button>

          {/* 데이터 테이블 토글 */}
          {data.length > 0 && columns.length > 0 && (
            <button
              onClick={handleDataTableToggle}
              className={`p-2 rounded-md border transition-colors
                ${isDataTableVisible 
                  ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900 dark:border-green-600 dark:text-green-300' 
                  : 'bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'
                }
                hover:bg-gray-200 dark:hover:bg-gray-600
                focus:outline-none focus:ring-2 focus:ring-mint-500 dark:focus:ring-mint-400`}
              aria-label={isDataTableVisible ? "데이터 테이블 숨기기" : "데이터 테이블 표시"}
              title="데이터 테이블 전환"
            >
              {isDataTableVisible ? <BarChart3 className="w-4 h-4" /> : <Table className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* 차트 컨테이너 */}
      <div 
        className={`relative ${isHighContrastMode ? 'high-contrast-mode' : ''}`}
        role="img" 
        aria-label={ariaLabel || `${title} 차트`}
        aria-describedby={description ? `chart-desc-${title}` : undefined}
      >
        {/* 차트 내용 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          {children}
        </div>

        {/* 숨겨진 설명 (스크린 리더용) */}
        {description && (
          <div id={`chart-desc-${title}`} className="sr-only">
            {description}
            {data.length > 0 && (
              <span>
                {` 총 ${data.length}개의 데이터 포인트가 있습니다. 자세한 내용은 데이터 테이블을 참조하세요.`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 색상 범례 */}
      {renderColorLegend()}

      {/* 데이터 테이블 */}
      {isDataTableVisible && renderDataTable()}

      {/* 고대비 모드 스타일 */}
      <style jsx>{`
        .high-contrast-mode {
          filter: contrast(150%) saturate(120%);
        }
        .high-contrast-mode .chart-element {
          stroke-width: 2px;
        }
      `}</style>
    </div>
  );
};

/**
 * 차트 툴팁 컴포넌트
 */
export const ChartTooltip = ({ 
  active, 
  payload = [], 
  label, 
  formatter,
  labelFormatter 
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 
                   rounded-lg shadow-lg p-3 text-sm">
      {label && (
        <div className="font-semibold text-gray-900 dark:text-white mb-2">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span className="text-gray-600 dark:text-gray-300">
              {entry.name}:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatter ? formatter(entry.value, entry.name) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 차트 범례 컴포넌트
 */
export const ChartLegend = ({ 
  payload = [], 
  horizontal = true,
  className = '' 
}) => {
  if (!payload?.length) return null;

  return (
    <div 
      className={`flex ${horizontal ? 'flex-row flex-wrap justify-center' : 'flex-col'} 
                 gap-4 mt-4 ${className}`}
      role="list"
      aria-label="차트 범례"
    >
      {payload.map((entry, index) => (
        <div 
          key={index}
          className="flex items-center gap-2"
          role="listitem"
        >
          <div 
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * 빈 차트 상태 컴포넌트
 */
export const EmptyChartState = ({
  title = "데이터가 없습니다",
  description = "표시할 데이터가 없습니다.",
  icon: Icon = BarChart3,
  action
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Icon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
      {title}
    </h3>
    <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
      {description}
    </p>
    {action && action}
  </div>
);

/**
 * 차트 로딩 상태 컴포넌트
 */
export const ChartLoadingState = ({ height = 300 }) => (
  <div 
    className="flex items-center justify-center animate-pulse"
    style={{ height: `${height}px` }}
  >
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-mint-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 dark:text-gray-400">차트를 불러오는 중...</p>
    </div>
  </div>
);

export default AccessibleChartWrapper;