/**
 * Redux Authentication State Management Slice (StoreAccount model)
 * JWT token-based authentication
 *
 * @model StoreAccount - Store owner/staff account information
 * @fields id, phone, email, fullName, role, storeId, permissions
 */

import { createSlice } from '@reduxjs/toolkit';

// 초기 상태 (StoreAccount 모델 기준)
const initialState = {
  // 인증 상태
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // 토큰 (Redux Persist로 자동 저장)
  accessToken: null,
  refreshToken: null,

  // StoreAccount 정보
  storeAccount: null, // StoreAccount 모델 전체 객체

  // Store information (store details - multilingual store names)
  store: null, // Store model object { id, name, nameEn, nameKo, ... }

  // Localization
  language: 'vi',
  timezone: 'Asia/Ho_Chi_Minh',
};




// 슬라이스 생성
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 로그인 성공 시 StoreAccount + Store + 토큰 저장
    setAuth: (state, action) => {
      const { storeAccount, store, accessToken, refreshToken } = action.payload;
      state.storeAccount = storeAccount;
      state.store = store || null; // 매장 정보 (다국어 매장명 포함)
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.error = null;
    },

    // 토큰 갱신 시
    setTokens: (state, action) => {
      const { accessToken, refreshToken } = action.payload;
      if (accessToken) state.accessToken = accessToken;
      if (refreshToken) state.refreshToken = refreshToken;
    },

    // StoreAccount 정보만 업데이트
    updateStoreAccount: (state, action) => {
      if (state.storeAccount) {
        state.storeAccount = { ...state.storeAccount, ...action.payload };
      }
    },

    // 로그아웃
    logout: (state) => {
      return {
        ...initialState,
        language: state.language,
        timezone: state.timezone
      };
    },

    // UI 상태
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    // 현지화
    setLanguage: (state, action) => {
      state.language = action.payload;
    },

    setTimezone: (state, action) => {
      state.timezone = action.payload;
    },
  },
});

// 액션 익스포트
export const {
  setAuth,
  setTokens,
  updateStoreAccount,
  logout,
  setLoading,
  setError,
  clearError,
  setLanguage,
  setTimezone,
} = authSlice.actions;

// 셀렉터 (StoreAccount 모델 기준)
export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectError = (state) => state.auth.error;

// StoreAccount 정보
export const selectStoreAccount = (state) => state.auth.storeAccount;
export const selectUser = (state) => state.auth.storeAccount; // Alias for compatibility
export const selectStoreId = (state) => state.auth.storeAccount?.storeId || null;
export const selectRole = (state) => state.auth.storeAccount?.role || null;
export const selectUserRole = (state) => state.auth.storeAccount?.role || null; // Alias for compatibility
export const selectPermissions = (state) => state.auth.storeAccount?.permissions || [];

// Store 정보 (매장 상세 정보 - 다국어 매장명 포함)
export const selectStore = (state) => state.auth.store;
export const selectStoreName = (state) => state.auth.store?.name || null;
export const selectStoreNameEn = (state) => state.auth.store?.nameEn || null;
export const selectStoreNameKo = (state) => state.auth.store?.nameKo || null;

// 토큰
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectRefreshToken = (state) => state.auth.refreshToken;

// 권한 체크 셀렉터
export const selectHasRole = (role) => (state) => {
  return state.auth.storeAccount?.role === role;
};

export const selectHasPermission = (permission) => (state) => {
  const permissions = state.auth.storeAccount?.permissions || [];
  return Array.isArray(permissions) && permissions.includes(permission);
};

// 현지화
export const selectLanguage = (state) => state.auth.language;
export const selectTimezone = (state) => state.auth.timezone;

export default authSlice.reducer;