/**
 * 스테이징 환경 설정
 * 프로덕션과 유사하지만 테스트를 위한 완화된 설정
 */

export default {
  // API 설정
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://staging-api.vietnam-delivery.com',
    graphql: {
      endpoint: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'https://staging-api.vietnam-delivery.com/graphql',
      wsEndpoint: process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT || 'wss://staging-api.vietnam-delivery.com/graphql',
    },
    pos: {
      endpoint: process.env.NEXT_PUBLIC_POS_API_ENDPOINT || 'https://staging-api.vietnam-delivery.com/api/pos',
      syncInterval: 30000,
      timeout: 15000,
      retryAttempts: 5,
    },
    socket: {
      endpoint: process.env.NEXT_PUBLIC_SOCKET_ENDPOINT || 'https://staging-api.vietnam-delivery.com',
      timeout: 10000,
      reconnectAttempts: 10,
      reconnectDelay: 2000,
    },
    timeout: 20000,
    retryAttempts: 5,
    retryDelay: 2000,
  },

  // 데이터베이스 설정
  database: {
    pool: {
      min: 5,
      max: 20,
      idle: 30000,
    },
  },

  // 캐시 설정
  cache: {
    ttl: 5 * 60 * 1000, // 5분
    maxSize: 500,
    enabled: true,
  },

  // 로깅 설정
  logging: {
    level: 'info',
    enableConsole: true,
    enableFile: true,
    enableRemote: true,
    format: 'json',
  },

  // 보안 설정 (프로덕션 수준)
  security: {
    enableCSP: true,
    enableCORS: true,
    corsOrigins: [
      'https://staging.vietnam-delivery.com',
      'https://staging-api.vietnam-delivery.com'
    ],
    sessionTimeout: 3600000, // 1시간
    cookieSecure: true,
    cookieSameSite: 'strict',
    cookieHttpOnly: true,
    enableHSTS: true,
    hstsMaxAge: 31536000,
  },

  // 성능 모니터링 (스테이징에서 활성화)
  monitoring: {
    enabled: true,
    sampleRate: 0.5,
    enableProfiler: true,
    enableDebugger: false,
    apm: {
      enabled: true,
      service: 'vietnam-delivery-staging',
    },
  },

  // 개발 도구 (제한적 활성화)
  devTools: {
    enabled: true,
    reactDevTools: true,
    reduxDevTools: true,
    showDebugInfo: false,
    enableHotReload: false,
    enableErrorOverlay: false,
  },

  // 기능 플래그
  features: {
    // 새 기능 테스트
    newDashboard: true,
    advancedAnalytics: true,
    betaFeatures: true,
    
    // Local 특화 기능
    vietnamPayments: true,
    vietnamDelivery: true,
    vietnamLocalization: true,
    
    // A/B 테스트 기능
    abTesting: true,
    userFeedback: true,
    performanceTesting: true,
  },

  // Local 결제 시스템 (스테이징 환경)
  payments: {
    momo: {
      enabled: true,
      partnerCode: process.env.MOMO_PARTNER_CODE,
      endpoint: 'https://test-payment.momo.vn',
      timeout: 30000,
      testMode: true,
    },
    vnpay: {
      enabled: true,
      tmnCode: process.env.VNPAY_TMN_CODE,
      endpoint: 'https://sandbox.vnpayment.vn',
      timeout: 30000,
      testMode: true,
    },
    zalopay: {
      enabled: true,
      appId: process.env.ZALOPAY_APP_ID,
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

  // 파일 업로드 (클라우드 스토리지)
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
    storage: {
      type: 'aws-s3',
      bucket: 'vietnam-delivery-staging',
      region: 'ap-southeast-1',
    },
    enableImageOptimization: true,
    imageQuality: 85,
  },

  // 이메일 설정 (스테이징 SMTP)
  email: {
    enabled: true,
    provider: 'sendgrid',
    sendgrid: {
      apiKey: process.env.SMTP_PASS,
    },
    from: 'Vietnam Delivery <noreply@vietnam-delivery.com>',
    templates: {
      path: './src/templates/email',
      engine: 'handlebars',
    },
  },

  // 알림 설정
  notifications: {
    enabled: true,
    firebase: {
      enabled: true,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      serverKey: process.env.FIREBASE_SERVER_KEY,
    },
    socket: {
      enabled: true,
      namespace: '/notifications',
    },
    email: {
      enabled: true,
      enableBatch: true,
      batchSize: 100,
    },
    slack: {
      enabled: true,
      webhook: process.env.STAGING_NOTIFICATION_WEBHOOK,
      channel: '#staging-alerts',
    },
  },

  // 테스트 설정
  testing: {
    enableSeedData: true,
    enableMockData: false,
    enableTestAPI: true,
    loadTesting: true,
    performanceTesting: true,
    abTesting: true,
  },

  // 스테이징 특화 설정
  staging: {
    // 자동 배포 설정
    autoDeploy: true,
    deployNotifications: true,
    
    // 테스트 데이터
    useRealData: true,
    dataRefreshInterval: 3600000, // 1시간
    
    // Local 테스트 환경
    vietnamTestMode: false,
    enableLoadTesting: true,
    
    // 모니터링
    performanceMonitoring: true,
    errorTracking: true,
    userAnalytics: true,
    
    // Local 결제 테스트
    paymentTestMode: true,
    paymentLimits: {
      single: 1000000, // 1M VND
      daily: 10000000, // 10M VND
    },
  },

  // 성능 설정
  performance: {
    enableCodeSplitting: true,
    enableLazyLoading: true,
    enableMemoization: true,
    bundleAnalyzer: false,
    
    // CDN 설정
    cdn: {
      enabled: true,
      baseUrl: 'https://staging-cdn.vietnam-delivery.com',
      cacheTTL: 3600,
    },
    
    // 이미지 최적화
    imageOptimization: true,
    imageFormats: ['webp', 'avif', 'jpeg'],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // 캐싱
    enableServiceWorker: false,
    enableAPICache: true,
    enableStaticCache: true,
  },

  // 에러 처리
  errorHandling: {
    enableErrorBoundary: true,
    enableErrorReporting: true,
    errorReporting: {
      service: 'sentry',
      dsn: process.env.SENTRY_DSN,
      environment: 'staging',
      sampleRate: 0.1,
    },
    showErrorDetails: false,
    enableRetry: true,
    maxRetryAttempts: 5,
  },

  // 분석 및 추적
  analytics: {
    enabled: true,
    googleAnalytics: {
      enabled: true,
      trackingId: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
    },
    customAnalytics: {
      enabled: true,
      endpoint: '/api/analytics',
    },
    userTracking: {
      enabled: true,
      anonymizeIp: true,
      respectDoNotTrack: true,
    },
  },

  // 백업 및 복구
  backup: {
    enabled: true,
    interval: 'daily',
    retention: 14, // days
    storage: {
      type: 'aws-s3',
      bucket: 'vietnam-delivery-staging-backups',
    },
  },

  // Rate Limiting
  rateLimit: {
    enabled: true,
    windowMs: 60000, // 1분
    max: 100, // 요청 수
    skipSuccessfulRequests: false,
  },

  // Local 비즈니스 검증
  vietnamBusiness: {
    enableTaxValidation: true,
    enableAddressValidation: true,
    enablePhoneValidation: true,
    enableBusinessHours: true,
    
    // Local 결제 규정
    paymentCompliance: {
      napasPQR: true,
      stateBank: true,
      antiMoney: true,
    },
    
    // Local 배송 규정
    deliveryCompliance: {
      trackingRequired: true,
      insuranceEnabled: false, // 스테이징에서는 비활성화
      codLimits: true,
    },
  },
};