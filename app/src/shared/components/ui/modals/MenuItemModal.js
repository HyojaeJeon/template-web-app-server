/**
 * MenuItemModal - 메뉴 아이템 상세 모달
 * 옵션 선택, 수량 조절, 장바구니 추가 기능 구현
 * server/src/graphql 준수, 접근성 및 Local 현지화 적용
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions} from 'react-native';

// 화면 너비 (이미지 캐러셀용)
const { width: screenWidth } = Dimensions.get('window');
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Components
import { LoadingSpinner } from '@shared/components/ui/feedback/Loading';
import VNDFormatter from '@shared/components/ui/localization/VNDFormatter';
import MenuOptionSelector from '@shared/components/ui/menu/MenuOptionSelector';
import { useToast } from '@providers/ToastProvider';
import { useTheme } from '@providers/ThemeProvider';
// Utils
import { colors } from '@shared/design/tokens';

const MenuItemModal = ({
  visible,
  menuItem,
  onClose,
  onAddToCart,
  loading = false}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { isDarkMode, colors: theme } = useTheme();

  // 로컬 상태 관리
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0); // 이미지 슬라이드 인덱스

  // 메뉴 아이템이 없으면 렌더링 안함
  if (!menuItem) {return null;}

  // 옵션 선택 핸들러
  const handleOptionChange = useCallback((groupId, optionId, selected) => {
    setSelectedOptions(prev => {
      if (selected) {
        // 옵션 추가
        return [...prev, { groupId, optionId }];
      } else {
        // 옵션 제거
        return prev.filter(opt => !(opt.groupId === groupId && opt.optionId === optionId));
      }
    });

    // 에러 상태 초기화
    setValidationErrors([]);
  }, []);

  // 수량 변경 핸들러
  const handleQuantityChange = useCallback((newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  }, []);

  // 옵션 검증
  const validateOptions = useCallback(() => {
    if (!menuItem.optionGroups || menuItem.optionGroups.length === 0) {
      return { isValid: true, errors: [] };
    }

    const errors = [];
    const selectedOptionMap = new Map();

    // 선택된 옵션들을 그룹별로 정리
    selectedOptions.forEach(option => {
      const group = selectedOptionMap.get(option.groupId) || [];
      group.push(option);
      selectedOptionMap.set(option.groupId, group);
    });

    // 각 옵션 그룹 검증
    menuItem.optionGroups.forEach(group => {
      const selectedForGroup = selectedOptionMap.get(group.id) || [];

      // 필수 선택 검증
      if (group.isRequired && selectedForGroup.length === 0) {
        errors.push({
          groupId: group.id,
          groupName: group.name,
          type: 'required',
          message: t('menu.validation.required', { groupName: group.name })});
      }

      // 최소 선택 검증
      if (group.minSelection && selectedForGroup.length < group.minSelection) {
        errors.push({
          groupId: group.id,
          groupName: group.name,
          type: 'min_selection',
          message: t('menu.validation.minSelection', {
            groupName: group.name,
            min: group.minSelection})});
      }

      // 최대 선택 검증
      if (group.maxSelection && selectedForGroup.length > group.maxSelection) {
        errors.push({
          groupId: group.id,
          groupName: group.name,
          type: 'max_selection',
          message: t('menu.validation.maxSelection', {
            groupName: group.name,
            max: group.maxSelection})});
      }
    });

    return {
      isValid: errors.length === 0,
      errors};
  }, [menuItem.optionGroups, selectedOptions, t]);

  // 총 가격 계산
  const totalPrice = useMemo(() => {
    let basePrice = parseFloat(menuItem.price);
    let optionsPrice = 0;

    selectedOptions.forEach(selectedOption => {
      const optionGroup = menuItem.optionGroups?.find(group =>
        (group.options || []).some(opt => opt.id === selectedOption.optionId)
      );

      if (optionGroup) {
        const list = optionGroup.options || [];
        const option = list.find(opt => opt.id === selectedOption.optionId);
        if (option && option.price) {
          optionsPrice += parseFloat(option.price);
        }
      }
    });

    return (basePrice + optionsPrice) * quantity;
  }, [menuItem, selectedOptions, quantity]);

  // 장바구니에 추가 핸들러
  const handleAddToCart = useCallback(async () => {
    setIsValidating(true);

    try {
      const validation = validateOptions();

      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setIsValidating(false);
        return;
      }

      const cartItem = {
        menuItemId: menuItem.id,
        storeId: menuItem.store?.id,
        name: menuItem.name,
        price: menuItem.price,
        imageUrl: menuItem.imageUrl,
        quantity,
        selectedOptions: selectedOptions.map(opt => {
          const group = menuItem.optionGroups.find(g => g.id === opt.groupId);
        const list = group?.options || [];
          const option = list.find(o => o.id === opt.optionId);
          return {
            groupId: opt.groupId,
            groupName: group?.name,
            optionId: opt.optionId,
            // 표준 필드 채우기
            name: option?.name,
            optionName: option?.name,
            additionalPrice: option?.price || 0,
            price: option?.price || 0};
        }),
        totalPrice,
        specialInstructions: ''};

      await onAddToCart?.(cartItem);

      // 성공 시 모달 닫기
      onClose();

      // 상태 초기화
      setQuantity(1);
      setSelectedOptions([]);
      setValidationErrors([]);
    } catch (error) {
      showToast('OPERATION_FAILED');
    } finally {
      setIsValidating(false);
    }
  }, [menuItem, quantity, selectedOptions, totalPrice, validateOptions, onAddToCart, onClose, showToast, t]);

  // 모달 닫기 핸들러
  const handleClose = useCallback(() => {
    setQuantity(1);
    setSelectedOptions([]);
    setValidationErrors([]);
    setActiveImageIndex(0); // 이미지 인덱스 초기화
    onClose();
  }, [onClose]);

  // 가용성 확인
  const isAvailable = menuItem.isAvailable;
  const unavailableReason = menuItem.unavailableReason;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1" style={{ backgroundColor: theme.bgPrimary }}>
        {/* 헤더 */}
        <View
          className="flex-row items-center justify-between p-4 border-b"
          style={{ borderBottomColor: theme.border }}
        >
          <TouchableOpacity
            onPress={handleClose}
            className="p-2 -ml-2"
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <Text className="text-lg font-semibold" style={{ color: theme.textPrimary }}>
            {t('menu.itemDetail')}
          </Text>

          <View className="w-10" />
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 160 + insets.bottom // 하단 액션 바 높이 + SafeArea 여백
          }}
        >
          {/* 메뉴 이미지 슬라이드 (16:9 비율) */}
          {(() => {
            // coverImages 우선, fallback: profileImage, imageUrl
            const coverImages = menuItem.coverImages?.length > 0
              ? menuItem.coverImages.map(img => img.url)
              : menuItem.profileImage
                ? [menuItem.profileImage]
                : menuItem.imageUrl
                  ? [menuItem.imageUrl]
                  : [];

            // 16:9 비율 계산
            const imageHeight = screenWidth / (16 / 9);

            if (coverImages.length === 0) {
              return (
                <View
                  className="items-center justify-center"
                  style={{ height: imageHeight, backgroundColor: theme.bgSecondary }}
                >
                  <MaterialCommunityIcons name="food" size={64} color={theme.textMuted} />
                  <Text className="mt-2" style={{ color: theme.textMuted }}>{t('menu.noImage')}</Text>
                </View>
              );
            }

            return (
              <View className="relative">
                {/* 이미지 캐러셀 */}
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                    setActiveImageIndex(index);
                  }}
                >
                  {coverImages.map((imageUrl, index) => (
                    <Image
                      key={index}
                      source={{ uri: imageUrl }}
                      style={{ width: screenWidth, height: imageHeight }}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>

                {/* 품절 오버레이 */}
                {!isAvailable && (
                  <View className="absolute inset-0 bg-black/50 items-center justify-center">
                    <View className="px-4 py-2 rounded-lg" style={{ backgroundColor: theme.bgCard }}>
                      <Text className="font-medium" style={{ color: theme.textPrimary }}>
                        {t('menu.unavailable')}
                      </Text>
                      {unavailableReason && (
                        <Text className="text-sm mt-1" style={{ color: theme.textSecondary }}>
                          {t(`menu.unavailableReason.${unavailableReason}`)}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* 이미지 인디케이터 (점 표시) */}
                {coverImages.length > 1 && (
                  <View className="absolute bottom-3 left-0 right-0 flex-row justify-center">
                    {coverImages.map((_, index) => (
                      <View
                        key={index}
                        className={`w-2 h-2 rounded-full mx-1 ${
                          index === activeImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </View>
                )}

                {/* 이미지 카운터 (우측 하단) */}
                {coverImages.length > 1 && (
                  <View className="absolute bottom-3 right-3 bg-black/60 rounded-full px-2.5 py-1">
                    <Text className="text-white text-xs font-medium">
                      {activeImageIndex + 1}/{coverImages.length}
                    </Text>
                  </View>
                )}
              </View>
            );
          })()}

          {/* 메뉴 정보 */}
          <View className="p-4">
            <Text className="text-2xl font-bold mb-2" style={{ color: theme.textPrimary }}>
              {menuItem.name}
            </Text>

            {menuItem.description && (
              <Text className="text-base mb-4" style={{ color: theme.textSecondary }}>
                {menuItem.description}
              </Text>
            )}

            <View className="flex-row items-center justify-between mb-6">
              <VNDFormatter
                amount={menuItem.price}
                className="text-2xl font-bold"
                style={{ color: theme.primary }}
              />

              {menuItem.isPopular && (
                <View className="px-3 py-1 rounded-full" style={{ backgroundColor: theme.warningLight }}>
                  <Text className="font-medium text-sm" style={{ color: theme.warning }}>
                    {t('menu.popular')}
                  </Text>
                </View>
              )}
            </View>

            {/* 옵션 그룹 */}
            {menuItem.optionGroups && menuItem.optionGroups.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-semibold mb-4" style={{ color: theme.textPrimary }}>
                  {t('menu.options')}
                </Text>

                {menuItem.optionGroups?.map(group => (
                  <MenuOptionSelector
                    key={group.id}
                    optionGroup={group}
                    selectedOptions={selectedOptions.filter(opt => opt.groupId === group.id)}
                    onOptionChange={handleOptionChange}
                    validationErrors={validationErrors.filter(err => err.groupId === group.id)}
                  />
                ))}
              </View>
            )}

            {/* 수량 선택 */}
            <View className="mb-6">
              <Text className="text-lg font-semibold mb-4" style={{ color: theme.textPrimary }}>
                {t('menu.quantity')}
              </Text>

              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => handleQuantityChange(quantity - 1)}
                  className="w-12 h-12 rounded-full border items-center justify-center"
                  style={{ borderColor: theme.border }}
                  disabled={quantity <= 1}
                  accessibilityRole="button"
                  accessibilityLabel={t('menu.decreaseQuantity')}
                >
                  <MaterialCommunityIcons
                    name="minus"
                    size={20}
                    color={quantity <= 1 ? theme.textMuted : theme.textPrimary}
                  />
                </TouchableOpacity>

                <Text className="text-xl font-semibold mx-6 min-w-8 text-center" style={{ color: theme.textPrimary }}>
                  {quantity}
                </Text>

                <TouchableOpacity
                  onPress={() => handleQuantityChange(quantity + 1)}
                  className="w-12 h-12 rounded-full border items-center justify-center"
                  style={{ borderColor: theme.border }}
                  disabled={quantity >= 99}
                  accessibilityRole="button"
                  accessibilityLabel={t('menu.increaseQuantity')}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={20}
                    color={quantity >= 99 ? theme.textMuted : theme.textPrimary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* 검증 에러 표시 */}
            {validationErrors.length > 0 && (
              <View className="mb-6">
                {validationErrors.map((error, index) => (
                  <View
                    key={index}
                    className="rounded-lg p-3 mb-2"
                    style={{
                      backgroundColor: theme.errorLight,
                      borderWidth: 1,
                      borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(218, 2, 14, 0.2)'
                    }}
                  >
                    <Text className="text-sm" style={{ color: theme.error }}>
                      {error.message}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* 하단 액션 바 */}
        <View
          className="border-t"
          style={{
            paddingTop: 16,
            paddingHorizontal: 16,
            paddingBottom: Math.max(insets.bottom + 8, 24), // SafeArea + 여백 또는 최소 24px
            backgroundColor: theme.bgPrimary,
            borderTopColor: theme.border
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold" style={{ color: theme.textPrimary }}>
              {t('menu.totalPrice')}
            </Text>
            <VNDFormatter
              amount={totalPrice}
              className="text-xl font-bold"
              style={{ color: theme.primary }}
            />
          </View>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={handleAddToCart}
              disabled={!isAvailable || loading || isValidating}
              className="flex-1 py-4 rounded-lg items-center"
              style={{
                backgroundColor: !isAvailable || loading || isValidating
                  ? theme.button.disabled
                  : theme.primary
              }}
              accessibilityRole="button"
              accessibilityLabel={t('cart.addToCart')}
            >
              {loading || isValidating ? (
                <LoadingSpinner size="small" color="white" />
              ) : (
                <Text
                  className="font-semibold text-lg"
                  style={{
                    color: !isAvailable || loading || isValidating
                      ? theme.button.disabledText
                      : theme.button.primaryText
                  }}
                >
                  {!isAvailable
                    ? t('menu.unavailable')
                    : t('cart.addToCart', { quantity })
                  }
                </Text>
              )}
            </TouchableOpacity>

            {!loading && !isValidating && isAvailable && (
              <VNDFormatter
                amount={totalPrice}
                className="font-black text-3xl"
                style={{ color: theme.primary }}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default MenuItemModal;
