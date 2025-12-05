'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from '@/shared/utils/format';
import { useTranslation } from '@/shared/i18n';

/**
 * OrderTimer Component
 * 
 * Local 배달 앱 주문 시간 추적 컴포넌트
 * - 실시간 주문 경과 시간 표시
 * - 예상 배달 시간 카운트다운
 * - 지연 알림 및 자동 알림
 * - 주문 단계별 시간 추적
 * - Local 현지화 지원
 * 
 * WCAG 2.1 준수, 키보드 네비게이션, 스크린 리더 지원
 * 
 * @param {Object} props - OrderTimer 컴포넌트 props
 * @param {Date} props.orderTime - 주문 시간
 * @param {Date} props.estimatedDelivery - 예상 배달 시간
 * @param {string} props.status - 주문 상태 ('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivering', 'delivered')
 * @param {Array} props.statusHistory - 상태 변경 이력
 * @param {Function} props.onDelayAlert - 지연 알림 콜백
 * @param {Function} props.onStatusUpdate - 상태 업데이트 콜백
 * @param {boolean} props.showStatusHistory - 상태 이력 표시 여부
 * @param {boolean} props.autoAlert - 자동 알림 활성화
 * @param {number} props.delayThreshold - 지연 임계값 (분)
 * @param {string} props.size - 사이즈 ('sm', 'md', 'lg')
 * @param {string} props.className - 추가 CSS 클래스
 */
