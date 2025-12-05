/**
 * ==================================================================================
 * Apollo Client 메인 설정 파일
 * ==================================================================================
 *
 * 📋 목적:
 * - GraphQL API와 통신하는 Apollo Client의 중앙 관리
 * - 싱글톤 패턴으로 단일 인스턴스 보장
 * - 캐시 관리 및 네트워크 상태 처리
 *
 * 🏗️ 아키텍처:
 * apolloClient.js (현재 파일)
 *     ├── links/ (HTTP, Auth, Error 링크 체인)
 *     ├── cacheConfig.js (InMemoryCache 설정)
 *     ├── tokenManager.js (JWT 토큰 관리)
 *     └── socketAuthIntegration.js (Socket.IO 연동)
 *
 * 🔄 워크플로우:
 * 1. 앱 시작 → initApolloClient() 호출
 * 2. 싱글톤 체크 → 이미 있으면 재사용, 없으면 생성
 * 3. 링크 체인 구성 (Auth → Error → HTTP)
 * 4. 캐시 초기화 및 영속성 설정
 * 5. 클라이언트 인스턴스 반환
 *
 * ==================================================================================
 */

import { ApolloClient } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistCache, AsyncStorageWrapper } from 'apollo3-cache-persist';
import { createApolloLinks } from '@services/apollo/links';
import { createCache, resetCache, refreshCacheForLanguage } from '@services/apollo/cacheConfig';
import logger from '@shared/utils/system/logger';

// Apollo Client 개발 모드 에러 메시지 활성화
if (__DEV__) {
  import('@apollo/client/dev').then(({ loadErrorMessages, loadDevMessages }) => {
    loadDevMessages();
    loadErrorMessages();
  });
}

// ⚠️ patchApolloClient 제거됨 - DocumentNode 검증으로 근본 해결

// ==================================================================================
// 🎯 Apollo Client 인스턴스 (싱글톤)
// ==================================================================================
let apolloClient = null;  // 전역 Apollo Client 인스턴스
let initializing = null;  // 초기화 중인 Promise (중복 초기화 방지)

/**
 * ==================================================================================
 * Apollo Client 초기화 함수
 * ==================================================================================
 *
 * 🎯 목적:
 * - Apollo Client의 단일 인스턴스 생성 및 관리
 * - 중복 초기화 방지를 위한 Promise 래치 패턴 구현
 *
 * 📊 싱글톤 + Promise 래치 패턴:
 * 1. apolloClient가 이미 있으면 → 즉시 반환
 * 2. initializing이 진행 중이면 → 같은 Promise 반환 (중복 방지)
 * 3. 둘 다 없으면 → 새로 초기화 시작
 *
 * 🔧 설정 옵션:
 * - fetchPolicy: 캐시와 네트워크 사용 전략
 *   • cache-and-network: watchQuery용 (실시간 업데이트)
 *   • cache-first: 일반 query용 (성능 우선)
 * - errorPolicy: 'all' (부분 데이터도 반환)
 * - assumeImmutableResults: true (불변 데이터로 성능 최적화)
 *
 * ⚠️ 에러 처리:
 * - 초기화 실패 시 fallback 클라이언트 생성
 * - 최소한의 기능만 포함한 안전 모드 클라이언트
 *
 * @returns {Promise<ApolloClient>} Apollo Client 인스턴스
 * ==================================================================================
 */
