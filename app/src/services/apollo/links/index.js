/**
 * Apollo Links 통합 모듈
 * 모든 링크를 조합하여 최종 링크 체인 생성
 */

import { from } from '@apollo/client';
import { createAuthLink } from '@services/apollo/links/authLink';
import { createErrorLink } from '@services/apollo/links/errorLink';
import { createHttpLink } from '@services/apollo/links/httpLink';

/**
 * Apollo Link 체인 생성
 * 순서: Error → Auth → HTTP
 *
 * 이유:
 * - ErrorLink가 먼저 위치해야, 토큰 만료 시 refresh 후 forward(operation) 시
 *   AuthLink를 다시 거쳐 최신 토큰으로 Authorization 헤더가 갱신됩니다.
 */
export const createApolloLinks = () => {
  const errorLink = createErrorLink();
  const authLink = createAuthLink();
  const httpLink = createHttpLink();

  // 링크 체인 조합
  const chain = from([
    errorLink,  // 에러 처리 및 토큰 갱신 (가장 앞에 배치)
    authLink,   // 토큰 및 헤더 설정
    httpLink    // HTTP 요청 실행
  ]);

  if (__DEV__) {
    // 실행 시점에 링크 순서를 명시적으로 로깅하여 디버깅 편의 제공
    // 반드시 Error → Auth → HTTP 순으로 구성되어야 함
    console.log('[ApolloLinks] Chain order = Error → Auth → HTTP');
  }

  return chain;
};

export { createAuthLink } from '@services/apollo/links/authLink';
export { createErrorLink } from '@services/apollo/links/errorLink';
export { createHttpLink } from '@services/apollo/links/httpLink';
