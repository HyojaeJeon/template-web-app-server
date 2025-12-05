'use client';

import { useState, useEffect, useMemo } from 'react';

/**
 * 고객 위치별 분포 히트맵 컴포넌트
 * Local 지역별 고객 밀도를 시각화
 */
export default function CustomerLocationHeatmap({
  data = [], // Array of {district: string, ward: string, count: number, revenue: number}
  colorScheme = 'green',
  showTooltip = true,
  showLegend = true,
  onLocationClick,
  onLocationHover,
  className = '',
  locale = 'vi-VN'
}) {
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('count'); // 'count' | 'revenue' | 'density'

  // 색상 스키마 정의
  const colorSchemes = {
    green: ['#f0f9f0', '#c6f6d5', '#68d391', '#38a169', '#2f855a', '#276749'],
    blue: ['#ebf8ff', '#bee3f8', '#90cdf4', '#63b3ed', '#4299e1', '#3182ce'],
    red: ['#fed7d7', '#feb2b2', '#fc8181', '#f56565', '#e53e3e', '#c53030'],
    vietnam: ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e'] // Local 테마
  };

  const colors = colorSchemes[colorScheme] || colorSchemes.vietnam;

  // 데이터 처리 및 통계 계산
  const { processedData, maxValue, totalCustomers, totalRevenue } = useMemo(() => {
    if (!data.length) return { processedData: [], maxValue: 0, totalCustomers: 0, totalRevenue: 0 };

    const total = data.reduce((sum, item) => sum + item.count, 0);
    const revenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
    
    let maxVal = 0;
    const processed = data.map(item => {
      const value = selectedMetric === 'count' ? item.count : 
                   selectedMetric === 'revenue' ? (item.revenue || 0) :
                   (item.count / (item.area || 1)); // density
      
      maxVal = Math.max(maxVal, value);
      
      return {
        ...item,
        value,
        percentage: total > 0 ? (item.count / total * 100) : 0
      };
    });

    return {
      processedData: processed.sort((a, b) => b.value - a.value),
      maxValue: maxVal,
      totalCustomers: total,
      totalRevenue: revenue
    };
  }, [data, selectedMetric]);

  // 색상 계산
  const getColor = (value, maxValue) => {
    if (!value || value === 0) return colors[0];
    
    const ratio = value / maxValue;
    if (ratio <= 0.1) return colors[1];
    if (ratio <= 0.25) return colors[2];
    if (ratio <= 0.5) return colors[3];
    if (ratio <= 0.75) return colors[4];
    return colors[5];
  };

  // 지역 클릭 핸들러
  const handleLocationClick = (location) => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  };

  // 지역 호버 핸들러
  const handleLocationHover = (location) => {
    setHoveredLocation(location);
    if (onLocationHover) {
      onLocationHover(location);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bản đồ phân bố khách hàng
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalCustomers.toLocaleString()} khách hàng • {processedData.length} khu vực
          </p>
        </div>
        
        {/* 메트릭 선택 */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="count">Số lượng KH</option>
            <option value="revenue">Doanh thu</option>
            <option value="density">Mật độ KH</option>
          </select>
        </div>
      </div>

      {/* 범례 */}
      {showLegend && (
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Thấp</span>
            <div className="flex space-x-1">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: color }}
                  title={`Cấp độ ${index}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Cao</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Max: {maxValue.toLocaleString()}
            {selectedMetric === 'revenue' && ' VND'}
            {selectedMetric === 'count' && ' KH'}
            {selectedMetric === 'density' && ' KH/km²'}
          </div>
        </div>
      )}

      {/* 지역별 데이터 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
        {processedData.map((location, index) => (
          <div
            key={`${location.district}-${location.ward}`}
            className="relative p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md border"
            style={{
              backgroundColor: getColor(location.value, maxValue),
              borderColor: hoveredLocation === location ? '#2AC1BC' : 'transparent',
              borderWidth: hoveredLocation === location ? '2px' : '1px'
            }}
            onClick={() => handleLocationClick(location)}
            onMouseEnter={() => handleLocationHover(location)}
            onMouseLeave={() => setHoveredLocation(null)}
            role="button"
            tabIndex={0}
            aria-label={`${location.district}, ${location.ward}: ${location.count} khách hàng`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {location.district}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  {location.ward}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  #{index + 1}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-300">Khách hàng:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {location.count.toLocaleString()}
                </span>
              </div>
              {location.revenue && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Doanh thu:</span>
                  <span className="text-sm font-semibold text-vietnam-mint">
                    {(location.revenue / 1000000).toFixed(1)}M
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-300">Tỷ lệ:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {location.percentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* 진행률 바 */}
            <div className="mt-2 w-full bg-white/30 rounded-full h-1.5">
              <div
                className="bg-vietnam-mint h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(location.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 툴팁 */}
      {showTooltip && hoveredLocation && (
        <div className="absolute z-50 p-3 bg-gray-900 text-white rounded-lg shadow-xl text-sm max-w-xs pointer-events-none">
          <div className="font-semibold mb-1">
            {hoveredLocation.district} - {hoveredLocation.ward}
          </div>
          <div className="space-y-1">
            <div>🏠 Khách hàng: {hoveredLocation.count.toLocaleString()}</div>
            {hoveredLocation.revenue && (
              <div>💰 Doanh thu: {(hoveredLocation.revenue / 1000000).toFixed(1)}M VND</div>
            )}
            <div>📊 Tỷ lệ: {hoveredLocation.percentage.toFixed(1)}%</div>
            {hoveredLocation.avgOrderValue && (
              <div>🛒 AOV: {(hoveredLocation.avgOrderValue / 1000).toFixed(0)}K VND</div>
            )}
          </div>
        </div>
      )}

      {/* 통계 요약 */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {processedData.length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Khu vực</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-vietnam-mint">
            {totalCustomers.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Khách hàng</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-vietnam-green">
            {(totalRevenue / 1000000).toFixed(1)}M
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Doanh thu</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalCustomers > 0 ? (totalRevenue / totalCustomers / 1000).toFixed(0) : 0}K
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">AOV</p>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="px-3 py-1.5 bg-vietnam-mint text-white text-xs font-medium rounded-lg hover:bg-vietnam-mint-dark transition-colors">
          Xuất báo cáo
        </button>
        <button className="px-3 py-1.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          Xem bản đồ
        </button>
        <button className="px-3 py-1.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          Phân tích chi tiết
        </button>
      </div>
    </div>
  );
}