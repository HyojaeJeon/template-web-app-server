/**
 * Store Test Resolvers
 * Location: /graphql/clients/store/testResolvers.js
 * Purpose: Store 클라이언트 테스트용 리졸버
 * Date: 2025-09-17
 */

import { withSAuth } from './utils/StoreResolverUtils.js';

// Store 테스트 리졸버
const testResolvers = {
  Query: {
    // 공개 헬스체크
    health: () => 'Store GraphQL Server is healthy and running!',

    // Store 공개 테스트
    sTestPublic: withSAuth(async () => ({
      message: 'Store public test endpoint working',
      timestamp: new Date().toISOString(),
      client: 'store'
    }), {
      name: 'sTestPublic',
      requireAuth: false,
      allowGuest: true
    }),

    // Store 인증 테스트
    sTestAuth: withSAuth(async (_, __, context) => ({
      message: 'Store authenticated test endpoint working',
      timestamp: new Date().toISOString(),
      client: 'store',
      storeId: context.storeAccount?.id,
      userId: context.user?.id
    }), {
      name: 'sTestAuth',
      requireAuth: true
    }),

    // Store 데이터베이스 연결 테스트
    sTestDatabase: withSAuth(async () => {
      try {
        // 간단한 DB 쿼리로 연결 확인
        const result = await db.sequelize.query('SELECT 1+1 AS result');
        return {
          message: 'Store database connection successful',
          timestamp: new Date().toISOString(),
          result: result[0][0].result
        };
      } catch (error) {
        throw new Error('S1001'); // SYSTEM_ERROR
      }
    }, {
      name: 'sTestDatabase',
      requireAuth: false
    })
  },

  Mutation: {
    // Store 테스트 뮤테이션
    sTestMutation: withSAuth(async (_, { input }) => ({
      message: `Store test mutation executed with: ${input.testData}`,
      timestamp: new Date().toISOString(),
      client: 'store',
      receivedData: input.testData
    }), {
      name: 'sTestMutation',
      requireAuth: false
    }, true) // isMutation = true
  }
};

export default testResolvers;