const OrderTimer = ({
  orderTime = new Date(),
  estimatedDelivery = new Date(Date.now() + 30 * 60 * 1000), // 30분 후
  status = 'pending',
  statusHistory = [],
  onDelayAlert,
  onStatusUpdate,
  showStatusHistory = false,
  autoAlert = true,
  delayThreshold = 5, // 5분
  size = 'md',
  className = ''
}) => {
  const { language } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDelayed, setIsDelayed] = useState(false);
  const [delayAlertShown, setDelayAlertShown] = useState(false);

  // 주문 상태 설정
  const statusConfig = {
    pending: {
      label: '주문 대기',
      color: 'gray',
      icon: 'clock',
      description: '주문이 접수되기를 기다리고 있습니다'
    },
    confirmed: {
      label: '주문 확인',
      color: 'blue',
      icon: 'check-circle',
      description: '주문이 확인되었습니다'
    },
    preparing: {
      label: '조리중',
      color: 'yellow',
      icon: 'fire',
      description: '음식을 조리하고 있습니다'
    },
    ready: {
      label: '조리 완료',
      color: 'green',
      icon: 'check',
      description: '음식이 준비되었습니다'
    },
    picked_up: {
      label: '픽업 완료',
      color: 'blue',
      icon: 'truck',
      description: '배달원이 픽업했습니다'
    },
    delivering: {
      label: '배달중',
      color: 'purple',
      icon: 'location',
      description: '배달 중입니다'
    },
    delivered: {
      label: '배달 완료',
      color: 'emerald',
      icon: 'check-circle',
      description: '배달이 완료되었습니다'
    }
  };

  // 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 지연 감지
  useEffect(() => {
    const now = currentTime.getTime();
    const estimated = estimatedDelivery.getTime();
    const delayMs = delayThreshold * 60 * 1000;

    const isCurrentlyDelayed = now > (estimated + delayMs) && status !== 'delivered';
    setIsDelayed(isCurrentlyDelayed);

    // 지연 알림 (한 번만)
    if (isCurrentlyDelayed && !delayAlertShown && autoAlert && onDelayAlert) {
      const delayMinutes = Math.floor((now - estimated) / (60 * 1000));
      onDelayAlert({
        delayMinutes,
        status,
        estimatedDelivery,
        orderTime
      });
      setDelayAlertShown(true);
    }
  }, [currentTime, estimatedDelivery, status, delayThreshold, delayAlertShown, autoAlert, onDelayAlert, orderTime]);

  // 시간 계산 함수
  const calculateElapsedTime = useCallback(() => {
    const elapsed = Math.floor((currentTime.getTime() - orderTime.getTime()) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else if (minutes > 0) {
      return `${minutes}분 ${seconds}초`;
    } else {
      return `${seconds}초`;
    }
  }, [currentTime, orderTime]);

  const calculateRemainingTime = useCallback(() => {
    const remaining = Math.floor((estimatedDelivery.getTime() - currentTime.getTime()) / 1000);
    
    if (remaining <= 0) {
      return { isOverdue: true, display: '지연됨' };
    }

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    let display = '';
    if (hours > 0) {
      display = `${hours}시간 ${minutes}분`;
    } else if (minutes > 0) {
      display = `${minutes}분`;
    } else {
      display = `${seconds}초`;
    }

    return { isOverdue: false, display };
  }, [currentTime, estimatedDelivery]);

  // 아이콘 렌더링
  const renderIcon = (iconType, className) => {
    const icons = {
      clock: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'check-circle': (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      check: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      fire: (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
        </svg>
      ),
      truck: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      location: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    };

    return icons[iconType] || icons.clock;
  };

  // 사이즈별 클래스
  const sizeClasses = {
    sm: {
      container: 'p-3',
      title: 'text-sm',
      time: 'text-lg',
      icon: 'w-4 h-4'
    },
    md: {
      container: 'p-4',
      title: 'text-base',
      time: 'text-xl',
      icon: 'w-5 h-5'
    },
    lg: {
      container: 'p-6',
      title: 'text-lg',
      time: 'text-2xl',
      icon: 'w-6 h-6'
    }
  };

  const currentStatus = statusConfig[status] || statusConfig.pending;
  const elapsedTime = calculateElapsedTime();
  const remainingTime = calculateRemainingTime();
  const sizes = sizeClasses[size];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 ${sizes.container} ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-${currentStatus.color}-100 dark:bg-${currentStatus.color}-900/30`}>
            {renderIcon(currentStatus.icon, `${sizes.icon} text-${currentStatus.color}-600 dark:text-${currentStatus.color}-400`)}
          </div>
          
          <div>
            <h3 className={`${sizes.title} font-bold text-gray-900 dark:text-white`}>
              {currentStatus.label}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentStatus.description}
            </p>
          </div>
        </div>

        {/* 지연 알림 */}
        {isDelayed && (
          <div className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded-full animate-pulse">
            지연
          </div>
        )}
      </div>

      {/* 시간 표시 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* 경과 시간 */}
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            경과 시간
          </div>
          <div className={`${sizes.time} font-bold text-gray-900 dark:text-white`}>
            {elapsedTime}
          </div>
        </div>

        {/* 남은 시간 */}
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {remainingTime.isOverdue ? '지연 시간' : '남은 시간'}
          </div>
          <div className={`${sizes.time} font-bold ${
            remainingTime.isOverdue 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-teal-600 dark:text-teal-400'
          }`}>
            {remainingTime.display}
          </div>
        </div>
      </div>

      {/* 배달 예상 시간 */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
        예상 배달: {format.timeByLocale(estimatedDelivery, language)}
      </div>

      {/* 진행률 바 */}
      <div className="mb-4">
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r ${
              status === 'delivered' 
                ? 'from-emerald-500 to-green-500' 
                : isDelayed 
                  ? 'from-red-500 to-orange-500'
                  : 'from-teal-500 to-emerald-500'
            }`}
            style={{ 
              width: `${Math.min(
                (Object.keys(statusConfig).indexOf(status) + 1) / Object.keys(statusConfig).length * 100, 
                100
              )}%` 
            }}
          />
        </div>
      </div>

      {/* 상태 이력 */}
      {showStatusHistory && statusHistory.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            주문 이력
          </h4>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {statusHistory.map((history, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full bg-${statusConfig[history.status]?.color || 'gray'}-500`} />
                <span className="text-gray-900 dark:text-white font-medium">
                  {statusConfig[history.status]?.label || history.status}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-auto">
                  {format.timeByLocale(history.timestamp, language)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      {onStatusUpdate && status !== 'delivered' && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => onStatusUpdate(status)}
            className="w-full px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-600 transition-all"
          >
            상태 업데이트
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderTimer;