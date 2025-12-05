/**
 * 네트워크 상태 표시 컴포넌트
 * 온라인/오프라인 상태, 연결 품질, 재연결 기능
 */

'use client';

import React, { useState } from 'react';
import useNetworkStatus from '@shared/hooks/useNetworkStatus';
import Toast from './Toast';

/**
 * 네트워크 상태 인디케이터 (작은 상태 아이콘)
 */
export const NetworkIndicator = ({ 
  className = '',
  showLabel = false,
  onClick
}) => {
  const { isOnline, networkQuality, getNetworkInfo } = useNetworkStatus();
  const networkInfo = getNetworkInfo();

  const getNetworkIcon = () => {
    if (!isOnline) {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728M9 12l2 2 4-4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" />
        </svg>
      );
    }

    const qualityColors = {
      excellent: 'text-green-500',
      good: 'text-yellow-500', 
      fair: 'text-orange-500',
      poor: 'text-red-500'
    };

    return (
      <svg className={`w-4 h-4 ${qualityColors[networkQuality] || 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    );
  };

  return (
    <div 
      className={`flex items-center space-x-1 cursor-pointer ${className}`}
      onClick={onClick}
      title={`네트워크 상태: ${networkInfo.statusText}${networkInfo.latency ? ` (${networkInfo.latency}ms)` : ''}`}
    >
      {getNetworkIcon()}
      {showLabel && (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {networkInfo.statusText}
        </span>
      )}
    </div>
  );
};

/**
 * 네트워크 상태 상세 패널
 */
export const NetworkStatusPanel = ({ 
  isVisible = false,
  onClose
}) => {
  const { 
    isOnline, 
    networkQuality, 
    connectionType, 
    latency, 
    downlink, 
    effectiveType, 
    lastOnlineTime, 
    reconnectAttempts,
    isReconnecting,
    reconnect,
    getNetworkInfo,
    NETWORK_QUALITY
  } = useNetworkStatus();

  const networkInfo = getNetworkInfo();

  if (!isVisible) return null;

  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    return `${seconds} giây trước`;
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Trạng thái mạng
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 주요 상태 */}
        <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="w-8 h-8 flex items-center justify-center">
            {isOnline ? (
              <svg className={`w-6 h-6 ${
                networkQuality === 'excellent' ? 'text-green-500' :
                networkQuality === 'good' ? 'text-yellow-500' :
                networkQuality === 'fair' ? 'text-orange-500' : 'text-red-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
              </svg>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {isOnline ? 'Đã kết nối' : 'Mất kết nối'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {networkInfo.statusText} • {networkInfo.connectionInfo.label}
            </p>
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="space-y-3">
          {isOnline && (
            <>
              {latency && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Độ trễ</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {latency}ms
                  </span>
                </div>
              )}
              
              {downlink && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tốc độ tải về</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {downlink.toFixed(1)} Mbps
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Loại kết nối</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {effectiveType?.toUpperCase() || connectionType}
                </span>
              </div>
            </>
          )}

          {!isOnline && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Lần cuối online</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatTime(lastOnlineTime)}
                </span>
              </div>

              {reconnectAttempts > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Lần thử kết nối</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {reconnectAttempts}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* 액션 버튼 */}
        {!isOnline && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={reconnect}
              disabled={isReconnecting}
              className="w-full px-4 py-2 bg-vietnam-mint text-white text-sm font-medium rounded-lg hover:bg-vietnam-mint/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isReconnecting ? 'Đang kết nối lại...' : 'Thử kết nối lại'}
            </button>
          </div>
        )}

        {/* 품질 가이드 */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Chất lượng mạng:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Tuyệt vời (&lt;100ms)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Tốt (&lt;200ms)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Khá (&lt;500ms)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Kém (&gt;500ms)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 오프라인 배너 (전체 페이지 상단에 표시)
 */
export const OfflineBanner = () => {
  const { isOnline, reconnect, isReconnecting } = useNetworkStatus({
    onOnline: () => {
      // 온라인 복귀 시 Toast 표시
      Toast.success('Đã kết nối lại thành công!', {
        description: 'Dữ liệu sẽ được đồng bộ tự động.'
      });
    }
  });

  if (isOnline) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-2 text-sm sticky top-16 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Mất kết nối mạng. Một số tính năng có thể không hoạt động.</span>
        </div>
        <button
          onClick={reconnect}
          disabled={isReconnecting}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium disabled:opacity-50 transition-colors"
        >
          {isReconnecting ? 'Đang kết nối...' : 'Thử lại'}
        </button>
      </div>
    </div>
  );
};

/**
 * 메인 네트워크 상태 컴포넌트 (헤더에서 사용)
 */
const NetworkStatus = ({ className = '' }) => {
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <NetworkIndicator 
        showLabel={false}
        onClick={() => setShowPanel(!showPanel)}
      />
      <NetworkStatusPanel 
        isVisible={showPanel}
        onClose={() => setShowPanel(false)}
      />
    </div>
  );
};

export default NetworkStatus;