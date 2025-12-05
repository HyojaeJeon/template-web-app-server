/**
 * 가격 표시 컴포넌트 (점주용)
 * Local 동화 형식, 할인/세금 표시, WCAG 2.1 준수, Local 테마 적용
 */
'use client';

import React from 'react';

const PriceDisplay = ({
  amount,
  originalAmount,
  currency = 'VND',
  showCurrency = true,
  showDiscount = false,
  discountType = 'amount', // amount | percentage
  size = 'md', // xs | sm | md | lg | xl
  variant = 'default', // default | compact | detailed | card
  alignment = 'left', // left | center | right
  status = 'default', // default | success | warning | error
  showTax = false,
  taxAmount = 0,
  taxRate = 0,
  locale = 'vi-VN',
  className = '',
  onClick,
  ...props
}) => {
  // 통화별 포맷팅
  const formatCurrency = (value, options = {}) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0₫';
    }

    const formatOptions = {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: currency === 'VND' ? 0 : 2,
      ...options
    };

    try {
      // Local 동 특별 처리
      if (currency === 'VND') {
        const formatted = new Intl.NumberFormat(locale, {
          style: 'decimal',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(Math.round(value));
        
        return showCurrency ? `${formatted}₫` : formatted;
      }

      return new Intl.NumberFormat(locale, formatOptions).format(value);
    } catch (error) {
      // 폴백: 수동 포맷팅
      const formatted = Math.round(value).toLocaleString();
      return showCurrency ? `${formatted}₫` : formatted;
    }
  };

  // 할인 계산
  const getDiscountInfo = () => {
    if (!showDiscount || !originalAmount || originalAmount <= amount) {
      return null;
    }

    const discountAmount = originalAmount - amount;
    const discountPercentage = Math.round((discountAmount / originalAmount) * 100);

    return {
      amount: discountAmount,
      percentage: discountPercentage,
      isValid: discountAmount > 0 && discountPercentage > 0
    };
  };

  // 세금 계산
  const getTaxInfo = () => {
    if (!showTax) return null;

    const calculatedTaxAmount = taxAmount || (amount * taxRate / 100);
    const totalWithTax = amount + calculatedTaxAmount;

    return {
      taxAmount: calculatedTaxAmount,
      totalWithTax,
      taxRate: taxRate
    };
  };

  // 크기별 스타일
  const getSizeStyles = () => {
    const sizes = {
      xs: {
        price: 'text-sm',
        original: 'text-xs',
        discount: 'text-xs',
        currency: 'text-xs',
        tax: 'text-xs'
      },
      sm: {
        price: 'text-base',
        original: 'text-sm',
        discount: 'text-sm',
        currency: 'text-sm',
        tax: 'text-xs'
      },
      md: {
        price: 'text-lg',
        original: 'text-base',
        discount: 'text-sm',
        currency: 'text-base',
        tax: 'text-sm'
      },
      lg: {
        price: 'text-xl',
        original: 'text-lg',
        discount: 'text-base',
        currency: 'text-lg',
        tax: 'text-sm'
      },
      xl: {
        price: 'text-2xl',
        original: 'text-xl',
        discount: 'text-lg',
        currency: 'text-xl',
        tax: 'text-base'
      }
    };
    
    return sizes[size] || sizes.md;
  };

  // 상태별 색상
  const getStatusColor = () => {
    const colors = {
      default: 'text-gray-900 dark:text-white',
      success: 'text-green-600 dark:text-green-400',
      warning: 'text-yellow-600 dark:text-yellow-400',
      error: 'text-red-600 dark:text-red-400'
    };
    
    return colors[status] || colors.default;
  };

  // 정렬 스타일
  const getAlignmentClass = () => {
    const alignments = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    };
    
    return alignments[alignment] || alignments.left;
  };

  const sizeStyles = getSizeStyles();
  const statusColor = getStatusColor();
  const alignmentClass = getAlignmentClass();
  const discountInfo = getDiscountInfo();
  const taxInfo = getTaxInfo();

  // 컴팩트 버전
  if (variant === 'compact') {
    return (
      <span
        className={`
          inline-flex items-baseline space-x-1 font-medium
          ${statusColor} ${sizeStyles.price} ${alignmentClass}
          ${onClick ? 'cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-1 rounded' : ''}
          ${className}
        `}
        onClick={onClick}
        role={onClick ? 'button' : 'text'}
        aria-label={`가격: ${formatCurrency(amount)}`}
        {...props}
      >
        <span>{formatCurrency(amount)}</span>
        {discountInfo && discountInfo.isValid && (
          <span className={`line-through opacity-60 ${sizeStyles.original}`}>
            {formatCurrency(originalAmount)}
          </span>
        )}
      </span>
    );
  }

  // 상세 버전
  if (variant === 'detailed') {
    return (
      <div
        className={`
          space-y-2 ${alignmentClass}
          ${onClick ? 'cursor-pointer hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-1 rounded' : ''}
          ${className}
        `}
        onClick={onClick}
        role={onClick ? 'button' : 'region'}
        aria-label={`가격 상세: ${formatCurrency(amount)}`}
        {...props}
      >
        {/* 메인 가격 */}
        <div className={`font-bold ${statusColor} ${sizeStyles.price}`}>
          {formatCurrency(amount)}
        </div>

        {/* 할인 정보 */}
        {discountInfo && discountInfo.isValid && (
          <div className="flex items-center justify-between">
            <span className={`line-through text-gray-500 dark:text-gray-400 ${sizeStyles.original}`}>
              {formatCurrency(originalAmount)}
            </span>
            <span className={`text-red-600 font-medium ${sizeStyles.discount}`}>
              -{discountType === 'percentage' 
                ? `${discountInfo.percentage}%`
                : formatCurrency(discountInfo.amount)
              }
            </span>
          </div>
        )}

        {/* 세금 정보 */}
        {taxInfo && (
          <div className={`space-y-1 text-gray-600 dark:text-gray-400 ${sizeStyles.tax}`}>
            <div className="flex justify-between">
              <span>부가세 ({taxInfo.taxRate}%)</span>
              <span>{formatCurrency(taxInfo.taxAmount)}</span>
            </div>
            <div className={`flex justify-between font-medium border-t pt-1 ${statusColor}`}>
              <span>총 금액</span>
              <span>{formatCurrency(taxInfo.totalWithTax)}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 카드 버전
  if (variant === 'card') {
    return (
      <div
        className={`
          p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 
          rounded-lg shadow-sm ${alignmentClass}
          ${onClick ? 'cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-1' : ''}
          ${className}
        `}
        onClick={onClick}
        role={onClick ? 'button' : 'article'}
        {...props}
      >
        <div className="space-y-3">
          {/* 메인 가격 */}
          <div className={`font-bold ${statusColor} ${sizeStyles.price}`}>
            {formatCurrency(amount)}
          </div>

          {/* 할인 정보 */}
          {discountInfo && discountInfo.isValid && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={`text-gray-500 dark:text-gray-400 ${sizeStyles.original}`}>
                  정가
                </span>
                <span className={`line-through text-gray-500 dark:text-gray-400 ${sizeStyles.original}`}>
                  {formatCurrency(originalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-red-600 ${sizeStyles.discount}`}>
                  할인
                </span>
                <span className={`text-red-600 font-medium ${sizeStyles.discount}`}>
                  -{discountType === 'percentage' 
                    ? `${discountInfo.percentage}%`
                    : formatCurrency(discountInfo.amount)
                  }
                </span>
              </div>
            </div>
          )}

          {/* 세금 정보 */}
          {taxInfo && (
            <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span className={sizeStyles.tax}>부가세 ({taxInfo.taxRate}%)</span>
                <span className={sizeStyles.tax}>{formatCurrency(taxInfo.taxAmount)}</span>
              </div>
              <div className={`flex justify-between font-bold ${statusColor} ${sizeStyles.price}`}>
                <span>총 금액</span>
                <span>{formatCurrency(taxInfo.totalWithTax)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 기본 버전
  return (
    <div
      className={`
        inline-flex items-baseline space-x-2 ${alignmentClass}
        ${onClick ? 'cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-vietnam-mint focus:ring-offset-1 rounded' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : 'text'}
      aria-label={`가격: ${formatCurrency(amount)}`}
      {...props}
    >
      {/* 메인 가격 */}
      <span className={`font-bold ${statusColor} ${sizeStyles.price}`}>
        {formatCurrency(amount)}
      </span>

      {/* 원가 (할인된 경우) */}
      {discountInfo && discountInfo.isValid && (
        <span className={`line-through text-gray-500 dark:text-gray-400 ${sizeStyles.original}`}>
          {formatCurrency(originalAmount)}
        </span>
      )}

      {/* 할인 배지 */}
      {discountInfo && discountInfo.isValid && (
        <span className={`
          inline-flex items-center px-2 py-0.5 rounded-full text-red-600 bg-red-100 
          dark:bg-red-900 dark:text-red-200 font-medium ${sizeStyles.discount}
        `}>
          -{discountType === 'percentage' 
            ? `${discountInfo.percentage}%`
            : formatCurrency(discountInfo.amount)
          }
        </span>
      )}

      {/* 세금 포함 표시 */}
      {taxInfo && (
        <span className={`text-gray-500 dark:text-gray-400 ${sizeStyles.tax}`}>
          (세금 포함)
        </span>
      )}
    </div>
  );
};

// 가격 비교 컴포넌트
export const PriceComparison = ({
  prices = [],
  highlightBest = true,
  className = '',
  ...props
}) => {
  const bestPrice = Math.min(...prices.map(p => p.amount));

  return (
    <div className={`space-y-2 ${className}`} {...props}>
      {prices.map((priceData, index) => (
        <PriceDisplay
          key={index}
          {...priceData}
          status={highlightBest && priceData.amount === bestPrice ? 'success' : 'default'}
          className={
            highlightBest && priceData.amount === bestPrice 
              ? 'bg-green-50 dark:bg-green-900 p-2 rounded border border-green-200 dark:border-green-800'
              : ''
          }
        />
      ))}
    </div>
  );
};

// 가격 범위 표시 컴포넌트
export const PriceRange = ({
  minAmount,
  maxAmount,
  currency = 'VND',
  showCurrency = true,
  separator = ' ~ ',
  size = 'md',
  className = '',
  ...props
}) => {
  const formatCurrency = (value) => {
    if (currency === 'VND') {
      const formatted = new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.round(value));
      
      return showCurrency ? `${formatted}₫` : formatted;
    }

    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  const sizeStyles = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  return (
    <span
      className={`font-medium text-gray-900 dark:text-white ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {formatCurrency(minAmount)}
      {separator}
      {formatCurrency(maxAmount)}
    </span>
  );
};

export default PriceDisplay;