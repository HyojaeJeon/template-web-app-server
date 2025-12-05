/**
 * Apollo Client 통합 모듈
 * 리팩토링된 Apollo Client 시스템의 진입점
 */

// 메인 Apollo Client
export {
  initApolloClient,
  getApolloClient,
  resetApolloStore,
  handleLanguageChange,
  handleNetworkStatusChange
} from '@services/apollo/apolloClient';

// 토큰 관리
export {
  getValidToken,
  getRefreshToken,
  refreshToken,
  handleTokenExpiry,
  setTokens,
  clearTokens,
  checkAuthStatus,
  getSocketAuthHeaders,
  subscribeToTokenChanges
} from '@services/apollo/tokenManager';

// Socket.IO 통합 (Realtime SocketManager 사용)
export { default as socketManager } from '@services/realtime/SocketManager';

// 캐시 관리
export {
  createCache,
  resetCache,
  refreshCacheForLanguage
} from '@services/apollo/cacheConfig';

// Apollo Links (필요시 개별 사용)
export {
  createApolloLinks,
  createAuthLink,
  createErrorLink,
  createHttpLink
} from '@services/apollo/links';

// Apollo hooks (기존 호환성 유지)
export {
  useQuery,
  useMutation,
  useLazyQuery,
  useApolloClient
} from '@apollo/client';

/**
 * 통합 초기화 함수
 * App.js에서 한 번만 호출
 */
export const initializeApolloSystem = async () => {
  try {
    // Apollo Client 초기화
    const client = await initApolloClient();

    // 전역 store에 Apollo Client 저장 (필요시)
    if (global.__REDUX_STORE__) {
      global.__APOLLO_CLIENT__ = client;
    }

    // Socket.IO 초기화 (인증된 경우만)
    const token = await getValidToken();
    if (token) {
      await connectSocket();
    }

    console.log('Apollo system initialized successfully');
    return client;
  } catch (error) {
    console.error('Apollo system initialization failed:', error);
    throw error;
  }
};

/**
 * 시스템 정리 함수
 * 앱 종료 또는 로그아웃 시 호출
 */
export const cleanupApolloSystem = async () => {
  try {
    // Socket 연결 종료
    disconnectSocket();

    // Apollo Store 초기화
    await resetApolloStore();

    console.log('Apollo system cleanup completed');
  } catch (error) {
    console.error('Apollo system cleanup failed:', error);
  }
};

// 레거시 별칭 제거됨 - 직접 함수명을 사용하세요 (resetApolloStore, getApolloClient)

// 기본 export
export default {
  initializeApolloSystem,
  cleanupApolloSystem,
  getApolloClient,
  socketManager
};
