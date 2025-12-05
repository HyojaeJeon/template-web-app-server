'use client'

import { useEffect, useState, forwardRef } from 'react'

/**
 * ProgressBar - 진행 표시줄 컴포넌트 (WCAG 2.1 준수)
 * 단계별/퍼센트 진행 상황 표시
 * 다크 테마 지원
 */
const ProgressBar = forwardRef(({
  value = 0,
  max = 100,
  min = 0,
  variant = 'primary',
  size = 'md',
  showLabel = true,
  labelPosition = 'right',
  labelFormat = 'percent',
  customLabel,
  animated = true,
  striped = false,
  indeterminate = false,
  segments = null,
  className = '',
  barClassName = '',
  ...props
}, ref) => {
  const [displayValue, setDisplayValue] = useState(0)
  
  // 애니메이션 효과
  useEffect(() => {
    if (animated && !indeterminate) {
      const timer = setTimeout(() => {
        setDisplayValue(value)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setDisplayValue(value)
    }
  }, [value, animated, indeterminate])

  // 진행률 계산
  const percentage = Math.min(Math.max(((displayValue - min) / (max - min)) * 100, 0), 100)

  // 크기별 클래스
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4'
  }

  // 변형별 색상 클래스
  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#2AC1BC] to-[#00B14F]',
    secondary: 'bg-gradient-to-r from-gray-500 to-gray-600',
    success: 'bg-gradient-to-r from-green-500 to-green-600',
    warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    danger: 'bg-gradient-to-r from-red-500 to-red-600',
    info: 'bg-gradient-to-r from-blue-500 to-blue-600'
  }

  // 라벨 포맷팅
  const getLabel = () => {
    if (customLabel) return customLabel
    if (labelFormat === 'percent') return `${Math.round(percentage)}%`
    if (labelFormat === 'value') return `${displayValue}/${max}`
    if (labelFormat === 'fraction') return `${displayValue}/${max}`
    return `${Math.round(percentage)}%`
  }

  // 무한 진행 애니메이션
  const indeterminateClasses = indeterminate ? 'animate-progress-indeterminate' : ''

  // 줄무늬 패턴
  const stripedClasses = striped ? 'bg-stripes animate-stripes' : ''

  return (
    <div className={`w-full ${className}`} ref={ref}>
      <div className="flex items-center gap-3">
        {/* 라벨 (왼쪽) */}
        {showLabel && labelPosition === 'left' && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[50px]">
            {getLabel()}
          </span>
        )}

        {/* 진행 바 컨테이너 */}
        <div className="flex-1 relative">
          <div 
            className={`
              w-full bg-gray-200 dark:bg-gray-700 
              rounded-full overflow-hidden
              ${sizeClasses[size]}
            `}
            role="progressbar"
            aria-valuenow={indeterminate ? undefined : displayValue}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-label={props['aria-label'] || '진행 상태'}
            {...props}
          >
            {/* 세그먼트 표시 */}
            {segments && !indeterminate && (
              <div className="absolute inset-0 flex">
                {segments.map((segment, index) => (
                  <div
                    key={index}
                    className="h-full border-r border-white/30 dark:border-gray-900/30"
                    style={{ width: `${segment}%` }}
                  />
                ))}
              </div>
            )}

            {/* 진행 바 */}
            {indeterminate ? (
              <div 
                className={`
                  h-full w-1/3
                  ${variantClasses[variant]}
                  ${indeterminateClasses}
                  rounded-full
                `}
              />
            ) : (
              <div 
                className={`
                  h-full
                  ${variantClasses[variant]}
                  ${stripedClasses}
                  ${barClassName}
                  transition-all duration-500 ease-out
                  rounded-full
                  relative overflow-hidden
                `}
                style={{ width: `${percentage}%` }}
              >
                {/* 광택 효과 */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
              </div>
            )}
          </div>
        </div>

        {/* 라벨 (오른쪽) */}
        {showLabel && labelPosition === 'right' && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[50px] text-right">
            {getLabel()}
          </span>
        )}
      </div>

      {/* 라벨 (상단) */}
      {showLabel && labelPosition === 'top' && (
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getLabel()}
          </span>
        </div>
      )}

      {/* 라벨 (하단) */}
      {showLabel && labelPosition === 'bottom' && (
        <div className="mt-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getLabel()}
          </span>
        </div>
      )}
    </div>
  )
})

