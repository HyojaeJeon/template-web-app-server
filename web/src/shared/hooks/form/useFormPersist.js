/**
 * useFormPersist.js - 폼 데이터 지속성 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 폼 데이터 자동 저장/복구
 * - 브라우저 새로고침 대응
 * - 임시 저장 기능
 * - Local어 알림 메시지
 */

'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useAppTranslation } from '../i18n/I18nProvider'

/**
 * 폼 데이터 지속성 훅
 * @param {string} key 저장 키
 * @param {Object} values 폼 값들
 * @param {Object} options 옵션
 */
export const useFormPersist = (key, values, options = {}) => {
  const {
    storage = 'localStorage',
    debounceMs = 1000,
    include = null,
    exclude = [],
    onSave,
    onRestore,
    maxAge = 24 * 60 * 60 * 1000 // 24시간
  } = options

  const { t } = useAppTranslation()
  const saveTimeoutRef = useRef(null)
  const prevValuesRef = useRef(values)

  const storageKey = `form_persist_${key}`

  // 데이터 저장
  const saveData = useCallback((data) => {
    try {
      const saveObject = {
        data,
        timestamp: Date.now(),
        version: '1.0'
      }

      if (storage === 'localStorage' && typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(saveObject))
      } else if (storage === 'sessionStorage' && typeof window !== 'undefined') {
        sessionStorage.setItem(storageKey, JSON.stringify(saveObject))
      }

      onSave?.(data)
    } catch (error) {
      console.error('Failed to save form data:', error)
    }
  }, [storageKey, storage, onSave])

  // 데이터 복구
  const restoreData = useCallback(() => {
    try {
      if (typeof window === 'undefined') return null

      const storageAPI = storage === 'localStorage' ? localStorage : sessionStorage
      const saved = storageAPI.getItem(storageKey)
      
      if (!saved) return null

      const saveObject = JSON.parse(saved)
      
      // 만료 시간 체크
      if (Date.now() - saveObject.timestamp > maxAge) {
        storageAPI.removeItem(storageKey)
        return null
      }

      onRestore?.(saveObject.data)
      return saveObject.data
    } catch (error) {
      console.error('Failed to restore form data:', error)
      return null
    }
  }, [storageKey, storage, maxAge, onRestore])

  // 데이터 삭제
  const clearData = useCallback(() => {
    try {
      if (typeof window === 'undefined') return

      const storageAPI = storage === 'localStorage' ? localStorage : sessionStorage
      storageAPI.removeItem(storageKey)
    } catch (error) {
      console.error('Failed to clear form data:', error)
    }
  }, [storageKey, storage])

  // 저장할 데이터 필터링
  const getFilteredData = useCallback((data) => {
    let filteredData = { ...data }

    // include 필드만 포함
    if (include && Array.isArray(include)) {
      filteredData = include.reduce((acc, field) => {
        if (data[field] !== undefined) {
          acc[field] = data[field]
        }
        return acc
      }, {})
    }

    // exclude 필드 제외
    if (exclude && Array.isArray(exclude)) {
      exclude.forEach(field => {
        delete filteredData[field]
      })
    }

    return filteredData
  }, [include, exclude])

  // 디바운스된 저장
  const debouncedSave = useCallback((data) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      const filteredData = getFilteredData(data)
      saveData(filteredData)
    }, debounceMs)
  }, [debounceMs, getFilteredData, saveData])

  // 값 변경 감지 및 자동 저장
  useEffect(() => {
    const hasChanged = JSON.stringify(values) !== JSON.stringify(prevValuesRef.current)
    
    if (hasChanged) {
      debouncedSave(values)
      prevValuesRef.current = values
    }
  }, [values, debouncedSave])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    saveData: (data = values) => saveData(getFilteredData(data)),
    restoreData,
    clearData,
    
    // Local어 메시지
    messages: {
      saved: t?.('form.autoSaved') || 'Đã tự động lưu',
      restored: t?.('form.dataRestored') || 'Đã khôi phục dữ liệu',
      cleared: t?.('form.dataCleared') || 'Đã xóa dữ liệu lưu trữ'
    }
  }
}

/**
 * Local 특화 폼 지속성 훅
 */
export const useVietnameseFormPersist = (key, values, options = {}) => {
  const persist = useFormPersist(`vn_${key}`, values, {
    ...options,
    exclude: ['password', 'confirmPassword', 'otp', ...(options.exclude || [])]
  })

  return {
    ...persist,
    // Local어 라벨들
    labels: {
      autoSave: 'Tự động lưu',
      restoreData: 'Khôi phục dữ liệu',
      clearData: 'Xóa dữ liệu đã lưu',
      dataExpired: 'Dữ liệu đã hết hạn'
    }
  }
}

export default useFormPersist