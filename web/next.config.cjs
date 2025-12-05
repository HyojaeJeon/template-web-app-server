/** @type {import('next').NextConfig} */

const path = require('path');

const nextConfig = {
  // 성능 최적화 설정
  compress: true,
  poweredByHeader: false,
  
  // 개발 로그 최적화
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // React 18 기능 활성화
  reactStrictMode: true,
  swcMinify: true,
  
  // 이미지 최적화 설정
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [320, 420, 768, 1024, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: [
      'localhost',
      'delivery-vn.com',
      'res.cloudinary.com',
      'images.unsplash.com',
      'imagedelivery.net' // Cloudflare Images CDN
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // 웹팩 최적화
  webpack: (config, { dev, isServer, webpack }) => {
    // Node.js 모듈 fallback 설정 (클라이언트 사이드)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        fs: false,
        path: false,
        os: false,
        stream: false,
        util: false,
        worker_threads: false,
      };
    }

    // 별칭 설정
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      './src/shared': path.resolve(__dirname, 'src/shared'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@/graphql': path.resolve(__dirname, 'src/graphql'),
    }

    // 번들 분석 (개발 모드에서만)
    if (!dev && !isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.BUNDLE_ANALYZE': JSON.stringify(process.env.BUNDLE_ANALYZE),
        })
      )
    }

    // 성능 최적화를 위한 추가 설정
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          // 벤더 라이브러리 청킹
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          // 공통 컴포넌트 청킹
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
          // React 관련 청킹
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react-vendor',
            priority: 20,
            reuseExistingChunk: true,
          },
          // UI 라이브러리 청킹
          ui: {
            test: /[\\/]node_modules[\\/](@headlessui|@heroicons|lucide-react)[\\/]/,
            name: 'ui-vendor',
            priority: 15,
            reuseExistingChunk: true,
          },
          // 애니메이션 라이브러리 청킹
          animations: {
            test: /[\\/]node_modules[\\/](framer-motion|react-spring|react-transition-group)[\\/]/,
            name: 'animation-vendor',
            priority: 12,
            reuseExistingChunk: true,
          }
        }
      }
    }

    return config
  },

  // 실험적 기능 (Next.js 14.2.32 호환)
  experimental: {
    // 외부 패키지 설정
    serverComponentsExternalPackages: ['mongoose', 'pg', 'mysql2'],

    // 성능 최적화
    optimizeCss: true,
    scrollRestoration: true,

    // React Compiler 활성화
    reactCompiler: true,
  },

  // 환경별 설정
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
    BUNDLE_ANALYZE: process.env.BUNDLE_ANALYZE,
  },

  // 보안 헤더 - 개발 환경에서는 CSP 완전 비활성화
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/(.*)',
        headers: [
          ...(isDevelopment ? [] : [{
            key: 'X-Frame-Options',
            value: 'DENY'
          }]),
          ...(isDevelopment ? [] : [{
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }]),
          ...(isDevelopment ? [] : [{
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }]),
          ...(isDevelopment ? [] : [{
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }]),
          ...(isDevelopment ? [] : [{
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }]),
          ...(isDevelopment ? [] : [{
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' data: blob: https://api.delivery-vn.com wss://api.delivery-vn.com",
              "media-src 'self' data: blob: https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'"
            ].join('; ')
          }])
        ]
      }
    ]
  },

  // 리다이렉트
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },

  // 리라이트 비활성화 - Apollo Client 직접 연결 사용
  // async rewrites() {
  //   return {
  //     beforeFiles: [
  //       // API 프록시는 더 이상 사용하지 않음 - 직접 GraphQL 서버 연결
  //     ]
  //   }
  // },

  // Sass 설정
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },

  // TypeScript 설정 (만약 나중에 사용할 경우)
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint 설정
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['pages', 'components', 'lib', 'src']
  },

  // 성능 모니터링
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // 국제화 (i18n) 설정
  i18n: {
    locales: ['vi', 'en', 'ko'],
    defaultLocale: 'vi',
    localeDetection: false, // Next.js 14.2.32에서는 false로 설정
    domains: [
      {
        domain: 'delivery-vn.com',
        defaultLocale: 'vi',
      },
      {
        domain: 'ko.delivery-vn.com',
        defaultLocale: 'ko',
      },
    ],
  },

  // 트레일링 슬래시 설정
  trailingSlash: false,

  // 출력 설정 (정적 사이트 생성 시)
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,

  // 개발 서버 설정
  devIndicators: {
    buildActivity: true,
  },

  // 성능 예산 (경고 임계값)
  productionBrowserSourceMaps: false,
  
  // 커스텀 서버 설정
  ...(process.env.NODE_ENV === 'production' && {
    compress: true,
    generateBuildId: async () => {
      return process.env.BUILD_ID || 'build-' + Date.now()
    }
  })
}

// CommonJS에서는 동적 require 사용
let finalConfig = nextConfig;

// Bundle Analyzer 플러그인 (필요시)
if (process.env.ANALYZE === 'true') {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
  });
  finalConfig = withBundleAnalyzer(finalConfig);
}

// PWA 플러그인 (필요시)
if (process.env.ENABLE_PWA === 'true') {
  const withPWA = require('next-pwa')({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'https-calls',
          networkTimeoutSeconds: 15,
          expiration: {
            maxEntries: 150,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30일
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  });
  finalConfig = withPWA(finalConfig);
}

module.exports = finalConfig;