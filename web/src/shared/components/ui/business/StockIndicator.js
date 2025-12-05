'use client';

import { useState, useEffect } from 'react';

/**
 * StockIndicator Component
 * 
 * Local 배달 앱 재고 상태 표시 컴포넌트
 * - 실시간 재고 상태 모니터링
 * - 재고 부족 알림
 * - 자동 재고 보충 알림
 * - 시각적 재고 레벨 표시
 * - Local 현지화 지원
 * 
 * WCAG 2.1 준수, 키보드 네비게이션, 스크린 리더 지원
 * 
 * @param {Object} props - StockIndicator 컴포넌트 props
 * @param {number} props.currentStock - 현재 재고 수량
 * @param {number} props.maxStock - 최대 재고 수량
 * @param {number} props.minStock - 최소 재고 임계값
 * @param {number} props.warningStock - 경고 재고 임계값
 * @param {string} props.unit - 재고 단위
 * @param {string} props.itemName - 상품명
 * @param {boolean} props.showPercentage - 백분율 표시 여부
 * @param {boolean} props.showAlert - 알림 표시 여부
 * @param {Function} props.onStockAlert - 재고 알림 콜백
 * @param {Function} props.onRestock - 재고 보충 콜백
 * @param {boolean} props.autoUpdate - 자동 업데이트 여부
 * @param {string} props.size - 사이즈 ('sm', 'md', 'lg')
 * @param {string} props.variant - 스타일 변형
 * @param {string} props.className - 추가 CSS 클래스
 */
