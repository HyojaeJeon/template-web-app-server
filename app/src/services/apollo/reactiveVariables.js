/**
 * Apollo Client Reactive Variables
 *
 * 인증 관련 상태 관리
 */

import { makeVar } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '@shared/utils/system/logger';

// ==================================================================================
// Auth Domain - Reactive Variables
// ==================================================================================

/** 인증된 사용자 정보 */
export const userVar = makeVar(null);

/** 인증 상태 */
export const isAuthenticatedVar = makeVar(false);

/** 인증 로딩 상태 */
export const authLoadingVar = makeVar(false);

/** 인증 에러 정보 */
export const authErrorVar = makeVar(null);

/** 액세스 토큰 */
export const accessTokenVar = makeVar(null);

/** 리프레시 토큰 */
export const refreshTokenVar = makeVar(null);

/** 전화번호 인증 상태 */
export const phoneVerificationVar = makeVar({
  phoneNumber: null,
  isVerified: false,
  otpExpiresIn: null
});

/** 소셜 로그인 정보 */
export const socialLoginVar = makeVar({
  provider: null,
  isLinked: false
});

/** 비밀번호 재설정 상태 */
export const passwordResetVar = makeVar({
  isRequested: false,
  expiresIn: null
});

// ==================================================================================
// Chat Domain - Reactive Variables (기본 뼈대)
// ==================================================================================

/** 채팅방 목록 */
export const chatRoomsVar = makeVar([]);

/** 현재 활성 채팅방 */
export const activeChatRoomVar = makeVar(null);

/** 채팅 메시지 목록 (채팅방별) */
export const chatMessagesVar = makeVar({});

/** 총 읽지 않은 메시지 수 */
export const unreadMessageCountVar = makeVar(0);

/** 타이핑 중인 사용자 정보 */
export const typingUsersVar = makeVar({});

// ==================================================================================
// Auth Helper Functions
// ==================================================================================

/** 인증 상태 초기화 (로그아웃) */
export const resetAuthState = () => {
  userVar(null);
  isAuthenticatedVar(false);
  authLoadingVar(false);
  authErrorVar(null);
  accessTokenVar(null);
  refreshTokenVar(null);
  phoneVerificationVar({
    phoneNumber: null,
    isVerified: false,
    otpExpiresIn: null
  });
  socialLoginVar({
    provider: null,
    isLinked: false
  });
  passwordResetVar({
    isRequested: false,
    expiresIn: null
  });

  logger.info('Auth state reset completed');
};

/** 인증 성공 상태 설정 */
export const setAuthSuccess = (authData) => {
  const { user, accessToken, refreshToken } = authData;

  userVar(user);
  isAuthenticatedVar(true);
  authLoadingVar(false);
  authErrorVar(null);

  if (accessToken) accessTokenVar(accessToken);
  if (refreshToken) refreshTokenVar(refreshToken);

  if (user?.phone) {
    phoneVerificationVar(prev => ({
      ...prev,
      phoneNumber: user.phone,
      isVerified: user.phoneVerified || false
    }));
  }

  logger.info('Auth success state set');
};

/** 인증 에러 상태 설정 */
export const setAuthError = (error) => {
  authLoadingVar(false);
  authErrorVar(error);
  isAuthenticatedVar(false);

  logger.error('Auth error state set:', error);
};

/** 토큰 업데이트 (자동 갱신 시 사용) */
export const updateTokens = (tokens) => {
  const { accessToken, refreshToken } = tokens;

  if (accessToken) {
    accessTokenVar(accessToken);
    isAuthenticatedVar(true);
  }

  if (refreshToken) {
    refreshTokenVar(refreshToken);
  }

  authErrorVar(null);

  logger.info('Tokens updated successfully');
};

/** 로딩 상태 설정 */
export const setAuthLoading = (isLoading) => {
  authLoadingVar(isLoading);
  if (isLoading) {
    authErrorVar(null);
  }
};

// ==================================================================================
// Persistence Helper Functions
// ==================================================================================

/** 토큰을 AsyncStorage에 저장 */
export const persistTokens = async (accessToken, refreshToken) => {
  try {
    if (accessToken) {
      await AsyncStorage.setItem('accessToken', accessToken);
      accessTokenVar(accessToken);
    }
    if (refreshToken) {
      await AsyncStorage.setItem('refreshToken', refreshToken);
      refreshTokenVar(refreshToken);
    }

    logger.info('Tokens persisted to storage');
  } catch (error) {
    logger.error('Token persistence failed:', error);
  }
};

/** 저장된 토큰 복원 */
export const restoreTokens = async () => {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      AsyncStorage.getItem('accessToken'),
      AsyncStorage.getItem('refreshToken')
    ]);

    if (accessToken) accessTokenVar(accessToken);
    if (refreshToken) refreshTokenVar(refreshToken);

    logger.info('Tokens restored from storage');
    return { accessToken, refreshToken };
  } catch (error) {
    logger.error('Token restoration failed:', error);
    return { accessToken: null, refreshToken: null };
  }
};

/** 저장된 토큰 삭제 */
export const clearPersistedTokens = async () => {
  try {
    await Promise.all([
      AsyncStorage.removeItem('accessToken'),
      AsyncStorage.removeItem('refreshToken')
    ]);

    accessTokenVar(null);
    refreshTokenVar(null);

    logger.info('Persisted tokens cleared');
  } catch (error) {
    logger.error('Token clearing failed:', error);
  }
};

// ==================================================================================
// Computed Values
// ==================================================================================

/** 인증된 사용자인지 확인 */
export const getIsAuthenticated = () => {
  return isAuthenticatedVar() && !!accessTokenVar();
};

/** 현재 사용자 정보 가져오기 */
export const getCurrentUser = () => {
  return userVar();
};

/** 유효한 토큰 존재 여부 */
export const hasValidTokens = () => {
  return !!(accessTokenVar() && refreshTokenVar());
};

// ==================================================================================
// Export
// ==================================================================================

export default {
  // Auth
  userVar,
  isAuthenticatedVar,
  authLoadingVar,
  authErrorVar,
  accessTokenVar,
  refreshTokenVar,
  phoneVerificationVar,
  socialLoginVar,
  passwordResetVar,

  // Chat (기본 뼈대)
  chatRoomsVar,
  activeChatRoomVar,
  chatMessagesVar,
  unreadMessageCountVar,
  typingUsersVar,

  // Helpers
  resetAuthState,
  setAuthSuccess,
  setAuthError,
  updateTokens,
  setAuthLoading,
  persistTokens,
  restoreTokens,
  clearPersistedTokens,
  getIsAuthenticated,
  getCurrentUser,
  hasValidTokens
};
