'use client'

import { useState, useEffect, createContext, useContext } from 'react'

// ButtonGroup 컨텍스트
const ButtonGroupContext = createContext()

/**
 * ButtonGroup - 버튼 그룹 컴포넌트 (WCAG 2.1 준수)
 * 라디오 버튼 형태로 동작하는 버튼 그룹
 */
const ButtonGroup = ({
  children,
  value,
  defaultValue,
  onChange,
  orientation = 'horizontal',
  size = 'md',
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  ariaLabel,
  className = '',
  ...props
}) => {
  const [selectedValue, setSelectedValue] = useState(value || defaultValue)

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
    }
  }, [value])

  const handleSelect = (newValue) => {
    if (disabled) return
    
    setSelectedValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  const orientationClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col w-full'
  }

  return (
    <ButtonGroupContext.Provider 
      value={{ 
        selectedValue, 
        handleSelect, 
        size, 
        variant, 
        disabled,
        orientation 
      }}
    >
      <div
        role="group"
        aria-label={ariaLabel}
        className={`
          inline-flex
          ${orientationClasses[orientation]}
          ${fullWidth ? 'w-full' : ''}
          ${orientation === 'horizontal' ? 'gap-0' : 'gap-2'}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    </ButtonGroupContext.Provider>
  )
}

/**
 * ButtonGroupItem - 버튼 그룹 아이템 컴포넌트
 */
const ButtonGroupItem = ({
  value,
  children,
  icon,
  disabled: itemDisabled = false,
  className = '',
  ...props
}) => {
  const context = useContext(ButtonGroupContext)
  
  if (!context) {
    throw new Error('ButtonGroupItem must be used within a ButtonGroup')
  }

  const { 
    selectedValue, 
    handleSelect, 
    size, 
    variant, 
    disabled: groupDisabled,
    orientation 
  } = context

  const isSelected = selectedValue === value
  const isDisabled = groupDisabled || itemDisabled

  // 크기별 클래스
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[36px]',
    md: 'px-6 py-3 text-base min-h-[44px]',
    lg: 'px-8 py-4 text-lg min-h-[52px]'
  }

  // 변형별 클래스
  const getVariantClasses = () => {
    if (isSelected) {
      switch (variant) {
        case 'primary':
          return `
            bg-gradient-to-r from-[#2AC1BC] to-[#00B14F]
            text-white
            shadow-lg
            z-10
          `
        case 'secondary':
          return `
            bg-gradient-to-r from-gray-700 to-gray-800
            text-white
            shadow-lg
            z-10
          `
        case 'outline':
          return `
            bg-white
            text-[#2AC1BC]
            border-2 border-[#2AC1BC]
            shadow-md
            z-10
          `
        default:
          return `
            bg-gradient-to-r from-[#2AC1BC] to-[#00B14F]
            text-white
            shadow-lg
            z-10
          `
      }
    } else {
      switch (variant) {
        case 'primary':
        case 'secondary':
          return `
            bg-white
            text-gray-700
            border border-gray-300
            hover:bg-gray-50
            hover:border-[#2AC1BC]
            hover:text-[#2AC1BC]
          `
        case 'outline':
          return `
            bg-transparent
            text-gray-600
            border border-gray-300
            hover:border-[#2AC1BC]
            hover:text-[#2AC1BC]
          `
        default:
          return `
            bg-white
            text-gray-700
            border border-gray-300
            hover:bg-gray-50
          `
      }
    }
  }

  // 라운딩 클래스 (첫 번째와 마지막 버튼에만 적용)
  const getRoundingClasses = () => {
    if (orientation === 'vertical') {
      return 'rounded-xl'
    }
    
    const isFirst = props['data-first']
    const isLast = props['data-last']
    
    if (isFirst && isLast) return 'rounded-xl'
    if (isFirst) return 'rounded-l-xl rounded-r-none'
    if (isLast) return 'rounded-r-xl rounded-l-none'
    return 'rounded-none'
  }

  const handleClick = () => {
    if (!isDisabled) {
      handleSelect(value)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
    
    // 방향키 네비게이션
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = e.target.nextElementSibling
      if (next) next.focus()
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = e.target.previousElementSibling
      if (prev) prev.focus()
    }
  }

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        relative
        inline-flex items-center justify-center
        gap-2
        font-medium
        transition-all duration-200
        ${sizeClasses[size]}
        ${getVariantClasses()}
        ${getRoundingClasses()}
        ${orientation === 'horizontal' ? '-ml-px first:ml-0' : ''}
        ${orientation === 'vertical' ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${!isDisabled && !isSelected ? 'hover:z-20' : ''}
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#2AC1BC]
        focus-visible:ring-offset-2
        focus-visible:z-20
        ${className}
      `}
      {...props}
    >
      {icon && (
        <span className="inline-flex" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
      
      {/* 선택 표시기 */}
      {isSelected && (
        <span 
          className="absolute inset-0 rounded-inherit ring-2 ring-[#2AC1BC]/20"
          aria-hidden="true"
        />
      )}
    </button>
  )
}

ButtonGroup.Item = ButtonGroupItem

export default ButtonGroup