'use client';

/**
 * PasswordInput 컴포넌트 - 모바일 최적화 v3.0
 * Local App 디자인 시스템, WCAG 2.1 준수
 * 
 * 모바일 최적화 특징:
 * - 30-40% 더 컴팩트한 패딩/마진으로 공간 절약  
 * - 터치 접근성 44px 최소 높이 보장
 * - 모바일 우선 반응형 타이포그래피
 * - 배터리 효율적 애니메이션 적용
 * - 정보 밀도 극대화 레이아웃
 * - 터치 최적화 비밀번호 토글 버튼
 */

import React, { useState, useCallback, useId } from 'react';
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import {
  MOBILE_COMPONENT_VARIANTS,
  MOBILE_HEIGHTS,
  MOBILE_ANIMATIONS,
  MOBILE_COLOR_CONTRAST,
  MOBILE_SPACING,
  MOBILE_TYPOGRAPHY
} from '../designTokens';
const PasswordInput = ({
  value = '',
  onChange,
  placeholder = 'Enter password',
  label = '',
  required = false,
  disabled = false,
  readOnly = false,
  autoComplete = 'current-password',
  showStrength = false,
  showRequirements = false,
  requirements = {
    minLength: 8,
    hasUpperCase: true,
    hasLowerCase: true,
    hasNumber: true,
    hasSpecial: true
  },
  error = '',
  success = '',
  helperText = '',
  size = 'md',
  variant = 'default',
  fullWidth = false,
  className = '',
  // 모바일 최적화 props
  compact = false,
  dense = false,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const generatedId = useId();
  const inputId = rest.id || generatedId;

  // 모바일 최적화 사이즈 시스템 (30-40% 더 컴팩트)
  const sizeStyles = {
    sm: compact ? {
      container: 'text-sm',
      input: MOBILE_COMPONENT_VARIANTS.input.compact.xs + ' pr-11',
      label: 'text-xs font-medium tracking-wide',
      icon: 'w-3.5 h-3.5',
      togglePosition: 'right-3',
      toggleButton: 'p-1.5 min-w-[32px] min-h-[32px]'
    } : {
      container: 'text-sm',
      input: MOBILE_COMPONENT_VARIANTS.input.compact.sm + ' pr-12',
      label: 'text-sm font-medium tracking-wide',
      icon: 'w-4 h-4',
      togglePosition: 'right-3.5',
      toggleButton: 'p-2 min-w-[36px] min-h-[36px]'
    },
    md: compact ? {
      container: 'text-sm',
      input: MOBILE_COMPONENT_VARIANTS.input.compact.sm + ' pr-12',
      label: 'text-sm font-medium tracking-wide',
      icon: 'w-4 h-4',
      togglePosition: 'right-3.5',
      toggleButton: 'p-2 min-w-[36px] min-h-[36px]'
    } : {
      container: 'text-base',
      input: MOBILE_COMPONENT_VARIANTS.input.compact.md + ' pr-12',
      label: 'text-sm font-medium tracking-wide',
      icon: 'w-4 h-4 md:w-5 md:h-5',
      togglePosition: 'right-4',
      toggleButton: 'p-2.5 min-w-[44px] min-h-[44px]'
    },
    lg: {
      container: 'text-base',
      input: 'px-4 py-3 text-base min-h-[52px] pr-14 md:px-5 md:py-4 md:min-h-[56px]',
      label: 'text-base font-medium tracking-wide',
      icon: 'w-4 h-4 md:w-5 md:h-5',
      togglePosition: 'right-4 md:right-5',
      toggleButton: 'p-2.5 min-w-[44px] min-h-[44px]'
    }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;
  
  // 모바일 최적화 입력 필드 스타일
  const getInputClasses = () => {
    const baseClasses = `
      w-full border-0 rounded-xl bg-white/90 backdrop-blur-lg 
      shadow-md shadow-neutral-200/25
      ${MOBILE_ANIMATIONS.normal}
      hover:shadow-lg hover:shadow-neutral-300/30
      focus:shadow-lg focus:shadow-[#2AC1BC]/15
      focus:outline-none focus:ring-2
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

  // 비밀번호 강도 계산
  const calculateStrength = useCallback(() => {
    if (!value) return 0;

    let strength = 0;
    const checks = [
      value.length >= requirements.minLength,
      requirements.hasUpperCase ? /[A-Z]/.test(value) : true,
      requirements.hasLowerCase ? /[a-z]/.test(value) : true,
      requirements.hasNumber ? /[0-9]/.test(value) : true,
      requirements.hasSpecial ? /[!@#$%^&*(),.?":{}|<>]/.test(value) : true,
    ];

    strength = checks.filter(Boolean).length;
    return (strength / checks.length) * 100;
  }, [value, requirements]);

  // 비밀번호 강도 표시 색상
  const getStrengthColor = (strength) => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 60) return 'bg-orange-500';
    if (strength < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength) => {
    if (strength < 40) return '약함';
    if (strength < 60) return '보통';
    if (strength < 80) return '강함';
    return '매우 강함';
  };

  // 비밀번호 요구사항 체크
  const checkRequirement = (type) => {
    if (!value) return false;
    
    switch (type) {
      case 'length':
        return value.length >= requirements.minLength;
      case 'uppercase':
        return !requirements.hasUpperCase || /[A-Z]/.test(value);
      case 'lowercase':
        return !requirements.hasLowerCase || /[a-z]/.test(value);
      case 'number':
        return !requirements.hasNumber || /[0-9]/.test(value);
      case 'special':
        return !requirements.hasSpecial || /[!@#$%^&*(),.?":{}|<>]/.test(value);
      default:
        return false;
    }
  };

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const strength = calculateStrength();

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
        <input
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoComplete={autoComplete}
          className={`
            ${currentSize.input}
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
          aria-required={required}
          {...rest}
        />

        {/* 모바일 최적화 배경 레이어 */}
        <div className={`
          absolute inset-0 pointer-events-none
          ${getInputClasses()}
        `} />

        {/* 터치 최적화 비밀번호 토글 버튼 */}
        <button
          type="button"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          className={`
            absolute ${currentSize.togglePosition} top-1/2 -translate-y-1/2
            ${currentSize.toggleButton}
            rounded-lg
            ${MOBILE_ANIMATIONS.normal}
            ${disabled 
              ? 'text-neutral-400 cursor-not-allowed' 
              : error 
                ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-50' 
                : success
                  ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
                  : isFocused 
                    ? 'text-[#2AC1BC] hover:text-[#1A9A95] hover:bg-[#2AC1BC]/10'
                    : 'text-neutral-500 hover:text-neutral-600 hover:bg-neutral-100'
            }
            focus:outline-none focus:ring-2 focus:ring-[#2AC1BC]/20
            ${MOBILE_ANIMATIONS.touch}
            z-10
          `}
          aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
        >
          {showPassword ? (
            <EyeSlashIcon className={currentSize.icon} />
          ) : (
            <EyeIcon className={currentSize.icon} />
          )}
        </button>
      </div>

      {/* 비밀번호 강도 표시 */}
      {showStrength && value && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">비밀번호 강도</span>
            <span className={`text-xs font-medium ${
              strength < 40 ? 'text-red-500' :
              strength < 60 ? 'text-orange-500' :
              strength < 80 ? 'text-yellow-500' : 'text-green-500'
            }`}>
              {getStrengthText(strength)}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${getStrengthColor(strength)}`}
              style={{ width: `${strength}%` }}
            />
          </div>
        </div>
      )}

      {/* 비밀번호 요구사항 표시 */}
      {showRequirements && isFocused && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">비밀번호 요구사항:</p>
          <ul className="space-y-1">
            <li className="flex items-center text-xs">
              {checkRequirement('length') ? (
                <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" />
              ) : (
                <ExclamationCircleIcon className="w-4 h-4 mr-2 text-gray-400" />
              )}
              <span className={checkRequirement('length') ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                최소 {requirements.minLength}자 이상
              </span>
            </li>
            {requirements.hasUpperCase && (
              <li className="flex items-center text-xs">
                {checkRequirement('uppercase') ? (
                  <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <ExclamationCircleIcon className="w-4 h-4 mr-2 text-gray-400" />
                )}
                <span className={checkRequirement('uppercase') ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                  대문자 포함
                </span>
              </li>
            )}
            {requirements.hasLowerCase && (
              <li className="flex items-center text-xs">
                {checkRequirement('lowercase') ? (
                  <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <ExclamationCircleIcon className="w-4 h-4 mr-2 text-gray-400" />
                )}
                <span className={checkRequirement('lowercase') ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                  소문자 포함
                </span>
              </li>
            )}
            {requirements.hasNumber && (
              <li className="flex items-center text-xs">
                {checkRequirement('number') ? (
                  <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <ExclamationCircleIcon className="w-4 h-4 mr-2 text-gray-400" />
                )}
                <span className={checkRequirement('number') ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                  숫자 포함
                </span>
              </li>
            )}
            {requirements.hasSpecial && (
              <li className="flex items-center text-xs">
                {checkRequirement('special') ? (
                  <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <ExclamationCircleIcon className="w-4 h-4 mr-2 text-gray-400" />
                )}
                <span className={checkRequirement('special') ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                  특수문자 포함
                </span>
              </li>
            )}
          </ul>
        </div>
      )}

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

export default PasswordInput;