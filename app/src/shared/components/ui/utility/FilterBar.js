/**
 * FilterBar - 매장 목록 필터링 컴포넌트 v2.0
 * 혁신적인 글래스모피즘 디자인
 * 배달비, 평점, 영업시간 필터 기능
 */
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

// Providers
import { useTheme } from '@providers/ThemeProvider';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FilterBar = ({
  filters = {},
  onFiltersChange,
  visible = false,
  onClose,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isDarkMode, colors: theme } = useTheme();

  // 애니메이션 값
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const headerScaleAnim = useRef(new Animated.Value(0.95)).current;

  // 로컬 필터 상태
  const [tempFilters, setTempFilters] = useState(filters);

  // 모달 가시성 상태 (닫기 애니메이션을 위해 분리)
  const [modalVisible, setModalVisible] = useState(visible);

  // 모달 열기/닫기 애니메이션
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      setTempFilters(filters);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(headerScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalVisible) {
      // 닫기 애니메이션 실행 후 모달 숨기기
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible]);

  // 배달비 옵션
  const deliveryFeeOptions = useMemo(() => [
    { value: null, label: t('filter.deliveryFee.all'), icon: 'infinity' },
    { value: 0, label: t('filter.deliveryFee.free'), icon: 'gift-outline', highlight: true },
    { value: 15000, label: '15,000₫ 미만', icon: 'tag-outline' },
    { value: 25000, label: '25,000₫ 미만', icon: 'tag-outline' },
  ], [t]);

  // 평점 옵션
  const ratingOptions = useMemo(() => [
    { value: null, label: t('filter.rating.all'), stars: 0 },
    { value: 4.5, label: '4.5점 이상', stars: 4.5 },
    { value: 4.0, label: '4.0점 이상', stars: 4 },
    { value: 3.5, label: '3.5점 이상', stars: 3.5 },
  ], [t]);

  // 필터 업데이트
  const updateTempFilter = useCallback((key, value) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // 필터 적용
  const applyFilters = useCallback(() => {
    onFiltersChange(tempFilters);
    onClose();
  }, [tempFilters, onFiltersChange, onClose]);

  // 필터 초기화
  const resetFilters = useCallback(() => {
    const resetFiltersObj = {
      maxDeliveryFee: null,
      minRating: null,
      isOpen: false,
    };
    setTempFilters(resetFiltersObj);
  }, []);

  // 모달 닫기
  const handleClose = useCallback(() => {
    setTempFilters(filters);
    onClose();
  }, [filters, onClose]);

  // 활성 필터 개수
  const activeFiltersCount = useMemo(() => {
    return Object.values(tempFilters).filter(value =>
      value !== null && value !== false
    ).length;
  }, [tempFilters]);

  // 옵션 버튼 애니메이션 컴포넌트
  const FilterChip = ({ isSelected, onPress, children, highlight = false }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          {isSelected ? (
            <LinearGradient
              colors={highlight ? [theme.secondary, theme.secondaryDark || theme.secondary] : theme.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                marginRight: 8,
                marginBottom: 8,
                shadowColor: highlight ? '#00B14F' : theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              {children}
            </LinearGradient>
          ) : (
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                marginRight: 8,
                marginBottom: 8,
                backgroundColor: theme.bgSecondary,
                borderWidth: 1.5,
                borderColor: theme.border,
              }}
            >
              {children}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // 별점 렌더링
  const renderStars = (count, isSelected) => {
    const fullStars = Math.floor(count);
    const hasHalf = count % 1 !== 0;

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 4 }}>
        {[...Array(fullStars)].map((_, i) => (
          <MaterialCommunityIcons
            key={i}
            name="star"
            size={12}
            color={isSelected ? '#FFFFFF' : '#FFDD00'}
            style={{ marginRight: 1 }}
          />
        ))}
        {hasHalf && (
          <MaterialCommunityIcons
            name="star-half-full"
            size={12}
            color={isSelected ? '#FFFFFF' : '#FFDD00'}
          />
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* 배경 오버레이 */}
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: backdropAnim,
        }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      {/* 메인 모달 컨텐츠 */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: insets.bottom,
          left: 0,
          right: 0,
          maxHeight: SCREEN_HEIGHT * 0.85,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View
          style={{
            backgroundColor: isDarkMode
              ? 'rgba(30, 41, 59, 0.95)'
              : 'rgba(255,255,255,0.95)',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            overflow: 'hidden',
          }}
        >
          {/* iOS 블러 효과 */}
          {Platform.OS === 'ios' && (
            <BlurView
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              blurType={isDarkMode ? 'dark' : 'light'}
              blurAmount={25}
              reducedTransparencyFallbackColor={isDarkMode ? '#1E293B' : 'white'}
            />
          )}

          {/* 드래그 핸들 */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.divider,
              }}
            />
          </View>

          {/* 헤더 */}
          <Animated.View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingBottom: 16,
              transform: [{ scale: headerScaleAnim }],
            }}
          >
            <TouchableOpacity
              onPress={handleClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.bgSecondary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textPrimary }}>
                {t('filter.title')}
              </Text>
              {activeFiltersCount > 0 && (
                <View
                  style={{
                    backgroundColor: theme.primaryLight,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: theme.primary }}>
                    {activeFiltersCount}개 적용중
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={resetFilters}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.primary }}>
                {t('filter.reset')}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* 배달비 필터 섹션 */}
            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
              <View
                style={{
                  backgroundColor: theme.bgCard,
                  borderRadius: 20,
                  padding: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: theme.primaryLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <MaterialCommunityIcons name="truck-fast-outline" size={18} color={theme.primary} />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textPrimary }}>
                    {t('filter.deliveryFee.title')}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {deliveryFeeOptions.map((option) => {
                    const isSelected = tempFilters.maxDeliveryFee === option.value;
                    return (
                      <FilterChip
                        key={String(option.value)}
                        isSelected={isSelected}
                        onPress={() => updateTempFilter('maxDeliveryFee', option.value)}
                        highlight={option.highlight}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {option.icon && (
                            <MaterialCommunityIcons
                              name={option.icon}
                              size={14}
                              color={isSelected ? '#FFFFFF' : theme.textSecondary}
                              style={{ marginRight: 6 }}
                            />
                          )}
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '600',
                              color: isSelected ? '#FFFFFF' : theme.textPrimary,
                            }}
                          >
                            {option.label}
                          </Text>
                        </View>
                      </FilterChip>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* 평점 필터 섹션 */}
            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
              <View
                style={{
                  backgroundColor: theme.bgCard,
                  borderRadius: 20,
                  padding: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: '#FEF3C7',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <MaterialCommunityIcons name="star" size={18} color="#F59E0B" />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textPrimary }}>
                    {t('filter.rating.title')}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {ratingOptions.map((option) => {
                    const isSelected = tempFilters.minRating === option.value;
                    return (
                      <FilterChip
                        key={String(option.value)}
                        isSelected={isSelected}
                        onPress={() => updateTempFilter('minRating', option.value)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {option.stars > 0 && renderStars(option.stars, isSelected)}
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '600',
                              color: isSelected ? '#FFFFFF' : theme.textPrimary,
                            }}
                          >
                            {option.label}
                          </Text>
                        </View>
                      </FilterChip>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* 운영시간 필터 섹션 */}
            <View style={{ paddingHorizontal: 20 }}>
              <View
                style={{
                  backgroundColor: theme.bgCard,
                  borderRadius: 20,
                  padding: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: '#DCFCE7',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <MaterialCommunityIcons name="clock-outline" size={18} color="#22C55E" />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textPrimary }}>
                    {t('filter.hours.title')}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => updateTempFilter('isOpen', !tempFilters.isOpen)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: tempFilters.isOpen ? theme.primaryLight : theme.bgSecondary,
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: tempFilters.isOpen ? theme.primary : theme.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary }}>
                      {t('filter.hours.openNow')}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                      {t('filter.hours.openNowDesc')}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 52,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: tempFilters.isOpen ? theme.primary : theme.divider,
                      justifyContent: 'center',
                      padding: 2,
                    }}
                  >
                    <Animated.View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: '#FFFFFF',
                        alignSelf: tempFilters.isOpen ? 'flex-end' : 'flex-start',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* 하단 적용 버튼 */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 24,
              borderTopWidth: 1,
              borderTopColor: theme.divider,
              backgroundColor: isDarkMode
                ? 'rgba(30, 41, 59, 0.95)'
                : 'rgba(255,255,255,0.95)',
            }}
          >
            <TouchableOpacity
              onPress={applyFilters}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={theme.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                    {t('filter.apply')}
                  </Text>
                  {activeFiltersCount > 0 && (
                    <View
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 10,
                        marginLeft: 8,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                        {activeFiltersCount}
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

export default FilterBar;
