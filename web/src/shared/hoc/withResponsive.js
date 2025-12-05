/**
 * withResponsive.js - 반응형 처리 HOC
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 */

'use client'

import { useWindowSize } from '../hooks/ui/useWindowSize'

export const withResponsive = (WrappedComponent, options = {}) => {
  const { breakpoints = {} } = options

  const ResponsiveWrapper = (props) => {
    const { width, height, isMobile, isTablet, isDesktop } = useWindowSize()

    return (
      <WrappedComponent 
        {...props}
        screenWidth={width}
        screenHeight={height}
        isMobile={isMobile}
        isTablet={isTablet}
        isDesktop={isDesktop}
      />
    )
  }

  ResponsiveWrapper.displayName = `withResponsive(${WrappedComponent.displayName || WrappedComponent.name})`
  return ResponsiveWrapper
}

export default withResponsive