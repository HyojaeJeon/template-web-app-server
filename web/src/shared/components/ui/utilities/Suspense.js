/**
 * Suspense 래퍼 컴포넌트
 * React Suspense를 위한 향상된 래퍼
 * WCAG 2.1 준수, 다크테마 지원
 */

import React, { Suspense as ReactSuspense, useState, useEffect } from 'react';

const FALLBACK_VARIANTS = {
  SPINNER: 'spinner',
  SKELETON: 'skeleton',
  MINIMAL: 'minimal',
  CUSTOM: 'custom'
};

// 기본 로딩 스피너
const SpinnerFallback = ({ message = 'Đang tải...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <div 
      className="flex flex-col items-center justify-center p-8 min-h-[200px]"
      role="status"
      aria-label={message}
    >
      <div className={`${sizeClasses[size]} animate-spin`}>
        <svg 
          className="w-full h-full text-[#2AC1BC]" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
        {message}
      </p>
    </div>
  );
};

// 스켈레톤 로더
const SkeletonFallback = ({ rows = 3, showAvatar = false }) => {
  return (
    <div 
      className="animate-pulse p-4 space-y-4"
      role="status"
      aria-label="Đang tải nội dung"
    >
      {showAvatar && (
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-gray-300 dark:bg-gray-700 h-12 w-12" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      )}
      
      {[...Array(rows)].map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
          {index === 0 && <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/6" />}
        </div>
      ))}
    </div>
  );
};

// 미니멀 폴백
const MinimalFallback = ({ message = '...' }) => {
  return (
    <div 
      className="flex items-center justify-center p-4 text-gray-600 dark:text-gray-400"
      role="status"
      aria-label="Đang tải"
    >
      <span className="text-sm animate-pulse">{message}</span>
    </div>
  );
};

const Suspense = ({
  children,
  fallback = null,
  variant = FALLBACK_VARIANTS.SPINNER,
  message = 'Đang tải...',
  minLoadingTime = 0,
  showProgressBar = false,
  onError = null,
  errorFallback = null,
  className = '',
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);

  // 최소 로딩 시간 관리
  useEffect(() => {
    if (minLoadingTime > 0) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, minLoadingTime);

      return () => clearTimeout(timer);
    }
  }, [minLoadingTime]);

  // 프로그레스 바 시뮬레이션
  useEffect(() => {
    if (!showProgressBar) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [showProgressBar]);

  // 에러 핸들러
  const handleError = (error) => {
    setHasError(true);
    if (onError) {
      onError(error);
    }
  };

  // 폴백 컴포넌트 선택
  const getFallbackComponent = () => {
    if (fallback) return fallback;

    switch (variant) {
      case FALLBACK_VARIANTS.SKELETON:
        return <SkeletonFallback />;
      
      case FALLBACK_VARIANTS.MINIMAL:
        return <MinimalFallback message={message} />;
      
      case FALLBACK_VARIANTS.SPINNER:
      default:
        return <SpinnerFallback message={message} />;
    }
  };

  // 에러 폴백
  const getErrorFallback = () => {
    if (errorFallback) return errorFallback;

    return (
      <div 
        className="flex flex-col items-center justify-center p-8 min-h-[200px] text-center"
        role="alert"
      >
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
          Có lỗi xảy ra
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Không thể tải nội dung. Vui lòng thử lại sau.
        </p>
        <button
          onClick={() => {
            setHasError(false);
            window.location.reload();
          }}
          className="bg-[#2AC1BC] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[#2AC1BC] focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  };

  // 에러 상태
  if (hasError) {
    return (
      <div className={className} {...props}>
        {getErrorFallback()}
      </div>
    );
  }

  return (
    <div className={className} {...props}>
      {/* Progress Bar */}
      {showProgressBar && isLoading && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mb-4">
          <div
            className="bg-gradient-to-r from-[#2AC1BC] to-[#00B14F] h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={`Loading progress: ${Math.round(progress)}%`}
          />
        </div>
      )}

      <ReactSuspense fallback={getFallbackComponent()}>
        <ErrorBoundary onError={handleError}>
          {children}
        </ErrorBoundary>
      </ReactSuspense>
    </div>
  );
};

// Error Boundary 컴포넌트
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="flex flex-col items-center justify-center p-8 min-h-[200px] text-center"
          role="alert"
        >
          <div className="text-4xl mb-4">💥</div>
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
            Ứng dụng gặp lỗi
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Có lỗi không mong muốn xảy ra. Chúng tôi đã ghi nhận và sẽ khắc phục sớm.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 사전 정의된 Suspense 변형
export const SpinnerSuspense = (props) => (
  <Suspense variant={FALLBACK_VARIANTS.SPINNER} {...props} />
);

export const SkeletonSuspense = (props) => (
  <Suspense variant={FALLBACK_VARIANTS.SKELETON} {...props} />
);

export const MinimalSuspense = (props) => (
  <Suspense variant={FALLBACK_VARIANTS.MINIMAL} {...props} />
);

// Lazy 컴포넌트를 위한 HOC
export const withSuspense = (Component, suspenseProps = {}) => {
  return React.forwardRef((props, ref) => (
    <Suspense {...suspenseProps}>
      <Component {...props} ref={ref} />
    </Suspense>
  ));
};

// Export constants
export { FALLBACK_VARIANTS };
export default Suspense;