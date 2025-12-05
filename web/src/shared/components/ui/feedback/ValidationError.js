'use client'

import { forwardRef, useEffect, useState } from 'react'

/**
 * ValidationError - 유효성 검증 에러 컴포넌트 (WCAG 2.1 준수)
 * 폼 필드의 유효성 검증 에러 표시
 * 다크 테마 지원
 */
const ValidationError = forwardRef(({
  errors = [],
  variant = 'default',
  showIcon = true,
  showBorder = false,
  animate = true,
  position = 'bottom',
  maxErrors = 3,
  className = '',
  ...props
}, ref) => {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (errors.length > 0) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [errors])

  if (!errors || errors.length === 0) return null

  // 변형별 스타일
  const variantClasses = {
    default: 'text-red-600 dark:text-red-400',
    critical: 'text-red-700 dark:text-red-500 font-semibold',
    warning: 'text-yellow-600 dark:text-yellow-400',
    inline: 'text-red-500 dark:text-red-400 text-sm'
  }

  // 위치별 클래스
  const positionClasses = {
    bottom: 'mt-1',
    top: 'mb-1',
    right: 'ml-2 inline-block',
    tooltip: 'absolute z-10 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg shadow-lg'
  }

  // 에러 아이콘
  const ErrorIcon = () => (
    <svg 
      className="w-4 h-4 inline-block mr-1.5 flex-shrink-0"
      fill="currentColor" 
      viewBox="0 0 20 20"
    >
      <path 
        fillRule="evenodd" 
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
        clipRule="evenodd" 
      />
    </svg>
  )

  // 표시할 에러 목록
  const displayErrors = errors.slice(0, maxErrors)
  const remainingCount = errors.length - maxErrors

  return (
    <div 
      ref={ref}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`
        ${variantClasses[variant]}
        ${positionClasses[position]}
        ${showBorder ? 'border border-red-200 dark:border-red-800 rounded-lg p-3' : ''}
        ${animate && isVisible ? 'animate-slideDown' : ''}
        ${className}
      `}
      {...props}
    >
      {displayErrors.length === 1 ? (
        // 단일 에러
        <div className="flex items-start">
          {showIcon && <ErrorIcon />}
          <span className="break-words">{displayErrors[0]}</span>
        </div>
      ) : (
        // 다중 에러
        <div className="space-y-1">
          {displayErrors.map((error, index) => (
            <div key={index} className="flex items-start">
              {showIcon && <ErrorIcon />}
              <span className="break-words">{error}</span>
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="text-sm opacity-75 ml-5">
              외 {remainingCount}개의 추가 오류
            </div>
          )}
        </div>
      )}
    </div>
  )
})

// 필드별 에러 컴포넌트
export const FieldError = ({ 
  error, 
  touched = false,
  className = '',
  ...props 
}) => {
  if (!error || !touched) return null

  return (
    <ValidationError
      errors={[error]}
      variant="inline"
      showIcon={true}
      className={`text-sm ${className}`}
      {...props}
    />
  )
}

// 폼 전체 에러 컴포넌트
export const FormErrors = ({ 
  errors = {}, 
  className = '',
  ...props 
}) => {
  const errorMessages = Object.values(errors).filter(Boolean)
  
  if (errorMessages.length === 0) return null

  return (
    <ValidationError
      errors={errorMessages}
      variant="default"
      showBorder={true}
      className={`mb-4 ${className}`}
      {...props}
    />
  )
}

// 인라인 에러 컴포넌트
export const InlineError = ({ 
  error,
  className = '',
  ...props 
}) => {
  if (!error) return null

  return (
    <span 
      role="alert"
      className={`text-red-500 dark:text-red-400 text-xs ml-2 ${className}`}
      {...props}
    >
      {error}
    </span>
  )
}

// Local App 특화 에러
export const DeliveryValidationError = ({ 
  type = 'address',
  errors = [],
  className = '',
  ...props 
}) => {
  const errorConfigs = {
    address: {
      icon: '📍',
      title: '주소 오류',
      color: 'text-red-600 dark:text-red-400'
    },
    payment: {
      icon: '💳',
      title: '결제 오류',
      color: 'text-red-600 dark:text-red-400'
    },
    order: {
      icon: '📦',
      title: '주문 오류',
      color: 'text-orange-600 dark:text-orange-400'
    },
    delivery: {
      icon: '🏍️',
      title: '배달 오류',
      color: 'text-yellow-600 dark:text-yellow-400'
    }
  }

  const config = errorConfigs[type] || errorConfigs.order

  if (!errors || errors.length === 0) return null

  return (
    <div 
      role="alert"
      className={`
        bg-red-50 dark:bg-red-900/10 
        border-l-4 border-red-500 
        p-4 rounded-r-lg
        ${className}
      `}
      {...props}
    >
      <div className="flex items-start">
        <span className="text-2xl mr-3" aria-hidden="true">
          {config.icon}
        </span>
        <div className="flex-1">
          <h4 className={`font-semibold mb-2 ${config.color}`}>
            {config.title}
          </h4>
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li 
                key={index}
                className="text-sm text-gray-700 dark:text-gray-300 flex items-start"
              >
                <span className="text-red-500 mr-2">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

ValidationError.displayName = 'ValidationError'

export default ValidationError