/**
 * 통합 메시지 코드 체계
 * 에러, 성공, 안내, 경고 등 모든 사용자 메시지를 코드 기반으로 관리
 * 
 * @description
 * - 1xxxx: 에러 메시지 (기존 에러 코드 확장)
 * - 2xxxx: 성공 메시지
 * - 3xxxx: 정보/안내 메시지  
 * - 4xxxx: 경고 메시지
 * - 5xxxx: 확인/질문 메시지
 * - 6xxxx: 로딩/진행 메시지
 * - 7xxxx: 시스템 알림 메시지
 */

// ==================== 1xxxx: 에러 메시지 ====================
export const ERROR_CODES = {
  // 1xxx: 공통 에러
  11001: 'UNKNOWN_ERROR',
  11002: 'VALIDATION_ERROR',
  11003: 'NETWORK_ERROR',
  11004: 'SERVER_ERROR',
  11005: 'INVALID_INPUT',
  11006: 'MISSING_REQUIRED_FIELD',

  // 12xxx: 인증/인가 에러
  12001: 'UNAUTHENTICATED',
  12002: 'UNAUTHORIZED',
  12003: 'TOKEN_EXPIRED',
  12004: 'INVALID_CREDENTIALS',
  12005: 'USER_NOT_FOUND',
  12006: 'USER_ALREADY_EXISTS',
  12007: 'INVALID_USER_STATUS',
  12008: 'PHONE_VERIFICATION_REQUIRED',
  12009: 'TWO_FACTOR_AUTH_REQUIRED',

  // 13xxx: 주문 관련 에러
  13001: 'ORDER_NOT_FOUND',
  13002: 'INVALID_ORDER_STATUS',
  13003: 'ORDER_CANCELLATION_FAILED',
  13004: 'ORDER_MODIFICATION_FAILED',
  13005: 'STORE_CLOSED',
  13006: 'MENU_ITEM_NOT_FOUND',
  13007: 'MENU_ITEM_UNAVAILABLE',
  13008: 'INSUFFICIENT_STOCK',
  13009: 'ORDER_LIMIT_EXCEEDED',
  13010: 'MENU_AVAILABILITY_UPDATE_FAILED',
  13011: 'MENU_BULK_UPDATE_FAILED',

  // 14xxx: 결제 관련 에러
  14001: 'PAYMENT_FAILED',
  14002: 'INSUFFICIENT_FUNDS',
  14003: 'PAYMENT_METHOD_NOT_FOUND',
  14004: 'INVALID_PAYMENT_AMOUNT',
  14005: 'PAYMENT_GATEWAY_ERROR',
  14006: 'PAYMENT_TIMEOUT',
  14007: 'REFUND_FAILED',
  14008: 'DUPLICATE_PAYMENT',

  // 15xxx: POS 통합 에러
  15001: 'POS_CONNECTION_ERROR',
  15002: 'POS_SYNC_FAILED',
  15003: 'POS_ORDER_SYNC_ERROR',
  15004: 'POS_MENU_SYNC_ERROR',
  15005: 'POS_TIMEOUT',
  15006: 'POS_AUTHENTICATION_FAILED',
  15007: 'POS_INVALID_RESPONSE',

  // 16xxx: 배달 관련 에러
  16001: 'DELIVERY_ERROR',
  16002: 'INVALID_DELIVERY_ADDRESS',
  16003: 'DELIVERY_AREA_NOT_SUPPORTED',
  16004: 'DELIVERY_TIME_INVALID',
  16005: 'DELIVERY_PERSON_NOT_AVAILABLE',
  16006: 'DELIVERY_CANCELLED',

  // 17xxx: 매장 관련 에러
  17001: 'STORE_NOT_FOUND',
  17002: 'STORE_ACCESS_DENIED',
  17003: 'STAFF_NOT_FOUND',
  17004: 'STAFF_ACCESS_DENIED',

  // 18xxx: 리뷰 관리 에러
  18001: 'REVIEW_REPLY_FAILED',
  18002: 'REVIEW_REPLY_UPDATE_FAILED',
  18003: 'REVIEW_REPLY_DELETE_FAILED',
  18004: 'REVIEW_REPORT_HANDLE_FAILED',

  // 19xxx: 웹앱 전용 에러
  19001: 'BROWSER_NOT_SUPPORTED',
  19002: 'LOCAL_STORAGE_ERROR',
  19003: 'SESSION_STORAGE_ERROR',
  19004: 'JAVASCRIPT_DISABLED',
  19005: 'COOKIES_DISABLED',
  19006: 'WEBSOCKET_NOT_SUPPORTED',
  19007: 'FILE_API_NOT_SUPPORTED',
  19008: 'GEOLOCATION_NOT_SUPPORTED',
  19009: 'NOTIFICATION_NOT_SUPPORTED',
  19010: 'WEB_PUSH_NOT_SUPPORTED',
};

