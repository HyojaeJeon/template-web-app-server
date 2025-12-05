/**
 * 통합 미들웨어 시스템
 * 모든 Express 및 GraphQL 미들웨어 기능을 중앙 집중식으로 관리
 * Performance, Security, Validation, i18n, Rate Limiting 등 통합 제공
 */

import Joi from 'joi';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from '../utilities/Logger.js';
import kv from '../../cache/kv.js';

// Auth 미들웨어 import - 통합된 auth 폴더에서 가져옴
import { getUser, getStoreAccount, getMobileUser } from '../auth/index.js';

// =====================================
// 성능 모니터링 미들웨어
// =====================================

/**
 * 성능 모니터링 미들웨어                                      │ 요청/응답 성능 메트릭 수집 및 분석
 */
export function performanceMonitoring(container) {
  const logger = container.resolve('logger');
  const cacheService = container.resolve('cacheService');

  return (req, res, next) => {
    const startTime = Date.now();
    
    // 요청 ID 생성 (추적용)                                     │ 분산 트레이싱을 위한 고유 ID
    req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.requestId);

    // 응답 완료 시 성능 메트릭 수집                               │ 비동기적으로 메트릭 데이터 저장
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      const memUsage = process.memoryUsage();
      
      // 성능 메트릭 데이터                                        │ 구조화된 성능 데이터 생성
      const metric = {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        memoryUsage: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
          external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100,
        },
        timestamp: new Date().toISOString(),
      };

      // 느린 요청 로깅 (1초 이상)                                  │ 성능 임계점 모니터링
      if (duration > 1000) {
        logger.warn('[PerformanceMiddleware] 느린 요청 감지', {
          path: req.path,
          method: req.method,
          duration: `${duration}ms`,
          statusCode: res.statusCode,
        });
      }

      // Redis에 성능 메트릭 저장 (시간별)                          │ 시계열 데이터로 성능 트렌드 추적
      try {
        const hour = new Date().getHours();
        const today = new Date().toISOString().split('T')[0];
        const key = `performance:requests:${today}:${hour}`;
        
        await cacheService.lpush(key, metric, 100); // 시간당 최대 100개 메트릭
        await cacheService.expire(key, 86400); // 24시간 보관
      } catch (cacheError) {
        logger.warn('[PerformanceMiddleware] 메트릭 캐시 저장 실패:', cacheError.message);
      }
    });

    next();
  };
}

/**
 * 응답 압축 최적화 미들웨어                                    │ 네트워크 대역폭 최적화
 */
export function optimizedCompression() {
  return compression({
    level: 6, // 균형잡힌 압축 레벨                               │ CPU vs 압축률 최적 균형점
    threshold: 1024, // 1KB 이상만 압축                          │ 작은 파일 압축 오버헤드 방지
    filter: (req, res) => {
      // 이미 압축된 파일은 제외                                  │ 중복 압축 방지
      if (req.headers['x-no-compression']) {
        return false;
      }
      
      // 이미지나 비디오는 압축하지 않음                           │ 바이너리 파일 압축 효율성 저하 방지
      const contentType = res.getHeader('content-type');
      if (contentType && (contentType.includes('image') || contentType.includes('video'))) {
        return false;
      }
      
      return compression.filter(req, res);
    },
  });
}

/**
 * 메모리 사용량 모니터링 미들웨어                               │ 메모리 누수 조기 탐지
 */
export function memoryMonitoring(container) {
  const logger = container.resolve('logger');
  const warningThreshold = 500 * 1024 * 1024; // 500MB          │ 경고 레벨 메모리 임계점
  const criticalThreshold = 800 * 1024 * 1024; // 800MB         │ 위험 레벨 메모리 임계점

  return (req, res, next) => {
    const memUsage = process.memoryUsage();
    
    if (memUsage.heapUsed > criticalThreshold) {
      logger.error('[MemoryMonitor] 메모리 사용량 위험 수준', {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        path: req.path,
      });
    } else if (memUsage.heapUsed > warningThreshold) {
      logger.warn('[MemoryMonitor] 메모리 사용량 경고 수준', {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        path: req.path,
      });
    }

    next();
  };
}

// =====================================
// 보안 미들웨어 시스템
// =====================================

/**
 * 통합 보안 미들웨어 클래스                                     │ 다중 보안 계층 제공
 */
