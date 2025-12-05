/**
 * 통합 메시지 관리 시스템 (확장)
 * 모든 메시지 타입(에러, 성공, 안내, 경고, 확인, 로딩, 알림)을 통합 관리
 * 
 * @description
 * - 통합 메시지 코드 체계 지원 (1xxxx-7xxxx)
 * - 다국어 메시지 자동 생성
 * - Toast/Alert 표시 타입 자동 결정
 * - 사용자 액션 제안 및 자동 복구
 * - 컨텍스트 기반 메시지 커스터마이징
 */

'use client';

import { useTranslation } from '@/shared/i18n';
import { 
  extractErrorCode, 
  getToastType, 
  getSuggestedUserAction,
  getErrorSeverity,
  getAutoRecoveryStrategy,
  isRetryable,
  getRecoveryDelay,
  ERROR_CODES 
} from '@/shared/errors/ErrorCodes';

import {
  SUCCESS_CODES,
  INFO_CODES,
  WARNING_CODES,
  CONFIRMATION_CODES,
  LOADING_CODES,
  NOTIFICATION_CODES,
  extractMessageCode,
  getMessageType,
  MESSAGE_CODE_RANGES
} from '@/shared/messages/MessageCodes';

// 메시지 타입 정의 (확장)
export const MESSAGE_TYPES = {
  ERROR: 'error',
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  CONFIRMATION: 'confirmation',
  LOADING: 'loading',
  NOTIFICATION: 'notification',
};

// 메시지 컨텍스트 (어디서 발생했는지)
export const MESSAGE_CONTEXTS = {
  AUTH: 'auth',
  ORDER: 'order',
  MENU: 'menu',
  PAYMENT: 'payment',
  POS: 'pos',
  DELIVERY: 'delivery',
  SYSTEM: 'system',
  GENERAL: 'general',
};

/**
 * 통합 메시지 매니저 훅
 */