// ==================== 2xxxx: 성공 메시지 ====================
export const SUCCESS_CODES = {
  // 20xxx: 일반 성공
  20001: 'OPERATION_SUCCESS',
  20002: 'DATA_SAVED',
  20003: 'DATA_UPDATED',
  20004: 'DATA_DELETED',
  20005: 'SETTINGS_SAVED',

  // 21xxx: 인증 성공
  21001: 'LOGIN_SUCCESS',
  21002: 'LOGOUT_SUCCESS',
  21003: 'REGISTRATION_SUCCESS',
  21004: 'PASSWORD_CHANGED',
  21005: 'PHONE_VERIFIED',
  21006: 'TWO_FACTOR_SETUP',

  // 22xxx: 주문 관련 성공
  22001: 'ORDER_CREATED',
  22002: 'ORDER_UPDATED',
  22003: 'ORDER_ACCEPTED',
  22004: 'ORDER_COMPLETED',
  22005: 'ORDER_CANCELLED',
  22006: 'MENU_UPDATED',
  22007: 'INVENTORY_UPDATED',
  22008: 'MENU_AVAILABILITY_UPDATED',
  22009: 'MENU_BULK_UPDATED',

  // 23xxx: 결제 성공
  23001: 'PAYMENT_SUCCESS',
  23002: 'REFUND_SUCCESS',
  23003: 'PAYMENT_METHOD_ADDED',
  23004: 'PAYMENT_METHOD_UPDATED',

  // 24xxx: POS 관련 성공
  24001: 'POS_CONNECTED',
  24002: 'POS_SYNC_SUCCESS',
  24003: 'POS_ORDER_SENT',
  24004: 'POS_MENU_SYNCED',

  // 25xxx: 배달 관련 성공
  25001: 'DELIVERY_ASSIGNED',
  25002: 'DELIVERY_STARTED',
  25003: 'DELIVERY_COMPLETED',
  25004: 'DRIVER_FOUND',

  // 26xxx: 매장 관리 성공
  26001: 'STORE_UPDATED',
  26002: 'STAFF_ADDED',
  26003: 'STAFF_UPDATED',
  26004: 'STORE_HOURS_UPDATED',

  // 27xxx: 리뷰 관리 성공
  27001: 'REVIEW_REPLY_SUCCESS',
  27002: 'REVIEW_REPLY_UPDATED',
  27003: 'REVIEW_REPLY_DELETED',
  27004: 'REVIEW_REPORT_HANDLED',
};