class SecurityMiddleware {
  constructor(dependencies = {}) {
    // 중앙 KV 사용                                              │ 분산 보안 상태 관리
    this.redis = kv;
    
    this.logger = dependencies.logger || console;
    this.maxLoginAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
    this.loginAttemptWindow = parseInt(process.env.LOGIN_ATTEMPT_WINDOW) || 15 * 60; // 15분
    this.lockoutDuration = parseInt(process.env.LOCKOUT_DURATION) || 30 * 60; // 30분
  }

  /**
   * 무차별 대입 공격 방지 미들웨어                              │ Brute Force 공격 차단
   */
  bruteForcePrevention = (keyType = 'ip') => {
    return async (req, res, next) => {
      try {
        const identifier = this.getIdentifier(req, keyType);
        const key = this.getBruteForceKey(keyType, identifier);

        // 현재 시도 횟수 확인                                     │ 계정별/IP별 시도 횟수 추적
        const attempts = await this.redis.get(key) || 0;
        const lockKey = this.getLockoutKey(keyType, identifier);
        const isLocked = await this.redis.get(lockKey);

        // 계정이 잠긴 상태인지 확인                               │ 일시적 계정 잠금 상태 체크
        if (isLocked) {
          const ttl = await this.redis.ttl(lockKey);
          return res.status(429).json({
            success: false,
            error: 'ACCOUNT_LOCKED',
            message: '너무 많은 로그인 시도로 인해 계정이 일시적으로 잠겼습니다.',
            lockoutRemaining: ttl,
            retryAfter: ttl,
          });
        }

        // 최대 시도 횟수 초과 확인                                │ 보안 임계점 검증
        if (parseInt(attempts) >= this.maxLoginAttempts) {
          // 계정 잠금 설정                                        │ 자동 보안 조치 실행
          await this.redis.setex(lockKey, this.lockoutDuration, '1');
          await this.redis.del(key); // 시도 횟수 초기화

          this.logger.warn('계정 잠금 - 무차별 대입 공격 탐지', {
            keyType,
            identifier: this.maskIdentifier(identifier, keyType),
            attempts,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
          });

          return res.status(429).json({
            success: false,
            error: 'TOO_MANY_ATTEMPTS',
            message: '너무 많은 로그인 시도로 인해 계정이 잠겼습니다.',
            lockoutDuration: this.lockoutDuration,
          });
        }

        // 요청 정보를 다음 미들웨어에 전달                         │ 보안 컨텍스트 정보 제공
        req.security = {
          keyType,
          identifier,
          attempts: parseInt(attempts),
          maxAttempts: this.maxLoginAttempts,
        };

        next();

      } catch (error) {
        this.logger.error('무차별 대입 공격 방지 미들웨어 오류', {
          error: error.message,
          stack: error.stack,
          keyType,
          ip: req.ip,
        });

        // 보안 미들웨어 오류 시에도 요청을 계속 처리              │ 장애 허용성 확보
        next();
      }
    };
  };

  /**
   * 보안 헤더 설정 미들웨어                                     │ HTTP 보안 헤더 표준 적용
   */
  securityHeaders = (req, res, next) => {
    // XSS 방지                                                  │ 크로스 사이트 스크립팅 차단
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Content Type Sniffing 방지                               │ MIME 타입 스니핑 방지
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Clickjacking 방지                                        │ iframe 삽입 공격 차단
    res.setHeader('X-Frame-Options', 'DENY');
    
    // HTTPS 강제 (프로덕션 환경)                                │ 암호화 전송 강제
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    // Content Security Policy                                  │ 콘텐츠 보안 정책 적용
    res.setHeader('Content-Security-Policy', 'default-src \'self\'');
    
    // Referrer Policy                                          │ 리퍼러 정보 보호
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy                                       │ 브라우저 권한 제한
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    next();
  };

