/**
 * withCache.js - 캐시 관리 HOC
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 */

'use client'

import { useCache } from '../hooks/data/useCache'

export const withCache = (WrappedComponent, options = {}) => {
  const { cacheKey, ttl = 300000 } = options

  const CachedWrapper = (props) => {
    const { getCachedData, setCachedData, clearCache } = useCache({ ttl })

    return (
      <WrappedComponent 
        {...props} 
        getCachedData={getCachedData}
        setCachedData={setCachedData}
        clearCache={clearCache}
      />
    )
  }

  CachedWrapper.displayName = `withCache(${WrappedComponent.displayName || WrappedComponent.name})`
  return CachedWrapper
}

export default withCache