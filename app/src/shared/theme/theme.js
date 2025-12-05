/**
 * Centralized Theme Configuration
 * Luminous Night Market Design System
 *
 * Usage:
 * import { useTheme } from '@providers/ThemeProvider';
 *
 * const { isDarkMode, colors: theme } = useTheme();
 */

// Light Theme - JADE LUXE Design System
export const lightTheme = {
  // Primary Colors
  primary: '#2AC1BC',
  primaryDark: '#1FA09B',
  primaryLight: 'rgba(42, 193, 188, 0.1)',
  secondary: '#00B14F',

  // JADE LUXE Accent Colors
  jade: '#2AC1BC',
  jadeDark: '#1FA09B',
  jadeLight: '#3DDBD6',
  jadeMuted: 'rgba(42, 193, 188, 0.15)',
  jadeGlow: 'rgba(42, 193, 188, 0.4)',
  gold: '#FBBF24',
  goldLight: '#FCD34D',
  coral: '#FF6B6B',
  ruby: '#EF4444',
  emerald: '#10B981',
  violet: '#8B5CF6',

  // Background Colors
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F9FAFB',
  bgTertiary: '#F3F4F6',
  bgCard: '#FFFFFF',
  bgInput: '#F9FAFB',
  bgOverlay: 'rgba(0, 0, 0, 0.5)',

  // Text Colors
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Border Colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderFocus: '#2AC1BC',

  // Status Colors
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.1)',
  error: '#DA020E',
  errorLight: 'rgba(218, 2, 14, 0.1)',
  warning: '#FFDD00',
  warningLight: 'rgba(255, 221, 0, 0.1)',
  info: '#3B82F6',

  // Rating & Accent
  star: '#FBBF24',
  gold: '#FFB800',

  // Glassmorphism (JADE LUXE)
  glass: 'rgba(255, 255, 255, 0.95)',
  glassDark: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(42, 193, 188, 0.2)',
  glassOverlay: 'rgba(42, 193, 188, 0.08)',

  // Shadow
  shadow: '#000000',
  shadowOpacity: 0.1,

  // Gradient Colors (for LinearGradient)
  gradientPrimary: ['#2AC1BC', '#1FA09B'],
  gradientSecondary: ['#00B14F', '#00A040'],
  gradientCard: ['#FFFFFF', '#F9FAFB'],
  gradientHeader: ['#2AC1BC', '#1FA09B'],

  // Specific Component Colors
  tabBar: {
    bg: '#FFFFFF',
    active: '#2AC1BC',
    inactive: '#9CA3AF',
  },
  header: {
    bg: '#2AC1BC',
    text: '#FFFFFF',
  },
  button: {
    primary: '#2AC1BC',
    primaryText: '#FFFFFF',
    secondary: '#F3F4F6',
    secondaryText: '#1F2937',
    disabled: '#E5E7EB',
    disabledText: '#9CA3AF',
  },
  input: {
    bg: '#F9FAFB',
    border: '#E5E7EB',
    text: '#1F2937',
    placeholder: '#9CA3AF',
    focusBorder: '#2AC1BC',
  },
  card: {
    bg: '#FFFFFF',
    border: '#E5E7EB',
    shadow: 'rgba(0, 0, 0, 0.08)',
  },
  badge: {
    bg: 'rgba(42, 193, 188, 0.1)',
    text: '#2AC1BC',
  },
  divider: '#E5E7EB',

  // Switch Component
  switchTrackOn: '#2AC1BC',
  switchTrackOff: '#E5E7EB',
  switchThumb: '#FFFFFF',

  // Skeleton Loading
  skeleton: '#E5E7EB',
};

// Dark Theme - JADE LUXE Design System
export const darkTheme = {
  // Primary Colors (Jade mint - consistent with light theme)
  primary: '#2AC1BC',
  primaryDark: '#1FA09B',
  primaryLight: 'rgba(42, 193, 188, 0.15)',
  secondary: '#FBBF24',

  // JADE LUXE Accent Colors
  jade: '#2AC1BC',
  jadeDark: '#1FA09B',
  jadeLight: '#3DDBD6',
  jadeMuted: 'rgba(42, 193, 188, 0.15)',
  jadeGlow: 'rgba(42, 193, 188, 0.4)',
  gold: '#FBBF24',
  goldLight: '#FCD34D',
  coral: '#FF6B6B',
  ruby: '#EF4444',
  emerald: '#10B981',
  violet: '#8B5CF6',

  // Background Colors (JADE LUXE dark palette)
  bgPrimary: '#111827',
  bgSecondary: '#1F2937',
  bgTertiary: '#374151',
  bgCard: '#1F2937',
  bgInput: 'rgba(255, 255, 255, 0.05)',
  bgOverlay: 'rgba(0, 0, 0, 0.7)',

  // Text Colors (JADE LUXE)
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textMuted: '#6B7280',
  textInverse: '#111827',

  // Border Colors
  border: 'rgba(42, 193, 188, 0.2)',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  borderFocus: '#2AC1BC',

  // Status Colors
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.15)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.15)',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.15)',
  info: '#3B82F6',

  // Rating & Accent
  star: '#FBBF24',
  goldAccent: '#FBBF24',

  // Glassmorphism (JADE LUXE)
  glass: 'rgba(31, 41, 55, 0.95)',
  glassDark: 'rgba(17, 24, 39, 0.85)',
  glassBorder: 'rgba(42, 193, 188, 0.2)',
  glassOverlay: 'rgba(42, 193, 188, 0.08)',

  // Shadow
  shadow: '#000000',
  shadowOpacity: 0.3,

  // Gradient Colors (for LinearGradient)
  gradientPrimary: ['#2AC1BC', '#1FA09B'],
  gradientSecondary: ['#FBBF24', '#F59E0B'],
  gradientCard: ['rgba(31, 41, 55, 0.95)', 'rgba(17, 24, 39, 0.9)'],
  gradientHeader: ['#2AC1BC', '#1FA09B'],

  // Specific Component Colors
  tabBar: {
    bg: '#111827',
    active: '#2AC1BC',
    inactive: '#6B7280',
  },
  header: {
    bg: '#2AC1BC',
    text: '#FFFFFF',
  },
  button: {
    primary: '#2AC1BC',
    primaryText: '#FFFFFF',
    secondary: 'rgba(42, 193, 188, 0.15)',
    secondaryText: '#F9FAFB',
    disabled: 'rgba(255, 255, 255, 0.05)',
    disabledText: '#6B7280',
  },
  input: {
    bg: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(42, 193, 188, 0.2)',
    text: '#F9FAFB',
    placeholder: '#6B7280',
    focusBorder: '#2AC1BC',
  },
  card: {
    bg: '#1F2937',
    border: 'rgba(42, 193, 188, 0.15)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  badge: {
    bg: 'rgba(42, 193, 188, 0.15)',
    text: '#2AC1BC',
  },
  divider: 'rgba(42, 193, 188, 0.1)',

  // Switch Component
  switchTrackOn: '#2AC1BC',
  switchTrackOff: 'rgba(255, 255, 255, 0.2)',
  switchThumb: '#111827',

  // Skeleton Loading
  skeleton: 'rgba(42, 193, 188, 0.15)',
};

// Helper function to get theme
export const getTheme = (isDarkMode) => isDarkMode ? darkTheme : lightTheme;

// Common spacing values
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Common border radius values
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

// Common font sizes
export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  title: 28,
  hero: 32,
};

export default {
  light: lightTheme,
  dark: darkTheme,
  getTheme,
  spacing,
  borderRadius,
  fontSize,
};
