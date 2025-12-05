/**
 * useForm.js - 폼 상태 관리 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 폼 상태 및 검증 통합 관리
 * - Local어 에러 메시지
 * - 자동 저장 및 복구 기능
 * - 다국어 검증 지원
 * - 성능 최적화된 리렌더링
 */

'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { useAppTranslation } from '../../i18n/I18nProvider'

/**
 * 폼 상태 관리 훅
 * @param {Object} initialValues 초기값
 * @param {Object} validationSchema 검증 스키마
 * @param {Object} options 옵션
 */
export const useForm = (initialValues = {}, validationSchema = {}, options = {}) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    autoSave = false,
    autoSaveKey = null,
    onSubmit,
    onValidate,
    resetOnSubmit = false
  } = options

  const { errorT } = useAppTranslation()
  
  const [values, setValues] = useState(() => {
    // 자동 저장에서 복구 시도
    if (autoSave && autoSaveKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`form_${autoSaveKey}`)
        return saved ? { ...initialValues, ...JSON.parse(saved) } : initialValues
      } catch {
        return initialValues
      }
    }
    return initialValues
  })

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitCount, setSubmitCount] = useState(0)

  const initialValuesRef = useRef(initialValues)

  // 단일 필드 검증
  const validateField = useCallback((name, value) => {
    const fieldSchema = validationSchema[name]
    if (!fieldSchema) return null

    for (const rule of fieldSchema) {
      if (rule.required && (!value || value.toString().trim() === '')) {
        return rule.message || errorT('E1001') // 필수 입력 필드
      }

      if (rule.minLength && value && value.length < rule.minLength) {
        return rule.message || errorT('E1002', { min: rule.minLength })
      }

      if (rule.maxLength && value && value.length > rule.maxLength) {
        return rule.message || errorT('E1003', { max: rule.maxLength })
      }

      if (rule.pattern && value && !rule.pattern.test(value)) {
        return rule.message || errorT('E1004') // 형식 오류
      }

      if (rule.custom && value) {
        const customError = rule.custom(value, values)
        if (customError) return customError
      }
    }

    return null
  }, [validationSchema, values, errorT])

  // 전체 폼 검증
  const validateForm = useCallback(() => {
    const newErrors = {}
    let isValid = true

    Object.keys(validationSchema).forEach(name => {
      const error = validateField(name, values[name])
      if (error) {
        newErrors[name] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    onValidate?.(newErrors, isValid)
    return isValid
  }, [values, validateField, onValidate])

  // 값 변경 핸들러
  const setValue = useCallback((name, value) => {
    setValues(prev => {
      const newValues = { ...prev, [name]: value }
      
      // 자동 저장
      if (autoSave && autoSaveKey && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`form_${autoSaveKey}`, JSON.stringify(newValues))
        } catch (error) {
          console.warn('Auto-save failed:', error)
        }
      }

      return newValues
    })

    // 변경 시 검증
    if (validateOnChange) {
      const error = validateField(name, value)
      setErrors(prev => ({
        ...prev,
        [name]: error
      }))
    }
  }, [validateOnChange, validateField, autoSave, autoSaveKey])

  // 입력 핸들러
  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target
    setValue(name, type === 'checkbox' ? checked : value)
  }, [setValue])

  // 블러 핸들러
  const handleBlur = useCallback((event) => {
    const { name, value } = event.target
    
    setTouched(prev => ({ ...prev, [name]: true }))

    if (validateOnBlur) {
      const error = validateField(name, value)
      setErrors(prev => ({
        ...prev,
        [name]: error
      }))
    }
  }, [validateOnBlur, validateField])

  // 필드 리셋
  const resetField = useCallback((name) => {
    setValues(prev => ({
      ...prev,
      [name]: initialValuesRef.current[name] || ''
    }))
    setErrors(prev => ({ ...prev, [name]: null }))
    setTouched(prev => ({ ...prev, [name]: false }))
  }, [])

  // 전체 폼 리셋
  const reset = useCallback(() => {
    setValues(initialValuesRef.current)
    setErrors({})
    setTouched({})
    setSubmitCount(0)
    
    // 자동 저장 데이터 삭제
    if (autoSave && autoSaveKey && typeof window !== 'undefined') {
      localStorage.removeItem(`form_${autoSaveKey}`)
    }
  }, [autoSave, autoSaveKey])

  // 제출 핸들러
  const handleSubmit = useCallback(async (event) => {
    event?.preventDefault()
    
    setSubmitCount(prev => prev + 1)
    setIsSubmitting(true)

    try {
      const isValid = validateForm()
      
      if (isValid && onSubmit) {
        await onSubmit(values, { reset, setValue })
        
        if (resetOnSubmit) {
          reset()
        }
      }
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [validateForm, onSubmit, values, reset, setValue, resetOnSubmit])

  // 폼 상태 계산
  const formState = useMemo(() => ({
    isDirty: Object.keys(values).some(key => 
      values[key] !== initialValuesRef.current[key]
    ),
    isValid: Object.keys(errors).length === 0 && Object.values(errors).every(error => !error),
    hasErrors: Object.values(errors).some(error => error),
    touchedFields: Object.keys(touched).filter(key => touched[key]),
    dirtyFields: Object.keys(values).filter(key => 
      values[key] !== initialValuesRef.current[key]
    )
  }), [values, errors, touched])

  // 필드 헬퍼
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] || '',
    onChange: handleChange,
    onBlur: handleBlur,
    error: errors[name],
    touched: touched[name]
  }), [values, handleChange, handleBlur, errors, touched])

  return {
    // 상태
    values,
    errors,
    touched,
    isSubmitting,
    submitCount,
    ...formState,
    
    // 액션
    setValue,
    handleChange,
    handleBlur,
    handleSubmit,
    resetField,
    reset,
    validateForm,
    validateField,
    
    // 헬퍼
    getFieldProps
  }
}

/**
 * Local 특화 폼 훅
 * Local 입력 패턴과 검증 규칙 포함
 */
export const useVietnameseForm = (initialValues, validationSchema, options = {}) => {
  const { t } = useAppTranslation()
  
  const enhancedValidationSchema = {
    ...validationSchema,
    // Local 전화번호 검증 추가
    phone: validationSchema.phone ? [
      ...validationSchema.phone,
      {
        pattern: /^(0[1-9])[0-9]{8}$/,
        message: t('validation.invalidVietnamesePhone')
      }
    ] : undefined,
    
    // Local 주소 검증 추가  
    address: validationSchema.address ? [
      ...validationSchema.address,
      {
        minLength: 10,
        message: t('validation.addressTooShort')
      }
    ] : undefined
  }

  const form = useForm(initialValues, enhancedValidationSchema, {
    ...options,
    autoSaveKey: options.autoSaveKey ? `vn_${options.autoSaveKey}` : null
  })

  // Local 특화 검증 메서드들
  const validateVietnamesePhone = useCallback((phone) => {
    if (!phone) return null
    
    // Local 전화번호 형식: 0xxxxxxxxx (10자리)
    const cleaned = phone.replace(/\D/g, '')
    if (!/^0[1-9][0-9]{8}$/.test(cleaned)) {
      return t('validation.invalidVietnamesePhone')
    }
    return null
  }, [t])

  const validateVND = useCallback((amount) => {
    if (!amount) return null
    
    const numAmount = parseFloat(amount.toString().replace(/[^\d.]/g, ''))
    if (isNaN(numAmount) || numAmount < 0) {
      return t('validation.invalidAmount')
    }
    
    // Local 동 단위 (최소 1,000 VND)
    if (numAmount < 1000) {
      return t('validation.minimumAmount', { min: '1,000' })
    }
    
    return null
  }, [t])

  return {
    ...form,
    validateVietnamesePhone,
    validateVND,
    // Local어 라벨들
    labels: {
      required: t('validation.required'),
      invalid: t('validation.invalid'),
      tooShort: t('validation.tooShort'),
      tooLong: t('validation.tooLong'),
      submit: t('common.submit'),
      reset: t('common.reset'),
      cancel: t('common.cancel')
    }
  }
}

export default useForm