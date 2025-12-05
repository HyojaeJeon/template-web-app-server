'use client'

import { forwardRef } from 'react'
import { Clock, ChefHat, Truck, CheckCircle, XCircle } from 'lucide-react'
import { useTranslation } from '@/shared/i18n'

/**
 * StatusIndicator - 상태 표시 컴포넌트 (WCAG 2.1 준수)
 * 시스템이나 프로세스의 상태 표시
 * 다크 테마 지원
 */
const StatusIndicator = forwardRef(({
  status = 'idle',
  size = 'md',
  variant = 'dot',
  label,
  showLabel = true,
  pulse = true,
  className = '',
  ...props
}, ref) => {
  // 상태별 스타일
  const statusStyles = {
    online: {
      color: 'bg-green-500',
      pulseColor: 'bg-green-400',
      textColor: 'text-green-600 dark:text-green-400',
      label: '온라인'
    },
    offline: {
      color: 'bg-gray-400',
      pulseColor: 'bg-gray-300',
      textColor: 'text-gray-600 dark:text-gray-400',
      label: '오프라인'
    },
    busy: {
      color: 'bg-yellow-500',
      pulseColor: 'bg-yellow-400',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      label: '바쁨'
    },
    away: {
      color: 'bg-orange-500',
      pulseColor: 'bg-orange-400',
      textColor: 'text-orange-600 dark:text-orange-400',
      label: '자리 비움'
    },
    error: {
      color: 'bg-red-500',
      pulseColor: 'bg-red-400',
      textColor: 'text-red-600 dark:text-red-400',
      label: '오류'
    },
    success: {
      color: 'bg-gradient-to-r from-[#2AC1BC] to-[#00B14F]',
      pulseColor: 'bg-[#2AC1BC]',
      textColor: 'text-[#2AC1BC]',
      label: '성공'
    },
    pending: {
      color: 'bg-blue-500',
      pulseColor: 'bg-blue-400',
      textColor: 'text-blue-600 dark:text-blue-400',
      label: '대기 중'
    },
    idle: {
      color: 'bg-gray-300 dark:bg-gray-600',
      pulseColor: 'bg-gray-200',
      textColor: 'text-gray-500 dark:text-gray-400',
      label: '유휴'
    }
  }

  const style = statusStyles[status] || statusStyles.idle
  const displayLabel = label || style.label

  // 크기별 스타일
  const sizeStyles = {
    xs: { dot: 'w-2 h-2', badge: 'px-1.5 py-0.5 text-xs', icon: 'w-3 h-3' },
    sm: { dot: 'w-2.5 h-2.5', badge: 'px-2 py-0.5 text-xs', icon: 'w-4 h-4' },
    md: { dot: 'w-3 h-3', badge: 'px-2.5 py-1 text-sm', icon: 'w-5 h-5' },
    lg: { dot: 'w-4 h-4', badge: 'px-3 py-1.5 text-base', icon: 'w-6 h-6' },
    xl: { dot: 'w-5 h-5', badge: 'px-4 py-2 text-lg', icon: 'w-8 h-8' }
  }

  const sizeStyle = sizeStyles[size] || sizeStyles.md

  // 점 표시기
  if (variant === 'dot') {
    return (
      <div 
        ref={ref}
        className={`inline-flex items-center gap-2 ${className}`}
        role="status"
        aria-label={displayLabel}
        {...props}
      >
        <span className="relative inline-flex">
          {pulse && status !== 'offline' && status !== 'idle' && (
            <span
              className={`
                animate-ping
                absolute
                inline-flex
                h-full
                w-full
                rounded-full
                opacity-75
                ${style.pulseColor}
              `}
            />
          )}
          <span
            className={`
              relative
              inline-flex
              rounded-full
              ${sizeStyle.dot}
              ${style.color}
            `}
          />
        </span>
        {showLabel && displayLabel && (
          <span className={`${style.textColor} font-medium`}>
            {displayLabel}
          </span>
        )}
      </div>
    )
  }

  // 배지 표시기
  if (variant === 'badge') {
    return (
      <span
        ref={ref}
        className={`
          inline-flex
          items-center
          gap-1.5
          rounded-full
          font-medium
          ${sizeStyle.badge}
          ${style.color}
          text-white
          ${className}
        `}
        role="status"
        aria-label={displayLabel}
        {...props}
      >
        <span className="w-1.5 h-1.5 bg-white rounded-full" />
        {displayLabel}
      </span>
    )
  }

  // 아이콘 표시기
  if (variant === 'icon') {
    const StatusIcon = () => {
      switch (status) {
        case 'success':
          return (
            <svg className={sizeStyle.icon} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )
        case 'error':
          return (
            <svg className={sizeStyle.icon} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )
        case 'pending':
          return (
            <svg className={`${sizeStyle.icon} animate-spin`} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )
        default:
          return (
            <svg className={sizeStyle.icon} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          )
      }
    }

    return (
      <div
        ref={ref}
        className={`inline-flex items-center gap-2 ${className}`}
        role="status"
        aria-label={displayLabel}
        {...props}
      >
        <span className={style.textColor}>
          <StatusIcon />
        </span>
        {showLabel && displayLabel && (
          <span className={`${style.textColor} font-medium`}>
            {displayLabel}
          </span>
        )}
      </div>
    )
  }

  return null
})

