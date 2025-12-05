'use client';

import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

/**
 * 페이지 타이틀 컴포넌트 (WCAG 2.1 준수)
 * Local 테마 컬러와 다크모드 지원
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.title - 페이지 제목
 * @param {string} props.subtitle - 부제목
 * @param {Array} props.breadcrumbs - 브레드크럼 배열
 * @param {React.ReactNode} props.actions - 우측 액션 버튼들
 * @param {React.ReactNode} props.icon - 타이틀 아이콘
 * @param {boolean} props.showBreadcrumbs - 브레드크럼 표시 여부
 * @param {string} props.className - 추가 CSS 클래스
 * @param {string} props.size - 타이틀 크기 ('sm' | 'md' | 'lg' | 'xl')
 * @param {boolean} props.center - 중앙 정렬 여부
 */
const PageTitle = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  icon: Icon,
  showBreadcrumbs = true,
  className = '',
  size = 'lg',
  center = false
}) => {
  const sizeClasses = {
    sm: {
      title: 'text-lg sm:text-xl',
      subtitle: 'text-sm',
      icon: 'w-5 h-5'
    },
    md: {
      title: 'text-xl sm:text-2xl',
      subtitle: 'text-sm',
      icon: 'w-6 h-6'
    },
    lg: {
      title: 'text-2xl sm:text-3xl',
      subtitle: 'text-base',
      icon: 'w-7 h-7'
    },
    xl: {
      title: 'text-3xl sm:text-4xl',
      subtitle: 'text-lg',
      icon: 'w-8 h-8'
    }
  };

  const defaultBreadcrumbs = [
    { label: '홈', href: '/dashboard', icon: HomeIcon },
    ...(breadcrumbs || [])
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 브레드크럼 */}
      {showBreadcrumbs && breadcrumbs.length > 0 && (
        <nav className={`flex ${center ? 'justify-center' : ''}`} aria-label="브레드크럼">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            {defaultBreadcrumbs.map((crumb, index) => (
              <li key={index} className="inline-flex items-center">
                {index > 0 && (
                  <ChevronRightIcon 
                    className="w-3 h-3 mx-1 text-slate-400 dark:text-gray-500 rtl:rotate-180" 
                    aria-hidden="true"
                  />
                )}
                
                <div className="flex items-center">
                  {crumb.icon && (
                    <crumb.icon className="w-4 h-4 mr-1.5 text-slate-400 dark:text-gray-500" />
                  )}
                  
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      className="text-sm font-medium text-mint-600 hover:text-mint-700 
                               dark:text-mint-400 dark:hover:text-mint-300 
                               transition-colors duration-200
                               focus:outline-none focus:ring-2 focus:ring-mint-500 
                               dark:focus:ring-mint-400 rounded-md px-1"
                      aria-current={index === defaultBreadcrumbs.length - 1 ? "page" : undefined}
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span 
                      className="text-sm font-medium text-slate-500 dark:text-gray-400"
                      aria-current="page"
                    >
                      {crumb.label}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* 메인 타이틀 섹션 */}
      <div className={`flex ${center ? 'flex-col items-center text-center' : 'items-start justify-between'} 
                      ${center ? 'space-y-4' : 'space-y-2 sm:space-y-0'}`}>
        
        {/* 타이틀과 아이콘 */}
        <div className={`flex-1 ${center ? 'text-center' : ''}`}>
          <div className={`flex items-center ${center ? 'justify-center' : ''} space-x-3 mb-2`}>
            {Icon && (
              <div className="flex-shrink-0">
                <div className="p-2 bg-gradient-to-br from-mint-100 to-green-100 
                              dark:from-mint-900/30 dark:to-green-900/30 
                              rounded-xl border border-mint-200/50 dark:border-mint-800/50">
                  <Icon className={`${sizeClasses[size].icon} text-mint-600 dark:text-mint-400`} />
                </div>
              </div>
            )}
            
            <div>
              <h1 className={`${sizeClasses[size].title} font-bold text-slate-900 dark:text-white 
                             leading-tight tracking-tight`}>
                {title}
              </h1>
            </div>
          </div>

          {subtitle && (
            <p className={`${sizeClasses[size].subtitle} text-slate-600 dark:text-gray-300 
                          leading-relaxed max-w-2xl ${center ? 'mx-auto' : ''}`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* 액션 버튼들 */}
        {actions && (
          <div className={`flex-shrink-0 ${center ? 'mt-6' : ''}`}>
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          </div>
        )}
      </div>

      {/* 구분선 */}
      <div className="border-t border-slate-200/60 dark:border-gray-700/60"></div>
    </div>
  );
};

/**
 * 페이지 헤더 컴포넌트 (타이틀 + 추가 콘텐츠)
 */
export const PageHeader = ({ 
  children,
  className = '',
  padding = true,
  background = true
}) => (
  <header 
    className={`
      ${background ? 'bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm' : ''}
      ${background ? 'border-b border-slate-200/60 dark:border-gray-700/60' : ''}
      ${padding ? 'py-6 px-4 sm:px-6 lg:px-8' : ''}
      ${className}
    `}
    role="banner"
  >
    {children}
  </header>
);

/**
 * 간단한 타이틀 컴포넌트
 */
export const SimpleTitle = ({ 
  title, 
  level = 1,
  className = '',
  gradient = false
}) => {
  const Component = `h${level}`;
  const sizeClasses = {
    1: 'text-3xl sm:text-4xl',
    2: 'text-2xl sm:text-3xl',
    3: 'text-xl sm:text-2xl',
    4: 'text-lg sm:text-xl',
    5: 'text-base sm:text-lg',
    6: 'text-sm sm:text-base'
  };

  return (
    <Component 
      className={`
        ${sizeClasses[level]} 
        font-bold 
        ${gradient 
          ? 'bg-gradient-to-r from-mint-600 to-green-600 dark:from-mint-400 dark:to-green-400 bg-clip-text text-transparent' 
          : 'text-slate-900 dark:text-white'
        }
        ${className}
      `}
    >
      {title}
    </Component>
  );
};

/**
 * 통계가 포함된 페이지 타이틀
 */
export const StatsPageTitle = ({ 
  title, 
  subtitle, 
  stats = [], 
  actions,
  className = ''
}) => (
  <div className={`space-y-6 ${className}`}>
    <PageTitle 
      title={title}
      subtitle={subtitle}
      actions={actions}
    />
    
    {stats.length > 0 && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} 
               className="bg-white dark:bg-gray-800 rounded-lg p-4 
                        border border-slate-200/50 dark:border-gray-700/50
                        shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-gray-400 mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
                {stat.change && (
                  <p className={`text-xs ${
                    stat.change.type === 'increase' 
                      ? 'text-green-600 dark:text-green-400' 
                      : stat.change.type === 'decrease'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-600 dark:text-gray-400'
                  }`}>
                    {stat.change.value} {stat.change.period}
                  </p>
                )}
              </div>
              {stat.icon && (
                <stat.icon className="w-8 h-8 text-mint-600 dark:text-mint-400" />
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default PageTitle;