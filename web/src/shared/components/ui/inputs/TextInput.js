'use client'

/**
 * TextInput 컴포넌트 - 모바일 최적화 버전 v3.0
 * Local App 디자인 시스템, WCAG 2.1 준수
 * 
 * 모바일 최적화 특징:
 * - 컴팩트 플로팅 라벨 (40% 작은 패딩)
 * - 터치 접근성 44px 최소 높이 보장
 * - 모바일 타이포그래피 (13px 기준)
 * - 정보 밀도 최대화 레이아웃
 */

import React, { useState, useRef, useId } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { MOBILE_COMPONENT_VARIANTS, MOBILE_HEIGHTS, MOBILE_ANIMATIONS, MOBILE_COLOR_CONTRAST } from '../designTokens';

const TextInput = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  success,
  helperText,
  required = false,
  disabled = false,
  readOnly = false,
  maxLength,
  icon,
  iconPosition = 'left',
  size = 'md',
  variant = 'default',
  fullWidth = false,
  autoComplete,
  name,
  id,
  className = '',
  onFocus,
  onBlur,
  compact = false,
  dense = false,
  language, // 언어별 색상 ('ko' | 'vi' | 'en')
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const generatedId = useId();
  const inputId = id || generatedId;

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  // 모바일 최적화 플로팅 라벨 시스템 (40% 더 컴팩트)
  const sizeStyles = {
    sm: compact ? {
      container: 'text-sm',
      input: label ? 'px-3 pt-4.5 pb-1.5 text-sm min-h-[40px]' : 'px-3 py-2.5 text-sm min-h-[40px]',
      icon: 'w-3.5 h-3.5',
      label: 'text-xs font-medium tracking-wide',
      floatingLabel: 'text-xs top-1.5 left-3 transform scale-90',
      normalLabel: 'text-sm top-1/2 left-3 -translate-y-1/2 transform'
    } : {
      container: 'text-sm',
      input: label ? 'px-3.5 pt-5 pb-2 text-sm min-h-[44px]' : 'px-3.5 py-3 text-sm min-h-[44px]',
      icon: 'w-4 h-4',
      label: 'text-xs font-medium tracking-wide',
      floatingLabel: 'text-xs top-1.5 left-3.5 transform scale-90',
      normalLabel: 'text-sm top-1/2 left-3.5 -translate-y-1/2 transform'
    },
    md: compact ? {
      container: 'text-sm',
      input: label ? 'px-3.5 pt-5 pb-2 text-sm min-h-[44px]' : 'px-3.5 py-3 text-sm min-h-[44px]',
      icon: 'w-4 h-4',
      label: 'text-sm font-medium tracking-wide',
      floatingLabel: 'text-xs top-1.5 left-3.5 transform scale-95',
      normalLabel: 'text-sm top-1/2 left-3.5 -translate-y-1/2 transform'
    } : {
      container: 'text-base',
      input: label ? 'px-4 pt-6 pb-2.5 text-sm min-h-[48px] md:text-base' : 'px-4 py-3 text-sm min-h-[48px] md:text-base',
      icon: 'w-4 h-4 md:w-5 md:h-5',
      label: 'text-sm font-medium tracking-wide',
      floatingLabel: 'text-xs top-2 left-4 transform scale-95',
      normalLabel: 'text-sm top-1/2 left-4 -translate-y-1/2 transform'
    },
    lg: {
      container: 'text-base',
      input: label ? 'px-4 pt-6.5 pb-2.5 text-base min-h-[52px] md:px-5 md:pt-7 md:pb-3 md:min-h-[56px]' : 'px-4 py-3.5 text-base min-h-[52px] md:px-5 md:py-4 md:min-h-[56px]',
      icon: 'w-4 h-4 md:w-5 md:h-5',
      label: 'text-base font-medium tracking-wide',
      floatingLabel: 'text-sm top-2.5 left-4 transform scale-95 md:top-3 md:left-5',
      normalLabel: 'text-base top-1/2 left-4 -translate-y-1/2 transform md:left-5'
    }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  // 모바일 최적화 입력 필드 스타일 (배터리 효율적)
  const getInputClasses = () => {
    const baseClasses = `
      bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border rounded-xl
      shadow-md shadow-neutral-200/25 dark:shadow-neutral-900/25
      ${MOBILE_ANIMATIONS.normal}
      hover:shadow-lg hover:shadow-neutral-300/30 dark:hover:shadow-neutral-900/30
      focus:shadow-lg focus:shadow-[#2AC1BC]/15
    `;

    if (error) {
      return `${baseClasses}
        border-rose-400/70 dark:border-rose-500/70 bg-rose-50/50 dark:bg-rose-900/20
        focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20
        hover:border-rose-500/80
      `;
    }

    if (success) {
      return `${baseClasses}
        border-emerald-400/70 dark:border-emerald-500/70 bg-emerald-50/50 dark:bg-emerald-900/20
        focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
        hover:border-emerald-500/80
      `;
    }

    // 언어별 색상 스타일
    if (language === 'ko') {
      return `${baseClasses}
        border-blue-300 dark:border-blue-600
        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
        hover:border-blue-400 dark:hover:border-blue-500
        text-blue-900 dark:text-blue-100
      `;
    }

    if (language === 'vi') {
      return `${baseClasses}
        border-emerald-300 dark:border-emerald-600
        focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
        hover:border-emerald-400 dark:hover:border-emerald-500
        text-emerald-900 dark:text-emerald-100
      `;
    }

    if (language === 'en') {
      return `${baseClasses}
        border-amber-300 dark:border-amber-600
        focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
        hover:border-amber-400 dark:hover:border-amber-500
        text-amber-900 dark:text-amber-100
      `;
    }

    return `${baseClasses}
      border-neutral-300/60 dark:border-gray-600/60
      focus:border-[#2AC1BC] focus:ring-2 focus:ring-[#2AC1BC]/20
      hover:border-neutral-400/80 dark:hover:border-gray-500/80
    `;
  };

  // 플로팅 라벨 상태 결정
  const isFloating = isFocused || value;
  const getLabelClasses = () => {
    const baseClasses = `
      absolute pointer-events-none z-10
      transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
      font-semibold tracking-wide
      ${disabled ? 'text-neutral-400' : ''}
    `;
    
    if (error) {
      return `${baseClasses} ${isFloating ? currentSize.floatingLabel : currentSize.normalLabel} text-rose-600`;
    }
    
    if (success && !error) {
      return `${baseClasses} ${isFloating ? currentSize.floatingLabel : currentSize.normalLabel} text-emerald-600`;
    }
    
    if (isFocused) {
      return `${baseClasses} ${currentSize.floatingLabel} text-[#2AC1BC]`;
    }
    
    if (isFloating) {
      return `${baseClasses} ${currentSize.floatingLabel} text-neutral-600 dark:text-gray-300`;
    }

    return `${baseClasses} ${currentSize.normalLabel} text-neutral-500 dark:text-gray-400`;
  };

  return (
    <div className={`
      flex flex-col gap-3
      ${currentSize.container} 
      ${fullWidth ? 'w-full' : ''} 
      ${className}
    `}>
      {/* 프리미엄 플로팅 라벨 입력 필드 컨테이너 */}
      <div className="relative group">
        {/* 플로팅 라벨 */}
        {label && (
          <label 
            htmlFor={inputId} 
            className={getLabelClasses()}
          >
            {label}
            {required && (
              <span className="ml-1" aria-label="필수 항목">*</span>
            )}
          </label>
        )}
        
        {/* 왼쪽 아이콘 - 플로팅 라벨 고려한 위치 */}
        {icon && iconPosition === 'left' && (
          <span
            className={`
              absolute ${label ? (isFloating ? 'left-4 top-7' : 'left-4 top-1/2 -translate-y-1/2') : 'left-4 top-1/2 -translate-y-1/2'}
              ${currentSize.icon}
              pointer-events-none z-10
              transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${disabled
                ? 'text-neutral-400'
                : error
                  ? 'text-rose-500'
                  : success && !error
                    ? 'text-emerald-500'
                    : isFocused
                      ? 'text-[#2AC1BC]'
                      : 'text-neutral-500'
              }
            `}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFloating ? '' : placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          maxLength={maxLength}
          autoComplete={autoComplete}
          className={`
            relative w-full border-0 outline-none
            ${currentSize.input}
            ${icon && iconPosition === 'left' ? 'pl-11' : ''}
            ${icon && iconPosition === 'right' ? 'pr-11' : ''}
            ${success && !error ? 'pr-11' : ''}
            ${maxLength ? 'pr-20' : ''}
            bg-transparent text-neutral-900 dark:text-gray-100 font-medium
            placeholder:text-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${readOnly ? 'cursor-default' : ''}
            z-10 relative
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        
        {/* 프리미엄 배경 및 테두리 레이어 */}
        <div className={`
          absolute inset-0 pointer-events-none
          ${getInputClasses()}
        `} />
        
        {/* 오른쪽 아이콘 또는 상태 아이콘 - 플로팅 라벨 고려한 위치 */}
        {(icon && iconPosition === 'right') || success ? (
          <span
            className={`
              absolute ${label ? (isFloating ? 'right-4 top-7' : 'right-4 top-1/2 -translate-y-1/2') : 'right-4 top-1/2 -translate-y-1/2'}
              ${currentSize.icon}
              pointer-events-none z-10
              transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${disabled
                ? 'text-neutral-400'
                : error
                  ? 'text-rose-500'
                  : success && !error
                    ? 'text-emerald-500'
                    : isFocused
                      ? 'text-[#2AC1BC]'
                      : 'text-neutral-500'
              }
            `}
            aria-hidden="true"
          >
            {success && !error ? (
              <CheckCircleIcon className={currentSize.icon} />
            ) : (
              icon
            )}
          </span>
        ) : null}

        {/* 프리미엄 글자 수 표시 */}
        {maxLength && (
          <span
            className={`
              absolute ${label ? (isFloating ? 'right-4 bottom-2' : 'right-4 top-1/2 -translate-y-1/2') : 'right-4 top-1/2 -translate-y-1/2'}
              text-xs font-medium pointer-events-none z-10
              transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${(icon && iconPosition === 'right') || success ? 'right-12' : ''}
              ${disabled ? 'text-neutral-400' : 'text-neutral-500'}
            `}
            aria-live="polite"
          >
            <span className={value?.length === maxLength ? 'text-amber-500 font-semibold' : ''}>
              {value?.length || 0}
            </span>
            <span className="text-neutral-400">/{maxLength}</span>
          </span>
        )}
      </div>
      
      {/* 프리미엄 에러 메시지 */}
      {error && (
        <div className="flex items-start gap-2 animate-in slide-in-from-top-1 duration-300">
          <div className="flex-shrink-0 mt-0.5">
            <ExclamationCircleIcon className="w-4 h-4 text-rose-500" />
          </div>
          <span 
            id={`${inputId}-error`} 
            className="text-sm font-medium text-rose-600 leading-relaxed" 
            role="alert"
          >
            {error}
          </span>
        </div>
      )}
      
      {/* 프리미엄 성공 메시지 */}
      {success && !error && (
        <div className="flex items-start gap-2 animate-in slide-in-from-top-1 duration-300">
          <div className="flex-shrink-0 mt-0.5">
            <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
          </div>
          <span
            id={`${inputId}-success`} 
            className="text-sm font-medium text-emerald-600 leading-relaxed"
          >
            {success}
          </span>
        </div>
      )}
      
      {/* 프리미엄 헬퍼 텍스트 */}
      {!error && !success && helperText && (
        <span 
          id={`${inputId}-helper`} 
          className="text-sm font-medium text-neutral-600 leading-relaxed pl-1"
        >
          {helperText}
        </span>
      )}
    </div>
  );
};

export { TextInput as Input };
export default TextInput;