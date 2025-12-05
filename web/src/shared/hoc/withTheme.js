/**
 * withTheme.js - 테마 적용 HOC
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 */

'use client'

import { useDarkMode } from '../hooks/ui/useDarkMode'

export const withTheme = (WrappedComponent, options = {}) => {
  const { defaultTheme = 'light' } = options

  const ThemedWrapper = (props) => {
    const { isDarkMode, toggleDarkMode } = useDarkMode()
    const theme = isDarkMode ? 'dark' : 'light'

    return (
      <div className={`theme-${theme}`}>
        <WrappedComponent 
          {...props} 
          theme={theme} 
          isDarkMode={isDarkMode}
          toggleTheme={toggleDarkMode} 
        />
      </div>
    )
  }

  ThemedWrapper.displayName = `withTheme(${WrappedComponent.displayName || WrappedComponent.name})`
  return ThemedWrapper
}

export default withTheme