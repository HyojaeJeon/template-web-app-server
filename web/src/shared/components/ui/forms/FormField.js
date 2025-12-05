'use client';

import { forwardRef, useId, useState } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

/**
 * 접근 가능한 폼 필드 컴포넌트 (WCAG 2.1 준수)
 * Local 테마 컬러와 다크모드 지원
 *
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.label - 필드 라벨
 * @param {string} props.name - 필드 name 속성
 * @param {string} props.type - 입력 타입
 * @param {string} props.value - 입력 값
 * @param {Function} props.onChange - 값 변경 핸들러
 * @param {Function} props.onBlur - 블러 이벤트 핸들러
 * @param {Function} props.onFocus - 포커스 이벤트 핸들러
 * @param {string} props.placeholder - 플레이스홀더 텍스트
 * @param {boolean} props.required - 필수 필드 여부
 * @param {boolean} props.disabled - 비활성화 여부
 * @param {boolean} props.readonly - 읽기 전용 여부
 * @param {string} props.error - 에러 메시지
 * @param {string} props.success - 성공 메시지
 * @param {string} props.hint - 도움말 텍스트
 * @param {string} props.size - 크기 ('sm' | 'md' | 'lg')
 * @param {string} props.variant - 스타일 변형
 * @param {React.ReactNode} props.leftIcon - 좌측 아이콘
 * @param {React.ReactNode} props.rightIcon - 우측 아이콘
 * @param {React.ReactNode} props.children - 커스텀 입력 요소
 * @param {boolean} props.showThousandSeparator - 천 단위 구분자 표시 (number type일 때)
 * @param {string} props.language - 언어별 색상 적용 ('ko' | 'vi' | 'en')
 */