  /**
   * CORS 설정 미들웨어                                          │ 교차 출처 리소스 공유 관리
   */
  corsSettings = (req, res, next) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin) || !origin) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    next();
  };

  // Private 메서드들                                           │ 내부 유틸리티 함수

  /**
   * 식별자 추출                                                │ 요청에서 보안 식별자 추출
   */
  getIdentifier(req, keyType) {
    switch (keyType) {
    case 'ip':
      return req.ip || req.connection.remoteAddress;
    case 'user':
      return req.body.userId || req.user?.id;
    case 'phone':
      return req.body.phoneNumber;
    case 'email':
      return req.body.email;
    default:
      return req.ip;
    }
  }

  /**
   * 무차별 대입 공격 방지 키 생성                               │ Redis 키 패턴 통일
   */
  getBruteForceKey(keyType, identifier) {
    return `brute_force:${keyType}:${identifier}`;
  }

  /**
   * 계정 잠금 키 생성                                          │ 계정 잠금 상태 키 생성
   */
  getLockoutKey(keyType, identifier) {
    return `lockout:${keyType}:${identifier}`;
  }

  /**
   * 식별자 마스킹                                              │ 개인정보 보호를 위한 마스킹
   */
  maskIdentifier(identifier, keyType) {
    if (!identifier) return 'unknown';
    
    switch (keyType) {
    case 'email': {
      const [local, domain] = identifier.split('@');
      return `${local.charAt(0)}***@${domain}`;
    }
    case 'phone':
      return `${identifier.substring(0, 3)}***${identifier.substring(identifier.length - 3)}`;
    case 'ip': {
      const parts = identifier.split('.');
      return `${parts[0]}.${parts[1]}.***.***.`;
    }
    default:
      return `${identifier.substring(0, 3)}***`;
    }
  }
}

// =====================================
// Rate Limiting 미들웨어
// =====================================

/**
 * API Rate Limiting 미들웨어                                   │ API 요청 속도 제한
 */
export function apiRateLimit(options = {}) {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15분                           │ 시간 윈도우 설정
    max: 100, // 최대 100회 요청                                │ 요청 한도 설정
    message: {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    },
    standardHeaders: true,                                      //│ Rate limit 헤더 포함
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,                              //│ 요청자 식별 방식
    ...options,
  };

  return rateLimit(defaultOptions);
}

/**
 * 로그인 전용 Rate Limiting                                    │ 인증 엔드포인트 특수 보호
 */
export const loginRateLimit = apiRateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 10, // 최대 10회 로그인 시도
  message: {
    success: false,
    error: 'LOGIN_RATE_LIMIT_EXCEEDED',
    message: '너무 많은 로그인 시도입니다. 15분 후 다시 시도해주세요.',
  },
  skipSuccessfulRequests: true, // 성공한 요청은 카운트하지 않음      │ 실패한 요청만 제한
});

/**
 * 회원가입 Rate Limiting                                      │ 계정 생성 남용 방지
 */
export const registrationRateLimit = apiRateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 3, // 최대 3회 회원가입 시도
  message: {
    success: false,
    error: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
    message: '너무 많은 회원가입 시도입니다. 1시간 후 다시 시도해주세요.',
  },
});

// =====================================
// 요청 검증 미들웨어
// =====================================

/**
 * 요청 검증 미들웨어 클래스                                     │ 입력 데이터 검증 및 보안 필터링
 */
