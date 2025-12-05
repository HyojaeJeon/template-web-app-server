'use client'

import { forwardRef, useState, useEffect } from 'react'
import { MOBILE_COMPONENT_VARIANTS, MOBILE_ANIMATIONS, MOBILE_HEIGHTS } from '../designTokens'

/**
 * FloatingActionButton (FAB) v3.0 - 모바일 최적화 버전
 * 플로팅 액션 버튼 (WCAG 2.1 준수)
 * 주요 작업을 위한 화면 고정 버튼
 * 
 * 모바일 최적화 특징:
 * - 44px 최소 터치 타겟 보장
 * - 배터리 효율적 애니메이션
 * - 줄바꿈 방지 레이아웃
 */
const FloatingActionButton = forwardRef(({
  icon,
  ariaLabel,
  position = 'bottom-right',
  variant = 'primary',
  size = 'md',
  extended = false,
  extendedText = '',
  hideOnScroll = false,
  onClick,
  className = '',
  ...props
}, ref) => {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // 스크롤에 따른 표시/숨김 처리
  useEffect(() => {
    if (!hideOnScroll) return

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY, hideOnScroll])

  // 위치별 클래스
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2'
  }

  // 모바일 최적화 크기별 클래스 (44px 최소 터치 타겟)
  const sizeClasses = {
    sm: extended ? 'h-11 px-4 text-sm min-h-[44px] gap-2 whitespace-nowrap' : 'h-11 w-11 min-h-[44px] min-w-[44px]',
    md: extended ? 'h-14 px-6 text-base min-h-[56px] gap-2.5 whitespace-nowrap' : 'h-14 w-14 min-h-[56px] min-w-[56px]',
    lg: extended ? 'h-16 px-8 text-lg min-h-[64px] gap-3 whitespace-nowrap' : 'h-16 w-16 min-h-[64px] min-w-[64px]'
  }

  // 미세한 그라데이션으로 개선된 변형별 클래스
  const variantClasses = {
    primary: `
      bg-gradient-to-br from-primary/95 via-primary to-primary-dark/95
      text-white
      hover:shadow-2xl hover:shadow-primary/30
      before:absolute before:inset-0 before:rounded-full
      before:bg-gradient-to-br before:from-white/15 before:to-transparent
      before:opacity-0 hover:before:opacity-100
      before:transition-opacity before:duration-300
    `,
    secondary: `
      bg-white border-2 border-primary/40
      text-primary-700
      hover:bg-gradient-to-br hover:from-primary/10 hover:to-secondary/10
      hover:border-primary/60
      shadow-lg hover:shadow-2xl hover:shadow-primary/20
    `,
    danger: `
      bg-gradient-to-br from-red-500/95 via-red-500 to-red-600/95
      text-white
      hover:shadow-2xl hover:shadow-red-500/30
      before:absolute before:inset-0 before:rounded-full
      before:bg-gradient-to-br before:from-white/15 before:to-transparent
      before:opacity-0 hover:before:opacity-100
      before:transition-opacity before:duration-300
    `,
    dark: `
      bg-gradient-to-br from-gray-800/95 via-gray-800 to-gray-900/95
      text-white
      hover:shadow-2xl hover:shadow-gray-900/40
      before:absolute before:inset-0 before:rounded-full
      before:bg-gradient-to-br before:from-white/10 before:to-transparent
      before:opacity-0 hover:before:opacity-100
      before:transition-opacity before:duration-300
    `
  }

  // 아이콘 크기 조정
  const iconSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  if (!ariaLabel) {
    console.warn('FloatingActionButton: ariaLabel is required for accessibility')
  }

  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`
        fixed z-50
        ${positionClasses[position]}
        ${extended ? 'rounded-full' : 'rounded-full'}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        inline-flex items-center justify-center whitespace-nowrap
        font-semibold
        ${MOBILE_ANIMATIONS.normal}
        ${MOBILE_ANIMATIONS.touch}
        transform
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}
        hover:brightness-110 hover:shadow-2xl
        active:brightness-95
        focus-visible:outline-none
        focus-visible:ring-4
        focus-visible:ring-[#2AC1BC]/50
        focus-visible:ring-offset-2
        ${className}
      `}
      {...props}
    >
      {/* 리플 효과를 위한 오버레이 */}
      <span 
        className="absolute inset-0 rounded-full overflow-hidden"
        aria-hidden="true"
      >
        <span className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity" />
      </span>

      {/* 아이콘과 텍스트 - 줄바꿈 방지 */}
      <span className={`relative flex-shrink-0 ${extended ? '' : iconSizeClasses[size]}`}>
        {icon}
      </span>
      {extended && extendedText && (
        <span className="relative font-medium flex-shrink-0 whitespace-nowrap truncate max-w-[120px]">{extendedText}</span>
      )}

      {/* 펄스 애니메이션 (옵션) */}
      {variant === 'primary' && !extended && (
        <span className="absolute inset-0 rounded-full animate-ping bg-[#2AC1BC] opacity-20" aria-hidden="true" />
      )}
    </button>
  )
})

FloatingActionButton.displayName = 'FloatingActionButton'

export default FloatingActionButton