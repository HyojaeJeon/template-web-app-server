/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx,mdx}',
    './components/**/*.{js,jsx,ts,tsx,mdx}',
    './app/**/*.{js,jsx,ts,tsx,mdx}',
    './src/**/*.{js,jsx,ts,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Local 테마 컬러 - 브랜드 전용 네이밍
        'vietnam-mint': {
          DEFAULT: '#2AC1BC', // 메인 민트
          light: '#5ED4D0',
          dark: '#1F9D98',
          pale: '#E8FAF9',
          shadow: 'rgba(42, 193, 188, 0.15)',
        },
        'vietnam-green': {
          DEFAULT: '#00B14F', // 그린
          light: '#00D25B',
          dark: '#007A36',
          pale: '#E8F8F0',
          shadow: 'rgba(0, 177, 79, 0.15)',
        },
        'vietnam-error': {
          DEFAULT: '#DA020E', // 에러 빨강
          light: '#FF3333',
          dark: '#B30109',
        },
        'vietnam-warning': {
          DEFAULT: '#FFDD00', // 경고 골드
          light: '#FFE633',
          dark: '#CCAF00',
        },
        // 기존 컬러 유지 + 개선된 mint 컬러
        mint: {
          50: '#E8F9F8',
          100: '#C6F0EE',
          200: '#8DE1DC',
          300: '#54D2CA',
          400: '#2AC1BC',
          500: '#2AC1BC',
          600: '#229A96',
          700: '#1A7471',
          800: '#134E4C',
          900: '#0B2827',
          DEFAULT: '#2AC1BC', // 민트
          light: '#4DD8D3',
          dark: '#1FA09C',
        },
        primary: {
          DEFAULT: '#2AC1BC', // 민트
          light: '#4DD8D3',
          dark: '#1FA09C',
          50: '#E8F9F8',
          100: '#C6F0EE',
          200: '#8DE1DC',
          300: '#54D2CA',
          400: '#2AC1BC',
          500: '#2AC1BC',
          600: '#229A96',
          700: '#1A7471',
          800: '#134E4C',
          900: '#0B2827',
        },
        green: {
          50: '#E6F7ED',
          100: '#C0EBD2',
          200: '#80D7A5',
          300: '#40C378',
          400: '#00B14F',
          500: '#00B14F',
          600: '#008D3F',
          700: '#006A2F',
          800: '#00461F',
          900: '#002310',
          DEFAULT: '#00B14F', // 그린
          light: '#33C470',
          dark: '#008A3D',
        },
        secondary: {
          DEFAULT: '#00B14F', // 그린
          light: '#33C470',
          dark: '#008A3D',
          50: '#E6F7ED',
          100: '#C0EBD2',
          200: '#80D7A5',
          300: '#40C378',
          400: '#00B14F',
          500: '#00B14F',
          600: '#008D3F',
          700: '#006A2F',
          800: '#00461F',
          900: '#002310',
        },
        error: {
          DEFAULT: '#DA020E',
          light: '#FF3333',
          dark: '#B30109',
        },
        warning: {
          DEFAULT: '#FFDD00',
          light: '#FFE633',
          dark: '#CCAF00',
        },
        success: {
          DEFAULT: '#00B14F',
          light: '#33C470',
          dark: '#008A3D',
        },
        info: {
          DEFAULT: '#2AC1BC',
          light: '#4DD8D3',
          dark: '#1FA09C',
        },
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
      },
      fontFamily: {
        sans: [
          'Poppins', 
          'Inter', 
          'system-ui', 
          '-apple-system', 
          'BlinkMacSystemFont', 
          '"Segoe UI"', 
          'sans-serif'
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '120': '30rem',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-up-fade': 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-out-right': 'slideOutRight 0.3s ease-in',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideUpFade: {
          '0%': {
            opacity: '0',
            transform: 'translateY(1rem)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        slideOutRight: {
          '0%': {
            opacity: '1',
            transform: 'translateX(0)'
          },
          '100%': {
            opacity: '0',
            transform: 'translateX(2rem)'
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { opacity: '0.5' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      backgroundImage: {
        // Local 테마 그라데이션
        'vietnam-mint-gradient': 'linear-gradient(135deg, #2AC1BC 0%, #3EC8C3 100%)',
        'vietnam-mint-soft': 'linear-gradient(180deg, #2AC1BC 0%, rgba(42, 193, 188, 0.9) 100%)',
        'vietnam-green-gradient': 'linear-gradient(135deg, #00B14F 0%, #00C458 100%)',
        'vietnam-premium': 'linear-gradient(135deg, #2AC1BC 0%, #00B14F 70%, #00C458 100%)',
        'vietnam-premium-soft': 'linear-gradient(135deg, rgba(42, 193, 188, 0.8) 0%, rgba(0, 177, 79, 0.8) 100%)',
        // 배경 그라데이션
        'vietnam-bg': 'linear-gradient(180deg, #ffffff 0%, #f8fffe 50%, #e8faf9 100%)',
        'vietnam-bg-dark': 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 50%, #242424 100%)',
        // 3D 렌더링 그라데이션
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'glass-gradient-dark': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(0,0,0,0.08)',
        'medium': '0 4px 20px rgba(0,0,0,0.12)',
        'hard': '0 10px 40px rgba(0,0,0,0.15)',
        'inner-soft': 'inset 0 2px 4px rgba(0,0,0,0.06)',
        // Local 테마 그림자
        'vietnam-mint': '0 4px 12px rgba(42, 193, 188, 0.15)',
        'vietnam-mint-lg': '0 8px 24px rgba(42, 193, 188, 0.2)',
        'vietnam-green': '0 4px 12px rgba(0, 177, 79, 0.15)',
        'vietnam-green-lg': '0 8px 24px rgba(0, 177, 79, 0.2)',
        // 다크 모드 그림자
        'dark-soft': '0 2px 15px rgba(0,0,0,0.3)',
        'dark-medium': '0 4px 20px rgba(0,0,0,0.4)',
        'dark-hard': '0 10px 40px rgba(0,0,0,0.5)',
        // 3D 렌더링 그림자
        '3xl': '0 25px 50px rgba(0, 0, 0, 0.15)',
        '4xl': '0 35px 60px rgba(0, 0, 0, 0.20)',
        'inner-glow': 'inset 0 0 10px rgba(255,255,255,0.2)',
        'glow-mint': '0 0 20px rgba(42, 193, 188, 0.5)',
        'glow-green': '0 0 20px rgba(0, 177, 79, 0.5)',
        'glow-mint-lg': '0 0 40px rgba(42, 193, 188, 0.6)',
        'glow-green-lg': '0 0 40px rgba(0, 177, 79, 0.6)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
        'tooltip': '9999',
        'modal': '10000',
        'max': '99999',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}