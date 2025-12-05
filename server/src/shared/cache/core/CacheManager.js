/**
 * Base Cache Manager
 * 모든 캐시 매니저의 추상 클래스
 *
 * @description
 * - 공통 캐시 인터페이스 정의
 * - TTL 관리
 * - 키 네이밍 규칙
 * - 에러 처리 및 fallback
 *
 * @author DeliveryVN Development Team
 * @since 2025-01-14
 */

import { logger } from '../../utils/utilities/Logger.js';

export class CacheManager {
  constructor(redis, prefix = '') {
    if (!redis) {
      throw new Error('Redis 클라이언트가 필요합니다');
    }

    this.redis = redis;
    this.prefix = prefix;

    // Redis 클라이언트 타입 확인 및 래핑
    this.detectAndWrapRedisClient();

    this.ttlConfig = this.getTTLConfig();
    this.fallbackStorage = new Map(); // 메모리 기반 fallback
    this.useFallback = false;

    // Redis 연결 상태 모니터링
    this.setupRedisMonitoring();
  }

  /**
   * Redis 클라이언트 타입 감지 및 메서드 래핑
   */
  detectAndWrapRedisClient() {
    // 클라이언트 타입 감지
    const hasLowerCase = typeof this.redis.get === 'function';
    const hasUpperCase = typeof this.redis.GET === 'function';

    logger.debug(`CacheManager:${this.prefix} Redis 클라이언트 감지`, {
      hasLowerCase,
      hasUpperCase,
      clientType: hasLowerCase ? 'ioredis' : hasUpperCase ? 'node-redis v4' : 'unknown'
    });

    // node-redis v4 호환성 래퍼 추가
    if (hasUpperCase && !hasLowerCase) {
      logger.debug(`CacheManager:${this.prefix} node-redis v4 감지, 호환성 래퍼 적용`);

      // 소문자 메서드를 대문자 메서드로 매핑
      this.redis.get = this.redis.GET ? this.redis.GET.bind(this.redis) : undefined;
      this.redis.set = this.redis.SET ? this.redis.SET.bind(this.redis) : undefined;
      this.redis.del = this.redis.DEL ? this.redis.DEL.bind(this.redis) : undefined;
      this.redis.exists = this.redis.EXISTS ? this.redis.EXISTS.bind(this.redis) : undefined;
      this.redis.ttl = this.redis.TTL ? this.redis.TTL.bind(this.redis) : undefined;
      this.redis.expire = this.redis.EXPIRE ? this.redis.EXPIRE.bind(this.redis) : undefined;
      this.redis.incr = this.redis.INCR ? this.redis.INCR.bind(this.redis) : undefined;
      this.redis.keys = this.redis.KEYS ? this.redis.KEYS.bind(this.redis) : undefined;
      this.redis.hset = this.redis.HSET ? this.redis.HSET.bind(this.redis) : undefined;
      this.redis.hget = this.redis.HGET ? this.redis.HGET.bind(this.redis) : undefined;
      this.redis.hgetall = this.redis.HGETALL ? this.redis.HGETALL.bind(this.redis) : undefined;

      // setex는 node-redis v4에서 SET의 옵션으로 처리
      this.redis.setex = async (key, ttl, value) => {
        return this.redis.SET(key, value, { EX: ttl });
      };
    }
  }

  /**
   * TTL 설정 (각 클라이언트가 구현)
   * @abstract
   */
  getTTLConfig() {
    throw new Error('getTTLConfig() 메서드를 구현해야 합니다');
  }

  /**
   * Redis 연결 모니터링 설정
   */
  setupRedisMonitoring() {
    // ioredis 클라이언트인지 확인 (이벤트 리스너 지원)
    if (this.redis.on && typeof this.redis.on === 'function') {
      // Redis 연결이 끊어지면 fallback 모드 활성화
      this.redis.on('error', (error) => {
        logger.error(`CacheManager:${this.prefix} Redis 에러`, { error: error.message });
        this.useFallback = true;
      });

      this.redis.on('connect', () => {
        logger.info(`CacheManager:${this.prefix} Redis 연결됨`);
        this.useFallback = false;
      });

      this.redis.on('close', () => {
        logger.warn(`CacheManager:${this.prefix} Redis 연결 종료 - fallback 모드 활성화`);
        this.useFallback = true;
      });
    } else {
      // Promise 기반 redis 클라이언트 (node-redis v4+)의 경우
      logger.debug(`CacheManager:${this.prefix} Redis 클라이언트 타입: Promise 기반`);
      // Promise 기반 클라이언트는 이미 연결되어 있음
      this.useFallback = false;
    }
  }

