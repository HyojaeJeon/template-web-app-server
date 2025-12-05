/**
 * ==================================================================================
 * Token Manager - 통합 인증 토큰 관리 시스템
 * ==================================================================================
 *
 * 📋 목적:
 * - Apollo Client와 Socket.IO가 공유하는 중앙 토큰 관리
 * - JWT Access Token과 Refresh Token 생명주기 관리
 * - Redux Store와 AsyncStorage 간 동기화
 *
 * 🏗️ 아키텍처:
 * tokenManager.js (현재 파일)
 *     ├── Redux Store (메모리 - 빠른 접근)
 *     ├── AsyncStorage (영속성 - 앱 재시작 대비)
 *     ├── Apollo Client (GraphQL 인증)
 *     └── Socket.IO (WebSocket 인증)
 *
 * 🔄 토큰 워크플로우:
 * 1. 로그인 → setTokens() → Redux + AsyncStorage 저장
 * 2. API 요청 → getValidToken() → 토큰 첨부
 * 3. 토큰 만료 → refreshToken() → 새 토큰 발급
 * 4. 로그아웃 → clearTokens() → 모든 토큰 제거
 *
 * 🔐 보안 고려사항:
 * - Access Token: 짧은 유효기간 (15분~1시간)
 * - Refresh Token: 긴 유효기간 (7일~30일)
 * - 토큰 자동 갱신으로 UX 개선
 *
 * ==================================================================================
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '@shared/utils/system/logger';
import { apolloMutate } from '@store/utils/apolloThunk';
import { getStore } from '@store/storeService';
import { reset as navigationReset } from '@navigation/services/NavigationService';
import { M_REFRESH_TOKEN } from '@gql/mutations/auth';
import { UnifiedErrorHandler } from '@services/error';
import { refreshTokenSuccess, resetAuth } from '@store/slices/authSlice';

// ==================================================================================
// 🔒 DocumentNode 가드 및 단일 플라이트 패턴
// ==================================================================================

/**
 * DocumentNode 유효성 검사
 * fragments.transform 에러 방지를 위한 핵심 가드
 */
const isDocumentNode = (doc) => !!(
  doc && typeof doc === 'object' &&
  doc.kind === 'Document' &&
  Array.isArray(doc.definitions) &&
  doc.definitions.length > 0
);

// 단일 플라이트 패턴 - 중복 토큰 갱신 방지
let _refreshPromise = null;

// ==================================================================================
// 🔧 Redux Store 접근
// ==================================================================================
/**
 * 전역 Redux Store 가져오기
 *
 * 💡 동작 방식:
 * - 앱 초기화 시 global.__REDUX_STORE__에 store 인스턴스 저장
 * - tokenManager에서 필요할 때마다 접근
 *
 * ⚠️ 주의사항:
 * - Store가 초기화되기 전에 호출되면 undefined 반환
 * - 항상 null 체크 필요
 */

/**
 * ==================================================================================
 * 현재 유효한 Access Token 가져오기
 * ==================================================================================
 *
 * 🎯 목적:
 * - API 요청에 사용할 현재 유효한 Access Token 반환
 * - Redux Store와 AsyncStorage 간 동기화 보장
 *
 * 📊 우선순위:
 * 1. Redux Store (메모리) - 가장 빠름, 최신 상태
 * 2. AsyncStorage (디스크) - 앱 재시작 후 복구용
 *
 * 🔄 동기화 로직:
 * - AsyncStorage에만 있는 경우 → Redux Store로 복사
 * - 양쪽 다 없으면 → null 반환 (로그인 필요)
 *
 * 💡 사용 시점:
 * - GraphQL 요청 헤더 설정 (authLink.js)
 * - Socket.IO 연결 인증 (socketAuthIntegration.js)
 * - API 호출 전 토큰 확인
 *
 * @returns {Promise<string|null>} Access Token 또는 null
 * ==================================================================================
 */
export const getValidToken = async () => {
  try {
    // 1️⃣ Redux Store 조회 (최우선 - 메모리에서 빠른 접근)
    const store = getStore();
    if (store) {
      const state = store.getState();
      const { accessToken, isAuthenticated } = state.auth;

      // 인증 상태와 토큰이 모두 있으면 즉시 반환
      if (isAuthenticated && accessToken) {
        return accessToken;
      }
    }

    // 2️⃣ AsyncStorage 조회 (백업 - 앱 재시작 후 복구)
    const storedToken = await AsyncStorage.getItem('accessToken');
    if (storedToken) {
      // 🔄 Redux Store 동기화: AsyncStorage → Redux
      if (store) {
        store.dispatch(refreshTokenSuccess({
          accessToken: storedToken
        }));
      }
      return storedToken;
    }

    // 3️⃣ 토큰 없음: 로그인 필요
    return null;

  } catch (error) {
    logger.error('토큰 조회 실패:', error);
    return null;  // 에러 시 안전하게 null 반환
  }
};

