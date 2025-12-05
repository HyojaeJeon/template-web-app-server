/**
 * Auth Slice - Enhanced GraphQL Integration
 * 서버의 Enhanced 에러/성공 시스템과 완벽한 통합
 * Mock 데이터 완전 제거, 실제 GraphQL API 사용
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setTokens, clearTokens } from '@services/apollo/tokenManager';
import { apolloQuery, apolloMutate } from '@store/utils/apolloThunk';
import { UnifiedErrorHandler } from '@services/error/UnifiedErrorHandler';

// GraphQL Queries/Mutations
import {
  M_GET_PROFILE,
  M_CHECK_PHONE_EXISTS,
  M_VALIDATE_TOKEN
} from '@gql/queries/auth';

import {
  M_REGISTER,
  M_LOGIN_WITH_PHONE,
  M_SOCIAL_LOGIN,
  M_SEND_OTP,
  M_VERIFY_OTP,
  M_REFRESH_TOKEN,
  M_LOGOUT,
  M_UPDATE_PUSH_TOKEN,
  M_CHANGE_PASSWORD,
  M_REQUEST_PASSWORD_RESET,
  M_RESET_PASSWORD,
  M_DEACTIVATE_ACCOUNT,
  M_DELETE_ACCOUNT
} from '@gql/mutations/auth';

// ==============================================
// Initial State
// ==============================================
const initialState = {
  // 사용자 정보
  user: null,

  // 인증 상태
  isAuthenticated: false,
  isLoading: false,

  // 토큰 정보
  accessToken: null,
  refreshToken: null,

  // FCM 토큰 정보
  fcmToken: null,
  fcmTokenRegistered: false,

  // 에러 처리 (Enhanced)
  error: null,

  // 전화번호 인증
  phoneNumber: null,
  isPhoneVerified: false,
  otpExpiresIn: null,

  // 소셜 로그인 정보
  socialProvider: null,

  // 비밀번호 재설정
  passwordResetExpiresIn: null
};

// ==============================================
// Async Thunks - GraphQL API 호출
// ==============================================

/**
 * 회원가입
 */
export const register = createAsyncThunk(
  'auth/register',
  async ({ phone, password, fullName, email }, { rejectWithValue }) => {
    // FCM 토큰 가져오기 (필수는 아니지만 권장)
    let pushToken = null;
    try {
      const messaging = await import('@react-native-firebase/messaging');
      pushToken = await messaging.default().getToken();
    } catch (error) {
      // FCM 토큰 실패해도 회원가입은 계속 진행
      console.log('FCM token not available:', error);
    }

    const result = await apolloMutate({
      mutation: M_REGISTER,
      variables: {
        input: { phone, password, fullName, email, pushToken }
      },
      rejectWithValue
    });

    // 토큰 저장
    if (result?.accessToken && result?.refreshToken) {
      await setTokens(result.accessToken, result.refreshToken);
    }

    return result;
  }
);

/**
 * 전화번호 로그인
 */
export const loginWithPhone = createAsyncThunk(
  'auth/loginWithPhone',
  async ({ phone, password }, { rejectWithValue }) => {
    // FCM 토큰 가져오기 (선택적)
    let pushToken = null;
    try {
      const messaging = await import('@react-native-firebase/messaging');
      pushToken = await messaging.default().getToken();
    } catch (error) {
      // FCM 토큰 실패해도 로그인은 계속 진행
      console.log('FCM token not available:', error);
    }

    const result = await apolloMutate({
      mutation: M_LOGIN_WITH_PHONE,
      variables: {
        input: { phone, password, pushToken }
      },
      rejectWithValue
    });

    // 토큰 저장
    if (result?.accessToken && result?.refreshToken) {
      await setTokens(result.accessToken, result.refreshToken);
    }

    return result;
  }
);

/**
 * 소셜 로그인
 */
