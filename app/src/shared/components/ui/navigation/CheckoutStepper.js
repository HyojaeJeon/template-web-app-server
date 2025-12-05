/**
 * CheckoutStepper Component
 * 체크아웃 단계 표시 컴포넌트
 */
import React, { memo } from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

const CheckoutStepper = memo(({
  currentStep = 1,
  totalSteps = 3,
  steps = null,
  showLabels = true,
  size = 'medium', // small, medium, large
  orientation = 'horizontal', // horizontal, vertical
  className = ''}) => {
  const { t } = useTranslation(['common', 'order']);

  // 기본 단계 설정
  const defaultSteps = [
    {
      id: 1,
      label: t('order:addressStep', 'Address'),
      icon: 'map-marker',
      description: t('order:selectDeliveryAddress', 'Select delivery address')},
    {
      id: 2,
      label: t('order:paymentStep', 'Payment'),
      icon: 'credit-card',
      description: t('order:selectPaymentMethod', 'Select payment method')},
    {
      id: 3,
      label: t('order:confirmStep', 'Confirm'),
      icon: 'check-circle',
      description: t('order:reviewOrder', 'Review your order')},
  ];

  const stepList = steps || defaultSteps.slice(0, totalSteps);

  // 사이즈별 스타일
  const sizeStyles = {
    small: {
      stepSize: 'w-6 h-6',
      iconSize: 14,
      textSize: 'text-xs',
      lineHeight: 'h-0.5'},
    medium: {
      stepSize: 'w-8 h-8',
      iconSize: 18,
      textSize: 'text-sm',
      lineHeight: 'h-0.5'},
    large: {
      stepSize: 'w-10 h-10',
      iconSize: 22,
      textSize: 'text-base',
      lineHeight: 'h-1'}};

  const currentSize = sizeStyles[size];

  // 단계 상태 확인
  const getStepStatus = (step) => {
    if (step.id < currentStep) {return 'completed';}
    if (step.id === currentStep) {return 'active';}
    return 'upcoming';
  };

  // 단계 스타일 가져오기
  const getStepStyles = (status) => {
    switch (status) {
      case 'completed':
        return {
          container: 'bg-primary border-primary',
          icon: '#FFFFFF',
          text: 'text-primary',
          line: 'bg-primary'};
      case 'active':
        return {
          container: 'bg-primary-50 border-primary',
          icon: '#2AC1BC',
          text: 'text-primary',
          line: 'bg-gray-300'};
      default: // upcoming
        return {
          container: 'bg-gray-100 border-gray-300',
          icon: '#9CA3AF',
          text: 'text-gray-500',
          line: 'bg-gray-300'};
    }
  };

  // 수평 레이아웃
  const renderHorizontalStepper = () => (
    <View className={`flex-row items-center justify-between ${className}`}>
      {stepList.map((step, index) => {
        const status = getStepStatus(step);
        const styles = getStepStyles(status);
        const isLast = index === stepList.length - 1;

        return (
          <View key={step.id} className="flex-1 items-center">
            <View className="flex-row items-center w-full">
              {/* 단계 원형 */}
              <View className={`
                ${currentSize.stepSize} rounded-full border-2 items-center justify-center
                ${styles.container}
              `}>
                {status === 'completed' ? (
                  <Icon name="check" size={currentSize.iconSize} color={styles.icon} />
                ) : (
                  <Icon name={step.icon} size={currentSize.iconSize} color={styles.icon} />
                )}
              </View>

              {/* 연결선 */}
              {!isLast && (
                <View className={`
                  flex-1 mx-2 ${currentSize.lineHeight} rounded-full
                  ${styles.line}
                `} />
              )}
            </View>

            {/* 단계 라벨 */}
            {showLabels && (
              <View className="mt-2 items-center">
                <Text className={`${currentSize.textSize} font-medium ${styles.text}`}>
                  {step.label}
                </Text>
                {step.description && size !== 'small' && (
                  <Text className="text-xs text-gray-500 text-center mt-0.5">
                    {step.description}
                  </Text>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );

  // 수직 레이아웃
  const renderVerticalStepper = () => (
    <View className={`${className}`}>
      {stepList.map((step, index) => {
        const status = getStepStatus(step);
        const styles = getStepStyles(status);
        const isLast = index === stepList.length - 1;

        return (
          <View key={step.id} className="flex-row items-start">
            {/* 단계 컬럼 */}
            <View className="items-center">
              {/* 단계 원형 */}
              <View className={`
                ${currentSize.stepSize} rounded-full border-2 items-center justify-center
                ${styles.container}
              `}>
                {status === 'completed' ? (
                  <Icon name="check" size={currentSize.iconSize} color={styles.icon} />
                ) : (
                  <Icon name={step.icon} size={currentSize.iconSize} color={styles.icon} />
                )}
              </View>

              {/* 수직 연결선 */}
              {!isLast && (
                <View className={`
                  w-0.5 h-12 mt-2 rounded-full
                  ${styles.line}
                `} />
              )}
            </View>

            {/* 내용 컬럼 */}
            {showLabels && (
              <View className="flex-1 ml-4 pb-6">
                <Text className={`${currentSize.textSize} font-medium ${styles.text}`}>
                  {step.label}
                </Text>
                {step.description && (
                  <Text className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </Text>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );

  return orientation === 'horizontal'
    ? renderHorizontalStepper()
    : renderVerticalStepper();
});

export default CheckoutStepper;