/**
 * ==================================================================================
 * Refresh Token 가져오기
 * ==================================================================================
 *
 * 🎯 목적:
 * - Access Token 갱신에 사용할 Refresh Token 반환
 * - 장기 인증 유지를 위한 토큰
 *
 * 📊 조회 순서:
 * 1. Redux Store → 빠른 메모리 접근
 * 2. AsyncStorage → 영속성 저장소
 *
 * 🔐 보안 특징:
 * - Refresh Token은 Access Token보다 긴 유효기간
 * - 서버에서만 검증 가능 (클라이언트에서 디코딩 금지)
 * - 탈취 시 즉시 폐기 필요
 *
 * 💡 사용 시점:
 * - Access Token 만료 시 갱신
 * - 앱 시작 시 자동 로그인
 * - 인증 상태 복구
 *
 * @returns {Promise<string|null>} Refresh Token 또는 null
 * ==================================================================================
 */
export const getRefreshToken = async () => {
  try {
    // 1️⃣ Redux Store 우선 확인
    const store = getStore();
    if (store) {
      const state = store.getState();
      if (state.auth.refreshToken) {
        return state.auth.refreshToken;
      }
    }

    // 2️⃣ AsyncStorage에서 조회
    return await AsyncStorage.getItem('refreshToken');

  } catch (error) {
    logger.error('Refresh token 조회 실패:', error);
    return null;
  }
};

/**
 * ==================================================================================
 * 토큰 갱신 처리 (Refresh Token → 새 Access Token)
 * ==================================================================================
 *
 * 🎯 목적:
 * - 만료된 Access Token을 새로운 토큰으로 교체
 * - 사용자 재로그인 없이 인증 상태 유지
 *
 * 📊 처리 과정:
 * 1. Refresh Token 확인 → 없으면 재로그인 필요
 * 2. 서버에 갱신 요청 → /graphql (mRefreshToken mutation)
 * 3. 새 Access Token 수신 → Redux + AsyncStorage 저장
 * 4. 실패 시 → 로그아웃 처리
 *
 * 🔄 자동 갱신 시나리오:
 * - Apollo errorLink에서 401 에러 감지
 * - Socket.IO 재연결 시
 * - 앱 포그라운드 전환 시
 *
 * ⚠️ 주의사항:
 * - 동시에 여러 갱신 요청 방지 (mutex 패턴)
 * - Refresh Token도 만료되면 재로그인 필요
 * - 네트워크 오류와 인증 오류 구분 필요
 *
 * 💡 Redux Thunk 통합:
 * - authSlice의 refreshToken thunk 호출
 * - 성공/실패 상태가 Redux에 자동 반영
 *
 * @returns {Promise<string|null>} 새 Access Token 또는 null
 * ==================================================================================
 */
/**
 * 토큰 갱신 (Enhanced with DocumentNode Guard)
 * ErrorLink에서 호출하는 핵심 토큰 갱신 API
 * fragments.transform 에러 완전 차단
 */
