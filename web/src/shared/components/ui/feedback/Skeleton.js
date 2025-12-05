'use client'

import { forwardRef } from 'react'

/**
 * Skeleton - 스켈레톤 로더 컴포넌트 (WCAG 2.1 준수)
 * 콘텐츠가 로딩 중일 때 플레이스홀더 표시
 * 다크 테마 지원
 */
const Skeleton = forwardRef(({
  variant = 'text',
  width,
  height,
  count = 1,
  animation = 'pulse',
  rounded = 'md',
  className = '',
  containerClassName = '',
  spacing = 'md',
  children,
  ...props
}, ref) => {
  // 변형별 기본 스타일
  const variantStyles = {
    text: {
      height: 'h-4',
      width: 'w-full',
      rounded: 'rounded'
    },
    title: {
      height: 'h-8',
      width: 'w-3/4',
      rounded: 'rounded'
    },
    avatar: {
      height: 'h-12 w-12',
      width: '',
      rounded: 'rounded-full'
    },
    thumbnail: {
      height: 'h-20 w-20',
      width: '',
      rounded: 'rounded-lg'
    },
    card: {
      height: 'h-48',
      width: 'w-full',
      rounded: 'rounded-xl'
    },
    button: {
      height: 'h-10',
      width: 'w-32',
      rounded: 'rounded-xl'
    },
    input: {
      height: 'h-12',
      width: 'w-full',
      rounded: 'rounded-lg'
    },
    image: {
      height: 'h-64',
      width: 'w-full',
      rounded: 'rounded-xl'
    },
    custom: {
      height: '',
      width: '',
      rounded: ''
    }
  }

  // 애니메이션 클래스
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  }

  // 라운딩 클래스
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full'
  }

  // 간격 클래스
  const spacingClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4'
  }

  // 현재 변형 스타일
  const currentVariant = variantStyles[variant] || variantStyles.text
  const customWidth = width ? `w-[${width}]` : currentVariant.width
  const customHeight = height ? `h-[${height}]` : currentVariant.height
  const customRounded = variant === 'custom' ? roundedClasses[rounded] : currentVariant.rounded

  // 다크 모드 대응 색상
  const baseClasses = `
    bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200
    dark:from-gray-700 dark:via-gray-600 dark:to-gray-700
    relative overflow-hidden
    ${animationClasses[animation]}
  `

  // 웨이브 애니메이션용 스타일
  const waveStyles = animation === 'wave' ? {
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    animation: 'shimmer 2s infinite'
  } : {}

  // 단일 스켈레톤 렌더링
  const renderSkeleton = (key) => (
    <div
      key={key}
      className={`
        ${baseClasses}
        ${customWidth}
        ${customHeight}
        ${customRounded}
        ${className}
      `}
      style={waveStyles}
      role="status"
      aria-live="polite"
      aria-busy="true"
      {...props}
    >
      <span className="sr-only">로딩 중...</span>
      {animation === 'wave' && (
        <div 
          className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
      )}
    </div>
  )

  // children이 있는 경우 (커스텀 스켈레톤 구조)
  if (children) {
    return (
      <div 
        ref={ref}
        className={`${containerClassName}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">로딩 중...</span>
        {children}
      </div>
    )
  }

  // 여러 개 렌더링
  if (count > 1) {
    return (
      <div 
        ref={ref}
        className={`flex flex-col ${spacingClasses[spacing]} ${containerClassName}`}
      >
        {Array.from({ length: count }).map((_, index) => renderSkeleton(index))}
      </div>
    )
  }

  // 단일 렌더링
  return renderSkeleton(0)
})

// 복합 스켈레톤 컴포넌트들
export const SkeletonText = ({ lines = 3, ...props }) => (
  <Skeleton variant="text" count={lines} {...props} />
)

export const SkeletonAvatar = ({ size = 'md', ...props }) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }
  return (
    <Skeleton 
      variant="avatar" 
      className={sizes[size]}
      {...props} 
    />
  )
}

export const SkeletonCard = ({ showAvatar = true, showTitle = true, showText = true, ...props }) => (
  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
    {showAvatar && (
      <div className="flex items-center gap-4 mb-4">
        <SkeletonAvatar />
        <div className="flex-1">
          <Skeleton variant="title" width="60%" className="mb-2" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
    )}
    {showTitle && (
      <Skeleton variant="title" className="mb-3" />
    )}
    {showText && (
      <SkeletonText lines={3} />
    )}
  </div>
)

export const SkeletonTable = ({ rows = 5, cols = 4, ...props }) => (
  <div className="w-full">
    {/* 헤더 */}
    <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} variant="text" className="flex-1" />
      ))}
    </div>
    {/* 행들 */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex gap-4 p-4 border-b dark:border-gray-700">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" className="flex-1" />
        ))}
      </div>
    ))}
  </div>
)

export const SkeletonList = ({ items = 5, showAvatar = true, ...props }) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center gap-4">
        {showAvatar && <SkeletonAvatar size="sm" />}
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="50%" className="opacity-70" />
        </div>
      </div>
    ))}
  </div>
)

// Local App 특화 스켈레톤
export const SkeletonMenuItem = () => (
  <div className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
    <Skeleton variant="thumbnail" className="h-24 w-24" />
    <div className="flex-1 space-y-2">
      <Skeleton variant="title" width="70%" />
      <Skeleton variant="text" width="90%" />
      <div className="flex items-center justify-between mt-3">
        <Skeleton variant="text" width="30%" className="h-6" />
        <Skeleton variant="button" width="80px" />
      </div>
    </div>
  </div>
)

export const SkeletonOrderCard = () => (
  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton variant="text" width="40%" className="h-6" />
      <Skeleton variant="text" width="20%" className="h-6" />
    </div>
    <Skeleton variant="text" width="60%" />
    <SkeletonText lines={2} />
    <div className="flex gap-2 mt-4">
      <Skeleton variant="button" className="flex-1" />
      <Skeleton variant="button" className="flex-1" />
    </div>
  </div>
)

Skeleton.displayName = 'Skeleton'

// 애니메이션 스타일 (globals.css에 추가 필요)
const shimmerAnimation = `
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`

export default Skeleton