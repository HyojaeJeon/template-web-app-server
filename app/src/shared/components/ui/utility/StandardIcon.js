/**
 * StandardIcon Component
 * 디자인 시스템을 따르는 표준 아이콘 컴포넌트
 * MaterialIcons와 MaterialCommunityIcons 통합
 */
import React from 'react';
import { View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@shared/design/tokens';

const StandardIcon = ({
  name,
  type = 'material', // 'material' | 'community'
  size = 24,
  color = colors.gray[600],
  style = {},
  backgroundColor,
  borderRadius = 8,
  padding = 0,
  ...props
}) => {
  const IconComponent = type === 'community' ? MaterialCommunityIcons : MaterialIcons;

  const containerStyle = {
    ...(backgroundColor && {
      backgroundColor,
      borderRadius,
      padding,
      alignItems: 'center',
      justifyContent: 'center'}),
    ...style};

  if (backgroundColor || padding > 0) {
    return (
      <View style={containerStyle} {...props}>
        <IconComponent name={name} size={size} color={color} />
      </View>
    );
  }

  return (
    <IconComponent
      name={name}
      size={size}
      color={color}
      style={style}
      {...props}
    />
  );
};

export default StandardIcon;
