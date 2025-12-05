/**
 * Avatar Component
 * Local App 공용 아바타 컴포넌트
 * - 사용자 프로필 이미지 표시
 * - 기본 아이콘 fallback 제공
 * - 크기별 반응형 디자인
 * - Local 테마 색상 적용
 * CLAUDE.md 가이드라인 준수
 */
import React, { memo, useState } from 'react';
import { View, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Avatar = ({
  source,
  size = 40,
  className = '',
  fallbackIcon = 'account-circle',
  fallbackIconColor = '#9CA3AF',
  borderColor = '#E5E7EB',
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const sizeClass = {
    24: 'w-6 h-6',
    32: 'w-8 h-8',
    40: 'w-10 h-10',
    48: 'w-12 h-12',
    56: 'w-14 h-14',
    64: 'w-16 h-16'};

  const iconSizes = {
    24: 16,
    32: 20,
    40: 24,
    48: 28,
    56: 32,
    64: 36};

  const containerClass = `${sizeClass[size] || `w-[${size}px] h-[${size}px]`} rounded-full overflow-hidden border border-gray-200 ${className}`;

  // 이미지 로드 실패 또는 source가 없는 경우 기본 아이콘 표시
  if (!source?.uri || imageError) {
    return (
      <View
        className={`${containerClass} bg-gray-100 items-center justify-center`}
        style={{ borderColor }}
        {...props}
      >
        <Icon
          name={fallbackIcon}
          size={iconSizes[size] || size * 0.6}
          color={fallbackIconColor}
        />
      </View>
    );
  }

  return (
    <View
      className={containerClass}
      style={{ borderColor }}
      {...props}
    >
      <Image
        source={source}
        className="w-full h-full"
        onError={handleImageError}
        resizeMode="cover"
      />
    </View>
  );
};


export default memo(Avatar);
