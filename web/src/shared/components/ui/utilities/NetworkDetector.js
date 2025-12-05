/**
 * NetworkDetector 컴포넌트
 * 네트워크 상태 감지 및 표시 컴포넌트
 * WCAG 2.1 준수, 다크테마 지원
 */

import React, { useState, useEffect, useRef } from 'react';

const CONNECTION_TYPES = {
  OFFLINE: 'offline',
  SLOW_2G: 'slow-2g',
  '2G': '2g',
  '3G': '3g', 
  '4G': '4g',
  '5G': '5g',
  WIFI: 'wifi',
  UNKNOWN: 'unknown'
};

const CONNECTION_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  UNSTABLE: 'unstable'
};

// 네트워크 상태 훅
const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: CONNECTION_TYPES.UNKNOWN,
    effectiveType: null,
    downlink: null,
    rtt: null,
    saveData: false,
    status: CONNECTION_STATUS.ONLINE
  });

  const [isUnstable, setIsUnstable] = useState(false);
  const disconnectCount = useRef(0);
  const lastDisconnect = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateNetworkStatus = () => {
      const connection = navigator.connection || 
                        navigator.mozConnection || 
                        navigator.webkitConnection;

      let connectionType = CONNECTION_TYPES.UNKNOWN;
      let status = navigator.onLine ? CONNECTION_STATUS.ONLINE : CONNECTION_STATUS.OFFLINE;

      // 연결 타입 결정
      if (!navigator.onLine) {
        connectionType = CONNECTION_TYPES.OFFLINE;
        status = CONNECTION_STATUS.OFFLINE;
      } else if (connection) {
        // 실제 연결 정보 사용
        switch (connection.effectiveType) {
          case 'slow-2g':
            connectionType = CONNECTION_TYPES.SLOW_2G;
            break;
          case '2g':
            connectionType = CONNECTION_TYPES['2G'];
            break;
          case '3g':
            connectionType = CONNECTION_TYPES['3G'];
            break;
          case '4g':
            connectionType = CONNECTION_TYPES['4G'];
            break;
          default:
            connectionType = CONNECTION_TYPES.WIFI;
        }

        // 불안정한 연결 감지
        if (connection.rtt > 2000 || connection.downlink < 0.5) {
          status = CONNECTION_STATUS.UNSTABLE;
          setIsUnstable(true);
        } else {
          setIsUnstable(false);
        }
      }

      setNetworkStatus({
        isOnline: navigator.onLine,
        connectionType,
        effectiveType: connection?.effectiveType || null,
        downlink: connection?.downlink || null,
        rtt: connection?.rtt || null,
        saveData: connection?.saveData || false,
        status
      });
    };

    const handleOnline = () => {
      updateNetworkStatus();
      // 온라인 복구 시 불안정성 리셋
      setTimeout(() => setIsUnstable(false), 2000);
    };

    const handleOffline = () => {
      disconnectCount.current += 1;
      lastDisconnect.current = Date.now();
      
      // 자주 끊어지는 경우 불안정으로 표시
      if (disconnectCount.current > 3) {
        setIsUnstable(true);
      }
      
      updateNetworkStatus();
    };

    // 연결 상태 변경 이벤트
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 연결 정보 변경 이벤트 (지원하는 브라우저)
    const connection = navigator.connection || 
                      navigator.mozConnection || 
                      navigator.webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    // 초기 상태 설정
    updateNetworkStatus();

    // 불안정성 카운터 리셋 (5분 후)
    const resetTimer = setInterval(() => {
      if (lastDisconnect.current && Date.now() - lastDisconnect.current > 300000) {
        disconnectCount.current = 0;
        setIsUnstable(false);
      }
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
      
      clearInterval(resetTimer);
    };
  }, []);

  return { ...networkStatus, isUnstable };
};

