/**
 * Apollo Client 연결 테스트
 * Web 서버와의 GraphQL 연결 확인
 */

import { apolloClient } from './apolloClient.ts';
import { S_GET_PROFILE } from '../gql/queries/auth.js';
import { gql } from '../gql/gqlSetup.js';

export const testApolloConnection = async () => {
  console.log('🧪 Apollo Client 연결 테스트 시작...');

  try {
    // 1. 기본 연결 테스트 (헬스 체크)
    console.log('1️⃣ 기본 연결 테스트...');
    const healthResult = await apolloClient.query({
      query: gql`
        query TestConnection {
          health
        }
      `,
      errorPolicy: 'all',
      fetchPolicy: 'network-only',
    });

    console.log('✅ 서버 연결 성공:', healthResult.data);

    // 2. Web 인증 쿼리 테스트 (토큰 없이)
    console.log('2️⃣ 인증 쿼리 테스트 (토큰 없음)...');
    const profileResult = await apolloClient.query({
      query: S_GET_PROFILE,
      errorPolicy: 'all',
      fetchPolicy: 'network-only',
    });

    if (profileResult.errors) {
      console.log('🔒 예상된 인증 에러:', profileResult.errors[0].message);
    }

    // 3. Apollo 캐시 상태 확인
    console.log('3️⃣ Apollo 캐시 상태 확인...');
    const cacheState = apolloClient.cache.extract();
    console.log('📊 캐시 크기:', Object.keys(cacheState).length);

    // 4. 네트워크 상태 확인
    console.log('4️⃣ 네트워크 상태 확인...');
    console.log('🌐 Apollo Client 설정:');
    console.log('  - URI:', process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT);
    console.log('  - DevTools:', process.env.NODE_ENV === 'development');

    return {
      success: true,
      healthCheck: !!healthResult.data?.health,
      authError: !!profileResult.errors,
      cacheSize: Object.keys(cacheState).length,
    };

  } catch (error) {
    console.error('❌ Apollo Client 연결 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// 토큰 관리 테스트
export const testTokenManager = () => {
  console.log('🔑 토큰 관리자 테스트 시작...');

  try {
    const { tokenManager } = require('./apolloClient.ts');

    // 1. 토큰 설정 테스트
    const testAccessToken = 'test.access.token';
    const testRefreshToken = 'test.refresh.token';

    tokenManager.setTokens(testAccessToken, testRefreshToken);
    console.log('✅ 토큰 설정 완료');

    // 2. 토큰 조회 테스트
    const retrievedAccess = tokenManager.getAccessToken();
    const retrievedRefresh = tokenManager.getRefreshToken();

    console.log('📖 토큰 조회 결과:');
    console.log('  - Access Token:', retrievedAccess === testAccessToken ? '✅ 일치' : '❌ 불일치');
    console.log('  - Refresh Token:', retrievedRefresh === testRefreshToken ? '✅ 일치' : '❌ 불일치');

    // 3. 토큰 만료 검사 테스트
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ';
    const isExpired = tokenManager.isTokenExpired(expiredToken);
    console.log('⏰ 만료된 토큰 검사:', isExpired ? '✅ 만료됨' : '❌ 유효함');

    // 4. 토큰 정리 테스트
    tokenManager.clearTokens();
    const clearedAccess = tokenManager.getAccessToken();
    const clearedRefresh = tokenManager.getRefreshToken();

    console.log('🧹 토큰 정리 결과:');
    console.log('  - Access Token:', clearedAccess === null ? '✅ 정리됨' : '❌ 남아있음');
    console.log('  - Refresh Token:', clearedRefresh === null ? '✅ 정리됨' : '❌ 남아있음');

    return {
      success: true,
      tokenSetRetrieve: retrievedAccess === testAccessToken && retrievedRefresh === testRefreshToken,
      tokenExpiry: isExpired,
      tokenClearing: clearedAccess === null && clearedRefresh === null,
    };

  } catch (error) {
    console.error('❌ 토큰 관리자 테스트 실패:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// 전체 테스트 실행
export const runAllTests = async () => {
  console.log('🚀 Web Apollo Client 전체 테스트 시작...\n');

  // 1. 토큰 관리자 테스트
  const tokenResults = testTokenManager();
  console.log('\n📋 토큰 관리자 테스트 결과:', tokenResults.success ? '✅ 성공' : '❌ 실패');

  // 2. Apollo 연결 테스트
  const apolloResults = await testApolloConnection();
  console.log('\n📋 Apollo 연결 테스트 결과:', apolloResults.success ? '✅ 성공' : '❌ 실패');

  const overallSuccess = tokenResults.success && apolloResults.success;

  console.log('\n🎯 전체 테스트 결과:');
  console.log('  - 토큰 관리:', tokenResults.success ? '✅' : '❌');
  console.log('  - Apollo 연결:', apolloResults.success ? '✅' : '❌');
  console.log('  - 서버 연결:', apolloResults.healthCheck ? '✅' : '❌');
  console.log('  - 인증 시스템:', apolloResults.authError ? '✅' : '❌');
  console.log(`\n${overallSuccess ? '🎉 모든 테스트 통과!' : '⚠️ 일부 테스트 실패'}`);

  return {
    success: overallSuccess,
    token: tokenResults,
    apollo: apolloResults,
  };
};

// 즉시 실행 (개발 환경에서만)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // 브라우저에서 수동 실행 가능하도록 전역 함수로 등록
  window.testWebApollo = runAllTests;
  console.log('💡 브라우저 콘솔에서 window.testWebApollo() 실행하여 테스트할 수 있습니다.');
}