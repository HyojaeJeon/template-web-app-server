/**
 * EcoFriendlyBadge - 친환경 정보 배지 컴포넌트
 * 매장의 친환경 정책과 에코 점수를 시각화
 */
import React from 'react';
import { View, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

export const EcoFriendlyBadge = ({ ecoInfo }) => {
  const { t } = useTranslation();
  
  if (!ecoInfo) {
    return null;
  }
  
  const { ecoScore = 0 } = ecoInfo;
  
  // 에코 레벨 결정
  const getEcoLevel = (score) => {
    if (score >= 80) return { color: '#10B981', label: 'excellent', icon: 'leaf' };
    if (score >= 60) return { color: '#3B82F6', label: 'good', icon: 'sprout' };
    if (score >= 40) return { color: '#F59E0B', label: 'moderate', icon: 'tree' };
    return { color: '#6B7280', label: 'basic', icon: 'seed-outline' };
  };
  
  const level = getEcoLevel(ecoScore);
  
  // 에코 항목별 아이콘
  const ecoIcons = {
    sustainablePackaging: 'package-variant-closed',
    plasticFree: 'bottle-soda-classic-outline',
    biodegradable: 'sprout',
    reusableContainers: 'recycle',
    carbonNeutral: 'molecule-co2',
    localSourcing: 'map-marker-radius'};
  
  return (
    <View className="bg-green-50 rounded-lg p-3">
      {/* 에코 점수 헤더 */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <MaterialCommunityIcons name={level.icon} size={20} color={level.color} />
          <Text className="ml-2 font-semibold text-base" style={{ color: level.color }}>
            {t(`eco.level.${level.label}`)}
          </Text>
        </View>
        <View className="bg-white px-2 py-1 rounded-full">
          <Text className="text-sm font-bold" style={{ color: level.color }}>
            {ecoScore}%
          </Text>
        </View>
      </View>
      
      {/* 에코 점수 프로그레스 바 */}
      <View className="bg-white rounded-full h-2 mb-3 overflow-hidden">
        <View 
          className="h-full rounded-full"
          style={{ 
            width: `${ecoScore}%`,
            backgroundColor: level.color 
          }}
        />
      </View>
      
      {/* 에코 특징 배지들 */}
      <View className="flex-row flex-wrap gap-1">
        {Object.entries(ecoInfo).map(([key, value]) => {
          if (key === 'ecoScore' || key === 'certifications' || !value) return null;
          
          return (
            <View 
              key={key}
              className="flex-row items-center bg-green-100 rounded-full px-2 py-1"
            >
              <MaterialCommunityIcons 
                name={ecoIcons[key] || 'leaf'} 
                size={14} 
                color="#059669" 
              />
              <Text className="text-xs text-green-700 ml-1 font-medium">
                {t(`eco.${key}`)}
              </Text>
            </View>
          );
        })}
      </View>
      
      {/* 환경 인증 표시 */}
      {ecoInfo.certifications && ecoInfo.certifications.length > 0 && (
        <View className="mt-2 pt-2 border-t border-green-200">
          <Text className="text-xs text-green-600 font-medium">
            {t('eco.certifications')}: {ecoInfo.certifications.join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
};

// 간단한 에코 아이콘 (컴팩트 버전)
export const EcoIcon = ({ ecoScore }) => {
  if (!ecoScore || ecoScore === 0) return null;
  
  const getColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#3B82F6';
    if (score >= 40) return '#F59E0B';
    return '#6B7280';
  };
  
  return (
    <View className="flex-row items-center">
      <MaterialCommunityIcons name="leaf" size={16} color={getColor(ecoScore)} />
      <Text className="text-xs ml-1" style={{ color: getColor(ecoScore) }}>
        {ecoScore}%
      </Text>
    </View>
  );
};

export default EcoFriendlyBadge;