export const refreshToken = async () => {
  // 단일 플라이트 패턴 - 중복 요청 방지
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      // 1️⃣ DocumentNode 가드 - fragments.transform 에러 완전 차단
      if (!isDocumentNode(M_REFRESH_TOKEN)) {
        throw new Error(
          'Invalid GraphQL document for M_REFRESH_TOKEN. ' +
          'Wrap with gql and ensure single versions of graphql / graphql-tag.'
        );
      }

      // 2️⃣ Refresh Token 확인
      const refresh = await AsyncStorage.getItem('refreshToken');
      if (!refresh) {
        logger.info('[SILENT] Refresh token not found - silent logout required');
        return null;
      }

      // 3️⃣ apolloMutate로 안전한 GraphQL 호출
      const data = await apolloMutate({
        mutation: M_REFRESH_TOKEN,
        variables: { refreshToken: refresh },
        rejectWithValue: (e) => { throw e; }, // 에러 시 throw
        awaitRefetchQueries: false, // 빠른 갱신을 위해 생략
      });

      // 4️⃣ 응답 데이터 안전하게 추출 (다양한 스키마 네이밍 대응)
      const payload =
        data?.mRefreshToken ??
        data?.MRefreshToken ??
        data?.refreshToken ??
        data;

      const newAccess = payload?.accessToken;
      const newRefresh = payload?.refreshToken || refresh;

      if (!newAccess) {
        logger.info('[SILENT] No access token in refresh response - silent logout');
        return null;
      }

      // 5️⃣ AsyncStorage 저장 (원자적 저장)
      await AsyncStorage.multiSet([
        ['accessToken', newAccess],
        ['refreshToken', newRefresh],
      ]);

      // 6️⃣ Redux Store 동기화
      const store = getStore();
      if (store) {
        store.dispatch(refreshTokenSuccess({
          accessToken: newAccess,
          refreshToken: newRefresh
        }));
      }

      logger.info('토큰 갱신 성공');
      return newAccess;

    } catch (error) {
      // 통합 에러 처리 + 로깅 (사용자에게는 투명하게 처리)
      const processed = await UnifiedErrorHandler.handleError(error);
      logger.info('[SILENT] Token refresh failed silently:', processed.code || processed.message);
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
};

/**
 * 토큰 만료 처리 (로그아웃 + 토스트 + 리다이렉션)
 */
export const handleTokenExpiry = async () => {
  try {
    const store = getStore();
    if (store) {
      // 서버 호출 없이 로컬 로그아웃만 수행 (resetAuth action 사용)
      store.dispatch(resetAuth());

      // 토스트 메시지 표시
      try {
        // global Toast 함수가 있는지 확인
        if (global.showToast && typeof global.showToast === 'function') {
          global.showToast('AUTH_CUSTOMER_NOT_FOUND_REDIRECT');
        }
      } catch (toastError) {
        logger.warn('토스트 메시지 표시 실패:', toastError);
      }

      // 네비게이션 리셋 (로그인 화면으로 이동)
      try {
        navigationReset({
          index: 0,
          routes: [{ name: 'Auth' }]
        });
      } catch (navError) {
        logger.warn('네비게이션 리셋 실패:', navError);
      }
    }

    // AsyncStorage 정리
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    logger.info('토큰 만료 처리 완료 (토스트 + 리다이렉션 포함)');
  } catch (error) {
    logger.error('토큰 만료 처리 실패:', error);
  }
};

/**
 * ==================================================================================
 * 토큰 저장 (로그인 성공 시)
 * ==================================================================================
 *
 * 🎯 목적:
 * - 로그인/갱신 후 받은 토큰을 안전하게 저장
 * - Redux Store와 AsyncStorage 동시 업데이트
 *
 * 📊 저장 위치:
 * 1. AsyncStorage → 영속성 (앱 재시작 후에도 유지)
 * 2. Redux Store → 빠른 접근 (메모리)
 *
 * 🔄 동기화 보장:
 * - multiSet으로 원자적 저장
 * - Redux dispatch로 즉시 상태 반영
 * - Apollo Client와 Socket.IO 자동 인증 업데이트
 *
 * 💡 호출 시점:
 * - 로그인 성공 (mLoginWithPhone mutation)
 * - 토큰 갱신 성공 (mRefreshToken mutation)
 * - 소셜 로그인 성공
 *
 * ⚠️ 보안 고려:
 * - AsyncStorage는 암호화되지 않음 (iOS Keychain, Android Keystore 고려)
 * - 민감한 정보는 토큰에 포함하지 않음
 *
 * @param {string} accessToken - 새 Access Token
 * @param {string} refreshToken - 새 Refresh Token (선택적)
 * ==================================================================================
 */
export const setTokens = async (accessToken, refreshToken) => {
  try {
    // 1️⃣ AsyncStorage에 토큰 저장 (영속성)
    const tokens = [
      ['accessToken', accessToken],
      ['refreshToken', refreshToken || null],
    ];
    await AsyncStorage.multiSet(tokens);  // 원자적 저장

    // 2️⃣ Redux Store 동기화 (즉시 반영)
    const store = getStore();
    if (store) {
      store.dispatch(refreshTokenSuccess({
        accessToken,
        refreshToken
      }));
    }

    logger.info('Tokens saved successfully');

  } catch (error) {
    logger.error('Token save failed:', error);
    throw error;  // 상위로 에러 전파 (재시도 가능)
  }
};

