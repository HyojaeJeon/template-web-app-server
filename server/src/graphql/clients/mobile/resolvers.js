/**
 * Mobile Client Unified Resolvers
 * Location: /graphql/clients/mobile/resolvers.js
 * Purpose: 모바일 클라이언트의 모든 리졸버 통합
 */

// GraphQL-Tools 병합 함수
import { mergeResolvers } from '@graphql-tools/merge';

// 도메인별 리졸버 import
import mAuthResolvers from './auth/resolvers.js';

// ===============================================
// 리졸버 통합
// ===============================================

const allResolvers = [
  mAuthResolvers,
];

// ===============================================
// 최종 리졸버 병합 및 Export
// ===============================================

const mergedResolvers = mergeResolvers(allResolvers);

export default mergedResolvers;