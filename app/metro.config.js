const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

// Apollo Client와 GraphQL 모듈을 지원하기 위한 설정
const config = mergeConfig(defaultConfig, {
  server: {
    // 환경변수로 포트 오버라이드 허용 (기본: 8081)
    port: Number(process.env.RCT_METRO_PORT || process.env.METRO_PORT || process.env.PORT || 8081),
    // 디버거 연결 타임아웃 설정 추가
    enhanceMiddleware: (middleware, server) => {
      return (req, res, next) => {
        // 디버거 연결 시 타임아웃 늘리기
        if (req.url?.includes('/debugger')) {
          req.setTimeout(0); // 무제한 타임아웃
          res.setTimeout(0);
        }
        return middleware(req, res, next);
      };
    },
  },
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs', 'mjs'], // .cjs, .mjs 확장자 추가
    resolverMainFields: ['react-native', 'browser', 'main'], // 모듈 해석 순서
    // react-native-maps Mock 매핑 및 alias 설정
    alias: {
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@navigation': path.resolve(__dirname, 'src/navigation'),
      '@providers': path.resolve(__dirname, 'src/providers'),
      '@gql': path.resolve(__dirname, 'src/gql'),
      '@graphql': path.resolve(__dirname, 'src/graphql'),
      '@config': path.resolve(__dirname, 'src/config'),
    },
    extraNodeModules: {
      'react-native-maps': path.resolve(__dirname, 'src/mocks/react-native-maps.js'),
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
});

// withNativeWind 래핑 (Android borderWidth 에러 해결 설정 포함)
module.exports = withNativeWind(config, {
  input: path.resolve(__dirname, 'global.css'),
  configPath: path.resolve(__dirname, 'tailwind.config.js'),
  // Android 타입 호환성 개선
  transformMode: 'buildTime',
  // 숫자 타입 강제 변환
  experimental: {
    numericTypes: true,
    strictBorderWidth: false, // borderWidth 타입 검증 완화
    typedCSSProps: true, // CSS 속성 타입 강제
  },
});
