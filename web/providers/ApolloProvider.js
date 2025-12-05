'use client';

import React from 'react';
import { ApolloProvider as ApolloClientProvider, ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { tokenManager } from '@/lib/apolloClient';

// GraphQL 엔드포인트 설정
const httpLink = createHttpLink({
  uri: process.env.NODE_ENV === 'production'
    ? 'https://api.deliveryvn.com/graphql'
    : 'http://localhost:4000/graphql',
  credentials: 'include',
});

// 인증 링크 - JWT 토큰 자동 첨부
const authLink = setContext((_, { headers }) => {
  const token = tokenManager.getAccessToken();

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'x-client-type': 'web',
      'x-platform': 'web',
    }
  };
});

// 에러 처리 링크
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        extensions
      );

      // 인증 에러 처리
      if (extensions?.code === 'UNAUTHENTICATED' || extensions?.code === 'UNAUTHORIZED') {
        // 토큰 만료 시 자동 로그아웃 처리 (Redux가 자동으로 처리)
        console.warn('🔐 인증 토큰 만료, 로그인 페이지로 리다이렉트');

        // 로그인 페이지로 리다이렉트 (클라이언트 사이드에서만)
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);

    // 네트워크 에러에 따른 처리
    if (networkError.statusCode === 401) {
      console.warn('🔐 네트워크 인증 에러, 로그인 페이지로 리다이렉트');

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }
});

// Apollo Client 캐시 설정
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Store 관련 쿼리 캐시 정책
        sGetStoreOrders: {
          merge(existing = { orders: [], totalCount: 0 }, incoming) {
            return {
              ...incoming,
              orders: [...(existing.orders || []), ...(incoming.orders || [])],
            };
          },
        },
        sGetStoreMenu: {
          merge(existing = { menuItems: [], categories: [] }, incoming) {
            return {
              ...incoming,
              menuItems: incoming.menuItems || [],
              categories: incoming.categories || [],
            };
          },
        },
        sGetAnalyticsDashboard: {
          merge(existing, incoming) {
            return incoming;
          },
        },
      },
    },
    Store: {
      fields: {
        orders: {
          merge(existing = [], incoming = []) {
            return [...existing, ...incoming];
          },
        },
      },
    },
    Order: {
      keyFields: ['id'],
    },
    MenuItem: {
      keyFields: ['id'],
    },
    MenuCategory: {
      keyFields: ['id'],
    },
    StoreAccount: {
      keyFields: ['id'],
    },
  },
});

// Apollo Client 인스턴스 생성
const client = new ApolloClient({
  link: from([
    errorLink,
    authLink,
    httpLink,
  ]),
  cache,
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  // 개발 환경에서 Apollo DevTools 활성화
  connectToDevTools: process.env.NODE_ENV === 'development',
});

/**
 * Web 전용 Apollo Provider 컴포넌트
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - 하위 컴포넌트들
 */
export default function ApolloProvider({ children }) {
  return (
    <ApolloClientProvider client={client}>
      {children}
    </ApolloClientProvider>
  );
}

// Apollo Client 인스턴스 직접 접근용 (필요시)
export { client as apolloClient };