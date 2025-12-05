/**
 * withError.js - 에러 바운더리 HOC
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 컴포넌트 에러 처리 및 복구
 * - Local어 에러 메시지
 * - 에러 리포팅 및 로깅
 * - 사용자 친화적 에러 UI
 */

'use client'

import { Component } from 'react'

/**
 * 에러 바운더리 클래스 컴포넌트
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })

    // 에러 로깅
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 에러 리포팅 (프로덕션에서)
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo)
    }
  }

  reportError = (error, errorInfo) => {
    try {
      // 에러 리포팅 서비스로 전송 (예: Sentry)
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: error.toString(),
          fatal: false
        })
      }

      // 서버로 에러 로그 전송
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/errors/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: error.toString(),
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {
        // 에러 리포팅 실패는 무시
      })
    } catch (reportingError) {
      console.error('Error reporting failed:', reportingError)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent, showDetails = false } = this.props

      if (FallbackComponent) {
        return (
          <FallbackComponent 
            error={this.state.error} 
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
          />
        )
      }

      return (
        <div className="min-h-[300px] flex items-center justify-center bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-center max-w-md">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Đã xảy ra lỗi
            </h3>
            
            <p className="text-gray-600 mb-4">
              Xin lỗi, có lỗi xảy ra khi tải nội dung. Vui lòng thử lại.
            </p>

            {showDetails && this.state.error && (
              <details className="text-left bg-white p-4 rounded border mb-4">
                <summary className="cursor-pointer font-semibold text-sm text-gray-700 mb-2">
                  Chi tiết lỗi
                </summary>
                <pre className="text-xs text-red-600 whitespace-pre-wrap overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <div className="space-y-2">
              <button
                onClick={this.handleRetry}
                className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
              >
                Thử lại
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Tải lại trang
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 에러 바운더리 HOC
 * @param {React.Component} WrappedComponent 래핑할 컴포넌트
 * @param {Object} options 옵션
 */
export const withError = (WrappedComponent, options = {}) => {
  const {
    fallback = null,
    onError = null,
    onRetry = null,
    showDetails = process.env.NODE_ENV === 'development',
    isolateErrors = true
  } = options

  const ErrorWrappedComponent = (props) => {
    return (
      <ErrorBoundary
        fallback={fallback}
        onError={onError}
        onRetry={onRetry}
        showDetails={showDetails}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }

  ErrorWrappedComponent.displayName = `withError(${WrappedComponent.displayName || WrappedComponent.name})`

  return ErrorWrappedComponent
}

/**
 * 네트워크 에러 HOC
 */
export const withNetworkError = (WrappedComponent, options = {}) => {
  const NetworkErrorFallback = ({ error, onRetry }) => (
    <div className="min-h-[200px] flex items-center justify-center bg-orange-50 border border-orange-200 rounded-lg p-6">
      <div className="text-center">
        <div className="text-orange-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Lỗi kết nối mạng
        </h3>
        <p className="text-gray-600 mb-4">
          Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.
        </p>
        <button
          onClick={onRetry}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Thử kết nối lại
        </button>
      </div>
    </div>
  )

  return withError(WrappedComponent, {
    ...options,
    fallback: NetworkErrorFallback
  })
}

/**
 * 데이터 로딩 에러 HOC
 */
export const withDataError = (WrappedComponent, options = {}) => {
  const DataErrorFallback = ({ error, onRetry }) => (
    <div className="min-h-[200px] flex items-center justify-center bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="text-center">
        <div className="text-blue-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Lỗi tải dữ liệu
        </h3>
        <p className="text-gray-600 mb-4">
          Không thể tải dữ liệu. Vui lòng thử lại sau.
        </p>
        <button
          onClick={onRetry}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Tải lại dữ liệu
        </button>
      </div>
    </div>
  )

  return withError(WrappedComponent, {
    ...options,
    fallback: DataErrorFallback
  })
}

/**
 * Local 특화 에러 HOC
 */
export const withVietnameseError = (WrappedComponent, errorMessages = {}) => {
  const vietnameseErrorMessages = {
    network: 'Lỗi kết nối mạng',
    data: 'Lỗi tải dữ liệu', 
    permission: 'Không có quyền truy cập',
    server: 'Lỗi máy chủ',
    unknown: 'Đã xảy ra lỗi không xác định',
    ...errorMessages
  }

  const VietnameseErrorFallback = ({ error, onRetry }) => {
    const getErrorType = (error) => {
      const message = error?.message?.toLowerCase() || ''
      
      if (message.includes('network') || message.includes('fetch')) {
        return 'network'
      }
      if (message.includes('permission') || message.includes('unauthorized')) {
        return 'permission'
      }
      if (message.includes('server') || message.includes('500')) {
        return 'server'
      }
      if (message.includes('data') || message.includes('json')) {
        return 'data'
      }
      
      return 'unknown'
    }

    const errorType = getErrorType(error)
    const errorMessage = vietnameseErrorMessages[errorType]

    return (
      <div className="min-h-[200px] flex items-center justify-center bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {errorMessage}
          </h3>
          <p className="text-gray-600 mb-4">
            Vui lòng thử lại sau hoặc liên hệ với bộ phận hỗ trợ.
          </p>
          <button
            onClick={onRetry}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return withError(WrappedComponent, {
    fallback: VietnameseErrorFallback
  })
}

export default withError