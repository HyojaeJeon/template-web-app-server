/**
 * NativeWind v4 Configuration
 * Android borderWidth 타입 에러 해결을 위한 설정
 */

module.exports = {
  output: './nativewind-output.js',
  darkMode: 'class',
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Android 호환성을 위한 설정
  experimental: {
    // 숫자 값의 타입 강제 변환
    numericTypes: true,
  },
  // 스타일 변환 최적화
  transformMode: 'buildTime',
  // 타입 안전성 향상
  typeSafety: {
    // borderWidth 등 숫자 속성의 타입 체크 엄격화
    strictNumericTypes: true,
  },
};