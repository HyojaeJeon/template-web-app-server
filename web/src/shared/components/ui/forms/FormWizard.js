'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/shared/i18n';

// FormWizard 컨텍스트
const FormWizardContext = createContext();

/**
 * 다단계 폼 위저드 컴포넌트 (WCAG 2.1 준수)
 * Local 테마 컬러와 다크모드 지원
 *
 * @param {Object} props - 컴포넌트 props
 * @param {Array} props.steps - 단계 정보 배열 (component 속성 포함 가능)
 * @param {number} props.initialStep - 초기 단계
 * @param {Object} props.initialData - 초기 폼 데이터
 * @param {Function} props.onStepChange - 단계 변경 핸들러
 * @param {Function} props.onComplete - 완료 핸들러
 * @param {Function} props.onStepComplete - 단계 완료 핸들러 (수정 모드에서 각 단계별 저장)
 * @param {Function} props.onDataChange - 데이터 변경 핸들러 (실시간 데이터 동기화용)
 * @param {boolean} props.allowStepSkip - 단계 건너뛰기 허용
 * @param {boolean} props.showProgress - 진행률 표시
 * @param {boolean} props.loading - 로딩 상태
 * @param {string} props.completeBtnText - 완료 버튼 텍스트
 * @param {string} props.variant - 스타일 변형
 * @param {boolean} props.useUrlParams - URL 파라미터로 단계 제어 여부 (기본: false)
 * @param {string} props.mode - 모드 ('create' | 'edit')
 */
