/**
 * useSessionStorage.js - 세션스토리지 동기화 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 세션스토리지와 React 상태 자동 동기화
 * - 타입 안전성 보장 (JSON serialization)
 * - 에러 처리 및 폴백 메커니즘
 * - SSR 호환성 (hydration 이슈 방지)
 * - Local어 에러 메시지 지원
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppTranslation } from '../i18n/I18nProvider'

/**
 * 세션스토리지 값 검증
 */
const isValidValue = (value) => {
  try {
    JSON.stringify(value)
    return true
  } catch {
    return false
  }
}

/**
 * 세션스토리지 훅
 * @param {string} key 저장소 키
 * @param {any} defaultValue 기본값
 * @param {Object} options 설정 옵션
 * @param {Function} options.serialize 직렬화 함수
 * @param {Function} options.deserialize 역직렬화 함수
 * @param {Function} options.onError 에러 핸들러
 * @param {boolean} options.syncAcrossTabs 탭 간 동기화 여부 (기본: true)
 */
export const useSessionStorage = (
  key,
  defaultValue,
  options = {}
) => {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    onError,
    syncAcrossTabs = true
  } = options

  const { errorT } = useAppTranslation()
  const [storedValue, setStoredValue] = useState(defaultValue)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const isInitialized = useRef(false)

  // 세션스토리지에서 값 읽기
  const readValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return defaultValue
    }

    try {
      const item = window.sessionStorage.getItem(key)
      if (item === null) {
        return defaultValue
      }
      return deserialize(item)
    } catch (error) {
      console.error(`세션스토리지 읽기 오류 (key: ${key}):`, error)
      onError?.(error)
      setError(error)
      return defaultValue
    }
  }, [key, defaultValue, deserialize, onError])

  // 초기값 설정
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized.current) {
      return
    }

    try {
      const initialValue = readValue()
      setStoredValue(initialValue)
      setError(null)
    } catch (error) {
      console.error('세션스토리지 초기화 오류:', error)
      setError(error)
    } finally {
      setIsLoading(false)
      isInitialized.current = true
    }
  }, [readValue])

  // 값 저장
  const setValue = useCallback((value) => {
    if (typeof window === 'undefined') {
      console.warn('세션스토리지는 클라이언트에서만 사용 가능합니다')
      return
    }

    try {
      // 함수인 경우 현재 값을 인자로 호출
      const valueToStore = value instanceof Function ? value(storedValue) : value

      // 유효성 검사
      if (!isValidValue(valueToStore)) {
        throw new Error('직렬화할 수 없는 값입니다')
      }

      // 세션스토리지에 저장
      const serializedValue = serialize(valueToStore)
      window.sessionStorage.setItem(key, serializedValue)

      // 상태 업데이트
      setStoredValue(valueToStore)
      setError(null)

      // 커스텀 이벤트 발생 (탭 간 동기화용)
      if (syncAcrossTabs) {
        window.dispatchEvent(new CustomEvent(`sessionStorage-${key}`, {
          detail: valueToStore
        }))
      }

    } catch (error) {
      console.error(`세션스토리지 저장 오류 (key: ${key}):`, error)
      onError?.(error)
      setError(error)
    }
  }, [key, serialize, storedValue, onError, syncAcrossTabs])

  // 값 제거
  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      console.warn('세션스토리지는 클라이언트에서만 사용 가능합니다')
      return
    }

    try {
      window.sessionStorage.removeItem(key)
      setStoredValue(defaultValue)
      setError(null)

      // 커스텀 이벤트 발생
      if (syncAcrossTabs) {
        window.dispatchEvent(new CustomEvent(`sessionStorage-${key}`, {
          detail: defaultValue
        }))
      }

    } catch (error) {
      console.error(`세션스토리지 삭제 오류 (key: ${key}):`, error)
      onError?.(error)
      setError(error)
    }
  }, [key, defaultValue, onError, syncAcrossTabs])

  // 탭 간 동기화 이벤트 리스너
  useEffect(() => {
    if (typeof window === 'undefined' || !syncAcrossTabs) {
      return
    }

    const handleStorageChange = (event) => {
      if (event.detail !== undefined) {
        setStoredValue(event.detail)
      }
    }

    const eventName = `sessionStorage-${key}`
    window.addEventListener(eventName, handleStorageChange)

    return () => {
      window.removeEventListener(eventName, handleStorageChange)
    }
  }, [key, syncAcrossTabs])

  // 값 새로고침
  const refresh = useCallback(() => {
    try {
      const newValue = readValue()
      setStoredValue(newValue)
      setError(null)
    } catch (error) {
      console.error('세션스토리지 새로고침 오류:', error)
      setError(error)
    }
  }, [readValue])

  return {
    value: storedValue,
    setValue,
    removeValue,
    refresh,
    isLoading,
    error,
    errorMessage: error ? errorT('E5001') : null
  }
}

