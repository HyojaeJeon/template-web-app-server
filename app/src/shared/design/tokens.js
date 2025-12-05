/**
 * Design Tokens for Vietnamese Delivery App
 * Local App을 위한 디자인 토큰 시스템
 */

// 컬러 시스템 - Local App 브랜드 컬러
export const colors = {
  // Primary Colors
  mint: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#2AC1BC', // Main brand color
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63'},

  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#00B14F', // Secondary brand color
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'},

  // Vietnamese National Colors
  vn: {
    red: '#DA020E',      // Vietnam flag red
    yellow: '#FFDD00',    // Vietnam flag yellow
  },

  // Additional Color Palettes
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',  // Used in StoreInfoCard
    500: '#f59e0b',
    600: '#d97706',  // Used in StoreInfoCard
    700: '#b45309',
    800: '#92400e',
    900: '#78350f'},

  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',  // Used in StoreInfoCard
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'},

  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // Used in StoreInfoCard
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'},

  yellow: {
    50: '#fefce8',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12'},

  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Used in Badge, RealtimeOrderCard
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'},

  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',  // Used in StoreTag, DiscountBadge
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87'},

  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',  // Used in StoreTag, DiscountBadge
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12'},

  pink: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',  // Used in DiscountBadge
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843'},

  lime: {
    50: '#f7fee7',
    100: '#ecfccb',
    200: '#d9f99d',
    300: '#bef264',
    400: '#a3e635',
    500: '#84cc16',  // Used in StoreTag
    600: '#65a30d',
    700: '#4d7c0f',
    800: '#365314',
    900: '#1a2e05'},

  // Primary alias (points to mint for consistency)
  primary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#2AC1BC',  // Used in VirtualizedStoreList
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63'},

  // Semantic Colors
  warning: {
    500: '#F59E0B',
    600: '#D97706'},

  error: {
    500: '#EF4444',
    600: '#DC2626'},

  // Neutral Colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'},

  white: '#ffffff',
  black: '#000000'};

// 간격 시스템 (Spacing)
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,  // gap-3 표준
  4: 16,  // padding-4 표준
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80};

// 테두리 반지름 (Border Radius)
export const borderRadius = {
  none: 0,
  sm: 2,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,  // rounded-2xl 표준
  '3xl': 24,
  full: 9999};

// 그림자 시스템 (Shadows)
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1},
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3},
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8},
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 12}};

// 타이포그래피 시스템
export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30},

  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'}};

// 컴포넌트별 표준 스타일
export const componentStyles = {
  // 버튼 표준
  button: {
    height: 48,      // h-12 표준
    borderRadius: borderRadius.xl,
    primary: {
      backgroundColor: colors.mint[500],
      color: colors.white},
    secondary: {
      backgroundColor: colors.success[500],
      color: colors.white},
    disabled: {
      backgroundColor: colors.gray[200],
      color: colors.gray[400]}},

  // 카드 표준
  card: {
    padding: spacing[3],           // padding-3 (reduced padding)
    borderRadius: borderRadius.xl, // rounded-xl (smaller radius)
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[100],
    ...shadows.sm},

  // 토스트 표준
  toast: {
    height: 48,               // h-12
    padding: spacing[4],          // px-4
    borderRadius: borderRadius.lg, // rounded-lg
    success: {
      backgroundColor: colors.success[500],
      color: colors.white},
    warning: {
      backgroundColor: colors.warning[500],
      color: colors.white},
    error: {
      backgroundColor: colors.error[500],
      color: colors.white},
    info: {
      backgroundColor: colors.mint[500],
      color: colors.white}},

  // 입력창 표준
  input: {
    height: 48,               // h-12
    padding: spacing[4],          // px-4
    borderRadius: borderRadius.xl, // rounded-xl
    borderWidth: 1,
    borderColor: colors.gray[100],
    backgroundColor: colors.white,
    placeholderColor: colors.gray[400],
    ...shadows.sm},

  // 체크박스 표준
  checkbox: {
    size: 20,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray[300],
    checkedBorderColor: colors.mint[500],
    checkedBackgroundColor: colors.mint[500]},

  // 선택된 상태 표준
  selected: {
    borderWidth: 2,
    borderColor: colors.mint[500],
    backgroundColor: colors.mint[50]}};

// 그라데이션 프리셋
export const gradients = {
  mint: ['#2AC1BC', '#1F9B96'],
  success: ['#00B14F', '#15803d'],
  vnFlag: ['#DA020E', '#FFDD00'],
  sunset: ['#F59E0B', '#D97706']};
