/**
 * Error Link
 * GraphQL 에러 처리 및 토큰 갱신 로직
 */

import { onError } from '@apollo/client/link/error';
import { fromPromise } from '@apollo/client/link/utils';
import { refreshToken, handleTokenExpiry } from '@services/apollo/tokenManager';
import logger from '@shared/utils/system/logger';

/**
 * 에러 코드 정의 - 서버와 통일된 4가지 핵심 에러
 */

// 1. Access Token 만료 - refresh token으로 재발급 시도
const ACCESS_TOKEN_EXPIRED = 'ACCESS_TOKEN_EXPIRED';
const TOKEN_EXPIRED = 'TOKEN_EXPIRED';  // withMAuth가 변환한 에러 키
const ACCESS_TOKEN_EXPIRED_M2003 = 'M2003'; // 서버의 토큰 만료 에러 코드

// 2. Refresh Token 만료 - 재로그인 필요
const REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED';

// 3. 잘못된 토큰 또는 토큰 없음 - 로그인 필요
// INVALID_TOKEN은 제외 (refresh token 검증 실패 시 사용되므로 별도 처리)
const INVALID_TOKEN_ERRORS = [
  'NO_TOKEN',          // 토큰 없음
  'UNAUTHENTICATED',   // 인증되지 않음
  'M2001',             // Mobile 인증 필요 에러 코드
  'M2005',             // 고객을 찾을 수 없습니다 (로그인 필요)
  'CUSTOMER_NOT_FOUND', // 서버에서 반환하는 키 형태
  'S2001',             // Store 인증 에러 코드 (서버에서 사용 가능)
];

// 4. 권한 부족 - 로그인은 되어 있으나 역할 문제
const PERMISSION_ERRORS = [
  'UNAUTHORIZED',       // 권한 없음
  'PERMISSION_DENIED',  // 권한 거부
  'FORBIDDEN',         // 금지된 접근
];

// 인증 에러 메시지 패턴 (Local어 메시지 추가)
const AUTH_ERROR_PATTERNS = [
  '로그인이 필요합니다',
  'Bạn cần đăng nhập để thực hiện hành động này',  // Local어 추가
  'JWT token expired',
  'invalid signature',
  'jwt expired',
  'Authentication required',
  'Unauthorized'
];

// 서버 내부 오류 패턴 - AuthMiddleware 관련 추가
const SERVER_ERROR_PATTERNS = [
  'Cannot read properties of undefined',
  'TypeError:',
  'ReferenceError:',
  'Internal server error',
  'Database connection',
  'findByPk',
  'Model not found',
  // AuthMiddleware 관련 에러
  "Cannot read properties of undefined (reading 'findByPk')",
  'Authentication error: TypeError:',
  'getUser',
  'AuthMiddleware.js'
];

/**
 * 에러 타입 판별 - 4가지 케이스로 단순화
 */
