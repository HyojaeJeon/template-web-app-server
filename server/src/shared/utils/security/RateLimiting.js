/**
 * 통합 레이트 리미팅 서비스
 * GraphQL 특화 레이트 리미팅 및 DDoS 방어 시스템
 */

import { GraphQLError } from 'graphql';

export class RateLimiting {
  constructor(options = {}) {
    this.cache = options.cache;                         // → Redis 캐시 인스턴스
    this.config = {
      // 일반 요청 제한                                → 기본 트래픽 제어
      globalWindow: 15 * 60 * 1000, // 15분
      globalLimit: 1000,
      
      // 인증 요청 제한 (보안 강화)                     → 브루트포스 방어
      authWindow: 15 * 60 * 1000, // 15분
      authLimit: 10, // 인증 시도 제한
      
      // GraphQL 쿼리 복잡도 제한                       → 복잡한 쿼리 방어
      queryComplexityLimit: 1000,
      queryDepthLimit: 15,
      
      // IP별 제한                                    → 개별 클라이언트 제어
      ipLimit: 100,
      ipWindow: 60 * 1000, // 1분
      
      ...options,
    };
  }

  /**
   * 인증 관련 요청 레이트 리미팅                      → 로그인 시도 제한
   */
  async checkAuthRateLimit(identifier, action = 'login') {
    const key = `auth_limit:${action}:${identifier}`;
    
    if (!this.cache) {
      return { allowed: true, remaining: this.config.authLimit };
    }

    const current = await this.cache.get(key) || 0;
    
    if (current >= this.config.authLimit) {
      const ttl = await this.cache.ttl(key);
      
      throw new GraphQLError(
        `Too many ${action} attempts. Try again in ${Math.ceil(ttl / 60)} minutes`,
        'RATE_LIMIT_EXCEEDED',
        429,
        { retryAfter: ttl }
      );
    }

    // 카운터 증가                                    → 시도 횟수 업데이트
    const newCount = current + 1;
    await this.cache.setex(key, this.config.authWindow / 1000, newCount);

    return {
      allowed: true,
      remaining: this.config.authLimit - newCount,
      resetTime: Date.now() + this.config.authWindow,
    };
  }

  /**
   * IP 기반 레이트 리미팅                           → 클라이언트 IP 제어
   */
  async checkIPRateLimit(ip) {
    const key = `ip_limit:${ip}`;
    
    if (!this.cache) {
      return { allowed: true };
    }

    const current = await this.cache.get(key) || 0;
    
    if (current >= this.config.ipLimit) {
      throw new GraphQLError(
        'Too many requests from this IP',
        'IP_RATE_LIMIT_EXCEEDED',
        429
      );
    }

    await this.cache.setex(key, this.config.ipWindow / 1000, current + 1);
    
    return {
      allowed: true,
      remaining: this.config.ipLimit - current - 1,
    };
  }

  /**
   * GraphQL 쿼리 복잡도 검사                         → 복잡한 쿼리 차단
   */
  validateQueryComplexity(query, complexity) {
    if (complexity > this.config.queryComplexityLimit) {
      throw new GraphQLError(
        'Query too complex',
        'QUERY_TOO_COMPLEX',
        400,
        { complexity, limit: this.config.queryComplexityLimit }
      );
    }
  }

  /**
   * GraphQL 리졸버용 레이트 리미팅 미들웨어           → 통합 GraphQL 보호
   */
  createGraphQLRateLimit(options = {}) {
    return async (resolve, parent, args, context, info) => {
      const { user, req } = context;
      const operation = info.operation.operation; // query, mutation, subscription
      const fieldName = info.fieldName;
      
      // IP 기반 제한                                 → 클라이언트 제어
      if (req?.ip) {
        await this.checkIPRateLimit(req.ip);
      }

      // 인증 관련 뮤테이션 특별 제한                   → 보안 강화 제어
      const authOperations = [
        'loginWithPhone', 'registerWithPhone', 'socialLogin',
        'verifyPhone', 'sendVerificationCode', 'refreshToken'
      ];

      if (operation === 'mutation' && authOperations.includes(fieldName)) {
        const identifier = user?.phone || args.phone || req?.ip || 'anonymous';
        await this.checkAuthRateLimit(identifier, fieldName);
      }

      // 사용자별 일반 제한                            → 개별 사용자 제어
      if (user) {
        const userKey = `user_limit:${user.id}`;
        await this.checkUserRateLimit(userKey);
      }

      return resolve(parent, args, context, info);
    };
  }

