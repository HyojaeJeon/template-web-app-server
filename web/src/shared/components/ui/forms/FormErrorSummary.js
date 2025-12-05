/**
 * @fileoverview 폼 에러 요약 컴포넌트 - WCAG 2.1 준수
 * WCAG 3.3.1 Error Identification 준수
 * Local App 테마 색상 및 접근성 지원
 * 
 * @version 1.0.0
 * @author DeliveryVN Team
 */

'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/**
 * 폼 에러 요약 컴포넌트
 * @param {Object} props
 * @param {Object} [props.errors={}] - 에러 객체 {fieldName: errorMessage}
 * @param {Object} [props.fieldLabels={}] - 필드 레이블 매핑 {fieldName: label}
 * @param {string} [props.title='다음 오류를 수정해주세요'] - 에러 요약 제목
 * @param {boolean} [props.autoFocus=true] - 에러 발생 시 자동 포커스
 * @param {boolean} [props.showCount=true] - 에러 개수 표시
 * @param {Function} [props.onErrorClick] - 에러 항목 클릭 핸들러
 * @param {boolean} [props.scrollToError=true] - 에러 필드로 스크롤
 * @param {string} [props.position='top'] - 위치 (top, bottom)
 * @param {string} [props.variant='standard'] - 스타일 변형 (standard, compact, inline)
 * @param {boolean} [props.dismissible=false] - 닫기 가능 여부
 * @param {Function} [props.onDismiss] - 닫기 핸들러
 * @param {string} [props.className] - 추가 CSS 클래스
 * @param {string} [props.ariaLabel] - 접근성 레이블
 * @returns {JSX.Element}
 */