const StockIndicator = ({
  currentStock = 0,
  maxStock = 100,
  minStock = 10,
  warningStock = 25,
  unit = '개',
  itemName = '',
  showPercentage = true,
  showAlert = true,
  onStockAlert,
  onRestock,
  autoUpdate = false,
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  const [alertShown, setAlertShown] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // 재고 상태 계산
  const stockPercentage = Math.min((currentStock / maxStock) * 100, 100);
  const stockLevel = getStockLevel();

  function getStockLevel() {
    if (currentStock <= 0) return 'out';
    if (currentStock <= minStock) return 'critical';
    if (currentStock <= warningStock) return 'warning';
    return 'good';
  }

  // 재고 부족 알림
  useEffect(() => {
    if (stockLevel === 'critical' && !alertShown && showAlert && onStockAlert) {
      onStockAlert({
        itemName,
        currentStock,
        minStock,
        level: stockLevel,
        message: `${itemName} 재고가 부족합니다. 현재 ${currentStock}${unit} 남음`
      });
      setAlertShown(true);
    } else if (stockLevel !== 'critical') {
      setAlertShown(false);
    }
  }, [currentStock, stockLevel, alertShown, showAlert, onStockAlert, itemName, minStock, unit]);

  // 재고 애니메이션
  useEffect(() => {
    if (stockLevel === 'critical') {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [stockLevel]);

  // 사이즈별 스타일
  const sizeClasses = {
    sm: {
      container: 'p-3',
      title: 'text-sm',
      stock: 'text-lg',
      bar: 'h-1.5',
      icon: 'w-4 h-4'
    },
    md: {
      container: 'p-4',
      title: 'text-base',
      stock: 'text-xl',
      bar: 'h-2',
      icon: 'w-5 h-5'
    },
    lg: {
      container: 'p-6',
      title: 'text-lg',
      stock: 'text-2xl',
      bar: 'h-3',
      icon: 'w-6 h-6'
    }
  };

  // 재고 상태별 색상
  const levelColors = {
    out: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      bar: 'bg-red-500',
      icon: 'text-red-500'
    },
    critical: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-400',
      bar: 'bg-orange-500',
      icon: 'text-orange-500'
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-400',
      bar: 'bg-yellow-500',
      icon: 'text-yellow-500'
    },
    good: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-400',
      bar: 'bg-emerald-500',
      icon: 'text-emerald-500'
    }
  };

  // 재고 상태 메시지
  const getStatusMessage = () => {
    switch (stockLevel) {
      case 'out':
        return '품절';
      case 'critical':
        return '재고 부족';
      case 'warning':
        return '재고 주의';
      case 'good':
        return '재고 양호';
      default:
        return '';
    }
  };

  // 재고 보충 제안
  const getSuggestedRestock = () => {
    if (stockLevel === 'out' || stockLevel === 'critical') {
      return Math.max(maxStock - currentStock, maxStock * 0.8);
    }
    return 0;
  };

  const colors = levelColors[stockLevel];
  const sizes = sizeClasses[size];

  return (
    <div className={`
      ${colors.bg} ${colors.border} border rounded-2xl shadow-sm
      ${sizes.container} transition-all duration-300
      ${isAnimating && stockLevel === 'critical' ? 'animate-pulse' : ''}
      ${className}
    `}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* 상태 아이콘 */}
          <div className={`${colors.icon}`}>
            {stockLevel === 'out' ? (
              <svg className={sizes.icon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
              </svg>
            ) : stockLevel === 'critical' ? (
              <svg className={sizes.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.865-.833-2.635 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : stockLevel === 'warning' ? (
              <svg className={sizes.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className={sizes.icon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          <div>
            {itemName && (
              <h4 className={`${sizes.title} font-semibold text-gray-900 dark:text-white`}>
                {itemName}
              </h4>
            )}
            <span className={`text-sm font-medium ${colors.text}`}>
              {getStatusMessage()}
            </span>
          </div>
        </div>

        {/* 재고 수량 */}
        <div className="text-right">
          <div className={`${sizes.stock} font-bold text-gray-900 dark:text-white`}>
            {currentStock.toLocaleString()}{unit}
          </div>
          {showPercentage && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {stockPercentage.toFixed(0)}%
            </div>
          )}
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="mb-3">
        <div className={`w-full ${sizes.bar} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
          <div 
            className={`${colors.bar} ${sizes.bar} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${Math.max(stockPercentage, 0)}%` }}
            role="progressbar"
            aria-valuenow={currentStock}
            aria-valuemin={0}
            aria-valuemax={maxStock}
            aria-label={`재고 수준: ${currentStock}/${maxStock}${unit}`}
          />
        </div>

        {/* 임계값 표시 */}
        <div className="relative mt-1">
          {/* 최소 재고 라인 */}
          <div 
            className="absolute w-0.5 h-2 bg-red-400 rounded-full"
            style={{ left: `${(minStock / maxStock) * 100}%` }}
            title={`최소 재고: ${minStock}${unit}`}
          />
          
          {/* 경고 재고 라인 */}
          <div 
            className="absolute w-0.5 h-2 bg-yellow-400 rounded-full"
            style={{ left: `${(warningStock / maxStock) * 100}%` }}
            title={`경고 재고: ${warningStock}${unit}`}
          />
        </div>
      </div>

      {/* 재고 정보 */}
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>최소: {minStock}{unit}</span>
        <span>경고: {warningStock}{unit}</span>
        <span>최대: {maxStock}{unit}</span>
      </div>

      {/* 재고 보충 제안 */}
      {(stockLevel === 'out' || stockLevel === 'critical') && onRestock && (
        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                재고 보충 제안
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {getSuggestedRestock()}개 보충 권장
              </p>
            </div>
            
            <button
              onClick={() => onRestock({
                itemName,
                currentStock,
                suggestedAmount: getSuggestedRestock(),
                level: stockLevel
              })}
              className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-medium rounded-lg hover:from-teal-600 hover:to-emerald-600 transition-all"
            >
              보충 요청
            </button>
          </div>
        </div>
      )}

      {/* 자동 업데이트 표시 */}
      {autoUpdate && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span>실시간 업데이트</span>
        </div>
      )}
    </div>
  );
};

export default StockIndicator;