const NetworkDetector = ({
  children,
  showIndicator = true,
  position = 'top-right', // top-left, top-right, bottom-left, bottom-right, inline
  onStatusChange = null,
  offlineMessage = 'Mất kết nối mạng',
  unstableMessage = 'Kết nối không ổn định',
  onlineMessage = 'Đã kết nối',
  showSpeedInfo = false,
  autoHide = true,
  autoHideDelay = 3000,
  className = '',
  ...props
}) => {
  const networkStatus = useNetworkStatus();
  const [showNotification, setShowNotification] = useState(false);
  const [lastStatus, setLastStatus] = useState(networkStatus.status);
  const hideTimeoutRef = useRef(null);

  // 상태 변경 감지
  useEffect(() => {
    if (networkStatus.status !== lastStatus) {
      setLastStatus(networkStatus.status);
      setShowNotification(true);
      
      if (onStatusChange) {
        onStatusChange(networkStatus);
      }

      // 자동 숨기기
      if (autoHide && networkStatus.status === CONNECTION_STATUS.ONLINE) {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
        
        hideTimeoutRef.current = setTimeout(() => {
          setShowNotification(false);
        }, autoHideDelay);
      }
    }
  }, [networkStatus.status, lastStatus, onStatusChange, autoHide, autoHideDelay]);

  // 정리
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // 연결 상태 아이콘
  const getStatusIcon = () => {
    switch (networkStatus.status) {
      case CONNECTION_STATUS.OFFLINE:
        return '📵';
      case CONNECTION_STATUS.UNSTABLE:
        return '📶';
      case CONNECTION_STATUS.ONLINE:
        return networkStatus.connectionType === CONNECTION_TYPES.WIFI ? '📶' : '📱';
      default:
        return '❓';
    }
  };

  // 연결 상태 색상
  const getStatusColor = () => {
    switch (networkStatus.status) {
      case CONNECTION_STATUS.OFFLINE:
        return 'bg-red-600 text-white';
      case CONNECTION_STATUS.UNSTABLE:
        return 'bg-yellow-600 text-white';
      case CONNECTION_STATUS.ONLINE:
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  // 상태 메시지
  const getStatusMessage = () => {
    switch (networkStatus.status) {
      case CONNECTION_STATUS.OFFLINE:
        return offlineMessage;
      case CONNECTION_STATUS.UNSTABLE:
        return unstableMessage;
      case CONNECTION_STATUS.ONLINE:
        return onlineMessage;
      default:
        return 'Đang kiểm tra kết nối...';
    }
  };

  // 속도 정보 표시
  const getSpeedInfo = () => {
    if (!showSpeedInfo || !networkStatus.downlink) return null;
    
    return (
      <div className="text-xs opacity-75 mt-1">
        {networkStatus.downlink > 0 && (
          <span>⬇️ {networkStatus.downlink.toFixed(1)} Mbps</span>
        )}
        {networkStatus.rtt > 0 && (
          <span className="ml-2">⏱️ {networkStatus.rtt}ms</span>
        )}
      </div>
    );
  };

  // 위치 클래스
  const getPositionClasses = () => {
    if (position === 'inline') return '';
    
    const positions = {
      'top-left': 'fixed top-4 left-4 z-50',
      'top-right': 'fixed top-4 right-4 z-50',
      'bottom-left': 'fixed bottom-4 left-4 z-50',
      'bottom-right': 'fixed bottom-4 right-4 z-50'
    };
    
    return positions[position] || positions['top-right'];
  };

  // 알림 표시
  const renderNotification = () => {
    if (!showIndicator || (!showNotification && networkStatus.status === CONNECTION_STATUS.ONLINE)) {
      return null;
    }

    return (
      <div
        className={`
          ${getPositionClasses()}
          ${getStatusColor()}
          px-4 py-2 rounded-lg shadow-lg
          flex items-center space-x-2
          transition-all duration-300
          max-w-xs
          ${position === 'inline' ? 'w-full' : ''}
          ${className}
        `}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="text-sm" role="img" aria-label="Connection status">
          {getStatusIcon()}
        </span>
        
        <div className="flex-1">
          <p className="text-sm font-medium">
            {getStatusMessage()}
          </p>
          {getSpeedInfo()}
        </div>

        {/* 닫기 버튼 */}
        {networkStatus.status !== CONNECTION_STATUS.OFFLINE && (
          <button
            onClick={() => setShowNotification(false)}
            className="text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 rounded p-1"
            aria-label="Đóng thông báo"
          >
            ×
          </button>
        )}
      </div>
    );
  };

  // 오프라인 상태에서 children 래핑
  if (typeof children === 'function') {
    return (
      <div {...props}>
        {children(networkStatus)}
        {renderNotification()}
      </div>
    );
  }

  return (
    <div {...props}>
      {children}
      {renderNotification()}
      
      {/* 오프라인 오버레이 */}
      {networkStatus.status === CONNECTION_STATUS.OFFLINE && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-sm mx-4 text-center">
            <div className="text-4xl mb-4">📵</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Mất kết nối
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Vui lòng kiểm tra kết nối mạng và thử lại.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#2AC1BC] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 사전 정의된 네트워크 감지 컴포넌트들
export const OfflineDetector = ({ children, fallback, ...props }) => (
  <NetworkDetector {...props}>
    {(status) => status.isOnline ? children : fallback}
  </NetworkDetector>
);

export const OnlineOnly = ({ children, ...props }) => (
  <NetworkDetector {...props}>
    {(status) => status.isOnline ? children : null}
  </NetworkDetector>
);

export const SlowConnectionWarning = ({ children, threshold = 1, ...props }) => (
  <NetworkDetector {...props}>
    {(status) => {
      if (status.downlink && status.downlink < threshold) {
        return (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <span className="text-yellow-600 dark:text-yellow-400 mr-2">⚠️</span>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Kết nối chậm có thể ảnh hưởng đến trải nghiệm.
              </p>
            </div>
          </div>
        );
      }
      return children;
    }}
  </NetworkDetector>
);

// HOC for network-aware components
export const withNetworkDetection = (Component, networkProps = {}) => {
  return React.forwardRef((props, ref) => (
    <NetworkDetector {...networkProps}>
      {(networkStatus) => (
        <Component {...props} networkStatus={networkStatus} ref={ref} />
      )}
    </NetworkDetector>
  ));
};

// Export hooks and constants
export { useNetworkStatus, CONNECTION_TYPES, CONNECTION_STATUS };
export default NetworkDetector;