const FormWizard = ({
  steps = [],
  initialStep = 0,
  initialData = {},
  onStepChange,
  onComplete,
  onStepComplete,
  onDataChange,
  allowStepSkip = false,
  showProgress = true,
  loading = false,
  completeBtnText,
  variant = 'default',
  className = '',
  useUrlParams = false,
  mode = 'create',
  children
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  // URL 파라미터에서 단계 가져오기
  const getStepFromUrl = useCallback(() => {
    if (!useUrlParams) return initialStep;
    const stepParam = searchParams.get('step');
    const stepIndex = stepParam ? parseInt(stepParam, 10) - 1 : 0; // step=1 → index 0
    return stepIndex >= 0 && stepIndex < steps.length ? stepIndex : 0;
  }, [useUrlParams, searchParams, initialStep, steps.length]);

  const [currentStep, setCurrentStep] = useState(getStepFromUrl);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [stepData, setStepData] = useState(initialData);
  const [stepErrors, setStepErrors] = useState({});

  // 수정 모드를 위한 변경 감지 상태
  const [initialStepData, setInitialStepData] = useState(initialData); // 초기 데이터 저장
  const [stepDirtyState, setStepDirtyState] = useState({}); // 각 단계의 dirty 상태

  // URL 파라미터 변경 감지
  useEffect(() => {
    if (useUrlParams) {
      const stepFromUrl = getStepFromUrl();
      if (stepFromUrl !== currentStep) {
        setCurrentStep(stepFromUrl);
      }
    }
  }, [useUrlParams, searchParams, getStepFromUrl, currentStep]);

  // initialData prop 변경 감지 (편집 모드에서 데이터 로드 시)
  useEffect(() => {
    // 실제 데이터가 로드되었는지 확인 (빈 객체가 아닌지)
    const hasData = Object.keys(initialData).length > 0 &&
                    (initialData.name || initialData.groups?.length > 0);

    if (hasData) {
      console.log('✅ [FormWizard] initialData 업데이트 감지:', initialData);
      setStepData(initialData);
      setInitialStepData(initialData); // 초기 데이터도 함께 업데이트
    }
  }, [initialData]);

  // 단계 변경 함수
  const goToStep = useCallback((stepIndex) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return;

    // 단계 건너뛰기 허용하지 않는 경우 체크
    if (!allowStepSkip && stepIndex > currentStep + 1) {
      return;
    }

    setCurrentStep(stepIndex);

    // URL 파라미터 업데이트
    if (useUrlParams && router) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('step', (stepIndex + 1).toString()); // index 0 → step=1
      router.push(`?${params.toString()}`, { scroll: false });
    }

    if (onStepChange) {
      onStepChange(stepIndex, steps[stepIndex]);
    }
  }, [currentStep, steps, allowStepSkip, onStepChange, useUrlParams, router, searchParams]);

  // 다음 단계로 이동
  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, steps.length, goToStep]);

  // 이전 단계로 이동
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  // 단계 데이터 업데이트 (중복 업데이트 방지 + 변경 감지)
  const updateStepData = useCallback((data) => {
    setStepData(prev => {
      // ✅ 항상 병합 (얕은 비교로는 객체/배열 변경을 감지하지 못함)
      const updated = { ...prev, ...data };

      // 수정 모드에서는 변경 감지 수행
      if (mode === 'edit') {
        const isDirty = checkStepDirty(currentStep, updated);
        setStepDirtyState(prevState => ({
          ...prevState,
          [currentStep]: isDirty
        }));
      }

      // 🔍 디버깅: 업데이트된 데이터 로깅
      console.log('📦 [FormWizard] updateStepData 호출:', {
        step: currentStep,
        receivedData: data,
        previousData: prev,
        mergedData: updated,
        keys: Object.keys(updated)
      });

      // 부모 컴포넌트에 데이터 변경 알림
      if (onDataChange) {
        onDataChange(updated);
      }

      return updated;
    });
  }, [mode, currentStep, onDataChange]);

  // 특정 단계의 데이터가 초기 데이터와 다른지 확인
  const checkStepDirty = useCallback((stepIndex, currentData = stepData) => {
    const stepConfig = steps[stepIndex];
    if (!stepConfig) return false;

    // 단계별로 비교할 필드 목록 (2단계 구조)
    const stepFieldsMap = {
      0: ['name', 'nameEn', 'nameKo', 'description', 'descriptionEn', 'descriptionKo',
          'isAvailable', 'isFeatured', 'images', 'displayOrder', 'availableFrom',
          'availableTo', 'availableDays', 'tags', 'posBundleId'],
      1: ['groups', 'basePrice', 'discountPrice', 'discountPercentage'] // 그룹 및 가격 정보 통합
    };

    const fieldsToCheck = stepFieldsMap[stepIndex] || [];

    for (const field of fieldsToCheck) {
      const currentValue = currentData[field];
      const initialValue = initialStepData[field];

      // 배열이나 객체인 경우 깊은 비교
      if (Array.isArray(currentValue) && Array.isArray(initialValue)) {
        if (JSON.stringify(currentValue) !== JSON.stringify(initialValue)) {
          return true;
        }
      } else if (currentValue !== initialValue) {
        return true;
      }
    }

    return false;
  }, [steps, stepData, initialStepData]);

  // 현재 단계의 dirty 상태 확인
  const isCurrentStepDirty = useCallback(() => {
    return stepDirtyState[currentStep] || false;
  }, [currentStep, stepDirtyState]);

  // 단계 완료 처리
  const completeStep = useCallback((stepIndex = currentStep, data = {}) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
    setStepData(prev => ({ ...prev, ...data }));

    // 마지막 단계인 경우 완료 처리
    if (stepIndex === steps.length - 1 && onComplete) {
      const allData = { ...stepData, ...data };
      onComplete(allData);
    }
  }, [currentStep, steps.length, stepData, onComplete]);

  // 단계 에러 설정
  const setStepError = useCallback((stepIndex, error) => {
    setStepErrors(prev => ({ ...prev, [stepIndex]: error }));
  }, []);

  // 단계 완료 여부 확인
  const isStepCompleted = useCallback((stepIndex) => {
    return completedSteps.has(stepIndex);
  }, [completedSteps]);

  // 단계 접근 가능 여부 확인
  const isStepAccessible = useCallback((stepIndex) => {
    if (allowStepSkip) return true;
    if (stepIndex <= currentStep) return true;
    
    // 이전 단계가 모두 완료되었는지 확인
    for (let i = 0; i < stepIndex; i++) {
      if (!completedSteps.has(i)) return false;
    }
    return true;
  }, [currentStep, completedSteps, allowStepSkip]);

  // 컨텍스트 값
  const contextValue = {
    steps,
    currentStep,
    completedSteps,
    stepData,
    stepErrors,
    loading,
    completeBtnText,
    mode,
    goToStep,
    nextStep,
    previousStep,
    completeStep,
    updateStepData,
    setStepError,
    isStepCompleted,
    isStepAccessible,
    isCurrentStepDirty,
    checkStepDirty
  };

  // 현재 단계의 컴포넌트 렌더링
  const renderCurrentStep = () => {
    // children이 제공된 경우 (기존 방식)
    if (children) {
      return children;
    }

    // steps 배열의 component 속성을 사용하는 경우 (새로운 방식)
    const currentStepConfig = steps[currentStep];
    if (!currentStepConfig || !currentStepConfig.component) {
      return null;
    }

    const StepComponent = currentStepConfig.component;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;

    // 다음 단계 검증 및 이동 (생성 모드) 또는 단계 수정 (수정 모드)
    const handleNext = async () => {
      console.log('🔍 [FormWizard] handleNext 시작:', {
        mode,
        currentStep,
        stepId: currentStepConfig.id,
        hasRef: !!currentStepConfig.ref,
        hasGetCurrentData: !!currentStepConfig.ref?.current?.getCurrentData,
        currentStepData: stepData
      });

      // 현재 컴포넌트에서 즉시 데이터 가져오기 (디바운스 우회)
      let freshData = {};
      if (currentStepConfig.ref?.current?.getCurrentData) {
        freshData = currentStepConfig.ref.current.getCurrentData();
        console.log('✅ [FormWizard] getCurrentData 호출 결과:', {
          stepId: currentStepConfig.id,
          freshData
        });
      } else {
        console.warn('⚠️ [FormWizard] getCurrentData 메서드 없음:', {
          stepId: currentStepConfig.id,
          hasRef: !!currentStepConfig.ref,
          refCurrent: currentStepConfig.ref?.current
        });
      }

      // 기존 stepData에 현재 단계 freshData 병합 (이전 단계 데이터 유지!)
      const currentStepData = { ...stepData, ...freshData };

      console.log('📊 [FormWizard] 병합된 데이터:', {
        previousStepData: stepData,
        freshData,
        merged: currentStepData
      });

      // stepData 상태 업데이트 (모든 단계 데이터 누적)
      setStepData(currentStepData);

      // 현재 단계 검증
      if (currentStepConfig.validate) {
        const isValid = currentStepConfig.validate(currentStepData);
        // validate는 true(성공) 또는 false(실패)를 반환
        if (isValid === false) {
          // 검증 실패 시 다음 단계로 이동하지 않음
          console.error('❌ [FormWizard] 검증 실패');
          setStepError(currentStep, 'Validation failed');
          return;
        }
      }

      setStepError(currentStep, null);
      setCompletedSteps(prev => new Set([...prev, currentStep]));

      // 수정 모드: 단계별 저장
      if (mode === 'edit' && onStepComplete) {
        console.log('💾 [FormWizard] 단계별 수정 저장:', {
          currentStep,
          stepData: currentStepData
        });

        try {
          await onStepComplete(currentStep, currentStepData);

          // 저장 성공 시 dirty 상태 초기화
          setStepDirtyState(prev => ({
            ...prev,
            [currentStep]: false
          }));

          // 초기 데이터 업데이트 (다음 변경 감지를 위해)
          setInitialStepData(currentStepData);

          console.log('✅ [FormWizard] 단계 수정 완료');
        } catch (error) {
          console.error('❌ [FormWizard] 단계 수정 실패:', error);
          setStepError(currentStep, error.message || 'Step update failed');

          // 실패 시 dirty 상태를 true로 유지하여 버튼 다시 활성화
          setStepDirtyState(prev => ({
            ...prev,
            [currentStep]: true
          }));

          return;
        }
      }
      // 생성 모드: 마지막 단계인 경우 완료 처리
      else if (mode === 'create') {
        if (isLastStep) {
          // ✅ 마지막 단계: 모든 단계의 getCurrentData를 호출하여 최신 데이터 수집
          let finalData = { ...currentStepData };

          console.log('🎯 [FormWizard] 최종 제출 - 모든 단계 데이터 수집 시작');

          steps.forEach((step, idx) => {
            if (step.ref?.current?.getCurrentData) {
              const stepFreshData = step.ref.current.getCurrentData();
              finalData = { ...finalData, ...stepFreshData };
              console.log(`✅ [FormWizard] Step ${idx} (${step.id}) 데이터 수집:`, stepFreshData);
            }
          });

          console.log('🎯 [FormWizard] 최종 제출 데이터:', finalData);

          if (onComplete) {
            try {
              await onComplete(finalData);
              // 성공 시에만 완료 처리 (에러 발생 시 현재 단계 유지)
            } catch (error) {
              // 에러 발생 시 제출 중단, 현재 단계에 머물기
              console.error('❌ [FormWizard] 제출 실패:', error);
              setStepError(currentStep, error.message || 'Submission failed');
              return; // 중요: 에러 발생 시 여기서 멈춤
            }
          }
        } else {
          nextStep();
        }
      }
    };

    return (
      <div className="wizard-step">
        {/* 단계 컴포넌트 */}
        <div className="step-content mb-8">
          <StepComponent
            ref={currentStepConfig.ref}
            data={stepData}
            onChange={updateStepData}
            {...(currentStepConfig.componentProps || {})}
          />
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          {/* 이전 버튼 */}
          <button
            type="button"
            onClick={previousStep}
            disabled={isFirstStep || loading}
            className={`
              inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${isFirstStep || loading ?
                'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed' :
                'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-mint-500'
              }
            `}
          >
            <ChevronLeftIcon className="w-4 h-4 mr-2" />
            {t('common.wizard.previous')}
          </button>

          {/* 다음/완료 버튼 (생성 모드) / 단계 수정 버튼 (수정 모드) */}
          <button
            type="button"
            onClick={handleNext}
            disabled={loading || (mode === 'edit' && !isCurrentStepDirty())}
            className={`
              inline-flex items-center px-6 py-2 text-sm font-medium text-white rounded-lg
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${loading || (mode === 'edit' && !isCurrentStepDirty()) ?
                'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' :
                'bg-gradient-to-r from-mint-500 to-green-500 hover:from-mint-600 hover:to-green-600 focus:ring-mint-500'
              }
            `}
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? t('common.wizard.processing') :
             mode === 'edit' ? t('common.wizard.updateStep', { stepTitle: steps[currentStep].title }) :
             isLastStep ? (completeBtnText || t('common.wizard.complete')) : t('common.wizard.next')}
            {!isLastStep && !loading && mode === 'create' && <ChevronRightIcon className="w-4 h-4 ml-2" />}
          </button>
        </div>

        {/* 에러 메시지 */}
        {stepErrors[currentStep] && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              {stepErrors[currentStep]}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <FormWizardContext.Provider value={contextValue}>
      <div className={`form-wizard ${className}`}>
        {/* 진행률 표시 */}
        {showProgress && (
          <FormWizardProgress />
        )}

        {/* 단계 내용 */}
        <div className="wizard-content">
          {renderCurrentStep()}
        </div>
      </div>
    </FormWizardContext.Provider>
  );
};