export const socialLogin = createAsyncThunk(
  'auth/socialLogin',
  async ({ provider, accessToken, profile }, { rejectWithValue }) => {
    const result = await apolloMutate({
      mutation: M_SOCIAL_LOGIN,
      variables: {
        input: { provider, accessToken, profile }
      },
      rejectWithValue
    });

    // 토큰 저장
    if (result?.accessToken && result?.refreshToken) {
      await setTokens(result.accessToken, result.refreshToken);
    }

    return result;
  }
);

/**
 * OTP 전송
 */
export const sendOTP = createAsyncThunk(
  'auth/sendOTP',
  async ({ phone }, { rejectWithValue }) => {
    return await apolloMutate({
      mutation: M_SEND_OTP,
      variables: { phone },
      rejectWithValue
    });
  }
);

/**
 * OTP 인증
 */
export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ phone, otp }, { rejectWithValue }) => {
    return await apolloMutate({
      mutation: M_VERIFY_OTP,
      variables: {
        input: { phone, otp }
      },
      rejectWithValue
    });
  }
);

/**
 * 프로필 조회
 */
export const fetchAuthProfile = createAsyncThunk(
  'auth/fetchAuthProfile',
  async (_, { rejectWithValue }) => {
    return await apolloQuery({
      query: M_GET_PROFILE,
      rejectWithValue
    });
  }
);

/**
 * 전화번호 중복 확인
 */
export const checkPhoneExists = createAsyncThunk(
  'auth/checkPhoneExists',
  async ({ phone }, { rejectWithValue }) => {
    return await apolloQuery({
      query: M_CHECK_PHONE_EXISTS,
      variables: {
        input: { phone }
      },
      rejectWithValue
    });
  }
);

/**
 * 토큰 유효성 검증
 */
export const validateToken = createAsyncThunk(
  'auth/validateToken',
  async (_, { rejectWithValue }) => {
    return await apolloQuery({
      query: M_VALIDATE_TOKEN,
      rejectWithValue
    });
  }
);

/**
 * 수동 토큰 갱신 - 사용자 명시적 호출용
 *
 * 📌 정책: 자동 토큰 갱신은 Apollo errorLink에서 처리
 * 🔄 자동 갱신: @services/apollo/tokenManager.refreshToken() 사용
 *
 * 이 thunk는 수동 토큰 갱신 요청(사용자 명시 호출)을 위해서만 사용
 * 자동 토큰 갱신(Apollo Link)와 구분하여 사용
 *
 * @param {Object} params - 갱신 파라미터
 * @param {string} params.refreshToken - 갱신용 토큰
 * @returns {Promise} 갱신 결과 (새 토큰 또는 에러)
 */
export const manualRefreshToken = createAsyncThunk(
  'auth/manualRefreshToken',
  /**
   * @param {Object} params
   * @param {string} params.refreshToken
   * @param {Object} thunkAPI
   * @param {Function} thunkAPI.rejectWithValue
   */
  async ({ refreshToken: token }, { rejectWithValue }) => {
    // null 체크 추가 - "Cannot convert null value to object" 에러 방지
    if (!token) {
      return rejectWithValue({
        type: 'AUTH_ERROR',
        code: 'C3003',
        message: 'Refresh token이 없습니다. 다시 로그인해주세요.',
        category: 'AUTH',
        severity: 'error'
      });
    }

    const result = await apolloMutate({
      mutation: M_REFRESH_TOKEN,
      variables: { refreshToken: token },
      rejectWithValue
    });

    // 새 토큰 저장
    if (result?.accessToken) {
      const newRefreshToken = result.refreshToken || token;
      await setTokens(result.accessToken, newRefreshToken);
    }

    return result;
  }
);

