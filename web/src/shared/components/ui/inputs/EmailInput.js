'use client';

import React, { useState, useEffect, useId } from 'react';
import { EnvelopeIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

/**
 * EmailInput - 프리미엄 이메일 입력 컴포넌트 (WCAG 2.1 준수, 실시간 유효성 검사, 플로팅 라벨)
 * Local App 디자인 시스템, 글래스모피즘 적용
 */
const EmailInput = ({
  value = '',
  onChange,
  placeholder = 'your@email.com',
  label = '이메일',
  required = false,
  disabled = false,
  validateOnType = true,
  error = '',
  helperText = '',
  size = 'md',
  className = '',
  onFocus,
  onBlur,
  id,
  ...rest
}) => {
  const [isValid, setIsValid] = useState(null);
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const generatedId = useId();
  const inputId = id || generatedId;

  // 프리미엄 플로팅 라벨 사이즈 시스템
  const sizeStyles = {
    sm: {
      container: 'text-sm',
      input: 'px-4 pt-6 pb-2 text-sm min-h-[48px] pl-12',
      icon: 'w-4 h-4',
      floatingLabel: 'text-xs top-2 left-12 transform scale-90',
      normalLabel: 'text-sm top-1/2 left-12 -translate-y-1/2 transform'
    },
    md: {
      container: 'text-sm',
      input: 'px-4 pt-7 pb-2.5 text-sm min-h-[56px] pl-13',
      icon: 'w-5 h-5',
      floatingLabel: 'text-xs top-2.5 left-13 transform scale-95',
      normalLabel: 'text-sm top-1/2 left-13 -translate-y-1/2 transform'
    },
    lg: {
      container: 'text-base',
      input: 'px-5 pt-8 pb-3 text-base min-h-[64px] pl-14',
      icon: 'w-5 h-5',
      floatingLabel: 'text-sm top-3 left-14 transform scale-95',
      normalLabel: 'text-base top-1/2 left-14 -translate-y-1/2 transform'
    }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  // 이메일 유효성 검사 - Local어 도메인 포함
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  useEffect(() => {
    if (validateOnType && value && isTouched) {
      setIsValid(validateEmail(value));
    }
  }, [value, validateOnType, isTouched]);

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    setIsTouched(true);
    if (onBlur) onBlur(e);
  };

  const handleChange = (e) => {
    onChange?.(e.target.value);
    if (!isTouched) setIsTouched(true);
  };

  // 프리미엄 상태별 스타일 결정 - 글래스모피즘 적용
  const getInputClasses = () => {
    const baseClasses = `
      bg-white/80 backdrop-blur-xl border-2 rounded-2xl
      shadow-lg shadow-neutral-200/30 drop-shadow-sm
      transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
      hover:shadow-xl hover:shadow-neutral-300/40
      focus:shadow-2xl focus:shadow-[#2AC1BC]/20
      before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/40 before:to-transparent before:pointer-events-none
    `;
    
    if (error || (isValid === false && isTouched)) {
      return `${baseClasses} 
        border-rose-300/60 bg-rose-50/40
        focus:border-rose-500/80 focus:ring-4 focus:ring-rose-500/20
        hover:border-rose-400/70 hover:shadow-rose-200/40
      `;
    }
    
    if (isValid === true) {
      return `${baseClasses}
        border-emerald-300/60 bg-emerald-50/40
        focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/20
        hover:border-emerald-400/70 hover:shadow-emerald-200/40
      `;
    }
    
    return `${baseClasses}
      border-neutral-200/50 
      focus:border-[#2AC1BC]/80 focus:ring-4 focus:ring-[#2AC1BC]/15
      hover:border-neutral-300/70
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
    
    if (error || (isValid === false && isTouched)) {
      return `${baseClasses} ${isFloating ? currentSize.floatingLabel : currentSize.normalLabel} text-rose-600`;
    }
    
    if (isValid === true) {
      return `${baseClasses} ${isFloating ? currentSize.floatingLabel : currentSize.normalLabel} text-emerald-600`;
    }
    
    if (isFocused) {
      return `${baseClasses} ${currentSize.floatingLabel} text-[#2AC1BC]`;
    }
    
    if (isFloating) {
      return `${baseClasses} ${currentSize.floatingLabel} text-neutral-600`;
    }
    
    return `${baseClasses} ${currentSize.normalLabel} text-neutral-500`;
  };

  return (
    <div className={`
      flex flex-col gap-3
      ${currentSize.container} 
      w-full
      ${className}
    `}>
      {/* 프리미엄 플로팅 라벨 입력 필드 컨테이너 */}
      <div className="relative group">
        {/* 플로팅 라벨 */}
        <label 
          htmlFor={inputId} 
          className={getLabelClasses()}
        >
          {label}
          {required && (
            <span className="ml-1" aria-label="필수 항목">*</span>
          )}
        </label>
        
        {/* 이메일 아이콘 - 플로팅 라벨 고려한 위치 */}
        <span 
          className={`
            absolute left-4 top-1/2 -translate-y-1/2
            ${currentSize.icon}
            pointer-events-none z-10
            transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${disabled 
              ? 'text-neutral-400' 
              : error || (isValid === false && isTouched)
                ? 'text-rose-500' 
                : isValid === true
                  ? 'text-emerald-500'
                  : isFocused 
                    ? 'text-[#2AC1BC]'
                    : 'text-neutral-500'
            }
          `}
          aria-hidden="true"
        >
          <EnvelopeIcon className={currentSize.icon} />
        </span>
        
        <input
          ref={inputRef => inputRef && inputRef}
          id={inputId}
          type="email"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFloating ? '' : placeholder}
          disabled={disabled}
          required={required}
          className={`
            relative w-full border-0 outline-none pr-12
            ${currentSize.input}
            bg-transparent text-neutral-900 font-medium
            placeholder:text-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            z-10 relative
          `}
          aria-invalid={error || isValid === false ? 'true' : 'false'}
          aria-describedby={
            (error || (isValid === false && isTouched)) ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...rest}
        />
        
        {/* 프리미엄 배경 및 테두리 레이어 */}
        <div className={`
          absolute inset-0 pointer-events-none
          ${getInputClasses()}
        `} />
        
        {/* 상태 아이콘 - 플로팅 라벨 고려한 위치 */}
        {(isValid === true || error || (isValid === false && isTouched)) && (
          <span 
            className={`
              absolute right-4 top-1/2 -translate-y-1/2
              ${currentSize.icon}
              pointer-events-none z-10
              transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${error || (isValid === false && isTouched)
                ? 'text-rose-500' 
                : isValid === true
                  ? 'text-emerald-500'
                  : 'text-neutral-500'
              }
            `}
            aria-hidden="true"
          >
            {isValid === true ? (
              <CheckCircleIcon className={currentSize.icon} />
            ) : (
              <ExclamationCircleIcon className={currentSize.icon} />
            )}
          </span>
        )}
      </div>

      {/* 프리미엄 에러/성공 메시지 */}
      {(error || (isValid === false && isTouched)) && (
        <div className="flex items-start gap-2 animate-in slide-in-from-top-1 duration-300">
          <div className="flex-shrink-0 mt-0.5">
            <ExclamationCircleIcon className="w-4 h-4 text-rose-500" />
          </div>
          <span 
            id={`${inputId}-error`} 
            className="text-sm font-medium text-rose-600 leading-relaxed" 
            role="alert"
          >
            {error || '올바른 이메일 형식이 아닙니다'}
          </span>
        </div>
      )}
      
      {isValid === true && !error && (
        <div className="flex items-start gap-2 animate-in slide-in-from-top-1 duration-300">
          <div className="flex-shrink-0 mt-0.5">
            <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
          </div>
          <span
            className="text-sm font-medium text-emerald-600 leading-relaxed"
          >
            올바른 이메일 형식입니다
          </span>
        </div>
      )}
      
      {/* 프리미엄 헬퍼 텍스트 */}
      {!error && !(isValid === false && isTouched) && helperText && (
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

export default EmailInput;