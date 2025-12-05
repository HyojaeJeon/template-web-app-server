/**
 * 통합 에러 핸들러
 * 서버 에러와 클라이언트 에러를 모두 처리하는 단일 시스템
 * React Hook 포함
 */

import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ERROR_MESSAGES, ERROR_CATEGORIES } from '@services/error/errorMessages';

/**
 * 현재 언어 설정 가져오기
 */
const getCurrentLanguage = async () => {
  try {
    const language = await AsyncStorage.getItem('userLanguage');
    return language || 'vi'; // 기본값: Local어
  } catch {
    return 'vi';
  }
};

/**
 * 에러 코드로 에러 정보 가져오기
 */
const getErrorInfo = (errorCode) => {
  return ERROR_MESSAGES[errorCode] || null;
};

/**
 * 에러 카테고리 가져오기 (내부 헬퍼 함수)
 */
const getErrorCategoryInternal = (errorCode) => {
  for (const [category, info] of Object.entries(ERROR_CATEGORIES)) {
    if (info.codes.includes(errorCode)) {
      return category;
    }
  }

  // 서버 에러 코드 체크 (M으로 시작)
  if (errorCode?.startsWith('M')) {
    const categoryNum = parseInt(errorCode.substring(1, 2));
    const serverCategories = {
      1: 'SYSTEM',
      2: 'AUTH',
      6: 'PROFILE',
      8: 'NOTIFICATION',
      9: 'LOCATION'
    };
    return serverCategories[categoryNum] || 'GENERAL';
  }

  return 'GENERAL';
};

/**
 * 통합 에러 핸들러 클래스
 */
export class UnifiedErrorHandler {
  /**
   * 에러 처리 메인 함수
   */
  static async handleError(error) {
    // GraphQL 에러 처리
    if (error.graphQLErrors?.length > 0) {
      return await this.handleGraphQLError(error);
    }

    // 네트워크 에러 처리
    if (error.networkError) {
      return await this.handleNetworkError(error.networkError);
    }

    // 클라이언트 에러 코드가 있는 경우
    if (error.code && ERROR_MESSAGES[error.code]) {
      return await this.handleClientError(error.code, error.details);
    }

    // 유효성 검사 에러 (필드명과 함께 전달되는 경우)
    if (error.validationErrors) {
      return await this.handleValidationErrors(error.validationErrors);
    }

    // 알 수 없는 에러
    return await this.handleUnknownError(error);
  }

  /**
   * GraphQL 에러 처리
   * 서버에서 이미 다국어 처리된 메시지를 반환
   */
  static async handleGraphQLError(error) {
    const graphQLError = error.graphQLErrors[0];
    const extensions = graphQLError.extensions || {};
    const serverMessage = graphQLError.message;

    // 1) 서버 확장 필드에 직접 실코드가 담겨오는 경우 (errorCode: 'M2003')
    let rawServerCode = extensions.errorCode || null;

    // 2) code 필드가 키 문자열인 경우 (예: 'ACCESS_TOKEN_EXPIRED' 또는 '[M2005]CUSTOMER_NOT_FOUND')
    //    - 대괄호에 감싼 서버 코드 추출 시도
    if (!rawServerCode && typeof extensions.code === 'string') {
      const bracketMatch = extensions.code.match(/\[([M]\d{4})\]/);
      if (bracketMatch) {
        rawServerCode = bracketMatch[1];
      }
    }

    // 3) 토큰 만료 키워드만 온 경우를 위한 보조 매핑
    //    - 서버가 ACCESS_TOKEN_EXPIRED/TOKEN_EXPIRED만 보낸 경우 서버 코드로 M2003 간주
    if (!rawServerCode && (extensions.code === 'ACCESS_TOKEN_EXPIRED' || extensions.code === 'TOKEN_EXPIRED')) {
      rawServerCode = 'M2003';
    }

    const code = rawServerCode || null;

    return {
      type: 'SERVER_ERROR',
      code,
      message: serverMessage, // 서버에서 이미 다국어 처리됨
      category: getErrorCategoryInternal(code || extensions.code),
      severity: this.getErrorSeverity(code),
      isRetryable: this.isRetryableError(code || extensions.code),
      requiresAuth: this.isAuthError(code || extensions.code),
      requiresTokenRefresh: code === 'M2003' || extensions.code === 'ACCESS_TOKEN_EXPIRED' || extensions.code === 'TOKEN_EXPIRED' || code === 'M2012',
      requiresLogout: code === 'M2004' || code === 'M2011'
    };
  }