export const initApolloClient = async () => {
  // 1️⃣ 이미 초기화된 클라이언트가 있으면 즉시 반환
  if (apolloClient) return apolloClient;

  // 2️⃣ 초기화가 진행 중이면 같은 Promise 반환 (중복 방지)
  if (initializing) return initializing;

  // 3️⃣ 새로운 초기화 시작
  initializing = (async () => {
    try {
      // 💾 캐시 인스턴스 생성
      const cache = createCache();

      // 📱 개발 모드: 기존 캐시 정리 (매번 새로 시작)
      if (__DEV__) {
        await AsyncStorage.removeItem('apollo-cache-persist');
      }

      // 🔄 캐시 영속성 설정 (AsyncStorage 사용)
      try {
        await persistCache({
          cache,
          storage: new AsyncStorageWrapper(AsyncStorage),
          key: 'apollo-cache',
          maxSize: 1048576 * 2, // 2MB
          debug: __DEV__,
        });
        logger.info('[Apollo] Cache persisted to AsyncStorage');
      } catch (persistError) {
        logger.error('[Apollo] Failed to persist cache:', persistError);
      }

      // 🔧 Apollo Client 인스턴스 생성
      const client = new ApolloClient({
        // 🔗 링크 체인: Auth → Error → HTTP 순서로 처리
        link: createApolloLinks(),

        // 💾 캐시 설정: InMemoryCache + 영속성
        cache,

        // 🔄 로컬 리졸버: @client 쿼리 처리
        resolvers: {
          Query: {
            // 인증 상태 쿼리 리졸버 (Apollo Cache에서 읽기)
            isAuthenticated: () => false, // 기본값
            user: () => null // 기본값
          }
        },

        // 📄 로컬 타입 정의
        typeDefs: `
          extend type Query {
            isAuthenticated: Boolean!
            user: User
          }

          type User {
            id: ID!
            fullName: String
            phone: String
            email: String
            avatarUrl: String
            points: Int
            preferredLanguage: String
          }
        `,

        // ⚙️ 기본 옵션 설정
        defaultOptions: {
          // 👀 watchQuery: 실시간 데이터 감시 (구독형 쿼리)
          watchQuery: {
            fetchPolicy: 'cache-and-network',  // 캐시 먼저, 그 다음 네트워크
            errorPolicy: 'all',                // 에러가 있어도 부분 데이터 반환
            notifyOnNetworkStatusChange: true  // 네트워크 상태 변경 알림
          },
          // 📊 query: 일반 데이터 조회
          query: {
            fetchPolicy: 'cache-first',  // 캐시 우선 (성능 최적화)
            errorPolicy: 'all'           // 에러가 있어도 캐시 데이터 반환
          },
          // ✏️ mutate: 데이터 변경 작업
          mutate: {
            errorPolicy: 'all'  // 에러가 있어도 가능한 작업 수행
          }
        },

        // 🛠️ 개발 도구 연결 (개발 모드에서만)
        connectToDevTools: __DEV__,

        // ⚡ 성능 최적화: 데이터를 불변으로 취급
        assumeImmutableResults: true,

        // 🔄 queryDeduplication: 기본값(true) - 중복 쿼리 방지

        // 📛 클라이언트 식별 정보
        name: 'duri-app',
        version: '1.0.0',

        // 🔒 안전한 GraphQL 처리
        ssrMode: false,
        ssrForceFetchDelay: 0,

        // 🚫 Fragment 처리 완전 비활성화 (fragments.transform 에러 해결)
        addTypename: false,           // __typename 추가 비활성화
        queryDeduplication: true      // 쿼리 중복 제거 활성화 (불필요 중복 요청 방지)
      });

      // ✅ 성공: 전역 인스턴스 저장
      apolloClient = client;
      logger.info('Apollo Client initialized successfully');
      return client;

    } catch (error) {
      // ❌ 실패: 에러 로깅
      logger.error('Apollo Client initialization failed:', error);

      // 🔄 Fallback: 최소 기능 클라이언트 생성
      const fallbackClient = new ApolloClient({
        link: createApolloLinks(),
        cache: createCache(),
        defaultOptions: {
          query: { errorPolicy: 'all' },
          watchQuery: { errorPolicy: 'all' }
        },
        typeDefs: [], // 빈 typeDefs로 초기화
        resolvers: {}, // 빈 resolvers로 초기화
        assumeImmutableResults: true,
        fragmentMatcher: undefined, // Fragment matcher 비활성화
        documentTransform: undefined, // Document 변환 완전 차단
        queryDeduplication: false, // Query deduplication 비활성화
        transformDocument: undefined, // Apollo Client 내부 변환 로직 비활성화
        addTypename: false // Fragment 처리 완전 비활성화
      });

      apolloClient = fallbackClient;
      logger.info('Fallback Apollo Client created');
      return fallbackClient;

    } finally {
      // 🧹 정리: 초기화 플래그 제거
      initializing = null;
    }
  })();

  return initializing;
};

/**
 * ==================================================================================
 * Apollo Client 인스턴스 가져오기 (비동기)
 * ==================================================================================
 *
 * 🎯 목적:
 * - Apollo Client 인스턴스를 안전하게 가져오기
 * - 초기화되지 않았으면 자동으로 초기화
 *
 * 📊 동작 방식:
 * 1. apolloClient가 있으면 → 즉시 반환
 * 2. 없으면 → initApolloClient() 호출하여 초기화
 *
 * 💡 사용 예시:
 * const client = await getApolloClient();
 * await client.query({ query: MY_QUERY });
 *
 * @returns {Promise<ApolloClient>} Apollo Client 인스턴스
 * ==================================================================================
 */
export const getApolloClient = async () => {
  return apolloClient ?? (await initApolloClient());
};

/**
 * ==================================================================================
 * Apollo Store 리셋 (로그아웃 시 사용)
 * ==================================================================================
 *
 * 🎯 목적:
 * - 로그아웃 시 모든 캐시된 데이터 제거
 * - 메모리 누수 방지를 위한 가비지 컬렉션
 * - 사용자 데이터 보안을 위한 완전한 정리
 *
 * 📊 처리 순서:
 * 1. clearStore() → 모든 캐시 데이터 삭제
 * 2. cache.gc() → 고아 객체 정리 (메모리 최적화)
 * 3. 실패 시 → resetCache()로 fallback 처리
 *
 * 🔒 보안 고려사항:
 * - 로그아웃 시 반드시 호출하여 이전 사용자 데이터 제거
 * - 토큰이 제거된 후 호출되어야 함
 *
 * 💡 사용 시점:
 * - 사용자 로그아웃
 * - 계정 전환
 * - 앱 초기화
 *
 * ==================================================================================
 */
