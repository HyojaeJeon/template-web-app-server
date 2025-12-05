/**
 * useOrder.js - 주문 관리 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 주문 상태 관리 및 실시간 업데이트
 * - POS 시스템과 양방향 통신
 * - Local 현지 배달 시간 기준 적용
 * - 주문 타이머 및 알림 시스템
 * - 접근성 준수 스크린리더 알림
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from '../../i18n';
import { useUnifiedSocket } from '../../../providers/UnifiedSocketProvider';
import { useAPI } from '../data/useAPI';
// // import { useAccessibility } from '../hooks/useAccessibility'; // 주석 처리
import { 
  updateOrderStatus, 
  addOrder, 
  removeOrder,
  updateOrder,
  setFilters
} from '../../../store/slices/orderSlice';
import { addNotification } from '../../../store/slices/notificationSlice';
import { formatVND, formatVietnamTime } from '../../utils/vietnam';
// // import { getCurrentVietnamTime } from '../utils/vietnam'; // 주석 처리

// Local 배달 표준 시간 (분)
const VIETNAM_DELIVERY_TIMES = {
  COOKING_MIN: 15,
  COOKING_MAX: 30,
  DELIVERY_MIN: 20,
  DELIVERY_MAX: 45,
  TOTAL_MAX: 75
};

// 4단계 통합 상태 매핑
const getSimplifiedKey = (serverStatus) => {
  const statusUpper = serverStatus?.toUpperCase();
  switch (statusUpper) {
    case 'PENDING': return 'waiting';
    case 'CONFIRMED':
    case 'PREPARING': return 'cooking';
    case 'READY':
    case 'PICKED_UP':
    case 'DELIVERING': return 'delivering';
    case 'COMPLETED':
    case 'DELIVERED': return 'completed';
    case 'CANCELLED':
    case 'REJECTED': return 'rejected';
    default: return 'waiting';
  }
};

// 주문 상태별 우선순위
const ORDER_STATUS_PRIORITY = {
  'pending': 1,
  'confirmed': 2,
  'preparing': 3,
  'ready': 4,
  'picked_up': 5,
  'delivering': 6,
  'delivered': 7,
  'cancelled': 8
};

export const useOrder = (orderId = null) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  // const { announceToScreenReader } = useAccessibility(); // 주석 처리
  const announceToScreenReader = () => {}; // 임시 더미 함수
  
  // Redux 상태
  const orders = useSelector(state => state.orders.orders);
  const orderFilter = useSelector(state => state.orders.filters);
  const isLoading = useSelector(state => state.orders.isLoading);
  
  // 로컬 상태
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [orderTimers, setOrderTimers] = useState({});
  const [urgentOrders, setUrgentOrders] = useState([]);
  
  // API 훅
  const api = useAPI({
    showErrorToast: true,
    retries: 2
  });
  
  // UnifiedSocket 연결 (실시간 주문 업데이트)
  const { 
    subscribe,
    unsubscribe,
    emit,
    isConnected: isSocketConnected
  } = useUnifiedSocket();

  const timerRef = useRef(null);
  const subscriptionRef = useRef(null);

  // 특정 주문 조회
  const currentOrder = orderId ? orders.find(order => order.id === orderId) : null;

  // UnifiedSocket 연결 및 이벤트 처리
  useEffect(() => {
    // 기존 구독 정리
    if (subscriptionRef.current) {
      unsubscribe(subscriptionRef.current);
    }
    
    // 주문 업데이트 구독
    if (isSocketConnected) {
      subscriptionRef.current = subscribe('orders:updates', handleOrderUpdate);
    }

    return () => {
      if (subscriptionRef.current) {
        unsubscribe(subscriptionRef.current);
      }
    };
  }, [subscribe, unsubscribe, isSocketConnected, dispatch, t]);

  // 실시간 주문 업데이트 처리
  const handleOrderUpdate = useCallback((data) => {
    const { type, payload } = data;
    
    switch (type) {
      case 'ORDER_CREATED':
        dispatch(addOrder(payload));
        announceToScreenReader(
          t('orders.notifications.newOrder', { orderNumber: payload.orderNumber }) ||
          `새 주문 ${payload.orderNumber}번이 도착했습니다`
        );
        
        // 새 주문 알림
        dispatch(addNotification({
          type: 'info',
          message: t('orders.notifications.newOrder', { orderNumber: payload.orderNumber }),
          duration: 5000,
          actions: [{
            label: t('common.actions.view') || '보기',
            onClick: () => viewOrderDetails(payload.id)
          }]
        }));
        break;
        
      case 'ORDER_UPDATED':
        dispatch(updateOrder(payload));
        
        // 상태 변경 알림 (4단계 통합 상태)
        if (payload.status) {
          const simplifiedKey = getSimplifiedKey(payload.status);
          announceToScreenReader(
            t('orders.notifications.statusUpdated', {
              orderNumber: payload.orderNumber,
              status: t(`orders.statusSimplified.${simplifiedKey}`)
            }) || `주문 ${payload.orderNumber}번 상태가 ${simplifiedKey}로 변경되었습니다`
          );
        }
        break;
        
      case 'ORDER_CANCELLED':
        dispatch(updateOrderStatus({ id: payload.id, status: 'cancelled' }));
        announceToScreenReader(
          t('orders.notifications.orderCancelled', { orderNumber: payload.orderNumber }) ||
          `주문 ${payload.orderNumber}번이 취소되었습니다`
        );
        break;
        
      default:
        console.log('알 수 없는 주문 이벤트:', type, payload);
    }
  }, [dispatch, announceToScreenReader, t]);

  // 주문 타이머 업데이트
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const now = new Date();
      const newTimers = {};
      const newUrgentOrders = [];
      
      orders.forEach(order => {
        if (['confirmed', 'preparing'].includes(order.status)) {
          const orderTime = new Date(order.createdAt);
          const elapsedMinutes = Math.floor((now - orderTime) / 60000);
          const estimatedTotal = VIETNAM_DELIVERY_TIMES.COOKING_MAX + VIETNAM_DELIVERY_TIMES.DELIVERY_MAX;
          
          newTimers[order.id] = {
            elapsed: elapsedMinutes,
            estimated: estimatedTotal,
            remaining: Math.max(0, estimatedTotal - elapsedMinutes),
            isOverdue: elapsedMinutes > estimatedTotal,
            urgencyLevel: elapsedMinutes > estimatedTotal ? 'critical' : 
                         elapsedMinutes > estimatedTotal * 0.8 ? 'warning' : 'normal'
          };
          
          // 긴급 주문 처리
          if (elapsedMinutes > estimatedTotal * 0.8) {
            newUrgentOrders.push(order.id);
          }
        }
      });
      
      setOrderTimers(newTimers);
      setUrgentOrders(newUrgentOrders);
    }, 30000); // 30초마다 업데이트

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [orders]);

  // 주문 상태 변경
  const changeOrderStatus = useCallback(async (orderId, newStatus, additionalData = {}) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error('주문을 찾을 수 없습니다');

      // 낙관적 업데이트
      dispatch(updateOrderStatus({ 
        id: orderId, 
        status: newStatus,
        ...additionalData 
      }));

      // 서버에 상태 변경 요청
      const mutation = `
        mutation UpdateOrderStatus($orderId: ID!, $status: OrderStatus!, $additionalData: JSON) {
          updateOrderStatus(orderId: $orderId, status: $status, additionalData: $additionalData) {
            id
            status
            statusUpdatedAt
            estimatedTime
          }
        }
      `;

      await api.mutate(mutation, {
        orderId,
        status: newStatus,
        additionalData
      });

      // POS 시스템에 알림 (UnifiedSocket)
      if (isSocketConnected) {
        emit('orders:status_changed', {
          type: 'STATUS_CHANGED',
          orderId,
          newStatus,
          timestamp: new Date().toISOString()
        });
      }

      // 성공 알림 (4단계 통합 상태)
      const simplifiedKey = getSimplifiedKey(newStatus);
      dispatch(addNotification({
        type: 'success',
        message: t('orders.notifications.statusUpdated', {
          orderNumber: order.orderNumber,
          status: t(`orders.statusSimplified.${simplifiedKey}`)
        }) || `주문 상태가 ${simplifiedKey}로 변경되었습니다`
      }));

    } catch (error) {
      // 롤백
      dispatch(updateOrder(orders.find(o => o.id === orderId)));
      
      dispatch(addNotification({
        type: 'error',
        message: t('orders.notifications.statusUpdateFailed') || '주문 상태 변경에 실패했습니다'
      }));
      
      throw error;
    }
  }, [orders, dispatch, api, isSocketConnected, emit, t]);

  // 주문 세부 정보 조회
  const viewOrderDetails = useCallback((orderId) => {
    // 라우터로 주문 상세 페이지 이동 로직
    window.location.href = `/orders/${orderId}`;
  }, []);

  // 주문 필터링
  const filteredOrders = useCallback(() => {
    let filtered = [...orders];
    
    // 상태 필터
    if (orderFilter.status && orderFilter.status !== 'all') {
      filtered = filtered.filter(order => order.status === orderFilter.status);
    }
    
    // 날짜 필터
    if (orderFilter.dateRange) {
      const { start, end } = orderFilter.dateRange;
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= start && orderDate <= end;
      });
    }
    
    // 검색어 필터
    if (orderFilter.searchTerm) {
      const term = orderFilter.searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(term) ||
        order.customerName?.toLowerCase().includes(term) ||
        order.items?.some(item => 
          item.name?.toLowerCase().includes(term)
        )
      );
    }
    
    return filtered;
  }, [orders, orderFilter]);

  // 주문 정렬 (기본: 최신 주문 먼저)
  const sortedOrders = useCallback(() => {
    const filtered = filteredOrders();
    
    return filtered.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA; // 최신 주문 먼저
    });
  }, [filteredOrders]);

  // 주문 통계 계산
  const orderStats = useCallback(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayOrders = orders.filter(order => 
      new Date(order.createdAt) >= todayStart
    );
    
    const stats = {
      total: orders.length,
      today: todayOrders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      completed: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      revenue: {
        today: todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        total: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
      }
    };
    
    return stats;
  }, [orders]);

  return {
    // 상태
    orders: sortedOrders(),
    currentOrder,
    selectedOrders,
    orderTimers,
    urgentOrders,
    orderStats: orderStats(),
    isLoading,
    isSocketConnected,
    
    // 액션
    changeOrderStatus,
    viewOrderDetails,
    setSelectedOrders,
    
    // 필터
    orderFilter,
    setFilter: (filter) => dispatch(setFilters(filter)),
    
    // UnifiedSocket 연결
    subscriptionRef,
    socketSubscribe: subscribe,
    socketUnsubscribe: unsubscribe,
    socketEmit: emit,
    
    // 유틸리티
    formatPrice: formatVND,
    formatTime: formatVietnamTime,
    
    // 상수
    DELIVERY_TIMES: VIETNAM_DELIVERY_TIMES,
    STATUS_PRIORITY: ORDER_STATUS_PRIORITY
  };
};

export default useOrder;