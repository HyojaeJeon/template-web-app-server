'use client';

import React from 'react';
import ReduxProvider from '@/providers/ReduxProvider';
import ApolloProvider from '@/providers/ApolloProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from 'next-themes';
import { I18nProvider } from '@/shared/i18n';
import { UnifiedSocketProvider } from '@/providers/UnifiedSocketProvider';
import { ToastProvider } from '@/shared/providers/ToastProvider';

/**
 * 최소한의 Provider 구조
 * - Redux Persist가 자동으로 인증 상태 복원
 * - SimpleAuthInitializer 제거 (Redux Persist와 충돌 방지)
 */
export default function Providers({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={false}
      themes={['light', 'dark']}
    >
      <I18nProvider>
        <ApolloProvider>
          <ReduxProvider>
            <ToastProvider>
              <AuthProvider>
                <UnifiedSocketProvider>
                  {children}
                </UnifiedSocketProvider>
              </AuthProvider>
            </ToastProvider>
          </ReduxProvider>
        </ApolloProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
