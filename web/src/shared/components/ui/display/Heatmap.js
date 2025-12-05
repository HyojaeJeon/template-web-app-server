'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

export default function Heatmap({
  data = [], // Array of {date: 'YYYY-MM-DD', value: number, label?: string}
  width = 800,
  height = 200,
  startDate, // Date object or string
  endDate, // Date object or string
  cellSize = 16, // @ l0
  cellGap = 2, // @ �
  colorScheme = 'green', // green, blue, red, purple, custom
  customColors, // Array of colors [low, medium, high]
  showTooltip = true,
  showLabels = true,
  showLegend = true,
  onCellClick,
  onCellHover,
  className = '',
  locale = 'vi-VN',
  weekStartsOn = 1 // 0: Sunday, 1: Monday
}) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // �� ��� X
  const colorSchemes = {
    green: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    blue: ['#ebedf0', '#9ecbff', '#40a9ff', '#1890ff', '#0050b3'],
    red: ['#ebedf0', '#ffccc7', '#ff7875', '#ff4d4f', '#cf1322'],
    purple: ['#ebedf0', '#d3adf7', '#b37feb', '#9254de', '#722ed1']
  };

  const colors = customColors || colorSchemes[colorScheme] || colorSchemes.green;

  // pt0 ��
  const { processedData, dateRange, maxValue } = useMemo(() => {
    // 데이터가 비어있을 때 기본 날짜 범위 설정
    let start, end;
    
    if (startDate) {
      start = new Date(startDate);
    } else if (data.length > 0) {
      start = new Date(Math.min(...data.map(d => new Date(d.date))));
    } else {
      start = new Date(); // 오늘 날짜
    }
    
    if (endDate) {
      end = new Date(endDate);
    } else if (data.length > 0) {
      end = new Date(Math.max(...data.map(d => new Date(d.date))));
    } else {
      end = new Date(); // 오늘 날짜
    }
    
    // pt0 � �1
    const dataMap = new Map();
    data.forEach(item => {
      dataMap.set(item.date, item);
    });

    // �� � �1
    const dates = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const maxVal = data.length > 0 ? Math.max(...data.map(d => d.value)) : 0;

    return {
      processedData: dataMap,
      dateRange: dates,
      maxValue: maxVal
    };
  }, [data, startDate, endDate]);

  // � 0x �� İ
  const getColor = (value) => {
    if (!value || value === 0) return colors[0];
    
    const ratio = value / maxValue;
    if (ratio <= 0.25) return colors[1];
    if (ratio <= 0.5) return colors[2];
    if (ratio <= 0.75) return colors[3];
    return colors[4];
  };

  // �(� pt0 l1
  const weekData = useMemo(() => {
    const weeks = [];
    let currentWeek = [];
    
    // dateRange가 비어있는 경우 처리
    if (!dateRange || dateRange.length === 0) {
      return [];
    }
    
    // � � H x İ
    const firstDate = dateRange[0];
    const firstDay = (firstDate.getDay() - weekStartsOn + 7) % 7;

    // � � H x �
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }

    dateRange.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const cellData = processedData.get(dateStr) || { date: dateStr, value: 0 };
      
      currentWeek.push({
        ...cellData,
        date,
        dateStr
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // ��� � H x �
    while (currentWeek.length < 7 && currentWeek.length > 0) {
      currentWeek.push(null);
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [dateRange, processedData, weekStartsOn]);

  // @ t� x��
  const handleCellClick = (cellData) => {
    if (onCellClick && cellData) {
      onCellClick(cellData);
    }
  };

  // @ 8� x��
  const handleCellHover = (cellData, event) => {
    if (!cellData) {
      setHoveredCell(null);
      return;
    }

    setHoveredCell(cellData);
    
    if (showTooltip && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }

    if (onCellHover) {
      onCellHover(cellData);
    }
  };

  // �| |�
  const weekDayLabels = useMemo(() => {
    const labels = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(2024, 0, 1 + ((i + weekStartsOn) % 7));
      labels.push(date.toLocaleDateString(locale, { weekday: 'short' }));
    }
    return labels;
  }, [locale, weekStartsOn]);

  // � |� İ
  const monthLabels = useMemo(() => {
    const labels = [];
    const months = new Set();
    
    weekData.forEach((week, weekIndex) => {
      week.forEach((cell, dayIndex) => {
        if (cell && cell.date) {
          const month = cell.date.getMonth();
          const monthYear = `${month}-${cell.date.getFullYear()}`;
          
          if (!months.has(monthYear)) {
            months.add(monthYear);
            const x = weekIndex * (cellSize + cellGap);
            labels.push({
              x,
              month: cell.date.toLocaleDateString(locale, { month: 'short' }),
              year: cell.date.getFullYear()
            });
          }
        }
      });
    });

    return labels;
  }, [weekData, cellSize, cellGap, locale]);

  // 빈 데이터 처리
  if (!data || data.length === 0 || weekData.length === 0) {
    return (
      <div className={`relative ${className} flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600`}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            데이터 없음
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            표시할 히트맵 데이터가 없습니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* (� �  �@ */}
      {showLegend && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            \� ���
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">L</span>
            <div className="flex gap-1">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: color }}
                  title={`� ${index}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">�L</span>
          </div>
        </div>
      )}

      {/* SVG ��� */}
      <div className="overflow-x-auto">
        <svg
          width={Math.max(weekData.length * (cellSize + cellGap) + 60, width)}
          height={height}
          className="font-mono text-xs"
        >
          {/* � |� */}
          {showLabels && monthLabels.map((label, index) => (
            <text
              key={index}
              x={label.x + 60}
              y={15}
              className="fill-gray-600 dark:fill-gray-400 text-xs"
              textAnchor="start"
            >
              {label.month}
            </text>
          ))}

          {/* �| |� */}
          {showLabels && weekDayLabels.map((day, index) => {
            if (index % 2 === 0) { // � xq�� \�X� � p
              return (
                <text
                  key={index}
                  x={50}
                  y={30 + index * (cellSize + cellGap) + cellSize / 2 + 4}
                  className="fill-gray-600 dark:fill-gray-400 text-xs"
                  textAnchor="end"
                >
                  {day}
                </text>
              );
            }
            return null;
          })}

          {/* ��� @� */}
          <g transform="translate(60, 25)">
            {weekData.map((week, weekIndex) => (
              <g key={weekIndex}>
                {week.map((cell, dayIndex) => {
                  if (!cell) {
                    return (
                      <rect
                        key={dayIndex}
                        x={weekIndex * (cellSize + cellGap)}
                        y={dayIndex * (cellSize + cellGap)}
                        width={cellSize}
                        height={cellSize}
                        fill="transparent"
                      />
                    );
                  }

                  return (
                    <rect
                      key={dayIndex}
                      x={weekIndex * (cellSize + cellGap)}
                      y={dayIndex * (cellSize + cellGap)}
                      width={cellSize}
                      height={cellSize}
                      fill={getColor(cell.value)}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                      rx="2"
                      ry="2"
                      className="cursor-pointer hover:stroke-gray-400 transition-colors"
                      onClick={() => handleCellClick(cell)}
                      onMouseEnter={(e) => handleCellHover(cell, e)}
                      onMouseLeave={() => handleCellHover(null, e)}
                      role="button"
                      aria-label={`${cell.date.toLocaleDateString(locale)}: ${cell.value}${cell.label ? ` ${cell.label}` : ''}`}
                    >
                      <title>
                        {cell.date.toLocaleDateString(locale)}: {cell.value}
                        {cell.label && ` ${cell.label}`}
                      </title>
                    </rect>
                  );
                })}
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* 4 */}
      {showTooltip && hoveredCell && (
        <div
          className="absolute z-10 px-3 py-2 text-sm bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="font-semibold">
            {hoveredCell.date.toLocaleDateString(locale, { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
          <div>
            : {hoveredCell.value.toLocaleString()}
            {hoveredCell.label && ` ${hoveredCell.label}`}
          </div>
        </div>
      )}

      {/* �� � */}
      <div className="mt-4 flex gap-6 text-sm text-gray-600 dark:text-gray-400">
        <div>
           {dateRange.length}|
        </div>
        <div>
          \: {maxValue.toLocaleString()}
        </div>
        <div>
          ��: {(data.reduce((sum, item) => sum + item.value, 0) / data.length || 0).toFixed(1)}
        </div>
      </div>
    </div>
  );
}

// GitHub ��| 0�� (�
export function ContributionHeatmap({ contributions = [], year = new Date().getFullYear(), ...props }) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  return (
    <Heatmap
      data={contributions}
      startDate={startDate}
      endDate={endDate}
      colorScheme="green"
      cellSize={12}
      cellGap={2}
      showLabels={true}
      showLegend={true}
      {...props}
    />
  );
}

// � ���
export function SalesHeatmap({ salesData = [], ...props }) {
  return (
    <Heatmap
      data={salesData.map(item => ({
        ...item,
        label: 't'
      }))}
      colorScheme="blue"
      showTooltip={true}
      {...props}
    />
  );
}

// �8 ���
export function OrderHeatmap({ orderData = [], ...props }) {
  return (
    <Heatmap
      data={orderData.map(item => ({
        ...item,
        label: '�8'
      }))}
      colorScheme="green"
      showTooltip={true}
      {...props}
    />
  );
}