const getErrorType = (error) => {
  if (!error || !error.extensions) return null;

  // errorCode를 우선 확인, 없으면 code 확인
  const codeRaw = error.extensions.errorCode ?? error.extensions.code;
  const codeStr = codeRaw != null ? String(codeRaw) : '';
  const codeNum = Number.isFinite(Number(codeRaw)) ? Number(codeRaw) : NaN;

  // 1. Access Token 만료 → 토큰 재발급 시도
  // 서버가 숫자(2003) 또는 문자열(M2003/ACCESS_TOKEN_EXPIRED/TOKEN_EXPIRED)로 반환할 수 있음
  if (
    codeRaw === ACCESS_TOKEN_EXPIRED ||
    codeRaw === TOKEN_EXPIRED ||
    codeRaw === ACCESS_TOKEN_EXPIRED_M2003 ||
    codeStr === 'ACCESS_TOKEN_EXPIRED' ||
    codeStr === 'TOKEN_EXPIRED' ||
    codeStr === 'M2003' ||
    codeStr === 'S2003' ||
    codeStr === '2003' ||
    codeNum === 2003
  ) {
    return 'TOKEN_REFRESH_NEEDED';
  }

  // 2. Refresh Token 만료 → 재로그인 필요
  if (codeRaw === REFRESH_TOKEN_EXPIRED || codeStr === 'REFRESH_TOKEN_EXPIRED') {
    return 'RELOGIN_NEEDED';
  }

  // 2.5 특정 케이스는 UI 모달로 처리 → 완전 무시(로그/토스트/전파 금지)
  // M5004, M5009, M5010, STORE_MISMATCH, DIFFERENT_STORE_ITEMS 모두 무시
  if (
    codeStr === 'STORE_MISMATCH' ||
    codeStr === 'DIFFERENT_STORE_ITEMS' ||
    codeStr === 'M5004' ||
    codeStr === 'M5009' ||
    codeStr === 'M5010'
  ) {
    return 'SILENT_HANDLED';
  }

  // 3. INVALID_TOKEN 에러 특별 처리
  // M2014는 서버가 반환하는 INVALID_TOKEN의 실제 에러 코드
  // mRefreshToken에서 발생한 경우만 재로그인, 그 외는 토큰 갱신 시도
  if (codeStr === 'INVALID_TOKEN' || codeStr === 'M2014' || codeNum === 2014) {
    // error.path를 통해 어떤 mutation/query에서 발생했는지 확인
    console.log('🔍 [DEBUG] INVALID_TOKEN detected. Path:', error.path, 'Code:', codeStr);

    if (error.path && error.path[0] === 'mRefreshToken') {
      // refresh token 자체가 잘못된 경우 재로그인
      console.log('🚨 [DEBUG] Refresh token invalid - redirecting to login');
      return 'RELOGIN_NEEDED';
    }
    // 일반 요청에서 INVALID_TOKEN이면 토큰 갱신 시도
    console.log('♻️ [DEBUG] General request INVALID_TOKEN - attempting token refresh');
    return 'TOKEN_REFRESH_NEEDED';
  }

  // 4. 토큰 없거나 인증 안됨 → 로그인 필요
  if (INVALID_TOKEN_ERRORS.includes(codeStr) || codeStr === '2001' || codeNum === 2001) {
    console.log('🚨 [DEBUG] LOGIN_NEEDED detected for code:', codeStr);
    return 'LOGIN_NEEDED';
  }

  // 4. 권한 부족 → 재시도 불필요
  if (PERMISSION_ERRORS.includes(codeStr)) {
    return 'PERMISSION_DENIED';
  }

  // 에러 메시지 패턴으로 폴백 (레거시 지원)
  if (error.message) {
    // 서버 내부 오류 감지
    if (SERVER_ERROR_PATTERNS.some(pattern => error.message.includes(pattern))) {
      return 'SERVER_ERROR';
    }

    // 인증 관련 오류 감지 - Local어 메시지 특별 처리
    if (error.message.includes('Bạn cần đăng nhập để thực hiện hành động này')) {
      console.log('🚨 [DEBUG] Vietnamese auth error detected - redirecting to login');
      return 'LOGIN_NEEDED';
    }

    // 다른 인증 관련 오류 감지
    if (AUTH_ERROR_PATTERNS.some(pattern => error.message.includes(pattern))) {
      return 'TOKEN_REFRESH_NEEDED';
    }
  }

  return null;
};

