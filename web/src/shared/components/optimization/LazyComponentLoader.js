'use client'

import React, { lazy, Suspense, memo, useState, useEffect } from 'react'
import { ErrorBoundary } from '../components/ui/feedback'

/**
 * Local App 특화 지연 로딩 컴포넌트 시스템
 * 느린 네트워크 환경과 저사양 모바일 기기를 고려한 최적화
 * 
 * 특징:
 * - 네트워크 상태 기반 적응형 로딩
 * - Local 현지화 컨텍스트 유지
 * - 우아한 에러 처리 및 폴백
 * - WCAG 2.1 접근성 준수
 */

/**
 * 네트워크 품질 감지 유틸리티
 */
const getNetworkQuality = () => {
  if (typeof navigator !== 'undefined' && navigator.connection) {
    const connection = navigator.connection
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    }
  }
  return { effectiveType: '4g', downlink: 10, rtt: 100, saveData: false }
}

/**
 * Local 네트워크 환경을 고려한 로딩 전략
 */
const getLoadingStrategy = () => {
  const network = getNetworkQuality()
  
  if (network.saveData || network.effectiveType === 'slow-2g' || network.effectiveType === '2g') {
    return {
      preloadDistance: 100, // 100px 거리에서 미리 로드
      timeout: 10000, // 10초 타임아웃
      retryCount: 2,
      showDetailedProgress: true
    }
  } else if (network.effectiveType === '3g') {
    return {
      preloadDistance: 200,
      timeout: 7000,
      retryCount: 3,
      showDetailedProgress: true
    }
  }
  
  return {
    preloadDistance: 300,
    timeout: 5000,
    retryCount: 3,
    showDetailedProgress: false
  }
}

/**
 * Local어 로딩 메시지
 */
const LOADING_MESSAGES = {
  vi: {
    loading: 'Đang tải...',
    error: 'Lỗi tải trang. Vui lòng thử lại.',
    retry: 'Thử lại',
    slow: 'Đường truyền chậm, vui lòng đợi...'
  },
  en: {
    loading: 'Loading...',
    error: 'Failed to load. Please try again.',
    retry: 'Retry',
    slow: 'Slow connection, please wait...'
  },
  ko: {
    loading: '로딩 중...',
    error: '로딩에 실패했습니다. 다시 시도해주세요.',
    retry: '다시 시도',
    slow: '느린 연결, 잠시만 기다려주세요...'
  }
}

/**
 * 지연 로딩 스켈레톤 컴포넌트
 */
const LazyLoadingSkeleton = memo(({ 
  type = 'default', 
  lines = 3, 
  className = '' 
}) => {
  const skeletonTypes = {
    card: (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    ),
    list: (
      <div className={`animate-pulse space-y-3 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    ),
    table: (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    ),
    default: (
      <div className={`animate-pulse space-y-3 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        ))}
      </div>
    )
  }
  
  return skeletonTypes[type] || skeletonTypes.default
})

LazyLoadingSkeleton.displayName = 'LazyLoadingSkeleton'

/**
 * 진보된 로딩 인디케이터
 */
const AdvancedLoadingIndicator = memo(({ 
  message = '', 
  progress = 0, 
  locale = 'vi',
  showProgress = false,
  isSlowConnection = false
}) => {
  const messages = LOADING_MESSAGES[locale] || LOADING_MESSAGES.vi
  
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      {/* 메인 로딩 애니메이션 */}
      <div className="relative mb-4">
        <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-700 rounded-full animate-spin">
          <div className="w-full h-full border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
        
        {/* Local 테마 색상 포인트 */}
        <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] rounded-full m-auto animate-pulse"></div>
      </div>
      
      {/* 로딩 메시지 */}
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {message || (isSlowConnection ? messages.slow : messages.loading)}
      </p>
      
      {/* 진행률 표시 */}
      {showProgress && progress > 0 && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>로딩 중</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className="h-1.5 bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* 접근성을 위한 스크린 리더 전용 텍스트 */}
      <span className="sr-only" aria-live="polite">
        {message || messages.loading}
      </span>
    </div>
  )
})

