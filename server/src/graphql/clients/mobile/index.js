/**
 * Mobile Client GraphQL Entry Point
 * Location: /graphql/clients/mobile/index.js
 * Purpose: 모바일 클라이언트 GraphQL 진입점
 * Date: 2025-01-12
 */

// 스키마와 리졸버 import
import { typeDefs } from './schema.js';
import resolvers from './resolvers.js';

// ===============================================
// Export for Apollo Server
// ===============================================

// Named exports
export { typeDefs, resolvers };

// Default export (Apollo Server v4 호환)
export default {
  typeDefs,
  resolvers
};

// Mobile GraphQL 모듈 로드 완료