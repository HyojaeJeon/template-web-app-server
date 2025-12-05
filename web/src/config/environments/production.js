/**
 * 프로덕션 환경 설정
 * 최고 수준의 보안, 성능, 안정성 설정
 */

export default {
  // API 설정 (프로덕션 최적화) - 환경별 URL 사용
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL_PROD || 'https://api.vietnam-delivery.com/graphql',
    graphql: {
      endpoint: process.env.NEXT_PUBLIC_API_URL_PROD || 'https://api.vietnam-delivery.com/graphql',
      wsEndpoint: process.env.NEXT_PUBLIC_WS_URL_PROD || 'wss://api.vietnam-delivery.com/graphql',
    },
    pos: {
      endpoint: 'https://api.vietnam-delivery.com/api/pos',
      syncInterval: 15000, // 더 빠른 동기화
      timeout: 20000,
      retryAttempts: 5,
      heartbeatInterval: 8000,
    },
    socket: {
      endpoint: process.env.NEXT_PUBLIC_WS_URL_PROD?.replace('wss://', 'https://').replace('ws://', 'http://') || 'https://api.vietnam-delivery.com',
      timeout: 15000,
      reconnectAttempts: 10,
      reconnectDelay: 5000,
      transports: ['websocket', 'polling'],
    },
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 5000,
  },

  // 데이터베이스 설정 (프로덕션 클러스터)
  database: {
    pool: {
      min: 10,
      max: 50,
      idle: 300000, // 5분
    },
    readReplica: {
      enabled: true,
      maxConnections: 20,
    },
    connectionTimeout: 60000,
  },

  // 캐시 설정 (프로덕션 최적화)
  cache: {
    ttl: 10 * 60 * 1000, // 10분
    maxSize: 2000,
    enabled: true,
    distributed: true, // Redis 클러스터
    compression: true,
  },

  // 로깅 설정 (프로덕션 수준)
  logging: {
    level: 'warn', // 오직 경고와 에러만
    enableConsole: false,
    enableFile: true,
    enableRemote: true,
    format: 'json',
    rotation: {
      enabled: true,
      maxFiles: 30,
      maxSize: '100mb',
    },
  },

  // 최고 수준 보안 설정 🔒
  security: {
    enableCSP: true,
    enableCORS: true,
    corsOrigins: [
      'https://vietnam-delivery.com',
      'https://api.vietnam-delivery.com'
    ],
    sessionTimeout: 1800000, // 30분
    cookieSecure: true,
    cookieSameSite: 'strict',
    cookieHttpOnly: true,
    cookieDomain: '.vietnam-delivery.com',
    
    // HTTPS 및 HSTS
    forceHTTPS: true,
    enableHSTS: true,
    hstsMaxAge: 63072000, // 2년
    hstsIncludeSubdomains: true,
    hstsPreload: true,
    
    // 추가 보안 헤더
    securityHeaders: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
    
    // DDoS 보호
    ddosProtection: {
      enabled: true,
      rateLimit: 20,
      burstLimit: 50,
      banTime: 3600000, // 1시간
    },
  },

  // 성능 모니터링 (프로덕션 필수)
  monitoring: {
    enabled: true,
    sampleRate: 1.0, // 모든 요청 모니터링
    enableProfiler: false,
    enableDebugger: false,
    
    // APM (Application Performance Monitoring)
    apm: {
      enabled: true,
      service: 'vietnam-delivery-production',
      version: process.env.NEXT_PUBLIC_APP_VERSION,
    },
    
    // 메트릭 수집
    metrics: {
      enabled: true,
      interval: 60000, // 1분
      retention: 2592000000, // 30일
    },
    
    // 알림 임계값
    alerts: {
      errorRate: 0.01, // 1%
      responseTime: 2000, // 2초
      cpu: 80, // 80%
      memory: 85, // 85%
    },
  },

  // 개발 도구 (프로덕션에서 완전 비활성화)
  devTools: {
    enabled: false,
    reactDevTools: false,
    reduxDevTools: false,
    showDebugInfo: false,
    enableHotReload: false,
    enableErrorOverlay: false,
  },

  // 기능 플래그 (프로덕션 안정 기능만)
  features: {
    // 안정화된 기능만 활성화
    newDashboard: true,
    advancedAnalytics: true,
    betaFeatures: false,
    
    // Local 특화 기능 (모두 활성화)
    vietnamPayments: true,
    vietnamDelivery: true,
    vietnamLocalization: true,
    
    // 프로덕션 필수 기능
    errorTracking: true,
    performanceMonitoring: true,
    securityScanning: true,
    auditLogging: true,
  },

  // Local 결제 시스템 (프로덕션 계정)
  payments: {
    momo: {
      enabled: true,
      partnerCode: process.env.MOMO_PARTNER_CODE,
      endpoint: 'https://payment.momo.vn',
      timeout: 30000,
      testMode: false,
      encryption: {
        enabled: true,
        algorithm: 'aes-256-gcm',
      },
    },
    vnpay: {
      enabled: true,
      tmnCode: process.env.VNPAY_TMN_CODE,
      endpoint: 'https://pay.vnpay.vn',
      timeout: 30000,
      testMode: false,
      security: {
        tlsVersion: '1.3',
        certValidation: 'strict',
      },
    },
    zalopay: {
      enabled: true,
      appId: process.env.ZALOPAY_APP_ID,
      endpoint: 'https://openapi.zalopay.vn',
      timeout: 30000,
      testMode: false,
    },
    cod: {
      enabled: true,
      maxAmount: 20000000, // 20M VND (프로덕션 한도)
      verification: {
        phoneRequired: true,
        addressRequired: true,
      },
    },
    
    // 결제 보안 및 컴플라이언스
    security: {
      pciCompliance: true,
      fraudDetection: true,
      transactionLogging: true,
      encryptionAtRest: true,
      tokenization: true,
    },
    
    // Local 결제 규정 준수
    compliance: {
      napasQR: true,
      stateBankRegulations: true,
      antiMoneyLaundering: true,
      kycRequired: true,
    },
  },

  // 지도 및 위치 서비스 (프로덕션)
  maps: {
    google: {
      enabled: true,
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      libraries: ['places', 'geometry'],
      language: 'vi',
      region: 'VN',
      rateLimit: {
        enabled: true,
        requestsPerSecond: 50,
      },
    },
    mapbox: {
      enabled: true,
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
      style: 'mapbox://styles/mapbox/streets-v11',
    },
  },

  // 파일 업로드 (프로덕션 클라우드)
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB (보안 강화)
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    storage: {
      type: 'aws-s3',
      bucket: 'vietnam-delivery-production',
      region: 'ap-southeast-1',
      encryption: 'AES256',
      versioning: true,
    },
    enableImageOptimization: true,
    imageQuality: 80, // 성능 최적화
    
    // 바이러스 검사
    virusScanning: {
      enabled: true,
      provider: 'clamav',
    },
  },

  // 이메일 설정 (프로덕션 SMTP)
  email: {
    enabled: true,
    provider: 'sendgrid',
    sendgrid: {
      apiKey: process.env.SMTP_PASS,
      suppressionManagement: true,
    },
    from: 'Vietnam Delivery <noreply@vietnam-delivery.com>',
    replyTo: 'support@vietnam-delivery.com',
    
    templates: {
      path: './src/templates/email',
      engine: 'handlebars',
      caching: true,
    },
    
    // 이메일 보안
    security: {
      dkim: true,
      spf: true,
      dmarc: true,
    },
    
    // Rate limiting
    rateLimit: {
      enabled: true,
      perHour: 1000,
      perDay: 10000,
    },
  },

  // 알림 설정 (프로덕션)
  notifications: {
    enabled: true,
    
    firebase: {
      enabled: true,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      serverKey: process.env.FIREBASE_SERVER_KEY,
      batchSize: 500,
    },
    
    socket: {
      enabled: true,
      namespace: '/notifications',
      clustering: true,
    },
    
    email: {
      enabled: true,
      enableBatch: true,
      batchSize: 1000,
      priority: true,
    },
    
    sms: {
      enabled: true,
      provider: 'twilio',
      accountSid: process.env.SMS_ACCOUNT_SID,
      authToken: process.env.SMS_AUTH_TOKEN,
      fromNumber: process.env.SMS_FROM_NUMBER,
    },
    
    // 긴급 알림
    emergency: {
      enabled: true,
      channels: ['sms', 'email', 'slack'],
      escalation: true,
    },
  },

  // 프로덕션 운영 설정
  production: {
    // 고가용성 설정
    highAvailability: {
      enabled: true,
      loadBalancing: true,
      failover: true,
      healthChecks: true,
    },
    
    // 오토스케일링
    autoScaling: {
      enabled: true,
      minInstances: 2,
      maxInstances: 10,
      cpuTarget: 70,
      memoryTarget: 80,
    },
    
    // Local 법규 준수
    vietnamCompliance: {
      dataLocalization: true,
      cybersecurityLaw: true,
      ecommerceDecree: true,
      personalDataProtection: true,
    },
    
    // 재해 복구
    disasterRecovery: {
      enabled: true,
      replicationRegion: 'ap-northeast-1',
      backupFrequency: 'hourly',
      rtoTarget: 3600, // 1시간
      rpoTarget: 300, // 5분
    },
  },

  // 성능 설정 (프로덕션 최적화)
  performance: {
    enableCodeSplitting: true,
    enableLazyLoading: true,
    enableMemoization: true,
    enableTreeShaking: true,
    bundleAnalyzer: false,
    
    // CDN 설정
    cdn: {
      enabled: true,
      baseUrl: 'https://cdn.vietnam-delivery.com',
      cacheTTL: 86400, // 24시간
      gzipCompression: true,
      brotliCompression: true,
    },
    
    // 이미지 최적화
    imageOptimization: true,
    imageFormats: ['webp', 'avif'],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    lazyLoading: true,
    
    // 캐싱 전략
    enableServiceWorker: true,
    enableAPICache: true,
    enableStaticCache: true,
    cacheStrategies: {
      static: 'cache-first',
      api: 'network-first',
      images: 'cache-first',
    },
  },

  // 에러 처리 (프로덕션)
  errorHandling: {
    enableErrorBoundary: true,
    enableErrorReporting: true,
    
    errorReporting: {
      service: 'sentry',
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
      sampleRate: 1.0,
      beforeSend: true, // 민감정보 필터링
    },
    
    showErrorDetails: false,
    enableRetry: true,
    maxRetryAttempts: 3,
    
    // 에러 알림
    alerting: {
      enabled: true,
      threshold: 10, // 10개 이상의 에러
      timeWindow: 300000, // 5분
    },
  },

  // 분석 및 추적 (프로덕션)
  analytics: {
    enabled: true,
    
    googleAnalytics: {
      enabled: true,
      trackingId: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
      enhancedEcommerce: true,
      demographicsReports: true,
    },
    
    customAnalytics: {
      enabled: true,
      endpoint: '/api/analytics',
      sampling: 1.0,
    },
    
    userTracking: {
      enabled: true,
      anonymizeIp: true,
      respectDoNotTrack: true,
      gdprCompliant: true,
    },
    
    // 비즈니스 메트릭
    businessMetrics: {
      enabled: true,
      revenueTracking: true,
      conversionTracking: true,
      customerLifetimeValue: true,
    },
  },

  // 백업 및 복구 (프로덕션)
  backup: {
    enabled: true,
    frequency: {
      database: 'hourly',
      files: 'daily',
      logs: 'weekly',
    },
    retention: {
      database: 90, // 90일
      files: 30, // 30일
      logs: 365, // 1년
    },
    storage: {
      type: 'aws-s3',
      bucket: 'vietnam-delivery-production-backups',
      encryption: 'AES256',
      versioning: true,
    },
    verification: {
      enabled: true,
      frequency: 'weekly',
    },
  },

  // Rate Limiting (프로덕션 강화)
  rateLimit: {
    enabled: true,
    windowMs: 60000, // 1분
    max: 60, // 요청 수
    skipSuccessfulRequests: false,
    standardHeaders: true,
    legacyHeaders: false,
    
    // IP 기반 제한
    ipBased: true,
    
    // API별 개별 제한
    endpoints: {
      '/api/orders': { max: 100, windowMs: 60000 },
      '/api/payments': { max: 10, windowMs: 60000 },
      '/api/pos': { max: 200, windowMs: 60000 },
    },
  },

  // Local 비즈니스 규정 (프로덕션)
  vietnamBusiness: {
    enableTaxValidation: true,
    enableAddressValidation: true,
    enablePhoneValidation: true,
    enableBusinessHours: true,
    
    // Local 세금 규정
    taxCompliance: {
      vatEnabled: true,
      vatRate: 0.1,
      taxReporting: true,
      electronicInvoice: true,
    },
    
    // Local 결제 규정
    paymentCompliance: {
      napasPQR: true,
      stateBank: true,
      antiMoney: true,
      transactionReporting: true,
    },
    
    // Local 배송 규정
    deliveryCompliance: {
      trackingRequired: true,
      insuranceEnabled: true,
      codLimits: true,
      deliveryConfirmation: true,
    },
    
    // 개인정보보호
    privacy: {
      enabled: true,
      dataMinimization: true,
      consentManagement: true,
      rightToErasure: true,
    },
  },

  // 감사 및 컴플라이언스
  audit: {
    enabled: true,
    logging: {
      userActions: true,
      systemChanges: true,
      dataAccess: true,
      securityEvents: true,
    },
    retention: 2555, // 7년 (Local 법정 보존 기간)
    encryption: true,
    immutable: true,
  },

  // 헬스체크 및 모니터링
  healthCheck: {
    enabled: true,
    endpoint: '/health',
    interval: 30000, // 30초
    timeout: 5000,
    
    checks: {
      database: true,
      redis: true,
      externalServices: true,
      diskSpace: true,
      memoryUsage: true,
    },
  },
};