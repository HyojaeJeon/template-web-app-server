/**
 * ConfirmModal Component
 * 확인 모달 - UnifiedToast 시스템과 함께 사용되는 공통 확인 모달
 */
import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

const { width: screenWidth } = Dimensions.get('window');

const ConfirmModal = memo(({
  visible = false,
  title,
  message,
  icon = 'help-circle',
  iconColor = '#2AC1BC',
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  onClose,
  confirmStyle = 'primary', // 'primary', 'danger', 'warning'
  loading = false}) => {
  const { t } = useTranslation(['common']);

  // 스타일 설정
  const getConfirmStyle = () => {
    switch (confirmStyle) {
      case 'danger':
        return {
          backgroundColor: '#DA020E',
          color: '#FFFFFF'};
      case 'warning':
        return {
          backgroundColor: '#FFDD00',
          color: '#1F2937'};
      default:
        return {
          backgroundColor: '#2AC1BC',
          color: '#FFFFFF'};
    }
  };

  const confirmStyleObj = getConfirmStyle();

  const handleConfirm = () => {
    if (loading) {return;}
    onConfirm?.();
  };

  const handleCancel = () => {
    if (loading) {return;}
    onCancel?.();
    onClose?.();
  };

  const handleBackdropPress = () => {
    if (loading) {return;}
    onClose?.();
  };

  if (!visible) {return null;}

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleBackdropPress}
      statusBarTranslucent={true}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <TouchableOpacity
          className="absolute inset-0"
          activeOpacity={1}
          onPress={handleBackdropPress}
        />

        <View
          className="bg-white rounded-2xl p-6 shadow-lg"
          style={{
            width: Math.min(screenWidth - 48, 320),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 16}}
        >
          {/* 아이콘 */}
          <View className="items-center mb-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: `${iconColor}20` }}
            >
              <Icon name={icon} size={32} color={iconColor} />
            </View>
          </View>

          {/* 제목 */}
          {title && (
            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              {title}
            </Text>
          )}

          {/* 메시지 */}
          {message && (
            <Text className="text-base text-gray-600 text-center mb-6 leading-relaxed">
              {message}
            </Text>
          )}

          {/* 버튼들 */}
          <View className="flex-row space-x-3">
            {/* 취소 버튼 */}
            <TouchableOpacity
              className="flex-1 py-3 px-4 rounded-xl border border-gray-300 bg-white"
              onPress={handleCancel}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text className="text-center text-base font-semibold text-gray-700">
                {cancelText || t('common:cancel')}
              </Text>
            </TouchableOpacity>

            {/* 확인 버튼 */}
            <TouchableOpacity
              className="flex-1 py-3 px-4 rounded-xl shadow-sm"
              style={{ backgroundColor: confirmStyleObj.backgroundColor }}
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center">
                {loading && (
                  <View className="mr-2">
                    <Icon
                      name="loading"
                      size={16}
                      color={confirmStyleObj.color}
                    />
                  </View>
                )}
                <Text
                  className="text-center text-base font-semibold"
                  style={{ color: confirmStyleObj.color }}
                >
                  {confirmText || t('common:confirm')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});


export default ConfirmModal;
