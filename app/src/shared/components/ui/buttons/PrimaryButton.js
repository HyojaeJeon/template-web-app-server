/**
 * Primary Button Component
 *
 * Gradient button with modern design and animations
 * Used for primary actions throughout the app
 */
import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  Animated} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PropTypes from 'prop-types';

const PrimaryButton = ({
  title,
  onPress,
  icon,
  iconSize = 20,
  loading = false,
  disabled = false,
  size = 'large',
  variant = 'primary',
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
    primary: {
      colors: ['#2AC1BC', '#00B14F'],
      shadowColor: '#2AC1BC',
      textColor: '#FFFFFF'},
    secondary: {
      colors: ['#6B7280', '#4B5563'],
      shadowColor: '#6B7280',
      textColor: '#FFFFFF'},
    success: {
      colors: ['#10B981', '#059669'],
      shadowColor: '#10B981',
      textColor: '#FFFFFF'},
    danger: {
      colors: ['#EF4444', '#DC2626'],
      shadowColor: '#EF4444',
      textColor: '#FFFFFF'},
    warning: {
      colors: ['#F59E0B', '#D97706'],
      shadowColor: '#F59E0B',
      textColor: '#FFFFFF'}};

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];
  const finalIconSize = iconSize || currentSize.iconSize;

  // Press animation
  const handlePressIn = () => {
    if (animated && !disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 100,
        friction: 10}).start();
    }
  };

  const handlePressOut = () => {
    if (animated && !disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8}).start();
    }
  };

  const isDisabled = disabled || loading;

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
        disabled={isDisabled}
        activeOpacity={0.85}
        className={className}
        style={{
          ...(fullWidth ? { width: '100%' } : {}),
          ...style}}
      >
        <LinearGradient
          colors={isDisabled ? ['#94A3B8', '#CBD5E1'] : currentVariant.colors}
          className="rounded-2xl overflow-hidden"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            shadowColor: isDisabled ? '#94A3B8' : currentVariant.shadowColor,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 6}}
        >
          <View className={`${currentSize.paddingX} ${currentSize.paddingY} flex-row items-center justify-center`}>
            {loading ? (
              <>
                <ActivityIndicator size="small" color={currentVariant.textColor} />
                {title && (
                  <Text
                    className={`${currentSize.fontSize} font-bold ml-3`}
                    style={{ color: currentVariant.textColor }}
                  >
                    {title}
                  </Text>
                )}
              </>
            ) : (
              <>
                {icon && (
                  <Icon
                    name={icon}
                    size={finalIconSize}
                    color={currentVariant.textColor}
                    style={{ marginRight: title ? 8 : 0 }}
                  />
                )}
                {typeof children === 'string' ? (
                  <Text
                    className={`${currentSize.fontSize} font-bold`}
                    style={{ color: currentVariant.textColor }}
                  >
                    {children}
                  </Text>
                ) : children ? (
                  children
                ) : title ? (
                  <Text
                    className={`${currentSize.fontSize} font-bold`}
                    style={{ color: currentVariant.textColor }}
                  >
                    {title}
                  </Text>
                ) : null}
              </>
            )}
          </View>

          {/* Shimmer effect overlay */}
          {!isDisabled && (
            <View className="absolute inset-0 opacity-10">
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0"
              />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

PrimaryButton.propTypes = {
  title: PropTypes.string,
  onPress: PropTypes.func.isRequired,
  icon: PropTypes.string,
  iconSize: PropTypes.number,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning']),
  fullWidth: PropTypes.bool,
  animated: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node};

export default PrimaryButton;
