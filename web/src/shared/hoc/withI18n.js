/**
 * withI18n.js - 다국어 지원 HOC
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 */

'use client'

import { useAppTranslation } from '../i18n/I18nProvider'

export const withI18n = (WrappedComponent, options = {}) => {
  const { namespace = 'common' } = options

  const I18nWrapper = (props) => {
    const { t, language, changeLanguage } = useAppTranslation(namespace)

    return (
      <WrappedComponent 
        {...props} 
        t={t} 
        language={language} 
        changeLanguage={changeLanguage} 
      />
    )
  }

  I18nWrapper.displayName = `withI18n(${WrappedComponent.displayName || WrappedComponent.name})`
  return I18nWrapper
}

export default withI18n