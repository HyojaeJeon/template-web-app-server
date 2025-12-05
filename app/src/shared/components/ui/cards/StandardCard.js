/**
 * StandardCard Component
 * 디자인 시스템을 따르는 표준 카드 컴포넌트
 */
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';

const StandardCard = ({
  children,
  selected = false,
  onPress,
  variant = 'default',  // 'default' | 'elevated' | 'outlined'
  className = '',
  style = {},
  ...props
}) => {
  const { isDarkMode, colors: theme } = useTheme();

  const getCardStyles = () => {
    const baseStyles = {
      backgroundColor: theme.bgCard,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      ...(selected && {
        borderWidth: 2,
        borderColor: theme.primary,
      })};

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyles,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8};
      case 'outlined':
        return {
          ...baseStyles,
          borderWidth: 2,
          borderColor: selected ? theme.primary : theme.border,
          shadowOpacity: 0,
          elevation: 0};
      default:
        return baseStyles;
    }
  };

  const cardStyles = getCardStyles();
  const combinedStyles = { ...cardStyles, ...style };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={combinedStyles}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={combinedStyles}
      {...props}
    >
      {children}
    </View>
  );
};

export default StandardCard;