// 다단계 진행 바 컴포넌트
export const SteppedProgressBar = ({
  currentStep = 1,
  totalSteps = 4,
  stepLabels = [],
  variant = 'primary',
  showStepNumbers = true,
  className = '',
  ...props
}) => {
  const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100

  return (
    <div className={`w-full ${className}`}>
      {/* 스텝 라벨 */}
      <div className="flex justify-between mb-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep

          return (
            <div 
              key={index}
              className="flex flex-col items-center"
            >
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  text-sm font-semibold transition-all
                  ${isCompleted || isActive 
                    ? 'bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }
                  ${isActive ? 'ring-4 ring-[#2AC1BC]/30 scale-110' : ''}
                `}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  showStepNumbers && stepNumber
                )}
              </div>
              {stepLabels[index] && (
                <span 
                  className={`
                    text-xs mt-1
                    ${isActive 
                      ? 'text-[#2AC1BC] font-semibold' 
                      : 'text-gray-500 dark:text-gray-400'
                    }
                  `}
                >
                  {stepLabels[index]}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* 진행 바 */}
      <div className="relative">
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div 
          className="absolute top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// 원형 진행 바 컴포넌트
export const CircularProgressBar = ({
  value = 0,
  max = 100,
  size = 120,
  strokeWidth = 8,
  variant = 'primary',
  showLabel = true,
  labelFormat = 'percent',
  className = '',
  ...props
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const offset = circumference - (percentage / 100) * circumference

  const variantColors = {
    primary: '#2AC1BC',
    secondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6'
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-700"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* 진행 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={variantColors[variant]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* 라벨 */}
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
            {labelFormat === 'percent' ? `${Math.round(percentage)}%` : value}
          </span>
        </div>
      )}
    </div>
  )
}

// Local App 특화 진행 바
export const DeliveryProgressBar = ({
  status = 'pending',
  className = '',
  ...props
}) => {
  const steps = [
    { key: 'pending', label: '주문 접수', icon: '📝' },
    { key: 'confirmed', label: 'POS 확인', icon: '✅' },
    { key: 'preparing', label: '조리 중', icon: '👨‍🍳' },
    { key: 'ready', label: '준비 완료', icon: '📦' },
    { key: 'delivering', label: '배달 중', icon: '🏍️' },
    { key: 'delivered', label: '배달 완료', icon: '🎉' }
  ]

  const currentIndex = steps.findIndex(step => step.key === status)

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        {/* 진행 라인 */}
        <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700" />
        <div 
          className="absolute top-8 left-0 h-1 bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {/* 스텝 */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentIndex
            const isCompleted = index < currentIndex

            return (
              <div 
                key={step.key}
                className="flex flex-col items-center"
              >
                <div 
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center text-2xl
                    transition-all duration-300
                    ${isCompleted || isActive 
                      ? 'bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] shadow-lg' 
                      : 'bg-gray-100 dark:bg-gray-800'
                    }
                    ${isActive ? 'ring-4 ring-[#2AC1BC]/30 scale-110' : ''}
                  `}
                >
                  {step.icon}
                </div>
                <span 
                  className={`
                    text-xs mt-2 text-center whitespace-nowrap
                    ${isActive 
                      ? 'text-[#2AC1BC] font-bold' 
                      : isCompleted 
                        ? 'text-gray-700 dark:text-gray-300 font-medium' 
                        : 'text-gray-400 dark:text-gray-500'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

ProgressBar.displayName = 'ProgressBar'

export default ProgressBar