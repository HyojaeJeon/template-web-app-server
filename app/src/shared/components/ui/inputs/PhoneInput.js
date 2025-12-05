/**
 * PhoneInput Component
 * Local 전화번호 입력을 위한 특화된 입력 컴포넌트
 */
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import StandardInput from '@shared/components/ui/inputs/StandardInput';
import { useTranslation } from 'react-i18next';

const PhoneInput = ({
  value = '',
  onChangeText,
  error,
  disabled = false,
  variant = 'default',
  size = 'medium',
  ...props
}) => {
  const { t } = useTranslation();
  const [formattedValue, setFormattedValue] = useState(value);

  const formatPhoneNumber = (phone) => {
    // Local 전화번호 포맷팅: +84 123 456 789
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('84')) {
      const number = cleaned.substring(2);
      if (number.length >= 9) {
        return `+84 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6, 9)}`;
      } else if (number.length >= 6) {
        return `+84 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
      } else if (number.length >= 3) {
        return `+84 ${number.substring(0, 3)} ${number.substring(3)}`;
      } else if (number.length > 0) {
        return `+84 ${number}`;
      }
    } else if (cleaned.startsWith('0')) {
      const number = cleaned.substring(1);
      if (number.length >= 9) {
        return `+84 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6, 9)}`;
      } else if (number.length >= 6) {
        return `+84 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
      } else if (number.length >= 3) {
        return `+84 ${number.substring(0, 3)} ${number.substring(3)}`;
      } else if (number.length > 0) {
        return `+84 ${number}`;
      }
    } else if (cleaned.length > 0) {
      if (cleaned.length >= 9) {
        return `+84 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)}`;
      } else if (cleaned.length >= 6) {
        return `+84 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
      } else if (cleaned.length >= 3) {
        return `+84 ${cleaned.substring(0, 3)} ${cleaned.substring(3)}`;
      } else {
        return `+84 ${cleaned}`;
      }
    }

    return cleaned.length > 0 ? `+84 ${cleaned}` : '';
  };

  const handleChangeText = (text) => {
    const formatted = formatPhoneNumber(text);
    setFormattedValue(formatted);

    // 클린한 번호를 부모에게 전달 (국가코드 포함)
    const cleaned = text.replace(/\D/g, '');
    let finalNumber = '';

    if (cleaned.startsWith('84')) {
      finalNumber = `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      finalNumber = `+84${cleaned.substring(1)}`;
    } else if (cleaned.length > 0) {
      finalNumber = `+84${cleaned}`;
    }

    onChangeText?.(finalNumber);
  };

  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('84')) {
      return cleaned.length === 11; // +84 + 9자리
    }
    return false;
  };

  const isValidPhone = value ? validatePhoneNumber(value) : true;
  const validationError = !isValidPhone ? t('ui.input.phone.invalidFormat') : error;

  return (
    <StandardInput
      label={t('ui.input.phone.label')}
      placeholder={t('ui.input.phone.placeholder')}
      value={formattedValue}
      onChangeText={handleChangeText}
      error={validationError}
      disabled={disabled}
      variant={variant}
      size={size}
      keyboardType="phone-pad"
      icon="phone"
      maxLength={18} // +84 123 456 789 형태
      {...props}
    />
  );
};

export default PhoneInput;