/**
 * 서버 상태 → 4단계 통합 상태 매핑
 * - waiting (접수 대기): PENDING
 * - cooking (접수완료/조리중): CONFIRMED, PREPARING
 * - delivering (조리완료/배달중): READY, PICKED_UP, DELIVERING
 * - completed (배달완료): COMPLETED, DELIVERED
 * - rejected (거절됨): CANCELLED, REJECTED
 */
const getSimplifiedStatus = (serverStatus) => {
  const statusUpper = serverStatus?.toUpperCase()
  switch (statusUpper) {
    case 'PENDING':
      return 'waiting'
    case 'CONFIRMED':
    case 'PREPARING':
      return 'cooking'
    case 'READY':
    case 'PICKED_UP':
    case 'DELIVERING':
      return 'delivering'
    case 'COMPLETED':
    case 'DELIVERED':
      return 'completed'
    case 'CANCELLED':
    case 'REJECTED':
      return 'rejected'
    default:
      return 'waiting'
  }
}

// 4단계 통합 상태 설정
const DELIVERY_STATUS_CONFIGS = {
  waiting: {
    Icon: Clock,
    color: '#F59E0B',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-600 dark:text-amber-400'
  },
  cooking: {
    Icon: ChefHat,
    color: '#8B5CF6',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-600 dark:text-purple-400'
  },
  delivering: {
    Icon: Truck,
    color: '#06B6D4',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    textColor: 'text-cyan-600 dark:text-cyan-400'
  },
  completed: {
    Icon: CheckCircle,
    color: '#22C55E',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400'
  },
  rejected: {
    Icon: XCircle,
    color: '#EF4444',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-600 dark:text-red-400'
  }
}

// 크기별 스타일
const DELIVERY_SIZE_STYLES = {
  sm: { icon: 'w-4 h-4', text: 'text-xs', padding: 'px-2 py-1' },
  md: { icon: 'w-5 h-5', text: 'text-sm', padding: 'px-3 py-1.5' },
  lg: { icon: 'w-6 h-6', text: 'text-base', padding: 'px-4 py-2' }
}

// Local App 특화 상태 표시 (4단계 통합 시스템)
export const DeliveryStatusIndicator = ({
  orderStatus = 'pending',
  size = 'md',
  showLabel = true,
  className = '',
  ...props
}) => {
  const { t } = useTranslation()

  // 서버 상태를 4단계 통합 상태로 변환
  const simplifiedStatus = getSimplifiedStatus(orderStatus)
  const config = DELIVERY_STATUS_CONFIGS[simplifiedStatus] || DELIVERY_STATUS_CONFIGS.waiting
  const sizeStyle = DELIVERY_SIZE_STYLES[size] || DELIVERY_SIZE_STYLES.md
  const StatusIcon = config.Icon

  const label = t(`orders.statusSimplified.${simplifiedStatus}`)

  return (
    <div
      className={`
        inline-flex
        items-center
        gap-2
        ${sizeStyle.padding}
        rounded-full
        ${config.bgColor}
        font-medium
        ${className}
      `}
      role="status"
      aria-label={label}
      {...props}
    >
      <StatusIcon
        className={sizeStyle.icon}
        style={{ color: config.color }}
        aria-hidden="true"
      />
      {showLabel && (
        <span
          className={`${sizeStyle.text} font-semibold`}
          style={{ color: config.color }}
        >
          {label}
        </span>
      )}
    </div>
  )
}

// 유틸리티 함수 내보내기
export { getSimplifiedStatus, DELIVERY_STATUS_CONFIGS }

StatusIndicator.displayName = 'StatusIndicator'

export default StatusIndicator