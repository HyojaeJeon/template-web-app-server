module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class', // 다크모드 클래스 기반 활성화
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        // Brand color system
        primary: {
          50: '#E8FAF9',
          100: '#C3F0EE',
          200: '#8FE1DD',
          300: '#5ED4D0',
          400: '#3EC8C3',
          500: '#2AC1BC', // Main brand color (mint)
          600: '#25ADA8',
          700: '#209994',
          800: '#1B7F7A',
          900: '#073F3D',
        },
        secondary: {
          50: '#E8F8F0',
          100: '#C3EBDB',
          200: '#8FD7B7',
          300: '#5BC392',
          400: '#27AF6D',
          500: '#00B14F', // 세컨더리 컬러 (그린)
          600: '#009E47',
          700: '#008A3F',
          800: '#007537',
          900: '#002910',
        },
        // Local 테마 전용 컬러
        'vn-mint': '#2AC1BC',
        'vn-green': '#00B14F',
        'vn-red': '#DA020E',
        'vn-gold': '#FFDD00',

        // UI 상태 색상
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        info: '#2AC1BC',

        // Night Market 테마 (다크모드 기반)
        'night': {
          50: '#1A1714',
          100: '#252220',
          200: '#2F2B28',
          300: '#3D3835',
          400: '#524C47',
          500: '#6B635C',
          600: '#857C74',
          700: '#A19891',
          800: '#BCB5AE',
          900: '#D9D4CF',
        },
        'amber': {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        'warm': {
          glow: '#FFB800',
          soft: '#FFF8E7',
          cream: '#FFFBF5',
        },

        // 그레이 스케일
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
          900: '#111827',
        },

        // ===== 테마 시맨틱 색상 (다크/라이트 모드 지원) =====
        // 배경색
        'theme-bg': {
          primary: 'var(--theme-bg-primary)',
          secondary: 'var(--theme-bg-secondary)',
          tertiary: 'var(--theme-bg-tertiary)',
          card: 'var(--theme-bg-card)',
        },
        // 텍스트 색상
        'theme-text': {
          primary: 'var(--theme-text-primary)',
          secondary: 'var(--theme-text-secondary)',
          muted: 'var(--theme-text-muted)',
        },
        // 테두리 색상
        'theme-border': {
          DEFAULT: 'var(--theme-border)',
          light: 'var(--theme-border-light)',
        },
      },
      fontFamily: {
        regular: ['System', 'Roboto', 'sans-serif'],
        medium: ['System', 'Roboto-Medium', 'sans-serif'],
        semibold: ['System', 'Roboto-Bold', 'sans-serif'],
        bold: ['System', 'Roboto-Bold', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
      },
      spacing: {
        // 터치 타깃 크기
        'touch': '44px',
        'touch-large': '48px',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};