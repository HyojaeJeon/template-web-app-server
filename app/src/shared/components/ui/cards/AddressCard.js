/**
 * AddressCard Component - 재사용 가능한 주소 카드
 * CLAUDE.md 가이드라인 준수: SOLID 원칙, DRY, WCAG 2.1
 * Local 주소 형식 지원 (City/District/Ward)
 */
import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

/**
 * AddressCard Component
 *
 * Single Responsibility: 주소 정보 표시 및 기본 액션 제공만 담당
 * Open/Closed: 새로운 주소 타입이나 액션 추가 시 수정 없이 확장 가능
 */
const AddressCard = memo(({
  address = {
    id: null,
    name: '',
    street: '',
    ward: '',
    district: '',
    city: 'Ho Chi Minh City',
    isDefault: false,
    type: 'HOME',
    phoneNumber: '',
    recipientName: ''},
  onPress = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onSetDefault = () => {},
  showActions = true,
  isSelected = false,
  variant = 'default', // 'default', 'compact', 'selectable'
  className = ''}) => {
  const { t } = useTranslation(['profile', 'common', 'location']);

  // 주소 타입 아이콘 가져오기
  const getAddressTypeIcon = useCallback(() => {
    const iconMap = {
      HOME: 'home',
      WORK: 'work',
      SCHOOL: 'school',
      OTHER: 'location-on'};
    return iconMap[address.type] || 'location-on';
  }, [address.type]);

  // 주소 타입 색상 가져오기
  const getAddressTypeColor = useCallback(() => {
    const colorMap = {
      HOME: '#00B14F',
      WORK: '#2AC1BC',
      SCHOOL: '#FFDD00',
      OTHER: '#6B7280'};
    return colorMap[address.type] || '#6B7280';
  }, [address.type]);

  // 주소 타입 번역 키 가져오기
  const getAddressTypeLabel = useCallback(() => {
    const labelMap = {
      HOME: 'location:addressType.home',
      WORK: 'location:addressType.work',
      SCHOOL: 'location:addressType.school',
      OTHER: 'location:addressType.other'};
    return t(labelMap[address.type] || labelMap.OTHER);
  }, [address.type, t]);

  // 전체 주소 포맷팅 (Local 형식)
  const getFullAddress = useCallback(() => {
    const parts = [
      address.street,
      address.ward && `Ward ${address.ward}`,
      address.district && `District ${address.district}`,
      address.city,
    ].filter(Boolean);

    return parts.join(', ');
  }, [address]);

  // 카드 터치 핸들러
  const handleCardPress = useCallback(() => {
    onPress(address);
  }, [onPress, address]);

  // 편집 버튼 핸들러
  const handleEditPress = useCallback(() => {
    onEdit(address);
  }, [onEdit, address]);

  // 삭제 버튼 핸들러
  const handleDeletePress = useCallback(() => {
    onDelete(address);
  }, [onDelete, address]);

  // 기본 주소 설정 핸들러
  const handleSetDefaultPress = useCallback(() => {
    onSetDefault(address);
  }, [onSetDefault, address]);

  // 컨테이너 스타일 결정
  const getContainerStyles = useCallback(() => {
    const baseStyles = 'bg-white rounded-xl border mb-3';

    const variantStyles = {
      default: 'p-4',
      compact: 'p-3',
      selectable: 'p-4'};

    const borderStyles = isSelected
      ? 'border-2 border-primary-500'
      : address.isDefault
        ? 'border-2 border-green-500'
        : 'border border-gray-200';

    return `${baseStyles} ${variantStyles[variant]} ${borderStyles}`;
  }, [variant, isSelected, address.isDefault]);

  // 카드 그림자 스타일
  const cardShadowStyle = {
    shadowColor: isSelected ? '#2AC1BC' : address.isDefault ? '#00B14F' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isSelected ? 0.15 : address.isDefault ? 0.1 : 0.05,
    shadowRadius: isSelected ? 8 : 4,
    elevation: isSelected ? 6 : 2};

  return (
    <TouchableOpacity
      className={`${getContainerStyles()} ${className}`}
      style={cardShadowStyle}
      onPress={handleCardPress}
      activeOpacity={0.95}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${address.name}, ${getFullAddress()}`}
      accessibilityHint={t('common:tapToSelect')}
    >
      {/* 선택 표시 (selectable 변형에서만) */}
      {variant === 'selectable' && (
        <View className="absolute top-2 right-2">
          <MaterialIcons
            name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
            size={20}
            color={isSelected ? '#2AC1BC' : '#9CA3AF'}
          />
        </View>
      )}

      <View className="flex-row items-start">
        {/* 주소 타입 아이콘 */}
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3 mt-1"
          style={{ backgroundColor: `${getAddressTypeColor()}20` }}
        >
          <MaterialIcons
            name={getAddressTypeIcon()}
            size={20}
            color={getAddressTypeColor()}
          />
        </View>

        {/* 주소 정보 */}
        <View className="flex-1">
          {/* 헤더 라인 */}
          <View className="flex-row items-center mb-1">
            <Text className="text-base font-bold text-gray-900 flex-1">
              {address.name || getAddressTypeLabel()}
            </Text>

            {/* 기본 주소 뱃지 */}
            {address.isDefault && (
              <View className="bg-green-100 rounded-full px-2 py-1 ml-2">
                <Text className="text-green-700 text-xs font-medium">
                  {t('profile:addresses.address.default')}
                </Text>
              </View>
            )}
          </View>

          {/* 주소 타입 (이름이 있을 때만 표시) */}
          {address.name && (
            <Text className="text-sm text-gray-600 mb-1">
              {getAddressTypeLabel()}
            </Text>
          )}

          {/* 전체 주소 */}
          <Text className="text-sm text-gray-800 mb-2 leading-5">
            {getFullAddress()}
          </Text>

          {/* 수신자 정보 */}
          {(address.recipientName || address.phoneNumber) && (
            <View className="flex-row items-center mb-2">
              {address.recipientName && (
                <View className="flex-row items-center mr-4">
                  <MaterialCommunityIcons name="account" size={14} color="#6B7280" />
                  <Text className="text-xs text-gray-600 ml-1">
                    {address.recipientName}
                  </Text>
                </View>
              )}

              {address.phoneNumber && (
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="phone" size={14} color="#6B7280" />
                  <Text className="text-xs text-gray-600 ml-1">
                    {address.phoneNumber}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* 액션 버튼들 */}
          {showActions && variant !== 'selectable' && (
            <View className="flex-row items-center" style={{ gap: 12 }}>
              {!address.isDefault && (
                <TouchableOpacity
                  className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2"
                  onPress={handleSetDefaultPress}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('profile:address.setAsDefault')}
                >
                  <MaterialIcons name="star-border" size={16} color="#6B7280" />
                  <Text className="text-gray-700 text-xs font-medium ml-1">
                    {t('profile:address.setDefault')}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                className="flex-row items-center bg-blue-50 rounded-lg px-3 py-2"
                onPress={handleEditPress}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('common:actions.edit')}
              >
                <MaterialIcons name="edit" size={16} color="#3B82F6" />
                <Text className="text-blue-700 text-xs font-medium ml-1">
                  {t('common:actions.edit')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center bg-red-50 rounded-lg px-3 py-2"
                onPress={handleDeletePress}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('common:actions.delete')}
              >
                <MaterialIcons name="delete" size={16} color="#EF4444" />
                <Text className="text-red-700 text-xs font-medium ml-1">
                  {t('common:actions.delete')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});


export default AddressCard;