const FormField = forwardRef(({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  required = false,
  disabled = false,
  readonly = false,
  error,
  success,
  hint,
  size = 'md',
  variant = 'default',
  leftIcon,
  rightIcon,
  children,
  className = '',
  showThousandSeparator = false,
  language, // 언어별 색상
  ...props
}, ref) => {
  const fieldId = useId();
  const errorId = useId();
  const hintId = useId();
  const successId = useId();
  const [isFocused, setIsFocused] = useState(false);

  // 천 단위 구분자 추가 함수
  const formatNumber = (num) => {
    if (num === '' || num === null || num === undefined) return '';

    // 숫자를 문자열로 변환 (지수 표기법 방지)
    const numStr = typeof num === 'number' ? num.toLocaleString('en-US', {
      useGrouping: false,
      maximumFractionDigits: 20
    }) : String(num);

    const cleanNum = numStr.replace(/,/g, '');

    // 유효한 숫자 형식이 아니면 원본 반환
    if (!/^-?\d*\.?\d*$/.test(cleanNum)) return num;

    const parts = cleanNum.split('.');
    // 정수 부분에 천 단위 구분자 추가
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // 숫자에서 구분자 제거 함수
  const parseNumber = (str) => {
    if (str === '' || str === null || str === undefined) return '';
    return String(str).replace(/,/g, '');
  };

  // number 타입이고 천 단위 구분자가 활성화된 경우 처리
  const isNumberWithSeparator = type === 'number' && showThousandSeparator;

  // 항상 포맷팅된 값 표시 (입력 중에도)
  const displayValue = isNumberWithSeparator ? formatNumber(value) : value;

  // onChange 핸들러 래핑
  const handleChange = (e) => {
    if (isNumberWithSeparator) {
      const inputValue = e.target.value;
      const rawValue = parseNumber(inputValue);

      // 빈 값 허용
      if (rawValue === '') {
        onChange?.({ ...e, target: { ...e.target, value: '' } });
        return;
      }

      // 유효한 숫자 형식만 허용 (양수, 소수점만 - 음수 금지)
      if (!/^\d*\.?\d*$/.test(rawValue)) return;

      // 🔢 GraphQL Int 타입 제한: 8자리 숫자까지만 허용 (99,999,999)
      // 정수 부분만 추출 (소수점 이전)
      const integerPart = rawValue.split('.')[0];
      if (integerPart.length > 8) {
        // 8자리 초과 시 입력 무시
        return;
      }

      // parseFloat 대신 Number 사용하여 더 정확한 변환
      const numValue = Number(rawValue);

      // NaN 체크
      if (isNaN(numValue)) {
        onChange?.({ ...e, target: { ...e.target, value: '' } });
        return;
      }

      // GraphQL Int 범위 체크 (양수만, 32-bit signed integer 최대값)
      // 0 ~ 2,147,483,647 (약 21억)
      if (numValue < 0 || numValue > 2147483647) {
        return; // 범위 초과 시 입력 무시
      }

      // 지수 표기법 방지를 위해 문자열로 저장
      onChange?.({ ...e, target: { ...e.target, value: rawValue } });
    } else {
      onChange?.(e);
    }
  };

  // onFocus 핸들러 래핑
  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  // onBlur 핸들러 래핑
  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // 상태 스타일 계산
  const getFieldState = () => {
    if (error) return 'error';
    if (success) return 'success';
    // 언어별 색상 적용
    if (language === 'ko') return 'korean';
    if (language === 'vi') return 'vietnamese';
    if (language === 'en') return 'english';
    return 'default';
  };

  const fieldState = getFieldState();

  // 크기별 스타일
  const sizeStyles = {
    sm: {
      input: 'h-8 px-2 text-sm',
      label: 'text-sm mb-1',
      icon: 'w-4 h-4',
      padding: 'pl-8 pr-8'
    },
    md: {
      input: 'h-10 px-3 text-base',
      label: 'text-sm mb-1.5',
      icon: 'w-5 h-5',
      padding: 'pl-10 pr-10'
    },
    lg: {
      input: 'h-12 px-4 text-lg',
      label: 'text-base mb-2',
      icon: 'w-6 h-6',
      padding: 'pl-12 pr-12'
    }
  };

  // 상태별 스타일
  const stateStyles = {
    default: {
      border: 'border-gray-300 dark:border-gray-600',
      focus: 'focus:border-mint-500 focus:ring-mint-500/20',
      bg: 'bg-white dark:bg-gray-800',
      text: 'text-gray-900 dark:text-white'
    },
    error: {
      border: 'border-red-500 dark:border-red-400',
      focus: 'focus:border-red-500 focus:ring-red-500/20',
      bg: 'bg-red-50 dark:bg-red-900/10',
      text: 'text-gray-900 dark:text-white'
    },
    success: {
      border: 'border-green-500 dark:border-green-400',
      focus: 'focus:border-green-500 focus:ring-green-500/20',
      bg: 'bg-green-50 dark:bg-green-900/10',
      text: 'text-gray-900 dark:text-white'
    },
    // 언어별 색상 스타일
    korean: {
      border: 'border-blue-300 dark:border-blue-600',
      focus: 'focus:border-blue-500 focus:ring-blue-500/20',
      bg: 'bg-white dark:bg-gray-800',
      text: 'text-blue-900 dark:text-blue-100'
    },
    vietnamese: {
      border: 'border-emerald-300 dark:border-emerald-600',
      focus: 'focus:border-emerald-500 focus:ring-emerald-500/20',
      bg: 'bg-white dark:bg-gray-800',
      text: 'text-emerald-900 dark:text-emerald-100'
    },
    english: {
      border: 'border-amber-300 dark:border-amber-600',
      focus: 'focus:border-amber-500 focus:ring-amber-500/20',
      bg: 'bg-white dark:bg-gray-800',
      text: 'text-amber-900 dark:text-amber-100'
    }
  };

  // 입력 필드 클래스
  const inputClasses = `
    w-full rounded-lg border-2 transition-all duration-200
    placeholder:text-gray-400 dark:placeholder:text-gray-500
    disabled:opacity-50 disabled:cursor-not-allowed
    readonly:bg-gray-50 readonly:dark:bg-gray-900
    focus:outline-none focus:ring-2
    ${type === 'number' ? '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' : ''}
    ${sizeStyles[size].input}
    ${stateStyles[fieldState].border}
    ${stateStyles[fieldState].focus}
    ${stateStyles[fieldState].bg}
    ${stateStyles[fieldState].text}
    ${leftIcon ? sizeStyles[size].padding.split(' ')[0] : ''}
    ${rightIcon ? sizeStyles[size].padding.split(' ')[1] : ''}
  `.trim().replace(/\s+/g, ' ');

  // 상태 아이콘
  const StateIcon = () => {
    if (error) {
      return (
        <ExclamationCircleIcon 
          className={`${sizeStyles[size].icon} text-red-500 dark:text-red-400`}
          aria-hidden="true"
        />
      );
    }
    if (success) {
      return (
        <CheckCircleIcon 
          className={`${sizeStyles[size].icon} text-green-500 dark:text-green-400`}
          aria-hidden="true"
        />
      );
    }
    return null;
  };

  // ARIA 속성
  const ariaDescribedBy = [
    error && errorId,
    success && successId,
    hint && hintId
  ].filter(Boolean).join(' ');

  return (
    <div className={`space-y-1 ${className}`}>
      {/* 라벨 */}
      {label && (
        <label 
          htmlFor={fieldId}
          className={`
            block font-medium text-gray-700 dark:text-gray-300
            ${sizeStyles[size].label}
            ${required ? "after:content-['*'] after:text-red-500 after:ml-1" : ''}
          `}
        >
          {label}
        </label>
      )}

      {/* 입력 필드 컨테이너 */}
      <div className="relative">
        {/* 좌측 아이콘 */}
        {leftIcon && (
          <div className={`
            absolute left-3 top-1/2 transform -translate-y-1/2 
            text-gray-400 dark:text-gray-500
            ${disabled || readonly ? 'opacity-50' : ''}
          `}>
            <div className={sizeStyles[size].icon}>
              {leftIcon}
            </div>
          </div>
        )}

        {/* 커스텀 입력 요소 또는 기본 input/textarea */}
        {children ? (
          <div className="relative">
            {children}
          </div>
        ) : type === 'textarea' ? (
          <textarea
            ref={ref}
            id={fieldId}
            name={name}
            value={displayValue || ''}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readonly}
            className={`${inputClasses} min-h-[100px] resize-y py-3`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={ariaDescribedBy || undefined}
            {...props}
          />
        ) : (
          <input
            ref={ref}
            id={fieldId}
            name={name}
            type={isNumberWithSeparator ? 'text' : type}
            inputMode={isNumberWithSeparator ? 'numeric' : undefined}
            value={displayValue || ''}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readonly}
            className={inputClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={ariaDescribedBy || undefined}
            {...props}
          />
        )}

        {/* 우측 아이콘 또는 상태 아이콘 */}
        <div className={`
          absolute right-3 top-1/2 transform -translate-y-1/2
          flex items-center gap-2
        `}>
          {rightIcon && (
            <div className={`
              text-gray-400 dark:text-gray-500
              ${disabled || readonly ? 'opacity-50' : ''}
            `}>
              <div className={sizeStyles[size].icon}>
                {rightIcon}
              </div>
            </div>
          )}
          <StateIcon />
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="min-h-[1.25rem]">
        {/* 에러 메시지 */}
        {error && (
          <div 
            id={errorId}
            className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
            role="alert"
            aria-live="polite"
          >
            <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* 성공 메시지 */}
        {success && !error && (
          <div 
            id={successId}
            className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
            role="status"
            aria-live="polite"
          >
            <CheckCircleIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{success}</span>
          </div>
        )}

        {/* 도움말 텍스트 */}
        {hint && !error && !success && (
          <div 
            id={hintId}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
          >
            <InformationCircleIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{hint}</span>
          </div>
        )}
      </div>
    </div>
  );
});

FormField.displayName = 'FormField';

export { FormField };
export default FormField;