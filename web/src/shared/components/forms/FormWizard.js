/**
 * 다단계 폼 위저드 컴포넌트 (점주용)
 * 진행률 표시, WCAG 2.1 준수, Local 테마 적용
 */
'use client';

import React, { useState, useCallback, useEffect } from 'react';

const FormWizard = ({
  children,
  onComplete,
  onStepChange,
  allowStepNavigation = false,
  showProgress = true,
  showStepNumbers = true,
  validateOnStepChange = true,
  persistProgress = false,
  className = '',
  progressClassName = '',
  navigationClassName = '',
  stepTitles = [],
  completeButtonText = '완료',
  nextButtonText = '다음',
  prevButtonText = '이전',
  cancelButtonText = '취소',
  onCancel,
  ...props
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [stepData, setStepData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = React.Children.toArray(children).filter(child => 
    React.isValidElement(child)
  );
  const totalSteps = steps.length;

  // 로컬 스토리지에서 진행상황 복원
  useEffect(() => {
    if (persistProgress) {
      const savedProgress = localStorage.getItem('formWizardProgress');
      if (savedProgress) {
        try {
          const { step, completed, data } = JSON.parse(savedProgress);
          setCurrentStep(step);
          setCompletedSteps(new Set(completed));
          setStepData(data);
        } catch (error) {
          console.warn('Failed to restore form wizard progress:', error);
        }
      }
    }
  }, [persistProgress]);

  // 진행상황 저장
  useEffect(() => {
    if (persistProgress) {
      const progressData = {
        step: currentStep,
        completed: Array.from(completedSteps),
        data: stepData
      };
      localStorage.setItem('formWizardProgress', JSON.stringify(progressData));
    }
  }, [currentStep, completedSteps, stepData, persistProgress]);

  // 단계 변경
  const goToStep = useCallback(async (stepIndex) => {
    if (stepIndex < 0 || stepIndex >= totalSteps) return;

    // 현재 단계 검증
    if (validateOnStepChange && stepIndex > currentStep) {
      const currentStepElement = steps[currentStep];
      if (currentStepElement.props.onValidate) {
        const isValid = await currentStepElement.props.onValidate(stepData[currentStep]);
        if (!isValid) return;
      }
    }

    // 단계 변경 전 콜백
    if (onStepChange) {
      const shouldContinue = await onStepChange(stepIndex, currentStep, stepData);
      if (shouldContinue === false) return;
    }

    setCurrentStep(stepIndex);
    
    // 완료된 단계 추적
    if (stepIndex > currentStep) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    }
  }, [currentStep, steps, stepData, onStepChange, validateOnStepChange, totalSteps]);

  // 다음 단계
  const nextStep = useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  // 이전 단계
  const prevStep = useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  // 단계 데이터 업데이트
  const updateStepData = useCallback((step, data) => {
    setStepData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...data }
    }));
  }, []);

  // 폼 완료 처리
  const handleComplete = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      // 마지막 단계 검증
      const lastStepElement = steps[currentStep];
      if (lastStepElement.props.onValidate) {
        const isValid = await lastStepElement.props.onValidate(stepData[currentStep]);
        if (!isValid) {
          setIsSubmitting(false);
          return;
        }
      }

      // 완료 처리
      if (onComplete) {
        await onComplete(stepData);
      }

      // 저장된 진행상황 삭제
      if (persistProgress) {
        localStorage.removeItem('formWizardProgress');
      }

      setCompletedSteps(prev => new Set([...prev, currentStep]));
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, steps, stepData, onComplete, isSubmitting, persistProgress]);

  // 취소 처리
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
    
    // 진행상황 초기화
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setStepData({});
    
    if (persistProgress) {
      localStorage.removeItem('formWizardProgress');
    }
  }, [onCancel, persistProgress]);

  // 현재 단계 렌더링
  const currentStepElement = steps[currentStep];
  const enhancedStepElement = currentStepElement ? React.cloneElement(currentStepElement, {
    stepIndex: currentStep,
    totalSteps,
    stepData: stepData[currentStep] || {},
    updateStepData: (data) => updateStepData(currentStep, data),
    onNext: nextStep,
    onPrev: prevStep,
    onComplete: handleComplete,
    isFirst: currentStep === 0,
    isLast: currentStep === totalSteps - 1,
    isSubmitting
  }) : null;

  // 진행률 계산
  const progressPercentage = ((currentStep) / totalSteps) * 100;

  return (
    <div 
      className={`form-wizard ${className}`}
      role="tablist"
      aria-label="다단계 폼"
      {...props}
    >
      {/* 진행률 표시 */}
      {showProgress && (
        <div className={`mb-8 ${progressClassName}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {stepTitles[currentStep] || `단계 ${currentStep + 1}`}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentStep + 1} / {totalSteps}
            </span>
          </div>

          {/* 진행률 바 */}
          <div className="relative">
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
              <div
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-vietnam-mint to-vietnam-green transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
                role="progressbar"
                aria-valuenow={currentStep + 1}
                aria-valuemin={1}
                aria-valuemax={totalSteps}
                aria-label={`진행률: ${currentStep + 1}단계 중 ${totalSteps}단계`}
              />
            </div>
          </div>

          {/* 단계 표시기 */}
          {showStepNumbers && (
            <div className="flex items-center justify-between mb-6">
              {steps.map((_, index) => {
                const isCompleted = completedSteps.has(index);
                const isCurrent = index === currentStep;
                const isClickable = allowStepNavigation && (index < currentStep || completedSteps.has(index));

                return (
                  <div key={index} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => isClickable && goToStep(index)}
                      disabled={!isClickable}
                      className={`
                        relative flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all
                        ${isCurrent
                          ? 'bg-vietnam-mint text-white ring-4 ring-vietnam-mint ring-opacity-20'
                          : isCompleted
                            ? 'bg-vietnam-green text-white hover:bg-green-600'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                        }
                        ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                      `}
                      role="tab"
                      aria-selected={isCurrent}
                      aria-controls={`step-${index}`}
                      tabIndex={isCurrent ? 0 : -1}
                      title={stepTitles[index] || `단계 ${index + 1}`}
                    >
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </button>
                    
                    {index < totalSteps - 1 && (
                      <div className={`
                        flex-1 h-1 mx-2 rounded
                        ${isCompleted
                          ? 'bg-vietnam-green'
                          : 'bg-gray-200 dark:bg-gray-600'
                        }
                      `} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 현재 단계 콘텐츠 */}
      <div
        id={`step-${currentStep}`}
        role="tabpanel"
        aria-labelledby={`step-button-${currentStep}`}
        className="mb-8"
      >
        {enhancedStepElement}
      </div>

      {/* 네비게이션 버튼 */}
      <div className={`flex items-center justify-between ${navigationClassName}`}>
        <div className="flex space-x-4">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={prevStep}
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {prevButtonText}
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {cancelButtonText}
            </button>
          )}
        </div>

        <div>
          {currentStep < totalSteps - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-vietnam-mint to-vietnam-green rounded-md hover:from-vietnam-mint hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {nextButtonText}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-vietnam-mint to-vietnam-green rounded-md hover:from-vietnam-mint hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
            >
              {isSubmitting && (
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {completeButtonText}
            </button>
          )}
        </div>
      </div>

      {/* 접근성 상태 메시지 */}
      <div className="sr-only" role="status" aria-live="polite">
        현재 {totalSteps}단계 중 {currentStep + 1}단계입니다.
        {stepTitles[currentStep] && ` ${stepTitles[currentStep]}`}
      </div>
    </div>
  );
};

// 개별 단계 컴포넌트
export const FormWizardStep = ({
  children,
  title,
  description,
  onValidate,
  className = '',
  ...props
}) => {
  return (
    <div className={`form-wizard-step ${className}`} {...props}>
      {title && (
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {description}
        </p>
      )}
      {children}
    </div>
  );
};

export default FormWizard;