class RequestValidationMiddleware {
  constructor(dependencies = {}) {
    this.logger = dependencies.logger || logger;
    
    // Local 특화 검증 패턴들                                    │ 로컬라이제이션 정규식 패턴
    this.vietnamesePhoneRegex = /^(\+84|84|0)[3-9]\d{8}$/;
    this.vnVINRegex = /^[A-Z0-9]{17}$/;
    this.vnPostalCodeRegex = /^\d{6}$/;
    
    // 악성 패턴 검출                                            │ 보안 위협 패턴 탐지
    this.maliciousPatterns = [
      // SQL 인젝션 - 더 정확한 패턴                             │ 데이터베이스 공격 차단
      /('.*or.*'.*=.*'|'.*union.*select|'.*drop.*table|'.*insert.*into|'.*update.*set|'.*delete.*from)/gi,
      /(--|\#|\/\*|\*\/)/g,
      /(';\s*(drop|delete|update|insert|select|union))/gi,
      
      // XSS                                                     │ 크로스 사이트 스크립팅 차단
      /<\s*script[^>]*>.*?<\/script>/gi,
      /javascript\s*:/gi,
      /on(load|click|error|focus|blur)\s*=/gi,
      /<\s*(iframe|object|embed|applet)/gi,
      
      // LDAP 인젝션                                              │ LDAP 쿼리 인젝션 차단
      /(\(\|)|(\)\()|(\*\))|(\|\()|(!\()/g,
      
      // 명령 실행                                                 │ OS 명령 인젝션 차단
      /(;\s*(rm|cat|ls|ps|kill|chmod|chown|curl|wget))/gi,
      
      // Path traversal                                          │ 경로 조작 공격 차단
      /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/gi,
      
      // NoSQL 인젝션                                             │ NoSQL 데이터베이스 공격 차단
      /(\$where|\$ne|\$gt|\$lt|\$regex|\$exists)/gi,
    ];
  }

  /**
   * 스키마 기반 유효성 검사 미들웨어                                   // Joi 스키마 검증
   */
  validateSchema = (schema, source = 'body') => {
    return (req, res, next) => {
      try {
        const data = req[source];
        const { error, value } = schema.validate(data, {
          abortEarly: false,                                    // 모든 에러 수집
          stripUnknown: true,                                   // 알려지지 않은 필드 제거
          convert: true,                                        // 타입 자동 변환
        });

        if (error) {
          const errors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: this.getLocalizedErrorMessage(detail),
            code: detail.type,
          }));

          this.logger.warn('스키마 검증 실패', {
            source,
            errors,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            data: this.maskSensitiveData(data),
          });

          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: '입력 데이터가 올바르지 않습니다.',
            errors,
          });
        }

        // 정제된 데이터로 교체                                   │ 검증된 안전한 데이터 사용
        req[source] = value;
        next();

      } catch (error) {
        this.logger.error('스키마 검증 중 오류', {
          error: error.message,
          stack: error.stack,
          source,
        });

        return res.status(500).json({
          success: false,
          error: 'VALIDATION_SYSTEM_ERROR',
          message: '검증 시스템 오류가 발생했습니다.',
        });
      }
    };
  };

  /**
   * 악성 패턴 검출 미들웨어                                     │ 보안 위협 패턴 탐지
   */
  detectMaliciousInput = (req, res, next) => {
    try {
      const allInputs = [
        ...Object.values(req.body || {}),
        ...Object.values(req.query || {}),
        ...Object.values(req.params || {}),
        req.get('User-Agent') || '',
        req.get('Referer') || '',
      ];

      const maliciousInputs = [];

      for (const input of allInputs) {
        if (typeof input === 'string') {
          for (const pattern of this.maliciousPatterns) {
            if (pattern.test(input)) {
              maliciousInputs.push({
                input: this.maskSensitiveData(input),
                pattern: pattern.source,
              });
            }
          }
        }
      }

      if (maliciousInputs.length > 0) {
        this.logger.error('악성 입력 패턴 탐지', {
          maliciousInputs,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
        });

        return res.status(400).json({
          success: false,
          error: 'MALICIOUS_INPUT_DETECTED',
          message: '유효하지 않은 입력이 감지되었습니다.',
        });
      }

      next();

    } catch (error) {
      this.logger.error('악성 패턴 검출 중 오류', {
        error: error.message,
        stack: error.stack,
      });
      
      // 보안 검사 실패 시에도 계속 진행                          │ 가용성 우선
      next();
    }
  };

  /**
   * Local 특화 데이터 검증 미들웨어                             │ 현지화 데이터 검증
   */
  validateVietnameseData = (req, res, next) => {
    try {
      const { body } = req;
      const errors = [];

      // Local 전화번호 검증                                     │ 현지 전화번호 형식 검증
      if (body.phone || body.phoneNumber) {
        const phone = body.phone || body.phoneNumber;
        const validationResult = validateVietnamesePhone(phone);
        if (!validationResult.isValid) {
          errors.push({
            field: 'phone',
            message: validationResult.error || '올바른 Local 전화번호 형식이 아닙니다.',
            code: 'INVALID_PHONE_FORMAT',
          });
        }
      }

      // Local 우편번호 검증                                     │ 현지 우편번호 형식 검증
      if (body.postalCode) {
        if (!this.vnPostalCodeRegex.test(body.postalCode)) {
          errors.push({
            field: 'postalCode',
            message: '올바른 Local 우편번호 형식이 아닙니다.',
            code: 'INVALID_POSTAL_CODE',
          });
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'VIETNAM_VALIDATION_ERROR',
          message: 'Local 특화 데이터 검증에 실패했습니다.',
          errors,
        });
      }

      next();

    } catch (error) {
      this.logger.error('Local 데이터 검증 중 오류', {
        error: error.message,
        stack: error.stack,
      });
      
      next();
    }
  };

  /**
   * 지역화된 에러 메시지 생성                                   │ 다국어 에러 메시지 제공
   */
  getLocalizedErrorMessage(detail) {
    const { type, path, context } = detail;
    const field = path.join('.');

    const messages = {
      'string.empty': `${field}은(는) 비어있을 수 없습니다.`,
      'string.min': `${field}은(는) 최소 ${context.limit}자 이상이어야 합니다.`,
      'string.max': `${field}은(는) 최대 ${context.limit}자 이하여야 합니다.`,
      'string.pattern.base': `${field}의 형식이 올바르지 않습니다.`,
      'string.email': `${field}은(는) 올바른 이메일 형식이어야 합니다.`,
      'number.min': `${field}은(는) 최소값 ${context.limit} 이상이어야 합니다.`,
      'number.max': `${field}은(는) 최대값 ${context.limit} 이하여야 합니다.`,
      'any.required': `${field}은(는) 필수 입력 항목입니다.`,
      'array.min': `${field}은(는) 최소 ${context.limit}개 이상의 항목이 필요합니다.`,
      'array.max': `${field}은(는) 최대 ${context.limit}개 이하의 항목만 허용됩니다.`,
      'boolean.base': `${field}은(는) true 또는 false 값이어야 합니다.`,
      'date.base': `${field}은(는) 올바른 날짜 형식이어야 합니다.`,
    };

    return messages[type] || `${field}의 값이 올바르지 않습니다.`;
  }

  /**
   * 민감한 데이터 마스킹                                       │ 개인정보 보호 마스킹
   */
  maskSensitiveData(data) {
    if (typeof data !== 'string') return data;

    // 비밀번호 마스킹                                           │ 긴 문자열 부분 마스킹
    if (data.length > 20) {
      return `${data.substring(0, 10)}***${data.substring(data.length - 5)}`;
    }

    // 짧은 문자열도 부분 마스킹                                 │ 짧은 문자열 보호
    if (data.length > 6) {
      return `${data.substring(0, 3)}***`;
    }

    return '***';
  }
}