  /**
   * 네트워크 에러 처리
   */
  static async handleNetworkError(error) {
    const language = await getCurrentLanguage();
    let errorCode = 'C1001'; // 기본: NETWORK_TIMEOUT

    if (error.message?.includes('timeout')) {
      errorCode = 'C1001'; // NETWORK_TIMEOUT
    } else if (!navigator.onLine) {
      errorCode = 'C1002'; // NETWORK_OFFLINE
    } else if (error.message?.includes('SSL')) {
      errorCode = 'C1005'; // SSL_ERROR
    } else {
      errorCode = 'C1004'; // SERVER_UNREACHABLE
    }

    const errorInfo = getErrorInfo(errorCode);

    return {
      type: 'NETWORK_ERROR',
      code: errorCode,
      message: errorInfo.message[language],
      category: 'NETWORK',
      severity: errorInfo.severity,
      isRetryable: errorInfo.retryable,
      requiresAuth: false
    };
  }

  /**
   * 클라이언트 에러 처리
   */
  static async handleClientError(errorCode, details = {}) {
    const language = await getCurrentLanguage();
    const errorInfo = getErrorInfo(errorCode);

    if (!errorInfo) {
      return await this.handleUnknownError({ code: errorCode, details });
    }

    return {
      type: 'CLIENT_ERROR',
      code: errorCode,
      message: errorInfo.message[language],
      category: getErrorCategoryInternal(errorCode),
      severity: errorInfo.severity,
      isRetryable: errorInfo.retryable,
      requiresAuth: errorInfo.requiresAuth || false,
      details
    };
  }

  /**
   * 유효성 검사 에러 처리
   */
  static async handleValidationErrors(validationErrors) {
    const language = await getCurrentLanguage();
    const errors = [];

    for (const [field, errorCode] of Object.entries(validationErrors)) {
      const errorInfo = getErrorInfo(errorCode);
      if (errorInfo) {
        errors.push({
          field,
          code: errorCode,
          message: errorInfo.message[language]
        });
      }
    }

    return {
      type: 'VALIDATION_ERROR',
      code: 'C2501', // VALIDATION_REQUIRED_FIELD
      message: errors[0]?.message || ERROR_MESSAGES['C2501'].message[language],
      category: 'VALIDATION',
      severity: 'warning',
      isRetryable: false,
      requiresAuth: false,
      validationErrors: errors
    };
  }

  /**
   * 알 수 없는 에러 처리
   */
  static async handleUnknownError(error) {
    const language = await getCurrentLanguage();
    const errorInfo = getErrorInfo('C9001'); // UNKNOWN_ERROR

    console.error('Unknown error:', error);

    // Redux 직렬화 문제 방지를 위해 originalError 제거
    // 대신 에러 정보를 안전한 형태로 저장
    const safeErrorInfo = {
      message: error?.message || 'Unknown error',
      name: error?.name,
      code: error?.code,
      stack: error?.stack ? error.stack.substring(0, 500) : null // 스택은 일부만 저장
    };

    return {
      type: 'UNKNOWN_ERROR',
      code: 'C9001',
      message: errorInfo.message[language],
      category: 'GENERAL',
      severity: 'error',
      isRetryable: true,
      requiresAuth: false,
      errorDetails: safeErrorInfo // originalError 대신 안전한 객체 사용
    };
  }

  /**
   * 에러 심각도 판단
   */
  static getErrorSeverity(errorCode) {
    const errorInfo = getErrorInfo(errorCode);
    return errorInfo?.severity || 'error';
  }

  /**
   * 재시도 가능한 에러인지 판단
   */
  static isRetryableError(errorCode) {
    const errorInfo = getErrorInfo(errorCode);
    return errorInfo?.retryable || false;
  }

  /**
   * 인증 에러인지 판단
   */
  static isAuthError(errorCode) {
    if (!errorCode) return false;

    // 클라이언트 인증 에러 (C3xxx)
    if (errorCode.startsWith('C3')) return true;

    // 서버 인증 에러 (M2xxx)
    if (errorCode.startsWith('M2')) return true;

    return false;
  }

