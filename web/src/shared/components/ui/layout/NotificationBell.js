'use client';

/**
 * NotificationBell - 헤더 알림 벨 컴포넌트
 *
 * 간소화된 구현:
 * - useHeaderNotification 훅 사용
 * - 필수 필드만 표시 (title, body, type, isRead, createdAt)
 * - 무한 스크롤 지원
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '@/shared/i18n';
import {
  Bell,
  BellRing,
  ShoppingBag,
  MessageSquare,
  Star,
  CreditCard,
  Settings,
  Gift,
  Truck,
  Store,
  Megaphone
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko, vi } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useHeaderNotification } from '@/shared/hooks/business/useHeaderNotification';
import { cn } from '@/shared/utils';

// Web에서 표시할 알림 타입 (모든 알림 타입 포함)
const STORE_NOTIFICATION_TYPES = [
  'ORDER_UPDATE',  // 주문 상태 업데이트 (점주도 주문 알림 필요)
  'CHAT',
  'REVIEW',
  'PAYMENT',
  'SYSTEM',
  'PROMOTION',
  'DELIVERY',
  'STORE'
];

// 알림 타입별 아이콘 컴포넌트 매핑
const NOTIFICATION_ICONS = {
  ORDER_UPDATE: ShoppingBag,
  CHAT: MessageSquare,
  REVIEW: Star,
  PAYMENT: CreditCard,
  SYSTEM: Settings,
  PROMOTION: Gift,
  DELIVERY: Truck,
  STORE: Store,
};

// 알림 타입별 색상 매핑
const NOTIFICATION_COLORS = {
  ORDER_UPDATE: 'text-blue-500',
  CHAT: 'text-green-500',
  REVIEW: 'text-yellow-500',
  PAYMENT: 'text-emerald-500',
  SYSTEM: 'text-gray-500',
  PROMOTION: 'text-purple-500',
  DELIVERY: 'text-orange-500',
  STORE: 'text-indigo-500',
};

// 알림 타입별 라우팅 경로 매핑
const getNotificationRoute = (notification) => {
  const { type, data } = notification;
  const parsedData = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {});

  switch (type) {
    case 'ORDER_UPDATE':
      // 주문 상세 페이지로 이동 (실제 경로: /dashboard/orders/[id])
      if (parsedData.orderId) {
        return { path: `/dashboard/orders/${parsedData.orderId}`, modal: null };
      }
      return { path: '/dashboard/orders', modal: null };

    case 'CHAT':
      // 채팅방으로 이동 (실제 경로: /dashboard/chat/rooms/[roomId])
      if (parsedData.chatRoomId || parsedData.roomId) {
        const roomId = parsedData.chatRoomId || parsedData.roomId;
        return { path: `/dashboard/chat/rooms/${roomId}`, modal: null };
      }
      return { path: '/dashboard/chat', modal: null };

    case 'REVIEW':
      // 리뷰 페이지로 이동, 특정 리뷰 모달
      if (parsedData.reviewId) {
        return { path: '/dashboard/reviews', modal: { type: 'review', id: parsedData.reviewId } };
      }
      return { path: '/dashboard/reviews', modal: null };

    case 'PAYMENT':
      // 결제 페이지로 이동 (실제 경로: /dashboard/payments)
      if (parsedData.paymentId) {
        return { path: '/dashboard/payments', modal: { type: 'payment', id: parsedData.paymentId } };
      }
      if (parsedData.settlementId) {
        return { path: '/dashboard/payments/settlement', modal: { type: 'settlement', id: parsedData.settlementId } };
      }
      return { path: '/dashboard/payments', modal: null };

    case 'DELIVERY':
      // 배달/주문 페이지로 이동 (실제 경로: /dashboard/orders/[id] 또는 /dashboard/delivery/tracking)
      if (parsedData.orderId) {
        return { path: `/dashboard/orders/${parsedData.orderId}`, modal: null };
      }
      if (parsedData.deliveryId) {
        return { path: '/dashboard/delivery/tracking', modal: { type: 'delivery', id: parsedData.deliveryId } };
      }
      return { path: '/dashboard/delivery', modal: null };

    case 'STORE':
      // 매장 설정 페이지로 이동
      return { path: '/dashboard/settings/store', modal: null };

    case 'PROMOTION':
      // 프로모션/쿠폰 페이지로 이동
      if (parsedData.promotionId) {
        return { path: '/dashboard/promotions', modal: { type: 'promotion', id: parsedData.promotionId } };
      }
      if (parsedData.couponId) {
        return { path: '/dashboard/promotions', modal: { type: 'coupon', id: parsedData.couponId } };
      }
      return { path: '/dashboard/promotions', modal: null };

    case 'SYSTEM':
    default:
      // 알림 전체 페이지로 이동
      return { path: '/dashboard/notifications', modal: null };
  }
};

const NotificationBell = ({ className = '' }) => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const dropdownRef = useRef(null);
  const observerRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);

  // 헤더 알림 훅 사용
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    filter,
    initialLoaded,  // 최초 로드 완료 여부 (캐시 상태)
    loadMore,
    markAsRead,
    markAllAsRead,
    refresh,        // 캐시 우선 새로고침
    forceRefresh,   // 강제 네트워크 새로고침
    changeFilter
  } = useHeaderNotification();

  // 탭 옵션
  const FILTER_TABS = [
    { key: 'ALL', label: t('notification.filterAll', '전체') },
    { key: 'UNREAD', label: t('notification.filterUnread', '안읽음') },
    { key: 'READ', label: t('notification.filterRead', '읽음') }
  ];

  // 시간 포맷팅
  const formatTime = useCallback((date) => {
    if (!date) return '';
    try {
      const locale = i18n.language === 'ko' ? ko : vi;
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale });
    } catch {
      return '';
    }
  }, [i18n.language]);

  // 알림 아이콘 컴포넌트 가져오기
  const getIconComponent = useCallback((type) => {
    return NOTIFICATION_ICONS[type] || Megaphone;
  }, []);

  // 알림 아이콘 색상 가져오기
  const getIconColor = useCallback((type) => {
    return NOTIFICATION_COLORS[type] || 'text-gray-500';
  }, []);

  // 드롭다운 토글 (캐시된 데이터가 있으면 네트워크 요청 안 함)
  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
    // 드롭다운 열 때만 refresh 호출 (이미 로드된 데이터가 있으면 캐시 사용)
    if (!isOpen) {
      refresh(); // 훅에서 initialLoaded 체크하여 캐시된 데이터 있으면 네트워크 요청 안 함
    }
  }, [isOpen, refresh]);

  // 알림 클릭 처리
  const handleNotificationClick = useCallback((notification) => {
    markAsRead(notification.id);

    const { path, modal } = getNotificationRoute(notification);

    // 모달 정보가 있으면 URL 파라미터로 전달
    if (modal) {
      const searchParams = new URLSearchParams();
      searchParams.set('modalType', modal.type);
      searchParams.set('modalId', modal.id);
      router.push(`${path}?${searchParams.toString()}`);
    } else {
      router.push(path);
    }

    setIsOpen(false);
  }, [markAsRead, router]);

  // Web용 알림만 필터링 (ORDER_UPDATE 제외)
  const filteredNotifications = notifications.filter(
    (n) => STORE_NOTIFICATION_TYPES.includes(n.type)
  );

  // 모두 읽음 처리
  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 무한 스크롤 설정 - 별도 ref callback 사용
  const setLoadMoreRef = useCallback((node) => {
    // 기존 observer 정리
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 노드가 없거나 드롭다운이 닫혀있으면 종료
    if (!node || !isOpen) return;

    // 새 observer 생성
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      {
        root: dropdownRef.current?.querySelector('.notification-list'),
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    observerRef.current.observe(node);
  }, [isOpen, hasMore, loading, loadMore]);

  // 드롭다운 닫힐 때 observer 정리
  useEffect(() => {
    if (!isOpen && observerRef.current) {
      observerRef.current.disconnect();
    }
  }, [isOpen]);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* 벨 아이콘 버튼 */}
      <button
        onClick={handleToggle}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        aria-label={t('notification.bell')}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-6 h-6 text-gray-700 dark:text-gray-300 animate-pulse" />
        ) : (
          <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        )}

        {/* 배지 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[9px] font-extrabold text-white leading-none bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-full shadow-lg">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          {/* 헤더 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('notification.title')}
              </h3>
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={unreadCount === 0}
              >
                {t('notification.markAllRead')}
              </button>
            </div>

            {/* 필터 탭 */}
            <div className="flex gap-1 mt-3">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => changeFilter(tab.key)}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    filter === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="notification-list max-h-96 overflow-y-auto">
            {loading && filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto" />
              </div>
            ) : filteredNotifications.length > 0 ? (
              <>
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                      !notification.isRead && 'bg-blue-50 dark:bg-blue-900/20'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {(() => {
                        const IconComponent = getIconComponent(notification.type);
                        return (
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                            'bg-gray-100 dark:bg-gray-700'
                          )}>
                            <IconComponent className={cn('w-5 h-5', getIconColor(notification.type))} />
                          </div>
                        );
                      })()}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm line-clamp-1',
                          !notification.isRead
                            ? 'font-semibold text-gray-900 dark:text-gray-100'
                            : 'text-gray-700 dark:text-gray-300'
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}

                {/* 더 로드 트리거 */}
                {hasMore && (
                  <div ref={setLoadMoreRef} className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto" />
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {t('notification.empty')}
                </p>
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                router.push('/dashboard/notifications');
                setIsOpen(false);
              }}
              className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
            >
              {t('notification.viewAll')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
