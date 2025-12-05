/**
 * Mobile Resolver Utilities (Enhanced)
 * 강화된 모바일 앱 리졸버 유틸리티 - 자동 에러/성공 처리
 */

import { GraphQLError } from 'graphql';
import db from '../../../../models/index.js';
const { sequelize } = db;
import { getMobileError } from '../../../../shared/errorSystem/mobileErrorCodes.js';
import { getMobileSuccess } from '../../../../shared/successSystem/mobileSuccessCodes.js';

/**
 * Enhanced Mobile Auth Wrapper
 * 모든 모바일 리졸버를 위한 강화된 인증 래퍼
 * 
 * 사용법:
 * 1. 성공: return { user } 또는 return { _code: 'MS001', user }
 * 2. 에러: throw new Error('M2005') 또는 throw new Error('M2005:details')
 * 
 * @param {Function} resolverFn - 실행할 리졸버 함수
 * @param {Object} options - 옵션 설정
 * @param {boolean} isMutation - Mutation 여부
 */
export const withMAuth = (resolverFn, options = {}, isMutation = false) => {
  const {
    name = 'MobileResolver',
    requireAuth = true,
    requirePhoneVerified = false,
    requiredFields = [],
    allowGuest = false
  } = options;

  return async (parent, args, context, info) => {
    const startTime = Date.now();
    let transaction = null;

    try {
      // 토큰 만료를 먼저 체크 (context.user가 isExpired 객체인 경우)
      if (context.user?.isExpired === true) {
        console.log('[MobileResolverUtils] Token expired detected');
        throw new Error('M2003'); // ACCESS_TOKEN_EXPIRED
      }

      // 인증 확인 (context.user가 null이거나 유효한 사용자가 아닌 경우)
      // isExpired가 있으면 인증 실패로 처리 (위에서 이미 처리됨)
      // user.id가 없으면 유효한 사용자가 아님
      if (requireAuth && (!context.user || !context.user.id)) {
        // allowGuest가 true인 경우는 인증 실패를 허용
        if (!allowGuest) {
          // Authorization 헤더 확인
          const authorization = context.req?.headers?.authorization;
          if (authorization && authorization.startsWith('Bearer ')) {
            // 토큰은 있지만 인증 실패 = 잘못된 토큰
            console.log('[MobileResolverUtils] Invalid token detected (not expired)');
            throw new Error('M2002'); // INVALID_TOKEN
          }
          // 토큰이 없음 = 인증 필요
          throw new Error('M2001'); // UNAUTHENTICATED
        }
      }

      if (requireAuth && context.user && requirePhoneVerified && !context.user.phoneVerified) {
        throw new Error('M2012'); // PHONE_NOT_VERIFIED
      }

      // 필수 필드 검증
      if (requiredFields.length > 0) {
        // input 객체가 있으면 input 내부 필드 검증, 없으면 최상위 args 필드 검증
        const targetObject = args.input || args;

        for (const field of requiredFields) {
          const value = targetObject[field];

          // 값이 없거나 빈 문자열인 경우 에러
          if (value === undefined || value === null || value === '') {
            console.log(`[${name}] Missing required field: ${field}`);
            throw new Error('M1006'); // MISSING_REQUIRED_FIELD
          }
        }
      }

      // Mutation인 경우 트랜잭션 시작
      if (isMutation) {
        transaction = await sequelize.transaction();
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

      // null/undefined 처리 - GraphQL Non-nullable 필드 안전성
      if (result == null) {
        console.warn(`[${name}] Resolver returned null - this may cause GraphQL errors for non-nullable fields`);
        return null; // 명시적으로 null 반환 (스키마가 nullable인 경우만)
      }

      // 배열인 경우 직접 반환 (GraphQL 스키마 타입 일치)
      if (Array.isArray(result)) {
        return result;
      }

      // Boolean은 그대로 반환 (GraphQL Boolean! 타입 대응)
      if (typeof result === 'boolean') {
        return result;
      }

      // 숫자와 문자열은 data로 래핑
      if (typeof result !== 'object') {
        return { success: true, data: result };
      }
      
      // _code가 있으면 성공 코드 처리
      if (result._code) {
        const success = getMobileSuccess(result._code, context.language || 'vi');
        return {
          _code: result._code,  // _code 필드 유지
          success: true,
          message: success.message,
          code: success.key,
          ...result  // 모든 필드 포함 (_code 포함)
        };
      }
      
      // 이미 success 필드가 있으면 그대로 반환 (backward compatibility)
      if ('success' in result) {
        return result;
      }
      
      // 기본 성공 응답 (자동 래핑)
      return {
        success: true,
        ...result
      };

    } catch (error) {
      // 트랜잭션 롤백
      if (transaction) {
        await transaction.rollback();
      }

      // ===============================================
      // 자동 에러 처리
      // ===============================================

      // M으로 시작하는 에러 코드 자동 변환
      if (error.message && /^M\d{4}/.test(error.message)) {
        const [code, ...extra] = error.message.split(':');
        const mobileError = getMobileError(code, context.language || 'vi');

        // mobileError.key는 '[M5009]STORE_MISMATCH' 형식이므로
        // 클라이언트가 인식할 수 있도록 키 부분만 추출
        const keyParts = mobileError.key.split(']');
        const errorKey = keyParts.length > 1 ? keyParts[1] : mobileError.key;

        throw new GraphQLError(mobileError.message, {
          extensions: {
            code: errorKey,  // 'TOKEN_EXPIRED' 형식으로 전달
            errorCode: code,  // 원본 에러 코드 (M2003) 참고용
            details: extra.join(':') || undefined
          }
        });
      }
      
      // 이미 GraphQLError인 경우 그대로 throw
      if (error instanceof GraphQLError) {
        throw error;
      }
      
      // 일반 에러는 시스템 에러로 변환
      const systemError = getMobileError('M1001', context.language || 'vi');
      console.error(`[${name}] Unexpected error:`, error);

      // systemError.key는 '[M1001]SYSTEM_ERROR' 형식이므로 파싱
      const keyParts = systemError.key.split(']');
      const errorKey = keyParts.length > 1 ? keyParts[1] : systemError.key;

      throw new GraphQLError(error.message || systemError.message, {
        extensions: {
          code: errorKey,
          errorCode: 'M1001',
          originalError: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  };
};

// 페이지네이션 헬퍼 (유지)
export const parsePagination = (args) => ({
  limit: Math.min(args.limit || 20, 100),
  offset: args.offset || 0
});

export default {
  withMAuth,
  parsePagination
};