// =====================================
// 다국어 지원 미들웨어
// =====================================

/**
 * Express 미들웨어: 다국어 지원 기능                           │ 요청별 언어 설정 및 번역 기능
 */
export function i18nMiddleware(req, res, next) {
  try {
    // 언어 감지: query > header > user profile > cookie > default │ 우선순위 기반 언어 탐지
    const language = detectLanguage(req);
    
    // 요청 객체에 다국어 컨텍스트 추가                           │ 전역 번역 컨텍스트 제공
    req.i18n = {
      language,
      // LocaleLoader 제거 - Enhanced 패턴 사용
      // getText, getLocale 등은 withMAuth/withSAuth에서 자동 처리
    };

    // 응답 헤더에 언어 정보 설정                                │ 클라이언트 언어 정보 전달
    res.setHeader('Content-Language', language);
    
    next();
  } catch (error) {
    console.error('다국어 미들웨어 실행 실패:', error);
    
    // 오류 발생시 기본 다국어 컨텍스트 생성                      │ 장애 허용성 확보
    req.i18n = createDefaultI18nContext();
    next();
  }
}

/**
 * GraphQL 컨텍스트용 다국어 기능                              │ GraphQL 리졸버용 번역 컨텍스트
 */
function createGraphQLI18nContext(req) {
  const language = detectLanguage(req);

  return {
    language,
  };
}

/**
 * 클라이언트 언어 감지                                        │ 다양한 소스에서 언어 정보 추출
 */
