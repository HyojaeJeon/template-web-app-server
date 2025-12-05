/**
 * SegmentedTabs - 접근성 중심의 세그먼트 탭 컴포넌트
 * WCAG 2.1 AA 준수, 44×44pt 터치 타깃
 */
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, AccessibilityInfo } from 'react-native';
import { useTranslation } from 'react-i18next';

const SegmentedTabs = ({
  tabs = [],
  activeTab,
  onTabChange,
  variant = 'underline', // 'underline' | 'background'
  size = 'medium', // 'small' | 'medium' | 'large'
  testID,
  accessible = true}) => {
  const { t } = useTranslation();

  const handleTabPress = useCallback((tabId) => {
    if (tabId !== activeTab) {
      // 햅틱 피드백 (iOS/Android 자동 처리)
      onTabChange?.(tabId);

      // 접근성: 탭 변경 알림
      if (accessible) {
        const selectedTab = tabs.find(tab => tab.id === tabId);
        AccessibilityInfo.announceForAccessibility(
          t('coupon.accessibility.tabSelected', { tab: selectedTab?.title || tabId })
        );
      }
    }
  }, [activeTab, onTabChange, tabs, t, accessible]);

  const getTabStyles = (isActive, variant, size) => {
    const baseClasses = 'flex-1 items-center justify-center';
    const sizeClasses = {
      small: 'py-2 px-3 min-h-[36px]',
      medium: 'py-3 px-4 min-h-[44px]', // WCAG 터치 타깃
      large: 'py-4 px-6 min-h-[48px]'};

    if (variant === 'underline') {
      return `${baseClasses} ${sizeClasses[size]} ${
        isActive
          ? 'border-b-2 border-primary-600'
          : 'border-b border-gray-200'
      }`;
    }

    if (variant === 'background') {
      return `${baseClasses} ${sizeClasses[size]} mx-1 rounded-lg ${
        isActive
          ? 'bg-primary-600'
          : 'bg-transparent'
      }`;
    }

    return `${baseClasses} ${sizeClasses[size]}`;
  };

  const getTextStyles = (isActive, variant) => {
    const baseClasses = 'font-medium';

    if (variant === 'underline') {
      return `${baseClasses} ${
        isActive ? 'text-primary-600' : 'text-onSurface-medium'
      }`;
    }

    if (variant === 'background') {
      return `${baseClasses} ${
        isActive ? 'text-white' : 'text-onSurface-medium'
      }`;
    }

    return baseClasses;
  };

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <View
      className={`flex-row ${variant === 'underline' ? 'border-b border-gray-200' : 'bg-gray-100 rounded-xl p-1'}`}
      testID={testID}
      accessible={accessible}
      accessibilityRole="tablist"
      accessibilityLabel={t('coupon.accessibility.tabList', 'Tab navigation')}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => handleTabPress(tab.id)}
            className={getTabStyles(isActive, variant, size)}
            testID={`${testID}-${tab.id}`}
            accessible={accessible}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.accessibilityLabel || tab.title}
            accessibilityHint={tab.accessibilityHint || `Switch to ${tab.title} tab`}
          >
            <View className="flex-row items-center">
              <Text className={getTextStyles(isActive, variant)}>
                {tab.title}
              </Text>
              {tab.count !== null && tab.count !== undefined && tab.count > 0 && (
                <View className={`ml-2 rounded-full px-2 py-0.5 ${
                  isActive && variant === 'background'
                    ? 'bg-white bg-opacity-20'
                    : 'bg-primary-600'
                }`}>
                  <Text className={`text-xs font-bold ${
                    isActive && variant === 'background'
                      ? 'text-white'
                      : variant === 'underline' && isActive
                        ? 'text-white'
                        : 'text-white'
                  }`}>
                    {tab.count > 99 ? '99+' : tab.count}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default React.memo(SegmentedTabs);