  /**
   * 전체 키 생성
   */
  getKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * 캐시 값 조회
   */
  async get(key) {
    const fullKey = this.getKey(key);

    // Fallback 모드일 때 메모리에서 조회
    if (this.useFallback) {
      const value = this.fallbackStorage.get(fullKey);
      if (value && value.expiry > Date.now()) {
        return value.data;
      }
      this.fallbackStorage.delete(fullKey);
      return null;
    }

    try {
      // 래핑된 메서드 사용
      const value = await this.redis.get(fullKey);
      if (value === null) {
        return null;
      }

      const parsed = JSON.parse(value);

      // Fallback 스토리지에도 캐싱
      this.fallbackStorage.set(fullKey, {
        data: parsed,
        expiry: Date.now() + 60000, // 1분 fallback TTL
      });

      return parsed;
    } catch (error) {
      console.error(`[CacheManager:${this.prefix}] GET 에러:`, error.message);

      // 에러 시 fallback에서 조회
      const fallbackValue = this.fallbackStorage.get(fullKey);
      if (fallbackValue && fallbackValue.expiry > Date.now()) {
        return fallbackValue.data;
      }

      return null;
    }
  }

  /**
   * 캐시 값 설정
   */
  async set(key, value, ttl = null) {
    const fullKey = this.getKey(key);
    const serialized = JSON.stringify(value);

    // Fallback 스토리지에 항상 저장
    this.fallbackStorage.set(fullKey, {
      data: value,
      expiry: Date.now() + ((ttl || 300) * 1000),
    });

    // Fallback 모드일 때는 메모리에만 저장
    if (this.useFallback) {
      return true;
    }

    try {
      // 래핑된 메서드 사용
      if (ttl) {
        await this.redis.setex(fullKey, ttl, serialized);
      } else {
        await this.redis.set(fullKey, serialized);
      }
      return true;
    } catch (error) {
      console.error(`[CacheManager:${this.prefix}] SET 에러:`, error.message);
      // Fallback에는 이미 저장됨
      return true;
    }
  }

  /**
   * 캐시 값 삭제
   */
  async delete(key) {
    const fullKey = this.getKey(key);

    // Fallback 스토리지에서도 삭제
    this.fallbackStorage.delete(fullKey);

    if (this.useFallback) {
      return true;
    }

    try {
      // 래핑된 메서드 사용
      const result = await this.redis.del(fullKey);
      return result > 0;
    } catch (error) {
      console.error(`[CacheManager:${this.prefix}] DELETE 에러:`, error.message);
      return true; // Fallback에서는 이미 삭제됨
    }
  }

  /**
   * 패턴으로 캐시 무효화
   */
  async invalidate(pattern) {
    const fullPattern = this.getKey(pattern);

    // Fallback 스토리지에서 패턴 매칭 삭제
    for (const [key] of this.fallbackStorage) {
      if (this.matchPattern(key, fullPattern)) {
        this.fallbackStorage.delete(key);
      }
    }

    if (this.useFallback) {
      return 0;
    }

    try {
      const keys = await this.redis.keys(fullPattern);
      if (keys.length > 0) {
        const result = await this.redis.del(...keys);
        console.log(`[CacheManager:${this.prefix}] 무효화: ${fullPattern} (${keys.length}개)`);
        return result;
      }
      return 0;
    } catch (error) {
      console.error(`[CacheManager:${this.prefix}] INVALIDATE 에러:`, error.message);
      return 0;
    }
  }

  /**
   * 캐시 존재 여부 확인
   */
  async exists(key) {
    const fullKey = this.getKey(key);

    if (this.useFallback) {
      const value = this.fallbackStorage.get(fullKey);
      return value && value.expiry > Date.now();
    }

    try {
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error(`[CacheManager:${this.prefix}] EXISTS 에러:`, error.message);
      return false;
    }
  }

