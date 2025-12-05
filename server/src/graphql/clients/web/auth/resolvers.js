/**
 * Web Auth Resolvers (Template)
 * Location: /graphql/clients/web/auth/resolvers.js
 */

export const webAuthResolvers = {
  Query: {
    sHealthCheck: () => ({
      success: true,
      message: 'Web API is healthy',
      timestamp: new Date().toISOString(),
    }),
  },
  Mutation: {
    // 추후 인증 뮤테이션 추가
  },
};

export default webAuthResolvers;
