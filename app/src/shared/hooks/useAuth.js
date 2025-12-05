/**
 * ==================================================================================
 * useAuth Hook - Redux authSlice 완전 대체
 * ==================================================================================
 *
 * 🎯 목적:
 * - Redux authSlice를 Apollo Client Reactive Variables로 100% 대체
 * - 동일한 인터페이스로 기존 컴포넌트 호환성 보장
 * - Local App 특화 인증 로직 구현
 *
 * 🔄 마이그레이션:
 * - Redux useSelector → Apollo useReactiveVar
 * - Redux useDispatch(thunk) → Apollo useMutation
 * - Redux state → Apollo Reactive Variables
 *
 * 📊 제공 기능:
 * - 인증 상태 관리 (로그인/로그아웃)
 * - 토큰 관리 (자동 갱신)
 * - 사용자 정보 관리
 * - 전화번호 인증
 * - 소셜 로그인
 * - 비밀번호 관리
 *
 * ==================================================================================
 */

import { useReactiveVar, useMutation, useQuery, useLazyQuery } from '@apollo/client';
import { useCallback, useEffect } from 'react';
import {
  // Reactive Variables
  userVar,
  isAuthenticatedVar,
  authLoadingVar,
  authErrorVar,
  accessTokenVar,
  refreshTokenVar,
  phoneVerificationVar,
  socialLoginVar,
  passwordResetVar,
  // Helper Functions
  resetAuthState,
  setAuthSuccess,
  setAuthError,
  updateTokens,
  setAuthLoading,
  persistTokens,
  restoreTokens,
  clearPersistedTokens
} from '@services/apollo/reactiveVariables';

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

import { UnifiedErrorHandler } from '@services/error/UnifiedErrorHandler';
import { useToast } from '@providers/ToastProvider';
import logger from '@shared/utils/system/logger';

/**
 * ==================================================================================
 * useAuth Hook - 메인 인증 훅
 * ==================================================================================
 *
 * Redux authSlice의 모든 기능을 Apollo Client로 제공
 * 기존 컴포넌트에서 동일한 방식으로 사용 가능
 *
 * @returns {Object} 인증 상태 및 액션 함수들
 */
