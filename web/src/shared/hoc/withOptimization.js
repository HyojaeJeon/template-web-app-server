/**
 * withOptimization.js - 성능 최적화 HOC
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 */

'use client'

import { memo } from 'react'

export const withOptimization = (WrappedComponent, options = {}) => {
  const { 
    memoize = true, 
    compareProps = null,
    lazyLoad = false 
  } = options

  let OptimizedComponent = WrappedComponent

  if (memoize) {
    OptimizedComponent = memo(WrappedComponent, compareProps)
  }

  if (lazyLoad && typeof window !== 'undefined') {
    // 지연 로딩 로직 구현
    OptimizedComponent = memo(OptimizedComponent)
  }

  OptimizedComponent.displayName = `withOptimization(${WrappedComponent.displayName || WrappedComponent.name})`
  return OptimizedComponent
}

export default withOptimization