/**
 * 토큰 삭제 (로그아웃 시 사용)
 */
export const clearTokens = async () => {
  try {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);

    // Redux Store 초기화
    const store = getStore();
    if (store) {
      store.dispatch(resetAuth());
    }

    logger.info('Tokens cleared successfully');
  } catch (error) {
    logger.error('Token clear failed:', error);
    throw error;
  }
};

/**
 * ==================================================================================
 * Socket.IO용 인증 헤더 생성
 * ==================================================================================
 *
 * 🎯 목적:
 * - WebSocket 연결 시 인증 헤더 제공
 * - Socket.IO handshake에 토큰 포함
 *
 * 📊 헤더 형식:
 * {
 *   authorization: "Bearer {accessToken}"
 * }
 *
 * 💡 사용 시점:
 * - Socket.IO 최초 연결
 * - Socket 재연결
 * - 네임스페이스 인증
 *
 * 🔐 보안:
 * - Bearer 토큰 스킴 사용
 * - HTTPS/WSS에서만 안전
 *
 * @returns {Promise<Object>} 인증 헤더 객체
 * ==================================================================================
 */
export const getSocketAuthHeaders = async () => {
  const token = await getValidToken();

  if (token) {
    // 🔑 Bearer 토큰 형식으로 반환
    return {
      authorization: `Bearer ${token}`
    };
  }

  // 토큰 없으면 빈 객체 (게스트 접근)
  return {};
};

/**
 * 인증 상태 확인
 */
export const checkAuthStatus = async () => {
  try {
    const token = await getValidToken();
    const storedRefreshToken = await getRefreshToken();

    // 토큰이 있으면 인증된 상태
    if (token) {
      return {
        isAuthenticated: true,
        accessToken: token,
        refreshToken: storedRefreshToken
      };
    }

    // Refresh token만 있는 경우 갱신 시도
    if (storedRefreshToken) {
      console.log('[DEBUG] mutation type:', typeof M_REFRESH_TOKEN, M_REFRESH_TOKEN);

      const newToken = await refreshToken();  // refreshToken 함수 호출
      if (newToken) {
        return {
          isAuthenticated: true,
          accessToken: newToken,
          refreshToken: storedRefreshToken
        };
      }
    }

    return {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null
    };
  } catch (error) {
    logger.error('Auth status check failed:', error);
    return {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null
    };
  }
};

/**
 * ==================================================================================
 * 토큰 상태 구독 (실시간 인증 상태 감지)
 * ==================================================================================
 *
 * 🎯 목적:
 * - Redux auth 상태 변경을 실시간으로 감지
 * - Socket.IO 자동 재연결 트리거
 * - Apollo Client 인증 헤더 업데이트
 *
 * 📊 구독 이벤트:
 * - 로그인: 토큰 설정 → Socket 연결
 * - 로그아웃: 토큰 제거 → Socket 해제
 * - 토큰 갱신: 새 토큰 → Socket 재인증
 *
 * 🔄 사용 패턴:
 * const unsubscribe = subscribeToTokenChanges(({ accessToken, isAuthenticated }) => {
 *   if (isAuthenticated) {
 *     // Socket 연결 또는 재연결
 *   } else {
 *     // Socket 연결 해제
 *   }
 * });
 *
 * 💡 활용 예시:
 * - SocketManager: 인증 상태에 따른 자동 연결 관리
 * - Apollo Link: 토큰 변경 시 헤더 업데이트
 *
 * ⚠️ 주의사항:
 * - 컴포넌트 언마운트 시 unsubscribe 필수
 * - 너무 많은 구독은 성능 영향
 *
 * @param {Function} callback - 토큰 변경 시 호출될 콜백
 * @returns {Function} 구독 해제 함수
 * ==================================================================================
 */
export const subscribeToTokenChanges = (callback) => {
  const store = getStore();

  // Store가 없으면 빈 함수 반환 (앱 초기화 전)
  if (!store) return () => {};

  // 🔔 Redux store 구독: auth 상태 변경 감지
  return store.subscribe(() => {
    const state = store.getState();
    const { accessToken, isAuthenticated } = state.auth;

    // 콜백으로 현재 인증 상태 전달
    callback({ accessToken, isAuthenticated });
  });
};

export default {
  getValidToken,
  getRefreshToken,
  refreshToken,
  handleTokenExpiry,
  setTokens,
  clearTokens,
  checkAuthStatus,
  getSocketAuthHeaders,
  subscribeToTokenChanges
};
