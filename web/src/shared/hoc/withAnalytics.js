/**
 * withAnalytics.js - 분석 추적 HOC
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 */

'use client'

import { useEffect } from 'react'

export const withAnalytics = (WrappedComponent, options = {}) => {
  const { trackPageView = true, trackEvents = [], eventData = {} } = options

  const AnalyticsWrapper = (props) => {
    useEffect(() => {
      if (trackPageView && typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
          page_path: window.location.pathname
        })
      }
    }, [])

    return <WrappedComponent {...props} />
  }

  AnalyticsWrapper.displayName = `withAnalytics(${WrappedComponent.displayName || WrappedComponent.name})`
  return AnalyticsWrapper
}

export default withAnalytics