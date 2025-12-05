/**
 * Dropdown Component
 * Local 배달 앱 특화 드롭다운 컴포넌트
 * CLAUDE.md 가이드라인 준수: SOLID 원칙, DRY, WCAG 2.1
 */
import React, { memo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@providers/ThemeProvider';

const Dropdown = memo(({
  label,
  options = [],
  value,
  onSelect,
  placeholder,
  disabled = false,
  error,
  className = '',
  modalTitle,
  ...props
}) => {
  const { t } = useTranslation(['common']);
  const { isDarkMode, colors: theme } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 선택된 옵션 찾기
  const selectedOption = options.find(option => option.value === value);

  // 모달 열기
  const handlePress = useCallback(() => {
    if (!disabled) {
      setIsModalVisible(true);
    }
  }, [disabled]);

  // 옵션 선택
  const handleSelectOption = useCallback((option) => {
    onSelect?.(option.value, option);
    setIsModalVisible(false);
  }, [onSelect]);

  // 모달 닫기
  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  // 옵션 렌더링
  const renderOption = useCallback(({ item }) => (
    <TouchableOpacity
      className="py-4 px-4"
      style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}
      onPress={() => handleSelectOption(item)}
      accessible={true}
      accessibilityLabel={`${item.label} 선택`}
      accessibilityRole="button"
    >
      <Text
        className="text-base"
        style={{
          color: value === item.value ? theme.primary : theme.textPrimary,
          fontWeight: value === item.value ? '600' : '400'
        }}
      >
        {item.label}
      </Text>
      {value === item.value && (
        <MaterialIcons
          name="check"
          size={20}
          color={theme.primary}
          className="absolute right-4 top-4"
        />
      )}
    </TouchableOpacity>
  ), [value, handleSelectOption, theme]);

  return (
    <View className={className}>
      {label && (
        <Text className="text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        {...props}
        className="rounded-lg p-3 flex-row justify-between items-center"
        style={{
          backgroundColor: disabled ? theme.bgDisabled : theme.bgInput,
          borderWidth: 1,
          borderColor: error ? theme.error : theme.border,
          opacity: disabled ? 0.6 : 1
        }}
        onPress={handlePress}
        disabled={disabled}
        accessible={true}
        accessibilityLabel={`${label || placeholder} 드롭다운`}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: isModalVisible }}
      >
        <Text
          className="flex-1"
          style={{ color: selectedOption ? theme.textPrimary : theme.textMuted }}
        >
          {selectedOption?.label || placeholder || t('pleaseSelect')}
        </Text>

        <MaterialIcons
          name={isModalVisible ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={20}
          color={disabled ? theme.textDisabled : theme.textMuted}
        />
      </TouchableOpacity>

      {error && (
        <Text className="text-sm mt-1" style={{ color: theme.error }}>
          {error}
        </Text>
      )}

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={handleCloseModal}
        >
          <Pressable
            className="rounded-t-3xl max-h-96"
            style={{ backgroundColor: theme.bgCard }}
            onPress={e => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <View className="p-4" style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold" style={{ color: theme.textPrimary }}>
                  {modalTitle || label || t('selectOption')}
                </Text>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  className="p-1"
                  accessible={true}
                  accessibilityLabel="닫기"
                  accessibilityRole="button"
                >
                  <MaterialIcons name="close" size={24} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 옵션 리스트 */}
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => item.value?.toString() || item.label}
              showsVerticalScrollIndicator={false}
              className="max-h-80"
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
});

Dropdown.displayName = 'Dropdown';

export default Dropdown;