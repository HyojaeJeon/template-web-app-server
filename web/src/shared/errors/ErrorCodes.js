/**
 * 점주용 웹앱 통합 에러 코드 체계
 * 서버 에러 코드와 동기화되어 일관성 있는 에러 처리를 제공합니다.
 * 
 * @description
 * - 서버와 동일한 에러 코드 체계 사용
 * - 웹앱 전용 에러 코드 추가 (9xxx 범위)
 * - 에러 타입별 분류 및 처리 전략
 * - 자동 복구 및 사용자 액션 제안
 */

export const ERROR_CODES = {
  // 1xxx: 공통 에러
  1001: 'UNKNOWN_ERROR',
  1002: 'VALIDATION_ERROR',
  1003: 'NETWORK_ERROR',
  1004: 'SERVER_ERROR',
  1005: 'INVALID_INPUT',
  1006: 'MISSING_REQUIRED_FIELD',

  // 2xxx: 인증/인가
  2001: 'UNAUTHENTICATED',
  2002: 'UNAUTHORIZED',
  2003: 'TOKEN_EXPIRED',
  2004: 'INVALID_CREDENTIALS',
  2005: 'USER_NOT_FOUND',
  2006: 'USER_ALREADY_EXISTS',
  2007: 'INVALID_USER_STATUS',
  2008: 'PHONE_VERIFICATION_REQUIRED',
  2009: 'TWO_FACTOR_AUTH_REQUIRED',

  // 3xxx: 주문 관련
  3001: 'ORDER_NOT_FOUND',
  3002: 'INVALID_ORDER_STATUS',
  3003: 'ORDER_CANCELLATION_FAILED',
  3004: 'ORDER_MODIFICATION_FAILED',
  3005: 'STORE_CLOSED',
  3006: 'MENU_ITEM_NOT_FOUND',
  3007: 'MENU_ITEM_UNAVAILABLE',
  3008: 'INSUFFICIENT_STOCK',
  3009: 'ORDER_LIMIT_EXCEEDED',

  // 4xxx: 결제 관련
  4001: 'PAYMENT_FAILED',
  4002: 'INSUFFICIENT_FUNDS',
  4003: 'PAYMENT_METHOD_NOT_FOUND',
  4004: 'INVALID_PAYMENT_AMOUNT',
  4005: 'PAYMENT_GATEWAY_ERROR',
  4006: 'PAYMENT_TIMEOUT',
  4007: 'REFUND_FAILED',
  4008: 'DUPLICATE_PAYMENT',

  // 5xxx: POS 통합
  5001: 'POS_CONNECTION_ERROR',
  5002: 'POS_SYNC_FAILED',
  5003: 'POS_ORDER_SYNC_ERROR',
  5004: 'POS_MENU_SYNC_ERROR',
  5005: 'POS_TIMEOUT',
  5006: 'POS_AUTHENTICATION_FAILED',
  5007: 'POS_INVALID_RESPONSE',

  // 6xxx: 배달 관련
  6001: 'DELIVERY_ERROR',
  6002: 'INVALID_DELIVERY_ADDRESS',
  6003: 'DELIVERY_AREA_NOT_SUPPORTED',
  6004: 'DELIVERY_TIME_INVALID',
  6005: 'DELIVERY_PERSON_NOT_AVAILABLE',
  6006: 'DELIVERY_CANCELLED',

  // 7xxx: 매장 관련
  7001: 'STORE_NOT_FOUND',
  7002: 'STORE_ACCESS_DENIED',
  7003: 'STAFF_NOT_FOUND',
  7004: 'STAFF_ACCESS_DENIED',

  // 9xxx: 웹앱 전용 에러
  9001: 'BROWSER_NOT_SUPPORTED',
  9002: 'LOCAL_STORAGE_ERROR',
  9003: 'SESSION_STORAGE_ERROR',
  9004: 'JAVASCRIPT_DISABLED',
  9005: 'COOKIES_DISABLED',
  9006: 'WEBSOCKET_NOT_SUPPORTED',
  9007: 'FILE_API_NOT_SUPPORTED',
  9008: 'GEOLOCATION_NOT_SUPPORTED',
  9009: 'NOTIFICATION_NOT_SUPPORTED',
  9010: 'WEB_PUSH_NOT_SUPPORTED',
};

// 에러 타입별 분류
export const ERROR_TYPES = {
  // 시스템 에러 (관리자/개발자가 해결해야 함)
  SYSTEM: [1001, 1004, 5001, 5002, 5003, 5004, 5005, 5006, 5007],
  
  // 사용자 입력 에러 (점주가 수정 가능)
  USER_INPUT: [1002, 1005, 1006, 2004, 4004, 6002, 6004],
  
  // 인증 관련 (로그인 필요/권한 없음)
  AUTH: [2001, 2002, 2003, 2005, 2006, 2007, 2008, 2009],
  
  // 비즈니스 로직 에러 (상태나 규칙으로 인한 제한)
  BUSINESS: [3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 4002, 4003, 6003, 6005, 6006, 7001, 7002],
  
  // 결제 관련
  PAYMENT: [4001, 4005, 4006, 4007, 4008],
  
  // 브라우저/환경 관련
  BROWSER: [9001, 9002, 9003, 9004, 9005, 9006, 9007, 9008, 9009, 9010],
  
  // 네트워크 관련
  NETWORK: [1003, 5005, 4006],
};

// 에러 심각도 레벨
export const ERROR_SEVERITY = {
  CRITICAL: [1004, 5001, 5002, 5003, 9001, 9004], // 서비스 중단
  HIGH: [2001, 2003, 4001, 3001, 9002, 9003], // 핵심 기능 영향
  MEDIUM: [1002, 2004, 3005, 6002, 9005, 9006], // 일부 기능 제한
  LOW: [1005, 3006, 3007, 6004, 9007, 9008, 9009, 9010], // 사용성 문제
};