  /**
   * 로그아웃이 필요한 에러인지 판단
   * authSlice에서 사용하기 위한 정적 메서드
   */
  static requiresLogout(errorCode) {
    if (!errorCode) return false;

    // 서버에서 정의된 로그아웃 필요 에러 코드
    // M2004: INVALID_CREDENTIALS
    // M2011: INVALID_REFRESH_TOKEN
    return errorCode === 'M2004' || errorCode === 'M2011';
  }

  /**
   * 에러 코드로 Toast 타입 결정
   */
  static getToastType(errorCode) {
    const errorInfo = getErrorInfo(errorCode);
    const severity = errorInfo?.severity || 'error';

    const severityToToastType = {
      'error': 'error',
      'warning': 'warning',
      'info': 'info',
      'success': 'success'
    };

    return severityToToastType[severity] || 'error';
  }

  /**
   * 에러에 따른 사용자 액션 제안
   */
  static getSuggestedAction(errorCode) {
    const category = getErrorCategoryInternal(errorCode);

    const actionMap = {
      'NETWORK': 'RETRY',
      'VALIDATION': 'FIX_INPUT',
      'AUTH': 'LOGIN_REQUIRED',
      'PERMISSION': 'GRANT_PERMISSION',
      'GENERAL': 'RETRY'
    };

    return actionMap[category] || 'DISMISS';
  }

  /**
   * Redux Thunk에서 사용할 통합 에러 처리
   */
  static async processError(error) {
    return await this.handleError(error);
  }

  /**
   * 에러를 Toast 메시지로 포맷
   */
  static async formatForToast(error) {
    const processedError = await this.handleError(error);

    return {
      type: this.getToastType(processedError.code),
      message: processedError.message,
      duration: processedError.severity === 'error' ? 5000 : 3000,
      action: this.getSuggestedAction(processedError.code)
    };
  }
}

// Helper 함수들 export
export const getErrorMessage = async (errorCode, lang = null) => {
  const language = lang || await getCurrentLanguage();
  const errorInfo = getErrorInfo(errorCode);

  if (!errorInfo) {
    return ERROR_MESSAGES['C9001'].message[language]; // UNKNOWN_ERROR
  }

  return errorInfo.message[language] || errorInfo.message.vi;
};

export const isRetryableError = (errorCode) => {
  const errorInfo = getErrorInfo(errorCode);
  return errorInfo?.retryable || false;
};

export const requiresUserAction = (errorCode) => {
  const category = getErrorCategoryInternal(errorCode);
  return ['VALIDATION', 'AUTH', 'PERMISSION'].includes(category);
};

export const getErrorCategory = (errorCode) => {
  return getErrorCategoryInternal(errorCode);
};

/**
 * 간편 에러 처리 함수
 */
export const handleError = async (error, context = {}) => {
  console.error(`[${context.module || 'App'}] Error:`, error);

  // 통합 시스템으로 처리
  const processedError = await UnifiedErrorHandler.handleError(error);

  return {
    ...processedError,
    ...context
  };
};

/**
 * 에러 로깅
 */
export const logError = (error, metadata = {}) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: error.message || error,
    code: error.code,
    type: error.type,
    stack: error.stack,
    ...metadata
  };

  console.error('[Error Log]', errorLog);

  // 프로덕션에서는 에러 추적 서비스로 전송
  // if (!__DEV__) {
  //   // Sentry, Crashlytics 등으로 전송
  // }
};

/**
 * GraphQL 에러에서 에러 코드 추출
 */
export const extractErrorCode = (error) => {
  // GraphQL 에러의 extensions에서 코드 추출
  if (error?.extensions?.code) {
    const codeMatch = error.extensions.code.match(/\[([CM]\d{4})\]/);
    if (codeMatch) {
      return codeMatch[1];
    }
    return error.extensions.code;
  }

  // 에러 메시지에서 코드 패턴 추출
  const codeMatch = error?.message?.match(/\[([CM]\d{4})\]/);
  if (codeMatch) {
    return codeMatch[1];
  }

  // 기본 에러 코드 반환
  return 'C9001'; // UNKNOWN_ERROR
};

/**
 * 에러 코드로부터 Toast 타입 결정
 */
export const getToastType = (errorCode) => {
  return UnifiedErrorHandler.getToastType(errorCode);
};