export const useMessageManager = () => {
  const { t } = useTranslation();

  /**
   * 에러 객체로부터 사용자 친화적 메시지 생성
   * @param {Error|Object} error - 에러 객체 (GraphQL 에러 포함)
   * @param {string} context - 메시지 컨텍스트 (optional)
   * @param {Object} params - 메시지 매개변수 (optional)
   * @returns {Object} 메시지 정보 객체
   */
  const createErrorMessage = (error, context = MESSAGE_CONTEXTS.GENERAL, params = {}) => {
    const errorCode = extractErrorCode(error);
    const severity = getErrorSeverity(errorCode);
    const toastType = getToastType(errorCode);
    const suggestedAction = getSuggestedUserAction(errorCode);
    const autoRecovery = getAutoRecoveryStrategy(errorCode);
    const isRetryableError = isRetryable(errorCode);
    const recoveryDelay = getRecoveryDelay(errorCode);

    // 번역 키 생성
    const messageKey = `errors.codes.${errorCode}`;
    const actionKey = `errors.actions.${getActionTranslationKey(suggestedAction)}`;

    // 기본 메시지 (번역이 없는 경우 폴백)
    const fallbackMessage = error?.message || t('errors.common.unexpectedError');
    
    // 번역된 메시지 가져오기
    const translatedMessage = t(messageKey, params);
    const finalMessage = translatedMessage !== messageKey ? translatedMessage : fallbackMessage;

    return {
      // 기본 정보
      code: errorCode,
      codeName: ERROR_CODES[errorCode] || 'UNKNOWN_ERROR',
      message: finalMessage,
      severity,
      context,
      
      // UI 표시 정보
      type: toastType,
      duration: getDurationByType(toastType, severity),
      
      // 액션 정보
      suggestedAction,
      actionLabel: t(actionKey),
      isRetryable: isRetryableError,
      autoRecovery,
      recoveryDelay,
      
      // 원본 에러
      originalError: error,
      
      // 추가 매개변수
      params,
    };
  };

  /**
   * 성공 메시지 생성
   * @param {string} messageKey - 번역 키
   * @param {Object} params - 메시지 매개변수
   * @param {string} context - 메시지 컨텍스트
   * @returns {Object} 메시지 정보 객체
   */
  const createSuccessMessage = (messageKey, params = {}, context = MESSAGE_CONTEXTS.GENERAL) => {
    return {
      type: MESSAGE_TYPES.SUCCESS,
      message: t(messageKey, params),
      severity: 'LOW',
      context,
      duration: 3000,
      suggestedAction: 'DISMISS',
      actionLabel: t('errors.actions.dismiss'),
      isRetryable: false,
      autoRecovery: null,
      params,
    };
  };

  /**
   * 경고 메시지 생성
   * @param {string} messageKey - 번역 키
   * @param {Object} params - 메시지 매개변수
   * @param {string} context - 메시지 컨텍스트
   * @returns {Object} 메시지 정보 객체
   */
  const createWarningMessage = (messageKey, params = {}, context = MESSAGE_CONTEXTS.GENERAL) => {
    return {
      type: MESSAGE_TYPES.WARNING,
      message: t(messageKey, params),
      severity: 'MEDIUM',
      context,
      duration: 4000,
      suggestedAction: 'DISMISS',
      actionLabel: t('errors.actions.dismiss'),
      isRetryable: false,
      autoRecovery: null,
      params,
    };
  };

  /**
   * 정보 메시지 생성
   * @param {string} messageKey - 번역 키
   * @param {Object} params - 메시지 매개변수
   * @param {string} context - 메시지 컨텍스트
   * @returns {Object} 메시지 정보 객체
   */
  const createInfoMessage = (messageKey, params = {}, context = MESSAGE_CONTEXTS.GENERAL) => {
    return {
      type: MESSAGE_TYPES.INFO,
      message: t(messageKey, params),
      severity: 'LOW',
      context,
      duration: 3000,
      suggestedAction: 'DISMISS',
      actionLabel: t('errors.actions.dismiss'),
      isRetryable: false,
      autoRecovery: null,
      params,
    };
  };

  /**
   * 로딩 메시지 생성
   * @param {string} messageKey - 번역 키
   * @param {Object} params - 메시지 매개변수
   * @returns {Object} 메시지 정보 객체
   */
  const createLoadingMessage = (messageKey, params = {}) => {
    return {
      type: MESSAGE_TYPES.LOADING,
      message: t(messageKey, params),
      severity: 'LOW',
      context: MESSAGE_CONTEXTS.SYSTEM,
      duration: 0, // 무한 지속
      suggestedAction: null,
      actionLabel: null,
      isRetryable: false,
      autoRecovery: null,
      params,
    };
  };

  /**
   * 확인 메시지 생성
   * @param {string} messageKey - 번역 키
   * @param {Object} params - 메시지 매개변수
   * @param {string} context - 메시지 컨텍스트
   * @param {Object} actions - 사용자 액션 (confirm, cancel)
   * @returns {Object} 메시지 정보 객체
   */
  const createConfirmationMessage = (messageKey, params = {}, context = MESSAGE_CONTEXTS.GENERAL, actions = {}) => {
    return {
      type: MESSAGE_TYPES.CONFIRMATION,
      message: t(messageKey, params),
      severity: 'MEDIUM',
      context,
      duration: 0, // 사용자가 직접 닫을 때까지 유지
      suggestedAction: 'CONFIRM',
      actionLabel: t('errors.actions.confirm'),
      isRetryable: false,
      autoRecovery: null,
      params,
      actions: {
        confirm: actions.confirm || (() => {}),
        cancel: actions.cancel || (() => {}),
        confirmLabel: actions.confirmLabel || t('errors.actions.yes'),
        cancelLabel: actions.cancelLabel || t('errors.actions.no'),
      },
    };
  };

  /**
   * 알림 메시지 생성
   * @param {string} messageKey - 번역 키
   * @param {Object} params - 메시지 매개변수
   * @param {string} context - 메시지 컨텍스트
   * @returns {Object} 메시지 정보 객체
   */
  const createNotificationMessage = (messageKey, params = {}, context = MESSAGE_CONTEXTS.GENERAL) => {
    return {
      type: MESSAGE_TYPES.NOTIFICATION,
      message: t(messageKey, params),
      severity: 'LOW',
      context,
      duration: 5000,
      suggestedAction: 'VIEW',
      actionLabel: t('errors.actions.view'),
      isRetryable: false,
      autoRecovery: null,
      params,
    };
  };

  /**
   * 메시지 코드로부터 자동 메시지 생성
   * @param {number} messageCode - 메시지 코드 (20001-76002)
   * @param {Object} params - 메시지 매개변수
   * @param {string} context - 메시지 컨텍스트
   * @returns {Object} 메시지 정보 객체
   */
  const createMessageFromCode = (messageCode, params = {}, context = MESSAGE_CONTEXTS.GENERAL) => {
    const messageType = getMessageType(messageCode);
    
    // 번역 키 생성 (새로운 메시지 코드 체계)
    const messageKey = getTranslationKeyFromCode(messageCode, messageType);
    
    switch (messageType) {
      case MESSAGE_TYPES.SUCCESS:
        return createSuccessMessage(messageKey, params, context);
      case MESSAGE_TYPES.INFO:
        return createInfoMessage(messageKey, params, context);
      case MESSAGE_TYPES.WARNING:
        return createWarningMessage(messageKey, params, context);
      case MESSAGE_TYPES.LOADING:
        return createLoadingMessage(messageKey, params);
      case MESSAGE_TYPES.NOTIFICATION:
        return createNotificationMessage(messageKey, params, context);
      default:
        return createInfoMessage(messageKey, params, context);
    }
  };

  return {
    // 에러 메시지 (기존)
    createErrorMessage,
    
    // 새로운 메시지 타입들
    createSuccessMessage,
    createWarningMessage,
    createInfoMessage,
    createLoadingMessage,
    createConfirmationMessage,
    createNotificationMessage,
    
    // 통합 메시지 생성
    createMessageFromCode,
    
    // 상수
    MESSAGE_TYPES,
    MESSAGE_CONTEXTS,
  };
};

