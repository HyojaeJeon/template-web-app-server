/**
 * Local App MVP - 디자인 시스템 토큰
 * 현대적이고 세련된 UI를 위한 디자인 토큰 정의
 */

// Local 테마 컬러 팔레트
export const colors = {
  // Primary Colors (민트 계열)
  primary: {
    50: '#f0fdfc',
    100: '#ccfbf1', 
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#2AC1BC', // 메인 민트 컬러
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },
  
  // Secondary Colors (그린 계열)
  secondary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#00B14F', // 메인 그린 컬러
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Neutral Colors (그레이스케일)
  neutral: {
    0: '#ffffff',
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  
  // Status Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Vietnam Specific
  vietnam: {
    gold: '#FFDD00',
    red: '#DA020E',
    mint: '#2AC1BC',
    green: '#00B14F',
  }
};

// 타이포그래피 시스템
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  }
};

// 스페이싱 시스템
export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
};

// 보더 반지름
export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

// 그림자 시스템 (현대적이고 세련됨)
export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '2xl': '0 50px 100px -20px rgb(0 0 0 / 0.25)',
  none: '0 0 #0000',
  
  // 컬러드 섀도우 (Local 테마)
  mint: '0 8px 25px -8px rgb(42 193 188 / 0.3)',
  green: '0 8px 25px -8px rgb(0 177 79 / 0.3)',
  inset: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
};

// 애니메이션 및 트랜지션
export const animation = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms',
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  spring: {
    gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    snappy: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  }
};

// Z-index 레이어 시스템
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// 공통 스타일 유틸리티
export const commonStyles = {
  // Focus Ring (접근성)
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  
  // 버튼 기본 스타일 (hover scale 효과 제거)
  buttonBase: 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  
  // 입력 필드 기본 스타일
  inputBase: 'block w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200',
  
  // 카드 기본 스타일
  cardBase: 'bg-white rounded-xl border border-neutral-200 p-6 transition-shadow duration-200',
  
  // 모달 백드롭
  modalBackdrop: 'fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
  
  // 드롭다운 기본 스타일
  dropdownBase: 'absolute z-dropdown mt-2 w-full max-h-60 overflow-auto rounded-lg bg-white border border-neutral-200 shadow-lg py-1 focus:outline-none',
};

// 반응형 브레이크포인트
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// 컴포넌트별 기본 변형
export const variants = {
  button: {
    primary: `${commonStyles.buttonBase} bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-sm hover:shadow-md`,
    secondary: `${commonStyles.buttonBase} bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500 border border-neutral-300`,
    ghost: `${commonStyles.buttonBase} text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:ring-neutral-500`,
    danger: `${commonStyles.buttonBase} bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-sm hover:shadow-md`,
  },
  
  input: {
    default: `${commonStyles.inputBase}`,
    error: `${commonStyles.inputBase} border-red-300 focus:ring-red-500 focus:border-red-500`,
    success: `${commonStyles.inputBase} border-green-300 focus:ring-green-500 focus:border-green-500`,
  },
  
  card: {
    default: `${commonStyles.cardBase} shadow-sm hover:shadow-md`,
    elevated: `${commonStyles.cardBase} shadow-md hover:shadow-lg`,
    interactive: `${commonStyles.cardBase} shadow-sm hover:shadow-md cursor-pointer`,
  }
};

// 모바일 최적화 토큰
export const MOBILE_COMPONENT_VARIANTS = {
  button: {
    touchTarget: 'min-h-[44px] min-w-[44px]', // iOS/Android 최소 터치 타겟
    dense: 'min-h-[36px]',
  },
  input: {
    touchTarget: 'min-h-[44px]',
    fontSize: 'text-base', // iOS zoom 방지를 위한 16px 이상
    compact: {
      xs: 'h-8 px-2.5 py-1.5 text-xs',
      sm: 'h-9 px-3 py-2 text-sm',
      md: 'h-10 px-3.5 py-2 text-base',
      lg: 'h-11 px-4 py-2.5 text-base',
    },
    default: {
      sm: 'h-10 px-3.5 py-2.5 text-sm',
      md: 'h-11 px-4 py-2.5 text-base',
      lg: 'h-12 px-4 py-3 text-base',
    }
  },
  card: {
    compact: 'p-3',
    comfortable: 'p-4',
    spacious: 'p-6',
  }
};

export const MOBILE_ANIMATIONS = {
  normal: 'transition-all duration-200 ease-out',
  fast: 'transition-all duration-150 ease-out',
  slow: 'transition-all duration-300 ease-out',
  touch: '', // 터치 피드백 제거 (클릭 시 축소 애니메이션 없음)
  bounce: 'transition-all duration-200 ease-bounce',
};

export const MOBILE_HEIGHTS = {
  touchTarget: '44px', // 최소 터치 타겟
  button: {
    sm: '36px',
    md: '44px',
    lg: '52px',
  },
  input: {
    sm: '40px',
    md: '44px',
    lg: '52px',
  }
};

export const MOBILE_TYPOGRAPHY = {
  heading: {
    h1: 'text-2xl font-bold leading-tight',
    h2: 'text-xl font-semibold leading-tight',
    h3: 'text-lg font-semibold leading-snug',
    h4: 'text-base font-semibold leading-snug',
  },
  body: {
    large: 'text-base leading-relaxed',
    regular: 'text-sm leading-relaxed',
    small: 'text-xs leading-relaxed',
  },
  button: {
    large: 'text-base font-semibold',
    regular: 'text-sm font-medium',
    small: 'text-xs font-medium',
  }
};

export const MOBILE_SPACING = {
  xs: 'space-y-1',
  sm: 'space-y-2',
  md: 'space-y-3',
  lg: 'space-y-4',
  xl: 'space-y-6',
};

export const MOBILE_DENSITY_RULES = {
  compact: {
    padding: 'p-2',
    gap: 'gap-2',
    spacing: 'space-y-2',
  },
  comfortable: {
    padding: 'p-4',
    gap: 'gap-3',
    spacing: 'space-y-3',
  },
  spacious: {
    padding: 'p-6',
    gap: 'gap-4',
    spacing: 'space-y-4',
  }
};

export const MOBILE_COLOR_CONTRAST = {
  text: {
    primary: 'text-neutral-900 dark:text-neutral-50',
    secondary: 'text-neutral-600 dark:text-neutral-400',
    tertiary: 'text-neutral-500 dark:text-neutral-500',
    disabled: 'text-neutral-400 dark:text-neutral-600',
  },
  background: {
    primary: 'bg-white dark:bg-neutral-900',
    secondary: 'bg-neutral-50 dark:bg-neutral-800',
    tertiary: 'bg-neutral-100 dark:bg-neutral-700',
  },
  border: {
    default: 'border-neutral-300 dark:border-neutral-600',
    strong: 'border-neutral-400 dark:border-neutral-500',
    subtle: 'border-neutral-200 dark:border-neutral-700',
  }
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  zIndex,
  commonStyles,
  breakpoints,
  variants,
  // 모바일 최적화 토큰 추가
  MOBILE_COMPONENT_VARIANTS,
  MOBILE_ANIMATIONS,
  MOBILE_HEIGHTS,
  MOBILE_TYPOGRAPHY,
  MOBILE_SPACING,
  MOBILE_DENSITY_RULES,
  MOBILE_COLOR_CONTRAST,
};