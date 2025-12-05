/**
 * MessageInput - 재사용 가능한 채팅 메시지 입력 컴포넌트
 * designscreen을 참고하여 Local App에 최적화된 프리미엄 디자인
 */
import React, { memo, useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const MessageInput = memo(({
  value = '',
  onChangeText,
  onSend,
  placeholder = null,
  disabled = false,
  loading = false,
  showImageButton = true,
  onImagePress}) => {
  const { t } = useTranslation(['ui', 'common']);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const handleSend = () => {
    if (value.trim() && onSend) {
      onSend(value.trim());
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const canSend = value.trim() && !loading && !disabled;

  return (
    <View
      className="bg-white px-4 py-4 border-t border-gray-100"
      style={{
        paddingBottom: Platform.OS === 'ios' ? 38 : 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 12}}
    >
      <View className="flex-row items-end">
        {/* 이미지 버튼 */}
        {showImageButton && (
          <TouchableOpacity
            onPress={onImagePress}
            className="w-11 h-11 rounded-full bg-gray-50 items-center justify-center flex-shrink-0 mr-3 border border-gray-200"
            activeOpacity={0.8}
            style={{
              shadowColor: '#2AC1BC',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2}}
          >
            <Icon name="image" size={22} color="#2AC1BC" />
          </TouchableOpacity>
        )}

        {/* 입력 필드 컨테이너 */}
        <View
          className="flex-1 max-h-28 bg-gray-50 rounded-3xl px-5 mr-3 border border-gray-200"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
            borderColor: isFocused ? '#2AC1BC' : '#E5E7EB',
            backgroundColor: isFocused ? '#F0FDFA' : '#F9FAFB'}}
        >
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder || t('ui:inputs.message.placeholder')}
            placeholderTextColor="#9CA3AF"
            multiline
            className="text-base text-gray-900 py-0"
            style={{
              minHeight: 44,
              maxHeight: 100,
              paddingVertical: 12,
              textAlignVertical: 'center',
              includeFontPadding: false,
              lineHeight: 22,
              fontSize: 16}}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            maxLength={1000}
            accessible={true}
            accessibilityLabel={t('ui:inputs.message.accessibilityLabel')}
            accessibilityHint={t('ui:inputs.message.accessibilityHint')}
          />
        </View>

        {/* 전송 버튼 */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          className={`w-11 h-11 rounded-full items-center justify-center flex-shrink-0 ${
            canSend ? 'bg-primary' : 'bg-gray-300'
          }`}
          activeOpacity={0.8}
          style={{
            shadowColor: canSend ? '#2AC1BC' : '#9CA3AF',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: canSend ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: canSend ? 4 : 2,
            transform: canSend ? [{ scale: 1.02 }] : [{ scale: 1 }]}}
        >
          {loading ? (
            <Icon
              name="loading"
              size={20}
              color="#FFFFFF"
            />
          ) : (
            <Icon
              name="send"
              size={20}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default MessageInput;