function detectLanguage(req) {
  // 1. URL 쿼리 파라미터 (?lang=ko)                            │ 명시적 언어 선택 우선
  if (req.query && req.query.lang) {
    const queryLang = normalizeLanguage(req.query.lang);
    if (isValidLanguage(queryLang)) {
      return queryLang;
    }
  }

  // 2. Accept-Language 헤더                                   │ 브라우저 언어 설정 활용
  if (req.headers && req.headers['accept-language']) {
    const headerLang = parseAcceptLanguageHeader(req.headers['accept-language']);
    if (headerLang && isValidLanguage(headerLang)) {
      return headerLang;
    }
  }

  // 3. 사용자 프로필 설정 (로그인 사용자)                       │ 개인 언어 설정 우선
  if (req.user && req.user.preferredLanguage) {
    const userLang = normalizeLanguage(req.user.preferredLanguage);
    if (isValidLanguage(userLang)) {
      return userLang;
    }
  }

  // 4. 쿠키 언어 설정                                          │ 브라우저 저장 언어 설정
  if (req.cookies && req.cookies.language) {
    const cookieLang = normalizeLanguage(req.cookies.language);
    if (isValidLanguage(cookieLang)) {
      return cookieLang;
    }
  }

  // 5. X-Language 커스텀 헤더 (모바일 앱)                       │ 앱 전용 언어 설정
  if (req.headers && req.headers['x-language']) {
    const customLang = normalizeLanguage(req.headers['x-language']);
    if (isValidLanguage(customLang)) {
      return customLang;
    }
  }

  // 기본 언어 반환                                             │ Local어 기본 설정
  return localeLoader.getDefaultLanguage();
}

/**
 * Accept-Language 헤더 파싱                                  │ HTTP 표준 언어 헤더 처리
 */
function parseAcceptLanguageHeader(acceptLanguage) {
  try {
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [language, quality = 'q=1'] = lang.trim().split(';');
        const q = parseFloat(quality.split('=')[1] || '1');
        return { language: normalizeLanguage(language), quality: q };
      })
      .sort((a, b) => b.quality - a.quality); // 품질 순으로 정렬         │ 사용자 언어 선호도 순 정렬

    // 지원하는 언어 중 첫 번째 반환                              │ 최우선 지원 언어 선택
    for (const { language } of languages) {
      if (isValidLanguage(language)) {
        return language;
      }
    }

    return null;
  } catch (error) {
    console.warn('Accept-Language 헤더 파싱 오류:', acceptLanguage);
    return null;
  }
}

/**
 * 언어 태그 정규화                                           │ 언어 코드 표준화
 */
function normalizeLanguage(language) {
  if (!language) return null;
  
  return language.toLowerCase().split(/[-_]/)[0];
}

/**
 * 지원하는 언어인지 확인                                      │ 지원 언어 목록 검증
 */
function isValidLanguage(language) {
  return localeLoader.getSupportedLanguages().includes(language);
}

/**
 * 기본 i18n 컨텍스트 생성 (오류 대비)                         │ 장애 허용성을 위한 기본 컨텍스트
 */
function createDefaultI18nContext() {
  const defaultLanguage = 'vi';
  
  return {
    language: defaultLanguage,
    getText: (key, params = {}) => {
      try {
        return localeLoader.getText(key, defaultLanguage, params);
      } catch (error) {
        return key; // 번역 실패 시 키 값 반환                     │ 최종 안전장치
      }
    },
    getLocale: () => {
      try {
        return localeLoader.getLocale(defaultLanguage);
      } catch (error) {
        return {};
      }
    },
    getSupportedLanguages: () => ['vi', 'en', 'ko'],
  };
}

// =====================================
// Local 특화 최적화 미들웨어
// =====================================

/**
 * Local 특화 최적화 미들웨어                                  │ 현지화 최적화 설정
 */
export function vietnamOptimization() {
  return (req, res, next) => {
    // Local 시간대 헤더 설정                                   │ 호치민시 시간대 설정
    res.setHeader('X-Timezone', 'Asia/Ho_Chi_Minh');
    
    // Local 통화 헤더 설정                                     │ VND 통화 정보 제공
    res.setHeader('X-Currency', 'VND');
    
    // Local어 언어 우선순위 설정                               │ 현지 언어 우선 처리
    if (!req.headers['accept-language']) {
      req.headers['accept-language'] = 'vi-VN,vi;q=0.9,en;q=0.8';
    }

    next();
  };
}

// =====================================
// 스키마 정의 (자주 사용되는 검증 스키마)
// =====================================

/**
 * 자주 사용되는 Joi 검증 스키마들                              │ 재사용 가능한 검증 스키마 모음
 */
