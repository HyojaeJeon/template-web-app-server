/**
 * Mobile Auth Resolvers (Template)
 * Location: /graphql/clients/mobile/auth/resolvers.js
 */

export const mobileAuthResolvers = {
  Query: {
    mHealthCheck: () => ({
      success: true,
      message: 'Mobile API is healthy',
      timestamp: new Date().toISOString(),
    }),
  },
  Mutation: {
    // 추후 인증 뮤테이션 추가
  },
};

export default mobileAuthResolvers;
