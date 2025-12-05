/**
 * useNotification.js - 점주앱 알림 관리 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 *
 * @description
 * - GraphQL로 초기 데이터 로드 + Socket.IO로 실시간 업데이트
 * - Apollo Client cache 기반 상태 관리
 * - 브라우저 알림 및 사운드 통합
 * - 무한 스크롤 페이지네이션
 * - 읽음/삭제/필터링 기능
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useUnifiedSocket } from '@/providers/UnifiedSocketProvider';
import { useAuth } from './useAuth';
import { browserNotificationService } from '@/shared/services/browserNotificationService';
import {
  S_GET_NOTIFICATIONS,
  S_GET_UNREAD_NOTIFICATION_COUNT
} from '@/gql/queries/notifications';
import {
  S_MARK_NOTIFICATIONS_READ,
  S_MARK_ALL_NOTIFICATIONS_READ,
  S_DELETE_NOTIFICATIONS
} from '@/gql/mutations/notifications';

/**
 * 점주앱 알림 관리 훅
 * @param {Object} options 옵션
 * @returns {Object} 알림 데이터 및 액션 함수들
 */
export const useNotification = (options = {}) => {
  const {
    enableBrowserNotifications = false,
    enableSound = false,
    autoFetch = true,
    initialLimit = 20
  } = options;

  const { user, isAuthenticated } = useAuth();
  const socket = useUnifiedSocket();

  // ============ 상태 관리 ============
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [notifications, setNotifications] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const isMountedRef = useRef(true);
  const loadingMoreRef = useRef(false);

  // ============ 인증 상태 확인 ============
  // ✅ 클라이언트에서만 토큰 확인 (SSR hydration 문제 방지)
  const [hasToken, setHasToken] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // 클라이언트에서만 localStorage 접근
    setIsClient(true);
    const token = localStorage.getItem('accessStoreToken');
    setHasToken(!!token);
    console.log('[useNotification] 🔑 Token check:', { hasToken: !!token, token: token?.substring(0, 20) + '...' });
  }, []);

  // Redux 상태가 아직 로드되지 않아도 토큰이 있으면 인증된 것으로 간주
  const isEffectivelyAuthenticated = isAuthenticated || hasToken;

  // ============ GraphQL 쿼리 ============

  // Skip 조건 로깅
  useEffect(() => {
    const skipConditions = {
      autoFetch,
      hasUser: !!user,
      isAuthenticated,
      hasToken,
      isEffectivelyAuthenticated
    };
    const willSkip = !autoFetch || !hasToken;

    console.log('[useNotification] 🔍 Query Skip Conditions:', {
      ...skipConditions,
      willSkipQuery: willSkip
    });
  }, [autoFetch, user, isAuthenticated, hasToken, isEffectivelyAuthenticated]);

  // 알림 목록 조회
  const {
    data: notificationsData,
    loading,
    error,
    refetch,
    fetchMore
  } = useQuery(S_GET_NOTIFICATIONS, {
    variables: {
      input: {
        page: 1,
        limit: initialLimit,
        // filter가 'ALL'이면 undefined로 전달하여 필터링 없이 전체 조회
        category: filter && filter !== 'ALL' ? filter : undefined
      }
    },
    // ✅ 토큰 기반 skip 조건: Redux hydration 전에도 토큰이 있으면 쿼리 실행
    skip: !autoFetch || !hasToken,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  // Query 상태 로깅
  useEffect(() => {
    console.log('[useNotification] 📊 Query State:', {
      loading,
      hasError: !!error,
      errorMessage: error?.message,
      hasData: !!notificationsData,
      dataKeys: notificationsData ? Object.keys(notificationsData) : []
    });
  }, [loading, error, notificationsData]);

  // ✅ 토큰이 확인되면 데이터 refetch (SSR → CSR 전환 시)
  useEffect(() => {
    if (hasToken && autoFetch && isClient) {
      console.log('[useNotification] 🔄 Token confirmed, triggering refetch...');
      refetch();
    }
  }, [hasToken, autoFetch, isClient]); // refetch는 의존성에서 제외 (안정적인 참조)

  // ✅ notificationsData가 변경될 때마다 상태 업데이트
  useEffect(() => {
    if (notificationsData?.sGetNotifications?.notifications) {
      const newNotifications = notificationsData.sGetNotifications.notifications;

      // 빈 배열이어도 업데이트 (캐시 초기화 케이스)
      setNotifications(newNotifications);
      setHasMore(notificationsData.sGetNotifications.hasMore ?? true);

      console.log('[useNotification] ✅ State updated:', {
        count: newNotifications.length,
        hasMore: notificationsData.sGetNotifications.hasMore,
        firstItem: newNotifications[0]?.title
      });
    }
  }, [notificationsData?.sGetNotifications]);

  // 읽지 않은 알림 수 조회
  const {
    data: unreadCountData,
    refetch: refetchUnreadCount
  } = useQuery(S_GET_UNREAD_NOTIFICATION_COUNT, {
    // ✅ 토큰 기반 skip 조건: Redux hydration 전에도 토큰이 있으면 쿼리 실행
    skip: !hasToken,
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000 // 30초마다 자동 갱신
  });

  // ============ GraphQL 뮤테이션 ============

  // 알림 읽음 처리
  const [markNotificationsReadMutation] = useMutation(S_MARK_NOTIFICATIONS_READ, {
    onCompleted: () => {
      refetchUnreadCount();
    }
  });

  // 모든 알림 읽음 처리
  const [markAllNotificationsReadMutation] = useMutation(S_MARK_ALL_NOTIFICATIONS_READ, {
    onCompleted: () => {
      refetchUnreadCount();
      refetch();
    }
  });

  // 알림 삭제
  const [deleteNotificationsMutation] = useMutation(S_DELETE_NOTIFICATIONS, {
    onCompleted: () => {
      refetch();
      refetchUnreadCount();
    }
  });

  // ============ Socket.IO 실시간 업데이트 ============

  useEffect(() => {
    if (!socket?.socket || !user) return;

    const socketInstance = socket.socket;

    // 새 알림 실시간 수신
    const handleNewNotification = (notification) => {
      if (!isMountedRef.current) return;

      // 알림 목록에 추가 (최신이 위로)
      setNotifications(prev => [notification, ...prev]);

      // 읽지 않은 수 증가
      refetchUnreadCount();

      // 브라우저 알림 표시
      if (enableBrowserNotifications) {
        browserNotificationService.showNotification({
          title: notification.title,
          body: notification.body,
          icon: '/logo.png',
          tag: `notification-${notification.id}`,
          data: notification.data
        });
      }

      // 사운드 재생
      if (enableSound) {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(err => console.warn('Audio play failed:', err));
      }
    };

    // 알림 읽음 상태 변경
    const handleNotificationRead = (data) => {
      if (!isMountedRef.current) return;

      setNotifications(prev => prev.map(notification => {
        if (data.notificationIds?.includes(notification.id)) {
          return {
            ...notification,
            isRead: data.isRead,
            readAt: data.isRead ? new Date().toISOString() : null
          };
        }
        return notification;
      }));

      refetchUnreadCount();
    };

    // 읽지 않은 알림 수 변경
    const handleUnreadCountChanged = () => {
      if (!isMountedRef.current) return;
      refetchUnreadCount();
    };

    // Socket 이벤트 리스너 등록
    socketInstance.on('notification:new', handleNewNotification);
    socketInstance.on('notification:marked', handleNotificationRead);
    socketInstance.on('notification:unreadCountChanged', handleUnreadCountChanged);

    // 정리 함수
    return () => {
      socketInstance.off('notification:new', handleNewNotification);
      socketInstance.off('notification:marked', handleNotificationRead);
      socketInstance.off('notification:unreadCountChanged', handleUnreadCountChanged);
    };
  }, [socket, user, enableBrowserNotifications, enableSound, refetchUnreadCount]);

  // ============ 액션 함수들 ============

  /**
   * 특정 알림을 읽음 처리
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await markNotificationsReadMutation({
        variables: {
          input: {
            notificationIds: [notificationId],
            isRead: true
          }
        }
      });

      // 로컬 상태 즉시 업데이트
      setNotifications(prev => prev.map(n =>
        n.id === notificationId
          ? { ...n, isRead: true, readAt: new Date().toISOString() }
          : n
      ));

      return { success: true };
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return { success: false, error };
    }
  }, [markNotificationsReadMutation]);

  /**
   * 모든 알림을 읽음 처리
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsReadMutation();

      // 로컬 상태 즉시 업데이트
      setNotifications(prev => prev.map(n => ({
        ...n,
        isRead: true,
        readAt: new Date().toISOString()
      })));

      return { success: true };
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return { success: false, error };
    }
  }, [markAllNotificationsReadMutation]);

  /**
   * 알림 삭제
   */
  const deleteNotifications = useCallback(async (notificationIds) => {
    try {
      await deleteNotificationsMutation({
        variables: {
          notificationIds: Array.isArray(notificationIds) ? notificationIds : [notificationIds]
        }
      });

      // 로컬 상태에서 제거
      setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));

      return { success: true };
    } catch (error) {
      console.error('Failed to delete notifications:', error);
      return { success: false, error };
    }
  }, [deleteNotificationsMutation]);

  /**
   * 더 많은 알림 로드 (무한 스크롤)
   */
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || loading) return;

    loadingMoreRef.current = true;
    const nextPage = page + 1;

    try {
      const result = await fetchMore({
        variables: {
          input: {
            page: nextPage,
            limit: initialLimit,
            // filter가 'ALL'이면 undefined로 전달
            category: filter && filter !== 'ALL' ? filter : undefined
          }
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;

          const newNotifications = fetchMoreResult.sGetNotifications.notifications;
          const hasMoreData = fetchMoreResult.sGetNotifications.hasMore;

          setNotifications(prevNotifications => [
            ...prevNotifications,
            ...newNotifications
          ]);
          setHasMore(hasMoreData);
          setPage(nextPage);

          return {
            sGetNotifications: {
              ...fetchMoreResult.sGetNotifications,
              notifications: [
                ...prev.sGetNotifications.notifications,
                ...newNotifications
              ]
            }
          };
        }
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to load more notifications:', error);
      return { success: false, error };
    } finally {
      loadingMoreRef.current = false;
    }
  }, [page, hasMore, loading, filter, initialLimit, fetchMore]);

  /**
   * 필터 변경
   */
  const changeFilter = useCallback((newFilter) => {
    setFilter(newFilter);
    setPage(1);
    setNotifications([]);
    refetch({
      input: {
        page: 1,
        limit: initialLimit,
        // newFilter가 'ALL'이면 undefined로 전달
        category: newFilter && newFilter !== 'ALL' ? newFilter : undefined
      }
    });
  }, [initialLimit, refetch]);

  // ============ 컴포넌트 언마운트 시 정리 ============
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ============ 반환 값 ============
  return {
    // 데이터
    notifications,
    unreadCount: unreadCountData?.sGetUnreadNotificationCount || 0,
    totalCount: notificationsData?.sGetNotifications?.totalCount || 0,

    // 상태
    loading,
    error,
    hasMore,
    filter,

    // 액션 함수
    markAsRead,
    markAllAsRead,
    deleteNotifications,
    loadMore,
    refetch,
    setFilter: changeFilter,

    // 유틸리티
    isConnected: socket?.state?.isConnected || false
  };
};

export default useNotification;
