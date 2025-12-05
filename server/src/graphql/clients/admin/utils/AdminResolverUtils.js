/**
 * Admin Resolver Utilities (Enhanced)
 * 강화된 슈퍼관리자 리졸버 유틸리티 - 자동 에러/성공 처리
 */

import { GraphQLError } from 'graphql';
import db from '../../../../models/index.js';
import { getAdminError, createAdminError } from '../../../../shared/errorSystem/adminErrorCodes.js';
import { getAdminSuccess } from '../../../../shared/successSystem/adminSuccessCodes.js';

// Admin Roles (Sequelize AdminAccount.role ENUM과 100% 일치)
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  VIEWER: 'VIEWER'
};

/**
 * Enhanced Admin Auth Wrapper
 * 모든 슈퍼관리자 리졸버를 위한 강화된 인증 래퍼
 *
 * 사용법:
 * 1. 성공: return { store } 또는 return { _code: 'AS301', store }
 * 2. 에러: throw new Error('A2001') 또는 throw new Error('A2001:details')
 *
 * @param {Function} resolverFn - 실행할 리졸버 함수
 * @param {Object} options - 옵션 설정
 * @param {boolean} isMutation - Mutation 여부
 */
export const withAAuth = (resolverFn, options = {}, isMutation = false) => {
  const {
    name = 'AdminResolver',
    requireAuth = true,
    roles = [], // 허용 역할 (예: ['SUPER_ADMIN', 'ADMIN'])
    permissions = [], // 필요 권한 (예: ['MANAGE_STORES'])
    requiredFields = [], // 필수 입력 필드
    customCheck = null
  } = options;

  return async (parent, args, context, info) => {
    const startTime = Date.now();
    let transaction = null;

    try {
      // 인증 확인
      if (requireAuth) {
        if (!context.adminAccount) {
          throw new Error('A2001'); // UNAUTHENTICATED
        }

        // 토큰 만료 확인 - 최우선 검증
        if (
          context.adminAccount.isExpired ||
          context.adminAccount.error === 'TOKEN_EXPIRED' ||
          context.adminAccount.error === 'ACCESS_TOKEN_EXPIRED'
        ) {
          console.log('[withAAuth] 🔴 Token expired detected:', context.adminAccount);
          throw new Error('A2003'); // TOKEN_EXPIRED
        }

        // 계정 상태 확인
        if (context.adminAccount.status === 'SUSPENDED') {
          throw new Error('A2004'); // ACCOUNT_SUSPENDED
        }

        if (context.adminAccount.status === 'TERMINATED') {
          throw new Error('A2005'); // ACCOUNT_TERMINATED
        }

        // 역할 확인
        if (roles.length > 0) {
          const hasRole = roles.includes(context.adminAccount.role);
          if (!hasRole) {
            console.log(`[withAAuth] ❌ 역할 부족: ${context.adminAccount.role}은(는) ${roles.join(', ')}에 포함되지 않음`);
            throw new Error('A2002'); // UNAUTHORIZED
          }
        }

        // 권한 확인 (SUPER_ADMIN은 모든 권한 자동 부여)
        if (permissions.length > 0) {
          const { role } = context.adminAccount;

          // SUPER_ADMIN은 모든 권한 보유
          if (role !== 'SUPER_ADMIN') {
            const adminPermissions = context.adminAccount.permissions || [];

            // 역할별 기본 권한
            const rolePermissions = {
              ADMIN: [
                'VIEW_STORES', 'VIEW_USERS', 'VIEW_ORDERS', 'VIEW_ANALYTICS',
                'MANAGE_STORES', 'MANAGE_USERS', 'MANAGE_ORDERS'
              ],
              VIEWER: [
                'VIEW_STORES', 'VIEW_USERS', 'VIEW_ORDERS', 'VIEW_ANALYTICS'
              ]
            };

            const defaultPermissions = rolePermissions[role] || [];
            const allPermissions = [...new Set([...defaultPermissions, ...adminPermissions])];

            // 모든 요구 권한 체크
            for (const permission of permissions) {
              if (!allPermissions.includes(permission)) {
                console.log(`[withAAuth] ❌ 권한 부족: ${role}(${name})에게 ${permission} 권한 없음`);
                throw new Error('A2009'); // INSUFFICIENT_PERMISSIONS
              }
            }

            console.log(`[withAAuth] ✅ 권한 체크 통과: ${name} - ${permissions.join(', ')}`);
          } else {
            console.log(`[withAAuth] ✅ SUPER_ADMIN - 모든 권한 자동 부여`);
          }
        }

        // 커스텀 권한 체크
        if (customCheck && !customCheck(context, args)) {
          throw new Error('A2002'); // UNAUTHORIZED
        }
      }

      // 필수 필드 검증
      if (requiredFields.length > 0) {
        const dataSource = args.input || args;

        for (const field of requiredFields) {
          if (!dataSource[field]) {
            console.error(`[withAAuth] ❌ 필수 필드 누락: ${field}`, {
              providedFields: Object.keys(dataSource),
              requiredFields
            });
            throw new Error('A1006'); // MISSING_REQUIRED_FIELD
          }
        }
      }

      // Mutation인 경우 트랜잭션 시작
      if (isMutation) {
        transaction = await db.sequelize.transaction();
        context.transaction = transaction;
      }

      // 실제 리졸버 실행
      const result = await resolverFn(parent, args, context, info);

      // 트랜잭션 커밋
      if (transaction) {
        await transaction.commit();
      }

      // 개발 환경 로깅
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${isMutation ? 'Mutation' : 'Query'}] ${name} completed in ${Date.now() - startTime}ms`);
      }

      // ===============================================
      // 자동 응답 처리
      // ===============================================

      // null/undefined 처리
      if (result == null) {
        console.warn(`[${name}] Resolver returned null - this may cause GraphQL errors for non-nullable fields`);
        return null;
      }

      // 배열인 경우 직접 반환
      if (Array.isArray(result)) {
        return result;
      }

      // 원시 타입은 그대로 반환
      if (typeof result !== 'object') {
        return result;
      }

      // _code가 있으면 성공 코드 처리
      if (result._code) {
        const success = getAdminSuccess(result._code, context.language || 'vi');
        return {
          success: true,
          message: success.message,
          ...result
        };
      }

      // 일반 객체 반환
      return result;

    } catch (error) {
      // 트랜잭션 롤백
      if (transaction) {
        await transaction.rollback();
      }

      // 개발 환경 에러 로깅
      if (process.env.NODE_ENV === 'development') {
        console.error(`[${name}] Error:`, error.message);
      }

      // ===============================================
      // 자동 에러 처리
      // ===============================================

      // 에러 코드 파싱 (예: 'A2001' 또는 'A2001:details')
      const errorCode = error.message?.split(':')[0];
      const errorDetails = error.message?.includes(':')
        ? error.message.split(':').slice(1).join(':')
        : null;

      // Admin 에러 코드 형식인지 확인 (A + 숫자)
      if (/^A\d{4}$/.test(errorCode)) {
        const errorInfo = getAdminError(errorCode, context.language || 'vi');
        const errorMessage = errorDetails || errorInfo.message;

        throw new GraphQLError(errorMessage, {
          extensions: {
            code: `[${errorCode}]${errorInfo.key}`,
            timestamp: new Date().toISOString()
          }
        });
      }

      // 일반 에러는 그대로 전달
      throw error;
    }
  };
};

/**
 * Admin 권한 체크 헬퍼
 * @param {Object} adminAccount - 관리자 계정 객체
 * @param {string} permission - 체크할 권한
 * @returns {boolean}
 */
export const hasAdminPermission = (adminAccount, permission) => {
  if (!adminAccount) return false;

  // SUPER_ADMIN은 모든 권한 보유
  if (adminAccount.role === 'SUPER_ADMIN') return true;

  const adminPermissions = adminAccount.permissions || [];

  // 역할별 기본 권한
  const rolePermissions = {
    ADMIN: [
      'VIEW_STORES', 'VIEW_USERS', 'VIEW_ORDERS', 'VIEW_ANALYTICS',
      'MANAGE_STORES', 'MANAGE_USERS', 'MANAGE_ORDERS'
    ],
    VIEWER: [
      'VIEW_STORES', 'VIEW_USERS', 'VIEW_ORDERS', 'VIEW_ANALYTICS'
    ]
  };

  const defaultPermissions = rolePermissions[adminAccount.role] || [];
  const allPermissions = [...new Set([...defaultPermissions, ...adminPermissions])];

  return allPermissions.includes(permission);
};

/**
 * SUPER_ADMIN 전용 권한 체크
 * @param {Object} context - GraphQL context
 * @throws {Error} SUPER_ADMIN이 아닌 경우 에러
 */
export const requireSuperAdmin = (context) => {
  if (!context.adminAccount) {
    throw new Error('A2001'); // UNAUTHENTICATED
  }

  if (context.adminAccount.role !== 'SUPER_ADMIN') {
    throw new Error('A2002'); // UNAUTHORIZED
  }
};

export default withAAuth;
