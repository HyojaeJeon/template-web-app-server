/**
 * 알림 상태 관리 슬라이스
 * Local 배달 앱 점주 알림 시스템
 */
import { createSlice } from '@reduxjs/toolkit';

// 초기 상태
const initialState = {
  notifications: [],
  unreadCount: 0,
  settings: {
    sound: true,
    push: true,
    email: true,
    desktop: true
  },
  isConnected: false,
  lastUpdated: null
};

// 알림 타입 정의
export const NOTIFICATION_TYPES = {
  ORDER: 'order',
  PAYMENT: 'payment',
  DELIVERY: 'delivery',
  SYSTEM: 'system',
  PROMOTION: 'promotion'
};

// 알림 우선순위
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // 알림 추가
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
        read: false,
        ...action.payload
      };
      
      state.notifications.unshift(notification);
      state.unreadCount += 1;
      state.lastUpdated = Date.now();
      
      // 최대 100개의 알림만 유지
      if (state.notifications.length > 100) {
        state.notifications = state.notifications.slice(0, 100);
      }
    },

    // 알림 읽음 처리
    markAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.lastUpdated = Date.now();
      }
    },

    // 모든 알림 읽음 처리
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
      state.lastUpdated = Date.now();
    },

    // 알림 삭제
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      const notificationIndex = state.notifications.findIndex(n => n.id === notificationId);
      
      if (notificationIndex !== -1) {
        const notification = state.notifications[notificationIndex];
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(notificationIndex, 1);
        state.lastUpdated = Date.now();
      }
    },

    // 모든 알림 삭제
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.lastUpdated = Date.now();
    },

    // 알림 설정 업데이트
    updateSettings: (state, action) => {
      state.settings = {
        ...state.settings,
        ...action.payload
      };
      state.lastUpdated = Date.now();
    },

    // 연결 상태 업데이트
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
      state.lastUpdated = Date.now();
    },

    // 알림 목록 초기화 (서버에서 받은 데이터로)
    setNotifications: (state, action) => {
      const notifications = action.payload;
      state.notifications = notifications;
      state.unreadCount = notifications.filter(n => !n.read).length;
      state.lastUpdated = Date.now();
    }
  }
});

// 액션 생성자 내보내기
export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAllNotifications,
  updateSettings,
  setConnectionStatus,
  setNotifications
} = notificationSlice.actions;

// 추가 액션 크리에이터
export const requestNotificationPermission = () => async (dispatch) => {
  try {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      dispatch(updateSettings({ push: permission === 'granted' }));
      return permission;
    }
    return 'denied';
  } catch (error) {
    console.error('Notification permission error:', error);
    return 'denied';
  }
};

export const updateNotificationSettings = (settings) => (dispatch) => {
  dispatch(updateSettings(settings));
};

// 셀렉터
export const selectAllNotifications = (state) => state.notifications.notifications;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationSettings = (state) => state.notifications.settings;
export const selectConnectionStatus = (state) => state.notifications.isConnected;
export const selectUnreadNotifications = (state) => 
  state.notifications.notifications.filter(notification => !notification.read);

// 타입별 알림 셀렉터
export const selectNotificationsByType = (type) => (state) =>
  state.notifications.notifications.filter(notification => notification.type === type);

// 우선순위별 알림 셀렉터
export const selectNotificationsByPriority = (priority) => (state) =>
  state.notifications.notifications.filter(notification => notification.priority === priority);

// 리듀서 내보내기
export default notificationSlice.reducer;