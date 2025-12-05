/**
 * 사용자 메뉴 드롭다운 컴포넌트
 * 프로필 이미지, 설정 메뉴, 로그아웃 기능
 * Local어 우선 다국어 지원 및 점주 맞춤 기능
 */
'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClickOutside } from '../hooks/ui/useClickOutside';
import { useAuth } from '../hooks/business/useAuth';
import { useTranslation } from '@/shared/i18n';
import ConfirmModal from '../ui/modals/ConfirmModal';

/**
 * 다국어 텍스트 설정
 */
const TEXTS = {
  vi: {
    // 사용자 정보
    storeOwner: 'Chủ cửa hàng',
    admin: 'Quản trị viên', 
    superAdmin: 'Siêu quản trị',
    noStoreName: 'Chưa có tên cửa hàng',
    login: 'Đăng nhập',
    
    // 메뉴 항목
    profileSettings: 'Cài đặt hồ sơ',
    storeSettings: 'Cài đặt cửa hàng',
    notificationSettings: 'Cài đặt thông báo',
    darkModeToggle: 'Chuyển đổi chế độ tối',
    staffManagement: 'Quản lý nhân viên',
    menuManagement: 'Quản lý thực đơn',
    orderHistory: 'Lịch sử đơn hàng',
    salesReport: 'Báo cáo doanh thu',
    promotions: 'Khuyến mãi',
    integrations: 'Tích hợp',
    posSettings: 'Cài đặt POS',
    superAdminPanel: 'Bảng điều khiển siêu quản trị',
    help: 'Trợ giúp',
    contact: 'Liên hệ hỗ trợ',
    logout: 'Đăng xuất',
    
    // 기타
    version: 'Phiên bản',
    logoutFailed: 'Đăng xuất thất bại',
    loading: 'Đang tải...',
    online: 'Trực tuyến',
    offline: 'Ngoại tuyến'
  },
  ko: {
    // 사용자 정보  
    storeOwner: '점주',
    admin: '관리자',
    superAdmin: '슈퍼관리자', 
    noStoreName: '매장명 없음',
    login: '로그인',
    
    // 메뉴 항목
    profileSettings: '프로필 설정',
    storeSettings: '매장 설정',
    notificationSettings: '알림 설정',
    darkModeToggle: '다크 모드 토글',
    staffManagement: '직원 관리',
    menuManagement: '메뉴 관리',
    orderHistory: '주문 내역',
    salesReport: '매출 보고서',
    promotions: '프로모션',
    integrations: '연동',
    posSettings: 'POS 설정',
    superAdminPanel: '슈퍼 관리자',
    help: '도움말',
    contact: '연락처',
    logout: '로그아웃',
    
    // 기타
    version: '버전',
    logoutFailed: '로그아웃 실패',
    loading: '로딩 중...',
    online: '온라인',
    offline: '오프라인'
  }
};

/**
 * 메뉴 아이템 컴포넌트
 */
const MenuItem = ({ 
  icon, 
  label, 
  href, 
  onClick, 
  variant = 'default', 
  external = false,
  divider = false 
}) => {
  if (divider) {
    return <div className="my-1 border-t border-gray-100 dark:border-gray-700" />;
  }

  const content = (
    <>
      <span className="flex-shrink-0 w-4 h-4 mr-3 text-current">{icon}</span>
      <span className="flex-1">{label}</span>
      {external && (
        <svg className="w-3 h-3 ml-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
        </svg>
      )}
    </>
  );

  const baseClasses = `
    flex items-center w-full px-4 py-2 text-sm transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50
    ${variant === 'danger' 
      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
    }
  `;

  if (href) {
    const linkProps = external 
      ? { href, target: '_blank', rel: 'noopener noreferrer' }
      : { href };

    return (
      <Link {...linkProps} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses}>
      {content}
    </button>
  );
};

/**
 * 사용자 아바타 컴포넌트
 */
