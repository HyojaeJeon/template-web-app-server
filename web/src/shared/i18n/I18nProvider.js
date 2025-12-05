/**
 * I18n Provider Component
 * Local App MVP 다국어 시스템 Provider
 * React 컴포넌트 트리에 i18n 컨텍스트 제공
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useTranslation as useI18nTranslation, I18nProvider as BaseI18nProvider, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './index'

// 지원 언어 목록
const supportedLanguages = Object.values(SUPPORTED_LANGUAGES)

/**
 * i18n Provider 컴포넌트 (Re-export)
 * 앱 전체에 다국어 컨텍스트 제공
 */
export const I18nProvider = BaseI18nProvider

// 언어 정보 조회 함수
const getCurrentLanguageInfo = (language = DEFAULT_LANGUAGE) => {
  return SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE]
}

/**
 * i18n 컨텍스트 hook (Re-export)
 * 컴포넌트에서 다국어 기능 사용
 */
export const useI18nContext = useI18nTranslation

/**
 * 향상된 번역 hook
 * 기본 useTranslation에 추가 기능 제공
 */
export const useAppTranslation = (namespace = 'common') => {
  const { t, language } = useI18nTranslation()
  const currentLanguage = language
  const isLoading = false
  const ready = true

  /**
   * 안전한 번역 함수
   * 키가 없을 경우 fallback 값 또는 키 자체 반환
   */
  const safeT = (key, options = {}) => {
    if (!ready || isLoading) {
      return options.fallback || key
    }

    try {
      const translated = t(key, options)
      
      // 번역이 키와 같으면 (번역되지 않음) fallback 반환
      if (translated === key && options.fallback) {
        return options.fallback
      }
      
      return translated
    } catch (error) {
      console.error(`번역 오류 - 키: ${key}`, error)
      return options.fallback || key
    }
  }

  /**
   * 복수형 번역 함수
   */
  const pluralT = (key, count, options = {}) => {
    return safeT(key, { 
      ...options, 
      count,
      defaultValue: options.fallback 
    })
  }

  /**
   * 네임스페이스를 지정한 번역 함수
   */
  const nsT = (namespace, key, options = {}) => {
    return safeT(`${namespace}:${key}`, options)
  }

  /**
   * 에러 메시지 번역 함수
   */
  const errorT = (errorCode, options = {}) => {
    return nsT('errors', `codes.${errorCode}`, {
      fallback: nsT('errors', 'common.somethingWentWrong', {
        fallback: '문제가 발생했습니다'
      }),
      ...options
    })
  }

  return {
    t: safeT,
    pluralT,
    nsT,
    errorT,
    currentLanguage,
    isReady: ready && !isLoading,
    i18n: null
  }
}

/**
 * 날짜/시간 포맷팅 hook
 */
export const useDateTimeFormat = () => {
  const { language: currentLanguage } = useI18nTranslation()

  const formatDate = (date, options = {}) => {
    return new Intl.DateTimeFormat(currentLanguage, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    }).format(new Date(date))
  }

  const formatTime = (date, options = {}) => {
    return new Intl.DateTimeFormat(currentLanguage, {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }).format(new Date(date))
  }

  const formatDateTime = (date, options = {}) => {
    return new Intl.DateTimeFormat(currentLanguage, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }).format(new Date(date))
  }

  const formatRelativeTime = (date) => {
    const now = new Date()
    const targetDate = new Date(date)
    const diffInSeconds = Math.floor((now - targetDate) / 1000)

    // RTF (Relative Time Format) 사용
    const rtf = new Intl.RelativeTimeFormat(currentLanguage, { 
      numeric: 'auto',
      style: 'narrow'
    })

    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(-diffInSeconds, 'second')
    } else if (Math.abs(diffInSeconds) < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute')
    } else if (Math.abs(diffInSeconds) < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour')
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day')
    }
  }

  return {
    formatDate,
    formatTime,
    formatDateTime,
    formatRelativeTime,
    currentLanguage
  }
}

/**
 * 숫자/통화 포맷팅 hook
 */
export const useNumberFormat = () => {
  const { language: currentLanguage } = useI18nTranslation()

  const formatCurrency = (amount, options = {}) => {
    const currency = currentLanguage === 'vi' ? 'VND' : 
                    currentLanguage === 'ko' ? 'KRW' : 'USD'

    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'VND' ? 0 : 2,
      ...options
    }).format(amount)
  }

  const formatNumber = (number, options = {}) => {
    return new Intl.NumberFormat(currentLanguage, options).format(number)
  }

  const formatPercentage = (value, options = {}) => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'percent',
      minimumFractionDigits: 1,
      ...options
    }).format(value / 100)
  }

  return {
    formatCurrency,
    formatNumber,
    formatPercentage,
    currentLanguage
  }
}

export default I18nProvider