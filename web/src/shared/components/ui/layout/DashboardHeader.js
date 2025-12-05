'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { useTranslation } from '../../../i18n';
import { useTheme } from 'next-themes';
import { selectUser } from '../../../../store/slices/authSlice';
import { useUnifiedSocket } from '../../../providers/UnifiedSocketProvider';
import InfiniteNotificationDropdown from '../notifications/InfiniteNotificationDropdown';
import useNotification from '../../../hooks/business/useNotification';
import { S_GET_LAYOUT_DATA } from '../../../../gql/queries/chat';
import {
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  GlobeAltIcon,
  Bars3Icon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

/**
 * 개선된 대시보드 헤더 컴포넌트
 * - 테마 선택 (라이트/다크/시스템)
 * - 다국어 지원
 * - 알림 시스템
 * - 사용자 메뉴
 * - 반응형 디자인
 * - WCAG 2.1 접근성 준수
 */
const DashboardHeader = ({
  onMenuToggle,
  sidebarCollapsed = false,
  className = ''
}) => {
  const { t, language: currentLanguage, setLanguage: changeLanguage } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const user = useSelector(selectUser);
  const router = useRouter();
  const pathname = usePathname();

  // ✅ 현재 페이지가 채팅 페이지인지 확인
  const isOnChatPage = pathname === '/dashboard/chat';

  // UnifiedSocket을 통한 실시간 알림 시스템
  const {
    isConnected,
    orderEvents,
    notifications: socketNotifications,
    chatEvents,
    stats
  } = useUnifiedSocket();

  // ✅ 글로벌 레이아웃 데이터 조회 (경량, 최소 필드만)
  // ⚡ pollInterval 제거: Socket.IO가 실시간 업데이트를 처리하므로 폴링 불필요
  const { data: layoutData } = useQuery(S_GET_LAYOUT_DATA, {
    fetchPolicy: 'cache-only', // ✅ 캐시만 읽기 (layout.js에서 이미 로드)
    errorPolicy: 'ignore'
  });

  // ✅ 미읽음 채팅 카운트
  const unreadChatCount = layoutData?.sGetLayoutData?.chatStats?.unreadCount || 0;

  // 상태 관리
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [dbUnreadCount, setDbUnreadCount] = useState(0);
  const [realtimeReadSet, setRealtimeReadSet] = useState(new Set());

  // ✅ 실시간 읽지 않은 알림 계산 (DB 조회 없이 Socket 이벤트만 사용)
  const realtimeUnreadCount = useMemo(() => {
    const orderUnread = orderEvents.filter(event =>
      !realtimeReadSet.has(`order-${event.id}`)
    ).length;

    const chatUnread = chatEvents.filter(event =>
      !realtimeReadSet.has(`chat-${event.id}`)
    ).length;

    const socketUnread = socketNotifications.filter(event =>
      !realtimeReadSet.has(`socket-${event.id}`)
    ).length;

    console.log('🔔 [DashboardHeader] 실시간 알림 카운팅:', {
      orderUnread,
      chatUnread,
      socketUnread,
      total: orderUnread + chatUnread + socketUnread,
      orderEventsLength: orderEvents.length,
      chatEventsLength: chatEvents.length,
      socketNotificationsLength: socketNotifications.length
    });

    return orderUnread + chatUnread + socketUnread;
  }, [orderEvents, chatEvents, socketNotifications, realtimeReadSet]);

  // ✅ 실시간 이벤트만으로 알림 카운트 표시 (DB 조회 제외)
  const totalUnreadCount = realtimeUnreadCount;

  // useNotification 훅에서 자동으로 읽지 않은 개수를 관리하므로 제거

  // 실시간 알림 발생 시 카운터 업데이트
  useEffect(() => {
    // 새로운 주문/채팅/소켓 이벤트가 발생할 때마다 읽지 않은 개수 갱신
    console.log('🔔 실시간 알림 업데이트:', {
      orderEvents: orderEvents.length,
      chatEvents: chatEvents.length,
      socketNotifications: socketNotifications.length,
      realtimeUnreadCount,
      totalUnreadCount
    });
  }, [orderEvents.length, chatEvents.length, socketNotifications.length, realtimeUnreadCount, totalUnreadCount]);

  // 실시간 알림 데이터 통합 및 포맷팅
  const formatRealtimeNotifications = () => {
    const allNotifications = [];
    
    // 주문 이벤트 → 알림으로 변환
    orderEvents.forEach(event => {
      const notification = {
        id: event.id,
        title: event.type === 'new_order' ? t('header.orderTypes.newOrder') : 
               event.type === 'cancelled' ? t('header.orderTypes.cancelled') : 
               t('header.orderTypes.statusChanged'),
        message: event.type === 'new_order' 
          ? t('header.orderTypes.newOrderMessage', {
              orderNumber: event.data?.orderNumber,
              customerName: event.data?.customerName,
              total: event.data?.total?.toLocaleString()
            })
          : event.type === 'cancelled'
          ? t('header.orderTypes.cancelledMessage', { orderNumber: event.data?.orderNumber })
          : t('header.orderTypes.statusChangedMessage', { 
              orderNumber: event.data?.orderId || event.data?.orderNumber 
            }),
        time: formatTimestamp(event.timestamp),
        read: readNotifications.has(event.id),
        type: 'order',
        urgentOrder: event.data?.urgentOrder || false,
        data: event.data
      };
      allNotifications.push(notification);
    });

    // 채팅 이벤트 → 알림으로 변환
    chatEvents.forEach(event => {
      const notification = {
        id: event.id,
        title: t('header.chatTypes.newMessage'),
        message: t('header.chatTypes.messageFrom', {
          customerName: event.data?.customerName || t('header.defaultValues.customer'),
          content: event.data?.content
        }),
        time: formatTimestamp(event.timestamp),
        read: readNotifications.has(event.id),
        type: 'chat',
        data: event.data
      };
      allNotifications.push(notification);
    });

    // Socket 알림 → 직접 추가
    socketNotifications.forEach(event => {
      const notification = {
        id: event.id,
        title: event.data?.title || t('header.notifications.title'),
        message: event.data?.message || event.data?.content,
        time: formatTimestamp(event.timestamp),
        read: readNotifications.has(event.id),
        type: event.data?.type || 'notification',
        data: event.data
      };
      allNotifications.push(notification);
    });

    // 시간순 정렬 (최신 순)
    return allNotifications.sort((a, b) => {
      const timeA = new Date(a.time).getTime() || 0;
      const timeB = new Date(b.time).getTime() || 0;
      return timeB - timeA;
    });
  };

  // 타임스탬프 포맷팅
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return t('header.timeFormat.justNow');
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('header.timeFormat.justNow');
    if (minutes < 60) return t('header.timeFormat.minutesAgo', { minutes });
    if (hours < 24) return t('header.timeFormat.hoursAgo', { hours });
    return t('header.timeFormat.daysAgo', { days });
  };

  const notifications = formatRealtimeNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  // 언어 옵션
  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  // 테마 옵션
  const themeOptions = [
    { 
      value: 'light', 
      label: t('common.theme.light'), 
      icon: SunIcon,
      description: t('common.theme.lightDesc')
    },
    { 
      value: 'dark', 
      label: t('common.theme.dark'), 
      icon: MoonIcon,
      description: t('common.theme.darkDesc')
    },
    { 
      value: 'system', 
      label: t('common.theme.system'), 
      icon: ComputerDesktopIcon,
      description: t('common.theme.systemDesc')
    }
  ];

  // 검색 핸들러
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  // 테마 변경 핸들러
  const handleThemeChange = (newTheme) => {
    console.log('Changing theme to:', newTheme); // 디버깅용
    setTheme(newTheme); // next-themes의 setTheme 호출 (HTML 요소의 'dark' 클래스 자동 관리)
    setShowThemeMenu(false);
  };

  // 언어 변경 핸들러
  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setShowLanguageMenu(false);
  };

  // 알림 처리 함수들
  const markNotificationAsRead = (notificationId) => {
    setReadNotifications(prev => new Set([...prev, notificationId]));
  };

  const markAllNotificationsAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(new Set(allIds));
  };

  const handleNotificationClick = (notification) => {
    // 알림 읽음으로 표시
    markNotificationAsRead(notification.id);
    
    // 알림 타입에 따른 페이지 이동
    switch (notification.type) {
      case 'order':
        if (notification.data?.id) {
          router.push(`/dashboard/orders/${notification.data.id}`);
        } else {
          router.push('/dashboard/orders/live');
        }
        break;
      case 'chat':
        if (notification.data?.roomId) {
          router.push(`/dashboard/chat/rooms/${notification.data.roomId}`);
        } else {
          router.push('/dashboard/chat');
        }
        break;
      default:
        // 기본적으로 알림 목록으로 이동
        router.push('/dashboard/notifications');
        break;
    }
    
    // 드롭다운 닫기
    setShowNotifications(false);
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    // 로그아웃 로직 구현
    router.push('/login');
  };

  // 현재 테마 아이콘 가져오기
  const getCurrentThemeIcon = () => {
    const option = themeOptions.find(opt => opt.value === theme);
    return option?.icon || SunIcon;
  };

  const CurrentThemeIcon = getCurrentThemeIcon();

  // next-themes 미운트 상태 확인 (하이드레이션 방지)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // next-themes가 마운트될 때까지 기다리기
  if (!mounted || !theme) {
    return (
      <header
        className={`
          sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm
          border-b border-gray-200 dark:border-gray-700 shadow-sm
          ${className}
        `}
        role="banner"
      >
        <div className="h-16 px-4 lg:px-6 bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </header>
    );
  }

  return (
    <header
      className={`
        sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm
        border-b border-gray-200 dark:border-gray-700 shadow-sm
        ${className}
      `}
      role="banner"
    >
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* 좌측: 메뉴 토글 & 검색 */}
        <div className="flex items-center space-x-4 flex-1">
          {/* 모바일 메뉴 토글 */}
          <button
            onClick={onMenuToggle}
            className="
              lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
              focus:outline-none focus:ring-2 focus:ring-mint-500
            "
            aria-label={t('header.toggleMenu')}
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          {/* 검색바 */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg">
            <div className="relative">
              <MagnifyingGlassIcon className="
                absolute left-3 top-1/2 transform -translate-y-1/2 
                w-4 h-4 text-gray-400 dark:text-gray-500
              " />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('header.searchPlaceholder')}
                className="
                  w-full pl-10 pr-4 py-2 text-sm
                  bg-gray-50 dark:bg-gray-800 
                  border border-gray-200 dark:border-gray-700 
                  rounded-lg text-gray-900 dark:text-white
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-mint-500 
                  focus:border-mint-500 transition-colors duration-200
                "
                aria-label={t('header.searchPlaceholder')}
              />
            </div>
          </form>
        </div>

        {/* 우측: 액션 버튼들 */}
        <div className="flex items-center space-x-2">
          {/* 언어 선택 */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="
                p-2 rounded-lg text-gray-600 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                focus:outline-none focus:ring-2 focus:ring-mint-500
              "
              aria-label={t('header.changeLanguage')}
              aria-expanded={showLanguageMenu}
            >
              <GlobeAltIcon className="w-5 h-5" />
            </button>

            {/* 언어 드롭다운 */}
            {showLanguageMenu && (
              <div className="
                absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800
                rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600
                py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200
                backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10
              ">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`
                      w-full px-4 py-3 text-left text-sm flex items-center space-x-3
                      hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                      ${currentLanguage === lang.code ? 'bg-mint-50 dark:bg-mint-900/30 text-mint-600 dark:text-mint-300' : 'text-gray-700 dark:text-gray-200'}
                    `}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="font-medium">{lang.name}</span>
                    {currentLanguage === lang.code && (
                      <div className="w-2 h-2 bg-mint-500 rounded-full ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 테마 선택 */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="
                p-2 rounded-lg text-gray-600 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                focus:outline-none focus:ring-2 focus:ring-mint-500
              "
              aria-label={t('common.theme.toggle')}
              aria-expanded={showThemeMenu}
            >
              <CurrentThemeIcon className="w-5 h-5" />
            </button>

            {/* 테마 드롭다운 */}
            {showThemeMenu && (
              <div className="
                absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800
                rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600
                py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200
                backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10
              ">
                {themeOptions.map((option) => {
                  const OptionIcon = option.icon;
                  const isActive = theme === option.value;
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleThemeChange(option.value)}
                      className={`
                        w-full px-4 py-3 text-left flex items-start space-x-3
                        hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                        ${isActive ? 'bg-mint-50 dark:bg-mint-900/30' : ''}
                      `}
                    >
                      <OptionIcon className={`w-5 h-5 mt-0.5 ${
                        isActive ? 'text-mint-600 dark:text-mint-400' : 'text-gray-500 dark:text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          isActive ? 'text-mint-600 dark:text-mint-300' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">
                          {option.description}
                        </div>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-mint-500 rounded-full mt-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 채팅 */}
          <button
            onClick={() => router.push('/dashboard/chat')}
            className="
              p-2 rounded-lg text-gray-600 dark:text-gray-300
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
              focus:outline-none focus:ring-2 focus:ring-mint-500 relative
            "
            aria-label={`${t('header.chat')} ${unreadChatCount > 0 ? `(${unreadChatCount})` : ''}`}
            title={t('header.chat')}
          >
            <div className="relative">
              <ChatBubbleLeftRightIcon className="w-5 h-5" />

              {/* 미읽은 채팅 메시지 배지 - 채팅 페이지가 아닐 때만 표시 */}
              {!isOnChatPage && unreadChatCount > 0 && (
                <span className="
                  absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-mint-500 text-white
                  text-xs font-bold rounded-full flex items-center justify-center px-1
                  shadow-sm
                ">
                  {unreadChatCount > 99 ? '99+' : unreadChatCount}
                </span>
              )}
            </div>
          </button>

          {/* 알림 */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="
                p-2 rounded-lg text-gray-600 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                focus:outline-none focus:ring-2 focus:ring-mint-500 relative
              "
              aria-label={`${t('header.notifications.title')} (${totalUnreadCount}${isConnected ? ` - ${t('header.notifications.connected')}` : ` - ${t('header.notifications.disconnected')}`})`}
              aria-expanded={showNotifications}
              title={isConnected ? t('header.notifications.connected') : t('header.notifications.disconnected')}
            >
              <div className="relative">
                <BellIcon className={`w-5 h-5 ${!isConnected ? 'text-gray-400' : ''}`} />

                {/* 실시간 연결 상태 표시 */}
                <div className={`
                  absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full
                  ${isConnected ? 'bg-green-500' : 'bg-red-500'}
                  ${isConnected ? 'animate-pulse' : ''}
                `} />

                {/* 실시간 알림 개수 배지 */}
                {totalUnreadCount > 0 && (
                  <span className="
                    absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-red-500 text-white
                    text-xs font-bold rounded-full flex items-center justify-center px-1
                    shadow-sm animate-pulse
                  ">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </span>
                )}
              </div>
            </button>

            {/* 알림 드롭다운 - 임시로 기존 시스템 사용 */}
            {showNotifications && (
              <div className="
                absolute right-0 mt-2 w-96 max-w-sm bg-white dark:bg-gray-800
                rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600
                z-50 animate-in fade-in slide-in-from-top-2 duration-200
                backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10
              ">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {t('header.notifications.title')} ({notifications.length})
                      </h3>
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                           title={isConnected ? t('header.notifications.connected') : t('header.notifications.disconnected')} />
                    </div>
                    {totalUnreadCount > 0 && (
                      <button 
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-mint-600 dark:text-mint-300 hover:text-mint-700 dark:hover:text-mint-200 font-medium transition-colors"
                      >
                        {t('header.notifications.markAllRead')} ({totalUnreadCount})
                      </button>
                    )}
                  </div>
                  
                  {/* 실시간 통계 정보 */}
                  {isConnected && stats && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {t('header.notifications.realtimeStats', {
                        orders: stats.ordersReceived,
                        messages: stats.messagesReceived,
                        notifications: stats.notificationsReceived
                      })}
                    </div>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`
                          p-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0
                          hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer
                          ${!notification.read ? 'bg-mint-50/50 dark:bg-mint-900/20' : ''}
                          ${notification.urgentOrder ? 'border-l-4 border-l-red-500' : ''}
                        `}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          {/* 알림 타입 아이콘 */}
                          <div className="flex-shrink-0 mt-1">
                            {notification.type === 'order' && (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                notification.urgentOrder 
                                  ? 'bg-red-100 dark:bg-red-900/30' 
                                  : 'bg-blue-100 dark:bg-blue-900/30'
                              }`}>
                                <span className={`text-sm ${
                                  notification.urgentOrder 
                                    ? 'text-red-600 dark:text-red-300' 
                                    : 'text-blue-600 dark:text-blue-300'
                                }`}>
                                  📦
                                </span>
                              </div>
                            )}
                            {notification.type === 'chat' && (
                              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <span className="text-sm text-green-600 dark:text-green-300">💬</span>
                              </div>
                            )}
                            {notification.type === 'notification' && (
                              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <span className="text-sm text-purple-600 dark:text-purple-300">🔔</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${
                                  !notification.read 
                                    ? 'text-gray-900 dark:text-gray-100' 
                                    : 'text-gray-600 dark:text-gray-300'
                                }`}>
                                  {notification.title}
                                  {notification.urgentOrder && (
                                    <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                      {t('header.urgent')}
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-xs text-gray-400 dark:text-gray-400">
                                    {notification.time}
                                  </p>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-mint-500 rounded-full" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <BellIcon className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('header.notifications.empty')}
                      </p>
                    </div>
                  )}
                </div>

                {notifications.length > 10 && (
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button className="w-full text-center text-sm text-mint-600 dark:text-mint-400 hover:text-mint-700 font-medium">
                      {t('header.notifications.viewAll')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 사용자 메뉴 */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="
                flex items-center space-x-2 p-1 rounded-lg
                hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                focus:outline-none focus:ring-2 focus:ring-mint-500
              "
              aria-expanded={showUserMenu}
              aria-label={t('header.userMenu.title')}
            >
              <div className="flex items-center space-x-2">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full ring-2 ring-mint-200 dark:ring-mint-800"
                  />
                ) : (
                  <UserCircleIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name || t('header.defaultValues.demoUser')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role || t('common.user.storeOwner')}
                  </p>
                </div>
              </div>
              <ChevronDownIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>

            {/* 사용자 드롭다운 */}
            {showUserMenu && (
              <div className="
                absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800
                rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600
                z-50 animate-in fade-in slide-in-from-top-2 duration-200
                backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10
              ">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user?.name || t('header.defaultValues.demoUser')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    {user?.email || t('header.defaultValues.demoEmail')}
                  </p>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => router.push('/settings')}
                    className="
                      w-full flex items-center px-4 py-3 text-sm
                      text-gray-700 dark:text-gray-200
                      hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                    "
                  >
                    <Cog6ToothIcon className="w-4 h-4 mr-3" />
                    {t('common.user.settings')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="
                      w-full flex items-center px-4 py-3 text-sm
                      text-red-600 dark:text-red-400
                      hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors
                    "
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                    {t('common.actions.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 클릭 외부 영역 감지 */}
      {(showNotifications || showUserMenu || showThemeMenu || showLanguageMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
            setShowThemeMenu(false);
            setShowLanguageMenu(false);
          }}
        />
      )}
    </header>
  );
};

export default DashboardHeader;