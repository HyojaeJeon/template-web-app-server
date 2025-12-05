/**
 * AccessibleTabs - WCAG 2.1 준수 탭 네비게이션
 * 키보드 네비게이션, 스크린리더 지원, 명확한 상태 표시
 */
import React from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

const AccessibleTabs = ({
  tabs,
  selectedTab,
  onTabSelect,
  accessibilityLabel = '탭 네비게이션',
  style,
  ...props
}) => {
  const { t } = useTranslation(['home', 'common']);

  return (
    <View
      className="px-4 py-6"
      style={[{
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(10px)'}, style]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="none"
      >
        {tabs.map((tab, index) => {
          const isSelected = selectedTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabSelect?.(tab.id)}
              className={`mr-4 py-4 px-6 rounded-2xl flex-row items-center min-h-touch ${
                isSelected
                  ? 'border-2 shadow-xl'
                  : 'bg-white/80 border border-gray-200 shadow-md'
              }`}
              style={{
                backgroundColor: isSelected ? tab.bgColor : 'rgba(255, 255, 255, 0.85)',
                borderColor: isSelected ? tab.color : '#E5E7EB',
                elevation: isSelected ? 12 : 4,
                shadowColor: isSelected ? tab.color : '#000',
                shadowOffset: { width: 0, height: isSelected ? 6 : 2 },
                shadowOpacity: isSelected ? 0.25 : 0.1,
                shadowRadius: isSelected ? 12 : 4}}
              accessibilityRole="tab"
              accessibilityState={{
                selected: isSelected,
                expanded: isSelected}}
              accessibilityLabel={`${tab.name} 탭${isSelected ? ', 선택됨' : ''}`}
              accessibilityHint={`${tab.name} 관련 콘텐츠를 표시합니다`}
              activeOpacity={0.8}
            >
              {/* 탭 아이콘 - 더 세련된 디자인과 애니메이션 효과 */}
              <View
                className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${
                  isSelected ? '' : 'bg-gray-100/70'
                }`}
                style={{
                  backgroundColor: isSelected ? tab.color : 'rgba(243, 244, 246, 0.8)',
                  shadowColor: isSelected ? tab.color : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isSelected ? 0.3 : 0,
                  shadowRadius: 6,
                  elevation: isSelected ? 6 : 0}}
                accessibilityRole="image"
                importantForAccessibility="no"
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={isSelected ? 'white' : tab.color}
                />
              </View>

              {/* 탭 라벨 - 더 나은 타이포그래피 */}
              <Text
                className={`font-bold text-base ${
                  isSelected ? 'text-gray-800' : 'text-gray-600'
                }`}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                accessibilityRole="text"
                importantForAccessibility="no"
              >
                {tab.name}
              </Text>

              {/* 활성 상태 펄스 애니메이션 효과 */}
              {isSelected && (
                <View className="ml-3">
                  <View
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: tab.color }}
                    accessibilityRole="image"
                    accessibilityLabel="선택된 탭 표시"
                    importantForAccessibility="no"
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default AccessibleTabs;