// ==================== 3xxxx: 정보/안내 메시지 ====================
export const INFO_CODES = {
  // 30xxx: 일반 정보
  30001: 'WELCOME_MESSAGE',
  30002: 'TUTORIAL_AVAILABLE',
  30003: 'NEW_FEATURE_AVAILABLE',
  30004: 'MAINTENANCE_SCHEDULED',
  30005: 'BACKUP_COMPLETED',

  // 31xxx: 주문 관련 정보
  31001: 'NEW_ORDER_RECEIVED',
  31002: 'ORDER_PREPARATION_TIME',
  31003: 'PEAK_HOURS_NOTICE',
  31004: 'MENU_RECOMMENDATION',
  31005: 'CUSTOMER_NOTES_AVAILABLE',

  // 32xxx: 결제 관련 정보
  32001: 'PAYMENT_PENDING',
  32002: 'SETTLEMENT_AVAILABLE',
  32003: 'NEW_PAYMENT_METHOD',
  32004: 'PAYMENT_REPORT_READY',

  // 33xxx: POS 관련 정보
  33001: 'POS_UPDATE_AVAILABLE',
  33002: 'POS_MAINTENANCE_MODE',
  33003: 'POS_BACKUP_STARTED',
  33004: 'POS_SYNC_SCHEDULED',

  // 34xxx: 배달 관련 정보
  34001: 'DRIVER_ON_THE_WAY',
  34002: 'DELIVERY_DELAYED',
  34003: 'WEATHER_ALERT',
  34004: 'TRAFFIC_UPDATE',

  // 35xxx: 매장 운영 정보
  35001: 'STORE_BUSY_PERIOD',
  35002: 'STAFF_SHIFT_CHANGE',
  35003: 'INVENTORY_LOW_STOCK',
  35004: 'CUSTOMER_FEEDBACK_RECEIVED',
};

// ==================== 4xxxx: 경고 메시지 ====================
export const WARNING_CODES = {
  // 40xxx: 일반 경고
  40001: 'UNSAVED_CHANGES',
  40002: 'INTERNET_SLOW',
  40003: 'BROWSER_OUTDATED',
  40004: 'STORAGE_ALMOST_FULL',
  40005: 'SESSION_EXPIRING_SOON',

  // 41xxx: 주문 관련 경고
  41001: 'ORDER_TAKING_LONG',
  41002: 'KITCHEN_OVERLOADED',
  41003: 'DELIVERY_DELAYED',
  41004: 'CUSTOMER_WAITING_LONG',
  41005: 'STOCK_RUNNING_LOW',

  // 42xxx: 결제 관련 경고
  42001: 'PAYMENT_PROCESSING_SLOW',
  42002: 'MULTIPLE_PAYMENT_ATTEMPTS',
  42003: 'PAYMENT_METHOD_EXPIRING',
  42004: 'SETTLEMENT_OVERDUE',

  // 43xxx: POS 관련 경고
  43001: 'POS_CONNECTION_UNSTABLE',
  43002: 'POS_SYNC_DELAYED',
  43003: 'POS_MEMORY_HIGH',
  43004: 'POS_UPDATE_RECOMMENDED',

  // 44xxx: 배달 관련 경고
  44001: 'DELIVERY_TIME_EXCEEDED',
  44002: 'DRIVER_DELAYED',
  44003: 'WEATHER_CONDITIONS',
  44004: 'PEAK_DELIVERY_TIME',

  // 45xxx: 매장 운영 경고
  45001: 'STAFF_SHORTAGE',
  45002: 'EQUIPMENT_MAINTENANCE_DUE',
  45003: 'LICENSE_EXPIRING',
  45004: 'PERFORMANCE_DECLINING',
};

// ==================== 5xxxx: 확인/질문 메시지 ====================
export const CONFIRMATION_CODES = {
  // 50xxx: 일반 확인
  50001: 'CONFIRM_DELETE',
  50002: 'CONFIRM_SAVE',
  50003: 'CONFIRM_CANCEL',
  50004: 'CONFIRM_LOGOUT',
  50005: 'CONFIRM_RESET',

  // 51xxx: 주문 관련 확인
  51001: 'CONFIRM_ORDER_ACCEPT',
  51002: 'CONFIRM_ORDER_REJECT',
  51003: 'CONFIRM_ORDER_CANCEL',
  51004: 'CONFIRM_MENU_DELETE',
  51005: 'CONFIRM_PRICE_CHANGE',

  // 52xxx: 결제 관련 확인
  52001: 'CONFIRM_REFUND',
  52002: 'CONFIRM_PAYMENT_CANCEL',
  52003: 'CONFIRM_SETTLEMENT',

  // 53xxx: POS 관련 확인
  53001: 'CONFIRM_POS_RESTART',
  53002: 'CONFIRM_POS_RESET',
  53003: 'CONFIRM_POS_UPDATE',

  // 54xxx: 배달 관련 확인
  54001: 'CONFIRM_DELIVERY_CANCEL',
  54002: 'CONFIRM_DRIVER_CHANGE',

  // 55xxx: 매장 관리 확인
  55001: 'CONFIRM_STORE_CLOSE',
  55002: 'CONFIRM_STAFF_DELETE',
  55003: 'CONFIRM_HOURS_CHANGE',
};

