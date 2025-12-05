// GraphQL 모듈을 가장 먼저 global에 설정
// 중요: 이 설정은 반드시 다른 모든 import보다 먼저 실행되어야 함
import './global.css';
import './src/gql/gqlSetup'; // GraphQL 설정

import React, { useEffect, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { NavigationContainer } from '@react-navigation/native';
import MainNavigator from '@navigation/navigators/MainNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { I18nextProvider } from 'react-i18next';
import { store, persistor } from '@store';
import { setStore } from '@store/storeService';
import { navigationRef } from '@navigation/services/NavigationService';
import i18n, { initializeI18n } from '@shared/i18n';
import { ApolloProvider } from '@providers/ApolloProvider';
import { ToastProvider } from '@providers/ToastProvider';
import { ErrorProvider } from '@providers/ErrorProvider';
import { UnifiedSocketProvider, useSocket } from '@providers/UnifiedSocketProvider';
import { NetworkProvider } from '@providers/NetworkProvider';
import { AppStateProvider } from '@providers/AppStateProvider';
import ThemeProvider from '@providers/ThemeProvider';
import logger from '@shared/utils/system/logger';
import { startTokenMonitoring, checkStoredTokens } from '@utils/tokenMonitor';
import { initializeAuthFromStorage } from '@services/apollo/authCache';
import { AppState } from 'react-native';
import i18next from 'i18next';
import { initializeFlipper } from '@shared/utils/flipper/FlipperSetup';
import { loadCart } from '@features/cart/cartStorage';
import { loadServerConfig } from '@services/apollo/serverConfig';

// DocumentNode 타입 검증 (개발 모드)
if (__DEV__) {
  try {
    const { M_REFRESH_TOKEN } = require('@gql/mutations/auth');
    logger.info('🔍 M_REFRESH_TOKEN DocumentNode 검증:', {
      kind: M_REFRESH_TOKEN?.kind,
      hasDefinitions: Array.isArray(M_REFRESH_TOKEN?.definitions),
      definitionsLength: M_REFRESH_TOKEN?.definitions?.length,
      isValidDocumentNode: !!(M_REFRESH_TOKEN && typeof M_REFRESH_TOKEN === 'object' &&
                             M_REFRESH_TOKEN.kind === 'Document' &&
                             Array.isArray(M_REFRESH_TOKEN.definitions) &&
                             M_REFRESH_TOKEN.definitions.length > 0)
    });
  } catch (error) {
    logger.error('❌ M_REFRESH_TOKEN import 실패:', error);
  }
}

// 중앙 Store 서비스에 주입 (글로벌 객체 사용 지양)
setStore(store);



// SafeAreaProvider displayName 설정 강화 (react-native-css-interop 오류 방지)
// NativeWind와 충돌을 방지하기 위해 조건부로 설정
try {
  // 1. 현재 import된 SafeAreaProvider 처리
  if (SafeAreaProvider &&
      typeof SafeAreaProvider === 'function' &&
      !SafeAreaProvider.displayName) {
    SafeAreaProvider.displayName = 'SafeAreaProvider';
  }

  // 2. react-native-safe-area-context 모듈에서도 안전하게 설정
  const safeAreaContext = require('react-native-safe-area-context');

  // 모든 export된 컴포넌트들에 displayName 설정
  const componentsToFix = [
    'SafeAreaProvider',
    'SafeAreaView',
    'SafeAreaInsetsContext',
    'SafeAreaFrameContext',
    'SafeAreaConsumer',
    'withSafeAreaInsets',
    'useSafeAreaInsets',
    'useSafeAreaFrame',
    'initialWindowMetrics'
  ];

  componentsToFix.forEach(name => {
    const component = safeAreaContext?.[name];
    if (component && typeof component === 'function' && !component.displayName) {
      component.displayName = name;
    }
    // Context Provider/Consumer도 처리
    if (component?.Provider && !component.Provider.displayName) {
      component.Provider.displayName = `${name}.Provider`;
    }
    if (component?.Consumer && !component.Consumer.displayName) {
      component.Consumer.displayName = `${name}.Consumer`;
    }
  });

  console.log('✅ SafeAreaProvider 및 관련 컴포넌트 displayName 설정 완료');
} catch (error) {
  console.warn('⚠️ SafeAreaProvider displayName 설정 실패:', error);
  // 오류가 나도 앱이 중단되지 않도록 처리
}

// react-i18next 컴포넌트 displayName 설정 강화
try {
  // 1. 현재 import된 I18nextProvider 처리
  if (I18nextProvider &&
      typeof I18nextProvider === 'function' &&
      !I18nextProvider.displayName) {
    I18nextProvider.displayName = 'I18nextProvider';
  }

  // 2. react-i18next 모듈에서도 처리
  const reactI18next = require('react-i18next');
  if (reactI18next?.I18nextProvider &&
      typeof reactI18next.I18nextProvider === 'function' &&
      !reactI18next.I18nextProvider.displayName) {
    reactI18next.I18nextProvider.displayName = 'I18nextProvider';
  }

  // 3. useTranslation 관련 컴포넌트들도 처리
  if (reactI18next?.Trans &&
      typeof reactI18next.Trans === 'function' &&
      !reactI18next.Trans.displayName) {
    reactI18next.Trans.displayName = 'Trans';
  }

  console.log('✅ react-i18next 컴포넌트 displayName 설정 완료');
} catch (error) {
  console.warn('⚠️ react-i18next displayName 설정 실패:', error);
  // 오류가 나도 앱이 중단되지 않도록 처리
}

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        logger.info('🚀 앱 초기화 시작');

        // === 0단계: 서버 설정 로드 (개발 모드) ===
        if (__DEV__) {
          logger.info('🔧 서버 설정 로드 중...');
          const serverConfig = await loadServerConfig();
          logger.info('🔧 서버 설정 로드 완료:', serverConfig);
        }

        // === 1단계: i18n 초기화 ===
        logger.info('📚 i18n 초기화 시작...');
        await initializeI18n();

        // i18n 초기화 완료 대기 및 검증 (강화된 체크)
        const maxRetries = 15;
        let retries = 0;
        while ((!i18n.isInitialized || typeof i18n.t !== 'function') && retries < maxRetries) {
          logger.info(`⏳ i18n 초기화 대기 중... (${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 150));
          retries++;
        }

        if (!i18n.isInitialized || typeof i18n.t !== 'function') {
          throw new Error('i18n 초기화 타임아웃 또는 t 함수 없음');
        }

        // i18n 기능 테스트
        try {
          const testResult = i18n.t('common:loading', 'Loading...');
          logger.info(`✅ i18n 기능 테스트 성공: "${testResult}"`);
        } catch (testError) {
          logger.warn('⚠️ i18n 기능 테스트 실패:', testError);
        }

        logger.info(`✅ i18n 초기화 완료 - 언어: ${i18n.language}, 네임스페이스: ${Object.keys(i18n.services.resourceStore.data[i18n.language] || {})}`);

        // === 2단계: Apollo Client 초기화 확인 (ApolloProvider가 처리) ===
        // ApolloProvider 내부에서 자동으로 초기화됨
        logger.info('✅ Apollo Client Provider 준비 완료');

        // === 3단계: Apollo Cache 인증 상태 초기화 ===
        // Apollo Client가 준비될 때까지 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 100));

        logger.info('🔐 Apollo Cache 인증 상태 초기화...');
        const authInitialized = await initializeAuthFromStorage();
        logger.info(`🔐 인증 상태 초기화 완료: ${authInitialized ? '인증됨' : '비인증'}`);

        // === 4단계: 토큰 상태 초기 확인 ===
        await checkStoredTokens();

        // === 4.5단계: 장바구니 로컬 스토리지에서 복원 ===
        logger.info('🛒 장바구니 로컬 스토리지에서 복원 중...');
        const cartItems = await loadCart();
        logger.info(`🛒 장바구니 복원 완료: ${cartItems?.length || 0}개 아이템`);

        // === 5단계: Flipper 플러그인 초기화 (개발 모드에서만) ===
        if (__DEV__) {
          logger.info('🔧 Flipper 플러그인 초기화...');
          initializeFlipper();
        }

        setIsInitialized(true);
        logger.info('🎉 앱 초기화 완료');
      } catch (error) {
        // 안전한 에러 객체 보장
        const safeError = error || new Error('Unknown initialization error');
        logger.error('❌ 앱 초기화 실패:', safeError);

        // i18n 초기화 실패 시 강제로 한국어로 초기화 시도
        try {
          logger.info('🔄 i18n 복구 시도...');
          await i18n.changeLanguage('ko');
          logger.info('✅ i18n 복구 완료');
        } catch (fallbackError) {
          // 안전한 에러 객체 보장
          const safeFallbackError = fallbackError || new Error('Unknown fallback error');
          logger.error('❌ i18n 복구 실패:', safeFallbackError);
        }

        // 에러가 나도 앱은 실행되도록
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    // 토큰 모니터링 시작 (10초마다 체크)
    const stopMonitoring = startTokenMonitoring(10000);

    // 앱 상태 변경 감지 (포그라운드로 돌아올 때 토큰 체크)
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // 로그 제거 - 백그라운드에서 자동 체크
        checkStoredTokens();
      }
    });

    // 클린업
    return () => {
      stopMonitoring();
      appStateSubscription.remove();
    };
  }, []);

  if (!isInitialized) {
    return (
      <View className="flex-1 bg-gray-100 items-center justify-center">
        <Text className="text-2xl font-bold text-gray-800 text-center">
          {i18next.t('common:loading')}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ApolloProvider>
            <I18nextProvider i18n={i18n}>
              <ThemeProvider>
                <SafeAreaProvider>
                  <ToastProvider>
                    <NetworkProvider>
                      <ErrorProvider>
                        <AppStateProvider>
                          <UnifiedSocketProvider>
                             <NavigationContainer
                               ref={navigationRef}
                             >
                              <MainNavigator/>
                             </NavigationContainer>
                          </UnifiedSocketProvider>
                        </AppStateProvider>
                      </ErrorProvider>
                    </NetworkProvider>
                  </ToastProvider>
                </SafeAreaProvider>
              </ThemeProvider>
            </I18nextProvider>
          </ApolloProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};


export default App;
