/**
 * useStoreServices - useAuth 기반 storeId를 사용하는 서비스 훅
 * 
 * 이 훅은 useAuth 훅에서 storeId를 가져와서 
 * OrderStatusNotificationService와 SocketClient를 초기화합니다.
 */

import { useEffect, useMemo } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { getOrderStatusNotificationService } from '@/features/notifications/services/OrderStatusNotificationService';
import { useUnifiedSocket } from '@/providers/UnifiedSocketProvider';

export const useStoreServices = () => {
  const { user } = useAuth();
  // StoreAccount 모델 기준 (점주앱)
  const storeId = user?.storeId;
  
  // OrderStatusNotificationService 초기화
  const notificationService = useMemo(() => {
    if (storeId) {
      return getOrderStatusNotificationService(storeId);
    }
    return null;
  }, [storeId]);
  
  // 통합 Socket 사용
  const unifiedSocket = useUnifiedSocket();
  
  // storeId가 변경될 때마다 서비스들 재초기화
  useEffect(() => {
    if (storeId) {
      console.log('🏪 Store services initialized for storeId:', storeId);
    }
  }, [storeId]);
  
  return {
    storeId,
    notificationService,
    socketClient: unifiedSocket, // 통합 Socket으로 변경
    isReady: !!storeId && unifiedSocket?.isConnected
  };
};

export default useStoreServices;