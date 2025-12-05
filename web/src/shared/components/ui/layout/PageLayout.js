/**
 * 공통 페이지 레이아웃 컴포넌트
 * 표준 페이지 헤더, 액션 버튼, 콘텐츠 래퍼 제공
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/shared/components/ui/navigation/Breadcrumb';

/**
 * 실시간 시계 컴포넌트 - 초 단위 업데이트
 *
 * 성능 최적화:
 * - 1초마다 업데이트하되, Date 객체 생성 최소화
 * - 컴포넌트가 unmount되면 interval 정리
 * - 포맷팅 로직 인라인 처리로 함수 호출 오버헤드 제거
 */
const RealtimeClock = React.memo(() => {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    // 1초마다 시간 업데이트
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // cleanup: 컴포넌트 언마운트 시 interval 정리
    return () => clearInterval(timer);
  }, []);

  // 포맷팅을 렌더 시점에 직접 수행 (함수 호출 오버헤드 제거)
  const year = currentTime.getFullYear();
  const month = String(currentTime.getMonth() + 1).padStart(2, '0');
  const day = String(currentTime.getDate()).padStart(2, '0');
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');

  return (
    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 font-mono">
      <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
        <span className="inline-flex items-center gap-2">
          <span className="text-base">🕒</span>
          <span className="font-semibold">
            {year}-{month}-{day}
          </span>
          <span className="text-gray-400 dark:text-gray-500">|</span>
          <span className="font-semibold tabular-nums">
            {hours}:{minutes}:<span className="text-vietnam-mint">{seconds}</span>
          </span>
        </span>
      </span>
    </div>
  );
});

/**
 * 페이지 액션 버튼 컴포넌트
 */
const PageAction = ({ 
  type = 'button', 
  variant = 'primary', 
  size = 'default',
  icon,
  children,
  onClick,
  href,
  disabled = false,
  loading = false,
  className = '',
  ...props 
}) => {
  const router = useRouter();

  // 버튼 크기별 스타일
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    default: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  // 버튼 변형별 스타일
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white border-transparent',
    secondary: 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300',
    success: 'bg-green-600 hover:bg-green-700 text-white border-transparent',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white border-transparent',
    outline: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent'
  };

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg border
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50
    transition-colors duration-200
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }

    if (href) {
      router.push(href);
    } else if (onClick) {
      onClick(e);
    }
  };

  const content = (
    <>
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
    </>
  );

  if (type === 'link' || href) {
    return (
      <button className={baseClasses} onClick={handleClick} {...props}>
        {content}
      </button>
    );
  }

  return (
    <button 
      type={type}
      className={baseClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </button>
  );
};

/**
 * 페이지 헤더 컴포넌트
 */
