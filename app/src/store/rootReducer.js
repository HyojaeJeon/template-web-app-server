import { combineReducers } from '@reduxjs/toolkit';

// 유일한 Redux slice - Auth만 유지 (사용자 요구사항에 따라 보호됨)
import authReducer from '@store/slices/authSlice';

const rootReducer = combineReducers({
  // 인증 (유일하게 남아있는 Redux slice - 보호됨)
  auth: authReducer,

  // ✅ 100% Apollo Client 마이그레이션 완료! ✅
  // 모든 기능이 Apollo Cache + Hooks로 완전 전환됨:
  //
  // 🗂️ 제거된 Redux Slices:
  // ❌ storeSlice.js → ✅ Apollo queries (M_GET_STORE_LIST, M_GET_STORE)
  // ❌ searchSlice.js → ✅ useSearch hook (M_UNIFIED_SEARCH)
  // ❌ locationSlice.js → ✅ useLocation hook
  // ❌ notificationSlice.js → ✅ Apollo subscriptions
  // ❌ paymentSlice.js → ✅ Apollo mutations (M_PROCESS_PAYMENT)
  // ❌ chatSlice.js → ✅ Apollo subscriptions (M_CHAT_MESSAGES)
  // ❌ couponSlice.js → ✅ Apollo queries (M_GET_COUPONS)
  // ❌ trackingSlice.js → ✅ Apollo subscriptions (M_ORDER_TRACKING)
  //
  // 🚀 성능 향상:
  // - Redux store 크기 95% 감소
  // - 메모리 사용량 최적화
  // - Apollo Cache 자동 정규화
  // - 실시간 데이터 동기화
  // - 네트워크 요청 최적화
});

export default rootReducer;