/**
 * 로그아웃
 */
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // FCM 토큰 서버에서 제거
      try {
        const FCMService = (await import('@services/notifications/FCMService')).default;
        await FCMService.unregisterFCMToken();
        console.log('✅ FCM 토큰 제거 완료');
      } catch (fcmError) {
        console.error('⚠️ FCM 토큰 제거 실패 (무시하고 계속):', fcmError);
        // FCM 토큰 제거 실패해도 로그아웃은 계속 진행
      }

      // 서버에 로그아웃 요청
      const result = await apolloMutate({
        mutation: M_LOGOUT,
        rejectWithValue
      });

      // 로컬 토큰 삭제
      await clearTokens();

      return result;
    } catch (error) {
      // 에러가 발생해도 로컬 토큰은 삭제
      await clearTokens();

      // FCM 토큰도 로컬에서 삭제 시도
      try {
        await AsyncStorage.removeItem('fcmToken');
      } catch (fcmError) {
        console.error('FCM 토큰 로컬 삭제 실패:', fcmError);
      }

      throw error;
    }
  }
);

/**
 * 푸시 토큰 업데이트
 */
export const updatePushToken = createAsyncThunk(
  'auth/updatePushToken',
  async ({ pushToken }, { rejectWithValue }) => {
    return await apolloMutate({
      mutation: M_UPDATE_PUSH_TOKEN,
      variables: { pushToken },
      rejectWithValue
    });
  }
);

/**
 * 비밀번호 변경
 */
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    return await apolloMutate({
      mutation: M_CHANGE_PASSWORD,
      variables: { currentPassword, newPassword },
      rejectWithValue
    });
  }
);

/**
 * 비밀번호 재설정 요청
 */
export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async ({ phone }, { rejectWithValue }) => {
    return await apolloMutate({
      mutation: M_REQUEST_PASSWORD_RESET,
      variables: {
        input: { phone }
      },
      rejectWithValue
    });
  }
);

/**
 * 비밀번호 재설정
 */
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ phone, otp, newPassword }, { rejectWithValue }) => {
    const result = await apolloMutate({
      mutation: M_RESET_PASSWORD,
      variables: {
        input: { phone, otp, newPassword }
      },
      rejectWithValue
    });

    // 토큰 저장
    if (result?.accessToken && result?.refreshToken) {
      await setTokens(result.accessToken, result.refreshToken);
    }

    return result;
  }
);

/**
 * 계정 비활성화
 */
export const deactivateAccount = createAsyncThunk(
  'auth/deactivateAccount',
  async ({ reason }, { rejectWithValue }) => {
    const result = await apolloMutate({
      mutation: M_DEACTIVATE_ACCOUNT,
      variables: { reason },
      rejectWithValue
    });

    // 토큰 삭제
    await clearTokens();

    return result;
  }
);

/**
 * 계정 삭제
 */
export const deleteAccount = createAsyncThunk(
  'auth/deleteAccount',
  async ({ password, reason }, { rejectWithValue }) => {
    const result = await apolloMutate({
      mutation: M_DELETE_ACCOUNT,
      variables: { password, reason },
      rejectWithValue
    });

    // 토큰 삭제
    await clearTokens();

    return result;
  }
);

