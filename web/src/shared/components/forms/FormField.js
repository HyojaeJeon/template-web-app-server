/**
 * 폼 필드 래퍼 컴포넌트 (점주용)
 * 라벨-입력 연결, WCAG 2.1 준수, Local 테마 적용
 */
'use client';

import React from 'react';

const FormField = ({
  children,
  label,
  id,
  required = false,
  error,
  success,
  helperText,
  disabled = false,
  className = '',
  labelClassName = '',
  fieldClassName = '',
  helperClassName = '',
  errorClassName = '',
  layout = 'vertical', // vertical | horizontal
  labelPosition = 'top', // top | left | right
  showOptionalText = true,
  ...props
}) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helperId = helperText ? `${fieldId}-helper` : undefined;

  const labelElement = label && (
    <label
      htmlFor={fieldId}
      className={`
        block text-sm font-medium
        ${disabled 
          ? 'text-gray-400 dark:text-gray-600' 
          : error 
            ? 'text-red-600 dark:text-red-400'
            : success
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-700 dark:text-gray-300'
        }
        ${layout === 'horizontal' ? 'flex-shrink-0' : ''}
        ${labelPosition === 'top' ? 'mb-2' : ''}
        ${labelPosition === 'left' && layout === 'horizontal' ? 'mr-4 pt-2' : ''}
        ${labelPosition === 'right' && layout === 'horizontal' ? 'ml-4 pt-2' : ''}
        ${labelClassName}
      `}
    >
      {label}
      {required && (
        <span 
          className="text-red-500 ml-1" 
          aria-label="필수 항목"
          title="필수 항목"
        >
          *
        </span>
      )}
      {!required && showOptionalText && (
        <span 
          className="text-gray-400 dark:text-gray-500 ml-2 font-normal"
          aria-label="선택 항목"
        >
          (선택사항)
        </span>
      )}
    </label>
  );

  const fieldElement = (
    <div className={`relative ${fieldClassName}`}>
      {React.cloneElement(children, {
        id: fieldId,
        'aria-describedby': [helperId, errorId].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? 'true' : undefined,
        'aria-required': required ? 'true' : undefined,
        className: `
          ${children.props.className || ''}
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${success ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''}
        `.trim()
      })}
      
      {/* 성공 아이콘 */}
      {success && !error && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-green-500" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
      )}
      
      {/* 에러 아이콘 */}
      {error && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-red-500" 
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
      )}
    </div>
  );

  const helperElement = helperText && (
    <p 
      id={helperId}
      className={`
        mt-2 text-sm
        ${disabled 
          ? 'text-gray-400 dark:text-gray-600' 
          : success && !error
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-500 dark:text-gray-400'
        }
        ${helperClassName}
      `}
    >
      {helperText}
    </p>
  );

  const errorElement = error && (
    <p 
      id={errorId}
      role="alert"
      aria-live="polite"
      className={`
        mt-2 text-sm text-red-600 dark:text-red-400 flex items-center
        ${errorClassName}
      `}
    >
      <svg 
        className="h-4 w-4 mr-1 flex-shrink-0" 
        fill="currentColor" 
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path 
          fillRule="evenodd" 
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
          clipRule="evenodd" 
        />
      </svg>
      <span>{error}</span>
    </p>
  );

  if (layout === 'horizontal') {
    return (
      <div className={`${className}`} {...props}>
        <div className="flex items-start">
          {labelPosition === 'left' && labelElement}
          <div className="flex-1">
            {labelPosition === 'top' && labelElement}
            {fieldElement}
            {helperElement}
            {errorElement}
          </div>
          {labelPosition === 'right' && labelElement}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`} {...props}>
      {labelElement}
      {fieldElement}
      {helperElement}
      {errorElement}
    </div>
  );
};

export default FormField;