/**
 * useFormValidation.js - 폼 유효성 검사 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 고급 폼 검증 규칙 및 로직
 * - Local 특화 검증 (전화번호, 주소, 화폐)
 * - 비동기 검증 지원
 * - 실시간 검증 피드백
 * - 다국어 에러 메시지
 */

'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { useAppTranslation } from '../i18n/I18nProvider'

/**
 * Local 전화번호 검증
 */
const validateVietnamesePhone = (phone) => {
  if (!phone) return false
  const cleaned = phone.replace(/\D/g, '')
  return /^0[1-9][0-9]{8}$/.test(cleaned)
}

/**
 * Local 주소 검증
 */
const validateVietnameseAddress = (address) => {
  if (!address) return false
  return address.trim().length >= 10
}

/**
 * VND 금액 검증
 */
const validateVND = (amount) => {
  if (!amount) return false
  const numAmount = parseFloat(amount.toString().replace(/[^\d.]/g, ''))
  return !isNaN(numAmount) && numAmount >= 1000
}

/**
 * 이메일 검증
 */
const validateEmail = (email) => {
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * 폼 검증 훅
 * @param {Object} validationRules 검증 규칙
 * @param {Object} options 옵션
 */
export const useFormValidation = (validationRules = {}, options = {}) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
    asyncValidation = {}
  } = options

  const { errorT } = useAppTranslation()
  
  const [errors, setErrors] = useState({})
  const [validationState, setValidationState] = useState({})
  const [isValidating, setIsValidating] = useState(false)
  
  const debounceTimers = useRef({})
  const asyncValidationCache = useRef({})

  // 동기 검증
  const validateSync = useCallback((fieldName, value, allValues = {}) => {
    const rules = validationRules[fieldName]
    if (!rules) return null

    for (const rule of Array.isArray(rules) ? rules : [rules]) {
      // 필수 검증
      if (rule.required && (!value || value.toString().trim() === '')) {
        return rule.message || errorT('E1001')
      }

      // 값이 없고 필수가 아니면 통과
      if (!value && !rule.required) continue

      // 최소 길이
      if (rule.minLength && value.length < rule.minLength) {
        return rule.message || errorT('E1002', { min: rule.minLength })
      }

      // 최대 길이
      if (rule.maxLength && value.length > rule.maxLength) {
        return rule.message || errorT('E1003', { max: rule.maxLength })
      }

      // 패턴 검증
      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message || errorT('E1004')
      }

      // Local 특화 검증
      if (rule.vietnamesePhone && !validateVietnamesePhone(value)) {
        return rule.message || '올바른 Local 전화번호를 입력하세요'
      }

      if (rule.vietnameseAddress && !validateVietnameseAddress(value)) {
        return rule.message || '주소는 최소 10자 이상 입력하세요'
      }

      if (rule.vnd && !validateVND(value)) {
        return rule.message || '올바른 금액을 입력하세요 (최소 1,000 VND)'
      }

      if (rule.email && !validateEmail(value)) {
        return rule.message || '올바른 이메일 주소를 입력하세요'
      }

      // 커스텀 검증
      if (rule.validator) {
        const error = rule.validator(value, allValues, fieldName)
        if (error) return error
      }

      // 동일값 검증 (비밀번호 확인 등)
      if (rule.matches && value !== allValues[rule.matches]) {
        return rule.message || `${rule.matches} 필드와 일치하지 않습니다`
      }
    }

    return null
  }, [validationRules, errorT])

  // 비동기 검증
  const validateAsync = useCallback(async (fieldName, value) => {
    const asyncRule = asyncValidation[fieldName]
    if (!asyncRule) return null

    // 캐시 확인
    const cacheKey = `${fieldName}_${value}`
    if (asyncValidationCache.current[cacheKey] !== undefined) {
      return asyncValidationCache.current[cacheKey]
    }

    setValidationState(prev => ({ ...prev, [fieldName]: 'validating' }))

    try {
      const result = await asyncRule.validator(value)
      const error = result ? null : (asyncRule.message || '검증 실패')
      
      // 캐시 저장
      asyncValidationCache.current[cacheKey] = error
      
      setValidationState(prev => ({ 
        ...prev, 
        [fieldName]: error ? 'error' : 'success' 
      }))
      
      return error
    } catch (error) {
      setValidationState(prev => ({ ...prev, [fieldName]: 'error' }))
      return asyncRule.message || '검증 중 오류가 발생했습니다'
    }
  }, [asyncValidation])

  // 필드 검증
  const validateField = useCallback(async (fieldName, value, allValues = {}) => {
    // 동기 검증
    const syncError = validateSync(fieldName, value, allValues)
    if (syncError) {
      setErrors(prev => ({ ...prev, [fieldName]: syncError }))
      return syncError
    }

    // 비동기 검증
    const asyncError = await validateAsync(fieldName, value)
    setErrors(prev => ({ ...prev, [fieldName]: asyncError }))
    
    return asyncError
  }, [validateSync, validateAsync])

  // 디바운스된 검증
  const debouncedValidateField = useCallback((fieldName, value, allValues = {}) => {
    // 기존 타이머 클리어
    if (debounceTimers.current[fieldName]) {
      clearTimeout(debounceTimers.current[fieldName])
    }

    debounceTimers.current[fieldName] = setTimeout(() => {
      validateField(fieldName, value, allValues)
    }, debounceMs)
  }, [validateField, debounceMs])

  // 전체 폼 검증
  const validateAllFields = useCallback(async (values) => {
    setIsValidating(true)
    const newErrors = {}
    
    const validationPromises = Object.keys(validationRules).map(async fieldName => {
      const error = await validateField(fieldName, values[fieldName], values)
      if (error) {
        newErrors[fieldName] = error
      }
    })

    await Promise.all(validationPromises)
    setIsValidating(false)
    
    return Object.keys(newErrors).length === 0
  }, [validationRules, validateField])

  // 에러 설정
  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }))
  }, [])

  // 에러 클리어
  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => ({ ...prev, [fieldName]: null }))
    setValidationState(prev => ({ ...prev, [fieldName]: null }))
  }, [])

  // 모든 에러 클리어
  const clearAllErrors = useCallback(() => {
    setErrors({})
    setValidationState({})
  }, [])

  // 검증 상태 계산
  const validationSummary = useMemo(() => ({
    hasErrors: Object.values(errors).some(error => error),
    errorCount: Object.values(errors).filter(error => error).length,
    isValidating,
    fieldsWithErrors: Object.keys(errors).filter(key => errors[key])
  }), [errors, isValidating])

  return {
    // 상태
    errors,
    validationState,
    isValidating,
    validationSummary,
    
    // 검증 메서드
    validateField,
    validateSync,
    validateAsync,
    debouncedValidateField,
    validateAllFields,
    
    // 에러 관리
    setFieldError,
    clearFieldError,
    clearAllErrors,
    
    // 유틸리티 검증 함수들
    validators: {
      validateVietnamesePhone,
      validateVietnameseAddress,
      validateVND,
      validateEmail
    }
  }
}