export const validationSchemas = {
  // 사용자 등록                                               │ Local 사용자 등록 검증
  userRegistration: Joi.object({
    phone: Joi.string()
      .pattern(/^(\+84|84|0)[3-9]\d{8}$/)
      .required()
      .messages({
        'string.pattern.base': '올바른 Local 전화번호 형식을 입력해주세요.',
      }),
    password: Joi.string()
      .min(8)
      .max(100)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.pattern.base': '비밀번호는 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.',
      }),
    fullName: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .pattern(/^[a-zA-ZÀ-ỹ\s]+$/)
      .required()
      .messages({
        'string.pattern.base': '이름은 문자와 공백만 포함할 수 있습니다.',
      }),
    email: Joi.string().email().optional(),
    preferredLanguage: Joi.string()
      .valid('vi', 'en', 'ko')
      .default('vi'),
  }),

  // 로그인                                                    │ 간단한 로그인 검증
  userLogin: Joi.object({
    phone: Joi.string()
      .pattern(/^(\+84|84|0)[3-9]\d{8}$/)
      .required(),
    password: Joi.string().min(1).max(200).required(),
  }),

  // 매장 생성                                                 │ 배달 매장 정보 검증
  storeCreation: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().trim().max(500).optional(),
    phone: Joi.string()
      .pattern(/^(\+84|84|0)[3-9]\d{8}$/)
      .required(),
    email: Joi.string().email().optional(),
    address: Joi.string().trim().min(5).max(200).required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    deliveryFee: Joi.number().min(0).max(100000).required(),
    minimumOrder: Joi.number().min(0).max(1000000).required(),
    deliveryRadius: Joi.number().min(100).max(50000).default(5000),
    estimatedDeliveryTime: Joi.number().min(10).max(120).default(30),
  }),

  // 페이지네이션                                              │ 목록 조회 페이징 검증
  pagination: Joi.object({
    page: Joi.number().min(1).max(1000).default(1),
    limit: Joi.number().min(1).max(100).default(20),
    sortBy: Joi.string().max(50).optional(),
    displayOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // 위치 기반 검색                                            │ 지리적 위치 검색 검증
  locationSearch: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().min(100).max(50000).default(5000),
  }),
};

// =====================================
// 인스턴스 생성 및 Export
// =====================================

// 기본 미들웨어 인스턴스들                                     │ 즉시 사용 가능한 미들웨어 인스턴스
const securityMiddleware = new SecurityMiddleware();
const requestValidationMiddleware = new RequestValidationMiddleware();

// 보안 및 성능 헤더 설정                                       │ Helmet 기반 보안 헤더
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      scriptSrc: ['\'self\''],
      imgSrc: ['\'self\'', 'data:', 'https://*.cloudflare.com', 'https://*.googleapis.com'],
      connectSrc: ['\'self\'', 'wss:'],
      fontSrc: ['\'self\'', 'https://fonts.gstatic.com'],
      objectSrc: ['\'none\''],
      mediaSrc: ['\'self\''],
      frameSrc: ['\'none\''],
    },
  },
  hsts: {
    maxAge: 31536000, // 1년                                     │ HTTPS 강제 설정
    includeSubDomains: true,
    preload: true,
  },
});

// 모든 미들웨어 기능 통합 Export                               │ 단일 진입점 제공
export {
  // 클래스 인스턴스
  securityMiddleware,
  requestValidationMiddleware,
  
  // 보안 미들웨어
  SecurityMiddleware,
  
  // 검증 미들웨어
  RequestValidationMiddleware,
  
  // 인증 미들웨어
  getUser,
  getStoreAccount,
  getMobileUser,
  
  // 다국어 함수들
  createGraphQLI18nContext,
  detectLanguage,
  parseAcceptLanguageHeader,
  normalizeLanguage,
  isValidLanguage,
  createDefaultI18nContext,
};

export default {
  // 성능 미들웨어                                             │ 성능 최적화 미들웨어 그룹
  performanceMonitoring,
  optimizedCompression,
  memoryMonitoring,
  
  // 보안 미들웨어                                             │ 보안 강화 미들웨어 그룹
  securityMiddleware: securityMiddleware,
  securityHeaders,
  
  // Rate Limiting                                            │ 요청 속도 제한 미들웨어 그룹
  apiRateLimit,
  loginRateLimit,
  registrationRateLimit,
  
  // 검증 미들웨어                                             │ 입력 검증 미들웨어 그룹
  requestValidationMiddleware: requestValidationMiddleware,
  validationSchemas,
  
  // 다국어 미들웨어                                           │ 국제화 미들웨어 그룹
  i18nMiddleware,
  createGraphQLI18nContext,
  
  // Local 특화                                               │ 현지화 최적화 미들웨어
  vietnamOptimization,
};