// ==================== 6xxxx: 로딩/진행 메시지 ====================
export const LOADING_CODES = {
  // 60xxx: 일반 로딩
  60001: 'LOADING_DATA',
  60002: 'SAVING_DATA',
  60003: 'UPLOADING_FILE',
  60004: 'PROCESSING_REQUEST',
  60005: 'INITIALIZING_APP',

  // 61xxx: 인증 관련 로딩
  61001: 'LOGGING_IN',
  61002: 'REGISTERING_USER',
  61003: 'VERIFYING_PHONE',
  61004: 'REFRESHING_TOKEN',

  // 62xxx: 주문 관련 로딩
  62001: 'LOADING_ORDERS',
  62002: 'UPDATING_ORDER',
  62003: 'SENDING_TO_KITCHEN',
  62004: 'UPDATING_MENU',
  62005: 'CALCULATING_PRICE',

  // 63xxx: 결제 관련 로딩
  63001: 'PROCESSING_PAYMENT',
  63002: 'PROCESSING_REFUND',
  63003: 'VALIDATING_PAYMENT',
  63004: 'GENERATING_RECEIPT',

  // 64xxx: POS 관련 로딩
  64001: 'CONNECTING_POS',
  64002: 'SYNCING_POS_DATA',
  64003: 'SENDING_ORDER_TO_POS',
  64004: 'UPDATING_POS_MENU',

  // 65xxx: 배달 관련 로딩
  65001: 'FINDING_DRIVER',
  65002: 'CALCULATING_ROUTE',
  65003: 'UPDATING_DELIVERY_STATUS',
  65004: 'TRACKING_DELIVERY',

  // 66xxx: 매장 관리 로딩
  66001: 'UPDATING_STORE_INFO',
  66002: 'LOADING_ANALYTICS',
  66003: 'GENERATING_REPORT',
  66004: 'BACKING_UP_DATA',
};

// ==================== 7xxxx: 시스템 알림 메시지 ====================
export const NOTIFICATION_CODES = {
  // 70xxx: 일반 시스템 알림
  70001: 'SYSTEM_UPDATE_AVAILABLE',
  70002: 'MAINTENANCE_NOTICE',
  70003: 'BACKUP_SCHEDULED',
  70004: 'PERFORMANCE_REPORT',
  70005: 'SECURITY_ALERT',

  // 71xxx: 비즈니스 알림
  71001: 'DAILY_REPORT_READY',
  71002: 'MONTHLY_SUMMARY_READY',
  71003: 'NEW_REVIEW_RECEIVED',
  71004: 'LOYALTY_MILESTONE_REACHED',
  71005: 'PROMOTION_STARTING_SOON',

  // 72xxx: 운영 알림
  72001: 'PEAK_HOURS_STARTING',
  72002: 'STAFF_BREAK_TIME',
  72003: 'INVENTORY_RESTOCK_NEEDED',
  72004: 'EQUIPMENT_CHECK_DUE',

  // 73xxx: 고객 관련 알림
  73001: 'VIP_CUSTOMER_ORDER',
  73002: 'COMPLAINT_RECEIVED',
  73003: 'POSITIVE_REVIEW_RECEIVED',
  73004: 'CUSTOMER_MILESTONE',
};