  /**
   * 사용자별 레이트 리미팅                          → 인증된 사용자 제어
   */
  async checkUserRateLimit(userKey) {
    if (!this.cache) return { allowed: true };

    const current = await this.cache.get(userKey) || 0;
    const limit = this.config.globalLimit;
    
    if (current >= limit) {
      throw new GraphQLError(
        'User rate limit exceeded',
        'USER_RATE_LIMIT_EXCEEDED',
        429
      );
    }

    await this.cache.setex(userKey, this.config.globalWindow / 1000, current + 1);
    
    return {
      allowed: true,
      remaining: limit - current - 1,
    };
  }

  /**
   * 의심스러운 활동 패턴 감지                        → 이상 행동 탐지
   */
  async detectSuspiciousActivity(identifier, action, metadata = {}) {
    const patterns = [
      // 빠른 연속 요청                               → 자동화 도구 탐지
      { window: 10000, limit: 20, severity: 'medium' },
      // 실패한 로그인 패턴                           → 브루트포스 탐지
      { window: 300000, limit: 5, severity: 'high', action: 'failed_login' },
      // 토큰 리프레시 남용                           → 토큰 남용 탐지
      { window: 60000, limit: 10, severity: 'medium', action: 'refresh_token' },
    ];

    for (const pattern of patterns) {
      if (pattern.action && pattern.action !== action) continue;
      
      const key = `suspicious:${pattern.action || action}:${identifier}`;
      const current = await this.cache?.get(key) || 0;
      
      if (current >= pattern.limit) {
        // 의심스러운 활동 감지 시 보안 팀에 알림        → 보안 모니터링
        await this.reportSuspiciousActivity(identifier, action, {
          pattern: pattern.severity,
          attempts: current,
          metadata,
        });
        
        throw new GraphQLError(
          'Suspicious activity detected',
          'SUSPICIOUS_ACTIVITY',
          429
        );
      }
      
      await this.cache?.setex(key, pattern.window / 1000, current + 1);
    }
  }

  /**
   * 의심스러운 활동 보고                            → 보안 알림 시스템
   */
  async reportSuspiciousActivity(identifier, action, details) {
    // 보안 로그 기록                                → 감사 추적
    console.warn('🚨 SECURITY ALERT:', {
      timestamp: new Date().toISOString(),
      identifier: this.maskIdentifier(identifier),
      action,
      details,
    });

    // 향후 보안 팀 알림 시스템 연동 가능              → 확장 가능한 알림
    // await securityAlertService.notify({ identifier, action, details });
  }

  /**
   * 식별자 마스킹 (프라이버시 보호)                  → 개인정보 보호
   */
  maskIdentifier(identifier) {
    if (!identifier) return 'unknown';
    
    if (identifier.includes('@')) {
      const [local, domain] = identifier.split('@');
      return `${local.charAt(0)}***@${domain}`;
    }
    
    if (identifier.length <= 4) return '****';
    return `${identifier.slice(0, 2)}***${identifier.slice(-2)}`;
  }

  /**
   * 동적 레이트 리미팅 (적응형 제한)                 → 트래픽 기반 조정
   */
  async adaptiveRateLimit(identifier, baseLimit, trafficFactor = 1.0) {
    const adaptiveLimit = Math.floor(baseLimit * trafficFactor);
    const key = `adaptive_limit:${identifier}`;
    
    if (!this.cache) {
      return { allowed: true, limit: adaptiveLimit };
    }

    const current = await this.cache.get(key) || 0;
    
    if (current >= adaptiveLimit) {
      throw new GraphQLError(
        'Adaptive rate limit exceeded',
        'ADAPTIVE_RATE_LIMIT_EXCEEDED',
        429,
        { current, limit: adaptiveLimit, trafficFactor }
      );
    }

    await this.cache.setex(key, this.config.globalWindow / 1000, current + 1);
    
    return {
      allowed: true,
      remaining: adaptiveLimit - current - 1,
      limit: adaptiveLimit,
    };
  }

