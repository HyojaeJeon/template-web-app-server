/**
 * Apollo Client Provider
 * 기존 apolloClient.js 설정을 활용하는 Provider
 */

import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { ApolloProvider as BaseApolloProvider } from '@apollo/client';
import { initApolloClient } from '@services/apollo/apolloClient';
import logger from '@shared/utils/system/logger';
import i18next from 'i18next';

export const ApolloProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeClient = async () => {
      try {
        const apolloClient = await initApolloClient();
        setClient(apolloClient);
        setIsInitialized(true);
      } catch (err) {
        logger.error('Apollo init failed:', err);
        setIsInitialized(true);
      }
    };

    initializeClient();
  }, []);

  // 초기화 중에는 로딩 화면 표시
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <Text>{i18next.t('app:errors.apolloInitializing')}</Text>
      </View>
    );
  }

  // Apollo Client 초기화 실패 시 children만 렌더링
  if (!client) {
    logger.warn('Apollo Client 없이 앱 실행');
    return <>{children}</>;
  }

  return (
    <BaseApolloProvider client={client}>
      {children}
    </BaseApolloProvider>
  );
};

export default ApolloProvider;
