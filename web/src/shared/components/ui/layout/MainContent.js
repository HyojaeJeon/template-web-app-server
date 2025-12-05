'use client';

/**
 * 메인 콘텐츠 컴포넌트 (WCAG 2.1 준수)
 * Local 테마 컬러와 다크모드 지원
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {React.ReactNode} props.children - 메인 콘텐츠
 * @param {string} props.className - 추가 CSS 클래스
 * @param {boolean} props.hasSidebar - 사이드바 존재 여부
 * @param {boolean} props.hasHeader - 헤더 존재 여부
 * @param {boolean} props.hasFooter - 푸터 존재 여부
 * @param {string} props.padding - 패딩 크기 ('none' | 'sm' | 'md' | 'lg')
 * @param {string} props.maxWidth - 최대 너비 ('none' | 'sm' | 'md' | 'lg' | 'xl' | 'full')
 * @param {boolean} props.centered - 중앙 정렬 여부
 */
const MainContent = ({
  children,
  className = '',
  hasSidebar = false,
  hasHeader = false,
  hasFooter = false,
  padding = 'md',
  maxWidth = 'full',
  centered = false
}) => {
  // 패딩 클래스 설정
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6 lg:p-8',
    lg: 'p-8 lg:p-12'
  };

  // 최대 너비 클래스 설정
  const maxWidthClasses = {
    none: '',
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-screen-2xl',
    full: 'max-w-full'
  };

  // 마진 설정 (헤더/사이드바 고려)
  const marginClasses = `
    ${hasHeader ? 'mt-16' : ''}
    ${hasSidebar ? 'ml-0 lg:ml-64' : ''}
    ${hasFooter ? 'mb-0' : ''}
  `;

  // 최소 높이 설정
  const minHeightClass = hasHeader && hasFooter 
    ? 'min-h-[calc(100vh-8rem)]' // 헤더(4rem) + 푸터(4rem) 제외
    : hasHeader 
    ? 'min-h-[calc(100vh-4rem)]' // 헤더(4rem) 제외
    : hasFooter 
    ? 'min-h-[calc(100vh-4rem)]' // 푸터(4rem) 제외
    : 'min-h-screen';

  return (
    <main
      className={`
        ${marginClasses}
        ${minHeightClass}
        ${paddingClasses[padding]}
        ${maxWidthClasses[maxWidth] ? `${maxWidthClasses[maxWidth]} mx-auto` : ''}
        ${centered ? 'flex items-center justify-center' : ''}
        bg-gradient-to-br from-slate-50 via-white to-slate-100
        dark:from-gray-950 dark:via-gray-900 dark:to-gray-950
        transition-all duration-300 ease-in-out
        ${className}
      `}
      role="main"
      tabIndex="-1"
      id="main-content"
    >
      {/* 스킵 네비게이션을 위한 포커스 가능한 타겟 */}
      <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50">
        <a 
          href="#main-content"
          className="px-4 py-2 bg-mint-600 text-white rounded-md shadow-lg
                   focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-offset-2"
        >
          메인 콘텐츠로 건너뛰기
        </a>
      </div>

      {/* 메인 콘텐츠 래퍼 */}
      <div className="w-full">
        {children}
      </div>

      {/* 배경 패턴 (선택적) */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-mint-100/20 to-green-100/20 
                       dark:from-mint-900/10 dark:to-green-900/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-green-100/20 to-mint-100/20 
                       dark:from-green-900/10 dark:to-mint-900/10 rounded-full blur-3xl"></div>
      </div>
    </main>
  );
};

/**
 * 콘텐츠 섹션 컴포넌트
 */
export const ContentSection = ({ 
  children, 
  title, 
  subtitle,
  className = '',
  headerActions,
  noPadding = false
}) => (
  <section className={`mb-8 last:mb-0 ${className}`}>
    {(title || subtitle || headerActions) && (
      <header className={`${noPadding ? '' : 'mb-6'}`}>
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-slate-600 dark:text-gray-300">
                {subtitle}
              </p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center space-x-2">
              {headerActions}
            </div>
          )}
        </div>
      </header>
    )}
    <div className={noPadding ? '' : 'space-y-6'}>
      {children}
    </div>
  </section>
);

/**
 * 콘텐츠 컨테이너 컴포넌트
 */
export const ContentContainer = ({ 
  children, 
  className = '',
  variant = 'card' // 'card' | 'bordered' | 'plain'
}) => {
  const variantClasses = {
    card: `bg-white dark:bg-gray-800 rounded-xl shadow-sm shadow-slate-200/50 dark:shadow-black/20 
           border border-slate-200/50 dark:border-gray-700/50 p-6`,
    bordered: `border border-slate-200 dark:border-gray-700 rounded-lg p-6`,
    plain: `p-6`
  };

  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

/**
 * 그리드 레이아웃 컴포넌트
 */
export const ContentGrid = ({ 
  children, 
  columns = 'auto',
  gap = 'md',
  className = '' 
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    auto: 'grid-cols-[repeat(auto-fit,minmax(300px,1fr))]'
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

/**
 * 반응형 컬럼 레이아웃
 */
export const ContentColumns = ({ 
  children, 
  className = '',
  sidebar,
  sidebarPosition = 'right',
  sidebarWidth = 'w-80'
}) => {
  return (
    <div className={`flex flex-col lg:flex-row gap-6 ${className}`}>
      {sidebar && sidebarPosition === 'left' && (
        <aside className={`lg:${sidebarWidth} flex-shrink-0`}>
          {sidebar}
        </aside>
      )}
      
      <div className="flex-1 min-w-0">
        {children}
      </div>
      
      {sidebar && sidebarPosition === 'right' && (
        <aside className={`lg:${sidebarWidth} flex-shrink-0`}>
          {sidebar}
        </aside>
      )}
    </div>
  );
};

export default MainContent;