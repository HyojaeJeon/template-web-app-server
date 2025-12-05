/**
 * 주문 상태 배지 컴포넌트 (점주용) - 4단계 통합 시스템
 * POS 연동 상태 표시, WCAG 2.1 준수, Local 테마 적용
 * i18n 다국어 지원
 *
 * 4단계 시스템:
 * - waiting (접수 대기): PENDING
 * - cooking (접수완료/조리중): CONFIRMED, PREPARING
 * - delivering (조리완료/배달중): READY, PICKED_UP, DELIVERING
 * - completed (배달완료): COMPLETED, DELIVERED
 * - rejected (거절됨): CANCELLED, REJECTED
 */
'use client';

import React from 'react';
import { useTranslation } from '@/shared/i18n';
import { Clock, ChefHat, Truck, CheckCircle, XCircle } from 'lucide-react';

/**
 * 서버 상태 → 4단계 통합 상태 매핑
 */
const getSimplifiedStatus = (serverStatus) => {
  const statusUpper = serverStatus?.toString().toUpperCase();
  switch (statusUpper) {
    case 'PENDING':
    case 'CREATED':
    case 'WAITING':
    case 'RECEIVED':
    case 'NEW':
    case 'PAYMENT_PENDING':
    case 'PAYMENT_COMPLETED':
      return 'waiting';
    case 'CONFIRMED':
    case 'ACCEPTED':
    case 'POS_SENT':
    case 'POS_CONFIRMED':
    case 'PREPARING':
    case 'COOKING':
    case 'IN_PREPARATION':
      return 'cooking';
    case 'READY':
    case 'PREPARED':
    case 'READY_FOR_PICKUP':
    case 'PICKED_UP':
    case 'PICKUP':
    case 'OUT_FOR_DELIVERY':
    case 'DELIVERING':
    case 'IN_DELIVERY':
    case 'ON_THE_WAY':
      return 'delivering';
    case 'COMPLETED':
    case 'DELIVERED':
    case 'DELIVERY_COMPLETED':
    case 'ORDER_COMPLETED':
    case 'FINISHED':
    case 'DONE':
      return 'completed';
    case 'CANCELLED':
    case 'REJECTED':
    case 'FAILED':
    case 'ERROR':
      return 'rejected';
    default:
      return 'waiting';
  }
};