  /**
   * 화이트리스트 기반 예외 처리                      → 신뢰할 수 있는 클라이언트
   */
  async checkWhitelist(identifier, type = 'ip') {
    const whitelistKey = `whitelist:${type}:${identifier}`;
    
    if (this.cache) {
      const isWhitelisted = await this.cache.get(whitelistKey);
      return !!isWhitelisted;
    }
    
    // 기본 화이트리스트 (환경변수에서 로드 가능)       → 정적 신뢰 목록
    const defaultWhitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
    return defaultWhitelist.includes(identifier);
  }

  /**
   * 레이트 리미팅 우회 (관리자 전용)                 → 관리자 권한 처리
   */
  async bypassRateLimit(identifier, action, adminKey) {
    const expectedKey = process.env.ADMIN_BYPASS_KEY;
    
    if (!expectedKey || adminKey !== expectedKey) {
      throw new GraphQLError(
        'Invalid admin bypass key',
        'INVALID_BYPASS_KEY',
        403
      );
    }

    // 우회 로그 기록                                 → 관리자 활동 추적
    console.info('🔓 RATE LIMIT BYPASS:', {
      timestamp: new Date().toISOString(),
      identifier: this.maskIdentifier(identifier),
      action,
    });

    return { bypassed: true };
  }

  /**
   * 캐시 상태 정리 (메모리 누수 방지)                → 시스템 자원 관리
   */
  async cleanup() {
    if (!this.cache) return;
    
    // 만료된 키들 정리 (Redis에서는 자동으로 처리되지만 명시적 정리)
    const patterns = ['auth_limit:*', 'ip_limit:*', 'user_limit:*', 'suspicious:*'];
    
    for (const pattern of patterns) {
      const keys = this.cache.keys
        ? await this.cache.keys(pattern)
        : (this.cache.scan ? await this.cache.scan(pattern) : []);
      for (const key of keys) {
        const ttl = await this.cache.ttl(key);
        if (ttl <= 0) {
          await this.cache.del(key);
        }
      }
    }
  }

  /**
   * 레이트 리미팅 통계 조회                         → 모니터링 정보 제공
   */
  async getStatistics(identifier = null) {
    if (!this.cache) {
      return { error: 'Cache not available' };
    }

    try {
      const stats = {
        timestamp: new Date().toISOString(),
        global: await this.getGlobalStats(),
      };

      if (identifier) {
        stats.identifier = {
          masked: this.maskIdentifier(identifier),
          auth: await this.getIdentifierStats(identifier, 'auth_limit'),
          ip: await this.getIdentifierStats(identifier, 'ip_limit'),
          user: await this.getIdentifierStats(identifier, 'user_limit'),
        };
      }

      return stats;
    } catch (error) {
      return { error: 'Failed to retrieve statistics' };
    }
  }

  /**
   * 전역 통계 조회                                  → 시스템 전체 현황
   */
  async getGlobalStats() {
    const patterns = ['auth_limit:*', 'ip_limit:*', 'user_limit:*'];
    const stats = {};

    for (const pattern of patterns) {
      const keys = this.cache.keys
        ? await this.cache.keys(pattern)
        : (this.cache.scan ? await this.cache.scan(pattern) : []);
      const type = pattern.replace(':*', '');
      stats[type] = {
        activeKeys: keys.length,
        totalRequests: 0,
      };

      for (const key of keys.slice(0, 100)) { // 성능을 위해 처음 100개만
        const count = await this.cache.get(key) || 0;
        stats[type].totalRequests += parseInt(count);
      }
    }

    return stats;
  }

  /**
   * 개별 식별자 통계 조회                           → 특정 클라이언트 현황
   */
  async getIdentifierStats(identifier, prefix) {
    const pattern = `${prefix}:*${identifier}*`;
    const keys = this.cache.keys
      ? await this.cache.keys(pattern)
      : (this.cache.scan ? await this.cache.scan(pattern) : []);
    
    let totalRequests = 0;
    const keyDetails = [];

    for (const key of keys) {
      const count = await this.cache.get(key) || 0;
      const ttl = await this.cache.ttl(key);
      
      totalRequests += parseInt(count);
      keyDetails.push({
        key: key.replace(identifier, this.maskIdentifier(identifier)),
        count: parseInt(count),
        ttl,
      });
    }

    return {
      totalRequests,
      activeKeys: keys.length,
      details: keyDetails,
    };
  }
}

export default RateLimiting;