  /**
   * TTL 조회
   */
  async ttl(key) {
    const fullKey = this.getKey(key);

    if (this.useFallback) {
      const value = this.fallbackStorage.get(fullKey);
      if (value && value.expiry > Date.now()) {
        return Math.floor((value.expiry - Date.now()) / 1000);
      }
      return -2;
    }

    try {
      return await this.redis.ttl(fullKey);
    } catch (error) {
      console.error(`[CacheManager:${this.prefix}] TTL 에러:`, error.message);
      return -2;
    }
  }

  /**
   * 원자적 증가
   */
  async incr(key, ttl = null) {
    const fullKey = this.getKey(key);

    if (this.useFallback) {
      const current = this.fallbackStorage.get(fullKey);
      const newValue = (current?.data || 0) + 1;

      this.fallbackStorage.set(fullKey, {
        data: newValue,
        expiry: Date.now() + ((ttl || 300) * 1000),
      });

      return newValue;
    }

    try {
      const result = await this.redis.incr(fullKey);
      if (result === 1 && ttl) {
        await this.redis.expire(fullKey, ttl);
      }
      return result;
    } catch (error) {
      console.error(`[CacheManager:${this.prefix}] INCR 에러:`, error.message);
      return 0;
    }
  }

  /**
   * Hash 값 설정
   */
  async hset(key, field, value, ttl = null) {
    const fullKey = this.getKey(key);
    const serialized = JSON.stringify(value);

    if (this.useFallback) {
      const hash = this.fallbackStorage.get(fullKey) || { data: {}, expiry: 0 };
      hash.data[field] = value;
      hash.expiry = Date.now() + ((ttl || 300) * 1000);
      this.fallbackStorage.set(fullKey, hash);
      return 1;
    }

    try {
      const result = await this.redis.hset(fullKey, field, serialized);
      if (ttl) {
        await this.redis.expire(fullKey, ttl);
      }
      return result;
    } catch (error) {
      console.error(`[CacheManager:${this.prefix}] HSET 에러:`, error.message);
      return 0;
    }
  }

  /**
   * Hash 값 조회
   */
  async hget(key, field) {
    const fullKey = this.getKey(key);

    if (this.useFallback) {
      const hash = this.fallbackStorage.get(fullKey);
      if (hash && hash.expiry > Date.now()) {
        return hash.data[field] || null;
      }
      return null;
    }

    try {
      const value = await this.redis.hget(fullKey, field);
      if (value === null) return null;
      return JSON.parse(value);
    } catch (error) {
      console.error(`[CacheManager:${this.prefix}] HGET 에러:`, error.message);
      return null;
    }
  }

  /**
   * Hash 전체 조회
   */
  async hgetall(key) {
    const fullKey = this.getKey(key);

    if (this.useFallback) {
      const hash = this.fallbackStorage.get(fullKey);
      if (hash && hash.expiry > Date.now()) {
        return hash.data;
      }
      return {};
    }

    try {
      const result = await this.redis.hgetall(fullKey);
      const parsed = {};

      for (const [field, value] of Object.entries(result)) {
        try {
          parsed[field] = JSON.parse(value);
        } catch {
          parsed[field] = value;
        }
      }

      return parsed;
    } catch (error) {
      console.error(`[CacheManager:${this.prefix}] HGETALL 에러:`, error.message);
      return {};
    }
  }

  /**
   * 패턴 매칭 헬퍼
   */
  matchPattern(str, pattern) {
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(str);
  }

  /**
   * 캐시 통계
   */
  async getStats() {
    const stats = {
      prefix: this.prefix,
      useFallback: this.useFallback,
      fallbackSize: this.fallbackStorage.size,
      redisConnected: false,
      keyCount: 0,
    };

    if (!this.useFallback) {
      try {
        const pattern = this.getKey('*');
        const keys = await this.redis.keys(pattern);
        stats.keyCount = keys.length;
        stats.redisConnected = true;
      } catch (error) {
        console.error(`[CacheManager:${this.prefix}] STATS 에러:`, error.message);
      }
    }

    return stats;
  }

  /**
   * Fallback 스토리지 정리
   */
  cleanupFallback() {
    const now = Date.now();
    for (const [key, value] of this.fallbackStorage) {
      if (value.expiry <= now) {
        this.fallbackStorage.delete(key);
      }
    }
  }

  /**
   * 정리 및 종료
   */
  async cleanup() {
    this.fallbackStorage.clear();
    console.log(`[CacheManager:${this.prefix}] 정리 완료`);
  }
}

export default CacheManager;
