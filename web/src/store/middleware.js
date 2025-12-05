/**
 * Redux Middleware Configuration
 * Custom middleware for the application
 */
import { isRejectedWithValue } from '@reduxjs/toolkit';
import { logout } from './slices/authSlice';

/**
 * API 에러 처리 미들웨어
 * 401 에러 시 자동 로그아웃 처리
 */
export const rtkQueryErrorLogger = (api) => (next) => (action) => {
  // RTK Query가 rejected 상태이고 payload가 있는 경우
  if (isRejectedWithValue(action)) {
    console.warn('API 요청 실패:', action.error?.data);

    // 401 Unauthorized 에러 시 자동 로그아웃
    if (action.payload?.status === 401) {
      api.dispatch(logout());
      
      // 알림 표시 (토스트 메시지)
      api.dispatch({
        type: 'notifications/addNotification',
        payload: {
          type: 'error',
          message: '로그인이 만료되었습니다. 다시 로그인해주세요.',
          duration: 5000,
        },
      });
    }

    // 500 에러 시 에러 알림
    if (action.payload?.status >= 500) {
      api.dispatch({
        type: 'notifications/addNotification',
        payload: {
          type: 'error',
          message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          duration: 5000,
        },
      });
    }
  }

  return next(action);
};

/**
 * Localization Middleware
 * Currency formatting and localization handling
 */
export const vietnamLocalizationMiddleware = (api) => (next) => (action) => {
  // Format price information in order-related actions
  if (action.type?.includes('order') && action.payload?.price) {
    const formattedPayload = {
      ...action.payload,
      formattedPrice: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(action.payload.price),
    };
    action.payload = formattedPayload;
  }

  return next(action);
};

/**
 * 실시간 데이터 동기화 미들웨어
 * WebSocket 연결을 통한 실시간 업데이트 처리
 */
export const realtimeSyncMiddleware = (api) => (next) => (action) => {
  // 주문 상태 변경 시 실시간 알림
  // 이제 컴포넌트에서 UnifiedSocketProvider를 통해 직접 처리
  // Redux middleware는 React Context를 접근할 수 없으므로
  // 액션에 socketCallback을 포함시켜 컴포넌트에서 처리하도록 변경
  if (action.type === 'orders/updateOrderStatus' && action.meta?.socketCallback) {
    // 컴포넌트에서 전달한 콜백 실행
    action.meta.socketCallback({
      orderId: action.payload.orderId,
      status: action.payload.status,
      timestamp: new Date().toISOString(),
    });
  }

  return next(action);
};

/**
 * 개발 환경 로깅 미들웨어 (로깅 비활성화됨)
 */
export const devLoggingMiddleware = (api) => (next) => (action) => {
  // 로깅 완전히 비활성화
  // if (process.env.NODE_ENV === 'development') {
  //   console.group(`Action: ${action.type}`);
  //   console.log('Payload:', action.payload);
  //   console.log('Previous State:', api.getState());
  // }

  const result = next(action);

  // if (process.env.NODE_ENV === 'development') {
  //   console.log('Next State:', api.getState());
  //   console.groupEnd();
  // }

  return result;
};

/**
 * 캐시 무효화 미들웨어
 * 특정 액션 발생 시 관련 캐시를 자동으로 무효화
 */
export const cacheInvalidationMiddleware = (api) => (next) => (action) => {
  const result = next(action);

  // 메뉴 업데이트 시 관련 캐시 무효화
  if (action.type?.startsWith('menu/')) {
    if (typeof window !== 'undefined' && window.apolloClient) {
      window.apolloClient.cache.evict({ 
        fieldName: 'getMenuItems' 
      });
      window.apolloClient.cache.gc();
    }
  }

  // 주문 상태 변경 시 주문 목록 캐시 무효화
  if (action.type === 'orders/updateOrderStatus') {
    if (typeof window !== 'undefined' && window.apolloClient) {
      window.apolloClient.cache.evict({ 
        fieldName: 'getOrders' 
      });
      window.apolloClient.cache.gc();
    }
  }

  return result;
};