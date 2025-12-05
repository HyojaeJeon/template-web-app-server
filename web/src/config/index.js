/**
 * Local App 점주용 대시보드 - 환경 설정 관리
 * 환경별로 다른 설정을 중앙집중식으로 관리
 */

import development from './environments/development.js';
import staging from './environments/staging.js';
import production from './environments/production.js';

// 현재 환경 확인
const currentEnv = process.env.NODE_ENV || process.env.NEXT_PUBLIC_APP_ENV || 'development';

// 환경별 설정 매핑
const configs = {
  development,
  staging,
  production,
};

// 기본 설정 (모든 환경 공통)
const baseConfig = {
  // Local 현지화 기본 설정
  vietnam: {
    timezone: 'Asia/Ho_Chi_Minh',
    currency: 'VND',
    currencySymbol: '₫',
    locale: 'vi-VN',
    supportedLocales: ['vi', 'ko', 'en'],
    defaultLocale: 'vi',
  },

  // 애플리케이션 기본 정보
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Local App 점주용',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: currentEnv,
  },

  // API 기본 설정
  api: {
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
  },

  // UI 기본 설정
  ui: {
    pageSize: 20,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    animationDuration: 300,
  },

  // 보안 기본 설정
  security: {
    sessionTimeout: 30 * 60 * 1000, // 30분
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15분
  },

  // 성능 기본 설정
  performance: {
    cacheTTL: 5 * 60 * 1000, // 5분
    debounceDelay: 300,
    throttleDelay: 1000,
    lazyLoadOffset: 100,
  },

  // Local 비즈니스 기본 설정
  business: {
    vatRate: 0.1,
    serviceChargeRate: 0.05,
    deliveryRadius: 5, // km
    deliveryFeeBase: 15000, // VND
    deliveryFeePerKm: 5000, // VND
    freeDeliveryThreshold: 200000, // VND
    workingHours: {
      start: '06:00',
      end: '23:00',
    },
  },
};

// 현재 환경의 설정과 기본 설정 병합
const config = {
  ...baseConfig,
  ...configs[currentEnv],
  environment: currentEnv,
};

// 설정 검증 함수
export const validateConfig = () => {
  const requiredEnvVars = [
    'NEXT_PUBLIC_GRAPHQL_ENDPOINT',
    'NEXT_PUBLIC_SOCKET_ENDPOINT',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return true;
};

// 특정 설정값 안전하게 가져오는 헬퍼
export const getConfig = (path, defaultValue = null) => {
  try {
    const keys = path.split('.');
    let value = config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  } catch (error) {
    console.warn(`Failed to get config for path: ${path}`, error);
    return defaultValue;
  }
};

// 환경별 기능 플래그 확인
export const isFeatureEnabled = (featureName) => {
  return getConfig(`features.${featureName}`, false);
};

// Local 특화 설정 헬퍼
export const getVietnamConfig = () => getConfig('vietnam');

// API 엔드포인트 빌더
export const buildApiUrl = (endpoint) => {
  const baseUrl = getConfig('api.baseUrl');
  return `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
};

// 환경 확인 헬퍼
export const isDevelopment = () => currentEnv === 'development';
export const isStaging = () => currentEnv === 'staging';
export const isProduction = () => currentEnv === 'production';

// 디버그 모드 확인
export const isDebugMode = () => {
  return isDevelopment() || process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true';
};

// 설정 정보 로깅 (개발 환경에서만)
if (isDevelopment()) {
  console.log('🔧 Configuration loaded:', {
    environment: currentEnv,
    vietnam: config.vietnam,
    features: config.features || {},
    api: {
      baseUrl: config.api?.baseUrl,
      timeout: config.api?.timeout,
    },
  });
}

export default config;