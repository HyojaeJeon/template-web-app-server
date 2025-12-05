'use client'

import React, { Component } from 'react'

/**
 * SafeNavigationButton - Router Context에 의존하지 않는 안전한 네비게이션 버튼
 * usePathname 대신 window.location 사용으로 Context 의존성 제거
 */
const SafeNavigationButton = () => {
  return (
    <button
      onClick={() => {
        // 안전한 네비게이션 - window.location을 사용하여 Context 의존성 제거
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        const targetPath = currentPath.includes('/orders') ? '/dashboard' : '/';
        window.location.href = targetPath;
      }}
      className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400/50"
      aria-label="홈으로 이동"
    >
      홈으로
    </button>
  );
};

/**
 * ErrorBoundary - 에러 바운더리 컴포넌트 (WCAG 2.1 준수)
 * React 컴포넌트 트리의 에러를 포착하고 폴백 UI 표시
 * Local App 테마 적용
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    // 에러 발생 시 상태 업데이트
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // 에러 로깅
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))

    // 에러 리포팅 서비스로 전송 (있는 경우)
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })

    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 폴백 UI가 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo,
          this.handleReset
        )
      }

      // 기본 폴백 UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          showDetails={this.props.showDetails}
          variant={this.props.variant}
          className={this.props.className}
        />
      )
    }

    return this.props.children
  }
}

/**
 * ErrorFallback - 에러 폴백 UI 컴포넌트
 * ErrorBoundary에서 에러 발생 시 표시되는 기본 UI
 */
const ErrorFallback = ({
  error,
  errorInfo,
  onReset,
  showDetails = false,
  variant = 'default',
  className = ''
}) => {
  const [detailsOpen, setDetailsOpen] = React.useState(false)

  // 변형별 스타일
  const variantStyles = {
    default: {
      container: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
      icon: 'text-red-500 dark:text-red-400',
      title: 'text-gray-900 dark:text-white',
      text: 'text-gray-600 dark:text-gray-400'
    },
    minimal: {
      container: 'bg-transparent border-transparent',
      icon: 'text-gray-400 dark:text-gray-500',
      title: 'text-gray-700 dark:text-gray-300',
      text: 'text-gray-500 dark:text-gray-400'
    },
    critical: {
      container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-500',
      title: 'text-red-900 dark:text-red-200',
      text: 'text-red-700 dark:text-red-400'
    },
    branded: {
      container: 'bg-gradient-to-br from-[#2AC1BC]/10 to-[#00B14F]/10 border-[#2AC1BC]/30',
      icon: 'text-[#2AC1BC]',
      title: 'text-gray-900 dark:text-white',
      text: 'text-gray-600 dark:text-gray-400'
    }
  }

  const currentVariant = variantStyles[variant]

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        min-h-[400px] flex items-center justify-center p-8
        ${className}
      `}
    >
      <div className={`
        max-w-md w-full rounded-2xl border-2 p-8 text-center
        ${currentVariant.container}
      `}>
        {/* 에러 아이콘 */}
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6 ${currentVariant.icon}`}>
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* 에러 제목 */}
        <h2 className={`text-2xl font-bold mb-3 ${currentVariant.title}`}>
          문제가 발생했습니다
        </h2>

        {/* 에러 설명 */}
        <p className={`mb-6 ${currentVariant.text}`}>
          예기치 않은 오류가 발생했습니다. 
          불편을 드려 죄송합니다.
        </p>

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onReset}
            className="px-6 py-3 bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] text-white font-medium rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2AC1BC]/50"
            aria-label="다시 시도"
          >
            다시 시도
          </button>
          <SafeNavigationButton />
        </div>

        {/* 에러 상세 정보 (개발 모드) */}
        {showDetails && error && (
          <div className="mt-8">
            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center justify-center mx-auto gap-2"
              aria-expanded={detailsOpen}
              aria-label="에러 상세 정보 토글"
            >
              <span>기술 정보</span>
              <svg 
                className={`w-4 h-4 transform transition-transform ${detailsOpen ? 'rotate-180' : ''}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {detailsOpen && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-left">
                <p className="text-xs font-mono text-red-600 dark:text-red-400 mb-2">
                  {error.toString()}
                </p>
                {errorInfo && errorInfo.componentStack && (
                  <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * withErrorBoundary - HOC로 컴포넌트를 ErrorBoundary로 래핑
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`
  
  return WrappedComponent
}

/**
 * useErrorHandler - 에러 처리 훅
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null)
  
  const resetError = () => setError(null)
  
  const captureError = React.useCallback((error) => {
    setError(error)
  }, [])
  
  // 에러가 있으면 throw
  if (error) {
    throw error
  }
  
  return { captureError, resetError }
}

ErrorBoundary.displayName = 'ErrorBoundary'
ErrorFallback.displayName = 'ErrorFallback'

export default ErrorBoundary