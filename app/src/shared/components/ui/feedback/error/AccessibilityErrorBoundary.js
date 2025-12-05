/**
 * 접근성 모듈 전용 ErrorBoundary
 * React 19 + RN 0.78.3 TurboModule 오류 처리
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

class AccessibilityErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorInfo: null,
      retryCount: 0};
  }

  static getDerivedStateFromError(error) {
    // React 19의 엄격한 에러 감지
    const isAccessibilityError = error.message && (
      error.message.includes('NativeAccessibilityInfo') ||
      error.message.includes('NativeAccessibilityManager') ||
      error.message.includes('undefined is not a constructor') ||
      error.message.includes('isReduceMotionEnabled') ||
      error.message.includes('getCurrentReduceMotionState')
    );

    if (isAccessibilityError) {
      console.warn('[CRITICAL] 접근성 모듈 오류 감지:', error.message);
      return {
        hasError: true,
        errorInfo: {
          type: 'accessibility',
          message: error.message,
          timestamp: new Date().toISOString()}};
    }

    // 접근성 관련이 아닌 오류는 상위로 전파
    throw error;
  }

  componentDidCatch(error, errorInfo) {
    console.error('AccessibilityErrorBoundary 오류 포착:', {
      error: error.toString(),
      errorInfo,
      componentStack: errorInfo.componentStack});

    // 접근성 관련 오류 통계 수집 (디버깅용)
    this.logAccessibilityError(error, errorInfo);
  }

  logAccessibilityError = (error, errorInfo) => {
    const errorLog = {
      timestamp: new Date().toISOString(),
      platform: require('react-native').Platform.OS,
      errorType: 'accessibility_module',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount};

    console.group('[DEBUG] 접근성 오류 상세 분석');
    console.log('오류 로그:', errorLog);
    console.log('복구 전략: Legacy Bridge 사용');
    console.groupEnd();
  };

  handleRetry = () => {
    if (this.state.retryCount < 3) {
      console.log(`[SYNC] 접근성 모듈 재시도 ${this.state.retryCount + 1}/3`);

      this.setState(prevState => ({
        hasError: false,
        errorInfo: null,
        retryCount: prevState.retryCount + 1}));
    } else {
      console.warn('[WARNING] 접근성 모듈 재시도 한계 도달, 기본 모드로 계속 진행');
    }
  };

  render() {
    if (this.state.hasError) {
      const { errorInfo, retryCount } = this.state;

      return (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          backgroundColor: '#f8f9fa'}}>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 10,
            textAlign: 'center'}}>
            접근성 모듈 초기화 문제
          </Text>

          <Text style={{
            fontSize: 14,
            color: '#666',
            marginBottom: 20,
            textAlign: 'center'}}>
            TurboModule 초기화 실패로 인한 일시적 문제입니다.{'\n'}
            Legacy Bridge를 사용하여 계속 진행합니다.
          </Text>

          {retryCount < 3 && (
            <TouchableOpacity
              onPress={this.handleRetry}
              style={{
                backgroundColor: '#2AC1BC',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8}}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                재시도 ({retryCount + 1}/3)
              </Text>
            </TouchableOpacity>
          )}

          <Text style={{
            fontSize: 12,
            color: '#999',
            marginTop: 20,
            textAlign: 'center'}}>
            오류 정보: {errorInfo?.message || '알 수 없는 오류'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default AccessibilityErrorBoundary;
