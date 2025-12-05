/**
 * Local App 테마 입력 컴포넌트
 * WCAG 2.1 준수, 다크모드 지원, Local 브랜드 컬러 적용
 */
'use client';

import React, { useState, forwardRef } from 'react';

const VietnamInput = forwardRef(({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  success,
  helperText,
  leftIcon: LeftIcon = null,
  rightIcon: RightIcon = null,
  onRightIconPress,
  variant = 'default', // default, search, phone, password, otp
  size = 'medium', // small, medium, large
  disabled = false,
  required = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete = 'off',
  secureTextEntry = false,
  className = '',
  inputClassName = '',
  style,
  inputStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const getContainerStyles = () => {
    const baseStyles = 'relative';
    
    switch (variant) {
      case 'search':
        return `${baseStyles}`;
      case 'phone':
        return `${baseStyles}`;
      case 'password':
        return `${baseStyles}`;
      case 'otp':
        return `${baseStyles} items-center`;
      default:
        return baseStyles;
    }
  };

  const getInputStyles = () => {
    const baseStyles = 'rounded-xl transition-all duration-200 font-medium';
    const focusStyles = isFocused ? 'border-vietnam-mint shadow-lg shadow-vietnam-mint/10 dark:shadow-vietnam-mint/20' : 'border-gray-300 dark:border-gray-600';
    const errorStyles = error ? 'border-vietnam-error shadow-lg shadow-red-500/10' : '';
    const successStyles = success ? 'border-vietnam-green shadow-lg shadow-vietnam-green/10' : '';
    const disabledStyles = disabled ? 'bg-gray-100 opacity-60 dark:bg-gray-700' : 'bg-white dark:bg-gray-800';
    const darkMode = 'dark:text-white dark:placeholder-gray-400';
    
    let sizeStyles = '';
    switch (size) {
      case 'small':
        sizeStyles = 'px-3 py-2 text-sm min-h-[36px]';
        break;
      case 'large':
        sizeStyles = 'px-5 py-4 text-lg min-h-[56px]';
        break;
      case 'medium':
      default:
        sizeStyles = 'px-4 py-3 text-base min-h-[48px]';
        break;
    }

    if (variant === 'search') {
      return `${baseStyles} ${sizeStyles} ${disabledStyles} ${darkMode} border-2 ${focusStyles} ${errorStyles} ${successStyles} ${LeftIcon ? 'pl-12' : ''} ${RightIcon ? 'pr-12' : ''}`;
    }

    if (variant === 'otp') {
      return `${baseStyles} ${disabledStyles} ${darkMode} border-2 ${focusStyles} ${errorStyles} w-12 h-12 text-center text-lg font-bold`;
    }

    return `${baseStyles} ${sizeStyles} ${disabledStyles} ${darkMode} border-2 ${focusStyles} ${errorStyles} ${successStyles} ${LeftIcon ? 'pl-12' : ''} ${RightIcon ? 'pr-12' : ''}`;
  };

  const getLabelStyles = () => {
    const baseStyles = 'mb-2 font-semibold';
    const colorStyles = error ? 'text-vietnam-error' : success ? 'text-vietnam-green' : 'text-gray-700 dark:text-gray-300';
    const sizeStyles = size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base';
    
    return `${baseStyles} ${colorStyles} ${sizeStyles}`;
  };

  const getHelperTextStyles = () => {
    const baseStyles = 'mt-2 text-sm';
    const colorStyles = error ? 'text-vietnam-error' : success ? 'text-vietnam-green' : 'text-gray-600 dark:text-gray-400';
    
    return `${baseStyles} ${colorStyles}`;
  };

  const renderLabel = () => {
    if (!label) return null;
    
    return (
      <label className={getLabelStyles()}>
        {label}
        {required && <span className="text-vietnam-error ml-1">*</span>}
      </label>
    );
  };

  const renderLeftIcon = () => {
    if (!LeftIcon) return null;
    
    return (
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
        <LeftIcon 
          size={size === 'small' ? 18 : size === 'large' ? 24 : 20} 
          color={error ? '#DA020E' : isFocused ? '#2AC1BC' : '#6B7280'} 
        />
      </div>
    );
  };

  const renderRightIcon = () => {
    if (!RightIcon) return null;
    
    const IconComponent = (
      <RightIcon 
        size={size === 'small' ? 18 : size === 'large' ? 24 : 20} 
        color={error ? '#DA020E' : success ? '#00B14F' : isFocused ? '#2AC1BC' : '#6B7280'} 
      />
    );

    if (onRightIconPress) {
      return (
        <button 
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1 border-0 bg-transparent cursor-pointer"
          onClick={onRightIconPress}
          aria-label={`${label} 추가 동작`}
        >
          {IconComponent}
        </button>
      );
    }

    return (
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
        {IconComponent}
      </div>
    );
  };

  const renderHelperText = () => {
    if (!helperText && !error) return null;
    
    return (
      <span className={getHelperTextStyles()}>
        {error || helperText}
      </span>
    );
  };

  const renderCharacterCount = () => {
    if (!maxLength || !value) return null;
    
    return (
      <span className={`mt-1 text-sm text-right ${value.length > maxLength * 0.9 ? 'text-vietnam-warning' : 'text-gray-500 dark:text-gray-400'}`}>
        {value.length}/{maxLength}
      </span>
    );
  };

  const getAccessibilityProps = () => ({
    'aria-label': accessibilityLabel || label || placeholder,
    'aria-describedby': accessibilityHint || (error ? `오류: ${error}` : helperText),
    'aria-disabled': disabled,
    'aria-required': required
  });

  return (
    <div className={`${getContainerStyles()} ${className}`} style={style}>
      {renderLabel()}
      
      <div className="relative">
        {renderLeftIcon()}
        
        {multiline ? (
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChangeText && onChangeText(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={numberOfLines || 1}
            maxLength={maxLength}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`${getInputStyles()} ${inputClassName} resize-none`}
            style={{
              ...inputStyle,
              '::placeholder': {
                color: error ? '#DA020E' : '#9CA3AF'
              }
            }}
            data-testid={testID}
            {...getAccessibilityProps()}
            {...props}
          />
        ) : (
          <input
            ref={ref}
            type={secureTextEntry ? 'password' : keyboardType === 'email-address' ? 'email' : keyboardType === 'numeric' ? 'number' : keyboardType === 'phone-pad' ? 'tel' : 'text'}
            value={value}
            onChange={(e) => onChangeText && onChangeText(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`${getInputStyles()} ${inputClassName}`}
            style={{
              ...inputStyle,
              '::placeholder': {
                color: error ? '#DA020E' : '#9CA3AF'
              }
            }}
            data-testid={testID}
            {...getAccessibilityProps()}
            {...props}
          />
        )}
        
        {renderRightIcon()}
      </div>
      
      {renderHelperText()}
      {renderCharacterCount()}
    </div>
  );
});

VietnamInput.displayName = 'VietnamInput';

export default VietnamInput;