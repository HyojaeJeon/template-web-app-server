/**
 * Admin Client Unified Resolvers
 * Location: /graphql/clients/admin/resolvers.js
 * Purpose: 관리자 클라이언트의 모든 리졸버 통합
 */

// GraphQL-Tools 병합 함수
import { mergeResolvers } from '@graphql-tools/merge';

// 도메인별 리졸버 import
import { adminAuthResolvers } from './auth/resolvers.js';
import { usersResolvers } from './users/resolvers.js';

// ===============================================
// 리졸버 통합
// ===============================================

const allResolvers = [
  adminAuthResolvers,
  usersResolvers,
];

// ===============================================
// 최종 리졸버 병합 및 Export
// ===============================================

const mergedResolvers = mergeResolvers(allResolvers);

// AdminAccount 타입 리졸버 추가
mergedResolvers.AdminAccount = {
  permissions: (adminAccount) => {
    if (!adminAccount.permissions) return [];
    if (Array.isArray(adminAccount.permissions)) return adminAccount.permissions;
    if (typeof adminAccount.permissions === 'string') {
      try {
        const parsed = JSON.parse(adminAccount.permissions);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  }
};

export const adminResolvers = mergedResolvers;
export default mergedResolvers;
