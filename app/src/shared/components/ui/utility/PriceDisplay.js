/**
 * PriceDisplay Component
 *
 * Reusable price display with sale/original price handling
 * Single Responsibility - handles only price formatting and display
 */
import React, { memo, useMemo, useCallback } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

const PriceDisplay = memo(({
  originalPrice = 0,
  salePrice = null,
  size = 'medium',
  showCurrency = true,
  currency = 'VND'}) => {
  const { t } = useTranslation();

  const formatPrice = useCallback((price) => {
    if (!price) {return '';}

    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: showCurrency ? 'currency' : 'decimal',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0}).format(price);
    }

    return price.toLocaleString();
  }, [currency, showCurrency]);

  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'small':
        return {
          current: 'text-sm font-bold',
          original: 'text-xs line-through'};
      case 'large':
        return {
          current: 'text-lg font-bold',
          original: 'text-sm line-through'};
      default: // medium
        return {
          current: 'text-base font-bold',
          original: 'text-sm line-through'};
    }
  }, [size]);

  const hasDiscount = useMemo(() => {
    return salePrice && salePrice < originalPrice;
  }, [salePrice, originalPrice]);

  const currentPrice = salePrice || originalPrice;

  const accessibilityLabel = useMemo(() => {
    if (hasDiscount) {
      return `할인 가격 ${formatPrice(currentPrice)}, 원래 가격 ${formatPrice(originalPrice)}`;
    }
    return `가격 ${formatPrice(currentPrice)}`;
  }, [hasDiscount, currentPrice, originalPrice, formatPrice]);

  return (
    <View
      className="flex-row items-center"
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
    >
      <Text
        className={`${sizeClasses.current} ${hasDiscount ? 'text-red-600' : 'text-gray-900'}`}
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants"
      >
        {formatPrice(currentPrice)}
      </Text>

      {hasDiscount && (
        <Text
          className={`${sizeClasses.original} text-gray-500 ml-2`}
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
        >
          {formatPrice(originalPrice)}
        </Text>
      )}
    </View>
  );
});


export default PriceDisplay;
