/**
 * FloatingActionButton Component - 재사용 가능한 플로팅 액션 버튼
 * CLAUDE.md 가이드라인 준수: SOLID 원칙, DRY, WCAG 2.1
 * Local 배달 앱 특화 FAB
 */
import React, { memo } from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * FloatingActionButton Component
 *
 * Single Responsibility: 플로팅 액션 버튼 기능만 담당
 * Open/Closed: 새로운 아이콘이나 스타일 변형 추가 시 수정 없이 확장 가능
 */
const FloatingActionButton = memo(({
  icon = 'add',
  onPress = () => {},
  disabled = false,
  size = 'large', // 'small', 'medium', 'large'
  variant = 'primary', // 'primary', 'secondary', 'success', 'warning'
  className = '',
  accessibilityLabel = '플로팅 액션 버튼'}) => {
  // 크기 매핑
  const sizeMap = {
    small: { container: 'w-12 h-12', icon: 20 },
    medium: { container: 'w-14 h-14', icon: 24 },
    large: { container: 'w-16 h-16', icon: 28 }};

  // 색상 매핑
  const variantMap = {
    primary: {
      bg: '#2AC1BC',
      icon: 'white',
      shadow: '#2AC1BC'},
    secondary: {
      bg: '#6B7280',
      icon: 'white',
      shadow: '#6B7280'},
    success: {
      bg: '#00B14F',
      icon: 'white',
      shadow: '#00B14F'},
    warning: {
      bg: '#F59E0B',
      icon: 'white',
      shadow: '#F59E0B'}};

  const sizeConfig = sizeMap[size];
  const variantConfig = variantMap[variant];

  // 그림자 스타일
  const shadowStyle = {
    shadowColor: variantConfig.shadow,
    shadowOffset: {
      width: 0,
      height: Platform.OS === 'ios' ? 4 : 6},
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 8 : 12,
    elevation: Platform.OS === 'android' ? 8 : 0};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      className={`${sizeConfig.container} rounded-full items-center justify-center ${className}`}
      style={[
        {
          backgroundColor: disabled ? '#D1D5DB' : variantConfig.bg},
        !disabled && shadowStyle,
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      <MaterialIcons
        name={icon}
        size={sizeConfig.icon}
        color={disabled ? '#9CA3AF' : variantConfig.icon}
      />
    </TouchableOpacity>
  );
});


export default FloatingActionButton;
