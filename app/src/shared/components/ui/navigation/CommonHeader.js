/**
 * CommonHeader Component v1.1
 * 앱 전체에서 사용되는 공통 헤더 컴포넌트
 *
 * 제외 화면: HomeScreen, ProfileScreen(마이탭), StoreDetailScreen
 *
 * Features:
 * - 민트 그라데이션 배경 (라이트 모드)
 * - 다크모드 지원 (Night Market 테마)
 * - 좌/우 아이콘 커스터마이징 가능
 * - 하단 라운드 장식
 * - 애니메이션 효과
 */
import React, { memo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@providers/ThemeProvider';

/**
 * CommonHeader
 * @param {string} title - 헤더 제목
 * @param {boolean} showBack - 뒤로가기 버튼 표시 여부 (기본: true)
 * @param {Function} onBackPress - 뒤로가기 버튼 클릭 핸들러
 * @param {Object} navigation - React Navigation 객체
 * @param {Array} rightIcons - 우측 아이콘 배열 [{icon, onPress, iconType?, size?, color?}]
 * @param {Array} leftIcons - 좌측 아이콘 배열 (뒤로가기 대신 커스텀 아이콘 사용 시)
 * @param {boolean} showRoundedBottom - 하단 라운드 장식 표시 여부 (기본: true)
 * @param {string} backgroundColor - 배경색 (기본: gray-100)
 */
const CommonHeader = memo(({
  title = '',
  showBack = true,
  onBackPress = null,
  navigation = null,
  rightIcons = [],
  leftIcons = [],
  showRoundedBottom = true,
  backgroundColor = null, // null일 경우 테마에 따라 자동 설정
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  // 테마 설정 (앱 설정 기반)
  const { isDarkMode, colors: theme } = useTheme();

  // 테마에 따른 색상 설정
  const headerGradient = theme.gradientPrimary;

  const bgColor = backgroundColor || theme.bgPrimary;
  const iconBgColor = isDarkMode
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(255, 255, 255, 0.15)';
  const iconBorderColor = isDarkMode
    ? 'rgba(255, 255, 255, 0.2)'
    : 'rgba(255, 255, 255, 0.2)';
  // 그라데이션 배경 위에서 항상 흰색 아이콘 사용 (다크/라이트 모두)
  const iconColor = 'white';
  const textColor = 'white';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 뒤로가기 핸들러
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation?.canGoBack()) {
      navigation.goBack();
    }
  };

  // 아이콘 버튼 렌더링
  const renderIconButton = (iconConfig, index, position) => {
    const {
      icon,
      onPress,
      IconComponent = Icon,
      size = 18,
      color = iconColor,
      accessibilityLabel,
    } = iconConfig;

    return (
      <TouchableOpacity
        key={`${position}-icon-${index}`}
        onPress={onPress}
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 6,
          backgroundColor: iconBgColor,
          borderWidth: 1,
          borderColor: iconBorderColor,
        }}
        activeOpacity={0.7}
        accessibilityLabel={accessibilityLabel}
      >
        <IconComponent name={icon} size={size} color={color} />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'light-content'}
        backgroundColor={theme.primary}
      />
      <LinearGradient
        colors={headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* SafeArea 상단 영역 */}
        <View style={{ paddingTop: insets.top }} />

        {/* 헤더 컨텐츠 */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            paddingHorizontal: 12,
            paddingBottom: 10,
          }}
        >
          {/* 네비게이션 바 */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 4,
          }}>
            {/* 왼쪽 영역 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 32 }}>
              {leftIcons.length > 0 ? (
                // 커스텀 좌측 아이콘
                leftIcons.map((iconConfig, index) =>
                  renderIconButton(iconConfig, index, 'left')
                )
              ) : showBack ? (
                // 기본 뒤로가기 버튼
                <TouchableOpacity
                  onPress={handleBackPress}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: iconBgColor,
                    borderWidth: 1,
                    borderColor: iconBorderColor,
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel="뒤로가기"
                >
                  <Icon name="chevron-left" size={22} color={iconColor} />
                </TouchableOpacity>
              ) : (
                // 빈 공간 (좌측 아이콘 없을 때)
                <View style={{ width: 32, height: 32 }} />
              )}
            </View>

            {/* 중앙 영역 - 제목 */}
            <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 6 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: textColor,
                  letterSpacing: -0.3,
                }}
                numberOfLines={1}
              >
                {title}
              </Text>
            </View>

            {/* 오른쪽 영역 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 32 }}>
              {rightIcons.length > 0 ? (
                rightIcons.map((iconConfig, index) =>
                  renderIconButton(iconConfig, index, 'right')
                )
              ) : (
                // 빈 공간 (우측 아이콘 없을 때)
                <View style={{ width: 32, height: 32 }} />
              )}
            </View>
          </View>
        </Animated.View>

        {/* 하단 곡선 장식 */}
        {showRoundedBottom && (
          <View
            style={{
              height: 14,
              backgroundColor: bgColor,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              marginTop: -1,
            }}
          />
        )}
      </LinearGradient>
    </>
  );
});

CommonHeader.displayName = 'CommonHeader';

export default CommonHeader;
