/**
 * Progress 컴포넌트 - 진행률 표시
 * WCAG 2.1 준수, Local 테마 적용
 */

'use client';

import React from 'react';
import { clsx } from 'clsx';

export const Progress = ({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'primary',
  label,
  showValue = false,
  className = '',
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  const variantClasses = {
    primary: 'bg-vietnam-mint',
    secondary: 'bg-vietnam-green',
    warning: 'bg-vietnam-warning',
    error: 'bg-vietnam-error'
  };
  
  return (
    <div className={clsx('w-full', className)} {...props}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div 
        className={clsx(
          'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `진행률 ${Math.round(percentage)}%`}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-300 ease-out',
            variantClasses[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default Progress;