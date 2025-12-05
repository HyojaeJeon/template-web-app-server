/**
 * MenuItemCard - 메뉴 아이템 카드 컴포넌트
 * 메뉴 이미지, 정보, 가격, 옵션 여부, 가용성 표시
 * 접근성 및 Local 현지화 적용
 */
import React, { memo, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image} from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Components
import VNDFormatter from '@shared/components/ui/localization/VNDFormatter';
import LazyImage from '@shared/components/ui/utility/LazyImage';

// Utils
import { useTheme } from '@providers/ThemeProvider';
import { imageUtils } from '@shared/utils';
const { createOptimizedImageSource, IMAGE_SIZES } = imageUtils;

const MenuItemCard = memo(({
  menuItem,
  onPress,
  showCategory = false,
  layout = 'horizontal', // 'horizontal' | 'vertical'
}) => {
  const { t } = useTranslation();
  const { isDarkMode, colors: theme } = useTheme();

  if (!menuItem) {return null;}

  const {
    id,
    name,
    description,
    price,
    profileImage,
    isAvailable,
    isPopular,
    hasOptions,
    unavailableReason,
    category,
    estimatedPrepTime} = menuItem;

  // 접근성 라벨 생성 (useMemo로 최적화)
  const accessibilityLabel = useMemo(() => [
    name,
    description && description.substring(0, 100),
    `${t('menu.price')}: ${price}₫`,
    isPopular && t('menu.popular'),
    hasOptions && t('menu.hasOptions'),
    !isAvailable && t('menu.unavailable'),
  ].filter(Boolean).join(', '), [name, description, price, isPopular, hasOptions, isAvailable, t]);

  // 이미지 소스 최적화
  const optimizedImageSource = useMemo(() => {
    if (!profileImage) {return null;}
    const targetSize = layout === 'horizontal' ? IMAGE_SIZES.SMALL : IMAGE_SIZES.MEDIUM;
    return createOptimizedImageSource(profileImage, targetSize, {
      quality: 85,
      format: 'auto',
      fit: 'cover'});
  }, [profileImage, layout]);

  // 메뉴 아이템 클릭 핸들러
  const handlePress = useCallback(() => {
    onPress?.(menuItem);
  }, [onPress, menuItem]);

  // 가로 레이아웃
  if (layout === 'horizontal') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={!isAvailable}
        style={{
          backgroundColor: theme.bgCard,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          opacity: !isAvailable ? 0.6 : 1,
        }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !isAvailable }}
      >
        <View className="flex-row p-4">
          {/* 메뉴 정보 */}
          <View className="flex-1 pr-3">
            {/* 상단 라벨들 */}
            <View className="flex-row items-center mb-2">
              {showCategory && category && (
                <View style={{ backgroundColor: theme.bgInput, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 8 }}>
                  <Text style={{ fontSize: 12, color: theme.textSecondary, fontWeight: '500' }}>
                    {category.name}
                  </Text>
                </View>
              )}

              {isPopular && (
                <View style={{ backgroundColor: isDarkMode ? 'rgba(251, 191, 36, 0.2)' : '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 8 }}>
                  <Text style={{ fontSize: 12, color: isDarkMode ? '#FBBF24' : '#B45309', fontWeight: '500' }}>
                    {t('menu.popular')}
                  </Text>
                </View>
              )}

              {hasOptions && (
                <View className="flex-row items-center mr-2">
                  <MaterialCommunityIcons
                    name="tune-variant"
                    size={12}
                    color={theme.textSecondary}
                  />
                  <Text style={{ fontSize: 12, color: theme.textSecondary, marginLeft: 4 }}>
                    {t('menu.customizable')}
                  </Text>
                </View>
              )}
            </View>

            {/* 메뉴 이름 */}
            <Text
              style={{ fontSize: 18, fontWeight: '600', color: theme.textPrimary, marginBottom: 4 }}
              numberOfLines={2}
            >
              {name}
            </Text>

            {/* 설명 */}
            {description && (
              <Text
                style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}
                numberOfLines={2}
              >
                {description}
              </Text>
            )}

            {/* 하단 정보 */}
            <View className="flex-row items-center justify-between">
              <VNDFormatter
                amount={price}
                style={{ fontSize: 18, fontWeight: 'bold', color: theme.textPrimary }}
              />

              {estimatedPrepTime && isAvailable && (
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={14}
                    color={theme.textSecondary}
                  />
                  <Text style={{ fontSize: 12, color: theme.textSecondary, marginLeft: 4 }}>
                    {t('menu.prepTime', { time: estimatedPrepTime })}
                  </Text>
                </View>
              )}
            </View>

            {/* 품절 상태 */}
            {!isAvailable && (
              <View className="mt-2">
                <Text style={{ fontSize: 14, color: theme.error, fontWeight: '500' }}>
                  {t('menu.unavailable')}
                </Text>
                {unavailableReason && (
                  <Text style={{ fontSize: 12, color: theme.error, opacity: 0.7 }}>
                    {t(`menu.unavailableReason.${unavailableReason}`)}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* 메뉴 이미지 */}
          {profileImage && optimizedImageSource && (
            <View className="relative">
              <LazyImage
                source={optimizedImageSource}
                className="w-24 h-24 rounded-lg"
                fallbackIcon="food"
                fallbackSize={32}
              />

              {!isAvailable && (
                <View className="absolute inset-0 bg-black/30 rounded-lg items-center justify-center">
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={24}
                    color="white"
                  />
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // 세로 레이아웃 (그리드용)
  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!isAvailable}
      style={{
        backgroundColor: theme.bgCard,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
        opacity: !isAvailable ? 0.6 : 1,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !isAvailable }}
    >
      {/* 메뉴 이미지 */}
      <View className="relative">
        {profileImage && optimizedImageSource ? (
          <LazyImage
            source={optimizedImageSource}
            className="w-full h-32"
            fallbackIcon="food"
            fallbackSize={32}
          />
        ) : (
          <View style={{ width: '100%', height: 128, backgroundColor: theme.bgInput, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons
              name="food"
              size={32}
              color={theme.textDisabled}
            />
          </View>
        )}

        {/* 상단 라벨들 */}
        <View className="absolute top-2 left-2 flex-row">
          {isPopular && (
            <View className="bg-amber-500 px-2 py-1 rounded mr-1">
              <Text className="text-xs text-white font-medium">
                {t('menu.popular')}
              </Text>
            </View>
          )}

          {hasOptions && (
            <View className="bg-black/50 px-2 py-1 rounded">
              <MaterialCommunityIcons
                name="tune-variant"
                size={12}
                color="white"
              />
            </View>
          )}
        </View>

        {!isAvailable && (
          <View className="absolute inset-0 bg-black/40 items-center justify-center">
            <View className="bg-white px-3 py-1 rounded">
              <Text className="text-gray-900 font-medium text-sm">
                {t('menu.unavailable')}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 메뉴 정보 */}
      <View className="p-3">
        {showCategory && category && (
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
            {category.name}
          </Text>
        )}

        <Text
          style={{ fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 4 }}
          numberOfLines={2}
        >
          {name}
        </Text>

        {description && (
          <Text
            style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}
            numberOfLines={2}
          >
            {description}
          </Text>
        )}

        <View className="flex-row items-center justify-between">
          <VNDFormatter
            amount={price}
            style={{ fontSize: 18, fontWeight: 'bold', color: theme.textPrimary }}
          />

          {estimatedPrepTime && isAvailable && (
            <View className="flex-row items-center">
              <MaterialCommunityIcons
                name="clock-outline"
                size={12}
                color={theme.textSecondary}
              />
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginLeft: 4 }}>
                {estimatedPrepTime}m
              </Text>
            </View>
          )}
        </View>

        {!isAvailable && unavailableReason && (
          <Text style={{ fontSize: 12, color: theme.error, marginTop: 4, opacity: 0.7 }}>
            {t(`menu.unavailableReason.${unavailableReason}`)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default MenuItemCard;
