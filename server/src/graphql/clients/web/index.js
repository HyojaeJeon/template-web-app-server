/**
 * Web Client GraphQL Entry Point
 * Location: /graphql/clients/web/index.js
 * Purpose: Web 클라이언트 GraphQL 진입점
 * Date: 2025-01-16
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

// Web GraphQL 모듈 로드 완료