/**
 * useHeaderNotification.js - 헤더 알림 벨 전용 훅
 *
 * 간소화된 구현:
 * - 필수 필드만 조회 (id, type, title, body, isRead, createdAt)
 * - 클라이언트 마운트 후 쿼리 실행
 * - 무한 스크롤 지원
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import {
  S_GET_HEADER_NOTIFICATIONS,
  S_GET_HEADER_UNREAD_COUNT,
  S_MARK_HEADER_NOTIFICATION_READ,
  S_MARK_ALL_HEADER_NOTIFICATIONS_READ
} from '@/gql/headerNotifications';

const LIMIT = 10;

/**
 * 헤더 알림 벨 전용 훅
 */
export const useHeaderNotification = () => {
  const client = useApolloClient();
  const [isClient, setIsClient] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'READ' | 'UNREAD'
  const [initialLoaded, setInitialLoaded] = useState(false); // 최초 로드 완료 여부
  const pageRef = useRef(1);
  const loadingMoreRef = useRef(false);

  // 클라이언트 마운트 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 토큰 확인
  const hasToken = isClient && !!localStorage.getItem('accessStoreToken');

  // 필터에 따른 isRead 값 계산
  const getIsReadFilter = (filterValue) => {
    if (filterValue === 'READ') return true;
    if (filterValue === 'UNREAD') return false;
    return undefined; // ALL
  };

  // 알림 목록 조회 (캐시 우선 정책)
  const {
    data,
    loading,
    error,
    refetch
  } = useQuery(S_GET_HEADER_NOTIFICATIONS, {
    variables: {
      input: {
        page: 1,
        limit: LIMIT,
        isRead: getIsReadFilter(filter)
      }
    },
    skip: !hasToken,
    fetchPolicy: initialLoaded ? 'cache-first' : 'cache-and-network', // 최초에만 네트워크, 이후 캐시 우선
    onCompleted: (result) => {
      if (result?.sGetNotifications?.notifications) {
        setNotifications(result.sGetNotifications.notifications);
        setHasMore(result.sGetNotifications.hasMore);
        pageRef.current = 1;
        setInitialLoaded(true); // 최초 로드 완료 표시
      }
    }
  });

  // 읽지 않은 알림 수 조회 (캐시 우선, 주기적 갱신)
  const { data: unreadData, refetch: refetchUnreadCount } = useQuery(S_GET_HEADER_UNREAD_COUNT, {
    skip: !hasToken,
    fetchPolicy: 'cache-and-network', // 캐시된 데이터 먼저 보여주고, 백그라운드에서 갱신
    pollInterval: 60000 // 1분마다 갱신
  });

  // 알림 읽음 처리 뮤테이션
  const [markReadMutation] = useMutation(S_MARK_HEADER_NOTIFICATION_READ);
  const [markAllReadMutation] = useMutation(S_MARK_ALL_HEADER_NOTIFICATIONS_READ);

  // 토큰이 확인되면 데이터 다시 로드
  useEffect(() => {
    if (hasToken && isClient) {
      refetch?.();
      refetchUnreadCount?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken, isClient]);

  // 더 많은 알림 로드
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || loading) return;

    loadingMoreRef.current = true;
    const nextPage = pageRef.current + 1;

    try {
      const result = await client.query({
        query: S_GET_HEADER_NOTIFICATIONS,
        variables: {
          input: {
            page: nextPage,
            limit: LIMIT,
            isRead: getIsReadFilter(filter)
          }
        },
        fetchPolicy: 'cache-first' // 캐시된 페이지가 있으면 캐시 사용
      });

      if (result.data?.sGetNotifications) {
        const newNotifications = result.data.sGetNotifications.notifications;
        // 중복 제거: 기존 알림 ID와 비교하여 새 알림만 추가
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const uniqueNewNotifications = newNotifications.filter(n => !existingIds.has(n.id));
          return [...prev, ...uniqueNewNotifications];
        });
        setHasMore(result.data.sGetNotifications.hasMore);
        pageRef.current = nextPage;
      }
    } catch (err) {
      console.error('[useHeaderNotification] Load more error:', err);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [client, hasMore, loading, filter]);

  // 필터 변경
  const changeFilter = useCallback((newFilter) => {
    setFilter(newFilter);
    setNotifications([]);
    setHasMore(true);
    pageRef.current = 1;
  }, []);

  // 알림 읽음 처리
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await markReadMutation({
        variables: {
          input: {
            notificationIds: [notificationId],
            isRead: true
          }
        }
      });

      // 로컬 상태 업데이트
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );

      // 읽지 않은 수 갱신
      refetchUnreadCount();

      return { success: true };
    } catch (err) {
      console.error('[useHeaderNotification] Mark as read error:', err);
      return { success: false, error: err };
    }
  }, [markReadMutation, refetchUnreadCount]);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(async () => {
    try {
      await markAllReadMutation();

      // 로컬 상태 업데이트
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );

      // 읽지 않은 수 갱신
      refetchUnreadCount();

      return { success: true };
    } catch (err) {
      console.error('[useHeaderNotification] Mark all as read error:', err);
      return { success: false, error: err };
    }
  }, [markAllReadMutation, refetchUnreadCount]);

  // 새로고침 (캐시 사용) - 드롭다운 열 때 사용
  const refresh = useCallback(async () => {
    // initialLoaded가 true면 캐시된 데이터 그대로 사용 (네트워크 요청 안 함)
    if (initialLoaded && notifications.length > 0) {
      return; // 이미 로드된 데이터가 있으면 아무것도 안 함
    }
    pageRef.current = 1;
    await refetch();
    await refetchUnreadCount();
  }, [refetch, refetchUnreadCount, initialLoaded, notifications.length]);

  // 강제 새로고침 (네트워크 요청) - 수동 새로고침 버튼에서 사용
  const forceRefresh = useCallback(async () => {
    pageRef.current = 1;
    setInitialLoaded(false); // 초기화하여 network-only로 동작하게 함
    await refetch();
    await refetchUnreadCount();
  }, [refetch, refetchUnreadCount]);

  return {
    // 데이터
    notifications,
    unreadCount: unreadData?.sGetUnreadNotificationCount || 0,
    totalCount: data?.sGetNotifications?.totalCount || 0,

    // 상태
    loading,
    error,
    hasMore,
    filter,
    initialLoaded, // 최초 로드 완료 여부 (캐시 상태 확인용)

    // 액션
    loadMore,
    markAsRead,
    markAllAsRead,
    refresh,        // 캐시 우선 새로고침 (드롭다운 토글용)
    forceRefresh,   // 강제 네트워크 새로고침 (수동 새로고침 버튼용)
    changeFilter
  };
};

export default useHeaderNotification;