const PageHeader = ({
  title,
  subtitle,
  description,
  icon,
  badge,
  actions = [],
  breadcrumb,
  backButton = false,
  onBack,
  showRealtimeClock = false,
  className = '',
  children,
  ...props
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 ${className}`} {...props}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 브레드크럼 */}
        {breadcrumb && (
          <div className="py-3 border-b border-gray-100 dark:border-gray-800">
            {Array.isArray(breadcrumb) ? (
              <Breadcrumb items={breadcrumb} showHome={false} />
            ) : (
              breadcrumb
            )}
          </div>
        )}

        <div className="py-6">
          <div className="flex items-start justify-between">
            {/* 좌측: 제목 영역 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                {/* 뒤로가기 버튼 */}
                {backButton && (
                  <button
                    onClick={handleBack}
                    className="mr-4 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
                    aria-label="뒤로 가기"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {/* 아이콘 */}
                {icon && (
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                      <span className="text-primary-600 dark:text-primary-400 text-xl">
                        {icon}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* 제목과 배지 */}
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                      {title}
                    </h1>
                    {badge && (
                      <span className="ml-3 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 rounded-full">
                        {badge}
                      </span>
                    )}
                  </div>

                  {/* 부제목 */}
                  {subtitle && (
                    <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">
                      {subtitle}
                    </p>
                  )}

                  {/* 설명 */}
                  {description && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 우측: 실시간 시계 + 액션 버튼들 */}
            {(showRealtimeClock || actions.length > 0) && (
              <div className="flex items-center space-x-3 ml-6">
                {showRealtimeClock && <RealtimeClock />}
                {actions.map((action, index) => (
                  <PageAction key={index} {...action} />
                ))}
              </div>
            )}
          </div>

          {/* 추가 컨텐츠 */}
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * 콘텐츠 섹션 컴포넌트
 */
const PageSection = ({
  title,
  description,
  headerActions = [],
  variant = 'default', // 'default', 'card', 'bordered'
  className = '',
  children,
  ...props
}) => {
  const variantClasses = {
    default: 'bg-transparent',
    card: 'bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700',
    bordered: 'border border-gray-200 dark:border-gray-700 rounded-lg'
  };

  return (
    <section className={`${variantClasses[variant]} ${className}`} {...props}>
      {/* 섹션 헤더 */}
      {(title || description || headerActions.length > 0) && (
        <div className={`${variant === 'card' ? 'p-6 border-b border-gray-200 dark:border-gray-700' : 'mb-6'}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
            {headerActions.length > 0 && (
              <div className="flex items-center space-x-2 ml-4">
                {headerActions.map((action, index) => (
                  <PageAction key={index} size="sm" {...action} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 섹션 콘텐츠 */}
      <div className={variant === 'card' ? 'p-6' : ''}>
        {children}
      </div>
    </section>
  );
};

/**
 * 메인 페이지 레이아웃 컴포넌트
 */
const PageLayout = ({
  // 헤더 관련
  title,
  subtitle,
  description,
  icon,
  badge,
  headerActions = [],
  breadcrumb,
  backButton = false,
  onBack,
  showRealtimeClock = false,
  
  // 레이아웃 관련
  maxWidth = '7xl', // 'full', '7xl', '6xl', '5xl', '4xl', '3xl', '2xl', 'xl', 'lg'
  padding = true,
  background = 'gray', // 'white', 'gray', 'transparent'
  
  // 기타
  className = '',
  headerClassName = '',
  contentClassName = '',
  children,
  ...props
}) => {
  // 최대 너비 클래스
  const maxWidthClasses = {
    full: 'max-w-full',
    '7xl': 'max-w-7xl',
    '6xl': 'max-w-6xl',
    '5xl': 'max-w-5xl',
    '4xl': 'max-w-4xl',
    '3xl': 'max-w-3xl',
    '2xl': 'max-w-2xl',
    xl: 'max-w-xl',
    lg: 'max-w-lg'
  };

  // 배경 클래스 (Dashboard layout 내부에서는 투명하게 처리)
  const backgroundClasses = {
    white: 'bg-white dark:bg-gray-900',
    gray: 'bg-transparent',
    transparent: 'bg-transparent'
  };

  return (
    <div className={`flex flex-col ${backgroundClasses[background]} ${className}`} {...props}>
      {/* 페이지 헤더 */}
      {(title || headerActions.length > 0) && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          description={description}
          icon={icon}
          badge={badge}
          actions={headerActions}
          breadcrumb={breadcrumb}
          backButton={backButton}
          onBack={onBack}
          showRealtimeClock={showRealtimeClock}
          className={headerClassName}
        />
      )}

      {/* 메인 콘텐츠 */}
      <main role="main" className={`flex-1 ${backgroundClasses[background]}`}>
        <div className={`${maxWidthClasses[maxWidth]} mx-auto w-full ${padding ? 'px-4 sm:px-6 lg:px-8 py-8' : ''} ${contentClassName || ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

// 하위 컴포넌트들을 PageLayout에 첨부
PageLayout.Header = PageHeader;
PageLayout.Section = PageSection;
PageLayout.Action = PageAction;

export { PageLayout, PageHeader, PageSection, PageAction };
export default PageLayout;