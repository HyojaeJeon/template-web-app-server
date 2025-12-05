/**
 * Secondary Button Component
 *
 * Clean white button with subtle border and shadow
 * Used for secondary actions throughout the app
 */
import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  Animated} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PropTypes from 'prop-types';

const SecondaryButton = ({
  title,
  onPress,
  icon,
  iconSize = 20,
  disabled = false,
  size = 'large',
  variant = 'default',
  fullWidth = true,
  animated = true,
  className = '',
  style = {},
  children}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Size configurations
  const sizeConfig = {
    small: {
      paddingX: 'px-4',
      paddingY: 'py-2',
      fontSize: 'text-sm',
      iconSize: 16},
    medium: {
      paddingX: 'px-5',
      paddingY: 'py-3',
      fontSize: 'text-base',
      iconSize: 18},
    large: {
      paddingX: 'px-6',
      paddingY: 'py-4',
      fontSize: 'text-lg',
      iconSize: 22}};

  // Variant configurations
  const variantConfig = {
    default: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
      textColor: '#374151',
      iconColor: '#6B7280'},
    danger: {
      backgroundColor: '#FFFFFF',
      borderColor: '#FCA5A5',
      textColor: '#DC2626',
      iconColor: '#DC2626'},
    warning: {
      backgroundColor: '#FFFFFF',
      borderColor: '#FCD34D',
      textColor: '#D97706',
      iconColor: '#D97706'},
    info: {
      backgroundColor: '#FFFFFF',
      borderColor: '#93C5FD',
      textColor: '#2563EB',
      iconColor: '#2563EB'}};

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];
  const finalIconSize = iconSize || currentSize.iconSize;

  // Press animation
  const handlePressIn = () => {
    if (animated && !disabled) {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        tension: 100,
        friction: 10}).start();
    }
  };

  const handlePressOut = () => {
    if (animated && !disabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8}).start();
    }
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        fullWidth && { width: '100%' },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.85}
        className={className}
        style={{
          ...(fullWidth ? { width: '100%' } : {}),
          ...style}}
      >
        <View
          className="rounded-2xl border-2"
          style={{
            backgroundColor: disabled ? '#F3F4F6' : currentVariant.backgroundColor,
            borderColor: disabled ? '#D1D5DB' : currentVariant.borderColor,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: disabled ? 0.05 : 0.08,
            shadowRadius: 8,
            elevation: disabled ? 1 : 3}}
        >
          <View className={`${currentSize.paddingX} ${currentSize.paddingY} flex-row items-center justify-center`}>
            {icon && (
              <Icon
                name={icon}
                size={finalIconSize}
                color={disabled ? '#9CA3AF' : currentVariant.iconColor}
                style={{ marginRight: title ? 8 : 0 }}
              />
            )}
            {typeof children === 'string' ? (
              <Text
                className={`${currentSize.fontSize} font-bold`}
                style={{ color: disabled ? '#9CA3AF' : currentVariant.textColor }}
              >
                {children}
              </Text>
            ) : children ? (
              children
            ) : title ? (
              <Text
                className={`${currentSize.fontSize} font-bold`}
                style={{ color: disabled ? '#9CA3AF' : currentVariant.textColor }}
              >
                {title}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

SecondaryButton.propTypes = {
  title: PropTypes.string,
  onPress: PropTypes.func.isRequired,
  icon: PropTypes.string,
  iconSize: PropTypes.number,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['default', 'danger', 'warning', 'info']),
  fullWidth: PropTypes.bool,
  animated: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node};

export default SecondaryButton;
