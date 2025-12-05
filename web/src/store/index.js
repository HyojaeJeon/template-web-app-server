/**
 * Redux Store Configuration
 * Central state management for the application
 *
 * Features:
 * - JWT token management and auto-refresh
 * - POS system real-time integration
 * - Localization support (currency, address system)
 * - WebSocket real-time notifications
 * - Integrated cache management with Apollo Client
 */
import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';
import rootReducer from './rootReducer';

// SSR 환경에서 안전한 storage 생성
const createNoopStorage = () => {
  return {
    getItem() {
      return Promise.resolve(null);
    },
    setItem() {
      return Promise.resolve();
    },
    removeItem() {
      return Promise.resolve();
    },
  };
};

// 브라우저 환경 확인하여 적절한 storage 선택
const persistStorage = typeof window !== 'undefined' 
  ? createWebStorage('local') 
  : createNoopStorage();
// 인증 미들웨어
const authMiddleware = (store) => (next) => (action) => {
  if (action.type?.startsWith('auth/')) {
    if (action.type === 'auth/logout') {
      console.log('User logged out');
    }
  }
  return next(action);
};

// 개발환경 로깅 미들웨어
const devLoggingMiddleware = (store) => (next) => (action) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Action:', action.type);
  }
  return next(action);
};

// Redux Persist 설정
const persistConfig = {
  key: 'app-store',
  version: 1,
  storage: persistStorage,
  // 인증 정보와 설정만 영구 저장
  whitelist: ['auth', 'settings', 'chatSettings'],
  // 민감한 정보는 제외 (실시간 데이터는 저장하지 않음)
  blacklist: ['notifications', 'pos', 'chat'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Redux DevTools 설정 (개발 환경에서만 활성화)
const devToolsConfig = process.env.NODE_ENV === 'development' && {
  name: 'Store Admin', // Name displayed in DevTools
  trace: true, // 액션 호출 스택 추적
  traceLimit: 25, // 스택 추적 제한
  maxAge: 100, // 보관할 액션 수 증가
  // ✅ Symbol.observable 충돌 방지 - serialize 옵션 제거
  serialize: {
    options: false, // Symbol 직렬화 비활성화로 충돌 방지
  },
  actionBlacklist: [
    // 너무 빈번한 액션들은 제외 (DevTools 성능 보호)
    'pos/heartbeat',
    'notifications/clearOld',
    'auth/refreshStoreToken',
    'realtime/ping',
    'socket/heartbeat'
  ],
  stateSanitizer: (state) => {
    // 민감한 정보는 DevTools에서 숨기기
    if (state.auth?.token) {
      return {
        ...state,
        auth: {
          ...state.auth,
          token: '***HIDDEN***',
          refreshStoreToken: '***HIDDEN***'
        }
      };
    }
    return state;
  },
  actionSanitizer: (action) => {
    // 민감한 액션 데이터 숨기기
    if (action.type === 'auth/setTokens' && action.payload) {
      return {
        ...action,
        payload: {
          ...action.payload,
          token: '***HIDDEN***',
          refreshStoreToken: '***HIDDEN***'
        }
      };
    }
    return action;
  }
};

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          // 커스텀 액션
          'auth/setTokens',
          'pos/receivePosData',
          'notifications/addNotification',
        ],
        ignoredActionPaths: [
          'meta.arg',
          'payload.timestamp',
          'payload.socket',
          'payload.callback',
        ],
        ignoredPaths: [
          'auth.expiresAt',
          'pos.socket',
          'notifications.queue',
        ],
      },
      // 성능 최적화를 위한 불변성 검사 제한
      immutableCheck: {
        warnAfter: 128,
      },
    })
      // 커스텀 미들웨어 추가
      .concat(
        authMiddleware,
        ...(process.env.NODE_ENV === 'development' ? [devLoggingMiddleware] : [])
      ),
  // Redux DevTools 설정 (개발환경에서만 활성화)
  devTools: devToolsConfig
});

export const persistor = persistStore(store);

// JavaScript 환경에서는 타입 정의 생략
// TypeScript 사용 시에는 store.d.ts 파일을 별도로 만들어 타입 정의

// 핫 리로딩 지원
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./rootReducer', () => {
    store.replaceReducer(persistedReducer);
  });
}

export default store;