/**
 * useFormWizard.js - 다단계 폼 관리 훅
 * Local 음식 배달 앱 MVP - 점주용 웹 시스템
 * 
 * @description
 * - 다단계 폼 네비게이션 및 상태 관리
 * - 각 단계별 검증 및 데이터 보존
 * - 진행률 표시 및 네비게이션
 * - Local어 가이드 메시지
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useAppTranslation } from '../i18n/I18nProvider'

/**
 * 다단계 폼 위저드 훅
 * @param {Array} steps 단계 정의 배열
 * @param {Object} options 옵션
 */
export const useFormWizard = (steps = [], options = {}) => {
  const {
    initialStep = 0,
    validateOnNext = true,
    saveDataOnStepChange = true,
    onStepChange,
    onComplete,
    allowSkip = false
  } = options

  const { t } = useAppTranslation()
  
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [stepData, setStepData] = useState({})
  const [stepErrors, setStepErrors] = useState({})

  // 현재 단계 정보
  const currentStepInfo = useMemo(() => {
    return steps[currentStep] || {}
  }, [steps, currentStep])

  // 진행률 계산
  const progress = useMemo(() => {
    if (steps.length === 0) return 0
    return Math.round(((currentStep + 1) / steps.length) * 100)
  }, [currentStep, steps.length])

  // 다음 단계로 이동
  const nextStep = useCallback(async () => {
    if (currentStep >= steps.length - 1) return false

    // 현재 단계 검증
    if (validateOnNext && currentStepInfo.validate) {
      try {
        const isValid = await currentStepInfo.validate(stepData[currentStep])
        if (!isValid) {
          setStepErrors(prev => ({
            ...prev,
            [currentStep]: '현재 단계를 완료해주세요'
          }))
          return false
        }
      } catch (error) {
        setStepErrors(prev => ({
          ...prev,
          [currentStep]: error.message || '검증 중 오류가 발생했습니다'
        }))
        return false
      }
    }

    // 현재 단계를 완료됨으로 표시
    setCompletedSteps(prev => new Set([...prev, currentStep]))
    setStepErrors(prev => ({ ...prev, [currentStep]: null }))

    const nextStepIndex = currentStep + 1
    setCurrentStep(nextStepIndex)
    
    onStepChange?.(nextStepIndex, currentStep, 'next')
    return true
  }, [currentStep, steps.length, validateOnNext, currentStepInfo, stepData, onStepChange])

  // 이전 단계로 이동
  const prevStep = useCallback(() => {
    if (currentStep <= 0) return false

    const prevStepIndex = currentStep - 1
    setCurrentStep(prevStepIndex)
    
    onStepChange?.(prevStepIndex, currentStep, 'prev')
    return true
  }, [currentStep, onStepChange])

  // 특정 단계로 이동
  const goToStep = useCallback(async (stepIndex) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return false
    
    // 건너뛸 수 없고 미완료 단계가 있으면 차단
    if (!allowSkip && stepIndex > currentStep) {
      // 중간 단계들이 모두 완료되어야 함
      for (let i = currentStep; i < stepIndex; i++) {
        if (!completedSteps.has(i)) {
          return false
        }
      }
    }

    const prevStepIndex = currentStep
    setCurrentStep(stepIndex)
    
    const direction = stepIndex > prevStepIndex ? 'next' : 'prev'
    onStepChange?.(stepIndex, prevStepIndex, direction)
    return true
  }, [currentStep, steps.length, allowSkip, completedSteps, onStepChange])

  // 단계 데이터 업데이트
  const updateStepData = useCallback((step, data) => {
    setStepData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...data }
    }))
  }, [])

  // 현재 단계 데이터 업데이트
  const updateCurrentStepData = useCallback((data) => {
    updateStepData(currentStep, data)
  }, [currentStep, updateStepData])

  // 위저드 완료
  const complete = useCallback(async () => {
    // 마지막 단계 검증
    if (validateOnNext && currentStepInfo.validate) {
      try {
        const isValid = await currentStepInfo.validate(stepData[currentStep])
        if (!isValid) return false
      } catch (error) {
        setStepErrors(prev => ({
          ...prev,
          [currentStep]: error.message || '검증 중 오류가 발생했습니다'
        }))
        return false
      }
    }

    // 모든 단계 완료 표시
    setCompletedSteps(prev => new Set([...prev, currentStep]))
    
    // 완료 콜백 실행
    onComplete?.(stepData)
    return true
  }, [validateOnNext, currentStepInfo, stepData, currentStep, onComplete])

  // 위저드 리셋
  const reset = useCallback(() => {
    setCurrentStep(initialStep)
    setCompletedSteps(new Set())
    setStepData({})
    setStepErrors({})
  }, [initialStep])

  // 단계 상태 확인 유틸리티
  const isStepCompleted = useCallback((step) => {
    return completedSteps.has(step)
  }, [completedSteps])

  const isStepAccessible = useCallback((step) => {
    if (allowSkip) return true
    return step <= currentStep || isStepCompleted(step)
  }, [allowSkip, currentStep, isStepCompleted])

  return {
    // 상태
    currentStep,
    currentStepInfo,
    stepData,
    stepErrors,
    completedSteps: Array.from(completedSteps),
    progress,
    
    // 네비게이션
    nextStep,
    prevStep,
    goToStep,
    complete,
    reset,
    
    // 데이터 관리
    updateStepData,
    updateCurrentStepData,
    
    // 유틸리티
    isStepCompleted,
    isStepAccessible,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    canGoNext: currentStep < steps.length - 1,
    canGoPrev: currentStep > 0,
    
    // Local어 라벨
    labels: {
      next: t?.('common.next') || 'Tiếp theo',
      prev: t?.('common.prev') || 'Quay lại',
      complete: t?.('common.complete') || 'Hoàn thành',
      step: t?.('common.step') || 'Bước',
      of: t?.('common.of') || 'của',
      progress: t?.('common.progress') || 'Tiến độ'
    }
  }
}

/**
 * Local 주문 생성용 위저드 훅
 */
export const useOrderWizard = () => {
  const steps = [
    {
      key: 'customer',
      title: 'Thông tin khách hàng',
      description: 'Nhập thông tin liên hệ của khách hàng',
      validate: (data) => {
        return !!(data?.name && data?.phone && data?.address)
      }
    },
    {
      key: 'items',
      title: 'Chọn món ăn',
      description: 'Chọn các món ăn và số lượng',
      validate: (data) => {
        return data?.items && data.items.length > 0
      }
    },
    {
      key: 'payment',
      title: 'Thanh toán',
      description: 'Chọn phương thức thanh toán',
      validate: (data) => {
        return !!(data?.paymentMethod)
      }
    },
    {
      key: 'review',
      title: 'Xem lại đơn hàng',
      description: 'Kiểm tra thông tin đơn hàng trước khi hoàn thành',
      validate: () => true
    }
  ]

  return useFormWizard(steps, {
    validateOnNext: true,
    allowSkip: false
  })
}

export default useFormWizard