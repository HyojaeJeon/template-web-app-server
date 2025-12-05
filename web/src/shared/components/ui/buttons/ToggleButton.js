'use client'

import { forwardRef, useState } from 'react'

/**
 * ToggleButton - 토글 버튼/스위치 컴포넌트 (WCAG 2.1 준수)
 * On/Off 상태를 전환하는 접근성 높은 토글 버튼
 */
const ToggleButton = forwardRef(({
  checked = false,
  defaultChecked = false,
  onChange,
  disabled = false,
  size = 'md',
  label,
  labelPosition = 'right',
  color = 'primary',
  showStateText = false,
  onText = 'On',
  offText = 'Off',
  className = '',
  ...props
}, ref) => {
  const [isChecked, setIsChecked] = useState(defaultChecked || checked)

  // 크기별 클래스
  const sizeClasses = {
    sm: {
      track: 'h-6 w-11',
      thumb: 'h-4 w-4',
      translate: 'translate-x-5',
      label: 'text-sm'
    },
    md: {
      track: 'h-7 w-14',
      thumb: 'h-5 w-5',
      translate: 'translate-x-7',
      label: 'text-base'
    },
    lg: {
      track: 'h-8 w-16',
      thumb: 'h-6 w-6',
      translate: 'translate-x-8',
      label: 'text-lg'
    }
  }

  // 색상별 클래스
  const colorClasses = {
    primary: 'bg-gradient-to-r from-[#2AC1BC] to-[#00B14F]',
    secondary: 'bg-gradient-to-r from-gray-600 to-gray-700',
    success: 'bg-gradient-to-r from-green-500 to-green-600',
    danger: 'bg-gradient-to-r from-red-500 to-red-600',
    warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600'
  }

  const handleToggle = () => {
    if (disabled) return

    const newCheckedState = !isChecked
    setIsChecked(newCheckedState)
    
    if (onChange) {
      onChange(newCheckedState)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <label 
      className={`
        inline-flex items-center 
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${labelPosition === 'left' ? 'flex-row-reverse' : ''}
        gap-3
        ${className}
      `}
    >
      <div className="relative">
        {/* 트랙 (배경) */}
        <div
          className={`
            ${sizeClasses[size].track}
            rounded-full
            transition-all duration-300
            ${isChecked 
              ? colorClasses[color]
              : 'bg-gray-300'
            }
            ${disabled ? '' : 'hover:shadow-lg'}
            relative
            overflow-hidden
          `}
        >
          {/* 상태 텍스트 (선택사항) */}
          {showStateText && (
            <span 
              className={`
                absolute inset-0 
                flex items-center 
                text-white text-xs font-medium
                transition-opacity duration-200
                ${isChecked ? 'opacity-100 pl-2' : 'opacity-0'}
              `}
              aria-hidden="true"
            >
              {onText}
            </span>
          )}
          {showStateText && (
            <span 
              className={`
                absolute inset-0 
                flex items-center justify-end
                text-gray-600 text-xs font-medium
                transition-opacity duration-200
                ${!isChecked ? 'opacity-100 pr-2' : 'opacity-0'}
              `}
              aria-hidden="true"
            >
              {offText}
            </span>
          )}
        </div>

        {/* 썸 (움직이는 원) */}
        <div
          className={`
            absolute top-1
            ${sizeClasses[size].thumb}
            bg-white
            rounded-full
            shadow-md
            transition-all duration-300
            transform
            ${isChecked 
              ? `${sizeClasses[size].translate} left-1` 
              : 'translate-x-1 left-0'
            }
            ${!disabled && 'hover:shadow-lg'}
          `}
        >
          {/* 상태 아이콘 (선택사항) */}
          {isChecked && (
            <svg 
              className="w-full h-full p-0.5 text-[#00B14F]" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          )}
        </div>

        {/* 실제 체크박스 (숨김, 접근성용) */}
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          className="sr-only"
          checked={isChecked}
          onChange={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-checked={isChecked}
          aria-label={label || (isChecked ? onText : offText)}
        />
      </div>

      {/* 라벨 */}
      {label && (
        <span 
          className={`
            ${sizeClasses[size].label}
            font-medium
            ${disabled ? 'text-gray-400' : 'text-gray-700'}
            select-none
          `}
        >
          {label}
        </span>
      )}
    </label>
  )
})

ToggleButton.displayName = 'ToggleButton'

// Switch 호환성을 위한 래퍼 컴포넌트
const Switch = forwardRef(({ onCheckedChange, checked, ...props }, ref) => {
  return (
    <ToggleButton
      ref={ref}
      checked={checked}
      onChange={onCheckedChange || props.onChange}
      {...props}
    />
  );
});

Switch.displayName = 'Switch';

export { Switch, ToggleButton };
export default ToggleButton;