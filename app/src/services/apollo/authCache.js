/**
 * Apollo Cache 인증 상태 관리
 * Redux에서 Apollo Cache로 완전 마이그레이션을 위한 유틸리티
 */

import { gql } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApolloClient } from './apolloClient';
import { decodeToken } from '@utils/tokenMonitor';
import logger from '@shared/utils/system/logger';

// Apollo Cache에서 사용할 인증 상태 쿼리
export const GET_AUTH_STATUS = gql`
  query GetAuthStatus @client {
    isAuthenticated
    user {
      id
      fullName
      phone
      email
      avatarUrl
      points
      preferredLanguage
    }
  }
`;

/**
 * Apollo Cache에 인증 상태 쓰기
 * @param {Object} authData - 인증 데이터
 * @param {boolean} authData.isAuthenticated - 인증 여부
 * @param {Object} authData.user - 사용자 정보
 */
export const writeAuthToCache = async (authData) => {
  try {
    const client = await getApolloClient();

    const normalizedUser = authData.user ? {
      id: authData.user.id ?? null,
      fullName: authData.user.fullName ?? null,
      phone: authData.user.phone ?? null,
      email: authData.user.email ?? null,
      avatarUrl: authData.user.avatarUrl ?? null,
      points: authData.user.points ?? 0,
      preferredLanguage: authData.user.preferredLanguage ?? 'vi'
    } : null;

    // Apollo Cache에 직접 쓰기
    client.writeQuery({
      query: GET_AUTH_STATUS,
      data: {
        isAuthenticated: authData.isAuthenticated || false,
        user: normalizedUser
      }
    });

    // 추가로 캐시에 직접 데이터 설정 (확실한 저장을 위해)
    client.cache.writeQuery({
      query: GET_AUTH_STATUS,
      data: {
        isAuthenticated: authData.isAuthenticated || false,
        user: normalizedUser
      }
    });

    logger.info('Apollo Cache - Auth state written:', {
      isAuthenticated: authData.isAuthenticated,
      userId: authData.user?.id || null
    });

    // 디버깅을 위해 즉시 읽기 테스트
    if (__DEV__) {
      try {
        const testRead = client.readQuery({
          query: GET_AUTH_STATUS,
          errorPolicy: 'ignore'
        });
        logger.info('Apollo Cache - Write verification:', testRead);
      } catch (readError) {
        logger.warn('Apollo Cache - Verification read failed:', readError);
      }
    }

  } catch (error) {
    logger.error('Apollo Cache - Failed to write auth state:', error);
  }
};

/**
 * Apollo Cache에서 인증 상태 읽기
 * @returns {Object} 인증 상태 데이터
 */
export const readAuthFromCache = async () => {
  try {
    const client = await getApolloClient();

    const result = client.readQuery({
      query: GET_AUTH_STATUS,
      errorPolicy: 'ignore'
    });

    return result || { isAuthenticated: false, user: null };

  } catch (error) {
    logger.warn('Apollo Cache - Failed to read auth state:', error);
    return { isAuthenticated: false, user: null };
  }
};

/**
 * Apollo Cache에서 인증 상태 제거 (로그아웃)
 */
export const clearAuthFromCache = async () => {
  try {
    const client = await getApolloClient();

    client.writeQuery({
      query: GET_AUTH_STATUS,
      data: {
        isAuthenticated: false,
        user: null
      }
    });

    logger.info('Apollo Cache - Auth state cleared');

  } catch (error) {
    logger.error('Apollo Cache - Failed to clear auth state:', error);
  }
};

/**
 * 로그인 시 Apollo Cache 업데이트
 * @param {Object} user - 사용자 정보
 */
export const setAuthenticatedUser = async (user) => {
  await writeAuthToCache({
    isAuthenticated: true,
    user: user
  });
};

/**
 * 로그아웃 시 Apollo Cache 정리
 */
export const setUnauthenticated = async () => {
  await clearAuthFromCache();
};

/**
 * 사용자 정보 업데이트 (프로필 수정 시)
 * @param {Object} updatedUser - 수정된 사용자 정보
 */
export const updateUserInCache = async (updatedUser) => {
  try {
    const currentAuth = await readAuthFromCache();

    if (currentAuth.isAuthenticated) {
      await writeAuthToCache({
        isAuthenticated: true,
        user: {
          ...currentAuth.user,
          ...updatedUser
        }
      });
    }
  } catch (error) {
    logger.error('Apollo Cache - Failed to update user info:', error);
  }
};

/**
 * 앱 시작 시 저장된 토큰에서 Apollo Cache 인증 상태 초기화
 */
export const initializeAuthFromStorage = async () => {
  try {
    logger.info('Apollo Cache - Starting auth initialization from storage...');

    const accessToken = await AsyncStorage.getItem('accessToken');
    logger.info('Apollo Cache - Access token exists:', !!accessToken);

    if (accessToken) {
      const decoded = decodeToken(accessToken);
      logger.info('Apollo Cache - Token decoded:', {
        decoded: !!decoded,
        hasExp: decoded?.exp,
        isExpired: decoded?.exp ? (decoded.exp * 1000) <= Date.now() : true
      });

      if (decoded && decoded.exp && (decoded.exp * 1000) > Date.now()) {
        // 유효한 토큰이 있으면 Apollo Cache에 인증 상태 설정
        const user = {
          id: decoded.id || decoded.userId,
          fullName: decoded.fullName || decoded.name || 'User',
          phone: decoded.phone || null,
          email: decoded.email || null,
          avatarUrl: decoded.avatarUrl || null,
          points: decoded.points || 0,
          preferredLanguage: decoded.preferredLanguage || 'vi'
        };

        logger.info('Apollo Cache - User data prepared:', {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone
        });

        await writeAuthToCache({
          isAuthenticated: true,
          user: user
        });

        logger.info('Apollo Cache - Auth initialized successfully from stored token');
        return true;
      } else {
        // Access Token 만료: Refresh Token은 유지해야 자동 갱신 가능
        logger.warn('Apollo Cache - Access token expired, removing only accessToken (keep refreshToken)');
        await AsyncStorage.removeItem('accessToken');
        // refreshToken은 유지하여 ErrorLink/체크 루틴이 갱신을 시도하게 함
        await clearAuthFromCache();

        logger.info('Apollo Cache - Cleared auth cache, kept refreshToken for silent refresh');
        return false;
      }
    } else {
      // 토큰이 없으면 비인증 상태로 설정
      logger.info('Apollo Cache - No token found, setting unauthenticated state');
      await clearAuthFromCache();
      return false;
    }

  } catch (error) {
    logger.error('Apollo Cache - Failed to initialize auth from storage:', error);
    await clearAuthFromCache();
    return false;
  }
};

export default {
  writeAuthToCache,
  readAuthFromCache,
  clearAuthFromCache,
  setAuthenticatedUser,
  setUnauthenticated,
  updateUserInCache,
  initializeAuthFromStorage,
  GET_AUTH_STATUS
};
