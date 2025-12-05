'use client';

/**
 * NumberInput 컴포넌트 - 모바일 최적화 v3.0  
 * Local App 디자인 시스템, WCAG 2.1 준수
 * 
 * 모바일 최적화 특징:
 * - 30-40% 더 컴팩트한 패딩/마진으로 공간 절약
 * - 터치 접근성 44px 최소 높이 보장
 * - 모바일 우선 반응형 타이포그래피 
 * - 배터리 효율적 애니메이션 적용
 * - 정보 밀도 극대화 레이아웃
 */

import React, { useState, useRef, useId } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import {
  MOBILE_COMPONENT_VARIANTS,
  MOBILE_HEIGHTS,
  MOBILE_ANIMATIONS,
  MOBILE_COLOR_CONTRAST,
  MOBILE_SPACING,
  MOBILE_TYPOGRAPHY
} from '../designTokens';

const NumberInput = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  error,
  success,
  helperText,
  required = false,
  disabled = false,
  readOnly = false,
  showThousandSeparator = true,
  prefix,
  suffix,
  size = 'md',
  variant = 'default',
  fullWidth = false,
  name,
  id,
  className = '',
  onFocus,
  onBlur,
  // 모바일 최적화 props
  compact = false,
  dense = false,
  iconOnly = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef(null);
  const generatedId = useId();
  const inputId = id || generatedId;

  // Format number with thousand separator
  const formatNumber = (num) => {
    if (!num && num !== 0) return '';
    if (!showThousandSeparator) return String(num);
    
    const parts = String(num).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // Parse formatted number
  const parseNumber = (str) => {
    if (!str) return '';
    const cleanStr = str.replace(/,/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? '' : num;
  };

  // Handle input change
  const handleChange = (e) => {
    const inputValue = e.target.value.replace(/,/g, '');
    
    // Allow empty string
    if (inputValue === '') {
      setDisplayValue('');
      if (onChange) onChange({ target: { value: '' } });
      return;
    }

    // Validate number input
    if (!/^-?\d*\.?\d*$/.test(inputValue)) return;
    
    const numValue = parseFloat(inputValue);
    
    // Check min/max constraints
    if (min !== undefined && numValue < min) return;
    if (max !== undefined && numValue > max) return;
    
    setDisplayValue(inputValue);
    if (onChange) {
      onChange({ target: { value: isNaN(numValue) ? '' : numValue } });
    }
  };

  // Handle focus
  const handleFocus = (e) => {
    setIsFocused(true);
    setDisplayValue(value || '');
    if (onFocus) onFocus(e);
  };

  // Handle blur
  const handleBlur = (e) => {
    setIsFocused(false);
    setDisplayValue(formatNumber(value));
    if (onBlur) onBlur(e);
  };


  // 모바일 최적화 사이즈 시스템 (30-40% 더 컴팩트)
  const sizeStyles = {
    sm: compact ? {
      container: 'text-sm',
      input: MOBILE_COMPONENT_VARIANTS.input.compact.xs,
      label: 'text-xs font-medium tracking-wide',
      icon: 'w-3.5 h-3.5',
      prefix: 'text-xs left-3',
      suffix: 'text-xs right-3'
    } : {
      container: 'text-sm',
      input: MOBILE_COMPONENT_VARIANTS.input.compact.sm,
      label: 'text-sm font-medium tracking-wide',
      icon: 'w-4 h-4',
      prefix: 'text-sm left-3.5',
      suffix: 'text-sm right-3.5'
    },
    md: compact ? {
      container: 'text-sm',
      input: MOBILE_COMPONENT_VARIANTS.input.compact.sm,
      label: 'text-sm font-medium tracking-wide',
      icon: 'w-4 h-4',
      prefix: 'text-sm left-3.5',
      suffix: 'text-sm right-3.5'
    } : {
      container: 'text-base',
      input: MOBILE_COMPONENT_VARIANTS.input.compact.md,
      label: 'text-sm font-medium tracking-wide',
      icon: 'w-4 h-4 md:w-5 md:h-5',
      prefix: 'text-sm left-4',
      suffix: 'text-sm right-4'
    },
    lg: {
      container: 'text-base',
      input: 'px-4 py-3 text-base min-h-[52px] md:px-5 md:py-4 md:min-h-[56px]',
      label: 'text-base font-medium tracking-wide',
      icon: 'w-4 h-4 md:w-5 md:h-5',
      prefix: 'text-base left-4 md:left-5',
      suffix: 'text-base right-4 md:right-5'
    }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;
  const displayedValue = isFocused ? displayValue : formatNumber(value);

  // 모바일 최적화 입력 필드 스타일
  const getInputClasses = () => {
    const baseClasses = `
      w-full border-0 rounded-xl bg-white/90 backdrop-blur-lg 
      shadow-md shadow-neutral-200/25
      ${MOBILE_ANIMATIONS.normal}
      hover:shadow-lg hover:shadow-neutral-300/30
      focus:shadow-lg focus:shadow-[#2AC1BC]/15
      focus:outline-none focus:ring-2
      appearance-none
      [&::-webkit-outer-spin-button]:appearance-none
      [&::-webkit-inner-spin-button]:appearance-none
      [-moz-appearance:textfield]
    `;
    
    if (error) {
      return `${baseClasses} 
        border-rose-400/70 bg-rose-50/50
        focus:border-rose-500 focus:ring-rose-500/20
        hover:border-rose-500/80
      `;
    }
    
    if (success) {
      return `${baseClasses}
        border-emerald-400/70 bg-emerald-50/50
        focus:border-emerald-500 focus:ring-emerald-500/20
        hover:border-emerald-500/80
      `;
    }
    
    return `${baseClasses}
      border-neutral-300/60 
      focus:border-[#2AC1BC] focus:ring-[#2AC1BC]/20
      hover:border-neutral-400/80
    `;
  };

  return (
    <div className={`
      flex flex-col gap-3
      ${currentSize.container} 
      ${fullWidth ? 'w-full' : ''} 
      ${className}
    `}>
      {/* 모바일 최적화 라벨 */}
      {label && (
        <label 
          htmlFor={inputId} 
          className={`
            ${currentSize.label}
            ${MOBILE_COLOR_CONTRAST.text.primary}
            ${disabled ? 'text-neutral-400' : ''}
          `}
        >
          {label}
          {required && (
            <span className="text-rose-500 ml-1" aria-label="필수 항목">*</span>
          )}
        </label>
      )}
      
      {/* 모바일 최적화 입력 필드 컨테이너 */}
      <div className="relative group">
        {prefix && (
          <span 
            className={`
              absolute ${currentSize.prefix} top-1/2 -translate-y-1/2 
              ${currentSize.icon}
              pointer-events-none z-10
              ${MOBILE_ANIMATIONS.normal}
              ${disabled 
                ? 'text-neutral-400' 
                : error 
                  ? 'text-rose-500' 
                  : success
                    ? 'text-emerald-500'
                    : isFocused 
                      ? 'text-[#2AC1BC]'
                      : 'text-neutral-500'
              }
            `}
            aria-hidden="true"
          >
            {prefix}
          </span>
        )}
        
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          inputMode="numeric"
          value={displayedValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          className={`
            ${currentSize.input}
            ${prefix ? 'pl-11' : ''}
            ${suffix ? 'pr-11' : ''}
            ${success && !error ? 'pr-11' : ''}
            bg-transparent text-neutral-900 font-medium
            placeholder:text-neutral-400
            disabled:opacity-50 disabled:cursor-not-allowed
            ${readOnly ? 'cursor-default bg-neutral-50/50' : ''}
            z-10 relative
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          {...props}
        />
        
        {/* 모바일 최적화 배경 레이어 */}
        <div className={`
          absolute inset-0 pointer-events-none
          ${getInputClasses()}
        `} />
        
        {/* 오른쪽 아이콘 또는 상태 표시 */}
        {(suffix || success) && (
          <span 
            className={`
              absolute ${currentSize.suffix} top-1/2 -translate-y-1/2
              ${currentSize.icon}
              pointer-events-none z-10
              ${MOBILE_ANIMATIONS.normal}
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
              suffix
            )}
          </span>
        )}
      </div>
      
      {/* 모바일 최적화 에러 메시지 */}
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
      
      {/* 모바일 최적화 성공 메시지 */}
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
      
      {/* 모바일 최적화 헬퍼 텍스트 */}
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

export default NumberInput;