/**
 * 세션스토리지 배열 훅
 */
export const useSessionStorageArray = (key, defaultValue = []) => {
  const {
    value: array,
    setValue: setArray,
    removeValue,
    refresh,
    isLoading,
    error
  } = useSessionStorage(key, defaultValue)

  const addItem = useCallback((item) => {
    setArray(prev => [...prev, item])
  }, [setArray])

  const removeItem = useCallback((index) => {
    setArray(prev => prev.filter((_, i) => i !== index))
  }, [setArray])

  const updateItem = useCallback((index, newItem) => {
    setArray(prev => prev.map((item, i) => i === index ? newItem : item))
  }, [setArray])

  const clearArray = useCallback(() => {
    setArray([])
  }, [setArray])

  const findItem = useCallback((predicate) => {
    return array.find(predicate)
  }, [array])

  const filterItems = useCallback((predicate) => {
    return array.filter(predicate)
  }, [array])

  return {
    array,
    setArray,
    addItem,
    removeItem,
    updateItem,
    clearArray,
    findItem,
    filterItems,
    removeValue,
    refresh,
    isLoading,
    error,
    length: array.length,
    isEmpty: array.length === 0
  }
}

/**
 * 세션스토리지 객체 훅
 */
export const useSessionStorageObject = (key, defaultValue = {}) => {
  const {
    value: object,
    setValue: setObject,
    removeValue,
    refresh,
    isLoading,
    error
  } = useSessionStorage(key, defaultValue)

  const updateProperty = useCallback((property, value) => {
    setObject(prev => ({
      ...prev,
      [property]: value
    }))
  }, [setObject])

  const updateProperties = useCallback((updates) => {
    setObject(prev => ({
      ...prev,
      ...updates
    }))
  }, [setObject])

  const removeProperty = useCallback((property) => {
    setObject(prev => {
      const newObj = { ...prev }
      delete newObj[property]
      return newObj
    })
  }, [setObject])

  const hasProperty = useCallback((property) => {
    return object.hasOwnProperty(property)
  }, [object])

  const getProperty = useCallback((property, fallback = null) => {
    return object[property] ?? fallback
  }, [object])

  return {
    object,
    setObject,
    updateProperty,
    updateProperties,
    removeProperty,
    hasProperty,
    getProperty,
    removeValue,
    refresh,
    isLoading,
    error,
    keys: Object.keys(object),
    values: Object.values(object),
    entries: Object.entries(object)
  }
}

/**
 * 임시 세션 데이터 훅 (페이지 새로고침 시 초기화)
 */
export const useTemporarySession = (key, defaultValue) => {
  const sessionKey = `temp_${key}_${Date.now()}`
  
  return useSessionStorage(sessionKey, defaultValue, {
    syncAcrossTabs: false
  })
}

/**
 * 폼 상태 세션 보관 훅
 */
export const useSessionForm = (formId, defaultFormData = {}) => {
  const sessionKey = `form_${formId}`
  
  const {
    value: formData,
    setValue: setFormData,
    removeValue: clearForm,
    isLoading,
    error
  } = useSessionStorage(sessionKey, defaultFormData)

  const updateField = useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }, [setFormData])

  const updateFields = useCallback((fields) => {
    setFormData(prev => ({
      ...prev,
      ...fields
    }))
  }, [setFormData])

  const resetForm = useCallback(() => {
    setFormData(defaultFormData)
  }, [setFormData, defaultFormData])

  const isFormEmpty = Object.keys(formData).length === 0 || 
    Object.values(formData).every(value => 
      value === '' || value === null || value === undefined
    )

  return {
    formData,
    setFormData,
    updateField,
    updateFields,
    clearForm,
    resetForm,
    isFormEmpty,
    isLoading,
    error
  }
}

export default useSessionStorage