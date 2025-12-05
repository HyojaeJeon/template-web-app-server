'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import AccessibleChartWrapper, { ChartLegend, EmptyChartState, ChartLoadingState } from './AccessibleChartWrapper';
import { useUnifiedSocket } from '../../../../providers/UnifiedSocketProvider';

/**
 * 실시간 차트 컴포넌트 (WCAG 2.1 준수)
 * WebSocket 연동을 통한 실시간 데이터 업데이트 지원
 * Local 테마 컬러와 다크모드 지원
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Array} props.initialData - 초기 차트 데이터
 * @param {Array} props.series - 시리즈 설정 배열 [{ key, color, name, type }]
 * @param {string} props.xKey - X축 데이터 키 (주로 타임스탬프)
 * @param {string} props.title - 차트 제목
 * @param {string} props.description - 차트 설명
 * @param {number} props.height - 차트 높이
 * @param {number} props.maxDataPoints - 최대 데이터 포인트 수 (슬라이딩 윈도우)
 * @param {boolean} props.showGrid - 격자 표시 여부
 * @param {boolean} props.showTooltip - 툴팁 표시 여부
 * @param {boolean} props.showLegend - 범례 표시 여부
 * @param {Function} props.formatter - 값 포맷터 함수
 * @param {Function} props.onDataUpdate - 데이터 업데이트 콜백
 * @param {string} props.websocketUrl - WebSocket URL (선택사항)
 * @param {boolean} props.autoUpdate - 자동 업데이트 활성화
 * @param {number} props.updateInterval - 업데이트 간격 (ms)
 * @param {boolean} props.loading - 로딩 상태
 */
