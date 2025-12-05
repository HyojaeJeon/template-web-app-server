/**
 * 에러 폴백 컴포넌트 (점주용)
 * React Error Boundary, WCAG 2.1 준수, Local 테마 적용
 */
'use client';

import React, { Component, useState, useEffect } from 'react';

// Hook 기반 에러 바운더리 (실제로는 클래스 기반이어야 함)
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // 에러 로깅
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 개발 환경에서 콘솔 로그
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReportError = () => {
    if (this.props.onReportError) {
      this.props.onReportError(this.state.error, this.state.errorInfo);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onReportError={this.handleReportError}
          retryCount={this.state.retryCount}
          {...this.props}
        />
      );
    }

    return this.props.children;
  }
}

const ErrorFallback = ({
  error,
  errorInfo,
  onRetry,
  onReportError,
  retryCount = 0,
  maxRetries = 3,
  showErrorDetails = false,
  showReportButton = true,
  showRetryButton = true,
  title = '문제가 발생했습니다',
  message = '예상치 못한 오류가 발생했습니다. 다시 시도해주세요.',
  className = '',
  icon,
  size = 'md', // xs | sm | md | lg | xl
  variant = 'default', // default | minimal | detailed
  ...props
}) => {
  const [showDetails, setShowDetails] = useState(showErrorDetails);
  const [isReporting, setIsReporting] = useState(false);

  // 자동 재시도 (선택사항)
  useEffect(() => {
    if (retryCount < maxRetries && error && onRetry) {
      const autoRetryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // 지수 백오프
      
      const timer = setTimeout(() => {
        if (retryCount < maxRetries) {
          onRetry();
        }
      }, autoRetryDelay);

      return () => clearTimeout(timer);
    }
  }, [error, retryCount, maxRetries, onRetry]);

  // 에러 보고 처리
  const handleReportError = async () => {
    if (!onReportError || isReporting) return;

    setIsReporting(true);
    try {
      await onReportError(error, errorInfo);
      announceToScreenReader('오류 보고가 전송되었습니다');
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
      announceToScreenReader('오류 보고 전송에 실패했습니다');
    } finally {
      setIsReporting(false);
    }
  };

  // 스크린 리더 알림
  const announceToScreenReader = (message) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  // 크기별 스타일
  const getSizeStyles = () => {
    const sizes = {
      xs: {
        container: 'p-4 text-sm',
        icon: 'w-6 h-6',
        title: 'text-base',
        message: 'text-sm',
        button: 'px-3 py-1 text-xs'
      },
      sm: {
        container: 'p-6 text-sm',
        icon: 'w-8 h-8',
        title: 'text-lg',
        message: 'text-sm',
        button: 'px-3 py-2 text-sm'
      },
      md: {
        container: 'p-8 text-base',
        icon: 'w-12 h-12',
        title: 'text-xl',
        message: 'text-base',
        button: 'px-4 py-2 text-sm'
      },
      lg: {
        container: 'p-10 text-lg',
        icon: 'w-16 h-16',
        title: 'text-2xl',
        message: 'text-lg',
        button: 'px-6 py-3 text-base'
      },
      xl: {
        container: 'p-12 text-xl',
        icon: 'w-20 h-20',
        title: 'text-3xl',
        message: 'text-xl',
        button: 'px-8 py-4 text-lg'
      }
    };
    
    return sizes[size] || sizes.md;
  };

  // 기본 아이콘
  const defaultIcon = (
    <svg className="text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const styles = getSizeStyles();

  // 최소 버전 렌더링
  if (variant === 'minimal') {
    return (
      <div
        className={`flex items-center justify-center ${styles.container} ${className}`}
        role="alert"
        aria-live="assertive"
        {...props}
      >
        <div className="text-center">
          <div className={`${styles.icon} mx-auto mb-2`}>
            {icon || defaultIcon}
          </div>
          <p className={`text-gray-600 dark:text-gray-400 ${styles.message} mb-4`}>
            {message}
          </p>
          {showRetryButton && retryCount < maxRetries && onRetry && (
            <button
              onClick={onRetry}
              className={`${styles.button} bg-vietnam-mint text-white rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-2 transition-colors`}
              aria-describedby="error-retry-help"
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 ${className}`}
      role="alert"
      aria-live="assertive"
      {...props}
    >
      <div className={`max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg ${styles.container}`}>
        <div className="text-center">
          {/* 아이콘 */}
          <div className={`${styles.icon} mx-auto mb-6 text-red-500`}>
            {icon || defaultIcon}
          </div>

          {/* 제목 */}
          <h1 className={`${styles.title} font-bold text-gray-900 dark:text-white mb-4`}>
            {title}
          </h1>

          {/* 메시지 */}
          <p className={`text-gray-600 dark:text-gray-400 ${styles.message} mb-6`}>
            {message}
          </p>

          {/* 재시도 정보 */}
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              재시도 횟수: {retryCount}/{maxRetries}
            </p>
          )}

          {/* 액션 버튼들 */}
          <div className="space-y-3">
            {/* 다시 시도 버튼 */}
            {showRetryButton && retryCount < maxRetries && onRetry && (
              <button
                onClick={onRetry}
                className={`w-full ${styles.button} bg-vietnam-mint text-white rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-2 transition-colors`}
                aria-describedby="error-retry-help"
              >
                다시 시도
              </button>
            )}

            {/* 최대 재시도 초과 시 메시지 */}
            {retryCount >= maxRetries && (
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md text-sm">
                최대 재시도 횟수에 도달했습니다. 페이지를 새로고침하거나 관리자에게 문의해주세요.
              </div>
            )}

            {/* 오류 보고 버튼 */}
            {showReportButton && onReportError && (
              <button
                onClick={handleReportError}
                disabled={isReporting}
                className={`w-full ${styles.button} bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                {isReporting ? '보고 중...' : '오류 보고하기'}
              </button>
            )}

            {/* 홈으로 가기 버튼 */}
            <button
              onClick={() => window.location.href = '/'}
              className={`w-full ${styles.button} border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors`}
            >
              홈으로 돌아가기
            </button>
          </div>

          {/* 에러 세부사항 토글 */}
          {variant === 'detailed' && (error || errorInfo) && (
            <div className="mt-6">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:underline"
              >
                {showDetails ? '세부사항 숨기기' : '세부사항 보기'}
              </button>

              {showDetails && (
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md text-left">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    오류 세부사항:
                  </h3>
                  
                  {error && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        에러 메시지:
                      </h4>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-white dark:bg-gray-800 p-2 rounded border overflow-x-auto">
                        {error.toString()}
                      </pre>
                    </div>
                  )}

                  {errorInfo && errorInfo.componentStack && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        컴포넌트 스택:
                      </h4>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-white dark:bg-gray-800 p-2 rounded border overflow-x-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 접근성 도움말 */}
        <div id="error-retry-help" className="sr-only">
          버튼을 클릭하면 페이지를 다시 로드합니다. 문제가 지속되면 관리자에게 문의하세요.
        </div>
      </div>
    </div>
  );
};

// withErrorBoundary HOC
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export { ErrorBoundary };
export default ErrorFallback;