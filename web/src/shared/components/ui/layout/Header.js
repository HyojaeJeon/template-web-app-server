'use client';

import { useState } from 'react';
import { 
  BellIcon, 
  MagnifyingGlassIcon, 
  UserCircleIcon,
  Bars3Icon,
  MoonIcon,
  SunIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

/**
 * 헤더 컴포넌트 (WCAG 2.1 준수)
 * Local 테마 컬러와 다크모드 지원
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.title - 페이지 제목
 * @param {Function} props.onMenuToggle - 메뉴 토글 핸들러
 * @param {boolean} props.showSearch - 검색 표시 여부
 * @param {Function} props.onSearch - 검색 핸들러
 * @param {Object} props.user - 사용자 정보
 * @param {Function} props.onThemeToggle - 테마 토글 핸들러
 * @param {boolean} props.isDarkMode - 다크모드 상태
 * @param {Array} props.notifications - 알림 목록
 * @param {Object} props.breadcrumbs - 브레드크럼 정보
 */
const Header = ({
  title = "대시보드",
  onMenuToggle,
  showSearch = true,
  onSearch,
  user = {},
  onThemeToggle,
  isDarkMode = false,
  notifications = [],
  breadcrumbs = []
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch?.(searchValue);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header 
      className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm 
                border-b border-slate-200 dark:bg-gray-900/95 dark:border-gray-700
                shadow-sm shadow-slate-200/50 dark:shadow-black/20"
      role="banner"
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* 좌측 섹션 */}
        <div className="flex items-center space-x-4">
          {/* 메뉴 토글 버튼 */}
          {onMenuToggle && (
            <button
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800
                       text-slate-600 dark:text-gray-300 transition-colors duration-200
                       focus:outline-none focus:ring-2 focus:ring-mint-500 dark:focus:ring-mint-400"
              onClick={onMenuToggle}
              aria-label="메뉴 열기/닫기"
              type="button"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          )}

          {/* 타이틀 & 브레드크럼 */}
          <div>
            {breadcrumbs.length > 0 ? (
              <nav className="flex" aria-label="브레드크럼">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                  {breadcrumbs.map((crumb, index) => (
                    <li key={index} className="inline-flex items-center">
                      {index > 0 && (
                        <ChevronDownIcon className="w-4 h-4 mx-1 text-slate-400 dark:text-gray-500 rotate-[-90deg]" />
                      )}
                      {crumb.href ? (
                        <a
                          href={crumb.href}
                          className="text-sm font-medium text-mint-600 hover:text-mint-700 
                                   dark:text-mint-400 dark:hover:text-mint-300 transition-colors"
                        >
                          {crumb.label}
                        </a>
                      ) : (
                        <span className="text-sm font-medium text-slate-700 dark:text-gray-300">
                          {crumb.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            ) : (
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {title}
              </h1>
            )}
          </div>
        </div>

        {/* 중앙 검색 */}
        {showSearch && (
          <div className="hidden md:flex flex-1 max-w-lg mx-4">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 
                                               w-4 h-4 text-slate-400 dark:text-gray-500" />
                <input
                  type="search"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-800 
                           border border-slate-200 dark:border-gray-700 rounded-lg
                           text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-mint-500 dark:focus:ring-mint-400
                           focus:border-mint-500 dark:focus:border-mint-400 transition-colors duration-200"
                  placeholder="검색..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  aria-label="전체 검색"
                />
              </div>
            </form>
          </div>
        )}

        {/* 우측 액션 */}
        <div className="flex items-center space-x-2">
          {/* 테마 토글 */}
          <button
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800
                     text-slate-600 dark:text-gray-300 transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-mint-500 dark:focus:ring-mint-400"
            onClick={onThemeToggle}
            aria-label={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
            type="button"
          >
            {isDarkMode ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </button>

          {/* 알림 */}
          <div className="relative">
            <button
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800
                       text-slate-600 dark:text-gray-300 transition-colors duration-200
                       focus:outline-none focus:ring-2 focus:ring-mint-500 dark:focus:ring-mint-400
                       relative"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              aria-label={`알림 ${unreadCount}개`}
              aria-expanded={isNotificationOpen}
              type="button"
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600
                               text-white text-xs font-bold rounded-full flex items-center justify-center
                               shadow-sm shadow-red-500/25 animate-pulse"
                      aria-hidden="true">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* 알림 드롭다운 */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 
                           rounded-lg shadow-xl shadow-slate-200/50 dark:shadow-black/50
                           border border-slate-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-slate-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    알림 ({notifications.length})
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification, index) => (
                      <div key={index} className={`p-4 border-b border-slate-100 dark:border-gray-700 last:border-b-0
                                                  ${!notification.read ? 'bg-mint-50/50 dark:bg-mint-900/10' : ''}`}>
                        <div className="flex items-start">
                          <div className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0
                                         ${!notification.read ? 'bg-mint-500' : 'bg-slate-300 dark:bg-gray-600'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-900 dark:text-white font-medium">
                              {notification.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <BellIcon className="w-8 h-8 mx-auto text-slate-400 dark:text-gray-500 mb-2" />
                      <p className="text-sm text-slate-500 dark:text-gray-400">
                        새로운 알림이 없습니다
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 사용자 메뉴 */}
          <div className="relative">
            <button
              className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800
                       focus:outline-none focus:ring-2 focus:ring-mint-500 dark:focus:ring-mint-400
                       transition-colors duration-200"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              aria-expanded={isUserMenuOpen}
              aria-label="사용자 메뉴"
              type="button"
            >
              <div className="flex items-center space-x-2">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full ring-2 ring-mint-200 dark:ring-mint-800"
                  />
                ) : (
                  <UserCircleIcon className="w-8 h-8 text-slate-400 dark:text-gray-500" />
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {user.name || "사용자"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {user.role || "점주"}
                  </p>
                </div>
              </div>
              <ChevronDownIcon className="w-4 h-4 text-slate-400 dark:text-gray-500" />
            </button>

            {/* 사용자 드롭다운 */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 
                           rounded-lg shadow-xl shadow-slate-200/50 dark:shadow-black/50
                           border border-slate-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-slate-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {user.name || "사용자"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {user.email || "user@example.com"}
                  </p>
                </div>
                <div className="py-2">
                  <button className="w-full flex items-center px-4 py-2 text-sm text-slate-700 dark:text-gray-300
                                   hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                    <Cog6ToothIcon className="w-4 h-4 mr-3" />
                    설정
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400
                                   hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                    로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 클릭 외부 영역 감지 */}
      {(isUserMenuOpen || isNotificationOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsNotificationOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;