AdvancedLoadingIndicator.displayName = 'AdvancedLoadingIndicator'

/**
 * 에러 폴백 컴포넌트
 */
const LazyLoadErrorFallback = memo(({ 
  error, 
  retry, 
  locale = 'vi',
  componentName = ''
}) => {
  const messages = LOADING_MESSAGES[locale] || LOADING_MESSAGES.vi
  
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
        {componentName ? `${componentName} ` : ''}컴포넌트 로딩 실패
      </h3>
      
      <p className="text-red-600 dark:text-red-400 text-sm mb-4">
        {messages.error}
      </p>
      
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          {messages.retry}
        </button>
      )}
      
      {/* 개발 모드에서만 에러 상세 정보 표시 */}
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mt-4 text-xs text-left">
          <summary className="cursor-pointer text-red-700 dark:text-red-300">
            개발자 정보
          </summary>
          <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded overflow-auto text-red-800 dark:text-red-200">
            {error.stack || error.message}
          </pre>
        </details>
      )}
    </div>
  )
})

LazyLoadErrorFallback.displayName = 'LazyLoadErrorFallback'

/**
 * 메인 지연 로딩 컴포넌트 로더
 */
const LazyComponentLoader = memo(({
  importFunc,
  fallback = null,
  errorFallback = null,
  skeletonType = 'default',
  skeletonLines = 3,
  componentName = '',
  preload = false,
  retryCount = 3,
  timeout = 5000,
  locale = 'vi',
  className = '',
  ...props
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryAttempts, setRetryAttempts] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isSlowConnection, setIsSlowConnection] = useState(false)
  
  // 네트워크 상태 기반 로딩 전략
  const strategy = getLoadingStrategy()
  
  // 지연 로딩 컴포넌트 생성
  const LazyComponent = lazy(() => {
    const startTime = Date.now()
    
    // 진행률 시뮬레이션 (네트워크 상태 기반)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        const increment = strategy.showDetailedProgress ? 
          Math.random() * 15 + 5 : // 5-20% 증가
          Math.random() * 25 + 10   // 10-35% 증가
        return Math.min(prev + increment, 90)
      })
    }, 500)
    
    // 느린 연결 감지
    const slowConnectionTimeout = setTimeout(() => {
      setIsSlowConnection(true)
    }, 2000)
    
    return importFunc()
      .then(module => {
        clearInterval(progressInterval)
        clearTimeout(slowConnectionTimeout)
        setProgress(100)
        setLoading(false)
        
        // 로딩 시간 측정
        const loadTime = Date.now() - startTime
        console.log(`🚀 [${componentName}] 로딩 완료: ${loadTime}ms`)
        
        return module
      })
      .catch(err => {
        clearInterval(progressInterval)
        clearTimeout(slowConnectionTimeout)
        
        if (retryAttempts < retryCount) {
          console.warn(`⚠️ [${componentName}] 로딩 실패, 재시도 중... (${retryAttempts + 1}/${retryCount})`)
          setRetryAttempts(prev => prev + 1)
          setProgress(0)
          setIsSlowConnection(false)
          
          // 재시도 지연 (Local 네트워크 환경 고려)
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              importFunc().then(resolve).catch(reject)
            }, Math.min(1000 * Math.pow(2, retryAttempts), 5000))
          })
        }
        
        setError(err)
        throw err
      })
  })
  
  // 컴포넌트 미리 로드 (필요시)
  useEffect(() => {
    if (preload && !loading && !error) {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'script'
      document.head.appendChild(link)
    }
  }, [preload, loading, error])
  
  // 재시도 핸들러
  const handleRetry = () => {
    setError(null)
    setLoading(true)
    setProgress(0)
    setRetryAttempts(0)
    setIsSlowConnection(false)
  }
  
  // 기본 폴백 컴포넌트
  const defaultFallback = (
    <AdvancedLoadingIndicator
      locale={locale}
      progress={progress}
      showProgress={strategy.showDetailedProgress}
      isSlowConnection={isSlowConnection}
    />
  )
  
  // 기본 에러 폴백 컴포넌트
  const defaultErrorFallback = (
    <LazyLoadErrorFallback
      error={error}
      retry={handleRetry}
      locale={locale}
      componentName={componentName}
    />
  )
  
  return (
    <ErrorBoundary
      fallback={errorFallback || defaultErrorFallback}
      onError={(error, errorInfo) => {
        console.error(`🔥 [${componentName}] 컴포넌트 에러:`, error, errorInfo)
      }}
    >
      <Suspense 
        fallback={fallback || defaultFallback}
      >
        <div className={className} {...props}>
          <LazyComponent />
        </div>
      </Suspense>
    </ErrorBoundary>
  )
})

LazyComponentLoader.displayName = 'LazyComponentLoader'

/**
 * 특정 컴포넌트를 위한 지연 로딩 헬퍼 팩토리
 */
export const createLazyComponent = (importFunc, options = {}) => {
  const {
    fallback,
    errorFallback,
    skeletonType = 'default',
    componentName = 'Unknown',
    timeout = 5000,
    retryCount = 3,
    preload = false,
    ...restOptions
  } = options
  
  return memo((props) => (
    <LazyComponentLoader
      importFunc={importFunc}
      fallback={fallback}
      errorFallback={errorFallback}
      skeletonType={skeletonType}
      componentName={componentName}
      timeout={timeout}
      retryCount={retryCount}
      preload={preload}
      {...restOptions}
      {...props}
    />
  ))
}

/**
 * Local App 주요 페이지 컴포넌트들을 위한 지연 로딩 래퍼
 */
export const LazyDashboard = createLazyComponent(
  () => import('../../../features/dashboard/components/DashboardLayout'),
  {
    componentName: 'Dashboard',
    skeletonType: 'card',
    preload: true
  }
)

export const LazyOrderManagement = createLazyComponent(
  () => import('../../../features/orders/components/OptimizedOrderList'),
  {
    componentName: 'OrderManagement',
    skeletonType: 'list',
    skeletonLines: 5
  }
)

export const LazyMenuManagement = createLazyComponent(
  () => import('../../../features/menu/components/MenuItemList'),
  {
    componentName: 'MenuManagement',
    skeletonType: 'table',
    skeletonLines: 8
  }
)

export const LazyAnalytics = createLazyComponent(
  () => import('../../../features/analytics/components/AnalyticsDashboard'),
  {
    componentName: 'Analytics',
    skeletonType: 'card',
    timeout: 7000 // 분석 페이지는 더 긴 로딩 시간 허용
  }
)

export const LazyChatSystem = createLazyComponent(
  () => import('../../../features/chat/components/StoreChatDetail'),
  {
    componentName: 'ChatSystem',
    skeletonType: 'list',
    preload: false // 채팅은 필요시에만 로드
  }
)

/**
 * 조건부 지연 로딩 훅
 */
export const useConditionalLazyLoad = (condition, importFunc, options = {}) => {
  const [Component, setComponent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    if (condition && !Component) {
      setLoading(true)
      setError(null)
      
      importFunc()
        .then(module => {
          setComponent(() => module.default || module)
          setLoading(false)
        })
        .catch(err => {
          setError(err)
          setLoading(false)
        })
    }
  }, [condition, importFunc, Component])
  
  return { Component, loading, error }
}

export default {
  LazyComponentLoader,
  LazyLoadingSkeleton,
  AdvancedLoadingIndicator,
  LazyLoadErrorFallback,
  createLazyComponent,
  useConditionalLazyLoad,
  // Local App 주요 컴포넌트들
  LazyDashboard,
  LazyOrderManagement,
  LazyMenuManagement,
  LazyAnalytics,
  LazyChatSystem
}