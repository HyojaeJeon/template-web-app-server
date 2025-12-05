/**
 * GraphQL 공통 타입 리졸버
 * Location: /graphql/types/resolvers.js
 * Purpose: 공통 타입의 필드 리졸버 정의
 */

import { localize } from '../../shared/utils/utilities/Localization.js';
import { logger } from '../../shared/utils/utilities/Logger.js';
import db from '../../models/index.js';

/**
 * User 타입 필드 리졸버
 * 사용자 정보의 다국어 처리 및 계산된 필드
 */
export const UserResolver = {
  /**
   * name 필드 - 언어에 따라 적절한 값 반환
   */
  name: (parent, args, context) => {
    // 이미 localize된 객체인 경우 그대로 반환
    if (parent._localized) {
      return parent.name;
    }

    const language = context.language || 'vi';

    // 언어별 필드 매핑
    switch (language) {
      case 'ko':
        return parent.nameKo || parent.name;
      case 'en':
        return parent.nameEn || parent.name;
      default:
        return parent.name;
    }
  },

  /**
   * profileImage 필드 - null safety 처리
   */
  profileImage: (parent) => {
    return parent.profileImage || null;
  },

  /**
   * Non-nullable 필드 기본값 처리
   */
  isPhoneVerified: (parent) => {
    return parent.isPhoneVerified ?? false;
  },

  isEmailVerified: (parent) => {
    return parent.isEmailVerified ?? false;
  },

  notificationsEnabled: (parent) => {
    return parent.notificationsEnabled ?? true;
  },

  marketingOptIn: (parent) => {
    return parent.marketingOptIn ?? false;
  },

  status: (parent) => {
    return parent.status ?? 'ACTIVE';
  },

  role: (parent) => {
    return parent.role ?? 'CUSTOMER';
  },

  createdAt: (parent) => {
    return parent.createdAt ?? new Date();
  },

  updatedAt: (parent) => {
    return parent.updatedAt ?? new Date();
  }
};

/**
 * WebAccount 타입 필드 리졸버
 * Web 클라이언트 계정 정보 처리
 */
export const WebAccountResolver = {
  /**
   * Non-nullable 필드 기본값 처리
   */
  notificationsEnabled: (parent) => {
    return parent.notificationsEnabled ?? true;
  },

  role: (parent) => {
    return parent.role ?? 'STAFF';
  },

  status: (parent) => {
    return parent.status ?? 'ACTIVE';
  },

  createdAt: (parent) => {
    return parent.createdAt ?? new Date();
  },

  updatedAt: (parent) => {
    return parent.updatedAt ?? new Date();
  }
};

/**
 * Notification 타입 필드 리졸버
 * 알림 정보 처리
 */
export const NotificationResolver = {
  /**
   * Non-nullable 필드 기본값 처리
   */
  isRead: (parent) => {
    return parent.isRead ?? false;
  },

  type: (parent) => {
    return parent.type ?? 'PUSH';
  },

  priority: (parent) => {
    return parent.priority ?? 'NORMAL';
  },

  createdAt: (parent) => {
    return parent.createdAt ?? new Date();
  },

  updatedAt: (parent) => {
    return parent.updatedAt ?? new Date();
  }
};

/**
 * 공통 타입 리졸버 통합
 */
export const typeResolvers = {
  User: UserResolver,
  WebAccount: WebAccountResolver,
  Notification: NotificationResolver
};

export default typeResolvers;
