/**
 * touchUtils
 * 터치 영역 최적화 유틸리티
 *
 * 기능:
 * - WCAG 2.1 준수 터치 영역 크기 (최소 44x44pt)
 * - 동적 터치 영역 확장
 * - 터치 피드백 최적화
 * - 접근성 향상된 터치 인터렉션
 */

import { Platform, Dimensions } from 'react-native';

// 최소 터치 영역 크기 (WCAG 2.1 AA 기준)
const MIN_TOUCH_SIZE = 44;

// 권장 터치 영역 크기 (WCAG 2.1 AAA 기준)
const RECOMMENDED_TOUCH_SIZE = 48;

// 플랫폼별 조정값
const PLATFORM_ADJUSTMENTS = {
  ios: {
    padding: 0,
    borderRadius: 8},
  android: {
    padding: 2,
    borderRadius: 4}};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * 터치 영역 크기 계산
 * @param {number} contentWidth - 컨텐츠 실제 너비
 * @param {number} contentHeight - 컨텐츠 실제 높이
 * @param {string} level - 접근성 레벨 ('AA' | 'AAA')
 * @returns {object} 최적화된 터치 영역 스타일
 */
export const calculateTouchArea = (contentWidth, contentHeight, level = 'AA') => {
  const minSize = level === 'AAA' ? RECOMMENDED_TOUCH_SIZE : MIN_TOUCH_SIZE;
  const platform = Platform.OS;
  const adjustment = PLATFORM_ADJUSTMENTS[platform];

  // 터치 영역이 최소 크기보다 작으면 패딩으로 확장
  const horizontalPadding = Math.max(0, (minSize - contentWidth) / 2) + adjustment.padding;
  const verticalPadding = Math.max(0, (minSize - contentHeight) / 2) + adjustment.padding;

  return {
    minWidth: Math.max(contentWidth, minSize),
    minHeight: Math.max(contentHeight, minSize),
    paddingHorizontal: horizontalPadding,
    paddingVertical: verticalPadding,
    borderRadius: adjustment.borderRadius,

    // 히트슬롭으로 터치 영역 확장 (Android 권장)
    hitSlop: {
      top: verticalPadding,
      bottom: verticalPadding,
      left: horizontalPadding,
      right: horizontalPadding}};
};

/**
 * 버튼에 최적화된 터치 영역 스타일 생성
 * @param {string} size - 버튼 크기 ('small' | 'medium' | 'large')
 * @param {boolean} isIconOnly - 아이콘만 있는 버튼인지
 * @returns {object} 최적화된 버튼 스타일
 */
export const getOptimizedButtonStyle = (size = 'medium', isIconOnly = false) => {
  const sizeConfig = {
    small: {
      minSize: isIconOnly ? MIN_TOUCH_SIZE : 36,
      padding: isIconOnly ? 12 : 8,
      fontSize: 14},
    medium: {
      minSize: isIconOnly ? RECOMMENDED_TOUCH_SIZE : 40,
      padding: isIconOnly ? 14 : 12,
      fontSize: 16},
    large: {
      minSize: isIconOnly ? 52 : 48,
      padding: isIconOnly ? 16 : 16,
      fontSize: 18}};

  const config = sizeConfig[size];
  const platform = Platform.OS;

  return {
    minWidth: config.minSize,
    minHeight: config.minSize,
    paddingHorizontal: config.padding,
    paddingVertical: config.padding,
    borderRadius: platform === 'ios' ? 8 : 4,

    // 터치 피드백 최적화
    overflow: 'hidden', // 리플 효과를 위해

    // 접근성 향상
    importantForAccessibility: 'yes',
    accessible: true,

    // 히트슬롭
    hitSlop: isIconOnly ? {
      top: 8,
      bottom: 8,
      left: 8,
      right: 8} : undefined};
};

/**
 * 리스트 아이템에 최적화된 터치 영역
 * @param {number} itemHeight - 아이템 높이
 * @param {boolean} hasActions - 액션 버튼이 있는지
 * @returns {object} 최적화된 리스트 아이템 스타일
 */
export const getOptimizedListItemStyle = (itemHeight = 60, hasActions = false) => {
  const minHeight = Math.max(itemHeight, MIN_TOUCH_SIZE);

  return {
    minHeight,
    paddingVertical: Math.max(8, (minHeight - itemHeight) / 2),
    paddingHorizontal: 16,

    // 액션 버튼이 있는 경우 추가 여백
    paddingRight: hasActions ? 60 : 16,

    // 구분선과 간격
    marginBottom: 1,

    // 터치 피드백
    backgroundColor: 'transparent',

    // 접근성
    accessibilityRole: 'button',
    importantForAccessibility: 'yes'};
};

/**
 * 카드 컴포넌트 터치 영역 최적화
 * @param {number} cardWidth - 카드 너비
 * @param {number} cardHeight - 카드 높이
 * @param {boolean} isInteractive - 터치 가능한 카드인지
 * @returns {object} 최적화된 카드 스타일
 */
export const getOptimizedCardStyle = (cardWidth, cardHeight, isInteractive = true) => {
  if (!isInteractive) {
    return {
      width: cardWidth,
      height: cardHeight};
  }

  const minTouchHeight = Math.max(cardHeight, MIN_TOUCH_SIZE);
  const verticalPadding = Math.max(0, (minTouchHeight - cardHeight) / 2);

  return {
    width: cardWidth,
    minHeight: minTouchHeight,
    paddingVertical: verticalPadding,

    // 터치 피드백을 위한 오버플로우 설정
    overflow: 'hidden',
    borderRadius: 12,

    // 그림자/엘리베이션 (터치 가능함을 시각적으로 표현)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4},
      android: {
        elevation: 2}}),

    // 접근성
    accessibilityRole: 'button',
    accessible: true};
};