// ==================== 메시지 타입 분류 ====================
export const MESSAGE_TYPES = {
  ERROR: 'error',
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  CONFIRMATION: 'confirmation',
  LOADING: 'loading',
  NOTIFICATION: 'notification',
};

// ==================== 메시지 컨텍스트 ====================
export const MESSAGE_CONTEXTS = {
  AUTH: 'auth',
  ORDER: 'order',
  MENU: 'menu',
  PAYMENT: 'payment',
  POS: 'pos',
  DELIVERY: 'delivery',
  STORE: 'store',
  SYSTEM: 'system',
  ANALYTICS: 'analytics',
  CUSTOMER: 'customer',
  GENERAL: 'general',
};

// ==================== 메시지 우선순위 ====================
export const MESSAGE_PRIORITY = {
  CRITICAL: 0, // 즉시 처리 필요
  HIGH: 1,     // 높은 우선순위
  NORMAL: 2,   // 일반 우선순위
  LOW: 3,      // 낮은 우선순위
  INFO: 4,     // 정보성 메시지
};

// ==================== 메시지 지속시간 ====================
export const MESSAGE_DURATION = {
  CRITICAL: 10000, // 10초
  HIGH: 6000,      // 6초
  NORMAL: 4000,    // 4초
  LOW: 3000,       // 3초
  INFO: 3000,      // 3초
  LOADING: 0,      // 수동 닫기
  PERMANENT: -1,   // 영구 표시
};

// ==================== 유틸리티 함수들 ====================

/**
 * 메시지 코드로부터 타입 추출
 */
export const getMessageType = (code) => {
  const codeStr = String(code);
  
  if (codeStr.startsWith('1')) return MESSAGE_TYPES.ERROR;
  if (codeStr.startsWith('2')) return MESSAGE_TYPES.SUCCESS;
  if (codeStr.startsWith('3')) return MESSAGE_TYPES.INFO;
  if (codeStr.startsWith('4')) return MESSAGE_TYPES.WARNING;
  if (codeStr.startsWith('5')) return MESSAGE_TYPES.CONFIRMATION;
  if (codeStr.startsWith('6')) return MESSAGE_TYPES.LOADING;
  if (codeStr.startsWith('7')) return MESSAGE_TYPES.NOTIFICATION;
  
  return MESSAGE_TYPES.INFO;
};

/**
 * 메시지 코드로부터 우선순위 결정
 */
export const getMessagePriority = (code) => {
  const type = getMessageType(code);
  const codeNum = parseInt(code);
  
  // 에러 메시지 우선순위
  if (type === MESSAGE_TYPES.ERROR) {
    if ([11004, 15001, 15002, 19001, 19004].includes(codeNum)) return MESSAGE_PRIORITY.CRITICAL;
    if ([12001, 12003, 14001, 13001].includes(codeNum)) return MESSAGE_PRIORITY.HIGH;
    if ([11002, 12004, 13005].includes(codeNum)) return MESSAGE_PRIORITY.NORMAL;
    return MESSAGE_PRIORITY.LOW;
  }
  
  // 성공 메시지 우선순위
  if (type === MESSAGE_TYPES.SUCCESS) {
    if ([21001, 22001, 23001].includes(codeNum)) return MESSAGE_PRIORITY.HIGH;
    return MESSAGE_PRIORITY.NORMAL;
  }
  
  // 경고 메시지 우선순위
  if (type === MESSAGE_TYPES.WARNING) {
    if ([40001, 41002, 43001].includes(codeNum)) return MESSAGE_PRIORITY.HIGH;
    return MESSAGE_PRIORITY.NORMAL;
  }
  
  // 확인 메시지는 높은 우선순위
  if (type === MESSAGE_TYPES.CONFIRMATION) {
    return MESSAGE_PRIORITY.HIGH;
  }
  
  // 기타는 정보성
  return MESSAGE_PRIORITY.INFO;
};

