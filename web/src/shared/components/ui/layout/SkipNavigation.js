'use client';

/**
 * 스킵 네비게이션 컴포넌트 (WCAG 2.1 준수)
 * 키보드 사용자가 메인 콘텐츠로 바로 이동할 수 있도록 함
 * Local 테마 컬러와 다크모드 지원
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Array} props.links - 스킵 링크 배열
 * @param {string} props.className - 추가 CSS 클래스
 * @param {boolean} props.showOnFocusOnly - 포커스시에만 표시 여부
 */
const SkipNavigation = ({
  links = [
    { href: '#main-content', label: '메인 콘텐츠로 건너뛰기' },
    { href: '#navigation', label: '내비게이션으로 건너뛰기' },
    { href: '#footer', label: '푸터로 건너뛰기' }
  ],
  className = '',
  showOnFocusOnly = true
}) => {
  return (
    <nav 
      className={`skip-navigation ${className}`}
      aria-label="스킵 네비게이션"
    >
      <div className="fixed top-0 left-0 z-[9999] w-full">
        <ul className="flex space-x-2 p-2">
          {links.map((link, index) => (
            <li key={index}>
              <a
                href={link.href}
                className={`
                  inline-block px-4 py-2 text-sm font-medium text-white
                  bg-gradient-to-r from-mint-600 to-green-600 
                  dark:from-mint-500 dark:to-green-500
                  rounded-md shadow-lg shadow-mint-500/25 dark:shadow-mint-400/25
                  border-2 border-transparent
                  transition-all duration-200 ease-in-out
                  hover:from-mint-700 hover:to-green-700 
                  dark:hover:from-mint-600 dark:hover:to-green-600
                  hover:shadow-xl hover:shadow-mint-500/30 dark:hover:shadow-mint-400/30
                  hover:-translate-y-0.5
                  focus:outline-none focus:ring-4 focus:ring-mint-500/50 dark:focus:ring-mint-400/50
                  focus:border-mint-300 dark:focus:border-mint-300
                  active:translate-y-0 active:shadow-lg
                  ${showOnFocusOnly ? 'sr-only focus:not-sr-only' : ''}
                `}
                onClick={(e) => {
                  // 부드러운 스크롤 처리
                  e.preventDefault();
                  const target = document.querySelector(link.href);
                  if (target) {
                    target.focus({ preventScroll: true });
                    target.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start'
                    });
                  }
                }}
                onKeyDown={(e) => {
                  // Enter나 Space 키 처리
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.target.click();
                  }
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

/**
 * 단일 스킵 링크 컴포넌트
 */
export const SkipLink = ({ 
  href = '#main-content', 
  children = '메인 콘텐츠로 건너뛰기',
  className = '' 
}) => (
  <a
    href={href}
    className={`
      sr-only focus:not-sr-only 
      fixed top-4 left-4 z-[9999]
      inline-block px-4 py-2 text-sm font-medium text-white
      bg-gradient-to-r from-mint-600 to-green-600 
      dark:from-mint-500 dark:to-green-500
      rounded-md shadow-lg shadow-mint-500/25 dark:shadow-mint-400/25
      border-2 border-transparent
      transition-all duration-200 ease-in-out
      hover:from-mint-700 hover:to-green-700 
      dark:hover:from-mint-600 dark:hover:to-green-600
      hover:shadow-xl hover:shadow-mint-500/30 dark:hover:shadow-mint-400/30
      hover:-translate-y-0.5
      focus:outline-none focus:ring-4 focus:ring-mint-500/50 dark:focus:ring-mint-400/50
      focus:border-mint-300 dark:focus:border-mint-300
      active:translate-y-0 active:shadow-lg
      ${className}
    `}
    onClick={(e) => {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.focus({ preventScroll: true });
        target.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }}
  >
    {children}
  </a>
);

/**
 * 접근성을 위한 랜드마크 건너뛰기 컴포넌트
 */
export const LandmarkSkipNav = ({ className = '' }) => (
  <SkipNavigation
    links={[
      { href: '#main-content', label: '메인 콘텐츠로 건너뛰기' },
      { href: '[role="navigation"]', label: '메인 메뉴로 건너뛰기' },
      { href: '[role="search"]', label: '검색으로 건너뛰기' },
      { href: '[role="contentinfo"]', label: '푸터 정보로 건너뛰기' }
    ]}
    className={className}
  />
);

/**
 * 접근성 향상을 위한 포커스 관리 훅 제공
 */
export const useFocusManagement = () => {
  const focusElement = (selector, options = {}) => {
    const element = document.querySelector(selector);
    if (element) {
      element.focus(options);
      if (options.scroll !== false) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start',
          ...options.scrollOptions
        });
      }
    }
  };

  const focusFirstFocusableElement = (container = document) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  };

  const focusLastFocusableElement = (container = document) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  };

  return {
    focusElement,
    focusFirstFocusableElement,
    focusLastFocusableElement
  };
};

/**
 * 모바일 친화적인 스킵 네비게이션
 */
export const MobileSkipNav = ({ className = '' }) => (
  <div className={`sm:hidden ${className}`}>
    <SkipNavigation
      links={[
        { href: '#main-content', label: '메인으로' },
        { href: '#mobile-menu', label: '메뉴로' }
      ]}
      showOnFocusOnly={true}
    />
  </div>
);

/**
 * 키보드 네비게이션 도움말 컴포넌트
 */
export const KeyboardNavHelp = ({ isVisible = false, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          키보드 네비게이션 도움말
        </h2>
        
        <div className="space-y-3 text-sm text-slate-600 dark:text-gray-300">
          <div className="flex justify-between">
            <span>Tab</span>
            <span>다음 요소로 이동</span>
          </div>
          <div className="flex justify-between">
            <span>Shift + Tab</span>
            <span>이전 요소로 이동</span>
          </div>
          <div className="flex justify-between">
            <span>Enter / Space</span>
            <span>버튼 클릭 또는 링크 실행</span>
          </div>
          <div className="flex justify-between">
            <span>Escape</span>
            <span>대화상자 닫기</span>
          </div>
          <div className="flex justify-between">
            <span>Arrow Keys</span>
            <span>메뉴 또는 탭에서 이동</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-mint-600 hover:bg-mint-700 text-white rounded-md
                     focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-offset-2
                     dark:bg-mint-500 dark:hover:bg-mint-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkipNavigation;