/**
 * useFormDependency.js - 필드 의존성 관리 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 필드 간 의존성 관리 및 조건부 렌더링
 * - 메뉴 옵션, 가격 설정, 배달 조건 등 복잡한 폼 관리
 * - Local 비즈니스 로직 의존성
 * - 실시간 필드 값 동기화
 * - 조건부 검증 규칙
 */

'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useAppTranslation } from '../i18n/I18nProvider'

/**
 * 필드 의존성 관리 훅
 * @param {Object} dependencies 의존성 규칙
 * @param {Object} values 폼 값들
 * @param {Object} options 옵션
 */
export const useFormDependency = (dependencies = {}, values = {}, options = {}) => {
  const {
    debounceMs = 100,
    validateOnChange = true,
    onDependencyChange,
    enableLogging = false
  } = options

  const { t } = useAppTranslation()
  
  const [dependentFields, setDependentFields] = useState(new Set())
  const [fieldVisibility, setFieldVisibility] = useState({})
  const [fieldDisabled, setFieldDisabled] = useState({})
  const [computedValues, setComputedValues] = useState({})
  
  const debounceRef = useRef({})
  const logRef = useRef([])

  // 의존성 로그 기록
  const logDependency = useCallback((fieldName, action, result) => {
    if (!enableLogging) return
    
    const logEntry = {
      timestamp: Date.now(),
      field: fieldName,
      action,
      result,
      values: { ...values }
    }
    
    logRef.current.push(logEntry)
    if (logRef.current.length > 100) {
      logRef.current.shift()
    }
  }, [enableLogging, values])

  // 조건 평가 함수
  const evaluateCondition = useCallback((condition, fieldValues) => {
    if (typeof condition === 'function') {
      return condition(fieldValues)
    }

    if (typeof condition === 'object' && condition !== null) {
      const { field, operator, value, values: expectedValues } = condition

      const fieldValue = fieldValues[field]

      switch (operator) {
        case 'equals':
          return fieldValue === value
        case 'notEquals':
          return fieldValue !== value
        case 'greaterThan':
          return Number(fieldValue) > Number(value)
        case 'lessThan':
          return Number(fieldValue) < Number(value)
        case 'greaterThanOrEqual':
          return Number(fieldValue) >= Number(value)
        case 'lessThanOrEqual':
          return Number(fieldValue) <= Number(value)
        case 'includes':
          return Array.isArray(fieldValue) && fieldValue.includes(value)
        case 'notIncludes':
          return Array.isArray(fieldValue) && !fieldValue.includes(value)
        case 'contains':
          return String(fieldValue).includes(String(value))
        case 'startsWith':
          return String(fieldValue).startsWith(String(value))
        case 'endsWith':
          return String(fieldValue).endsWith(String(value))
        case 'isEmpty':
          return !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0)
        case 'isNotEmpty':
          return !(!fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0))
        case 'in':
          return expectedValues && expectedValues.includes(fieldValue)
        case 'notIn':
          return expectedValues && !expectedValues.includes(fieldValue)
        case 'regex':
          return new RegExp(value).test(String(fieldValue))
        default:
          return true
      }
    }

    return Boolean(condition)
  }, [])

  // 복합 조건 평가
  const evaluateComplexCondition = useCallback((condition, fieldValues) => {
    if (condition.and) {
      return condition.and.every(cond => evaluateCondition(cond, fieldValues))
    }
    
    if (condition.or) {
      return condition.or.some(cond => evaluateCondition(cond, fieldValues))
    }
    
    if (condition.not) {
      return !evaluateCondition(condition.not, fieldValues)
    }
    
    return evaluateCondition(condition, fieldValues)
  }, [evaluateCondition])

  // 필드 가시성 업데이트
  const updateFieldVisibility = useCallback(() => {
    const newVisibility = {}
    
    Object.keys(dependencies).forEach(fieldName => {
      const rule = dependencies[fieldName]
      
      if (rule.show) {
        const shouldShow = evaluateComplexCondition(rule.show, values)
        newVisibility[fieldName] = shouldShow
        logDependency(fieldName, 'visibility', shouldShow)
      }
      
      if (rule.hide) {
        const shouldHide = evaluateComplexCondition(rule.hide, values)
        newVisibility[fieldName] = !shouldHide
        logDependency(fieldName, 'visibility', !shouldHide)
      }
    })
    
    setFieldVisibility(newVisibility)
  }, [dependencies, values, evaluateComplexCondition, logDependency])

  // 필드 비활성화 상태 업데이트
  const updateFieldDisabled = useCallback(() => {
    const newDisabled = {}
    
    Object.keys(dependencies).forEach(fieldName => {
      const rule = dependencies[fieldName]
      
      if (rule.enable) {
        const shouldEnable = evaluateComplexCondition(rule.enable, values)
        newDisabled[fieldName] = !shouldEnable
        logDependency(fieldName, 'disabled', !shouldEnable)
      }
      
      if (rule.disable) {
        const shouldDisable = evaluateComplexCondition(rule.disable, values)
        newDisabled[fieldName] = shouldDisable
        logDependency(fieldName, 'disabled', shouldDisable)
      }
    })
    
    setFieldDisabled(newDisabled)
  }, [dependencies, values, evaluateComplexCondition, logDependency])

  // 계산된 값 업데이트
  const updateComputedValues = useCallback(() => {
    const newComputedValues = {}
    
    Object.keys(dependencies).forEach(fieldName => {
      const rule = dependencies[fieldName]
      
      if (rule.compute) {
        try {
          const computedValue = rule.compute(values, fieldName)
          newComputedValues[fieldName] = computedValue
          logDependency(fieldName, 'compute', computedValue)
        } catch (error) {
          console.error(`Compute error for field ${fieldName}:`, error)
        }
      }
    })
    
    setComputedValues(newComputedValues)
  }, [dependencies, values, logDependency])

  // 디바운스된 의존성 업데이트
  const debouncedUpdate = useCallback(() => {
    Object.keys(debounceRef.current).forEach(timer => {
      clearTimeout(debounceRef.current[timer])
    })

    debounceRef.current.main = setTimeout(() => {
      updateFieldVisibility()
      updateFieldDisabled()
      updateComputedValues()
      
      // 의존성 변경 콜백 실행
      onDependencyChange?.({
        visibility: fieldVisibility,
        disabled: fieldDisabled,
        computed: computedValues
      })
    }, debounceMs)
  }, [debounceMs, updateFieldVisibility, updateFieldDisabled, updateComputedValues, onDependencyChange, fieldVisibility, fieldDisabled, computedValues])

  // 값 변경 감지 및 의존성 업데이트
  useEffect(() => {
    if (validateOnChange) {
      debouncedUpdate()
    }
    
    return () => {
      Object.keys(debounceRef.current).forEach(timer => {
        clearTimeout(debounceRef.current[timer])
      })
    }
  }, [values, debouncedUpdate, validateOnChange])

  // 의존적인 필드 목록 생성
  const dependentFieldsList = useMemo(() => {
    const deps = new Set()
    
    Object.keys(dependencies).forEach(fieldName => {
      deps.add(fieldName)
    })
    
    return Array.from(deps)
  }, [dependencies])

  // 특정 필드의 의존성 상태 조회
  const getFieldState = useCallback((fieldName) => {
    return {
      isVisible: fieldVisibility[fieldName] !== false,
      isEnabled: fieldDisabled[fieldName] !== true,
      computedValue: computedValues[fieldName],
      hasVisibilityRule: dependencies[fieldName]?.show || dependencies[fieldName]?.hide,
      hasDisabledRule: dependencies[fieldName]?.enable || dependencies[fieldName]?.disable,
      hasComputeRule: !!dependencies[fieldName]?.compute
    }
  }, [fieldVisibility, fieldDisabled, computedValues, dependencies])

  // 모든 필드 상태 조회
  const getAllFieldStates = useCallback(() => {
    const states = {}
    
    dependentFieldsList.forEach(fieldName => {
      states[fieldName] = getFieldState(fieldName)
    })
    
    return states
  }, [dependentFieldsList, getFieldState])

  // 의존성 체인 분석
  const getDependencyChain = useCallback((fieldName) => {
    const chain = []
    const visited = new Set()
    
    const buildChain = (field) => {
      if (visited.has(field)) return // 순환 참조 방지
      visited.add(field)
      
      const rule = dependencies[field]
      if (!rule) return
      
      // 의존성 필드 찾기
      const findDependencies = (condition) => {
        if (!condition) return
        
        if (condition.field) {
          chain.push({ source: condition.field, target: field })
          buildChain(condition.field)
        }
        
        if (condition.and) {
          condition.and.forEach(findDependencies)
        }
        
        if (condition.or) {
          condition.or.forEach(findDependencies)
        }
        
        if (condition.not) {
          findDependencies(condition.not)
        }
      }
      
      findDependencies(rule.show)
      findDependencies(rule.hide)
      findDependencies(rule.enable)
      findDependencies(rule.disable)
    }
    
    buildChain(fieldName)
    return chain
  }, [dependencies])

  return {
    // 상태
    fieldVisibility,
    fieldDisabled,
    computedValues,
    dependentFields: dependentFieldsList,
    
    // 메서드
    getFieldState,
    getAllFieldStates,
    getDependencyChain,
    evaluateCondition,
    evaluateComplexCondition,
    updateFieldVisibility,
    updateFieldDisabled,
    updateComputedValues,
    
    // 디버깅
    logs: logRef.current,
    clearLogs: () => { logRef.current = [] },
    
    // Local어 라벨
    labels: {
      visible: t?.('form.visible') || 'Hiển thị',
      hidden: t?.('form.hidden') || 'Ẩn',
      enabled: t?.('form.enabled') || 'Kích hoạt',
      disabled: t?.('form.disabled') || 'Vô hiệu hóa',
      computed: t?.('form.computed') || 'Tự động tính',
      dependent: t?.('form.dependent') || 'Phụ thuộc'
    }
  }
}