// ==============================================
// Auth Slice
// ==============================================
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 동기 액션들 (컴포넌트에서 직접 호출)
    setLoading: (state, action) => {
      state.isLoading = action.payload;
      state.error = null;
    },

    setAuthSuccess: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;

      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      state.phoneNumber = user?.phone;
      state.isPhoneVerified = user?.isVerified || false;
    },

    setAuthError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isAuthenticated = false;
    },

    clearError: (state) => {
      state.error = null;
    },

    // TokenService에서 사용하는 액션
    refreshTokenSuccess: (state, action) => {
      const { accessToken, refreshToken, user } = action.payload;

      state.accessToken = accessToken;
      if (refreshToken) {
        state.refreshToken = refreshToken;
      }
      if (user) {
        state.user = user;
      }
      state.isAuthenticated = true;
      state.error = null;
    },

    // 로그아웃 (동기)
    resetAuth: (state) => {
      return initialState;
    },

    // FCM 토큰 관리
    setFCMToken: (state, action) => {
      state.fcmToken = action.payload;
      state.fcmTokenRegistered = true;
    },

    clearFCMToken: (state) => {
      state.fcmToken = null;
      state.fcmTokenRegistered = false;
    },

    setFCMTokenRegistrationStatus: (state, action) => {
      state.fcmTokenRegistered = action.payload;
    }
  },
  extraReducers: (builder) => {
    // 회원가입
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        const { user, accessToken, refreshToken } = action.payload;
        state.user = user;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.phoneNumber = user?.phone;
        state.isPhoneVerified = user?.isVerified || false;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // 전화번호 로그인
    builder
      .addCase(loginWithPhone.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithPhone.fulfilled, (state, action) => {
        const { user, accessToken, refreshToken } = action.payload;
        state.user = user;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.phoneNumber = user?.phone;
        state.isPhoneVerified = user?.isVerified || false;
      })
      .addCase(loginWithPhone.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // 소셜 로그인
    builder
      .addCase(socialLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(socialLogin.fulfilled, (state, action) => {
        const { user, accessToken, refreshToken } = action.payload;
        state.user = user;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.socialProvider = action.meta.arg.provider;
      })
      .addCase(socialLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // OTP 전송
    builder
      .addCase(sendOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpExpiresIn = action.payload.expiresIn;
        state.phoneNumber = action.meta.arg.phone;
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // OTP 인증
    builder
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isPhoneVerified = action.payload.isVerified;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // 프로필 조회
    builder
      .addCase(fetchAuthProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAuthProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.phoneNumber = action.payload?.phone;
        state.isPhoneVerified = action.payload?.isVerified || false;
      })
      .addCase(fetchAuthProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // 수동 토큰 갱신 (사용자 명시 호출)
    builder
      .addCase(manualRefreshToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(manualRefreshToken.fulfilled, (state, action) => {
        state.isLoading = false;
        const { accessToken, refreshToken, user } = action.payload;
        state.accessToken = accessToken;
        if (refreshToken) {
          state.refreshToken = refreshToken;
        }
        if (user) {
          state.user = user;
        }
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(manualRefreshToken.rejected, (state, action) => {
        // 토큰 갱신 실패 시 로그아웃 처리
        // UnifiedErrorHandler.requiresLogout은 정적 메서드로 직접 호출
        const errorCode = action.payload?.code || action.error?.code;
        if (errorCode && UnifiedErrorHandler.requiresLogout(errorCode)) {
          return initialState;
        }
        // originalError 객체 제거 - Redux serialization 경고 방지
        if (action.payload) {
          const { originalError, ...serializableError } = action.payload;
          state.error = serializableError;
        } else {
          state.error = {
            code: 'C9001',
            message: 'Unknown error occurred',
            type: 'UNKNOWN_ERROR'
          };
        }
      });

    // 로그아웃
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, () => {
        return initialState;
      })
      .addCase(logout.rejected, () => {
        // 에러가 발생해도 로그아웃 처리
        return initialState;
      });

    // 비밀번호 재설정 요청
    builder
      .addCase(requestPasswordReset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state, action) => {
        state.isLoading = false;
        state.passwordResetExpiresIn = action.payload.expiresIn;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // 비밀번호 재설정
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        const { user, accessToken, refreshToken } = action.payload;
        state.user = user;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.passwordResetExpiresIn = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // 계정 비활성화/삭제
    builder
      .addCase(deactivateAccount.fulfilled, () => {
        return initialState;
      })
      .addCase(deleteAccount.fulfilled, () => {
        return initialState;
      });
  }
});

// Export actions
export const {
  setLoading,
  setAuthSuccess,
  setAuthError,
  clearError,
  refreshTokenSuccess,
  resetAuth,
  setFCMToken,
  clearFCMToken,
  setFCMTokenRegistrationStatus
} = authSlice.actions;

// Export reducer
export default authSlice.reducer;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectFCMToken = (state) => state.auth.fcmToken;
export const selectFCMTokenRegistered = (state) => state.auth.fcmTokenRegistered;
export const selectIsRegistering = (state) => state.auth.isLoading;