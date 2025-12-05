/**
 * Web Client Unified Resolvers
 * Location: /graphql/clients/web/resolvers.js
 * Purpose: Web 클라이언트의 모든 리졸버 통합
 */

// GraphQL-Tools 병합 함수
import { mergeResolvers } from '@graphql-tools/merge';

// 도메인별 리졸버 import
import sAuthResolvers from './auth/resolvers.js';

// ===============================================
// 리졸버 통합
// ===============================================

const allResolvers = [
  sAuthResolvers,
];

// ===============================================
// 최종 리졸버 병합 및 Export
// ===============================================

const mergedResolvers = mergeResolvers(allResolvers);

export default mergedResolvers;
