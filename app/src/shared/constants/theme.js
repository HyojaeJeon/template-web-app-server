/**
 * Local App 테마 상수
 * Local 현지화 색상 및 디자인 토큰
 */

// Local 테마 컬러 (CLAUDE.md 기준)
export const VIETNAM_COLORS = {
  // Primary Colors
  primary: '#2AC1BC',      // 민트 그린 (메인)
  secondary: '#00B14F',    // 그린 (보조)

  // Status Colors
  success: '#00B14F',      // 성공 (그린)
  warning: '#FFDD00',      // 경고 (골드)
  error: '#DA020E',        // 에러 (빨강)
  info: '#2AC1BC',         // 정보 (민트)

  // Neutral Colors
  black: '#000000',
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'},

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6'},

  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#374151',
    tertiary: '#6B7280',
    inverse: '#FFFFFF'},

  // Border Colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF'}};

// 그라데이션 색상
export const GRADIENTS = {
  primary: [VIETNAM_COLORS.primary, VIETNAM_COLORS.secondary],
  background: ['#F9FAFB', '#FFFFFF'],
  success: ['#00B14F', '#2AC1BC'],
  error: ['#DA020E', '#FF6B6B']};

// 음영 및 그림자
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2},
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4},
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8}};

// 폰트 크기
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36};

// 스페이싱
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64};

// 보더 반경
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999};

export default {
  VIETNAM_COLORS,
  GRADIENTS,
  SHADOWS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS};
