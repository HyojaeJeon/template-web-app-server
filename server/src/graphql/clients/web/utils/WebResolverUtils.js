/**
 * Web Resolver Utilities (Enhanced)
 * 강화된 웹 클라이언트 리졸버 유틸리티 - 자동 에러/성공 처리
 */

import { GraphQLError } from 'graphql';
import db from '../../../../models/index.js';
import { getWebError } from '../../../../shared/errorSystem/webErrorCodes.js';
import { getWebSuccess } from '../../../../shared/successSystem/webSuccessCodes.js';
import { getRequiredPermissions } from '../../../../shared/config/resolverPermissions.js';

// Store Roles (Sequelize StoreAccount.role ENUM과 100% 일치)
export const STORE_ROLES = {
  STORE_OWNER: 'STORE_OWNER',
  FRANCHISE_OWNER: 'FRANCHISE_OWNER',
  STORE_MANAGER: 'STORE_MANAGER',
  CHEF: 'CHEF',
  CASHIER: 'CASHIER',
  DELIVERY_MANAGER: 'DELIVERY_MANAGER'
};

/**
 * Local 시간대 처리 유틸리티 (UTC+7)
 * Local 호치민/하노이 표준 시간대 지원
 */
export const VietnamTimeUtils = {
  /**
   * 현재 Local 시간 가져오기
   * @returns {Date} Local 현지 시간
   */
  getNow: () => {
    const now = new Date();
    const vietnamOffset = 7 * 60; // UTC+7 (분 단위)
    const localOffset = now.getTimezoneOffset(); // 로컬 오프셋 (분 단위)
    return new Date(now.getTime() + (vietnamOffset + localOffset) * 60000);
  },

  /**
   * UTC 시간을 Local 시간으로 변환
   * @param {Date} utcDate - UTC 시간
   * @returns {Date} Local 시간
   */
  toVietnamTime: (utcDate) => {
    if (!utcDate) return null;
    const date = new Date(utcDate);
    const vietnamOffset = 7 * 60;
    const localOffset = date.getTimezoneOffset();
    return new Date(date.getTime() + (vietnamOffset + localOffset) * 60000);
  },

  /**
   * Local 시간을 UTC로 변환
   * @param {Date} vnDate - Local 시간
   * @returns {Date} UTC 시간
   */
  toUTC: (vnDate) => {
    if (!vnDate) return null;
    const date = new Date(vnDate);
    const vietnamOffset = 7 * 60;
    return new Date(date.getTime() - vietnamOffset * 60000);
  },

  /**
   * 영업시간 체크 (Local 시간 기준)
   * @param {Object} store - 매장 객체
   * @param {Date} checkTime - 확인할 시간 (옵션)
   * @returns {boolean} 영업 중 여부
   *
   * 지원하는 openingHours 형식:
   * 1. 단일 슬롯: { monday: { open: "09:00", close: "21:00" } }
   * 2. 다중 슬롯 (배열): { monday: [{ open: "09:00", close: "12:00" }, { open: "14:00", close: "21:00" }] }
   */
  isStoreOpen: (store, checkTime = null) => {
    const vnTime = checkTime ? VietnamTimeUtils.toVietnamTime(checkTime) : VietnamTimeUtils.getNow();
    const dayOfWeek = vnTime.getDay();
    const currentHour = vnTime.getHours();
    const currentMinute = vnTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // openingHours가 없으면 항상 영업 중으로 간주 (데이터 없는 매장 허용)
    if (!store.openingHours) return true;

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todaySchedule = store.openingHours[days[dayOfWeek]];

    // 오늘 스케줄이 없으면 휴무
    if (!todaySchedule) {
      return false;
    }

    // 다중 슬롯 지원: 배열이면 배열 사용, 아니면 단일 슬롯을 배열로 변환
    const slots = Array.isArray(todaySchedule) ? todaySchedule : [todaySchedule];

    // 어떤 슬롯이라도 현재 시간을 포함하면 영업 중
    return slots.some(slot => {
      // 슬롯 유효성 검사
      if (!slot || !slot.open || !slot.close) {
        return false;
      }

      const [openHour, openMin] = slot.open.split(':').map(Number);
      const [closeHour, closeMin] = slot.close.split(':').map(Number);

      if (isNaN(openHour) || isNaN(openMin) || isNaN(closeHour) || isNaN(closeMin)) {
        return false;
      }

      const openTimeInMinutes = openHour * 60 + openMin;
      const closeTimeInMinutes = closeHour * 60 + closeMin;

      // 자정을 넘어가는 경우 처리 (예: 22:00 ~ 02:00)
      if (closeTimeInMinutes < openTimeInMinutes) {
        return currentTimeInMinutes >= openTimeInMinutes || currentTimeInMinutes < closeTimeInMinutes;
      }

      return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
    });
  },

  /**
   * Local 시간 포맷팅 (YYYY-MM-DD HH:mm:ss)
   * @param {Date} date - 포맷할 날짜
   * @returns {string} 포맷된 문자열
   */
  format: (date) => {
    if (!date) return null;
    const vnTime = VietnamTimeUtils.toVietnamTime(date);
    const year = vnTime.getFullYear();
    const month = String(vnTime.getMonth() + 1).padStart(2, '0');
    const day = String(vnTime.getDate()).padStart(2, '0');
    const hour = String(vnTime.getHours()).padStart(2, '0');
    const minute = String(vnTime.getMinutes()).padStart(2, '0');
    const second = String(vnTime.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  },

  /**
   * 오늘의 시작과 끝 시간 (Local 시간 기준)
   * @returns {Object} { start: Date, end: Date }
   */
  getTodayRange: () => {
    const vnNow = VietnamTimeUtils.getNow();
    const start = new Date(vnNow);
    start.setHours(0, 0, 0, 0);
    const end = new Date(vnNow);
    end.setHours(23, 59, 59, 999);

    return {
      start: VietnamTimeUtils.toUTC(start),
      end: VietnamTimeUtils.toUTC(end)
    };
  }
};

/**
 * Enhanced Web Auth Wrapper
 * 모든 웹 클라이언트 리졸버를 위한 강화된 인증 래퍼
 *
 * 사용법:
 * 1. 성공: return { store } 또는 return { _code: 'SS001', store }
 * 2. 에러: throw new Error('S2005') 또는 throw new Error('S2005:details')
 *
 * @param {Function} resolverFn - 실행할 리졸버 함수
 * @param {Object} options - 옵션 설정
 * @param {boolean} isMutation - Mutation 여부
 */
export const withWebAuth = (resolverFn, options = {}, isMutation = false) => {
  const {
    name = 'WebResolver',
    requireAuth = true,
    roles = [],
    permissions = [],
    checkStoreOwnership = true,
    checkStoreId = true,
    requiredFields = [],
    customCheck = null
  } = options;

  return async (parent, args, context, info) => {
    const startTime = Date.now();
    let transaction = null;

    try {
      // 인증 확인
      if (requireAuth) {
        if (!context.storeAccount) {
          throw new Error('S2001'); // UNAUTHENTICATED
        }

        // ⚡ 토큰 만료 확인 - 최우선 검증!
        // AuthMiddleware가 만료된 토큰에 대해 { isExpired: true, error: 'TOKEN_EXPIRED' } 반환
        // 이 경우 storeId, role 등 다른 필드가 없으므로 만료 체크를 최우선으로 수행
        if (
          context.storeAccount.isExpired ||
          context.storeAccount.error === 'TOKEN_EXPIRED' ||
          context.storeAccount.error === 'ACCESS_TOKEN_EXPIRED'
        ) {
          console.log('[withSAuth] 🔴 Token expired detected:', context.storeAccount);
          throw new Error('S2003'); // TOKEN_EXPIRED
        }

        // 역할 확인
        if (roles.length > 0) {
          const hasRole = roles.includes(context.storeAccount.role);
          if (!hasRole) {
            throw new Error('S2002'); // UNAUTHORIZED
          }
        }

        // 권한 확인 (자동 매핑 + 세밀한 권한 체크)
        let requiredPermissions = permissions; // 명시적 권한 우선

        // 명시적 권한이 없으면 리졸버 이름에서 자동 조회
        if (requiredPermissions.length === 0) {
          requiredPermissions = getRequiredPermissions(name);
        }

        // 권한 체크 필요 시
        if (requiredPermissions.length > 0) {
          // 1. JWT 토큰의 permissions 먼저 체크 (성능 최적화)
          const tokenPermissions = context.storeAccount.permissions || [];
          const { role } = context.storeAccount;

          // 2. 역할 기본 권한 정의 (StoreAccount.hasPermission()과 100% 동일)
          const rolePermissions = {
            FRANCHISE_OWNER: [
              'MANAGE_STORE_INFO', 'MANAGE_BUSINESS_HOURS', 'MANAGE_DELIVERY_SETTINGS',
              'CREATE_MENU_ITEM', 'UPDATE_MENU_ITEM', 'DELETE_MENU_ITEM', 'MANAGE_MENU_CATEGORIES',
              'VIEW_ORDERS', 'MANAGE_ORDERS', 'PROCESS_REFUNDS',
              'INVITE_STAFF', 'MANAGE_STAFF_ROLES',
              'VIEW_REVENUE', 'VIEW_REPORTS', 'MANAGE_PROMOTIONS',
              'MANAGE_POS_SETTINGS', 'MANAGE_BANK_ACCOUNT',
              'MANAGE_MULTIPLE_STORES', 'VIEW_FRANCHISE_REPORTS', 'MANAGE_FRANCHISE_SETTINGS'
            ],
            STORE_OWNER: [
              'MANAGE_STORE_INFO', 'MANAGE_BUSINESS_HOURS', 'MANAGE_DELIVERY_SETTINGS',
              'CREATE_MENU_ITEM', 'UPDATE_MENU_ITEM', 'DELETE_MENU_ITEM', 'MANAGE_MENU_CATEGORIES',
              'VIEW_ORDERS', 'MANAGE_ORDERS', 'PROCESS_REFUNDS',
              'INVITE_STAFF', 'MANAGE_STAFF_ROLES',
              'VIEW_REVENUE', 'VIEW_REPORTS', 'MANAGE_PROMOTIONS',
              'MANAGE_POS_SETTINGS', 'MANAGE_BANK_ACCOUNT'
            ],
            STORE_MANAGER: [
              'UPDATE_MENU_ITEM', 'MANAGE_MENU_AVAILABILITY',
              'VIEW_ORDERS', 'MANAGE_ORDERS', 'PROCESS_REFUNDS',
              'VIEW_REVENUE', 'USE_POS', 'MANAGE_STAFF_SCHEDULE'
            ],
            CHEF: [
              'VIEW_ORDERS', 'MANAGE_ORDERS', 'USE_POS', 'UPDATE_MENU_AVAILABILITY'
            ],
            CASHIER: [
              'VIEW_ORDERS', 'USE_POS', 'VIEW_POS_REPORTS', 'PROCESS_PAYMENTS'
            ],
            DELIVERY_MANAGER: [
              'VIEW_ORDERS', 'MANAGE_DELIVERIES', 'ASSIGN_DRIVERS', 'VIEW_DELIVERY_REPORTS'
            ]
          };

          const defaultPermissions = rolePermissions[role] || [];
          const allPermissions = [...new Set([...defaultPermissions, ...tokenPermissions])];

          // 3. 모든 요구 권한 체크
          for (const permission of requiredPermissions) {
            if (!allPermissions.includes(permission)) {
              console.log(`[withSAuth] ❌ 권한 부족: ${role}(${name})에게 ${permission} 권한 없음`);
              throw new Error('S2002'); // UNAUTHORIZED
            }
          }

          console.log(`[withSAuth] ✅ 권한 체크 통과: ${name} - ${requiredPermissions.join(', ')}`);
        }

        // 매장 소유권 확인
        if (checkStoreOwnership && args.storeAccountId) {
          if (context.storeAccount.id !== args.storeAccountId) {
            throw new Error('S2002'); // UNAUTHORIZED
          }
        }

        // 매장 ID 확인
        if (checkStoreId) {
          // ⚡ context.storeAccount.storeId가 없으면 에러 (토큰에 storeId 필수)
          if (!context.storeAccount?.storeId) {
            console.error('[withSAuth] ❌ storeId 누락 - 토큰에 storeId가 없음');
            throw new Error('S2001'); // UNAUTHENTICATED
          }

          // args.storeId가 제공된 경우 일치 여부 확인
          if (args.storeId) {
            // ⚡ 타입 변환: GraphQL ID 타입은 string으로 전달되므로 정규화 필요
            const contextStoreId = String(context.storeAccount.storeId);
            const argsStoreId = String(args.storeId);

            if (contextStoreId !== argsStoreId) {
              console.error('[withSAuth] ❌ storeId 불일치:', {
                contextStoreId,
                argsStoreId,
                storeAccountId: context.storeAccount.id
              });
              throw new Error('S3008'); // STORE_ACCESS_DENIED
            }
          }
        }

        // 커스텀 권한 체크
        if (customCheck && !customCheck(context, args)) {
          throw new Error('S2002'); // UNAUTHORIZED
        }
      }

      // 필수 필드 검증 (args.input 또는 최상위 args 파라미터 검증)
      if (requiredFields.length > 0) {
        // input 객체가 있으면 그 안에서 검증, 없으면 최상위에서 검증
        const dataSource = args.input || args;

        for (const field of requiredFields) {
          if (!dataSource[field]) {
            console.error(`[withSAuth] ❌ 필수 필드 누락: ${field}`, {
              providedFields: Object.keys(dataSource),
              requiredFields
            });
            throw new Error('S1006'); // MISSING_REQUIRED_FIELD
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

      // null/undefined 처리 - GraphQL Non-nullable 필드 안전성
      if (result == null) {
        console.warn(`[${name}] Resolver returned null - this may cause GraphQL errors for non-nullable fields`);
        return null; // 명시적으로 null 반환 (스키마가 nullable인 경우만)
      }

      // 배열인 경우 직접 반환 (GraphQL 스키마 타입 일치)
      if (Array.isArray(result)) {
        return result;
      }

      // ⚡ 원시 타입은 그대로 반환 (GraphQL scalar 타입에 맞춤)
      // Int, Float, String, Boolean 등은 래핑하지 않음
      if (typeof result !== 'object') {
        return result;
      }

      // _code가 있으면 성공 코드 처리
      if (result._code) {
        const success = getWebSuccess(result._code, context.language || 'vi');
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

      // Sequelize Validation 에러를 먼저 처리하여 S 코드로 변환
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        // 상세한 validation 에러 로깅
        console.error(`[${name}] ❌ Sequelize validation error:`, {
          message: error.message,
          name: error.name,
          errors: error.errors?.map(e => ({
            field: e.path,
            value: e.value,
            message: e.message,
            type: e.type,
            validatorKey: e.validatorKey
          }))
        });

        // Unique Constraint 에러 처리
        if (error.name === 'SequelizeUniqueConstraintError') {
          // uk_store_name: storeId + name 중복
          if (error.errors?.some(e => e.path === 'uk_store_name')) {
            // S 코드로 변환하여 아래 로직에서 자동 처리되도록
            error.message = 'S3067';
          }
        }

        // S 코드가 설정되지 않은 일반 validation 에러는 S1001로 처리
        if (!error.message.match(/^S\d{4}/)) {
          const systemError = getWebError('S1001', context.language || 'vi');
          const detailedErrors = error.errors?.map(e => `${e.path}: ${e.message}`).join(', ');

          throw new GraphQLError(systemError.message, {
            extensions: {
              code: systemError.key,
              originalError: process.env.NODE_ENV === 'development' ? error.message : undefined,
              validationDetails: process.env.NODE_ENV === 'development' ? detailedErrors : undefined,
              timestamp: new Date().toISOString()
            }
          });
        }
      }

      // S로 시작하는 에러 코드 자동 변환
      if (error.message && /^S\d{4}/.test(error.message)) {
        const [code, ...extra] = error.message.split(':');
        let webError = getWebError(code, context.language || 'vi');

        // 중복 에러인 경우 언어 정보 추가
        if (code === 'S4022' && error.duplicateLanguage) {
          const languageNames = {
            vi: 'Tiếng Việt',
            en: 'English',
            ko: '한국어'
          };
          const langName = languageNames[error.duplicateLanguage] || error.duplicateLanguage;

          // 언어별로 메시지 수정
          const messages = {
            vi: `Tên danh mục (${langName}) đã tồn tại: "${error.duplicateName}"`,
            en: `Category name (${langName}) already exists: "${error.duplicateName}"`,
            ko: `카테고리 이름 (${langName})이 이미 존재합니다: "${error.duplicateName}"`
          };

          webError = {
            ...webError,
            message: messages[context.language || 'vi'] || messages.vi
          };
        }

        // webError.key는 '[S2001]UNAUTHENTICATED' 형식이므로
        // 클라이언트가 인식할 수 있도록 키 부분만 추출
        const keyParts = webError.key.split(']');
        const errorKey = keyParts.length > 1 ? keyParts[1] : webError.key;

        throw new GraphQLError(webError.message, {
          extensions: {
            code: errorKey,  // 'UNAUTHENTICATED' 형식으로 전달
            errorCode: code,  // 원본 에러 코드 (S2001) 참고용
            details: extra.join(':') || undefined,
            duplicateField: error.duplicateField,
            duplicateLanguage: error.duplicateLanguage,
            duplicateName: error.duplicateName,
            existingCategoryId: error.existingCategoryId
          }
        });
      }

      // 이미 GraphQLError인 경우 그대로 throw
      if (error instanceof GraphQLError) {
        throw error;
      }

      // 일반 에러는 시스템 에러로 변환
      const systemError = getWebError('S1001', context.language || 'vi');
      console.error(`[${name}] Unexpected error:`, error);

      throw new GraphQLError(systemError.message, {
        extensions: {
          code: systemError.key,
          originalError: process.env.NODE_ENV === 'development' ? error.message : undefined,
          timestamp: new Date().toISOString()
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

// Backward compatibility alias
export const withSAuth = withWebAuth;

export default {
  withWebAuth,
  withSAuth,  // alias for backward compatibility
  parsePagination,
  STORE_ROLES
};