/**
 * 탭 바 아이템 터치 영역 최적화
 * @param {number} tabCount - 탭 개수
 * @param {boolean} hasIcons - 아이콘이 있는지
 * @returns {object} 최적화된 탭 스타일
 */
export const getOptimizedTabStyle = (tabCount, hasIcons = true) => {
  const tabWidth = screenWidth / tabCount;
  const minTabHeight = hasIcons ? 56 : MIN_TOUCH_SIZE;

  return {
    width: tabWidth,
    minHeight: minTabHeight,
    paddingVertical: hasIcons ? 8 : 12,
    paddingHorizontal: Math.max(8, tabWidth * 0.1),

    // 가운데 정렬
    alignItems: 'center',
    justifyContent: 'center',

    // 터치 피드백
    overflow: 'hidden',

    // 접근성
    accessibilityRole: 'tab',
    accessible: true};
};

/**
 * 검색바 터치 영역 최적화
 * @param {number} searchBarHeight - 검색바 높이
 * @returns {object} 최적화된 검색바 스타일
 */
export const getOptimizedSearchBarStyle = (searchBarHeight = 40) => {
  const minHeight = Math.max(searchBarHeight, MIN_TOUCH_SIZE);

  return {
    minHeight,
    paddingHorizontal: 16,
    paddingVertical: Math.max(8, (minHeight - searchBarHeight) / 2),
    borderRadius: 22, // 둥근 검색바

    // 터치 피드백
    overflow: 'hidden',

    // 접근성
    accessibilityRole: 'searchbox',
    accessible: true,
    accessibilityLabel: 'Search input'};
};

/**
 * 플로팅 액션 버튼 최적화
 * @param {string} size - 버튼 크기 ('normal' | 'mini')
 * @returns {object} 최적화된 FAB 스타일
 */
export const getOptimizedFABStyle = (size = 'normal') => {
  const sizeConfig = {
    normal: {
      width: 56,
      height: 56,
      borderRadius: 28},
    mini: {
      width: 40,
      height: 40,
      borderRadius: 20}};

  const config = sizeConfig[size];

  return {
    width: Math.max(config.width, MIN_TOUCH_SIZE),
    height: Math.max(config.height, MIN_TOUCH_SIZE),
    borderRadius: config.borderRadius,

    // 가운데 정렬
    alignItems: 'center',
    justifyContent: 'center',

    // 그림자/엘리베이션
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8},
      android: {
        elevation: 8}}),

    // 터치 피드백
    overflow: 'hidden',

    // 접근성
    accessibilityRole: 'button',
    accessible: true,

    // 히트슬롭 (터치 영역 확장)
    hitSlop: {
      top: 8,
      bottom: 8,
      left: 8,
      right: 8}};
};

/**
 * 터치 피드백 설정
 * @param {string} type - 피드백 타입 ('light' | 'medium' | 'heavy')
 * @returns {object} 터치 피드백 설정
 */
export const getTouchFeedbackConfig = (type = 'light') => {
  const feedbackConfig = {
    light: {
      activeOpacity: 0.7,
      underlayColor: 'rgba(0, 0, 0, 0.05)',
      android_ripple: {
        color: 'rgba(0, 0, 0, 0.1)',
        borderless: false,
        radius: 24}},
    medium: {
      activeOpacity: 0.6,
      underlayColor: 'rgba(0, 0, 0, 0.1)',
      android_ripple: {
        color: 'rgba(0, 0, 0, 0.15)',
        borderless: false,
        radius: 32}},
    heavy: {
      activeOpacity: 0.5,
      underlayColor: 'rgba(0, 0, 0, 0.15)',
      android_ripple: {
        color: 'rgba(0, 0, 0, 0.2)',
        borderless: false,
        radius: 40}}};

  return feedbackConfig[type] || feedbackConfig.light;
};

/**
 * 터치 영역 디버깅 (개발 모드에서만 사용)
 * @param {object} style - 현재 스타일
 * @returns {object} 디버깅용 스타일 (테두리 표시)
 */
export const addTouchAreaDebug = (style) => {
  if (__DEV__) {
    return {
      ...style,
      borderWidth: 1,
      borderColor: 'rgba(255, 0, 0, 0.3)',
      backgroundColor: 'rgba(255, 0, 0, 0.05)'};
  }
  return style;
};

/**
 * 터치 영역 접근성 검증
 * @param {number} width - 요소 너비
 * @param {number} height - 요소 높이
 * @returns {object} 검증 결과
 */
export const validateTouchAccessibility = (width, height) => {
  const isAACompliant = width >= MIN_TOUCH_SIZE && height >= MIN_TOUCH_SIZE;
  const isAAACompliant = width >= RECOMMENDED_TOUCH_SIZE && height >= RECOMMENDED_TOUCH_SIZE;

  return {
    isAACompliant,
    isAAACompliant,
    compliance: isAAACompliant ? 'AAA' : isAACompliant ? 'AA' : 'Failed',
    recommendations: {
      minWidth: Math.max(MIN_TOUCH_SIZE, width),
      minHeight: Math.max(MIN_TOUCH_SIZE, height),
      recommendedWidth: Math.max(RECOMMENDED_TOUCH_SIZE, width),
      recommendedHeight: Math.max(RECOMMENDED_TOUCH_SIZE, height)}};
};
