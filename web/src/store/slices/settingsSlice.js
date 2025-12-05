/**
 * Settings State Management Slice
 * Store settings management
 */
import { createSlice } from '@reduxjs/toolkit';

// 초기 상태
const initialState = {
  // 일반 설정
  general: {
    language: 'vi', // vi, en, ko
    timezone: 'Asia/Ho_Chi_Minh',
    currency: 'VND',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h' // 12h, 24h
  },

  // 테마 설정
  theme: {
    mode: 'light', // light, dark, auto
    primaryColor: '#2AC1BC', // Primary color (mint)
    secondaryColor: '#00B14F', // Secondary color (green)
    fontSize: 'medium', // small, medium, large
    reducedMotion: false
  },

  // 알림 설정
  notifications: {
    sound: true,
    vibration: true,
    push: true,
    email: true,
    desktop: true,
    orderNotifications: true,
    paymentNotifications: true,
    deliveryNotifications: true,
    systemNotifications: true,
    promotionNotifications: false
  },

  // POS 설정
  pos: {
    autoAcceptOrders: false,
    orderTimeout: 30, // 분
    kitchenDisplayEnabled: true,
    receiptPrinter: {
      enabled: true,
      copies: 2,
      paperSize: 'A4'
    },
    soundAlerts: {
      newOrder: true,
      orderReady: true,
      paymentReceived: true
    }
  },

  // 배달 설정
  delivery: {
    radius: 5, // km
    estimatedTime: 30, // 분
    feeStructure: {
      baseFee: 15000, // VND
      perKmFee: 3000, // VND
      minimumOrder: 50000 // VND
    },
    workingHours: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '22:00', closed: false },
      saturday: { open: '09:00', close: '23:00', closed: false },
      sunday: { open: '10:00', close: '22:00', closed: false }
    }
  },

  // 결제 설정
  payment: {
    acceptCOD: true,
    acceptMomo: true,
    acceptZaloPay: true,
    acceptVNPay: true,
    acceptBankTransfer: false,
    autoConfirmPayment: true,
    paymentTimeout: 15 // 분
  },

  // 보안 설정
  security: {
    sessionTimeout: 30, // 분
    twoFactorAuth: false,
    loginNotifications: true,
    deviceTracking: true,
    ipWhitelist: []
  },

  // 접근성 설정
  accessibility: {
    highContrast: false,
    screenReader: false,
    keyboardNavigation: true,
    fontSize: 'normal', // small, normal, large
    announcements: true
  },

  // 개발자 설정
  developer: {
    debugMode: false,
    showConsole: false,
    apiLogging: false,
    performanceMonitoring: false
  },

  // 백업 설정
  backup: {
    autoBackup: true,
    backupFrequency: 'daily', // hourly, daily, weekly
    backupRetention: 30, // days
    cloudBackup: false
  },

  lastUpdated: null,
  version: '1.0.0'
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // 일반 설정 업데이트
    updateGeneralSettings: (state, action) => {
      state.general = {
        ...state.general,
        ...action.payload
      };
      state.lastUpdated = Date.now();
    },

    // 테마 설정 업데이트
    updateThemeSettings: (state, action) => {
      state.theme = {
        ...state.theme,
        ...action.payload
      };
      state.lastUpdated = Date.now();
    },

    // 알림 설정 업데이트
    updateNotificationSettings: (state, action) => {
      state.notifications = {
        ...state.notifications,
        ...action.payload
      };
      state.lastUpdated = Date.now();
    },

    // POS 설정 업데이트
    updatePosSettings: (state, action) => {
      state.pos = {
        ...state.pos,
        ...action.payload
      };
      state.lastUpdated = Date.now();
    },

    // 배달 설정 업데이트
    updateDeliverySettings: (state, action) => {
      state.delivery = {
        ...state.delivery,
        ...action.payload
      };
      state.lastUpdated = Date.now();
    },

    // 결제 설정 업데이트
    updatePaymentSettings: (state, action) => {
      state.payment = {
        ...state.payment,
        ...action.payload
      };
      state.lastUpdated = Date.now();
    },

    // 보안 설정 업데이트
    updateSecuritySettings: (state, action) => {
      state.security = {
        ...state.security,
        ...action.payload
      };
      state.lastUpdated = Date.now();
    },

    // 접근성 설정 업데이트
    updateAccessibilitySettings: (state, action) => {
      state.accessibility = {
        ...state.accessibility,
        ...action.payload
      };
      state.lastUpdated = Date.now();
    },

    // 개발자 설정 업데이트
    updateDeveloperSettings: (state, action) => {
      state.developer = {
        ...state.developer,
        ...action.payload
      };
      state.lastUpdated = Date.now();
    },

    // 백업 설정 업데이트
    updateBackupSettings: (state, action) => {
      state.backup = {
        ...state.backup,
        ...action.payload
      };
      state.lastUpdated = Date.now();
    },

    // 설정 초기화
    resetSettings: (state) => {
      return {
        ...initialState,
        lastUpdated: Date.now()
      };
    },

    // 전체 설정 업데이트
    updateAllSettings: (state, action) => {
      return {
        ...state,
        ...action.payload,
        lastUpdated: Date.now()
      };
    },

    // 언어 변경
    changeLanguage: (state, action) => {
      state.general.language = action.payload;
      state.lastUpdated = Date.now();
    },

    // 테마 모드 토글
    toggleThemeMode: (state) => {
      state.theme.mode = state.theme.mode === 'light' ? 'dark' : 'light';
      state.lastUpdated = Date.now();
    }
  }
});

// 액션 생성자 내보내기
export const {
  updateGeneralSettings,
  updateThemeSettings,
  updateNotificationSettings,
  updatePosSettings,
  updateDeliverySettings,
  updatePaymentSettings,
  updateSecuritySettings,
  updateAccessibilitySettings,
  updateDeveloperSettings,
  updateBackupSettings,
  resetSettings,
  updateAllSettings,
  changeLanguage,
  toggleThemeMode
} = settingsSlice.actions;

// 셀렉터
export const selectGeneralSettings = (state) => state.settings.general;
export const selectThemeSettings = (state) => state.settings.theme;
export const selectNotificationSettings = (state) => state.settings.notifications;
export const selectPosSettings = (state) => state.settings.pos;
export const selectDeliverySettings = (state) => state.settings.delivery;
export const selectPaymentSettings = (state) => state.settings.payment;
export const selectSecuritySettings = (state) => state.settings.security;
export const selectAccessibilitySettings = (state) => state.settings.accessibility;
export const selectDeveloperSettings = (state) => state.settings.developer;
export const selectBackupSettings = (state) => state.settings.backup;
export const selectCurrentLanguage = (state) => state.settings.general.language;
export const selectCurrentTheme = (state) => state.settings.theme.mode;
export const selectWorkingHours = (state) => state.settings.delivery.workingHours;

// 리듀서 내보내기
export default settingsSlice.reducer;