/**
 * 메시지 지속시간 결정
 */
export const getMessageDuration = (code) => {
  const type = getMessageType(code);
  const priority = getMessagePriority(code);
  
  if (type === MESSAGE_TYPES.LOADING) return MESSAGE_DURATION.LOADING;
  if (type === MESSAGE_TYPES.CONFIRMATION) return MESSAGE_DURATION.PERMANENT;
  
  switch (priority) {
    case MESSAGE_PRIORITY.CRITICAL:
      return MESSAGE_DURATION.CRITICAL;
    case MESSAGE_PRIORITY.HIGH:
      return MESSAGE_DURATION.HIGH;
    case MESSAGE_PRIORITY.NORMAL:
      return MESSAGE_DURATION.NORMAL;
    case MESSAGE_PRIORITY.LOW:
      return MESSAGE_DURATION.LOW;
    default:
      return MESSAGE_DURATION.INFO;
  }
};

/**
 * 컨텍스트로부터 메시지 코드 추출
 */
export const getContextFromCode = (code) => {
  const codeStr = String(code);
  
  // 인증 관련
  if (codeStr.match(/^(12|21|61)/)) return MESSAGE_CONTEXTS.AUTH;
  
  // 주문 관련
  if (codeStr.match(/^(13|22|31|41|51|62)/)) return MESSAGE_CONTEXTS.ORDER;
  
  // 결제 관련
  if (codeStr.match(/^(14|23|32|42|52|63)/)) return MESSAGE_CONTEXTS.PAYMENT;
  
  // POS 관련
  if (codeStr.match(/^(15|24|33|43|53|64)/)) return MESSAGE_CONTEXTS.POS;
  
  // 배달 관련
  if (codeStr.match(/^(16|25|34|44|54|65)/)) return MESSAGE_CONTEXTS.DELIVERY;
  
  // 매장 관련
  if (codeStr.match(/^(17|26|35|45|55|66)/)) return MESSAGE_CONTEXTS.STORE;
  
  // 시스템 관련
  if (codeStr.match(/^(11|19|20|30|40|50|60|70)/)) return MESSAGE_CONTEXTS.SYSTEM;
  
  return MESSAGE_CONTEXTS.GENERAL;
};

/**
 * 모든 메시지 코드 통합
 */
export const ALL_MESSAGE_CODES = {
  ...ERROR_CODES,
  ...SUCCESS_CODES,
  ...INFO_CODES,
  ...WARNING_CODES,
  ...CONFIRMATION_CODES,
  ...LOADING_CODES,
  ...NOTIFICATION_CODES,
};

/**
 * 레거시 에러 코드 매핑 (하위 호환성)
 */
export const LEGACY_ERROR_MAPPING = {
  1001: 11001, // UNKNOWN_ERROR
  1002: 11002, // VALIDATION_ERROR
  1003: 11003, // NETWORK_ERROR
  2001: 12001, // UNAUTHENTICATED
  2003: 12003, // TOKEN_EXPIRED
  3001: 13001, // ORDER_NOT_FOUND
  4001: 14001, // PAYMENT_FAILED
  5001: 15001, // POS_CONNECTION_ERROR
  // ... 나머지 매핑
};

/**
 * 레거시 코드를 새 코드로 변환
 */
export const mapLegacyCode = (legacyCode) => {
  return LEGACY_ERROR_MAPPING[legacyCode] || legacyCode;
};

export default {
  ERROR_CODES,
  SUCCESS_CODES,
  INFO_CODES,
  WARNING_CODES,
  CONFIRMATION_CODES,
  LOADING_CODES,
  NOTIFICATION_CODES,
  ALL_MESSAGE_CODES,
  MESSAGE_TYPES,
  MESSAGE_CONTEXTS,
  MESSAGE_PRIORITY,
  MESSAGE_DURATION,
  getMessageType,
  getMessagePriority,
  getMessageDuration,
  getContextFromCode,
  mapLegacyCode,
};