import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import rootReducer from '@store/rootReducer';
import logger from '@shared/utils/system/logger';

// Redux Persist 설정 (Auth만 유지)
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'], // Auth slice만 유지 (나머지는 Apollo Cache로 완전 마이그레이션)
  blacklist: [], // 모든 다른 상태는 Apollo Cache에서 관리
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// 스토어 생성 (Redux Toolkit Thunk 기본 포함)
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => {
    const middlewares = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    });

    return middlewares;
  },
});

// Persistor 생성
export const persistor = persistStore(store);

// 스토어 생성 완료 로그
console.log('🟢 [STORE] Redux store 생성 완료');

// Global에 store 등록 (Apollo Client에서 접근 가능하도록)
global.__REDUX_STORE__ = store;
console.log('🟢 [STORE] global.__REDUX_STORE__ 등록 완료');

// Redux Toolkit Thunk는 자동으로 활성화됨
console.log('🟢 [STORE] Redux Toolkit Thunk 활성화 완료');
logger.info('Redux Toolkit Thunk 활성화 완료');

// Flipper Redux 연결 (개발 모드에서만)
if (__DEV__) {
  try {
    const { connectReduxToFlipper } = require('@shared/utils/flipper/FlipperSetup');
    connectReduxToFlipper(store);
    console.log('🔧 [STORE] Flipper Redux 연결 완료');
  } catch (error) {
    console.warn('⚠️ [STORE] Flipper Redux 연결 실패:', error);
  }
}

// 기본 export
export default store;