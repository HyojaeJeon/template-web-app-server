/**
 * BaseBadge - 기본 뱃지 컴포넌트
 * 모든 뱃지의 기본이 되는 컴포넌트
 */
import React, { memo } from 'react';
import { View, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const BaseBadge = memo(({ 
  backgroundColor,
  color = '#FFFFFF',
  iconName,
  iconSize = 11,
  text,
  fontSize = 11,
  fontWeight = '600',
  paddingHorizontal = 8,
  paddingVertical = 4,
  borderRadius = 6,
  style = {}
}) => {
  return (
    <View 
      className="flex-row items-center"
      style={[
        {
          backgroundColor,
          paddingHorizontal,
          paddingVertical,
          borderRadius,
        },
        style
      ]}
    >
      {iconName && (
        <MaterialCommunityIcons 
          name={iconName} 
          size={iconSize} 
          color={color} 
          style={{ marginRight: 3 }} 
        />
      )}
      <Text style={{ fontSize, color, fontWeight }}>
        {text}
      </Text>
    </View>
  );
});

BaseBadge.displayName = 'BaseBadge';

export default BaseBadge;