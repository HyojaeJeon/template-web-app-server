'use client'

import { forwardRef, useState, useEffect } from 'react'

/**
 * Stepper - 단계별 진행 컴포넌트 (WCAG 2.1 준수)
 * 여러 단계로 구성된 프로세스 표시
 * 다크 테마 지원
 */
const Stepper = forwardRef(({
  steps = [],
  currentStep = 0,
  orientation = 'horizontal',
  variant = 'default',
  showStepNumber = true,
  showStepLabel = true,
  allowStepClick = false,
  onStepChange,
  className = '',
  ...props
}, ref) => {
  const [activeStep, setActiveStep] = useState(currentStep)

  useEffect(() => {
    setActiveStep(currentStep)
  }, [currentStep])

  const handleStepClick = (stepIndex) => {
    if (allowStepClick && stepIndex <= activeStep) {
      setActiveStep(stepIndex)
      onStepChange?.(stepIndex)
    }
  }

  // 변형별 스타일
  const variantStyles = {
    default: {
      active: 'bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] text-white',
      completed: 'bg-[#00B14F] text-white',
      pending: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
      connector: 'bg-gray-300 dark:bg-gray-600',
      activeConnector: 'bg-gradient-to-r from-[#2AC1BC] to-[#00B14F]'
    },
    minimal: {
      active: 'border-2 border-[#2AC1BC] text-[#2AC1BC]',
      completed: 'bg-[#00B14F] text-white',
      pending: 'border-2 border-gray-300 dark:border-gray-600 text-gray-500',
      connector: 'border-t-2 border-gray-300 dark:border-gray-600',
      activeConnector: 'border-t-2 border-[#00B14F]'
    },
    dots: {
      active: 'bg-[#2AC1BC] scale-125',
      completed: 'bg-[#00B14F]',
      pending: 'bg-gray-300 dark:bg-gray-600',
      connector: 'bg-gray-300 dark:bg-gray-600',
      activeConnector: 'bg-[#00B14F]'
    }
  }

  const style = variantStyles[variant] || variantStyles.default

  const isVertical = orientation === 'vertical'

  const renderStep = (step, index) => {
    const isActive = index === activeStep
    const isCompleted = index < activeStep
    const isPending = index > activeStep
    const isLast = index === steps.length - 1

    const stepStatus = isActive ? 'active' : isCompleted ? 'completed' : 'pending'
    const stepStyle = style[stepStatus]

    return (
      <div
        key={index}
        className={`
          ${isVertical ? 'flex' : 'flex-1 flex flex-col items-center'}
          ${!isLast && !isVertical ? 'relative' : ''}
        `}
      >
        {/* 스텝 */}
        <div
          className={`
            ${isVertical ? 'flex items-start gap-4' : 'flex flex-col items-center'}
            ${!isVertical && !isLast ? 'w-full' : ''}
          `}
        >
          {/* 스텝 인디케이터 */}
          <button
            type="button"
            onClick={() => handleStepClick(index)}
            disabled={!allowStepClick || index > activeStep}
            className={`
              relative
              flex items-center justify-center
              transition-all duration-300
              ${variant === 'dots' 
                ? 'w-3 h-3 rounded-full' 
                : 'w-10 h-10 rounded-full text-sm font-bold'
              }
              ${stepStyle}
              ${allowStepClick && index <= activeStep 
                ? 'cursor-pointer hover:shadow-lg' 
                : 'cursor-default'
              }
              ${isActive ? 'ring-4 ring-[#2AC1BC]/30' : ''}
              focus:outline-none
              focus:ring-4
              focus:ring-[#2AC1BC]/50
            `}
            aria-label={`${step.label || `Step ${index + 1}`} ${
              isCompleted ? '(완료)' : isActive ? '(현재)' : '(대기)'
            }`}
            aria-current={isActive ? 'step' : undefined}
          >
            {variant !== 'dots' && (
              isCompleted ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                showStepNumber && (index + 1)
              )
            )}
          </button>

          {/* 스텝 콘텐츠 */}
          {(showStepLabel || step.description) && variant !== 'dots' && (
            <div className={`
              ${isVertical ? 'flex-1' : 'mt-2 text-center'}
              ${isVertical && !isLast ? 'pb-8' : ''}
            `}>
              {showStepLabel && step.label && (
                <div className={`
                  font-medium
                  ${isActive 
                    ? 'text-[#2AC1BC]' 
                    : isCompleted 
                      ? 'text-gray-700 dark:text-gray-300' 
                      : 'text-gray-500 dark:text-gray-400'
                  }
                `}>
                  {step.label}
                </div>
              )}
              {step.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {step.description}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 연결선 */}
        {!isLast && (
          <div className={`
            ${isVertical 
              ? 'absolute left-5 top-12 bottom-0 w-0.5' 
              : 'absolute top-5 left-[calc(50%+20px)] right-[calc(-50%+20px)] h-0.5'
            }
            ${isCompleted ? style.activeConnector : style.connector}
            transition-all duration-300
          `} />
        )}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      role="group"
      aria-label="진행 단계"
      className={`
        ${isVertical ? 'space-y-0' : 'flex items-start justify-between'}
        ${className}
      `}
      {...props}
    >
      {steps.map(renderStep)}
    </div>
  )
})

// Local App 특화 Stepper
export const DeliveryOrderStepper = ({ 
  orderStatus = 'pending',
  className = '',
  ...props 
}) => {
  const orderSteps = [
    {
      label: '주문 접수',
      description: '주문이 접수되었습니다',
      icon: '📝',
      status: 'pending'
    },
    {
      label: 'POS 확인',
      description: '매장에서 확인 중',
      icon: '✅',
      status: 'confirmed'
    },
    {
      label: '조리 중',
      description: '음식을 준비하고 있습니다',
      icon: '👨‍🍳',
      status: 'preparing'
    },
    {
      label: '준비 완료',
      description: '픽업 대기 중',
      icon: '📦',
      status: 'ready'
    },
    {
      label: '배달 중',
      description: '배달원이 이동 중입니다',
      icon: '🏍️',
      status: 'delivering'
    },
    {
      label: '배달 완료',
      description: '맛있게 드세요!',
      icon: '🎉',
      status: 'delivered'
    }
  ]

  const currentStepIndex = orderSteps.findIndex(step => step.status === orderStatus)

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg ${className}`} {...props}>
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-6">
        주문 진행 상황
      </h3>
      
      <div className="relative">
        {/* 진행 바 배경 */}
        <div className="absolute top-8 left-8 right-8 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
        
        {/* 진행 바 (완료된 부분) */}
        <div 
          className="absolute top-8 left-8 h-1 bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] rounded-full transition-all duration-500"
          style={{ 
            width: `calc(${(currentStepIndex / (orderSteps.length - 1)) * 100}% - 2rem)` 
          }}
        />

        {/* 스텝들 */}
        <div className="relative flex justify-between">
          {orderSteps.map((step, index) => {
            const isActive = index === currentStepIndex
            const isCompleted = index < currentStepIndex
            
            return (
              <div key={index} className="flex flex-col items-center">
                {/* 아이콘 원 */}
                <div className={`
                  relative z-10
                  w-16 h-16 rounded-full
                  flex items-center justify-center
                  text-2xl
                  transition-all duration-300
                  ${isCompleted || isActive
                    ? 'bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700'
                  }
                  ${isActive ? 'ring-4 ring-[#2AC1BC]/30 scale-110' : ''}
                `}>
                  <span aria-hidden="true">{step.icon}</span>
                </div>
                
                {/* 라벨 */}
                <div className="mt-3 text-center">
                  <div className={`
                    text-xs font-medium
                    ${isActive 
                      ? 'text-[#2AC1BC]' 
                      : isCompleted
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-400 dark:text-gray-500'
                    }
                  `}>
                    {step.label}
                  </div>
                  {isActive && step.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// 간단한 Progress Stepper
export const SimpleProgressStepper = ({ 
  totalSteps = 3,
  currentStep = 1,
  className = '',
  ...props 
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`} {...props}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1
        const isActive = stepNumber === currentStep
        const isCompleted = stepNumber < currentStep
        
        return (
          <React.Fragment key={index}>
            <div className={`
              w-8 h-8 rounded-full
              flex items-center justify-center
              text-sm font-bold
              transition-all
              ${isCompleted || isActive
                ? 'bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }
            `}>
              {isCompleted ? '✓' : stepNumber}
            </div>
            {index < totalSteps - 1 && (
              <div className={`
                flex-1 h-0.5
                ${isCompleted 
                  ? 'bg-gradient-to-r from-[#2AC1BC] to-[#00B14F]' 
                  : 'bg-gray-300 dark:bg-gray-600'
                }
              `} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

Stepper.displayName = 'Stepper'

export default Stepper