const RealTimeChart = ({
  initialData = [],
  series = [],
  xKey = 'timestamp',
  title,
  description,
  height = 300,
  maxDataPoints = 50,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  formatter,
  onDataUpdate,
  websocketUrl,
  autoUpdate = true,
  updateInterval = 1000,
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

  // UnifiedSocket 통합
  const unifiedSocket = useUnifiedSocket();
  
  // 상태 관리
  const [data, setData] = useState(initialData);
  const [isPlaying, setIsPlaying] = useState(autoUpdate);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  
  const intervalRef = useRef(null);
  const animationRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // 시리즈 설정 처리
  const processedSeries = useMemo(() => {
    if (!series.length && data.length > 0) {
      const keys = Object.keys(data[0] || {}).filter(key => key !== xKey);
      return keys.map((key, index) => ({
        key,
        name: key,
        color: defaultColors[index % defaultColors.length],
        type: 'line', // line, area, bar
        strokeWidth: 2
      }));
    }
    
    return series.map((s, index) => ({
      ...s,
      color: s.color || defaultColors[index % defaultColors.length],
      type: s.type || 'line',
      strokeWidth: s.strokeWidth || 2
    }));
  }, [series, data, xKey]);

  // 차트 영역 계산
  const chartArea = useMemo(() => {
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 800;
    return {
      margin,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
      totalWidth: width,
      totalHeight: height
    };
  }, [height]);

  // 스케일 계산 (실시간 업데이트 고려)
  const scales = useMemo(() => {
    if (!data.length) return { x: [], y: { min: 0, max: 1 } };

    const allYValues = processedSeries.flatMap(s => 
      data.map(d => d[s.key]).filter(v => v != null)
    );

    const yMin = Math.min(...allYValues, 0);
    const yMax = Math.max(...allYValues, 1);
    const yPadding = (yMax - yMin) * 0.1;

    return {
      x: data.map(d => d[xKey]),
      y: {
        min: yMin - yPadding,
        max: yMax + yPadding
      }
    };
  }, [data, processedSeries, xKey]);

  // UnifiedSocket 연결 및 실시간 데이터 구독 함수
  const connectRealTimeData = useCallback((eventName = 'realtime:chart_data') => {
    if (!unifiedSocket || !unifiedSocket.isConnected) {
      setConnectionStatus('error');
      return;
    }

    try {
      setConnectionStatus('connecting');
      
      // UnifiedSocket을 통한 실시간 데이터 구독
      const unsubscribe = unifiedSocket.subscribeToRealtime(
        eventName,
        (newData) => {
          try {
            addDataPoint(newData);
          } catch (error) {
            console.error('RealTimeChart data processing error:', error);
          }
        },
        '/main'
      );
      
      unsubscribeRef.current = unsubscribe;
      setConnectionStatus('connected');
      console.log(`RealTimeChart: UnifiedSocket 실시간 데이터 구독 시작 (${eventName})`);
      
    } catch (error) {
      console.error('RealTimeChart: UnifiedSocket 구독 설정 실패:', error);
      setConnectionStatus('error');
    }
  }, [unifiedSocket, addDataPoint]);

  // UnifiedSocket 연결 해제 함수
  const disconnectRealTimeData = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setConnectionStatus('disconnected');
    console.log('RealTimeChart: UnifiedSocket 실시간 데이터 구독 해제');
  }, []);

  // 데이터 포인트 추가 함수 (슬라이딩 윈도우)
  const addDataPoint = useCallback((newPoint) => {
    setData(prevData => {
      const updatedData = [...prevData, newPoint];
      
      // 최대 데이터 포인트 수 제한 (슬라이딩 윈도우)
      if (updatedData.length > maxDataPoints) {
        updatedData.shift(); // 가장 오래된 데이터 제거
      }

      if (onDataUpdate) {
        onDataUpdate(updatedData, newPoint);
      }

      return updatedData;
    });
  }, [maxDataPoints, onDataUpdate]);

  // 모의 데이터 생성 함수 (WebSocket이 없을 경우)
  const generateMockData = useCallback(() => {
    const now = Date.now();
    const mockPoint = { [xKey]: now };
    
    processedSeries.forEach(s => {
      // 이전 값에서 약간 변동된 값 생성
      const lastValue = data.length > 0 ? data[data.length - 1][s.key] : 100;
      const variation = (Math.random() - 0.5) * 20; // ±10 변동
      mockPoint[s.key] = Math.max(0, lastValue + variation);
    });

    addDataPoint(mockPoint);
  }, [xKey, processedSeries, data, addDataPoint]);

  // 자동 업데이트 제어 (UnifiedSocket 기반)
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      disconnectRealTimeData();
      return;
    }

    // UnifiedSocket 우선, 없으면 모의 데이터
    if (unifiedSocket && unifiedSocket.isConnected) {
      const eventName = websocketUrl ? 'realtime:chart_data' : 'realtime:chart_mock_data';
      connectRealTimeData(eventName);
    } else if (!websocketUrl) {
      intervalRef.current = setInterval(generateMockData, updateInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      disconnectRealTimeData();
    };
  }, [isPlaying, websocketUrl, unifiedSocket, unifiedSocket?.isConnected, connectRealTimeData, disconnectRealTimeData, generateMockData, updateInterval]);

  // 컴포넌트 언마운트 시 정리 (UnifiedSocket 기반)
  useEffect(() => {
    return () => {
      disconnectRealTimeData();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [disconnectRealTimeData]);

  // 좌표 변환 함수
  const getX = useCallback((index) => (index / Math.max(data.length - 1, 1)) * chartArea.width, [data.length, chartArea.width]);
  const getY = useCallback((value) => chartArea.height - ((value - scales.y.min) / (scales.y.max - scales.y.min)) * chartArea.height, [chartArea.height, scales.y.min, scales.y.max]);

  // 경로 생성 함수
  const createPath = useCallback((seriesData, type = 'line') => {
    if (!seriesData.length) return '';
    
    const pathCommands = seriesData.map((point, index) => {
      const x = getX(index);
      const y = getY(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    });

    if (type === 'area') {
      // 영역 차트의 경우 바닥까지 경로 추가
      const firstX = getX(0);
      const lastX = getX(seriesData.length - 1);
      const bottomY = getY(0);
      pathCommands.push(`L ${lastX} ${bottomY}`);
      pathCommands.push(`L ${firstX} ${bottomY}`);
      pathCommands.push('Z');
    }

    return pathCommands.join(' ');
  }, [getX, getY]);

  // 테이블 컬럼 설정
  const tableColumns = useMemo(() => [
    { 
      key: xKey, 
      header: '시간', 
      render: (value) => new Date(value).toLocaleTimeString()
    },
    ...processedSeries.map(s => ({
      key: s.key,
      header: s.name,
      render: (value) => formatter ? formatter(value) : value
    }))
  ], [xKey, processedSeries, formatter]);

  // 색상 맵
  const colorMap = useMemo(() => {
    return processedSeries.reduce((map, s) => {
      map[s.name] = s.color;
      return map;
    }, {});
  }, [processedSeries]);

  // 제어 버튼들
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setData([]);
    setIsPlaying(false);
  };

  const handleReconnect = () => {
    if (unifiedSocket) {
      disconnectRealTimeData();
      setTimeout(() => {
        const eventName = websocketUrl ? 'realtime:chart_data' : 'realtime:chart_mock_data';
        connectRealTimeData(eventName);
        setIsPlaying(true);
      }, 100);
    }
  };

  if (loading) {
    return <ChartLoadingState height={height} />;
  }

  return (
    <AccessibleChartWrapper
      title={title}
      description={description}
      data={data}
      columns={tableColumns}
      colorMap={colorMap}
      className={className}
      ariaLabel={`${title || '실시간 차트'} - ${processedSeries.length}개의 데이터 시리즈가 있는 실시간 그래프`}
    >
      <div className="space-y-4">
        {/* 제어 패널 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayPause}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label={isPlaying ? '일시정지' : '재생'}
            >
              {isPlaying ? '⏸️ 일시정지' : '▶️ 재생'}
            </button>
            
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="차트 리셋"
            >
              🔄 리셋
            </button>

            {unifiedSocket && (
              <button
                onClick={handleReconnect}
                className="px-4 py-2 rounded-lg bg-secondary-500 hover:bg-secondary-600 text-white font-medium focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2"
                aria-label="재연결"
              >
                🔗 재연결
              </button>
            )}
          </div>

          {/* 연결 상태 표시 */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' && unifiedSocket?.isConnected ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500' :
              connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
            }`} />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {connectionStatus === 'connected' && unifiedSocket?.isConnected ? 'UnifiedSocket 연결됨' :
               connectionStatus === 'connecting' ? '연결중...' :
               connectionStatus === 'error' ? '연결 오류' : '연결 안됨'}
            </span>
            <span className="text-sm text-gray-500">
              ({data.length}/{maxDataPoints} 포인트)
            </span>
          </div>
        </div>

        {data.length === 0 ? (
          <EmptyChartState 
            title="실시간 데이터 대기 중"
            description={unifiedSocket?.isConnected ? 
              "UnifiedSocket 연결됨. 데이터를 받아오기 위해 재생 버튼을 눌러주세요." :
              "UnifiedSocket 연결을 확인한 후 재생 버튼을 눌러주세요."
            }
          />
        ) : (
          <div className="relative">
            <svg
              width={chartArea.totalWidth}
              height={chartArea.totalHeight}
              viewBox={`0 0 ${chartArea.totalWidth} ${chartArea.totalHeight}`}
              className="w-full h-full"
              role="img"
              aria-label={title || '실시간 차트'}
            >
              {/* 정의 영역 */}
              <defs>
                {processedSeries.map((s, index) => (
                  <linearGradient key={index} id={`realtime-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={s.color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={s.color} stopOpacity="0.05" />
                  </linearGradient>
                ))}
              </defs>

              {/* 차트 영역 */}
              <g transform={`translate(${chartArea.margin.left}, ${chartArea.margin.top})`}>
                {/* 격자 */}
                {showGrid && (
                  <>
                    {/* Y축 격자선 */}
                    {Array.from({ length: 6 }, (_, i) => {
                      const y = (chartArea.height / 5) * i;
                      const value = scales.y.max - ((scales.y.max - scales.y.min) / 5) * i;
                      
                      return (
                        <g key={i}>
                          <line
                            x1="0"
                            y1={y}
                            x2={chartArea.width}
                            y2={y}
                            stroke="currentColor"
                            strokeWidth="0.5"
                            className="text-gray-300 dark:text-gray-600"
                          />
                          <text
                            x="-10"
                            y={y + 4}
                            textAnchor="end"
                            className="text-xs fill-gray-500 dark:fill-gray-400"
                          >
                            {formatter ? formatter(value) : Math.round(value * 100) / 100}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}

                {/* 시리즈 그리기 */}
                {processedSeries.map((s, seriesIndex) => {
                  const seriesData = data.map((item, index) => ({
                    x: index,
                    value: item[s.key] || 0
                  }));

                  if (s.type === 'area') {
                    return (
                      <g key={seriesIndex}>
                        {/* 영역 채우기 */}
                        <path
                          d={createPath(seriesData, 'area')}
                          fill={`url(#realtime-gradient-${seriesIndex})`}
                          className="transition-opacity duration-300"
                        />
                        {/* 경계선 */}
                        <path
                          d={createPath(seriesData, 'line')}
                          fill="none"
                          stroke={s.color}
                          strokeWidth={s.strokeWidth}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    );
                  } else {
                    return (
                      <path
                        key={seriesIndex}
                        d={createPath(seriesData, 'line')}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={s.strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-sm"
                      />
                    );
                  }
                })}

                {/* 축 */}
                <g>
                  <line
                    x1="0"
                    y1={chartArea.height}
                    x2={chartArea.width}
                    y2={chartArea.height}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-gray-400 dark:text-gray-600"
                  />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={chartArea.height}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-gray-400 dark:text-gray-600"
                  />
                </g>
              </g>
            </svg>

            {/* 범례 */}
            {showLegend && (
              <ChartLegend 
                payload={processedSeries.map(s => ({
                  value: s.name,
                  color: s.color
                }))}
                horizontal={true}
              />
            )}
          </div>
        )}
      </div>
    </AccessibleChartWrapper>
  );
};

export default RealTimeChart;