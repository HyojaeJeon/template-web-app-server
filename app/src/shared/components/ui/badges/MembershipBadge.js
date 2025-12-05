/**
 * MembershipBadge Component
 * 멤버십 등급 배지 재사용 컴포넌트 - Local 배달 앱 특화
 * CLAUDE.md 가이드라인 준수: SOLID 원칙, DRY, WCAG 2.1
 */
import React, { memo, useCallback } from 'react';
import { View, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

/**
 * MembershipBadge Component
 *
 * Single Responsibility: 멤버십 등급 배지 표시만 담당
 * Open/Closed: 새로운 등급이나 스타일 추가 시 수정 없이 확장 가능
 */
const MembershipBadge = memo(({
  grade = 'bronze', // 'bronze', 'silver', 'gold', 'platinum', 'diamond'
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'default', // 'default', 'compact', 'detailed'
  showIcon = true,
  showGradeName = true,
  showSpecialEffect = true,
  className = '',
  textColor = null, // 커스텀 텍스트 색상
  customLabel = null}) => {
  const { t } = useTranslation(['profile', 'common']);

  // 등급별 설정
  const gradeConfig = {
    bronze: {
      name: t('profile:membership.bronze'),
      icon: 'medal',
      colors: {
        bg: 'bg-orange-100',
        border: 'border-orange-300',
        text: 'text-orange-800',
        accent: '#CD7C2F'},
      emoji: '🥉'},
    silver: {
      name: t('profile:membership.silver'),
      icon: 'medal-outline',
      colors: {
        bg: 'bg-gray-100',
        border: 'border-gray-300',
        text: 'text-gray-800',
        accent: '#9CA3AF'},
      emoji: '🥈'},
    gold: {
      name: t('profile:membership.gold'),
      icon: 'crown',
      colors: {
        bg: 'bg-yellow-100',
        border: 'border-yellow-300',
        text: 'text-yellow-800',
        accent: '#F59E0B'},
      emoji: '🥇'},
    platinum: {
      name: t('profile:membership.platinum'),
      icon: 'crown-outline',
      colors: {
        bg: 'bg-purple-100',
        border: 'border-purple-300',
        text: 'text-purple-800',
        accent: '#8B5CF6'},
      emoji: '💎'},
    diamond: {
      name: t('profile:membership.diamond'),
      icon: 'diamond-stone',
      colors: {
        bg: 'bg-blue-100',
        border: 'border-blue-300',
        text: 'text-blue-800',
        accent: '#3B82F6'},
      emoji: '💠'}};

  const currentGrade = gradeConfig[grade] || gradeConfig.bronze;

  // 크기별 설정
  const sizeConfig = {
    small: {
      container: 'px-2 py-1',
      text: 'text-xs',
      icon: 14,
      height: 'min-h-[24px]'},
    medium: {
      container: 'px-3 py-2',
      text: 'text-sm',
      icon: 16,
      height: 'min-h-[32px]'},
    large: {
      container: 'px-4 py-2',
      text: 'text-base',
      icon: 18,
      height: 'min-h-[40px]'}};

  const currentSize = sizeConfig[size] || sizeConfig.medium;

  // 배지 스타일 결정
  const getBadgeStyles = useCallback(() => {
    const baseStyles = 'flex-row items-center justify-center rounded-full border';
    const { container, height } = currentSize;
    const { bg, border } = currentGrade.colors;

    return `${baseStyles} ${container} ${height} ${bg} ${border}`;
  }, [currentSize, currentGrade]);

  // 텍스트 스타일 결정
  const getTextStyles = useCallback(() => {
    const baseStyles = 'font-semibold';
    const { text: sizeText } = currentSize;
    const textColorClass = textColor || currentGrade.colors.text;

    return `${baseStyles} ${sizeText} ${textColorClass}`;
  }, [currentSize, currentGrade, textColor]);

  // 특별 효과 (그라데이션, 그림자 등)
  const getSpecialEffectStyles = useCallback(() => {
    if (!showSpecialEffect) {return {};}

    const effects = {
      bronze: {
        shadowColor: '#CD7C2F',
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2},
      silver: {
        shadowColor: '#9CA3AF',
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2},
      gold: {
        shadowColor: '#F59E0B',
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 3},
      platinum: {
        shadowColor: '#8B5CF6',
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 3},
      diamond: {
        shadowColor: '#3B82F6',
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 4}};

    return effects[grade] || effects.bronze;
  }, [grade, showSpecialEffect]);

  // 표시할 텍스트 결정
  const getDisplayText = useCallback(() => {
    if (customLabel) {return customLabel;}
    if (!showGradeName) {return '';}

    if (variant === 'compact') {
      const gradeNames = {
        bronze: '브론즈',
        silver: '실버',
        gold: '골드',
        platinum: '플래티넘',
        diamond: '다이아몬드'};
      return gradeNames[grade] || gradeNames.bronze;
    }

    return currentGrade.name;
  }, [customLabel, showGradeName, variant, grade, currentGrade.name]);

  return (
    <View
      className={`${getBadgeStyles()} ${className}`}
      style={getSpecialEffectStyles()}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`멤버십 등급: ${currentGrade.name}`}
    >
      {/* 아이콘 또는 이모지 */}
      {showIcon && (
        <View className="mr-2">
          {variant === 'detailed' ? (
            <Text style={{ fontSize: currentSize.icon }}>
              {currentGrade.emoji}
            </Text>
          ) : (
            <MaterialCommunityIcons
              name={currentGrade.icon}
              size={currentSize.icon}
              color={currentGrade.colors.accent}
            />
          )}
        </View>
      )}

      {/* 등급명 */}
      {showGradeName && (
        <Text className={getTextStyles()}>
          {getDisplayText()}
        </Text>
      )}

      {/* 특별 표시 (골드 이상) */}
      {showSpecialEffect && (grade === 'gold' || grade === 'platinum' || grade === 'diamond') && (
        <View className="ml-1">
          <MaterialCommunityIcons
            name="star"
            size={currentSize.icon - 2}
            color={currentGrade.colors.accent}
          />
        </View>
      )}

      {/* 다이아몬드 등급 특별 효과 */}
      {showSpecialEffect && grade === 'diamond' && (
        <View className="absolute -top-1 -right-1">
          <MaterialCommunityIcons
            name="star-circle"
            size={12}
            color="#3B82F6"
          />
        </View>
      )}
    </View>
  );
});


export default MembershipBadge;