// 자동 복구 전략
export const AUTO_RECOVERY_STRATEGIES = {
  2003: 'TOKEN_REFRESH', // 토큰 자동 갱신
  1003: 'NETWORK_RETRY', // 네트워크 재시도
  5005: 'POS_RECONNECT', // POS 재연결
  4006: 'PAYMENT_RETRY', // 결제 재시도
  5001: 'POS_FALLBACK', // POS 폴백 모드
};

// 사용자 액션 제안
export const USER_ACTIONS = {
  // 인증 관련
  2001: 'LOGIN_REQUIRED',
  2003: 'AUTO_REFRESH', // 자동 처리됨
  2008: 'PHONE_VERIFICATION',
  
  // 매장 관리
  3005: 'UPDATE_STORE_HOURS',
  3008: 'UPDATE_INVENTORY',
  7002: 'CONTACT_ADMIN',
  
  // POS 관련
  5001: 'CHECK_POS_CONNECTION',
  5006: 'POS_LOGIN_REQUIRED',
  
  // 브라우저 관련
  9001: 'UPDATE_BROWSER',
  9004: 'ENABLE_JAVASCRIPT',
  9005: 'ENABLE_COOKIES',
  
  // 기본 액션
  DEFAULT: 'CONTACT_SUPPORT',
};

// 에러 처리 우선순위
export const ERROR_PRIORITY = {
  IMMEDIATE: [2001, 5001, 9001, 9004], // 즉시 처리 필요
  HIGH: [2003, 4001, 5002, 5003], // 높은 우선순위
  NORMAL: [1002, 3005, 6002], // 일반 우선순위
  LOW: [1005, 3006, 3007], // 낮은 우선순위
};

// 유틸리티 함수들

// 에러 코드로 타입 조회
export const getErrorType = (errorCode) => {
  for (const [type, codes] of Object.entries(ERROR_TYPES)) {
    if (codes.includes(errorCode)) {
      return type;
    }
  }
  return 'UNKNOWN';
};

// 에러 코드로 심각도 조회
export const getErrorSeverity = (errorCode) => {
  for (const [severity, codes] of Object.entries(ERROR_SEVERITY)) {
    if (codes.includes(errorCode)) {
      return severity;
    }
  }
  return 'LOW';
};

// 자동 복구 전략 조회
export const getAutoRecoveryStrategy = (errorCode) => {
  return AUTO_RECOVERY_STRATEGIES[errorCode] || null;
};

// 사용자 액션 제안 조회
export const getSuggestedUserAction = (errorCode) => {
  return USER_ACTIONS[errorCode] || USER_ACTIONS.DEFAULT;
};

// 에러 우선순위 조회
export const getErrorPriority = (errorCode) => {
  for (const [priority, codes] of Object.entries(ERROR_PRIORITY)) {
    if (codes.includes(errorCode)) {
      return priority;
    }
  }
  return 'NORMAL';
};

// GraphQL 에러에서 에러 코드 추출
export const extractErrorCode = (error) => {
  // GraphQL extensions에서 코드 추출
  if (error?.extensions?.code) {
    const code = error.extensions.code;
    // 숫자 코드인 경우 그대로 반환
    if (typeof code === 'number') {
      return code;
    }
    // 문자열 코드인 경우 ERROR_CODES에서 찾기
    for (const [numCode, stringCode] of Object.entries(ERROR_CODES)) {
      if (stringCode === code) {
        return parseInt(numCode);
      }
    }
  }
  
  // 에러 메시지에서 코드 패턴 추출 (예: "[2001] 로그인이 필요합니다")
  const codeMatch = error?.message?.match(/\[(\d{4})\]/);
  if (codeMatch) {
    return parseInt(codeMatch[1]);
  }
  
  // 기본 에러 코드 반환
  return 1001; // UNKNOWN_ERROR
};

// Toast 타입 결정
export const getToastType = (errorCode) => {
  const severity = getErrorSeverity(errorCode);
  
  switch (severity) {
    case 'CRITICAL':
      return 'error';
    case 'HIGH':
      return 'error';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'info';
    default:
      return 'info';
  }
};

// 재시도 가능 여부 확인
export const isRetryable = (errorCode) => {
  const retryableErrors = [
    1003, // NETWORK_ERROR
    1004, // SERVER_ERROR
    5001, 5002, 5003, 5005, // POS 관련
    4005, 4006, // 결제 게이트웨이 일시적 오류
  ];
  return retryableErrors.includes(errorCode);
};

// 에러 복구 시간 (밀리초)
export const getRecoveryDelay = (errorCode) => {
  const delayMap = {
    1003: 2000, // 네트워크 에러 - 2초 후 재시도
    5001: 5000, // POS 연결 - 5초 후 재시도
    5005: 3000, // POS 타임아웃 - 3초 후 재시도
    4006: 10000, // 결제 타임아웃 - 10초 후 재시도
  };
  
  return delayMap[errorCode] || 3000; // 기본 3초
};

export default {
  ERROR_CODES,
  ERROR_TYPES,
  ERROR_SEVERITY,
  AUTO_RECOVERY_STRATEGIES,
  USER_ACTIONS,
  ERROR_PRIORITY,
  getErrorType,
  getErrorSeverity,
  getAutoRecoveryStrategy,
  getSuggestedUserAction,
  getErrorPriority,
  extractErrorCode,
  getToastType,
  isRetryable,
  getRecoveryDelay,
};