/**
 * SearchInput Component
 * 검색 기능을 위한 특화된 입력 컴포넌트
 */
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import StandardInput from '@shared/components/ui/inputs/StandardInput';
import StandardIcon from '@shared/components/ui/utility/StandardIcon';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@providers/ThemeProvider';

const SearchInput = ({
  value = '',
  onChangeText,
  onSearch,
  onClear,
  placeholder,
  disabled = false,
  variant = 'outlined',
  size = 'medium',
  autoFocus = false,
  debounceMs = 300,
  ...props
}) => {
  const { t } = useTranslation();
  const { isDarkMode, colors: theme } = useTheme();
  const [searchValue, setSearchValue] = useState(value);
  const [debounceTimer, setDebounceTimer] = useState(null);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const handleChangeText = (text) => {
    setSearchValue(text);

    // 디바운싱 처리
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      onChangeText?.(text);
      if (text.length > 0) {
        onSearch?.(text);
      }
    }, debounceMs);

    setDebounceTimer(timer);
  };

  const handleClear = () => {
    setSearchValue('');
    onChangeText?.('');
    onClear?.();

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  };

  const handleSubmit = () => {
    if (searchValue.trim()) {
      onSearch?.(searchValue.trim());
    }
  };

  return (
    <View style={{ position: 'relative' }}>
      <StandardInput
        placeholder={placeholder || t('ui.input.search.placeholder')}
        value={searchValue}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
        disabled={disabled}
        variant={variant}
        size={size}
        autoFocus={autoFocus}
        returnKeyType="search"
        style={{
          paddingLeft: 40,
          paddingRight: searchValue ? 40 : 16}}
        {...props}
      />

      {/* 검색 아이콘 */}
      <View style={{
        position: 'absolute',
        left: 12,
        top: '50%',
        transform: [{ translateY: -12 }],
        justifyContent: 'center',
        alignItems: 'center'}}>
        <StandardIcon
          name="search"
          type="material"
          size={20}
          color={disabled ? theme.textDisabled : theme.textSecondary}
        />
      </View>

      {/* 클리어 버튼 */}
      {searchValue && (
        <View style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: [{ translateY: -12 }],
          justifyContent: 'center',
          alignItems: 'center'}}>
          <StandardIcon
            name="clear"
            type="material"
            size={20}
            color={theme.textSecondary}
            onPress={handleClear}
            style={{ padding: 4 }}
          />
        </View>
      )}
    </View>
  );
};

export default SearchInput;
