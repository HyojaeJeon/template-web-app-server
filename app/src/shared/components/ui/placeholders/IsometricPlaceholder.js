/**
 * IsometricPlaceholder - 3D 아이소메트릭 플레이스홀더
 * 추가 라이브러리 없이 React Native View로 구성
 */
import React, { memo } from 'react';
import { View } from 'react-native';

const palettes = {
  food: {
    top: '#FDE68A',       // amber-200
    left: '#F59E0B',      // amber-500
    right: '#D97706',     // amber-600
    shadow: 'rgba(0,0,0,0.06)'
  },
  store: {
    top: '#93C5FD',       // blue-300
    left: '#3B82F6',      // blue-500
    right: '#2563EB',     // blue-600
    shadow: 'rgba(0,0,0,0.06)'
  }
};

const IsometricPlaceholder = memo(({ size = 112, variant = 'food', style }) => {
  const colors = palettes[variant] || palettes.food;
  const s = size;
  const half = s * 0.5;
  const tri = s * 0.58; // 대략적인 깊이

  return (
    <View style={[{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style]}
      accessibilityLabel={`isometric-${variant}-placeholder`}
    >
      {/* 살짝 둥근 배경 그림자 */}
      <View style={{ position: 'absolute', width: s * 0.9, height: s * 0.9, borderRadius: 16, backgroundColor: colors.shadow }} />

      {/* TOP 면 (마름모 형태: 위아래 삼각형 겹치기) */}
      <View style={{ position: 'absolute', top: s * 0.1 }}>
        <View style={{
          width: 0,
          height: 0,
          borderLeftWidth: half,
          borderRightWidth: half,
          borderBottomWidth: tri * 0.5,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: colors.top,
        }} />
        <View style={{
          marginTop: -1, // 이음새 자연스럽게
          width: 0,
          height: 0,
          borderLeftWidth: half,
          borderRightWidth: half,
          borderTopWidth: tri * 0.5,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: colors.top,
        }} />
      </View>

      {/* LEFT 면 */}
      <View style={{ position: 'absolute', top: s * 0.1 + tri * 0.5, left: s * 0.1 }}>
        <View style={{
          width: 0,
          height: 0,
          borderRightWidth: half,
          borderTopWidth: tri,
          borderRightColor: 'transparent',
          borderTopColor: colors.left,
        }} />
      </View>

      {/* RIGHT 면 */}
      <View style={{ position: 'absolute', top: s * 0.1 + tri * 0.5, right: s * 0.1 }}>
        <View style={{
          width: 0,
          height: 0,
          borderLeftWidth: half,
          borderTopWidth: tri,
          borderLeftColor: 'transparent',
          borderTopColor: colors.right,
        }} />
      </View>
    </View>
  );
});

IsometricPlaceholder.displayName = 'IsometricPlaceholder';

export default IsometricPlaceholder;

