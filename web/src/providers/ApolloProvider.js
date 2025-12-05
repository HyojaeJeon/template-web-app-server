/**
 * Apollo Client 프로바이더
 * GraphQL 클라이언트 전역 설정 및 컨텍스트 제공
 */

import React, { useMemo } from 'react'
import { ApolloProvider as BaseApolloProvider } from '@apollo/client'
import { initializeApollo } from '../lib/apolloClient'

export const ApolloProvider = ({
  children,
  initialState
}) => {
  // Apollo Client 인스턴스를 메모화하여 불필요한 재생성 방지
  const apolloClient = useMemo(() => {
    const client = initializeApollo()

    // SSR에서 전달된 초기 상태가 있다면 캐시에 복원
    if (initialState) {
      // 기존 캐시와 초기 상태를 병합
      const existingCache = client.extract()
      const mergedCache = {
        ...existingCache,
        ...initialState,
      }
      client.cache.restore(mergedCache)
    }

    return client
  }, [initialState])

  return (
    <BaseApolloProvider client={apolloClient}>
      {children}
    </BaseApolloProvider>
  )
}

export default ApolloProvider