/**
 * StandardInput Component
 * 디자인 시스템을 따르는 표준 입력 컴포넌트
 */
import React from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@providers/ThemeProvider';

const StandardInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  disabled = false,
  multiline = false,
  secureTextEntry = false,
  keyboardType = 'default',
  icon,
  onIconPress,
  variant = 'default',  // 'default' | 'outlined' | 'filled'
  size = 'medium',      // 'small' | 'medium' | 'large'
  ...props
}) => {
  const { isDarkMode, colors: theme } = useTheme();

  const getInputStyles = () => {
    const baseStyles = {
      height: 48,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.bgInput,
      color: theme.textPrimary,
      fontSize: 16};

    if (disabled) {
      return {
        ...baseStyles,
        backgroundColor: theme.bgDisabled,
        borderColor: theme.border,
        color: theme.textDisabled};
    }

    if (error) {
      return {
        ...baseStyles,
        borderColor: theme.error,
        borderWidth: 2};
    }

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: theme.border};
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: theme.bgInput,
          borderColor: theme.border};
      default:
        return baseStyles;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 36,
          paddingHorizontal: 12,
          fontSize: 14};
      case 'large':
        return {
          height: 56,
          paddingHorizontal: 20,
          fontSize: 18};
      default:
        return {};
    }
  };

  const inputStyles = getInputStyles();
  const sizeStyles = getSizeStyles();
  const combinedStyles = { ...inputStyles, ...sizeStyles };

  return (
    <View style={{ gap: 8 }}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: error ? theme.error : theme.textSecondary,
            marginBottom: 4}}
        >
          {label}
        </Text>
      )}

      <View style={{ position: 'relative' }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textPlaceholder}
          editable={!disabled}
          multiline={multiline}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          style={[
            combinedStyles,
            multiline && { height: 96, paddingTop: 12, textAlignVertical: 'top' },
            icon && { paddingRight: 48 },
          ]}
          {...props}
        />

        {icon && (
          <TouchableOpacity
            onPress={onIconPress}
            disabled={!onIconPress}
            style={{
              position: 'absolute',
              right: 12,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              width: 24}}
          >
            <Icon
              name={icon}
              size={20}
              color={disabled ? theme.textDisabled : theme.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text
          style={{
            fontSize: 12,
            color: theme.error,
            marginTop: 4}}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

export default StandardInput;