/**
 * 에러에 따른 사용자 액션 제안
 */
export const getSuggestedAction = (errorCode) => {
  return UnifiedErrorHandler.getSuggestedAction(errorCode);
};

/**
 * React Hook: 에러 처리 커스텀 훅
 * 통합 에러 시스템과 Toast를 연결 (안전한 주입 방식)
 */
export const useErrorHandler = (toastFunction = null) => {
  /**
   * 에러 처리 및 Toast 표시 - 안전한 버전
   */
  const handleError = useCallback(async (error, options = {}) => {
    try {
      // 에러 처리
      const processedError = await UnifiedErrorHandler.handleError(error);

      // 옵션 설정
      const {
        showToast: shouldShowToast = true,
        logError: shouldLogError = true,
        customMessage = null
      } = options;

      // 에러 로깅
      if (shouldLogError) {
        console.error('[Error]', processedError);
      }

      // 토큰 관련 에러는 사용자에게 표시하지 않음
      if (processedError.requiresTokenRefresh) {
        console.log('[SILENT] Token refresh error handled, no toast shown to user');
        // 토큰 갱신 관련 에러는 Toast 표시하지 않음
      } else if (processedError.code === 'M5009' || processedError.code === 'STORE_MISMATCH') {
        // 전용 모달로 처리 → 토스트/에러 노출 금지
        console.log('[SILENT] Mismatch handled by modal, suppressing toast');
      } else if (shouldShowToast && toastFunction && typeof toastFunction === 'function') {
        // Toast 표시 - 안전한 주입 방식
        try {
          const messageToShow = customMessage || processedError.code || processedError.message;
          toastFunction(messageToShow);
        } catch (toastError) {
          console.warn('Toast 표시 실패:', toastError);
          console.warn('원본 에러:', processedError.code || processedError.message);
        }
      } else if (shouldShowToast && !toastFunction) {
        // Toast 함수가 주입되지 않은 경우 안전하게 처리
        console.warn('Toast 함수가 주입되지 않음. 에러:', processedError.code || processedError.message);
      }

      // 특별한 처리가 필요한 경우
      if (processedError.requiresAuth) {
        // 로그인 필요한 경우 처리
        // navigation.navigate('Login');
      }

      if (processedError.requiresTokenRefresh) {
        // 토큰 갱신 필요한 경우 처리
        // await refreshToken();
      }

      if (processedError.requiresLogout) {
        // 로그아웃 필요한 경우 처리
        // await logout();
      }

      return processedError;
    } catch (err) {
      console.error('[Error Handler Failed]', err);
      return { code: 'C9001', message: 'Unknown error occurred' };
    }
  }, [toastFunction]);

  /**
   * 유효성 검사 에러 처리
   */
  const handleValidationError = useCallback((field, errorCode) => {
    // 유효성 검사 에러 코드 직접 표시
    // showToast(errorCode); - 컴포넌트에서 처리
    console.warn('Validation error:', errorCode);

    return {
      field,
      code: errorCode
    };
  }, []);

  /**
   * 네트워크 에러 처리
   */
  const handleNetworkError = useCallback(async (error) => {
    const processedError = await UnifiedErrorHandler.handleNetworkError(error);
    // showToast(processedError.code); - 컴포넌트에서 처리
    console.warn('Network error:', processedError.code);
    return processedError;
  }, []);

  /**
   * 성공 메시지 표시
   */
  const showSuccess = useCallback((messageCode) => {
    // showToast(messageCode); - 컴포넌트에서 처리
    console.log('Success message:', messageCode);
    return { code: messageCode, type: 'success' };
  }, []);

  /**
   * 경고 메시지 표시
   */
  const showWarning = useCallback((messageCode) => {
    // showToast(messageCode); - 컴포넌트에서 처리
    console.warn('Warning message:', messageCode);
    return { code: messageCode, type: 'warning' };
  }, []);

  /**
   * 정보 메시지 표시
   */
  const showInfo = useCallback((messageCode) => {
    // showToast(messageCode); - 컴포넌트에서 처리
    console.info('Info message:', messageCode);
    return { code: messageCode, type: 'info' };
  }, []);

  return {
    handleError,
    handleValidationError,
    handleNetworkError,
    showSuccess,
    showWarning,
    showInfo
  };
};

// 기본 export
export default UnifiedErrorHandler;
