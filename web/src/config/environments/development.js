/**
 * 개발 환경 설정
 * 개발자 친화적인 설정과 디버깅 도구 활성화
 */

export default {
  // API 설정 - 환경별 URL 사용
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL_DEV || 'http://localhost:6000/graphql',
    graphql: {
      endpoint: process.env.NEXT_PUBLIC_API_URL_DEV || 'http://localhost:6000/graphql',
      wsEndpoint: process.env.NEXT_PUBLIC_WS_URL_DEV || 'ws://localhost:6000/graphql',
    },
    pos: {
      endpoint: 'http://localhost:6000/api/pos',
      syncInterval: 30000,
      timeout: 10000,
      retryAttempts: 3,
    },
    socket: {
      endpoint: process.env.NEXT_PUBLIC_WS_URL_DEV?.replace('ws://', 'http://').replace('wss://', 'https://') || 'http://localhost:6000',
      timeout: 5000,
      reconnectAttempts: 5,
      reconnectDelay: 1000,
    },
    timeout: 15000,
    retryAttempts: 5,
    retryDelay: 1000,
  },

  // 데이터베이스 설정
  database: {
    pool: {
      min: 2,
      max: 10,
      idle: 30000,
    },
  },

  // 캐시 설정 (개발 환경 - 짧은 TTL)
  cache: {
    ttl: 60 * 1000, // 1분
    maxSize: 100,
    enabled: true,
  },

  // 로깅 설정
  logging: {
    level: 'debug',
    enableConsole: true,
    enableFile: false,
    enableRemote: false,
    format: 'pretty',
  },

  // 보안 설정 (개발 환경 완화)
  security: {
    enableCSP: false,
    enableCORS: true,
    corsOrigins: ['http://localhost:5001', 'http://localhost:6000'],
    sessionTimeout: 7200000, // 2시간
    cookieSecure: false,
    cookieSameSite: 'lax',
    cookieHttpOnly: true,
  },

  // 성능 모니터링
  monitoring: {
    enabled: false,
    sampleRate: 0.1,
    enableProfiler: true,
    enableDebugger: true,
  },

  // 개발 도구
  devTools: {
    enabled: true,
    reactDevTools: true,
    reduxDevTools: true,
    showDebugInfo: true,
    enableHotReload: true,
    enableErrorOverlay: true,
  },

  // 기능 플래그
  features: {
    // 개발 중인 기능들
    newDashboard: true,
    advancedAnalytics: true,
    betaFeatures: true,
    
    // Local 특화 기능
    vietnamPayments: true,
    vietnamDelivery: true,
    vietnamLocalization: true,
    
    // 개발 도구
    performanceProfiler: true,
    componentInspector: true,
    stateInspector: true,
    networkInspector: true,
  },

  // Local 결제 시스템 (테스트 환경)
  payments: {
    momo: {
      enabled: true,
      partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO_TEST_PARTNER',
      endpoint: 'https://test-payment.momo.vn',
      timeout: 30000,
      testMode: true,
    },
    vnpay: {
      enabled: true,
      tmnCode: process.env.VNPAY_TMN_CODE || 'TEST_TMN_CODE',
      endpoint: 'https://sandbox.vnpayment.vn',
      timeout: 30000,
      testMode: true,
    },
    zalopay: {
      enabled: true,
      appId: process.env.ZALOPAY_APP_ID || '553',
      endpoint: 'https://sb-openapi.zalopay.vn',
      timeout: 30000,
      testMode: true,
    },
    cod: {
      enabled: true,
      maxAmount: 10000000, // 10M VND
    },
  },

  // 지도 및 위치 서비스
  maps: {
    google: {
      enabled: true,
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      libraries: ['places', 'geometry'],
      language: 'vi',
      region: 'VN',
    },
    mapbox: {
      enabled: true,
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
      style: 'mapbox://styles/mapbox/streets-v11',
    },
  },

  // 파일 업로드
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
    uploadDir: './uploads',
    enableImageOptimization: true,
    imageQuality: 90,
  },

  // 이메일 설정 (개발 환경 - 메일캐처 사용)
  email: {
    enabled: false,
    provider: 'smtp',
    smtp: {
      host: 'localhost',
      port: 1025,
      secure: false,
      auth: {
        user: '',
        pass: '',
      },
    },
    from: 'Vietnam Delivery <noreply@vietnam-delivery.local>',
    templates: {
      path: './src/templates/email',
      engine: 'handlebars',
    },
  },

  // 알림 설정
  notifications: {
    enabled: true,
    firebase: {
      enabled: false, // 개발 환경에서는 비활성화
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    },
    socket: {
      enabled: true,
      namespace: '/notifications',
    },
    email: {
      enabled: false,
    },
  },

  // 테스트 설정
  testing: {
    enableSeedData: true,
    enableMockData: true,
    enableTestAPI: true,
    mockLocation: {
      lat: 10.8231,
      lng: 106.6297,
    },
  },

  // 개발 환경 특화 설정
  development: {
    // 더미 데이터
    useDummyData: true,
    dummyOrderCount: 50,
    dummyCustomerCount: 100,
    
    // 개발 서버 설정
    hotReload: true,
    fastRefresh: true,
    
    // 개발자 도구
    showPerformanceMetrics: true,
    showReduxLogger: true,
    showApiLogger: true,
    
    // Local 현지화 테스트
    forceVietnamLocale: false,
    enableLanguageSwitcher: true,
    
    // POS 시뮬레이션
    simulatePOSErrors: true,
    simulateNetworkLatency: false,
    networkLatencyMs: 0,
  },

  // 성능 설정
  performance: {
    enableCodeSplitting: true,
    enableLazyLoading: true,
    enableMemoization: true,
    bundleAnalyzer: false,
    
    // 이미지 최적화
    imageOptimization: true,
    imageFormats: ['webp', 'avif', 'jpeg'],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // 캐싱
    enableServiceWorker: false,
    enableAPICache: true,
    enableStaticCache: false,
  },

  // 에러 처리
  errorHandling: {
    enableErrorBoundary: true,
    enableErrorReporting: false,
    showErrorDetails: true,
    enableRetry: true,
    maxRetryAttempts: 3,
  },
};