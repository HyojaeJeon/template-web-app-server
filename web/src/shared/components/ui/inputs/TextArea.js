'use client';

import React, { forwardRef } from 'react';

/**
 * TextArea 컴포넌트 - 여러 줄 텍스트 입력
 * Local App MVP - 점주용 관리자 시스템
 */
const TextArea = forwardRef(({
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder = '',
  rows = 4,
  maxLength,
  disabled = false,
  readOnly = false,
  required = false,
  error = false,
  errorMessage = '',
  label = '',
  helperText = '',
  className = '',
  resize = 'vertical', // 'none', 'vertical', 'horizontal', 'both'
  language, // 언어별 색상 ('ko' | 'vi' | 'en')
  ...props
}, ref) => {
  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize'
  };

  // 언어별 스타일 생성
  const getBorderStyle = () => {
    if (error) return 'border-red-500 dark:border-red-400';

    if (language === 'ko') {
      return 'border-blue-300 dark:border-blue-600 focus:border-blue-500 focus:ring-blue-500/20 text-blue-900 dark:text-blue-100';
    }
    if (language === 'vi') {
      return 'border-emerald-300 dark:border-emerald-600 focus:border-emerald-500 focus:ring-emerald-500/20 text-emerald-900 dark:text-emerald-100';
    }
    if (language === 'en') {
      return 'border-amber-300 dark:border-amber-600 focus:border-amber-500 focus:ring-amber-500/20 text-amber-900 dark:text-amber-100';
    }

    return 'border-gray-300 dark:border-gray-600';
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        className={`
          w-full px-4 py-3 rounded-lg
          border ${getBorderStyle()}
          bg-white dark:bg-gray-800
          ${!language && 'text-gray-900 dark:text-gray-100'}
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 ${!language && 'focus:ring-primary-500'} ${!error && !language && 'focus:border-transparent'}
          disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500
          readOnly:bg-gray-50 dark:readOnly:bg-gray-900 readOnly:cursor-default
          transition-colors duration-200
          ${resizeClasses[resize]}
          ${className}
        `}
        {...props}
      />

      {/* Helper text or error message */}
      {(helperText || errorMessage) && (
        <p className={`mt-2 text-sm ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {error ? errorMessage : helperText}
        </p>
      )}

      {/* Character count */}
      {maxLength && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
          {value?.length || 0} / {maxLength}
        </div>
      )}
    </div>
  );
});

TextArea.displayName = 'TextArea';

export { TextArea };
export default TextArea;
