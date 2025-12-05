/**
 * 통합 에러 시스템 엔트리 포인트
 * 모든 에러 처리는 UnifiedErrorHandler를 통해 수행
 */

// 통합 에러 핸들러 - 모든 에러 처리 로직
export {
  UnifiedErrorHandler as default,
  UnifiedErrorHandler,
  getErrorMessage,
  isRetryableError,
  requiresUserAction,
  getErrorCategory,
  handleError,
  logError,
  extractErrorCode,
  getToastType,
  getSuggestedAction,
  useErrorHandler  // React Hook
} from '@services/error/UnifiedErrorHandler';

// 에러 메시지 및 카테고리 - 단일 진실의 원천
export {
  ERROR_MESSAGES,
  ERROR_CATEGORIES,
  NETWORK_ERRORS,
  VALIDATION_ERRORS,
  AUTH_ERRORS,
  GENERAL_ERRORS
} from '@services/error/errorMessages';