/**
 * Local 메뉴 관리용 의존성 훅
 */
export const useMenuDependency = (menuData) => {
  const menuDependencies = useMemo(() => ({
    // 가격 필드 - 메뉴 카테고리에 따른 표시
    basePrice: {
      show: { field: 'category', operator: 'notEquals', value: 'free' }
    },
    
    // 할인 가격 - 기본 가격이 있을 때만
    discountPrice: {
      show: { field: 'basePrice', operator: 'greaterThan', value: 0 },
      compute: (values) => {
        const base = Number(values.basePrice || 0)
        const discount = Number(values.discountPercent || 0)
        return discount > 0 ? base * (1 - discount / 100) : null
      }
    },
    
    // 준비 시간 - 복잡한 메뉴일 때 필수
    preparationTime: {
      show: {
        or: [
          { field: 'category', operator: 'in', values: ['main', 'special'] },
          { field: 'isComplexMenu', operator: 'equals', value: true }
        ]
      }
    },
    
    // 옵션 그룹 - 메인 메뉴일 때만
    optionGroups: {
      show: { field: 'category', operator: 'equals', value: 'main' }
    },
    
    // 재고 관리 - 물리적 상품일 때
    stockManagement: {
      show: { field: 'isPhysicalItem', operator: 'equals', value: true }
    }
  }), [])

  const dependency = useFormDependency(menuDependencies, menuData, {
    debounceMs: 200,
    validateOnChange: true
  })

  return {
    ...dependency,
    // 메뉴 특화 메서드
    getMenuFieldState: (fieldName) => dependency.getFieldState(fieldName),
    isPriceFieldVisible: () => dependency.getFieldState('basePrice').isVisible,
    shouldShowOptions: () => dependency.getFieldState('optionGroups').isVisible
  }
}