const FormErrorSummary = ({
  errors = {},
  fieldLabels = {},
  title = '다음 오류를 수정해주세요',
  autoFocus = true,
  showCount = true,
  onErrorClick,
  scrollToError = true,
  position = 'top',
  variant = 'standard',
  dismissible = false,
  onDismiss,
  className = '',
  ariaLabel,
  ...props
}) => {
  const summaryRef = useRef(null);
  const prevErrorCountRef = useRef(0);

  // 에러 배열로 변환
  const errorEntries = Object.entries(errors).filter(([_, message]) => message);
  const hasErrors = errorEntries.length > 0;
  const errorCount = errorEntries.length;

  // 에러가 새로 발생했을 때 포커스 이동
  useEffect(() => {
    if (autoFocus && hasErrors && errorCount > prevErrorCountRef.current) {
      // 새로운 에러가 발생했을 때만 포커스 이동
      if (summaryRef.current) {
        summaryRef.current.focus();
        // 스크린 리더에게 알림
        summaryRef.current.setAttribute('aria-live', 'assertive');
        setTimeout(() => {
          summaryRef.current?.setAttribute('aria-live', 'polite');
        }, 1000);
      }
    }
    prevErrorCountRef.current = errorCount;
  }, [autoFocus, hasErrors, errorCount]);

  // 에러 항목 클릭 핸들러
  const handleErrorClick = useCallback((fieldName, errorMessage) => {
    // 커스텀 클릭 핸들러가 있으면 사용
    if (onErrorClick) {
      onErrorClick(fieldName, errorMessage);
      return;
    }

    // 기본 동작: 해당 필드로 포커스 이동 및 스크롤
    if (scrollToError) {
      // 다양한 선택자로 필드 찾기
      const fieldSelectors = [
        `[name="${fieldName}"]`,
        `#${fieldName}`,
        `[data-field="${fieldName}"]`,
        `[aria-label*="${fieldName}"]`
      ];

      let targetField = null;
      for (const selector of fieldSelectors) {
        targetField = document.querySelector(selector);
        if (targetField) break;
      }

      if (targetField) {
        // 필드로 스크롤
        targetField.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // 포커스 이동 (약간의 지연을 주어 스크롤이 완료된 후 포커스)
        setTimeout(() => {
          targetField.focus();
        }, 300);
      }
    }
  }, [onErrorClick, scrollToError]);

  // 키보드 네비게이션 핸들러
  const handleKeyDown = useCallback((e, fieldName, errorMessage) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleErrorClick(fieldName, errorMessage);
    }
  }, [handleErrorClick]);

  // 에러가 없으면 렌더링하지 않음
  if (!hasErrors) {
    return null;
  }

  // 스타일 변형별 클래스
  const variantClasses = {
    standard: 'p-4 rounded-lg border-l-4',
    compact: 'p-3 rounded border-l-2',
    inline: 'p-2 rounded border'
  };

  const baseClasses = `
    bg-red-50 dark:bg-red-900/20 
    border-red-500 dark:border-red-400 
    ${variantClasses[variant]}
    ${position === 'bottom' ? 'mt-6' : 'mb-6'}
    ${className}
  `.trim();

  return (
    <div
      ref={summaryRef}
      role="alert"
      aria-labelledby="error-summary-title"
      aria-describedby="error-summary-content"
      aria-label={ariaLabel}
      tabIndex={-1}
      className={baseClasses}
      {...props}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          {/* 에러 아이콘 */}
          <div className="flex-shrink-0 mr-3">
            <svg 
              className="w-5 h-5 text-red-600 dark:text-red-400" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>

          {/* 제목 */}
          <div>
            <h3 
              id="error-summary-title"
              className={`font-semibold text-red-800 dark:text-red-200 ${
                variant === 'compact' ? 'text-sm' : 
                variant === 'inline' ? 'text-sm' : 'text-base'
              }`}
            >
              {title}
              {showCount && (
                <span className="ml-2 text-sm font-normal">
                  ({errorCount}개)
                </span>
              )}
            </h3>
            
            {variant === 'standard' && (
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                아래 오류를 해결한 후 다시 시도해주세요.
              </p>
            )}
          </div>
        </div>

        {/* 닫기 버튼 */}
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-3 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 rounded"
            aria-label="에러 요약 닫기"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        )}
      </div>

      {/* 에러 목록 */}
      <div 
        id="error-summary-content"
        className={variant === 'inline' ? 'mt-1' : 'mt-3'}
      >
        <ul className="space-y-1">
          {errorEntries.map(([fieldName, errorMessage], index) => {
            const fieldLabel = fieldLabels[fieldName] || fieldName;
            const isClickable = onErrorClick || scrollToError;

            return (
              <li key={fieldName} className="flex items-start">
                <span 
                  className={`text-sm ${
                    variant === 'inline' ? 'text-xs' : 'text-sm'
                  }`}
                  aria-hidden="true"
                >
                  •
                </span>
                
                {isClickable ? (
                  <button
                    type="button"
                    onClick={() => handleErrorClick(fieldName, errorMessage)}
                    onKeyDown={(e) => handleKeyDown(e, fieldName, errorMessage)}
                    className={`
                      ml-2 text-left underline hover:no-underline 
                      focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 rounded
                      text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100
                      ${variant === 'inline' ? 'text-xs' : 'text-sm'}
                    `}
                    aria-describedby={`error-${fieldName}-${index}`}
                  >
                    <span className="font-medium">{fieldLabel}:</span> {errorMessage}
                  </button>
                ) : (
                  <span 
                    className={`
                      ml-2 text-red-700 dark:text-red-300
                      ${variant === 'inline' ? 'text-xs' : 'text-sm'}
                    `}
                  >
                    <span className="font-medium">{fieldLabel}:</span> {errorMessage}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* 접근성 개선을 위한 추가 정보 */}
      {variant === 'standard' && errorCount > 3 && (
        <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">
            💡 각 오류를 클릭하면 해당 필드로 이동합니다.
          </p>
        </div>
      )}

      {/* 스크린 리더를 위한 추가 컨텍스트 */}
      <div className="sr-only">
        총 {errorCount}개의 오류가 있습니다. 
        {scrollToError ? '각 오류를 선택하면 해당 필드로 이동합니다.' : ''}
      </div>
    </div>
  );
};

export default FormErrorSummary;