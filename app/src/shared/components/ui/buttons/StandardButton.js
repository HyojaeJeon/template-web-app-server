/**
 * StandardButton Component
 * 디자인 시스템을 따르는 표준 버튼 컴포넌트
 */
import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@providers/ThemeProvider';

const StandardButton = ({
  variant = 'primary',   // 'primary' | 'secondary' | 'warning' | 'danger' | 'outline' | 'ghost'
  size = 'medium',       // 'small' | 'medium' | 'large' | 'full'
  loading = false,
  disabled = false,
  icon,
  children,
  onPress,
  gradient = false,
  fullWidth = false,
  ...props
}) => {
  const { isDarkMode, colors: theme } = useTheme();

  const getButtonStyles = () => {
    const baseStyles = {
      height: 48,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16};

    if (disabled) {
      return {
        ...baseStyles,
        backgroundColor: theme.bgDisabled,
        opacity: 0.6};
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: theme.primary,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4};
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: theme.secondary,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4};
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: theme.warning,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4};
      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: theme.error,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4};
      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: theme.primary};
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent'};
      default:
        return baseStyles;
    }
  };

  const getTextStyles = () => {
    if (disabled) {
      return {
        color: theme.textDisabled,
        fontSize: 16,
        fontWeight: '600'};
    }

    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'warning':
      case 'danger':
        return {
          color: theme.button.primaryText,
          fontSize: 16,
          fontWeight: '600'};
      case 'outline':
      case 'ghost':
        return {
          color: theme.primary,
          fontSize: 16,
          fontWeight: '600'};
      default:
        return {
          color: theme.button.primaryText,
          fontSize: 16,
          fontWeight: '600'};
    }
  };

  const getSizeStyles = () => {
    let styles = {};

    switch (size) {
      case 'small':
        styles = { height: 36, paddingHorizontal: 12 };
        break;
      case 'large':
        styles = { height: 56, paddingHorizontal: 24 };
        break;
      case 'full':
        styles = { width: '100%' };
        break;
      default:
        styles = {};
    }

    if (fullWidth) {
      styles.width = '100%';
    }

    return styles;
  };

  const buttonStyles = getButtonStyles();
  const textStyles = getTextStyles();
  const sizeStyles = getSizeStyles();

  const renderContent = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? theme.primary : theme.button.primaryText}
        />
      ) : (
        icon && (
          <Icon
            name={icon}
            size={20}
            color={variant === 'outline' || variant === 'ghost' ? theme.primary : theme.button.primaryText}
          />
        )
      )}
      <Text style={textStyles}>
        {typeof children === 'string' ? children : children || ''}
      </Text>
    </View>
  );

  if (gradient && ['primary', 'secondary', 'warning', 'danger'].includes(variant)) {
    let gradientColors;

    switch (variant) {
      case 'primary':
        gradientColors = [theme.primary, theme.primaryDark || theme.primary];
        break;
      case 'secondary':
        gradientColors = [theme.secondary, theme.secondaryDark || theme.secondary];
        break;
      case 'warning':
        gradientColors = [theme.warning, theme.warningDark || theme.warning];
        break;
      case 'danger':
        gradientColors = [theme.error, theme.errorDark || theme.error];
        break;
      default:
        gradientColors = [theme.primary, theme.primaryDark || theme.primary];
    }

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[{ ...buttonStyles, backgroundColor: 'transparent' }, sizeStyles]}
        {...props}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: buttonStyles.borderRadius}}
        />
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[buttonStyles, sizeStyles]}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

StandardButton.displayName = 'StandardButton';

export default StandardButton;
