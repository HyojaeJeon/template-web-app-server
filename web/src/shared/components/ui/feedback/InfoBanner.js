'use client'

import { forwardRef, useState } from 'react'

/**
 * InfoBanner - 정보 배너 컴포넌트 (WCAG 2.1 준수)
 * 중요한 정보나 공지사항 표시
 * 다크 테마 지원
 */
const InfoBanner = forwardRef(({
  title,
  message,
  variant = 'info',
  position = 'static',
  dismissible = true,
  showIcon = true,
  actionButton,
  onDismiss,
  className = '',
  children,
  ...props
}, ref) => {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  // 변형별 스타일
  const variantStyles = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: '💡'
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: '⚠️'
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      icon: '✅'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: '❌'
    },
    announcement: {
      bg: 'bg-gradient-to-r from-[#2AC1BC] to-[#00B14F]',
      border: 'border-transparent',
      text: 'text-white',
      icon: '📢'
    }
  }

  const style = variantStyles[variant] || variantStyles.info

  // 위치별 스타일
  const positionStyles = {
    static: '',
    fixed: 'fixed top-0 left-0 right-0 z-50',
    sticky: 'sticky top-0 z-40',
    floating: 'fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-50 shadow-2xl'
  }

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  return (
    <div 
      ref={ref}
      role="region"
      aria-live="polite"
      aria-label={title || '정보 배너'}
      className={`
        ${style.bg}
        ${style.border}
        ${style.text}
        ${positionStyles[position]}
        border
        rounded-xl
        p-4
        transition-all duration-300
        animate-slideDown
        ${className}
      `}
      {...props}
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <span className="text-2xl flex-shrink-0" aria-hidden="true">
            {style.icon}
          </span>
        )}

        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold text-base mb-1">
              {title}
            </h3>
          )}
          {(message || children) && (
            <div className={`${title ? 'text-sm' : ''} break-words`}>
              {message || children}
            </div>
          )}
          {actionButton && (
            <div className="mt-3">
              {actionButton}
            </div>
          )}
        </div>

        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="
              flex-shrink-0
              p-1
              rounded-lg
              hover:bg-black/5
              dark:hover:bg-white/5
              transition-colors
              focus:outline-none
              focus:ring-2
              focus:ring-offset-2
              focus:ring-blue-500
            "
            aria-label="배너 닫기"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
})

// Local App 특화 배너
export const DeliveryInfoBanner = ({ 
  type = 'promotion',
  className = '',
  ...props 
}) => {
  const bannerConfigs = {
    promotion: {
      icon: '🎁',
      title: '오늘의 특별 할인!',
      message: '첫 주문 시 20% 할인 쿠폰을 드립니다',
      bg: 'bg-gradient-to-r from-[#2AC1BC] to-[#00B14F]',
      actionText: '쿠폰 받기'
    },
    delivery: {
      icon: '🏍️',
      title: '빠른 배달 가능 지역',
      message: '현재 위치에서 30분 이내 배달 가능합니다',
      bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      actionText: '주문하기'
    },
    newStore: {
      icon: '🎉',
      title: '신규 입점 매장',
      message: '새로운 맛집이 입점했습니다',
      bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
      actionText: '매장 보기'
    },
    maintenance: {
      icon: '🔧',
      title: '시스템 점검 안내',
      message: '더 나은 서비스를 위해 잠시 점검 중입니다',
      bg: 'bg-gradient-to-r from-gray-600 to-gray-700',
      actionText: null
    }
  }

  const config = bannerConfigs[type] || bannerConfigs.promotion

  return (
    <div 
      className={`
        ${config.bg}
        text-white
        rounded-2xl
        p-6
        shadow-xl
        relative
        overflow-hidden
        ${className}
      `}
      role="region"
      aria-label={config.title}
      {...props}
    >
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-pattern"></div>
      </div>

      <div className="relative z-10 flex items-center gap-4">
        <span className="text-4xl" aria-hidden="true">
          {config.icon}
        </span>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1">
            {config.title}
          </h3>
          <p className="text-white/90">
            {config.message}
          </p>
        </div>
        {config.actionText && (
          <button className="
            bg-white/20
            backdrop-blur
            px-6
            py-2
            rounded-xl
            font-semibold
            hover:bg-white/30
            transition-all
          ">
            {config.actionText}
          </button>
        )}
      </div>
    </div>
  )
}

InfoBanner.displayName = 'InfoBanner'

export default InfoBanner