export const createErrorLink = () => {
  // 재시도 추적을 위한 WeakMap (메모리 누수 방지)
  const retryCount = new WeakMap();

  // 🔒 토큰 갱신 단일 플라이트 (mutex) - 중복 갱신 방지
  let refreshPromise = null;

  return onError(({ graphQLErrors, networkError, operation, forward }) => {
    // GraphQL 에러 처리
    if (graphQLErrors) {
      for (const error of graphQLErrors) {
        // 에러 코드 로깅 (특정 에러는 무시)
        const __raw = error.extensions?.errorCode ?? error.extensions?.code;
        const __code = __raw != null ? String(__raw) : '';
        if (
          __code !== 'STORE_MISMATCH' &&
          __code !== 'DIFFERENT_STORE_ITEMS' &&
          __code !== 'M5004' &&
          __code !== 'M5009' &&
          __code !== 'M5010'
        ) {
          logger.info(`GraphQL Error received:`, {
            code: error.extensions?.code,
            errorCode: error.extensions?.errorCode,
            message: error.message,
            operation: operation.operationName
          });
        }

        const errorType = getErrorType(error);

        if (errorType) {
          logger.info(`Error type detected: ${errorType}`, error.extensions?.code);

          switch (errorType) {
            case 'SILENT_HANDLED':
              // STORE_MISMATCH 등은 UI 모달에서 처리 → 사용자 노출 금지
              return;
            case 'RELOGIN_NEEDED':
              // Refresh Token 만료 - 즉시 로그아웃 및 재로그인 유도
              logger.warn('Refresh token expired, redirecting to login');
              handleTokenExpiry();
              return;

            case 'LOGIN_NEEDED':
              // 토큰 없거나 잘못됨 - 로그인 화면으로
              logger.warn('🚨 LOGIN_NEEDED detected! Error code:', error.extensions?.code);
              logger.warn('🚨 Calling handleTokenExpiry() to redirect to login...');
              handleTokenExpiry();
              logger.warn('🚨 handleTokenExpiry() called successfully');
              return;

            case 'PERMISSION_DENIED':
              // 권한 부족 - 재시도 불필요, 에러 표시만
              logger.warn('Permission denied:', error.message);
              // 에러 메시지 표시 (재시도 없음)
              return;

            case 'SERVER_ERROR':
              // 서버 내부 오류 - 로깅하고 일반 에러로 처리
              logger.error('Server internal error detected:', {
                operation: operation.operationName,
                message: error.message,
                extensions: error.extensions
              });
              // 일반적으로 재시도하지 않고 에러 표시
              return;

            case 'TOKEN_REFRESH_NEEDED':
              // Access Token 만료 - 토큰 재발급 시도 (사용자에게는 완전히 투명하게 처리)

              // 리프레시 뮤테이션 자체는 재시도하지 않음 (무한루프 방지)
              const opName = operation.operationName || '';
              const isSelfRefreshOp =
                /refresh/i.test(opName) ||   // 이름에 refresh가 들어가면 전부 제외 (안전)
                opName === 'mRefreshToken' ||
                opName === 'MRefreshToken' ||
                opName === 'RefreshMyToken';

              if (isSelfRefreshOp) {
                // refresh token 자체가 실패한 경우만 로그아웃 (사용자에게 에러 노출 없음)
                logger.info('[SILENT] Refresh token expired, silent logout');
                handleTokenExpiry();
                return;
              }

              // 재시도 횟수 체크 (무한 루프 방지)
              const currentRetry = retryCount.get(operation) || 0;
              if (currentRetry >= 1) {
                // 토큰 재발급 실패 시에도 사용자에게는 에러 노출하지 않고 로그아웃만 처리
                logger.info('[SILENT] Token refresh failed, silent logout');
                retryCount.delete(operation);
                handleTokenExpiry();
                return;
              }

              // 재시도 횟수 증가
              retryCount.set(operation, currentRetry + 1);

              // 🔒 단일 플라이트 토큰 갱신 (중복 방지) - 사용자에게 완전히 투명
              const getRefreshOnce = () => {
                if (!refreshPromise) {
                  refreshPromise = refreshToken()
                    .then((newToken) => {
                      if (newToken) {
                        logger.info('[SILENT] Token refreshed successfully in background');
                        return newToken;
                      } else {
                        logger.info('[SILENT] Token refresh failed, silent logout');
                        handleTokenExpiry();
                        throw new Error('Silent token refresh failed');
                      }
                    })
                    .catch((err) => {
                      logger.info('[SILENT] Token refresh error, silent logout:', err.message);
                      handleTokenExpiry();
                      throw err;
                    })
                    .finally(() => {
                      // 완료 후 mutex 해제
                      refreshPromise = null;
                    });
                }
                return refreshPromise;
              };

              // 토큰 갱신 시도 - Apollo Client 상태 전체 갱신
              return fromPromise(
                getRefreshOnce().then((newToken) => {
                  if (newToken) {
                    logger.info('[SILENT] Token refreshed successfully, proceeding with original request');
                    // 안전장치: 재시도 요청에 최신 토큰을 직접 주입 (AuthLink 재평가 실패 대비)
                    try {
                      operation.setContext(({ headers = {} }) => ({
                        headers: {
                          ...headers,
                          authorization: `Bearer ${newToken}`,
                          Authorization: `Bearer ${newToken}`
                        }
                      }));
                    } catch (_) {}
                    return true;
                  } else {
                    throw new Error('Token refresh failed');
                  }
                })
              ).flatMap(() => {
                // 원본 요청 재시도 - authLink가 새 토큰으로 헤더를 자동 설정
                // Apollo Cache merge 정책이 덮어쓰기를 자동으로 방지
                return forward(operation);
              });
          }
        }

        // 기타 GraphQL 에러 로깅 (특정 에러는 무시)
        const __raw2 = error.extensions?.errorCode ?? error.extensions?.code;
        const __code2 = __raw2 != null ? String(__raw2) : '';
        if (
          __code2 !== 'STORE_MISMATCH' &&
          __code2 !== 'DIFFERENT_STORE_ITEMS' &&
          __code2 !== 'M5004' &&
          __code2 !== 'M5009' &&
          __code2 !== 'M5010'
        ) {
          logger.error('GraphQL error:', {
            operation: operation.operationName,
            message: error.message,
            code: error.extensions?.code,
            path: error.path
          });
        }
      }
    }

    // 네트워크 에러 처리
    if (networkError) {
      // 🌐 네트워크 연결 에러는 토큰 갱신 시도하지 않음
      if (networkError.message?.includes('ECONNREFUSED') ||
          networkError.message?.includes('ENOTFOUND') ||
          networkError.message?.includes('timeout') ||
          networkError.message?.includes('Connection refused')) {
        logger.warn('Network connectivity issue, skipping token refresh:', {
          operation: operation.operationName,
          message: networkError.message
        });
        return; // 토큰 갱신 시도하지 않음
      }

      // 401/403 에러는 인증 실패로 처리하되, 한 번은 토큰 갱신을 시도 (리버스 프록시 등에서 401 반환하는 환경 대응)
      if (networkError.statusCode === 401 || networkError.statusCode === 403) {
        const opName = operation.operationName || '';
        const isSelfRefreshOp = /refresh/i.test(opName) || opName === 'mRefreshToken' || opName === 'MRefreshToken' || opName === 'RefreshMyToken';

        if (isSelfRefreshOp) {
          logger.info('[SILENT] Refresh operation received 401/403, silent logout');
          handleTokenExpiry();
          return;
        }

        const currentRetry = retryCount.get(operation) || 0;
        if (currentRetry >= 1) {
          logger.info('[SILENT] Network 401/403 after refresh attempt, silent logout');
          retryCount.delete(operation);
          handleTokenExpiry();
          return;
        }
        retryCount.set(operation, currentRetry + 1);

        const getRefreshOnce = () => {
          if (!refreshPromise) {
            refreshPromise = refreshToken()
              .then((newToken) => {
                if (newToken) {
                  logger.info('[SILENT] Token refreshed after network 401/403, retrying original request');
                  return newToken;
                } else {
                  logger.info('[SILENT] Token refresh failed after network 401/403, silent logout');
                  handleTokenExpiry();
                  throw new Error('Silent token refresh failed (network 401/403)');
                }
              })
              .catch((err) => {
                logger.info('[SILENT] Token refresh error after network 401/403, silent logout:', err.message);
                handleTokenExpiry();
                throw err;
              })
              .finally(() => {
                refreshPromise = null;
              });
          }
          return refreshPromise;
        };

        return fromPromise(getRefreshOnce().then((newToken) => {
          if (newToken) {
            try {
              operation.setContext(({ headers = {} }) => ({
                headers: {
                  ...headers,
                  authorization: `Bearer ${newToken}`,
                  Authorization: `Bearer ${newToken}`
                }
              }));
            } catch (_) {}
          }
          return true;
        })).flatMap(() => forward(operation));
      } else {
        logger.error('Network error:', {
          operation: operation.operationName,
          message: networkError.message,
          statusCode: networkError.statusCode
        });
      }
    }
  });
};
