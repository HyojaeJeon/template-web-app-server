'use client';

/**
 * SimplifiedOrderStatus - 4단계 통합 주문 상태 표시 컴포넌트
 * Web/배달웹/모바일앱 통일된 UI
 *
 * 4단계 시스템:
 * - waiting (접수 대기): PENDING
 * - cooking (접수완료/조리중): CONFIRMED, PREPARING
 * - delivering (조리완료/배달중): READY, PICKED_UP, DELIVERING
 * - completed (배달완료): COMPLETED, DELIVERED
 * - rejected (거절됨): CANCELLED, REJECTED
 */

import { useTranslation } from '@/shared/i18n';
import { Clock, ChefHat, Truck, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/shared/utils';

// 4단계 통합 시스템 (Web/배달웹/모바일앱 통일)
const SIMPLIFIED_STEPS = [
  { key: 'waiting', Icon: Clock, color: '#F59E0B', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  { key: 'cooking', Icon: ChefHat, color: '#8B5CF6', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  { key: 'delivering', Icon: Truck, color: '#06B6D4', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
  { key: 'completed', Icon: CheckCircle, color: '#22C55E', bgColor: 'bg-green-100 dark:bg-green-900/30' },
];

// 서버 상태 → 표시 단계 매핑
const getDisplayStep = (serverStatus) => {
  const statusUpper = serverStatus?.toUpperCase();
  switch (statusUpper) {
    case 'PENDING':
      return 0; // waiting
    case 'CONFIRMED':
    case 'PREPARING':
      return 1; // cooking
    case 'READY':
    case 'PICKED_UP':
    case 'DELIVERING':
      return 2; // delivering
    case 'COMPLETED':
    case 'DELIVERED':
      return 3; // completed
    case 'CANCELLED':
    case 'REJECTED':
      return -1; // rejected
    default:
      return 0;
  }
};

export default function SimplifiedOrderStatus({
  status,
  showLabel = true,
  showProgressBar = true,
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'default', // 'default' | 'compact' | 'badge'
  className = '',
}) {
  const { t } = useTranslation();
  const currentStep = getDisplayStep(status);
  const isRejected = currentStep === -1;

  // 크기별 스타일
  const sizeStyles = {
    sm: {
      icon: 'w-4 h-4',
      step: 'w-6 h-6',
      text: 'text-xs',
      gap: 'gap-1',
      bar: 'h-1',
    },
    md: {
      icon: 'w-5 h-5',
      step: 'w-8 h-8',
      text: 'text-sm',
      gap: 'gap-2',
      bar: 'h-1.5',
    },
    lg: {
      icon: 'w-6 h-6',
      step: 'w-10 h-10',
      text: 'text-base',
      gap: 'gap-3',
      bar: 'h-2',
    },
  };

  const sizes = sizeStyles[size] || sizeStyles.md;

  // 거절/취소 상태 표시
  if (isRejected) {
    return (
      <div className={cn('flex items-center', sizes.gap, className)}>
        <div
          className={cn(
            'flex items-center justify-center rounded-full',
            sizes.step,
            'bg-red-100 dark:bg-red-900/30'
          )}
        >
          <XCircle className={cn(sizes.icon, 'text-red-500')} />
        </div>
        {showLabel && (
          <span className={cn(sizes.text, 'font-medium text-red-600 dark:text-red-400')}>
            {t('orders.statusSimplified.rejected')}
          </span>
        )}
      </div>
    );
  }

  // Badge 변형
  if (variant === 'badge') {
    const currentConfig = SIMPLIFIED_STEPS[currentStep];
    const CurrentIcon = currentConfig?.Icon || Clock;

    return (
      <div
        className={cn(
          'inline-flex items-center px-3 py-1.5 rounded-full',
          currentConfig?.bgColor,
          className
        )}
      >
        <CurrentIcon
          className={cn(sizes.icon, 'mr-1.5')}
          style={{ color: currentConfig?.color }}
        />
        <span
          className={cn(sizes.text, 'font-semibold')}
          style={{ color: currentConfig?.color }}
        >
          {t(`orders.statusSimplified.${currentConfig?.key}`)}
        </span>
      </div>
    );
  }

  // Compact 변형
  if (variant === 'compact') {
    const currentConfig = SIMPLIFIED_STEPS[currentStep];
    const CurrentIcon = currentConfig?.Icon || Clock;

    return (
      <div className={cn('flex items-center', sizes.gap, className)}>
        <div
          className={cn(
            'flex items-center justify-center rounded-full',
            sizes.step,
            currentConfig?.bgColor
          )}
        >
          <CurrentIcon
            className={sizes.icon}
            style={{ color: currentConfig?.color }}
          />
        </div>
        {showLabel && (
          <span
            className={cn(sizes.text, 'font-medium')}
            style={{ color: currentConfig?.color }}
          >
            {t(`orders.statusSimplified.${currentConfig?.key}`)}
          </span>
        )}
      </div>
    );
  }

  // Default 변형 - 전체 타임라인 표시
  return (
    <div className={cn('w-full', className)}>
      {/* 4단계 인디케이터 - 아이콘과 라벨 */}
      <div className="flex items-start justify-between w-full">
        {SIMPLIFIED_STEPS.map((step, index) => {
          const StepIcon = step.Icon;
          const isCompleted = index <= currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center">
              {/* 스텝 아이콘 */}
              <div
                className={cn(
                  'flex items-center justify-center rounded-full transition-all duration-300',
                  sizes.step,
                  isCompleted ? step.bgColor : 'bg-gray-100 dark:bg-gray-800',
                  isCurrent && 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
                )}
                style={{
                  ...(isCurrent && { ringColor: step.color }),
                }}
              >
                <StepIcon
                  className={cn(
                    sizes.icon,
                    'transition-colors duration-300',
                    isCompleted ? '' : 'text-gray-400 dark:text-gray-600'
                  )}
                  style={{
                    color: isCompleted ? step.color : undefined,
                  }}
                />
              </div>

              {/* 아이콘 아래 라벨 - 중앙 정렬 */}
              {showLabel && (
                <span
                  className={cn(
                    'mt-1.5 text-center whitespace-nowrap',
                    size === 'sm' ? 'text-[10px]' : 'text-xs',
                    'font-medium transition-colors duration-300',
                    isCompleted ? '' : 'text-gray-400 dark:text-gray-500'
                  )}
                  style={{
                    color: isCompleted ? step.color : undefined,
                  }}
                >
                  {t(`orders.statusSimplified.${step.key}`)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 프로그레스 바 */}
      {showProgressBar && (
        <div className="mt-3">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((currentStep + 1) / SIMPLIFIED_STEPS.length) * 100}%`,
                background: `linear-gradient(to right, ${SIMPLIFIED_STEPS[0].color}, ${SIMPLIFIED_STEPS[currentStep]?.color})`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// 유틸리티 함수 내보내기
export { getDisplayStep, SIMPLIFIED_STEPS };