// 내부 유틸리티 함수들

/**
 * 사용자 액션을 번역 키로 변환
 */
const getActionTranslationKey = (action) => {
  const actionMap = {
    'LOGIN_REQUIRED': 'login',
    'AUTO_REFRESH': 'refresh',
    'PHONE_VERIFICATION': 'phoneVerification',
    'UPDATE_STORE_HOURS': 'updateStoreHours',
    'UPDATE_INVENTORY': 'updateInventory',
    'CONTACT_ADMIN': 'contactAdmin',
    'CHECK_POS_CONNECTION': 'checkPosConnection',
    'POS_LOGIN_REQUIRED': 'posLoginRequired',
    'UPDATE_BROWSER': 'updateBrowser',
    'ENABLE_JAVASCRIPT': 'enableJavaScript',
    'ENABLE_COOKIES': 'enableCookies',
    'CONTACT_SUPPORT': 'contactSupport',
    'RETRY': 'retry',
    'DISMISS': 'dismiss',
  };
  
  return actionMap[action] || 'dismiss';
};

/**
 * 메시지 코드로부터 번역 키 생성
 */
const getTranslationKeyFromCode = (messageCode, messageType) => {
  // 에러 메시지는 기존 구조 유지
  if (messageType === MESSAGE_TYPES.ERROR) {
    return `errors.codes.${messageCode}`;
  }
  
  // 새로운 메시지 타입들
  const typeKeyMap = {
    [MESSAGE_TYPES.SUCCESS]: 'success',
    [MESSAGE_TYPES.INFO]: 'info', 
    [MESSAGE_TYPES.WARNING]: 'warning',
    [MESSAGE_TYPES.CONFIRMATION]: 'confirmation',
    [MESSAGE_TYPES.LOADING]: 'loading',
    [MESSAGE_TYPES.NOTIFICATION]: 'notification',
  };
  
  const typeKey = typeKeyMap[messageType] || 'info';
  return `errors.${typeKey}.${messageCode}`;
};

/**
 * 메시지 타입과 심각도에 따른 표시 시간 결정 (확장)
 */
const getDurationByType = (type, severity) => {
  // 특별한 처리가 필요한 타입들
  if (type === MESSAGE_TYPES.LOADING) return 0; // 무한 지속
  if (type === MESSAGE_TYPES.CONFIRMATION) return 0; // 사용자가 닫을 때까지
  
  // 메시지 타입별 기본 지속 시간
  const typeDurations = {
    [MESSAGE_TYPES.SUCCESS]: 3000,
    [MESSAGE_TYPES.INFO]: 4000,
    [MESSAGE_TYPES.WARNING]: 5000,
    [MESSAGE_TYPES.NOTIFICATION]: 4000,
    [MESSAGE_TYPES.ERROR]: getDurationBySeverity(severity),
  };
  
  return typeDurations[type] || getDurationBySeverity(severity);
};

/**
 * 심각도별 지속 시간
 */
const getDurationBySeverity = (severity) => {
  switch (severity) {
    case 'CRITICAL':
      return 8000; // 8초 - 중요한 에러는 오래 표시
    case 'HIGH':
      return 6000; // 6초
    case 'MEDIUM':
      return 4000; // 4초
    case 'LOW':
      return 3000; // 3초
    default:
      return 4000;
  }
};

/**
 * 컨텍스트별 기본 메시지 제공 (확장)
 */
