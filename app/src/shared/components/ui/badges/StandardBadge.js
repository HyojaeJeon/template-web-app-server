/**
 * StandardBadge Component
 * 디자인 시스템을 따르는 표준 배지 컴포넌트
 */
import React from 'react';
import { View, Text } from 'react-native';
import StandardIcon from '@shared/components/ui/utility/StandardIcon';
import { useTheme } from '@providers/ThemeProvider';

const StandardBadge = ({
  children,
  variant = 'default', // 'default' | 'success' | 'warning' | 'danger' | 'info' | 'mint'
  size = 'medium',      // 'small' | 'medium' | 'large'
  icon,
  iconType = 'material',
  count,
  maxCount = 99,
  dot = false,
  outline = false,
  ...props
}) => {
  const { isDarkMode, colors: theme } = useTheme();

  const getVariantStyles = () => {
    const baseStyle = {
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center'};

    if (outline) {
      switch (variant) {
        case 'success':
          return {
            ...baseStyle,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.success};
        case 'warning':
          return {
            ...baseStyle,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.warning};
        case 'danger':
          return {
            ...baseStyle,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.error};
        case 'info':
          return {
            ...baseStyle,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.info};
        case 'mint':
          return {
            ...baseStyle,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.primary};
        default:
          return {
            ...baseStyle,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.border};
      }
    }

    switch (variant) {
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: theme.successBg};
      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: theme.warningBg};
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: theme.errorBg};
      case 'info':
        return {
          ...baseStyle,
          backgroundColor: theme.infoBg};
      case 'mint':
        return {
          ...baseStyle,
          backgroundColor: theme.primaryBg};
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.bgSecondary};
    }
  };

  const getTextColor = () => {
    if (outline) {
      switch (variant) {
        case 'success': return theme.success;
        case 'warning': return theme.warning;
        case 'danger': return theme.error;
        case 'info': return theme.info;
        case 'mint': return theme.primary;
        default: return theme.textSecondary;
      }
    }

    switch (variant) {
      case 'success': return theme.success;
      case 'warning': return theme.warning;
      case 'danger': return theme.error;
      case 'info': return theme.info;
      case 'mint': return theme.primary;
      default: return theme.textPrimary;
    }
  };

  const getIconColor = () => {
    if (outline) {
      switch (variant) {
        case 'success': return theme.success;
        case 'warning': return theme.warning;
        case 'danger': return theme.error;
        case 'info': return theme.info;
        case 'mint': return theme.primary;
        default: return theme.textSecondary;
      }
    }

    switch (variant) {
      case 'success': return theme.success;
      case 'warning': return theme.warning;
      case 'danger': return theme.error;
      case 'info': return theme.info;
      case 'mint': return theme.primary;
      default: return theme.textSecondary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 8};
      case 'large':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16};
      default:
        return {};
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small': return 11;
      case 'large': return 14;
      default: return 12;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 12;
      case 'large': return 16;
      default: return 14;
    }
  };

  // 도트 배지
  if (dot) {
    const dotSize = size === 'small' ? 6 : size === 'large' ? 10 : 8;
    return (
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: variant === 'danger' ? theme.error : theme.primary}}
        {...props}
      />
    );
  }

  // 숫자 배지
  if (count !== undefined) {
    const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
    const isLargeNumber = count > 99;

    return (
      <View
        style={[
          getVariantStyles(),
          getSizeStyles(),
          {
            minWidth: isLargeNumber ? 28 : 20,
            height: isLargeNumber ? 20 : 18,
            borderRadius: isLargeNumber ? 10 : 9,
            paddingHorizontal: isLargeNumber ? 6 : 4,
            paddingVertical: 0},
        ]}
        {...props}
      >
        <Text
          style={{
            color: getTextColor(),
            fontSize: getTextSize(),
            fontWeight: '600',
            textAlign: 'center'}}
        >
          {displayCount}
        </Text>
      </View>
    );
  }

  // 일반 배지
  return (
    <View
      style={[getVariantStyles(), getSizeStyles()]}
      {...props}
    >
      {icon && (
        <StandardIcon
          name={icon}
          type={iconType}
          size={getIconSize()}
          color={getIconColor()}
          style={{ marginRight: children ? 4 : 0 }}
        />
      )}
      {children && (
        <Text
          style={{
            color: getTextColor(),
            fontSize: getTextSize(),
            fontWeight: '600'}}
        >
          {children}
        </Text>
      )}
    </View>
  );
};

export default StandardBadge;
