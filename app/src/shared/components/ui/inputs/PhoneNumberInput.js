import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CountryPicker from '@shared/components/ui/address/CountryPicker';
import {
  DEFAULT_COUNTRY,
  formatPhoneNumberInput,
  validatePhoneNumber,
  normalizePhoneNumber,
  detectCountryFromPhone} from '@shared/utils/data/format/phoneUtils';
import { useTranslation } from 'react-i18next';

/**
 * 전화번호 입력 컴포넌트
 * 국가 선택과 번호 입력 통합
 */
const PhoneNumberInput = ({
  value = '',
  onChangeText,
  onChangeCountry,
  placeholder,
  error,
  editable = true,
  autoFocus = false,
  onSubmitEditing,
  showValidation = true,
  containerStyle,
  inputStyle,
  errorStyle,
  label,
  required = false,
  defaultCountry = DEFAULT_COUNTRY,
  returnE164 = true, // true면 E.164 형식으로 반환
}) => {
  const { t } = useTranslation(['common', 'ui']);
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [localValue, setLocalValue] = useState('');
  const [isValid, setIsValid] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  // 초기값 설정
  useEffect(() => {
    if (value) {
      const detectedCountry = detectCountryFromPhone(value);
      setSelectedCountry(detectedCountry);

      // E.164를 로컬 형식으로 변환
      const localNumber = value.replace(detectedCountry.dialCode, '');
      setLocalValue(localNumber);
    }
  }, []);

  // 국가 변경 처리
  const handleCountryChange = useCallback((country) => {
    setSelectedCountry(country);
    setIsValid(null);

    if (onChangeCountry) {
      onChangeCountry(country);
    }

    // 번호가 있으면 새 국가 코드로 재포맷
    if (localValue) {
      const normalized = returnE164
        ? normalizePhoneNumber(localValue, country)
        : localValue;

      onChangeText(normalized);
    }
  }, [localValue, onChangeText, onChangeCountry, returnE164]);

  // 전화번호 입력 처리
  const handlePhoneChange = useCallback((text) => {
    // 포맷팅
    const formatted = formatPhoneNumberInput(text, localValue, selectedCountry);
    setLocalValue(formatted);

    // 유효성 검사
    if (showValidation && formatted.length >= selectedCountry.minLength) {
      const valid = validatePhoneNumber(formatted, selectedCountry);
      setIsValid(valid);
    } else {
      setIsValid(null);
    }

    // 콜백 호출
    if (onChangeText) {
      const outputValue = returnE164
        ? normalizePhoneNumber(formatted, selectedCountry)
        : formatted;

      onChangeText(outputValue);
    }
  }, [localValue, selectedCountry, showValidation, onChangeText, returnE164]);

  // 포커스 처리
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);

    // 블러 시 최종 유효성 검사
    if (showValidation && localValue) {
      const valid = validatePhoneNumber(localValue, selectedCountry);
      setIsValid(valid);
    }
  };

  // 입력 필드 클리어
  const handleClear = () => {
    setLocalValue('');
    setIsValid(null);
    onChangeText('');
  };

  // 테두리 색상 결정
  const getBorderColor = () => {
    if (error) {return 'border-red-500';}
    if (isFocused) {return 'border-primary-600';}
    if (isValid === true) {return 'border-green-500';}
    if (isValid === false) {return 'border-red-500';}
    return 'border-gray-200';
  };

  return (
    <View className={`${containerStyle}`}>
      {/* 라벨 */}
      {label && (
        <View className="flex-row items-center mb-2">
          <Text className="text-gray-700 text-sm font-medium">
            {label}
          </Text>
          {required && (
            <Text className="text-red-500 ml-1">*</Text>
          )}
        </View>
      )}

      {/* 입력 컨테이너 - 글래스모피즘 스타일 */}
      <View
        className={`flex-row items-center bg-gray-50 border rounded-xl px-0 ${getBorderColor()} ${inputStyle || 'border-gray-200'}`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 1}}
      >
        {/* 국가 선택기 */}
        <View className="pl-4 pr-2">
          <CountryPicker
            selectedCountry={selectedCountry}
            onSelectCountry={handleCountryChange}
            disabled={!editable}
            showFlag={true}
            showDialCode={true}
            customButtonStyle="bg-transparent p-0 rounded-none"
          />
        </View>

        {/* 구분선 */}
        <View className="w-px h-6 bg-gray-300" />

        {/* 전화번호 입력 */}
        <TextInput
          className="flex-1 text-base text-gray-900 py-3 px-3"
          value={localValue}
          onChangeText={handlePhoneChange}
          placeholder={placeholder || selectedCountry.placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          editable={editable}
          autoFocus={autoFocus}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="done"
          maxLength={selectedCountry.maxLength + 4} // 포맷팅 문자 고려
        />

        {/* 상태 아이콘 */}
        {localValue.length > 0 && (
          <TouchableOpacity
            className="pr-4 pl-2 items-center justify-center"
            onPress={handleClear}
            disabled={!editable}
            style={{ opacity: editable ? 1 : 0.5 }}
          >
            {isValid === true ? (
              <Icon name="checkmark-circle" size={20} color="#10B981" />
            ) : isValid === false ? (
              <Icon name="close-circle" size={20} color="#EF4444" />
            ) : (
              <Icon name="close-circle-outline" size={20} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 에러 메시지 */}
      {error && (
        <Text className={`text-sm text-red-500 mt-2 ${errorStyle}`}>
          {error}
        </Text>
      )}

      {/* 유효성 메시지 */}
      {showValidation && isValid === false && !error && (
        <Text className="text-sm text-red-500 mt-2">
          {t('validation.invalidPhoneNumber')}
        </Text>
      )}

      {/* 힌트 텍스트 */}
      {!error && isValid !== false && localValue.length === 0 && (
        <Text className="text-xs text-gray-500 mt-1">
          {t('phoneHint', { format: selectedCountry.format })}
        </Text>
      )}
    </View>
  );
};

PhoneNumberInput.displayName = 'PhoneNumberInput';

export default PhoneNumberInput;