/**
 * Local 주문 폼용 의존성 훅
 */
export const useOrderDependency = (orderData) => {
  const orderDependencies = useMemo(() => ({
    // 배달 주소 - 배달 주문일 때만
    deliveryAddress: {
      show: { field: 'orderType', operator: 'equals', value: 'delivery' }
    },
    
    // 배달비 계산 - 배달 주소가 있을 때
    deliveryFee: {
      show: { field: 'deliveryAddress', operator: 'isNotEmpty' },
      compute: (values) => {
        if (!values.deliveryAddress) return 0
        // Local 배달비 계산 로직
        const distance = values.deliveryDistance || 0
        const baseFee = 15000 // 기본 15,000 VND
        const extraFee = Math.max(0, distance - 3) * 3000 // 3km 초과 시 km당 3,000 VND
        return baseFee + extraFee
      }
    },
    
    // 픽업 시간 - 픽업 주문일 때만
    pickupTime: {
      show: { field: 'orderType', operator: 'equals', value: 'pickup' }
    },
    
    // 결제 방법 - 총액에 따른 제한
    paymentMethod: {
      show: { field: 'totalAmount', operator: 'greaterThan', value: 0 },
      disable: {
        and: [
          { field: 'totalAmount', operator: 'greaterThan', value: 5000000 }, // 5백만 VND 초과
          { field: 'paymentMethod', operator: 'equals', value: 'cod' }
        ]
      }
    },
    
    // 쿠폰 적용 - 최소 주문 금액 조건
    couponCode: {
      enable: { field: 'subtotal', operator: 'greaterThanOrEqual', value: 100000 } // 10만 VND 이상
    },
    
    // 팁 - 배달 주문일 때만
    tip: {
      show: { field: 'orderType', operator: 'equals', value: 'delivery' }
    }
  }), [])

  return useFormDependency(orderDependencies, orderData, {
    debounceMs: 300,
    validateOnChange: true
  })
}

export default useFormDependency