export const useAuth = () => {
  const { showToast } = useToast();

  // ========================================
  // Reactive Variables 구독
  // ========================================
  const user = useReactiveVar(userVar);
  const isAuthenticated = useReactiveVar(isAuthenticatedVar);
  const authLoading = useReactiveVar(authLoadingVar);
  const authError = useReactiveVar(authErrorVar);
  const accessToken = useReactiveVar(accessTokenVar);
  const refreshToken = useReactiveVar(refreshTokenVar);
  const phoneVerification = useReactiveVar(phoneVerificationVar);
  const socialLogin = useReactiveVar(socialLoginVar);
  const passwordReset = useReactiveVar(passwordResetVar);

  // ========================================
  // GraphQL Mutations
  // ========================================

  const [registerMutation] = useMutation(M_REGISTER);
  const [loginWithPhoneMutation] = useMutation(M_LOGIN_WITH_PHONE);
  const [socialLoginMutation] = useMutation(M_SOCIAL_LOGIN);
  const [sendOTPMutation] = useMutation(M_SEND_OTP);
  const [verifyOTPMutation] = useMutation(M_VERIFY_OTP);
  const [refreshTokenMutation] = useMutation(M_REFRESH_TOKEN);
  const [logoutMutation] = useMutation(M_LOGOUT);
  const [updatePushTokenMutation] = useMutation(M_UPDATE_PUSH_TOKEN);
  const [changePasswordMutation] = useMutation(M_CHANGE_PASSWORD);
  const [requestPasswordResetMutation] = useMutation(M_REQUEST_PASSWORD_RESET);
  const [resetPasswordMutation] = useMutation(M_RESET_PASSWORD);
  const [deactivateAccountMutation] = useMutation(M_DEACTIVATE_ACCOUNT);
  const [deleteAccountMutation] = useMutation(M_DELETE_ACCOUNT);

  // ========================================
  // GraphQL Queries (Lazy)
  // ========================================

  const [fetchProfile] = useLazyQuery(M_GET_PROFILE);
  const [checkPhoneExists] = useLazyQuery(M_CHECK_PHONE_EXISTS);
  const [validateToken] = useLazyQuery(M_VALIDATE_TOKEN);

  // ========================================
  // 에러 처리 헬퍼
  // ========================================

  const handleError = useCallback(async (error, fallbackMessage = 'UNKNOWN_ERROR') => {
    try {
      const errorHandler = new UnifiedErrorHandler();
      const processedError = await errorHandler.handle(error);

      setAuthError(processedError);
      showToast(processedError.code || fallbackMessage);

      return processedError;
    } catch (handlerError) {
      logger.error('Error handler failed:', handlerError);
      const fallbackError = { code: fallbackMessage, message: 'An error occurred' };
      setAuthError(fallbackError);
      showToast(fallbackMessage);
      return fallbackError;
    }
  }, [showToast]);

  // ========================================
  // 인증 액션 함수들 (Redux Thunk 대체)
  // ========================================

  /**
   * 회원가입
   */
  const register = useCallback(async ({ phone, password, fullName, email }) => {
    setAuthLoading(true);

    try {
      // FCM 토큰 가져오기 (선택적)
      let pushToken = null;
      try {
        const messaging = await import('@react-native-firebase/messaging');
        pushToken = await messaging.default().getToken();
      } catch (fcmError) {
        logger.warn('FCM token not available:', fcmError);
      }

      const { data } = await registerMutation({
        variables: {
          input: { phone, password, fullName, email, pushToken }
        }
      });

      const result = data.mRegister;

      // 토큰 저장
      if (result.accessToken && result.refreshToken) {
        await persistTokens(result.accessToken, result.refreshToken);
      }

      setAuthSuccess(result);
      showToast('REGISTER_SUCCESS');

      return result;
    } catch (error) {
      await handleError(error, 'REGISTER_FAILED');
      throw error;
    }
  }, [registerMutation, handleError, showToast]);

  /**
   * 전화번호 로그인
   */
  const loginWithPhone = useCallback(async ({ phone, password }) => {
    setAuthLoading(true);

    try {
      // FCM 토큰 가져오기 (선택적)
      let pushToken = null;
      try {
        const messaging = await import('@react-native-firebase/messaging');
        pushToken = await messaging.default().getToken();
      } catch (fcmError) {
        logger.warn('FCM token not available:', fcmError);
      }

      const { data } = await loginWithPhoneMutation({
        variables: {
          input: { phone, password, pushToken }
        }
      });

      const result = data.mLoginWithPhone;

      // 토큰 저장
      if (result.accessToken && result.refreshToken) {
        await persistTokens(result.accessToken, result.refreshToken);
      }

      setAuthSuccess(result);
      showToast('LOGIN_SUCCESS');

      return result;
    } catch (error) {
      await handleError(error, 'LOGIN_FAILED');
      throw error;
    }
  }, [loginWithPhoneMutation, handleError, showToast]);

  /**
   * 소셜 로그인
   */
  const socialLoginAction = useCallback(async ({ provider, accessToken: socialAccessToken, profile }) => {
    setAuthLoading(true);

    try {
      const { data } = await socialLoginMutation({
        variables: {
          input: { provider, accessToken: socialAccessToken, profile }
        }
      });

      const result = data.mSocialLogin;

      // 토큰 저장
      if (result.accessToken && result.refreshToken) {
        await persistTokens(result.accessToken, result.refreshToken);
      }

      setAuthSuccess(result);

      // 소셜 로그인 정보 업데이트
      socialLoginVar({
        provider,
        isLinked: true
      });

      showToast('SOCIAL_LOGIN_SUCCESS');

      return result;
    } catch (error) {
      await handleError(error, 'SOCIAL_LOGIN_FAILED');
      throw error;
    }
  }, [socialLoginMutation, handleError, showToast]);

  /**
   * OTP 전송
   */
  const sendOTP = useCallback(async ({ phone }) => {
    setAuthLoading(true);

    try {
      const { data } = await sendOTPMutation({
        variables: { phone }
      });

      const result = data.mSendOTP;

      // 전화번호 인증 상태 업데이트
      phoneVerificationVar(prev => ({
        ...prev,
        phoneNumber: phone,
        otpExpiresIn: result.expiresIn
      }));

      setAuthLoading(false);
      showToast('OTP_SENT_SUCCESS');

      return result;
    } catch (error) {
      await handleError(error, 'OTP_SEND_FAILED');
      throw error;
    }
  }, [sendOTPMutation, handleError, showToast]);

  /**
   * OTP 인증
   */
  const verifyOTP = useCallback(async ({ phone, otp }) => {
    setAuthLoading(true);

    try {
      const { data } = await verifyOTPMutation({
        variables: {
          input: { phone, otp }
        }
      });

      const result = data.mVerifyOTP;

      // 전화번호 인증 상태 업데이트
      phoneVerificationVar(prev => ({
        ...prev,
        isVerified: result.isVerified,
        otpExpiresIn: null
      }));

      setAuthLoading(false);
      showToast('OTP_VERIFY_SUCCESS');

      return result;
    } catch (error) {
      await handleError(error, 'OTP_VERIFY_FAILED');
      throw error;
    }
  }, [verifyOTPMutation, handleError, showToast]);

  /**
   * 프로필 조회
   */
  const fetchAuthProfile = useCallback(async () => {
    setAuthLoading(true);

    try {
      const { data } = await fetchProfile();

      const result = data.mGetProfile;

      // 사용자 정보 업데이트
      userVar(result);

      // 전화번호 인증 상태 업데이트
      phoneVerificationVar(prev => ({
        ...prev,
        phoneNumber: result.phone,
        isVerified: result.phoneVerified || false
      }));

      setAuthLoading(false);

      return result;
    } catch (error) {
      await handleError(error, 'PROFILE_FETCH_FAILED');
      throw error;
    }
  }, [fetchProfile, handleError]);

  /**
   * 전화번호 중복 확인
   */
  const checkPhoneExistsAction = useCallback(async ({ phone }) => {
    try {
      const { data } = await checkPhoneExists({
        variables: {
          input: { phone }
        }
      });

      return data.mCheckPhoneExists;
    } catch (error) {
      await handleError(error, 'PHONE_CHECK_FAILED');
      throw error;
    }
  }, [checkPhoneExists, handleError]);

  /**
   * 토큰 유효성 검증
   */
  const validateTokenAction = useCallback(async () => {
    try {
      const { data } = await validateToken();

      const result = data.mValidateToken;

      if (result.user) {
        setAuthSuccess(result);
      }

      return result;
    } catch (error) {
      await handleError(error, 'TOKEN_VALIDATION_FAILED');
      throw error;
    }
  }, [validateToken, handleError]);

  /**
   * 수동 토큰 갱신
   */
  const manualRefreshToken = useCallback(async () => {
    const currentRefreshToken = refreshToken;

    if (!currentRefreshToken) {
      const error = { code: 'C3003', message: 'Refresh token이 없습니다. 다시 로그인해주세요.' };
      setAuthError(error);
      return error;
    }

    setAuthLoading(true);

    try {
      const { data } = await refreshTokenMutation({
        variables: { refreshToken: currentRefreshToken }
      });

      const result = data.mRefreshToken;

      // 새 토큰 저장
      if (result.accessToken) {
        const newRefreshToken = result.refreshToken || currentRefreshToken;
        await persistTokens(result.accessToken, newRefreshToken);
        updateTokens({ accessToken: result.accessToken, refreshToken: newRefreshToken });
      }

      setAuthLoading(false);

      return result;
    } catch (error) {
      // 토큰 갱신 실패 시 로그아웃 처리
      const processedError = await handleError(error, 'TOKEN_REFRESH_FAILED');

      if (UnifiedErrorHandler.requiresLogout(processedError.code)) {
        await logout();
      }

      throw error;
    }
  }, [refreshToken, refreshTokenMutation, handleError]);

  /**
   * 로그아웃
   */
  const logout = useCallback(async () => {
    setAuthLoading(true);

    try {
      // 서버에 로그아웃 요청
      try {
        await logoutMutation();
      } catch (serverError) {
        // 서버 로그아웃 실패해도 로컬 정리는 진행
        logger.warn('Server logout failed, continuing with local cleanup:', serverError);
      }

      // 로컬 상태 및 토큰 정리
      await clearPersistedTokens();
      resetAuthState();

      showToast('LOGOUT_SUCCESS');
    } catch (error) {
      // 에러가 발생해도 로컬 정리는 진행
      await clearPersistedTokens();
      resetAuthState();

      logger.error('Logout error:', error);
    }
  }, [logoutMutation, showToast]);

  /**
   * 푸시 토큰 업데이트
   */
  const updatePushToken = useCallback(async ({ pushToken }) => {
    try {
      const { data } = await updatePushTokenMutation({
        variables: { pushToken }
      });

      return data.mUpdatePushToken;
    } catch (error) {
      await handleError(error, 'PUSH_TOKEN_UPDATE_FAILED');
      throw error;
    }
  }, [updatePushTokenMutation, handleError]);

  /**
   * 비밀번호 변경
   */
  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    setAuthLoading(true);

    try {
      const { data } = await changePasswordMutation({
        variables: { currentPassword, newPassword }
      });

      const result = data.mChangePassword;

      setAuthLoading(false);
      showToast('PASSWORD_CHANGE_SUCCESS');

      return result;
    } catch (error) {
      await handleError(error, 'PASSWORD_CHANGE_FAILED');
      throw error;
    }
  }, [changePasswordMutation, handleError, showToast]);

  /**
   * 비밀번호 재설정 요청
   */
  const requestPasswordReset = useCallback(async ({ phone }) => {
    setAuthLoading(true);

    try {
      const { data } = await requestPasswordResetMutation({
        variables: {
          input: { phone }
        }
      });

      const result = data.mRequestPasswordReset;

      // 비밀번호 재설정 상태 업데이트
      passwordResetVar({
        isRequested: true,
        expiresIn: result.expiresIn
      });

      setAuthLoading(false);
      showToast('PASSWORD_RESET_REQUEST_SUCCESS');

      return result;
    } catch (error) {
      await handleError(error, 'PASSWORD_RESET_REQUEST_FAILED');
      throw error;
    }
  }, [requestPasswordResetMutation, handleError, showToast]);

  /**
   * 비밀번호 재설정
   */
  const resetPassword = useCallback(async ({ phone, otp, newPassword }) => {
    setAuthLoading(true);

    try {
      const { data } = await resetPasswordMutation({
        variables: {
          input: { phone, otp, newPassword }
        }
      });

      const result = data.mResetPassword;

      // 토큰 저장
      if (result.accessToken && result.refreshToken) {
        await persistTokens(result.accessToken, result.refreshToken);
      }

      setAuthSuccess(result);

      // 비밀번호 재설정 상태 초기화
      passwordResetVar({
        isRequested: false,
        expiresIn: null
      });

      showToast('PASSWORD_RESET_SUCCESS');

      return result;
    } catch (error) {
      await handleError(error, 'PASSWORD_RESET_FAILED');
      throw error;
    }
  }, [resetPasswordMutation, handleError, showToast]);

  /**
   * 계정 비활성화
   */
  const deactivateAccount = useCallback(async ({ reason }) => {
    setAuthLoading(true);

    try {
      const { data } = await deactivateAccountMutation({
        variables: { reason }
      });

      const result = data.mDeactivateAccount;

      // 로컬 상태 정리
      await clearPersistedTokens();
      resetAuthState();

      showToast('ACCOUNT_DEACTIVATE_SUCCESS');

      return result;
    } catch (error) {
      await handleError(error, 'ACCOUNT_DEACTIVATE_FAILED');
      throw error;
    }
  }, [deactivateAccountMutation, handleError, showToast]);

  /**
   * 계정 삭제
   */
  const deleteAccount = useCallback(async ({ password, reason }) => {
    setAuthLoading(true);

    try {
      const { data } = await deleteAccountMutation({
        variables: { password, reason }
      });

      const result = data.mDeleteAccount;

      // 로컬 상태 정리
      await clearPersistedTokens();
      resetAuthState();

      showToast('ACCOUNT_DELETE_SUCCESS');

      return result;
    } catch (error) {
      await handleError(error, 'ACCOUNT_DELETE_FAILED');
      throw error;
    }
  }, [deleteAccountMutation, handleError, showToast]);

  // ========================================
  // 동기 액션 함수들 (Redux 호환)
  // ========================================

  const setLoading = useCallback((isLoading) => {
    setAuthLoading(isLoading);
  }, []);

  const setAuthSuccessAction = useCallback((authData) => {
    setAuthSuccess(authData);
  }, []);

  const setAuthErrorAction = useCallback((error) => {
    setAuthError(error);
  }, []);

  const clearError = useCallback(() => {
    authErrorVar(null);
  }, []);

  const refreshTokenSuccess = useCallback((tokenData) => {
    updateTokens(tokenData);
    if (tokenData.user) {
      userVar(tokenData.user);
    }
  }, []);

  const updateTokensAction = useCallback((tokens) => {
    updateTokens(tokens);
  }, []);

  const resetAuth = useCallback(() => {
    resetAuthState();
  }, []);

  // ========================================
  // 앱 시작 시 토큰 복원
  // ========================================

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const tokens = await restoreTokens();
        if (tokens.accessToken && tokens.refreshToken) {
          // 토큰이 있으면 유효성 검증
          await validateTokenAction();
        }
      } catch (error) {
        logger.error('Auth initialization failed:', error);
        // 토큰 복원 실패 시 정리
        await clearPersistedTokens();
        resetAuthState();
      }
    };

    initializeAuth();
  }, [validateTokenAction]);

  // ========================================
  // 반환 객체 (Redux 호환 인터페이스)
  // ========================================

  return {
    // ===== 상태 값들 (useSelector 대체) =====
    user,
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
    accessToken,
    refreshToken,
    phoneNumber: phoneVerification.phoneNumber,
    isPhoneVerified: phoneVerification.isVerified,
    otpExpiresIn: phoneVerification.otpExpiresIn,
    socialProvider: socialLogin.provider,
    passwordResetExpiresIn: passwordReset.expiresIn,

    // ===== 액션 함수들 (useDispatch 대체) =====

    // 비동기 액션 (createAsyncThunk 대체)
    register,
    loginWithPhone,
    socialLogin: socialLoginAction,
    sendOTP,
    verifyOTP,
    fetchAuthProfile,
    checkPhoneExists: checkPhoneExistsAction,
    validateToken: validateTokenAction,
    manualRefreshToken,
    logout,
    updatePushToken,
    changePassword,
    requestPasswordReset,
    resetPassword,
    deactivateAccount,
    deleteAccount,

    // 동기 액션 (reducer actions 대체)
    setLoading,
    setAuthSuccess: setAuthSuccessAction,
    setAuthError: setAuthErrorAction,
    clearError,
    refreshTokenSuccess,
    updateTokens: updateTokensAction,
    resetAuth,

    // ===== 추가 유틸리티 =====
    hasValidTokens: !!(accessToken && refreshToken),
    isPhoneVerificationRequired: phoneVerification.phoneNumber && !phoneVerification.isVerified,
    isSocialLinked: socialLogin.isLinked,
    isPasswordResetRequested: passwordReset.isRequested
  };
};

export default useAuth;