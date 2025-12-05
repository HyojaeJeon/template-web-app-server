/**
 * SearchBar Component - 재사용 가능한 검색 바
 * CLAUDE.md 가이드라인 준수: SOLID 원칙, DRY, WCAG 2.1
 * Local 배달 앱 특화 검색 기능
 */
import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@providers/ThemeProvider';

/**
 * SearchBar Component
 *
 * Single Responsibility: 검색 입력 및 제안 표시만 담당
 * Open/Closed: 새로운 검색 기능이나 필터 추가 시 수정 없이 확장 가능
 */
const SearchBar = memo(({
  value = '',
  onChangeText = () => {},
  onSubmit = () => {},
  onFilter = () => {},
  onClear = () => {},
  onFocus = () => {},
  onBlur = () => {},
  placeholder = '',
  suggestions = [],
  popularTerms = [],
  recentSearches = [],
  showSuggestions = true,
  showFilter = true,
  showVoiceSearch = false,
  isLoading = false,
  hasActiveFilters = false,
  variant = 'default', // 'default', 'compact', 'minimal'
  className = '',
  autoFocus = false}) => {
  const { t } = useTranslation(['search', 'common']);
  const { isDarkMode, colors: theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);

  // 컴포넌트가 마운트될 때 autoFocus 처리
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [autoFocus]);

  // 포커스 핸들러
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowDropdown(true);
    onFocus();
  }, [onFocus]);

  // 블러 핸들러
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // 약간의 지연을 두어 제안 항목 클릭 시간 확보
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
    onBlur();
  }, [onBlur]);

  // 텍스트 변경 핸들러
  const handleChangeText = useCallback((text) => {
    onChangeText(text);
    setShowDropdown(text.length > 0 || (suggestions.length > 0 || popularTerms.length > 0 || recentSearches.length > 0));
  }, [onChangeText, suggestions, popularTerms, recentSearches]);

  // 검색 실행 핸들러
  const handleSubmit = useCallback(() => {
    if (value.trim()) {
      onSubmit(value.trim());
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  }, [value, onSubmit]);

  // 클리어 핸들러
  const handleClear = useCallback(() => {
    onClear();
    setShowDropdown(false);
    inputRef.current?.focus();
  }, [onClear]);

  // 제안 항목 선택 핸들러
  const handleSuggestionSelect = useCallback((suggestion) => {
    onChangeText(suggestion);
    onSubmit(suggestion);
    setShowDropdown(false);
    inputRef.current?.blur();
  }, [onChangeText, onSubmit]);

  // 음성 검색 핸들러
  const handleVoiceSearch = useCallback(() => {
    // 음성 검색 구현은 향후 추가
    console.log('Voice search triggered');
  }, []);

  // 검색 바 스타일 계산
  const getSearchBarStyles = useCallback(() => {
    const variantStyles = {
      default: 'px-4 py-3',
      compact: 'px-3 py-2',
      minimal: 'px-2 py-1'};

    return `rounded-xl flex-row items-center ${variantStyles[variant]}`;
  }, [variant]);

  // 검색 바 동적 스타일 (테마 지원)
  const searchBarDynamicStyle = {
    backgroundColor: theme.bgInput,
    borderWidth: isFocused ? 2 : 1,
    borderColor: isFocused ? theme.primary : hasActiveFilters ? theme.secondary : theme.border,
  };

  // 검색 바 그림자 스타일
  const searchBarShadowStyle = {
    shadowColor: isFocused ? theme.primary : theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isFocused ? 0.15 : theme.shadowOpacity,
    shadowRadius: isFocused ? 8 : 4,
    elevation: isFocused ? 6 : 2};

  // 제안 항목 렌더링
  const renderSuggestionItem = useCallback(({ item, index }) => {
    const isPopular = popularTerms.includes(item);
    const isRecent = recentSearches.includes(item);

    return (
      <TouchableOpacity
        className="flex-row items-center py-3 px-4"
        style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}
        onPress={() => handleSuggestionSelect(item)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`검색: ${item}`}
      >
        <MaterialIcons
          name={isRecent ? 'history' : isPopular ? 'trending-up' : 'search'}
          size={18}
          color={theme.textMuted}
        />
        <Text className="text-sm ml-3 flex-1" style={{ color: theme.textPrimary }}>
          {item}
        </Text>
        {isPopular && (
          <View className="rounded-full px-2 py-1" style={{ backgroundColor: isDarkMode ? 'rgba(251, 146, 60, 0.2)' : '#FFF7ED' }}>
            <Text className="text-xs font-medium" style={{ color: isDarkMode ? '#FB923C' : '#EA580C' }}>
              {t('search:popular')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [popularTerms, recentSearches, handleSuggestionSelect, t, theme, isDarkMode]);

  // 드롭다운 데이터 준비
  const dropdownData = [
    ...suggestions.map(s => ({ type: 'suggestion', text: s })),
    ...popularTerms.slice(0, 5).map(p => ({ type: 'popular', text: p })),
    ...recentSearches.slice(0, 3).map(r => ({ type: 'recent', text: r })),
  ].slice(0, 8);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={className}
    >
      {/* 검색 바 */}
      <View className={getSearchBarStyles()} style={[searchBarDynamicStyle, searchBarShadowStyle]}>
        {/* 검색 아이콘 */}
        <MaterialIcons name="search" size={20} color={theme.textMuted} />

        {/* 입력 필드 */}
        <TextInput
          ref={inputRef}
          className="flex-1 text-base ml-3 mr-2"
          style={{ color: theme.textPrimary }}
          placeholder={placeholder || t('search:placeholder')}
          placeholderTextColor={theme.textMuted}
          value={value}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSubmit}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          accessible={true}
          accessibilityLabel={t('search:inputLabel')}
          accessibilityHint={t('search:inputHint')}
        />

        {/* 로딩 인디케이터 */}
        {isLoading && (
          <MaterialIcons name="hourglass-empty" size={18} color={theme.textMuted} />
        )}

        {/* 클리어 버튼 */}
        {value.length > 0 && !isLoading && (
          <TouchableOpacity
            onPress={handleClear}
            className="p-1"
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('common:clear')}
          >
            <MaterialIcons name="clear" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}

        {/* 음성 검색 버튼 */}
        {showVoiceSearch && value.length === 0 && !isLoading && (
          <TouchableOpacity
            onPress={handleVoiceSearch}
            className="p-1 ml-2"
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('search:voiceSearch')}
          >
            <MaterialCommunityIcons name="microphone" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}

        {/* 필터 버튼 */}
        {showFilter && (
          <TouchableOpacity
            onPress={onFilter}
            className="p-1 ml-2"
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('search:filter')}
          >
            <MaterialCommunityIcons
              name={hasActiveFilters ? 'filter' : 'filter-outline'}
              size={18}
              color={hasActiveFilters ? theme.primary : theme.textMuted}
            />
            {hasActiveFilters && (
              <View className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary }} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 검색 제안 드롭다운 */}
      {showSuggestions && showDropdown && dropdownData.length > 0 && (
        <View className="rounded-xl mt-2 overflow-hidden"
              style={{
                backgroundColor: theme.bgCard,
                borderWidth: 1,
                borderColor: theme.border,
                shadowColor: theme.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: theme.shadowOpacity,
                shadowRadius: 8,
                elevation: 8}}>
          {/* 헤더 */}
          <View className="px-4 py-2" style={{ backgroundColor: theme.bgTertiary, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <Text className="text-xs font-medium" style={{ color: theme.textSecondary }}>
              {t('search:suggestions')}
            </Text>
          </View>

          {/* 제안 목록 */}
          <FlatList
            data={dropdownData.map(item => item.text)}
            renderItem={renderSuggestionItem}
            keyExtractor={(item, index) => `${item}-${index}`}
            style={{ maxHeight: 200 }}
            showsVerticalScrollIndicator={false}
          />

          {/* 푸터 */}
          {recentSearches.length > 0 && (
            <View className="px-4 py-2" style={{ backgroundColor: theme.bgTertiary, borderTopWidth: 1, borderTopColor: theme.border }}>
              <TouchableOpacity className="flex-row items-center justify-center">
                <MaterialIcons name="clear-all" size={16} color={theme.textMuted} />
                <Text className="text-xs ml-2" style={{ color: theme.textSecondary }}>
                  {t('search:clearHistory')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
});


export default SearchBar;
