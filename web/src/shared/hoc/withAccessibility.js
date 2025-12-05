/**
 * withAccessibility.js - 접근성 강화 HOC
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 */

'use client'

import { useAccessibility } from '../hooks/useAccessibility'

export const withAccessibility = (WrappedComponent, options = {}) => {
  const { focusManagement = true, announceChanges = true } = options

  const AccessibleWrapper = (props) => {
    const { 
      announceToScreenReader, 
      manageFocus, 
      generateAriaIds 
    } = useAccessibility()

    return (
      <WrappedComponent 
        {...props}
        announceToScreenReader={announceToScreenReader}
        manageFocus={manageFocus}
        generateAriaIds={generateAriaIds}
      />
    )
  }

  AccessibleWrapper.displayName = `withAccessibility(${WrappedComponent.displayName || WrappedComponent.name})`
  return AccessibleWrapper
}

export default withAccessibility