/**
 * 폼 에러 요약 컴포넌트 (점주용)
 * WCAG 3.3.1 준수, Local 테마 적용, 에러 집계 및 네비게이션
 */
'use client';

import React, { useRef, useEffect } from 'react';

const FormErrorSummary = ({
  errors = [],
  title = '다음 문제를 해결해주세요',
  className = '',
  showCount = true,
  onErrorFocus,
  priority = 'high', // low | medium | high
  variant = 'default', // default | compact | inline
  autoFocus = true,
  hideWhenEmpty = true,
  ...props
}) => {
  const summaryRef = useRef(null);
  const hasErrors = errors.length > 0;

  // 에러가 있을 때 포커스 이동 (WCAG 3.3.1)
  useEffect(() => {
    if (autoFocus && hasErrors && summaryRef.current) {
      summaryRef.current.focus();
    }
  }, [autoFocus, hasErrors]);

  // 에러 클릭 시 해당 필드로 포커스 이동
  const handleErrorClick = (error, event) => {
    event.preventDefault();
    
    if (onErrorFocus) {
      onErrorFocus(error);
      return;
    }

    // 기본 동작: 필드 ID로 포커스 이동
    if (error.fieldId) {
      const field = document.getElementById(error.fieldId);
      if (field) {
        field.focus();
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // 에러가 없으면 숨김
  if (hideWhenEmpty && !hasErrors) {
    return null;
  }

  // 우선순위별 스타일
  const getPriorityStyles = () => {
    const styles = {
      low: {
        bg: 'bg-yellow-50 dark:bg-yellow-950',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-800 dark:text-yellow-200',
        icon: 'text-yellow-600 dark:text-yellow-400'
      },
      medium: {
        bg: 'bg-orange-50 dark:bg-orange-950',
        border: 'border-orange-200 dark:border-orange-800',
        text: 'text-orange-800 dark:text-orange-200',
        icon: 'text-orange-600 dark:text-orange-400'
      },
      high: {
        bg: 'bg-red-50 dark:bg-red-950',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-800 dark:text-red-200',
        icon: 'text-red-600 dark:text-red-400'
      }
    };
    return styles[priority] || styles.high;
  };

  const priorityStyles = getPriorityStyles();

  // 아이콘 렌더링
  const renderIcon = () => (
    <svg className={`w-5 h-5 ${priorityStyles.icon} flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );

  // 컴팩트 버전
  if (variant === 'compact') {
    return (
      <div
        ref={summaryRef}
        className={`
          flex items-center space-x-2 p-3 rounded-md border
          ${priorityStyles.bg} ${priorityStyles.border}
          ${className}
        `}
        role="alert"
        aria-live="assertive"
        tabIndex={-1}
        {...props}
      >
        {renderIcon()}
        <span className={`text-sm font-medium ${priorityStyles.text}`}>
          {showCount && `${errors.length}개의 오류가 있습니다. `}
          <button
            onClick={() => errors.length > 0 && handleErrorClick(errors[0], { preventDefault: () => {} })}
            className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-1 rounded"
          >
            첫 번째 오류로 이동
          </button>
        </span>
      </div>
    );
  }

  // 인라인 버전
  if (variant === 'inline') {
    return (
      <div
        ref={summaryRef}
        className={`flex items-start space-x-2 ${className}`}
        role="alert"
        aria-live="assertive"
        tabIndex={-1}
        {...props}
      >
        {renderIcon()}
        <div className={`flex-1 text-sm ${priorityStyles.text}`}>
          {showCount && (
            <span className="font-medium">
              {errors.length}개의 오류:
            </span>
          )}
          {errors.map((error, index) => (
            <span key={error.id || index}>
              {index > 0 && ', '}
              <button
                onClick={(e) => handleErrorClick(error, e)}
                className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-1 rounded"
              >
                {error.message}
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  }

  // 기본 버전 (상세)
  return (
    <div
      ref={summaryRef}
      className={`
        p-4 rounded-lg border-l-4
        ${priorityStyles.bg} ${priorityStyles.border}
        ${className}
      `}
      role="alert"
      aria-live="assertive"
      aria-labelledby="error-summary-title"
      tabIndex={-1}
      {...props}
    >
      {/* 헤더 */}
      <div className="flex items-start space-x-3 mb-3">
        {renderIcon()}
        <div className="flex-1">
          <h3 id="error-summary-title" className={`text-sm font-semibold ${priorityStyles.text}`}>
            {title}
            {showCount && ` (${errors.length}개)`}
          </h3>
        </div>
      </div>

      {/* 에러 목록 */}
      <div className="ml-8">
        <ul className="space-y-2" role="list">
          {errors.map((error, index) => (
            <li key={error.id || index}>
              <button
                onClick={(e) => handleErrorClick(error, e)}
                className={`
                  text-left text-sm underline hover:no-underline
                  focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-1 
                  rounded px-1 py-0.5 -mx-1 -my-0.5
                  ${priorityStyles.text}
                `}
                aria-describedby={error.fieldId ? `${error.fieldId}-error` : undefined}
              >
                <span className="sr-only">오류 {index + 1}:</span>
                {error.fieldLabel && (
                  <span className="font-medium">{error.fieldLabel}: </span>
                )}
                {error.message}
              </button>
            </li>
          ))}
        </ul>

        {/* 도움말 텍스트 */}
        {errors.length > 0 && (
          <p className={`mt-3 text-xs ${priorityStyles.text} opacity-75`}>
            항목을 클릭하면 해당 필드로 이동합니다.
          </p>
        )}
      </div>
    </div>
  );
};

// 에러 요약 생성 유틸리티
export const createErrorSummary = (formErrors, fieldLabels = {}) => {
  return Object.entries(formErrors)
    .filter(([_, error]) => error)
    .map(([fieldId, error]) => ({
      id: fieldId,
      fieldId,
      fieldLabel: fieldLabels[fieldId] || fieldId,
      message: typeof error === 'string' ? error : error.message,
      type: error.type || 'error',
      priority: error.priority || 'high'
    }));
};

// 필드별 에러 그룹화
export const groupErrorsByField = (errors) => {
  return errors.reduce((groups, error) => {
    const fieldId = error.fieldId || 'general';
    if (!groups[fieldId]) {
      groups[fieldId] = [];
    }
    groups[fieldId].push(error);
    return groups;
  }, {});
};

// 우선순위별 에러 정렬
export const sortErrorsByPriority = (errors) => {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return [...errors].sort((a, b) => {
    return (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
  });
};

// Hook: 폼 에러 관리
export const useFormErrors = (initialErrors = {}) => {
  const [errors, setErrors] = React.useState(initialErrors);

  const addError = (fieldId, error) => {
    setErrors(prev => ({
      ...prev,
      [fieldId]: error
    }));
  };

  const removeError = (fieldId) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldId];
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  const hasErrors = Object.keys(errors).length > 0;
  const errorCount = Object.keys(errors).length;
  const errorSummary = createErrorSummary(errors);

  return {
    errors,
    setErrors,
    addError,
    removeError,
    clearAllErrors,
    hasErrors,
    errorCount,
    errorSummary
  };
};

export default FormErrorSummary;