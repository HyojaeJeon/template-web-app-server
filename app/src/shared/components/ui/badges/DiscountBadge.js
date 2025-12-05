/**
 * DiscountBadge - 할인 및 이벤트 배지 컴포넌트
 * 할인율 표시, 이벤트 배지, 시간 제한 할인 타이머 기능
 * server/src/graphql 준수, 접근성 및 Local 현지화 적용
 */
import React, { memo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Animated} from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

// Utils
import { useTheme } from '@providers/ThemeProvider';

const DiscountBadge = memo(({
  type = 'percentage', // 'percentage', 'amount', 'freeDelivery', 'event', 'flash'
  value = 0, // 할인율(%) 또는 할인금액
  originalValue = null, // 원래 값 (취소선 표시용)
  endTime = null, // 할인 종료 시간 (타이머용)
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'corner', // 'corner', 'ribbon', 'pill', 'sticker'
  animated = false,
  showTimer = false,
  urgent = false, // 긴급 표시 (깜빡임 등)
}) => {

  if (!value && type !== 'freeDelivery' && type !== 'event') {
    return null;
  }
  const { t } = useTranslation();
  const { isDarkMode, colors: theme } = useTheme();
  const [timeLeft, setTimeLeft] = useState(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  // 타이머 계산
  useEffect(() => {
    if (!endTime || !showTimer) {return;}

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(endTime);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endTime, showTimer]);

  // 긴급 표시 애니메이션
  useEffect(() => {
    if (urgent) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true}),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true}),
        ]).start(() => pulse());
      };
      pulse();
    }
  }, [urgent, pulseAnim]);

  // 타입별 설정
  const typeConfigs = {
    percentage: {
      colors: [theme.error, theme.error],
      icon: 'percent',
      suffix: '%',
      labelKey: 'discount.percentage'},
    amount: {
      colors: [theme.warning, theme.warning],
      icon: 'cash',
      suffix: '',
      labelKey: 'discount.amount'},
    freeDelivery: {
      colors: [theme.success, theme.success],
      icon: 'truck-fast',
      suffix: '',
      labelKey: 'discount.freeDelivery'},
    event: {
      colors: [theme.info, theme.info],
      icon: 'party-popper',
      suffix: '',
      labelKey: 'discount.event'},
    flash: {
      colors: [theme.accent, theme.accent],
      icon: 'lightning-bolt',
      suffix: '',
      labelKey: 'discount.flash'}};

  // 사이즈별 스타일
  const sizeStyles = {
    small: {
      padding: 'px-2 py-1',
      fontSize: 'text-xs',
      iconSize: 12,
      timerFontSize: 'text-xs'},
    medium: {
      padding: 'px-3 py-2',
      fontSize: 'text-sm',
      iconSize: 14,
      timerFontSize: 'text-xs'},
    large: {
      padding: 'px-4 py-3',
      fontSize: 'text-base',
      iconSize: 16,
      timerFontSize: 'text-sm'}};

  // 변형별 스타일
  const variantStyles = {
    corner: 'rounded-tr-lg rounded-bl-lg',
    ribbon: 'rounded-none skew-x-12',
    pill: 'rounded-full',
    sticker: 'rounded-xl'};

  const config = typeConfigs[type] || typeConfigs.percentage;
  const currentSize = sizeStyles[size] || sizeStyles.medium;
  const currentVariant = variantStyles[variant] || variantStyles.corner;

  // 할인 텍스트 생성
  const getDiscountText = useCallback(() => {
    switch (type) {
      case 'percentage':
        return `${value}${config.suffix}`;
      case 'amount':
        try {
          const { formatCurrency } = require('@shared/utils/localization/localizationUtils');
          return formatCurrency(value || 0, 'VND');
        } catch (_) {
          return `${value?.toLocaleString()}₫`;
        }
      case 'freeDelivery':
        return t('discount.free');
      case 'event':
      case 'flash':
        return value || t(config.labelKey);
      default:
        return value;
    }
  }, [type, value, config, t]);

  // 타이머 텍스트
  const getTimerText = useCallback(() => {
    if (!timeLeft) {return null;}

    const { hours, minutes, seconds } = timeLeft;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }, [timeLeft]);

  const badgeContent = (
    <LinearGradient
      colors={config.colors}
      className={`${currentVariant} ${currentSize.padding} flex-row items-center justify-center`}
      style={{
        shadowColor: config.colors[0],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        ...(variant === 'corner' && {
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 10})}}
    >
      <MaterialCommunityIcons
        name={config.icon}
        size={currentSize.iconSize}
        color="white"
        style={{ marginRight: 4 }}
      />

      <View className="items-center">
        {/* 주 할인 텍스트 */}
        <Text
          className={`text-white font-bold ${currentSize.fontSize}`}
          style={{
            textShadowColor: 'rgba(0,0,0,0.3)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
            letterSpacing: 0.5}}
        >
          {getDiscountText()}
        </Text>

        {/* 할인 라벨 */}
        {(type === 'percentage' || type === 'amount') && (
          <Text className="text-white text-xs font-medium opacity-90">
            {t('discount.off')}
          </Text>
        )}

        {/* 타이머 */}
        {showTimer && timeLeft && (
          <View className="mt-1 flex-row items-center">
            <MaterialCommunityIcons
              name="clock-fast"
              size={10}
              color="white"
              style={{ marginRight: 2 }}
            />
            <Text className={`text-white font-mono ${currentSize.timerFontSize}`}>
              {getTimerText()}
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );

  // 원래 가격 취소선 표시
  if (originalValue && type === 'amount') {
    return (
      <View className="items-end">
        {/* 원래 가격 (취소선) */}
        <Text
          className="text-sm line-through"
          style={{
            textDecorationLine: 'line-through',
            color: theme.textTertiary,
            textDecorationColor: theme.textTertiary}}
        >
          {originalValue?.toLocaleString()}₫
        </Text>

        {/* 할인 배지 */}
        {urgent ? (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            {badgeContent}
          </Animated.View>
        ) : (
          badgeContent
        )}
      </View>
    );
  }

  if (urgent) {
    return (
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        {badgeContent}
      </Animated.View>
    );
  }

  return badgeContent;
});

// 여러 할인을 그룹으로 표시
export const DiscountGroup = memo(({
  discounts = [],
  maxShow = 2,
  layout = 'horizontal', // 'horizontal', 'vertical', 'stack'
}) => {
  const visibleDiscounts = discounts.slice(0, maxShow);

  if (visibleDiscounts.length === 0) {return null;}

  return (
    <View className={layout === 'horizontal' ? 'flex-row' : 'space-y-1'}>
      {visibleDiscounts.map((discount, index) => (
        <View
          key={index}
          className={layout === 'horizontal' ? 'mr-2' : ''}
        >
          <DiscountBadge {...discount} />
        </View>
      ))}
    </View>
  );
});

export default DiscountBadge;
