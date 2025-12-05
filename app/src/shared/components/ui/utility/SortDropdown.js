/**
 * SortDropdown - 매장 목록 정렬 드롭다운 컴포넌트 v2.0
 * 혁신적인 글래스모피즘 중앙 모달 디자인
 * 거리순, 평점순, 배달시간순, 인기순, 최신순 정렬 기능
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

// Providers
import { useTheme } from '@providers/ThemeProvider';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SortDropdown = ({
  selectedSort = 'distance',
  displayOrder = 'ASC',
  onSortChange,
  visible = false,
  onClose,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isDarkMode, colors: theme } = useTheme();

  // 애니메이션 값
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef([...Array(6)].map(() => new Animated.Value(0))).current;

  // 정렬 옵션들
  const sortOptions = [
    {
      key: 'distance',
      label: t('sort.distance'),
      icon: 'map-marker-distance',
      description: t('sort.distanceDesc'),
      iconBg: '#FEF3C7',
      iconColor: '#F59E0B',
      allowOrderToggle: true,
    },
    {
      key: 'rating',
      label: t('sort.rating'),
      icon: 'star',
      description: t('sort.ratingDesc'),
      iconBg: theme.primaryLight,
      iconColor: theme.primary,
      allowOrderToggle: true,
    },
    {
      key: 'deliveryTime',
      label: t('sort.deliveryTime'),
      icon: 'clock-fast',
      description: t('sort.deliveryTimeDesc'),
      iconBg: '#DCFCE7',
      iconColor: '#22C55E',
      allowOrderToggle: true,
    },
    {
      key: 'popularity',
      label: t('sort.popularity'),
      icon: 'trending-up',
      description: t('sort.popularityDesc'),
      iconBg: '#FEE2E2',
      iconColor: '#EF4444',
      allowOrderToggle: false,
    },
    {
      key: 'newest',
      label: t('sort.newest'),
      icon: 'new-box',
      description: t('sort.newestDesc'),
      iconBg: '#E0E7FF',
      iconColor: '#6366F1',
      allowOrderToggle: false,
    },
    {
      key: 'alphabetical',
      label: t('sort.alphabetical'),
      icon: 'sort-alphabetical-ascending',
      description: t('sort.alphabeticalDesc'),
      iconBg: '#F3E8FF',
      iconColor: '#A855F7',
      allowOrderToggle: true,
    },
  ];

  // 모달 가시성 상태 (닫기 애니메이션을 위해 분리)
  const [modalVisible, setModalVisible] = useState(visible);

  // 애니메이션 효과
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      // 배경 및 모달 애니메이션
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // 아이템 순차 등장 애니메이션
      itemAnims.forEach((anim, index) => {
        Animated.spring(anim, {
          toValue: 1,
          tension: 100,
          friction: 12,
          delay: index * 40,
          useNativeDriver: true,
        }).start();
      });
    } else if (modalVisible) {
      // 닫기 애니메이션 실행 후 모달 숨기기
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
        // 아이템 애니메이션 리셋
        itemAnims.forEach(anim => anim.setValue(0));
      });
    }
  }, [visible]);

  // 정렬 선택 핸들러
  const handleSortSelect = useCallback((sortKey) => {
    if (!sortKey || typeof sortKey !== 'string') {
      console.warn('Invalid sort key:', sortKey);
      return;
    }

    if (sortKey === selectedSort) {
      const option = sortOptions.find(opt => opt.key === sortKey);
      if (option?.allowOrderToggle) {
        const newOrder = displayOrder === 'ASC' ? 'DESC' : 'ASC';
        onSortChange?.(sortKey, newOrder);
      }
    } else {
      const defaultOrder = sortKey === 'rating' || sortKey === 'popularity' || sortKey === 'newest'
        ? 'DESC'
        : 'ASC';
      onSortChange?.(sortKey, defaultOrder);
    }
    onClose?.();
  }, [selectedSort, displayOrder, onSortChange, onClose, sortOptions]);

  // 정렬 순서 표시 아이콘
  const getDisplayOrderIcon = useCallback((sortKey) => {
    if (sortKey !== selectedSort) return null;
    const option = sortOptions.find(opt => opt.key === sortKey);
    if (!option?.allowOrderToggle) return null;
    return displayOrder === 'ASC' ? 'arrow-up' : 'arrow-down';
  }, [selectedSort, displayOrder, sortOptions]);

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* 배경 오버레이 */}
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: backdropAnim,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* 메인 모달 컨텐츠 */}
        <Animated.View
          style={{
            width: SCREEN_WIDTH - 40,
            maxWidth: 380,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <View
            style={{
              backgroundColor: isDarkMode
                ? 'rgba(30, 41, 59, 0.95)'
                : 'rgba(255,255,255,0.95)',
              borderRadius: 24,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.25,
              shadowRadius: 30,
              elevation: 20,
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

            {/* 헤더 */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: theme.divider,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: theme.textPrimary }}>
                    {t('sort.title')}
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>
                    {t('sort.subtitle')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: theme.bgSecondary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 정렬 옵션들 */}
            <View style={{ paddingVertical: 8 }}>
              {sortOptions.map((option, index) => {
                const isSelected = option.key === selectedSort;
                const displayOrderIcon = getDisplayOrderIcon(option.key);

                return (
                  <Animated.View
                    key={option.key}
                    style={{
                      opacity: itemAnims[index],
                      transform: [
                        {
                          translateY: itemAnims[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => handleSortSelect(option.key)}
                      activeOpacity={0.7}
                      style={{
                        marginHorizontal: 12,
                        marginVertical: 4,
                        borderRadius: 16,
                        overflow: 'hidden',
                      }}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={[`${theme.primary}15`, `${theme.primary}08`]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            borderWidth: 1.5,
                            borderColor: theme.primary,
                            borderRadius: 16,
                          }}
                        >
                          {/* 아이콘 */}
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 14,
                              backgroundColor: option.iconBg,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 14,
                              shadowColor: option.iconColor,
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.2,
                              shadowRadius: 8,
                              elevation: 4,
                            }}
                          >
                            <MaterialCommunityIcons
                              name={option.icon}
                              size={22}
                              color={option.iconColor}
                            />
                          </View>

                          {/* 텍스트 정보 */}
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.primary }}>
                              {option.label}
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                              {option.description}
                            </Text>
                          </View>

                          {/* 선택 상태 표시 */}
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {displayOrderIcon && (
                              <View
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 8,
                                  backgroundColor: theme.primaryLight,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginRight: 8,
                                }}
                              >
                                <MaterialCommunityIcons
                                  name={displayOrderIcon}
                                  size={16}
                                  color={theme.primary}
                                />
                              </View>
                            )}
                            <View
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: theme.primary,
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: theme.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 6,
                                elevation: 4,
                              }}
                            >
                              <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                            </View>
                          </View>
                        </LinearGradient>
                      ) : (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            backgroundColor: theme.bgSecondary,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: theme.border,
                          }}
                        >
                          {/* 아이콘 */}
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 14,
                              backgroundColor: option.iconBg,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 14,
                            }}
                          >
                            <MaterialCommunityIcons
                              name={option.icon}
                              size={22}
                              color={option.iconColor}
                            />
                          </View>

                          {/* 텍스트 정보 */}
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary }}>
                              {option.label}
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                              {option.description}
                            </Text>
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>

            {/* 팁 섹션 */}
            <View
              style={{
                marginHorizontal: 12,
                marginTop: 8,
                marginBottom: 16,
                paddingHorizontal: 16,
                paddingVertical: 14,
                backgroundColor: theme.bgSecondary,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
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
                <MaterialCommunityIcons name="lightbulb-outline" size={18} color="#F59E0B" />
              </View>
              <Text style={{ flex: 1, fontSize: 12, color: theme.textSecondary, lineHeight: 18 }}>
                {t('sort.tip')}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default SortDropdown;
