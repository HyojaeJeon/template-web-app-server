'use client'

import { forwardRef, useEffect, useState } from 'react'

/**
 * SuccessMessage - 성공 메시지 컴포넌트 (WCAG 2.1 준수)
 * 작업 성공 시 표시되는 메시지
 * 다크 테마 지원
 */
const SuccessMessage = forwardRef(({
  message,
  title,
  variant = 'default',
  showIcon = true,
  dismissible = false,
  autoHide = false,
  autoHideDelay = 5000,
  onDismiss,
  className = '',
  children,
  ...props
}, ref) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoHide && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onDismiss?.()
      }, autoHideDelay)
      return () => clearTimeout(timer)
    }
  }, [autoHide, autoHideDelay, isVisible, onDismiss])

  if (!isVisible || (!message && !children)) return null

  // 변형별 스타일
  const variantStyles = {
    default: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    solid: 'bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] text-white',
    minimal: 'bg-transparent text-green-600 dark:text-green-400',
    toast: 'bg-white dark:bg-gray-800 shadow-lg border border-green-200 dark:border-green-700'
  }

  // 성공 아이콘
  const SuccessIcon = () => (
    <svg 
      className="w-5 h-5 flex-shrink-0"
      fill="currentColor" 
      viewBox="0 0 20 20"
    >
      <path 
        fillRule="evenodd" 
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
        clipRule="evenodd" 
      />
    </svg>
  )

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  return (
    <div 
      ref={ref}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`
        relative
        rounded-xl
        p-4
        border
        transition-all duration-300
        ${variantStyles[variant]}
        ${isVisible ? 'animate-slideDown' : 'animate-slideUp'}
        ${className}
      `}
      {...props}
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <span className={variant === 'solid' ? 'text-white' : 'text-green-500 dark:text-green-400'}>
            <SuccessIcon />
          </span>
        )}
        
        <div className="flex-1">
          {title && (
            <h4 className="font-semibold mb-1">
              {title}
            </h4>
          )}
          {(message || children) && (
            <div className={title ? 'text-sm' : ''}>
              {message || children}
            </div>
          )}
        </div>

        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="ml-auto -mr-1 -mt-1 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="닫기"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
})

// 인라인 성공 메시지
export const InlineSuccess = ({ message, className = '', ...props }) => {
  if (!message) return null
  
  return (
    <span 
      role="status"
      className={`text-green-600 dark:text-green-400 text-sm inline-flex items-center gap-1 ${className}`}
      {...props}
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      {message}
    </span>
  )
}

// Local App 특화 성공 메시지
export const DeliverySuccessMessage = ({ 
  type = 'order',
  message,
  details,
  className = '',
  ...props 
}) => {
  const configs = {
    order: {
      icon: '✅',
      title: '주문 완료!',
      color: 'from-[#2AC1BC] to-[#00B14F]'
    },
    payment: {
      icon: '💳',
      title: '결제 성공!',
      color: 'from-green-500 to-green-600'
    },
    delivery: {
      icon: '🏍️',
      title: '배달 완료!',
      color: 'from-[#00B14F] to-green-600'
    },
    review: {
      icon: '⭐',
      title: '리뷰 감사합니다!',
      color: 'from-yellow-400 to-orange-400'
    }
  }

  const config = configs[type] || configs.order

  return (
    <div 
      className={`
        bg-gradient-to-r ${config.color}
        text-white
        rounded-2xl
        p-6
        shadow-xl
        ${className}
      `}
      role="status"
      aria-live="polite"
      {...props}
    >
      <div className="flex items-start gap-4">
        <span className="text-4xl" aria-hidden="true">
          {config.icon}
        </span>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">
            {config.title}
          </h3>
          {message && (
            <p className="text-white/90 mb-3">
              {message}
            </p>
          )}
          {details && (
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-sm">
              {details}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

SuccessMessage.displayName = 'SuccessMessage'

export default SuccessMessage