const OrderStatusBadge = ({
  status,
  variant = 'default', // default | detailed | minimal | icon-only
  size = 'md', // xs | sm | md | lg | xl
  showIcon = true,
  showLabel = true,
  showTime = false,
  updatedAt,
  animate = false,
  showPulse = false, // pulse 애니메이션 표시 여부
  onClick,
  className = '',
  customLabels = {},
  customColors = {},
  ...props
}) => {
  const { t } = useTranslation();

  // 4단계 통합 상태 정의
  const statusConfig = {
    waiting: {
      labelKey: 'orders.statusSimplified.waiting',
      descriptionKey: 'orders.status.pendingSubtitle',
      color: '#F59E0B',
      bgColor: 'bg-amber-100 border-amber-200',
      darkColor: 'dark:bg-amber-900/30 dark:border-amber-800',
      textColor: 'text-amber-700 dark:text-amber-300',
      Icon: Clock,
      priority: 0
    },
    cooking: {
      labelKey: 'orders.statusSimplified.cooking',
      descriptionKey: 'orders.status.preparingSubtitle',
      color: '#8B5CF6',
      bgColor: 'bg-purple-100 border-purple-200',
      darkColor: 'dark:bg-purple-900/30 dark:border-purple-800',
      textColor: 'text-purple-700 dark:text-purple-300',
      Icon: ChefHat,
      priority: 1
    },
    delivering: {
      labelKey: 'orders.statusSimplified.delivering',
      descriptionKey: 'orders.status.deliveringSubtitle',
      color: '#06B6D4',
      bgColor: 'bg-cyan-100 border-cyan-200',
      darkColor: 'dark:bg-cyan-900/30 dark:border-cyan-800',
      textColor: 'text-cyan-700 dark:text-cyan-300',
      Icon: Truck,
      priority: 2
    },
    completed: {
      labelKey: 'orders.statusSimplified.completed',
      descriptionKey: 'orders.status.completed',
      color: '#22C55E',
      bgColor: 'bg-green-100 border-green-200',
      darkColor: 'dark:bg-green-900/30 dark:border-green-800',
      textColor: 'text-green-700 dark:text-green-300',
      Icon: CheckCircle,
      priority: 3
    },
    rejected: {
      labelKey: 'orders.statusSimplified.rejected',
      descriptionKey: 'orders.status.cancelled',
      color: '#EF4444',
      bgColor: 'bg-red-100 border-red-200',
      darkColor: 'dark:bg-red-900/30 dark:border-red-800',
      textColor: 'text-red-700 dark:text-red-300',
      Icon: XCircle,
      priority: -1
    }
  };

  // 서버 상태를 4단계 통합 상태로 변환
  const simplifiedStatus = getSimplifiedStatus(status);

  // 설정 병합 및 번역 적용
  const config = statusConfig[simplifiedStatus] || statusConfig.waiting;
  const translatedLabel = t(config.labelKey, config.labelKey.split('.').pop());
  const translatedDescription = t(config.descriptionKey, '');
  const finalConfig = {
    ...config,
    label: customLabels[status] || translatedLabel,
    description: translatedDescription
  };

  // 크기별 스타일
  const getSizeStyles = () => {
    const sizes = {
      xs: {
        padding: 'px-2 py-0.5',
        text: 'text-xs',
        icon: 'w-3 h-3'
      },
      sm: {
        padding: 'px-2.5 py-1',
        text: 'text-xs',
        icon: 'w-3.5 h-3.5'
      },
      md: {
        padding: 'px-3 py-1.5',
        text: 'text-sm',
        icon: 'w-4 h-4'
      },
      lg: {
        padding: 'px-4 py-2',
        text: 'text-base',
        icon: 'w-5 h-5'
      },
      xl: {
        padding: 'px-6 py-3',
        text: 'text-lg',
        icon: 'w-6 h-6'
      }
    };
    
    return sizes[size] || sizes.md;
  };

  // 시간 포맷팅
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}시간 전`;
    return date.toLocaleDateString();
  };

  const sizeStyles = getSizeStyles();

  // animate 또는 showPulse가 true이면 애니메이션 적용
  const shouldAnimate = animate || showPulse;

  const StatusIcon = finalConfig.Icon;

  // 아이콘만 표시
  if (variant === 'icon-only') {
    return (
      <div
        className={`
          inline-flex items-center justify-center rounded-full border
          ${finalConfig.bgColor} ${finalConfig.darkColor}
          ${sizeStyles.padding} ${shouldAnimate ? 'animate-pulse' : ''}
          ${onClick ? 'cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-1' : ''}
          ${className}
        `}
        onClick={onClick}
        role={onClick ? 'button' : 'status'}
        aria-label={`주문 상태: ${finalConfig.label}. ${finalConfig.description}`}
        title={finalConfig.description}
        {...props}
      >
        <StatusIcon className={sizeStyles.icon} style={{ color: finalConfig.color }} />
      </div>
    );
  }

  // 최소 버전
  if (variant === 'minimal') {
    return (
      <span
        className={`
          inline-flex items-center rounded-full font-medium
          ${finalConfig.bgColor} ${finalConfig.darkColor} ${finalConfig.textColor}
          ${sizeStyles.padding} ${sizeStyles.text}
          ${shouldAnimate ? 'animate-pulse' : ''}
          ${onClick ? 'cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-1' : ''}
          ${className}
        `}
        onClick={onClick}
        role={onClick ? 'button' : 'status'}
        aria-label={`주문 상태: ${finalConfig.label}`}
        {...props}
      >
        {finalConfig.label}
      </span>
    );
  }

  // 상세 버전
  if (variant === 'detailed') {
    return (
      <div
        className={`
          inline-flex flex-col items-center p-3 rounded-lg border
          ${finalConfig.bgColor} ${finalConfig.darkColor}
          ${shouldAnimate ? 'animate-pulse' : ''}
          ${onClick ? 'cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-1' : ''}
          ${className}
        `}
        onClick={onClick}
        role={onClick ? 'button' : 'status'}
        aria-label={`주문 상태: ${finalConfig.label}. ${finalConfig.description}`}
        {...props}
      >
        <div className="flex items-center space-x-2 mb-1">
          {showIcon && <StatusIcon className={sizeStyles.icon} style={{ color: finalConfig.color }} />}
          {showLabel && (
            <span className={`font-semibold ${sizeStyles.text}`} style={{ color: finalConfig.color }}>
              {finalConfig.label}
            </span>
          )}
        </div>

        <p className="text-xs text-center opacity-80 mb-1">
          {finalConfig.description}
        </p>

        {showTime && updatedAt && (
          <span className="text-xs opacity-60">
            {formatTime(updatedAt)}
          </span>
        )}
      </div>
    );
  }

  // 기본 버전
  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${finalConfig.bgColor} ${finalConfig.darkColor}
        ${sizeStyles.padding} ${sizeStyles.text}
        ${shouldAnimate ? 'animate-pulse' : ''}
        ${onClick ? 'cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-1' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : 'status'}
      aria-label={`주문 상태: ${finalConfig.label}. ${finalConfig.description}`}
      title={finalConfig.description}
      {...props}
    >
      {showIcon && (
        <span className="mr-2">
          <StatusIcon className={sizeStyles.icon} style={{ color: finalConfig.color }} />
        </span>
      )}

      {showLabel && (
        <span style={{ color: finalConfig.color }}>
          {finalConfig.label}
        </span>
      )}

      {showTime && updatedAt && (
        <span className="ml-2 text-xs opacity-75">
          {formatTime(updatedAt)}
        </span>
      )}
    </span>
  );
};

// 4단계 통합 상태 진행도 표시 컴포넌트
const SIMPLIFIED_STEPS = [
  { key: 'waiting', Icon: Clock, color: '#F59E0B', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  { key: 'cooking', Icon: ChefHat, color: '#8B5CF6', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  { key: 'delivering', Icon: Truck, color: '#06B6D4', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
  { key: 'completed', Icon: CheckCircle, color: '#22C55E', bgColor: 'bg-green-100 dark:bg-green-900/30' },
];

export const OrderStatusProgress = ({
  currentStatus,
  className = '',
  showLabels = true,
  size = 'md',
  orientation = 'horizontal', // horizontal | vertical
  ...props
}) => {
  const { t } = useTranslation();

  // 현재 상태의 단계 인덱스
  const simplifiedStatus = getSimplifiedStatus(currentStatus);
  const currentStepIndex = SIMPLIFIED_STEPS.findIndex(s => s.key === simplifiedStatus);
  const isRejected = simplifiedStatus === 'rejected';

  // 크기별 스타일
  const sizeStyles = {
    sm: { icon: 'w-4 h-4', step: 'w-7 h-7', text: 'text-xs', bar: 'h-0.5' },
    md: { icon: 'w-5 h-5', step: 'w-9 h-9', text: 'text-sm', bar: 'h-1' },
    lg: { icon: 'w-6 h-6', step: 'w-11 h-11', text: 'text-base', bar: 'h-1.5' }
  };
  const sizeStyle = sizeStyles[size] || sizeStyles.md;

  // 거절 상태
  if (isRejected) {
    return (
      <div className={`flex items-center gap-2 ${className}`} role="status" aria-label={t('orders.statusSimplified.rejected')} {...props}>
        <div className={`flex items-center justify-center rounded-full ${sizeStyle.step} bg-red-100 dark:bg-red-900/30`}>
          <XCircle className={`${sizeStyle.icon} text-red-500`} />
        </div>
        {showLabels && (
          <span className={`${sizeStyle.text} font-medium text-red-600 dark:text-red-400`}>
            {t('orders.statusSimplified.rejected')}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${orientation === 'vertical' ? 'flex flex-col space-y-3' : 'flex items-center justify-between w-full'} ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={SIMPLIFIED_STEPS.length - 1}
      aria-valuenow={currentStepIndex}
      aria-label={t('orders.statusHistory', 'Order Progress')}
      {...props}
    >
      {SIMPLIFIED_STEPS.map((step, index) => {
        const StepIcon = step.Icon;
        const isCompleted = index <= currentStepIndex;
        const isCurrent = index === currentStepIndex;

        return (
          <div key={step.key} className={`flex ${orientation === 'vertical' ? 'flex-row items-center' : 'flex-1 items-center'}`}>
            {/* 스텝 아이콘 */}
            <div
              className={`
                flex items-center justify-center rounded-full transition-all duration-300
                ${sizeStyle.step}
                ${isCompleted ? step.bgColor : 'bg-gray-100 dark:bg-gray-800'}
                ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''}
              `}
              style={isCurrent ? { '--tw-ring-color': step.color } : undefined}
            >
              <StepIcon
                className={`${sizeStyle.icon} transition-colors duration-300`}
                style={{ color: isCompleted ? step.color : '#9CA3AF' }}
              />
            </div>

            {/* 연결 선 (가로 모드) */}
            {orientation === 'horizontal' && index < SIMPLIFIED_STEPS.length - 1 && (
              <div className="flex-1 mx-2">
                <div
                  className={`${sizeStyle.bar} rounded-full transition-all duration-500`}
                  style={{
                    background: index < currentStepIndex
                      ? `linear-gradient(to right, ${step.color}, ${SIMPLIFIED_STEPS[index + 1].color})`
                      : '#E5E7EB'
                  }}
                />
              </div>
            )}

            {/* 연결 선 (세로 모드) */}
            {orientation === 'vertical' && index < SIMPLIFIED_STEPS.length - 1 && (
              <div
                className={`w-0.5 h-6 ml-4 rounded-full transition-all duration-500`}
                style={{
                  background: index < currentStepIndex ? step.color : '#E5E7EB'
                }}
              />
            )}

            {/* 라벨 (세로 모드에서만) */}
            {orientation === 'vertical' && showLabels && (
              <span
                className={`ml-3 ${sizeStyle.text} font-medium transition-colors duration-300`}
                style={{ color: isCompleted ? step.color : '#9CA3AF' }}
              >
                {t(`orders.statusSimplified.${step.key}`)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// 유틸리티 함수 내보내기
export { getSimplifiedStatus, SIMPLIFIED_STEPS };

export default OrderStatusBadge;