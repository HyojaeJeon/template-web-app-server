/**
 * ErrorProvider
 * 앱 전체 에러 UI 및 상태 관리를 담당하는 Provider
 * 에러 메시지와 코드는 @services/error에서 가져옴
 *
 * 특징:
 * - 중앙집중식 에러 상태 관리
 * - ErrorBoundary로 React 에러 캐치
 * - Modal UI로 에러 표시
 * - 에러 큐 관리 및 재시도 로직
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useToast } from '@providers/ToastProvider';
import Config from 'react-native-config';

// 에러 시스템에서 import (사용하지 않는 import 제거)
import {
  UnifiedErrorHandler,
  getErrorMessage,
  getErrorCategory
} from '@services/error';

// Error Context
const ErrorContext = createContext(null);

// 에러 심각도 (UI 표시용)
export const ERROR_SEVERITY = {
  LOW: 'low',       // 사용자에게 알림만
  MEDIUM: 'medium', // 재시도 가능
  HIGH: 'high',     // 중요한 기능 실패
  CRITICAL: 'critical' // 앱 사용 불가
};

// 에러 심각도 매핑 함수
const mapToUISeverity = (errorCode) => {
  const category = getErrorCategory(errorCode);

  switch(category) {
    case 'AUTH':
    case 'PAYMENT':
      return ERROR_SEVERITY.HIGH;
    case 'NETWORK':
    case 'ORDER':
      return ERROR_SEVERITY.MEDIUM;
    case 'VALIDATION':
      return ERROR_SEVERITY.LOW;
    default:
      return ERROR_SEVERITY.LOW;
  }
};

// Error Modal Component
const ErrorModal = ({ error, onDismiss, onRetry }) => {
  const { t, i18n } = useTranslation();
  const [errorMessage, setErrorMessage] = useState('');
  const [errorIcon, setErrorIcon] = useState('error');

  React.useEffect(() => {
    const loadErrorMessage = async () => {
      if (error?.code) {
        const message = await getErrorMessage(error.code, i18n.language);
        setErrorMessage(message);

        // 카테고리별 아이콘 설정
        const category = getErrorCategory(error.code);
        const iconMap = {
          'NETWORK': 'wifi-off',
          'AUTH': 'lock',
          'PAYMENT': 'credit-card',
          'ORDER': 'shopping-cart',
          'PERMISSION': 'security',
          'VALIDATION': 'warning'
        };
        setErrorIcon(iconMap[category] || 'error');
      }
    };

    loadErrorMessage();
  }, [error, i18n.language]);

  if (!error) return null;

  return (
    <Modal
      visible={!!error}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-xl p-6 w-full max-w-sm">
          {/* Icon */}
          <View className="items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center">
              <Icon name={errorIcon} size={32} color="#EF4444" />
            </View>
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">
            {t('errors.errorModal.title')}
          </Text>

          {/* Message */}
          <Text className="text-gray-600 text-center mb-6">
            {errorMessage || error.message}
          </Text>

          {/* Error Details (개발 모드) */}
          {__DEV__ && error.details && (
            <ScrollView className="max-h-32 mb-4 p-3 bg-gray-100 rounded-lg">
              <Text className="text-xs text-gray-600 font-mono">
                {t('errors.errorModal.code')}: {error.code}{'\n'}
                {t('errors.errorModal.category')}: {getErrorCategory(error.code)}{'\n'}
                {t('errors.errorModal.details')}: {JSON.stringify(error.details, null, 2)}
              </Text>
            </ScrollView>
          )}

          {/* Actions */}
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={onDismiss}
              className="flex-1 py-3 px-4 bg-gray-200 rounded-lg"
            >
              <Text className="text-center font-medium text-gray-700">
                {t('common.actions.close')}
              </Text>
            </TouchableOpacity>

            {error.retryable && onRetry && (
              <TouchableOpacity
                onPress={onRetry}
                className="flex-1 py-3 px-4 bg-blue-500 rounded-lg"
              >
                <Text className="text-center font-medium text-white">
                  {t('common:actions.retry')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Error Boundary Component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // 에러 발생 시 state 업데이트
    return {
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    // 에러 리포팅 (프로덕션)
    if (!__DEV__ && Config?.SENTRY_DSN) {
      // Sentry 등 에러 리포팅 서비스로 전송
      // Sentry.captureException(error, { extra: errorInfo });
    }

    this.setState({
      error,
      errorInfo,
      retryCount: this.state.retryCount + 1
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, maxRetries = 3 } = this.props;
      const { t } = this.props;

      // 최대 재시도 횟수 초과
      if (this.state.retryCount > maxRetries) {
        return (
          <View className="flex-1 bg-white justify-center items-center p-6">
            <Icon name="error-outline" size={64} color="#EF4444" />
            <Text className="text-xl font-bold text-gray-900 mt-4 mb-2">
              {t ? t('errors.errorModal.appProblem') : 'App encountered a problem'}
            </Text>
            <Text className="text-gray-600 text-center mb-6">
              {t ? t('errors.errorModal.restartRequired') : 'Please restart the app if problem persists.'}
            </Text>
            <TouchableOpacity
              onPress={this.handleReset}
              className="px-6 py-3 bg-blue-500 rounded-lg"
            >
              <Text className="text-white font-medium">
                {t ? t('common:actions.retry') : 'Try Again'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      }

      // 커스텀 Fallback 컴포넌트
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            retry={this.handleReset}
            retryCount={this.state.retryCount}
          />
        );
      }

      // 기본 에러 화면
      return (
        <View className="flex-1 bg-white justify-center items-center p-6">
          <Icon name="report-problem" size={64} color="#F59E0B" />
          <Text className="text-xl font-bold text-gray-900 mt-4 mb-2">
            {t ? t('errors.errorModal.temporaryError') : 'A temporary error occurred'}
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            {t ? t('errors.errorModal.tryAgainLater') : 'Please try again later.'}
          </Text>
          <TouchableOpacity
            onPress={this.handleReset}
            className="px-6 py-3 bg-blue-500 rounded-lg"
          >
            <Text className="text-white font-medium">
              {t ? t('common:actions.retry') : 'Try Again'}
            </Text>
          </TouchableOpacity>

          {__DEV__ && (
            <ScrollView className="mt-4 p-4 bg-gray-100 rounded-lg max-h-48">
              <Text className="text-xs text-gray-600 font-mono">
                {this.state.error?.toString()}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </Text>
            </ScrollView>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

// HOC to pass translation to ErrorBoundary
const ErrorBoundaryWithTranslation = ({ children, ...props }) => {
  const { t } = useTranslation();
  return (
    <ErrorBoundary {...props} t={t}>
      {children}
    </ErrorBoundary>
  );
};

// displayName 설정
ErrorBoundaryWithTranslation.displayName = 'ErrorBoundaryWithTranslation';

// Error Provider Component
export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);
  const [currentError, setCurrentError] = useState(null);
  const { showToast } = useToast();
  const errorIdRef = useRef(0);

  // 에러 추가
  const handleError = useCallback(async (error, options = {}) => {
    const {
      showModal = false,
      showToast: shouldShowToast = true,
      retryAction = null
    } = options;

    // UnifiedErrorHandler로 에러 처리
    const processedError = await UnifiedErrorHandler.handleError(error);

    // UI용 에러 객체 생성
    const uiError = {
      id: ++errorIdRef.current,
      code: processedError.code,
      message: processedError.message,
      details: processedError.details || error.details,
      timestamp: Date.now(),
      severity: mapToUISeverity(processedError.code),
      retryable: processedError.isRetryable,
      retryAction,
      category: processedError.category
    };

    // 에러 로깅
    console.error('[ErrorProvider] Error occurred:', uiError);

    // 에러 저장
    setErrors(prev => [...prev, uiError]);

    // 모달 표시 여부 결정
    const shouldShowModal = showModal ||
                          uiError.severity === ERROR_SEVERITY.HIGH ||
                          uiError.severity === ERROR_SEVERITY.CRITICAL;

    if (shouldShowModal) {
      setCurrentError(uiError);
    }

    // Toast 표시
    if (shouldShowToast && !shouldShowModal) {
      showToast(processedError.code || processedError.message);
    }

    return uiError;
  }, [showToast]);

  // 에러 제거
  const clearError = useCallback((errorId) => {
    if (errorId) {
      setErrors(prev => prev.filter(e => e.id !== errorId));
    } else {
      setCurrentError(null);
    }
  }, []);

  // 모든 에러 제거
  const clearAllErrors = useCallback(() => {
    setErrors([]);
    setCurrentError(null);
  }, []);

  // 에러 재시도
  const retryError = useCallback(() => {
    if (currentError?.retryAction) {
      currentError.retryAction();
      clearError();
    }
  }, [currentError, clearError]);

  // GraphQL 에러 처리
  const handleGraphQLError = useCallback(async (error) => {
    // UnifiedErrorHandler가 GraphQL 에러를 처리하도록 위임
    return await handleError(error, {
      showModal: error.networkError ? true : false
    });
  }, [handleError]);

  // API 에러 처리
  const handleAPIError = useCallback(async (error) => {
    const status = error.response?.status;
    const showModal = status === 401 || status === 500 || !error.response;

    return await handleError(error, { showModal });
  }, [handleError]);

  const value = {
    errors,
    currentError,
    handleError,
    clearError,
    clearAllErrors,
    retryError,
    handleGraphQLError,
    handleAPIError,
    ERROR_SEVERITY
  };

  return (
    <ErrorContext.Provider value={value}>
      <ErrorBoundaryWithTranslation>
        {children}
        <ErrorModal
          error={currentError}
          onDismiss={() => clearError()}
          onRetry={currentError?.retryAction ? retryError : null}
        />
      </ErrorBoundaryWithTranslation>
    </ErrorContext.Provider>
  );
};

// useError Hook
export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
};

export default ErrorProvider;