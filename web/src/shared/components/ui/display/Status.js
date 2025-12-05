'use client';

import React from 'react';

/**
 * Status 컴포넌트 - WCAG 2.1 준수
 * 다양한 상태를 시각적으로 표시하는 컴포넌트
 */
const Status = ({
  status = 'idle',
  label,
  size = 'md',
  showPulse = false,
  showIcon = true,
  variant = 'dot',
  gradient = false,
  className = '',
  ...props
}) => {
  // 상태별 색상 설정
  const statusConfig = {
    online: {
      color: 'bg-[#00b14f]',
      gradient: 'bg-gradient-to-r from-[#00b14f] to-[#00c458]',
      text: 'text-[#00b14f]',
      label: label || 'Online',
      icon: '✓',
    },
    offline: {
      color: 'bg-gray-400',
      gradient: 'bg-gradient-to-r from-gray-400 to-gray-500',
      text: 'text-gray-500',
      label: label || 'Offline',
      icon: '○',
    },
    busy: {
      color: 'bg-[#FFDD00]',
      gradient: 'bg-gradient-to-r from-[#FFDD00] to-[#FFE555]',
      text: 'text-[#FF8C00]',
      label: label || 'Busy',
      icon: '−',
    },
    away: {
      color: 'bg-orange-500',
      gradient: 'bg-gradient-to-r from-orange-400 to-orange-500',
      text: 'text-orange-500',
      label: label || 'Away',
      icon: '⏰',
    },
    error: {
      color: 'bg-[#DA020E]',
      gradient: 'bg-gradient-to-r from-[#DA020E] to-[#FF1F2C]',
      text: 'text-[#DA020E]',
      label: label || 'Error',
      icon: '✕',
    },
    success: {
      color: 'bg-[#00b14f]',
      gradient: 'bg-gradient-to-r from-[#00b14f] to-[#00c458]',
      text: 'text-[#00b14f]',
      label: label || 'Success',
      icon: '✓',
    },
    pending: {
      color: 'bg-[#2ac1bc]',
      gradient: 'bg-gradient-to-r from-[#2ac1bc] to-[#3ec8c3]',
      text: 'text-[#2ac1bc]',
      label: label || 'Pending',
      icon: '⏳',
    },
    processing: {
      color: 'bg-blue-500',
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
      text: 'text-blue-500',
      label: label || 'Processing',
      icon: '↻',
    },
    idle: {
      color: 'bg-gray-300',
      gradient: 'bg-gradient-to-r from-gray-300 to-gray-400',
      text: 'text-gray-400',
      label: label || 'Idle',
      icon: '◉',
    },
  };

  const config = statusConfig[status] || statusConfig.idle;

  // 사이즈별 스타일
  const sizeStyles = {
    xs: {
      dot: 'w-2 h-2',
      text: 'text-xs',
      icon: 'text-xs',
      gap: 'gap-1',
    },
    sm: {
      dot: 'w-2.5 h-2.5',
      text: 'text-sm',
      icon: 'text-sm',
      gap: 'gap-1.5',
    },
    md: {
      dot: 'w-3 h-3',
      text: 'text-sm',
      icon: 'text-base',
      gap: 'gap-2',
    },
    lg: {
      dot: 'w-4 h-4',
      text: 'text-base',
      icon: 'text-lg',
      gap: 'gap-2.5',
    },
    xl: {
      dot: 'w-5 h-5',
      text: 'text-lg',
      icon: 'text-xl',
      gap: 'gap-3',
    },
  };

  const currentSize = sizeStyles[size];

  // Dot 컴포넌트
  const DotIndicator = () => (
    <div className="relative inline-flex">
      <span
        className={`
          ${gradient ? config.gradient : config.color}
          ${currentSize.dot}
          rounded-full
        `}
      />
      {showPulse && (
        <span
          className={`
            absolute inline-flex h-full w-full
            rounded-full animate-ping opacity-75
            ${gradient ? config.gradient : config.color}
          `}
        />
      )}
    </div>
  );

  // Icon 컴포넌트
  const IconIndicator = () => (
    <span 
      className={`
        ${config.text}
        ${currentSize.icon}
        ${status === 'processing' ? 'animate-spin' : ''}
      `}
    >
      {config.icon}
    </span>
  );

  // Badge 변형
  if (variant === 'badge') {
    return (
      <span
        className={`
          inline-flex items-center
          ${currentSize.gap}
          px-3 py-1.5 rounded-full
          ${gradient 
            ? `${config.gradient} text-white` 
            : `bg-opacity-10 ${config.color} ${config.text}`
          }
          ${currentSize.text}
          font-medium
          ${className}
        `}
        role="status"
        aria-label={`Status: ${config.label}`}
        {...props}
      >
        {showIcon && variant === 'badge' && <IconIndicator />}
        <span>{config.label}</span>
      </span>
    );
  }

  // 기본 Dot 또는 Icon 변형
  return (
    <div
      className={`
        inline-flex items-center
        ${currentSize.gap}
        ${className}
      `}
      role="status"
      aria-label={`Status: ${config.label}`}
      {...props}
    >
      {variant === 'dot' ? <DotIndicator /> : <IconIndicator />}
      {config.label && (
        <span className={`${config.text} ${currentSize.text} font-medium`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

export default Status;