export const getContextualMessage = (context, type, key) => {
  const contextMessages = {
    [MESSAGE_CONTEXTS.AUTH]: {
      loading: 'errors.loading.61001', // 로그인 중...
      success: 'errors.success.21001', // 로그인 성공
      error: 'errors.codes.2001', // 로그인 필요
      warning: 'errors.warning.41001', // 세션 만료 임박
      info: 'errors.info.31001', // 세션 연장됨
    },
    [MESSAGE_CONTEXTS.ORDER]: {
      loading: 'errors.loading.62001', // 주문 처리 중...
      success: 'errors.success.22001', // 주문 생성 성공
      error: 'errors.codes.3001', // 주문을 찾을 수 없음
      warning: 'errors.warning.42001', // 주문량 많아 지연 가능
      info: 'errors.info.32001', // 새로운 주문 있음
    },
    [MESSAGE_CONTEXTS.MENU]: {
      loading: 'errors.loading.62002', // 메뉴 업데이트 중...
      success: 'errors.success.22004', // 메뉴 업데이트됨
      error: 'errors.codes.3006', // 메뉴 항목 없음
      warning: 'errors.warning.42002', // 재고 부족
      info: 'errors.info.32003', // 메뉴 정보 업데이트
    },
    [MESSAGE_CONTEXTS.PAYMENT]: {
      loading: 'errors.loading.63001', // 결제 처리 중...
      success: 'errors.success.23001', // 결제 성공
      error: 'errors.codes.4001', // 결제 실패
      warning: 'errors.warning.43001', // 결제 시도 많음
      info: 'errors.info.33001', // 결제 확인 중
    },
    [MESSAGE_CONTEXTS.POS]: {
      loading: 'errors.loading.64001', // POS 연결 중...
      success: 'errors.success.24001', // POS 연결 성공
      error: 'errors.codes.5001', // POS 연결 오류
      warning: 'errors.warning.44001', // POS 연결 불안정
      info: 'errors.info.34001', // POS 상태 확인 중
    },
    [MESSAGE_CONTEXTS.DELIVERY]: {
      loading: 'errors.loading.65001', // 배달원 찾는 중...
      success: 'errors.success.25001', // 배달 시작 성공
      error: 'errors.codes.6001', // 배달 오류
      warning: 'errors.warning.45001', // 배달 지연 예상
      info: 'errors.info.35001', // 배달원 배정됨
    },
    [MESSAGE_CONTEXTS.SYSTEM]: {
      loading: 'errors.loading.60001', // 처리 중...
      success: 'errors.success.20001', // 작업 완료
      error: 'errors.codes.1001', // 예상치 못한 오류
      warning: 'errors.warning.40001', // 시스템 성능 저하
      info: 'errors.info.30001', // 시스템 정상 작동
    },
  };

  return contextMessages[context]?.[type] || `errors.${type}.${key || messageCode}`;
};

/**
 * 통합 메시지 생성 (모든 타입 지원)
 * @param {number|string} codeOrKey - 메시지 코드 또는 번역 키
 * @param {Object} params - 메시지 매개변수
 * @param {string} context - 메시지 컨텍스트
 * @param {Object} options - 추가 옵션
 * @returns {Object} 메시지 정보 객체
 */
export const createUnifiedMessage = (codeOrKey, params = {}, context = MESSAGE_CONTEXTS.GENERAL, options = {}) => {
  // 숫자인 경우 메시지 코드로 처리
  if (typeof codeOrKey === 'number') {
    const messageType = getMessageType(codeOrKey);
    const messageKey = getTranslationKeyFromCode(codeOrKey, messageType);
    
    return {
      code: codeOrKey,
      type: messageType,
      message: messageKey,
      severity: getSeverityByType(messageType),
      context,
      duration: getDurationByType(messageType, getSeverityByType(messageType)),
      ...options,
    };
  }
  
  // 문자열인 경우 직접 번역 키로 처리
  return {
    type: options.type || MESSAGE_TYPES.INFO,
    message: codeOrKey,
    severity: options.severity || 'LOW',
    context,
    duration: options.duration || 3000,
    ...options,
  };
};

/**
 * 메시지 타입에 따른 기본 심각도 반환
 */
const getSeverityByType = (messageType) => {
  const severityMap = {
    [MESSAGE_TYPES.ERROR]: 'HIGH',
    [MESSAGE_TYPES.SUCCESS]: 'LOW',
    [MESSAGE_TYPES.INFO]: 'LOW',
    [MESSAGE_TYPES.WARNING]: 'MEDIUM',
    [MESSAGE_TYPES.CONFIRMATION]: 'HIGH',
    [MESSAGE_TYPES.LOADING]: 'LOW',
    [MESSAGE_TYPES.NOTIFICATION]: 'LOW',
  };
  
  return severityMap[messageType] || 'LOW';
};

export default useMessageManager;