export const resetApolloStore = async () => {
  try {
    if (apolloClient) {
      // 1️⃣ 캐시 스토어 전체 삭제
      await apolloClient.clearStore();

      // 2️⃣ 가비지 컬렉션: 참조되지 않는 객체 정리
      await apolloClient.cache.gc();

      // 3️⃣ 영속성 캐시 삭제
      await AsyncStorage.removeItem('apollo-cache');

      logger.info('[Apollo] Store and persisted cache cleared');
    }
  } catch (error) {
    logger.error('Apollo store reset failed:', error);

    // 4️⃣ Fallback: 캐시만이라도 리셋 시도
    if (apolloClient?.cache) {
      await resetCache(apolloClient.cache);
    }
    // 영속성 캐시도 시도
    await AsyncStorage.removeItem('apollo-cache').catch(() => {});
  }
};

/**
 * ==================================================================================
 * 언어 변경 처리
 * ==================================================================================
 *
 * 🎯 목적:
 * - 앱 언어 변경 시 캐시된 다국어 데이터 갱신
 * - 서버에서 새로운 언어의 데이터를 다시 가져오기
 *
 * 📊 처리 과정:
 * 1. 현재 캐시된 쿼리들을 확인
 * 2. 언어 관련 필드가 있는 쿼리들 식별
 * 3. 해당 쿼리들을 새로운 언어로 refetch
 *
 * 🌍 지원 언어:
 * - vi: Local어 (기본)
 * - en: 영어
 * - ko: 한국어
 *
 * 💡 사용 예시:
 * await handleLanguageChange('en');  // 영어로 변경
 *
 * ⚠️ 주의사항:
 * - 언어 변경 후 UI가 자동으로 업데이트됨
 * - 네트워크 요청이 발생하므로 로딩 상태 처리 필요
 *
 * @param {string} newLanguage - 변경할 언어 코드 (vi, en, ko)
 * @returns {Promise<boolean>} 성공 여부
 * ==================================================================================
 */
export const handleLanguageChange = async (newLanguage) => {
  if (apolloClient) {
    // cacheConfig.js의 refreshCacheForLanguage 함수 호출
    return await refreshCacheForLanguage(apolloClient, newLanguage);
  }
  return false;
};

/**
 * ==================================================================================
 * 네트워크 상태 변경 처리
 * ==================================================================================
 *
 * 🎯 목적:
 * - 네트워크 연결/해제 시 적절한 대응
 * - 오프라인에서 온라인으로 전환 시 데이터 동기화
 *
 * 📊 동작 방식:
 * - 연결됨 (true): 활성 쿼리들을 자동으로 refetch
 * - 연결 끊김 (false): 아무 동작 없음 (캐시 데이터 사용)
 *
 * 🔄 Refetch 대상:
 * - include: 'active' → 현재 화면에서 사용 중인 쿼리들만
 * - 백그라운드 쿼리는 제외 (성능 최적화)
 *
 * 💡 사용 시점:
 * - NetInfo 라이브러리와 연동
 * - 비행기 모드 해제
 * - WiFi/모바일 데이터 전환
 *
 * ⚠️ 고려사항:
 * - 대량의 refetch가 발생할 수 있으므로 throttle 필요할 수 있음
 * - 사용자에게 동기화 중임을 알리는 UI 표시 권장
 *
 * @param {boolean} isConnected - 네트워크 연결 상태
 * ==================================================================================
 */
export const handleNetworkStatusChange = (isConnected) => {
  if (apolloClient && isConnected) {
    // 📡 네트워크 재연결 시: 활성 쿼리들 새로고침
    apolloClient.refetchQueries({
      include: 'active'  // 현재 활성화된 쿼리만 refetch
    });
  }
};

// ==================================================================================
// 🛠️ 개발 도구 설정
// ==================================================================================
/**
 * 개발 모드에서 Apollo Client 전역 노출
 *
 * 🎯 목적:
 * - React Native Debugger에서 Apollo Client 접근 가능
 * - 콘솔에서 직접 쿼리 실행 및 캐시 검사 가능
 *
 * 💡 사용 예시 (디버거 콘솔):
 * __APOLLO_CLIENT__.cache.extract()  // 캐시 내용 확인
 * __APOLLO_CLIENT__.query({ query: ... })  // 직접 쿼리 실행
 *
 * ⚠️ 보안 주의:
 * - 프로덕션 빌드에서는 자동으로 제외됨 (__DEV__ 체크)
 */
if (__DEV__) {
  Object.defineProperty(global, '__APOLLO_CLIENT__', {
    get: () => apolloClient,
    set: (value) => {
      apolloClient = value;
    },
    configurable: true
  });
}

export default {
  initApolloClient,
  getApolloClient,
  resetApolloStore,
  handleLanguageChange,
  handleNetworkStatusChange
};
