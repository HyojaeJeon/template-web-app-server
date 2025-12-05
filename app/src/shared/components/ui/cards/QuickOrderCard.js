/**
 * QuickOrderCard - 접근성 강화된 빠른 주문 카드 컴포넌트
 * WCAG 2.1 AA 준수, 안전한 i18n 처리
 */
import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';

const QuickOrderCard = memo(({
  item,
  onPress,
  className = '',
  testID,
  namespace = 'home'}) => {
  const { t, ready, i18n } = useTranslation([namespace, 'common']);

  // 안전한 번역 함수 (키 노출 방지)
  const safeTranslate = (key, fallback = '') => {
    if (!ready) {return '···';}
    try {
      const result = t(key);
      return result === key ? fallback : result;
    } catch (error) {
      console.warn('Translation error:', key, error);
      return fallback;
    }
  };

  // 가격 포맷팅 (Local/한국 로케일 지원)
  const formatPrice = (price) => {
    const locale = i18n.language;
    if (locale === 'vi') {
      return `${price.toLocaleString('vi-VN')}₫`;
    }
    return `${price.toLocaleString('ko-KR')}원`;
  };

  // 접근성 레이블 생성
  const getAccessibilityLabel = () => {
    const itemName = item.nameKey ? safeTranslate(item.nameKey, item.name) : item.name;
    const price = typeof item.price === 'number' ? formatPrice(item.price) : item.price;
    return `${itemName}, ${price}, ${safeTranslate('accessibility.quickOrderHint', '빠른 주문하려면 두 번 탭하세요')}`;
  };

  const displayName = item.nameKey ? safeTranslate(item.nameKey, item.name) : item.name;
  const displayPrice = typeof item.price === 'number' ? formatPrice(item.price) : item.price;

  return (
    <TouchableOpacity
      onPress={() => onPress?.(item)}
      className={`flex-1 mr-3 last:mr-0 bg-white rounded-xl p-4 border border-gray-100 shadow-sm min-h-touch ${className}`}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={safeTranslate('accessibility.quickOrderHint', '빠른 주문하려면 두 번 탭하세요')}
      testID={testID}
      activeOpacity={0.8}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1}}
    >
      {/* 아이콘 컨테이너 */}
      <View className="w-12 h-12 bg-primary-50 rounded-full items-center justify-center mb-3 mx-auto">
        <Icon
          name={item.icon || 'restaurant'}
          size={24}
          color="#2AC1BC"
          accessibilityRole="image"
          importantForAccessibility="no"
        />
      </View>

      {/* 메뉴명 */}
      <Text
        className="text-center font-semibold text-gray-900 text-sm mb-1"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        accessibilityRole="text"
        importantForAccessibility="no"
      >
        {displayName}
      </Text>

      {/* 가격 */}
      <Text
        className="text-center text-primary-700 font-bold text-xs"
        accessibilityRole="text"
        importantForAccessibility="no"
      >
        {displayPrice}
      </Text>
    </TouchableOpacity>
  );
});


export default QuickOrderCard;