const UserAvatar = ({ user, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const sizeClass = sizes[size] || sizes.md;

  const menuTexts = TEXTS['vi'] || TEXTS.vi; // 임시로 기본값 사용

  if (user?.profileImage) {
    return (
      <img
        src={user.profileImage}
        alt={user.name || menuTexts.storeOwner}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    );
  }

  // 기본 아바타 (이니셜) - Local어 및 한국어 처리
  const getInitials = (name, locale = 'vi') => {
    if (!name) return locale === 'vi' ? 'CH' : '점'; // Chủ hàng = CH
    
    // Local어 이름 처리 (예: Nguyen Van A -> N)
    if (locale === 'vi') {
      const words = name.trim().split(' ');
      return words[0].charAt(0).toUpperCase();
    }
    
    // 한국어/기타 처리
    return name.charAt(0).toUpperCase();
  };

  const initials = getInitials(user?.name);

  return (
    <div className={`
      ${sizeClass} rounded-full 
      bg-gradient-to-br from-vietnam-mint to-vietnam-green
      flex items-center justify-center 
      text-white font-medium shadow-sm border-2 border-white/20 ${className}
    `}>
      {initials}
    </div>
  );
};

/**
 * 사용자 메뉴 컴포넌트
 */
const UserMenu = ({
  className = '',
  showName = true,
  showRole = true,
  showStatus = true, // 온라인/오프라인 상태 표시
  variant = 'default', // 'default', 'compact'
  locale = 'vi', // 기본값을 Local어로 설정
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // 인증 훅 사용
  const { user, logout, isLoading } = useAuth();

  // 번역 훅
  const { t } = useTranslation();

  // 다국어 텍스트 (메뉴용)
  const menuTexts = TEXTS[locale] || TEXTS.vi;

  // 외부 클릭 감지
  useClickOutside(dropdownRef, () => setIsOpen(false));
  
  // 온라인/오프라인 상태 감지
  const [isOnline, setIsOnline] = useState(true);
  
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 로그아웃 모달 열기
  const handleLogoutClick = () => {
    console.log('[UserMenu] 로그아웃 버튼 클릭');
    setIsOpen(false);
    setShowLogoutModal(true);
  };

  // 로그아웃 확인
  const handleLogoutConfirm = () => {
    try {
      console.log('[UserMenu] 로그아웃 확인');

      // ✅ logout() 함수가 내부에서 window.location.href = '/login' 처리
      logout();
    } catch (error) {
      console.error(menuTexts.logoutFailed, error);
    }
  };

  // 로그아웃 취소
  const handleLogoutCancel = () => {
    console.log('[UserMenu] 로그아웃 취소');
    setShowLogoutModal(false);
  };

  // 프로필 설정으로 이동
  const handleProfileClick = () => {
    router.push('/settings/profile');
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        {variant !== 'compact' && (
          <div className="space-y-1">
            <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-vietnam-mint dark:hover:text-vietnam-mint rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {menuTexts.login}
      </Link>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef} {...props}>
      {/* 사용자 정보 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center space-x-2 p-2 rounded-lg 
          text-gray-700 dark:text-gray-200 
          hover:bg-gray-100 dark:hover:bg-gray-800 
          focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-opacity-50
          transition-colors duration-200
        "
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="relative">
          <UserAvatar user={user} size="md" />
          {/* 온라인 상태 표시 */}
          {showStatus && (
            <div className={`
              absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800
              ${isOnline ? 'bg-green-500' : 'bg-gray-400'}
            `} title={isOnline ? t.online : t.offline} />
          )}
        </div>
        
        {variant !== 'compact' && (
          <div className="flex-1 min-w-0 text-left">
            {showName && (
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.name || (locale === 'vi' ? 'Chủ cửa hàng' : '점주님')}
              </p>
            )}
            {showRole && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.role === 'SUPER_ADMIN' ? t.superAdmin : 
                 user.role === 'ADMIN' ? t.admin : t.storeOwner}
              </p>
            )}
          </div>
        )}

        {/* 드롭다운 화살표 */}
        <svg 
          className={`
            w-4 h-4 text-gray-400 transition-transform duration-200
            ${isOpen ? 'transform rotate-180' : ''}
          `} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="
          absolute right-0 mt-2 w-64
          bg-white dark:bg-gray-800 
          rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
          z-50 py-1
        ">
          {/* 사용자 정보 헤더 */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <UserAvatar user={user} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name || (locale === 'vi' ? 'Chủ cửa hàng' : '점주님')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
                <p className="text-xs text-vietnam-mint dark:text-vietnam-mint font-medium">
                  {user.storeName || t.noStoreName}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {isOnline ? t.online : t.offline}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 메뉴 항목들 */}
          <div className="py-1">
            <MenuItem
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              label={t.profileSettings}
              onClick={handleProfileClick}
            />
            
            <MenuItem
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
                </svg>
              }
              label={t.storeSettings}
              href="/settings/store"
            />
            
            <MenuItem
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              }
              label={t.notificationSettings}
              href="/settings/notifications"
            />

            <MenuItem divider />

            {/* Local App 점주 전용 메뉴들 */}
            <MenuItem
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              label={t.staffManagement}
              href="/staff"
            />
            
            <MenuItem
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              label={t.menuManagement}
              href="/menu"
            />
            
            <MenuItem
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V7a2 2 0 00-2-2H16M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
              label={t.orderHistory}
              href="/orders"
            />
            
            <MenuItem
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              label={t.salesReport}
              href="/analytics/sales"
            />

            <MenuItem divider />

            <MenuItem
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v16.99c0 .55-.45 1-1 1s-1-.45-1-1V3a1 1 0 00-1-1h-2z" />
                </svg>
              }
              label={t.posSettings}
              href="/pos/setup"
            />
            
            <MenuItem
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 110 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 11-4 0v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 110-4H6a1 1 0 01-1-1V6a1 1 0 011-1h3a1 1 0 011-1v-1z" />
                </svg>
              }
              label={t.integrations}
              href="/settings/integrations"
            />

            <MenuItem
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              }
              label={t.darkModeToggle}
              onClick={() => {
                // 다크 모드 토글 로직
                const theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
                document.documentElement.classList.toggle('dark');
                localStorage.setItem('theme', theme);
                setIsOpen(false);
              }}
            />

            <MenuItem divider />

            {/* 슈퍼 관리자 전용 메뉴 */}
            {user.role === 'SUPER_ADMIN' && (
              <>
                <MenuItem divider />
                <MenuItem
                  icon={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                  label={t.superAdminPanel}
                  href="/super-admin"
                />
              </>
            )}

            <MenuItem divider />

            <MenuItem
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label={t.help}
              href="/help"
            />

            <MenuItem
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
              label={t.contact}
              href={locale === 'vi' ? 'tel:+84-28-1234-5678' : 'tel:1588-0000'}
              external
            />

            <MenuItem divider />

            <MenuItem
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              }
              label={menuTexts.logout}
              onClick={handleLogoutClick}
              variant="danger"
            />
          </div>

          {/* 버전 정보 및 회사 정보 */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-400 dark:text-gray-600">
                {t.version} 1.0.0 • {locale === 'vi' ? '© 2024 Ứng dụng giao hàng' : '© 2024 App'}
              </p>
              {locale === 'vi' && (
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  Hỗ trợ 24/7 • Được phát triển tại Việt Nam 🇻🇳
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 로그아웃 확인 모달 */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        title={t('auth.logout_confirm.title')}
        message={t('auth.logout_confirm.message')}
        confirmText={t('auth.logout_confirm.confirm')}
        cancelText={t('auth.logout_confirm.cancel')}
        variant="danger"
      />
    </div>
  );
};

export default UserMenu;