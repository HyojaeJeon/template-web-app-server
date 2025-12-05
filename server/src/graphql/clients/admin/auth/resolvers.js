/**
 * Admin Auth Resolvers (Template)
 * Location: /graphql/clients/admin/auth/resolvers.js
 */

export const adminAuthResolvers = {
  Query: {
    aHealthCheck: () => ({
      success: true,
      message: 'Admin API is healthy',
      timestamp: new Date().toISOString(),
    }),
  },
  Mutation: {
    // 추후 인증 뮤테이션 추가
  },
};

export default adminAuthResolvers;
