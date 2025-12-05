/**
 * ErrorBoundary Component
 * React 에러 경계 구현 - 자식 컴포넌트의 렌더링 에러를 포착하고 처리
 * EnhancedErrorScreen과 통합하여 향상된 에러 UI 제공
 */
import React from 'react';
import EnhancedErrorScreen from '@shared/components/ui/feedback/error/EnhancedErrorScreen';

class ErrorBoundary extends React.Component {
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
    // 에러 발생 시 상태 업데이트
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 에러 로깅 (프로덕션에서는 서버로 전송 가능)
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error);
      if (errorInfo) {
        console.error('Error info:', errorInfo);
      }
    }

    // errorInfo를 상태에 저장
    this.setState({ errorInfo });

    // TODO: 프로덕션 환경에서 에러 리포팅 서비스로 전송
    // crashlytics.recordError(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  handleRetry = () => {
    const { retryCount } = this.state;
    this.setState({
      retryCount: retryCount + 1,
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoBack = () => {
    // navigation이 props로 전달된 경우 뒤로가기
    if (this.props.navigation?.goBack) {
      this.props.navigation.goBack();
    } else {
      // 그렇지 않으면 에러 상태만 리셋
      this.handleReset();
    }
  };

  handleContactSupport = () => {
    // 고객지원 화면으로 이동 또는 지원 채널 열기
    if (this.props.onContactSupport) {
      this.props.onContactSupport();
    } else {
      // 기본 동작: 콘솔에 로그
      console.log('Contact support requested');
    }
  };

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const { fallback, feature = 'Application' } = this.props;

    if (hasError) {
      // 커스텀 fallback이 제공된 경우 사용
      if (fallback) {
        return fallback;
      }

      // 기본적으로 EnhancedErrorScreen 사용
      return (
        <EnhancedErrorScreen
          error={error}
          errorInfo={errorInfo}
          onRetry={retryCount < 3 ? this.handleRetry : null}
          onGoBack={this.handleGoBack}
          onContactSupport={this.handleContactSupport}
          showErrorDetails={__DEV__}
          retryCount={retryCount}
          maxRetries={3}
          feature={feature}
          isRetrying={false}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