/**
 * Local 특화 검증 규칙 생성 헬퍼
 */
export const createVietnameseValidationRules = () => {
  const { errorT } = useAppTranslation()
  
  return {
    // 필수 입력
    required: (message) => ({
      required: true,
      message: message || errorT('E1001')
    }),

    // Local 전화번호
    vietnamesePhone: (message) => ({
      vietnamesePhone: true,
      message: message || 'Vui lòng nhập số điện thoại hợp lệ (10 số)'
    }),

    // Local 주소
    vietnameseAddress: (message) => ({
      vietnameseAddress: true,
      message: message || 'Vui lòng nhập địa chỉ chi tiết (tối thiểu 10 ký tự)'
    }),

    // VND 금액
    vndAmount: (message) => ({
      vnd: true,
      message: message || 'Vui lòng nhập số tiền hợp lệ (tối thiểu 1,000₫)'
    }),

    // 이메일
    email: (message) => ({
      email: true,
      message: message || 'Vui lòng nhập email hợp lệ'
    }),

    // 길이 제한
    minLength: (min, message) => ({
      minLength: min,
      message: message || `Tối thiểu ${min} ký tự`
    }),

    maxLength: (max, message) => ({
      maxLength: max,
      message: message || `Tối đa ${max} ký tự`
    })
  }
}

export default useFormValidation