/**
 * 진행률 표시 컴포넌트
 */
const FormWizardProgress = ({ className = '' }) => {
  const { steps, currentStep, completedSteps, goToStep, isStepAccessible } = useContext(FormWizardContext);
  const { t } = useTranslation();

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={`wizard-progress mb-8 -mx-6 px-6 ${className}`}>
      {/* 진행률 바 */}
      <div className="relative mb-6">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-mint-500 to-green-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-label={`진행률 ${Math.round(progressPercentage)}%`}
          />
        </div>
        
        {/* 진행률 텍스트 */}
        <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span>{t('common.wizard.stepOf', { current: currentStep + 1, total: steps.length })}</span>
          <span>{t('common.wizard.progressComplete', { percent: Math.round(progressPercentage) })}</span>
        </div>
      </div>

      {/* 단계 표시기 */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStep;
          const isAccessible = isStepAccessible(index);

          return (
            <div key={index} className="flex items-center flex-1">
              {/* 단계 원 */}
              <button
                onClick={() => isAccessible && goToStep(index)}
                disabled={!isAccessible}
                className={`
                  relative w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  font-medium text-sm transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-mint-500/50
                  ${isCurrent ?
                    'border-mint-500 bg-mint-500 text-white' :
                    isCompleted ?
                      'border-green-500 bg-green-500 text-white' :
                      'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }
                  ${isAccessible ? 'hover:border-mint-400 cursor-pointer' : 'cursor-not-allowed opacity-50'}
                `}
                aria-label={`단계 ${index + 1}: ${step.title}${isCurrent ? ' (현재)' : ''}${isCompleted ? ' (완료)' : ''}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <CheckIcon className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>

              {/* 단계 레이블 */}
              <div className="ml-3 min-w-0 flex-shrink-0">
                <div className={`
                  text-sm font-medium truncate
                  ${isCurrent ? 'text-mint-600 dark:text-mint-400' :
                    isCompleted ? 'text-green-600 dark:text-green-400' :
                    'text-gray-500 dark:text-gray-400'}
                `}>
                  {step.title}
                </div>
                {step.description && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {step.description}
                  </div>
                )}
              </div>

              {/* 연결선 - 단계 사이 공간 전체를 차지 */}
              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-0.5 mx-4
                  ${index < currentStep ?
                    'bg-green-500' :
                    'bg-gray-200 dark:bg-gray-700'}
                `} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 위저드 단계 컴포넌트
 */
const WizardStep = ({ 
  stepIndex, 
  children, 
  onNext,
  onPrevious,
  canGoNext = true,
  canGoPrevious = true,
  showNavigation = true,
  className = '' 
}) => {
  const { currentStep, nextStep, previousStep, steps } = useContext(FormWizardContext);
  
  if (currentStep !== stepIndex) {
    return null;
  }

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      nextStep();
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    } else {
      previousStep();
    }
  };

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  return (
    <div className={`wizard-step ${className}`}>
      {/* 단계 내용 */}
      <div className="step-content mb-8">
        {children}
      </div>

      {/* 네비게이션 버튼 */}
      {showNavigation && (
        <div className="flex justify-between items-center">
          {/* 이전 버튼 */}
          <button
            type="button"
            onClick={handlePrevious}
            disabled={!canGoPrevious || isFirstStep}
            className={`
              inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${!canGoPrevious || isFirstStep ?
                'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed' :
                'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-mint-500'
              }
            `}
          >
            <ChevronLeftIcon className="w-4 h-4 mr-2" />
            이전
          </button>

          {/* 다음/완료 버튼 */}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext}
            className={`
              inline-flex items-center px-6 py-2 text-sm font-medium text-white rounded-lg
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${!canGoNext ?
                'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' :
                'bg-gradient-to-r from-mint-500 to-green-500 hover:from-mint-600 hover:to-green-600 focus:ring-mint-500'
              }
            `}
          >
            {isLastStep ? '완료' : '다음'}
            {!isLastStep && <ChevronRightIcon className="w-4 h-4 ml-2" />}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * 위저드 훅
 */
export const useFormWizard = () => {
  const context = useContext(FormWizardContext);
  if (!context) {
    throw new Error('useFormWizard must be used within a FormWizard');
  }
  return context;
};

FormWizard.Step = WizardStep;
FormWizard.Progress = FormWizardProgress;

export default FormWizard;