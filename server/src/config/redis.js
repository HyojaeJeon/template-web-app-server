/**
 * Redis 캐싱 전략 고도화
 * Local App MVP를 위한 성능 최적화
 */

import Redis from 'ioredis';
import { logger as appLogger } from '../shared/utils/utilities/Logger.js';
import { redisConfig as envRedisConfig } from './env.js';

const logger = {
  info: (msg, meta) => appLogger.info(msg, meta),
  error: (msg, meta) => appLogger.error(msg, meta),
  warn: (msg, meta) => appLogger.warn(msg, meta),
  debug: (msg, meta) => appLogger.debug(msg, meta),
};

// Redis 연결 설정 - 환경별 설정 사용
const createRedisConnection = (config = {}) => {
  // 단일 진실 원천: lazyConnect 기본 true (명시적 연결 제어)
  const defaultConfig = {
    host: envRedisConfig.host,
    port: envRedisConfig.port,
    password: envRedisConfig.password,
    db: envRedisConfig.db,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    lazyConnect: true,
    connectTimeout: 5000,
    commandTimeout: 3000,
    // Redis 인증 강화
    authPass: envRedisConfig.password,
    ...config,
  };

  // 중복 옵션 제거, defaultConfig만 사용
  const redis = new Redis({
    ...defaultConfig,
  });

  // 연결 이벤트 처리
  redis.on('connect', () => {
    logger.info('✅ Redis 캐시 서버 연결됨', {
      host: defaultConfig.host,
      port: defaultConfig.port,
      db: defaultConfig.db,
    });
  });

  redis.on('error', (error) => {
    logger.error('❌ Redis 연결 오류:', { error: error.message });
  });

  redis.on('close', () => {
    logger.warn('⚠️ Redis 연결이 닫혔습니다');
  });

  return redis;
};

// Redis 인스턴스들
export const redis = createRedisConnection();
export const redisPub = createRedisConnection(); // Pub/Sub용
export const redisSub = createRedisConnection(); // Pub/Sub용
export const redisClient = redis; // 호환성을 위한 별칭

// Redis 연결 초기화
export const initializeRedis = async () => {
  try {
    // Redis가 이미 연결되어 있으면 연결을 시도하지 않음
    if (redis.status === 'ready') {
      logger.info('Redis already connected');
      return true;
    }

    if (redis.status === 'connecting') {
      logger.info('Redis is already connecting, waiting...');
      // 연결 완료까지 최대 5초 대기
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Redis connection timeout'));
        }, 5000);

        redis.once('ready', () => {
          clearTimeout(timeout);
          resolve();
        });

        redis.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
      return true;
    }

    // 새로운 연결 시도
    await redis.connect();
    logger.info('Redis connection established successfully');
    return true;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    return false;
  }
};

// Redis 연결 상태 확인
export const checkRedisConnection = async () => {
  try {
    const startTime = Date.now();
    await redis.ping();
    const responseTime = Date.now() - startTime;

    return {
      status: 'OK',
      responseTime,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'DOWN',
      responseTime: -1,
      lastCheck: new Date().toISOString(),
      error: error.message,
    };
  }
};

// 캐싱 전략 상수
export const CACHE_KEYS = {
  USER_PROFILE: (userId) => `user:profile:${userId}`,
  USER_ADDRESSES: (userId) => `user:addresses:${userId}`,
  STORE_DETAILS: (storeId) => `store:${storeId}`,
  STORE_MENU: (storeId) => `store:menu:${storeId}`,
  STORE_AVAILABILITY: (storeId) => `store:available:${storeId}`,
  MENU_ITEM: (itemId) => `menu:item:${itemId}`,
  ORDER_STATUS: (orderId) => `order:status:${orderId}`,
  POS_CONNECTION: (storeId) => `pos:connection:${storeId}`,
  SESSION: (sessionId) => `session:${sessionId}`,
  RATE_LIMIT: (key) => `rate_limit:${key}`,
};

// 캐싱 TTL 설정 (초 단위)
export const CACHE_TTL = {
  SHORT: 60, // 1분
  MEDIUM: 300, // 5분
  LONG: 1800, // 30분
  EXTENDED: 3600, // 1시간
  DAILY: 86400, // 24시간
  WEEKLY: 604800, // 7일
};

// 캐시 래퍼 클래스
export class CacheService {
  constructor(client = redisClient) {
    this.client = client;
  }

  // 값 설정
  async set(key, value, ttl = CACHE_TTL.MEDIUM) {
    try {
      const serializedValue = JSON.stringify(value);
      await this.client.setex(key, ttl, serializedValue);
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  // 값 조회
  async get(key) {
    try {
      const value = await this.client.get(key);
      if (value === null) {
        logger.debug(`Cache miss: ${key}`);
        return null;
      }

      logger.debug(`Cache hit: ${key}`);
      return JSON.parse(value);
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  // 값 삭제
  async del(key) {
    try {
      const result = await this.client.del(key);
      logger.debug(`Cache deleted: ${key}`);
      return result > 0;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  // 패턴으로 키 삭제
  async delPattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        const result = await this.client.del(keys);
        logger.debug(`Cache pattern deleted: ${pattern} (${keys.length} keys)`);
        return result;
      }
      return 0;
    } catch (error) {
      logger.error(`Cache pattern delete error for ${pattern}:`, error);
      return 0;
    }
  }

  // 값 존재 확인
  async exists(key) {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists check error for key ${key}:`, error);
      return false;
    }
  }

  // TTL 조회
  async ttl(key) {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error);
      return -2;
    }
  }

  // 원자적 증가
  async incr(key, ttl = CACHE_TTL.MEDIUM) {
    try {
      const result = await this.client.incr(key);
      if (result === 1) {
        // 첫 번째 증가인 경우 TTL 설정
        await this.client.expire(key, ttl);
      }
      return result;
    } catch (error) {
      logger.error(`Cache incr error for key ${key}:`, error);
      return 0;
    }
  }

  // 지정된 시간만큼 증가
  async incrBy(key, increment, ttl = CACHE_TTL.MEDIUM) {
    try {
      const result = await this.client.incrBy(key, increment);
      if (result === increment) {
        await this.client.expire(key, ttl);
      }
      return result;
    } catch (error) {
      logger.error(`Cache incrBy error for key ${key}:`, error);
      return 0;
    }
  }

  // Set 자료구조 - 멤버 추가
  async sadd(key, member, ttl = CACHE_TTL.MEDIUM) {
    try {
      const result = await this.client.sAdd(key, member);
      if (result > 0) {
        await this.client.expire(key, ttl);
      }
      return result;
    } catch (error) {
      logger.error(`Cache sadd error for key ${key}:`, error);
      return 0;
    }
  }

  // Set 자료구조 - 멤버 조회
  async smembers(key) {
    try {
      return await this.client.sMembers(key);
    } catch (error) {
      logger.error(`Cache smembers error for key ${key}:`, error);
      return [];
    }
  }

  // Hash 자료구조 - 필드 설정
  async hset(key, field, value, ttl = CACHE_TTL.MEDIUM) {
    try {
      const serializedValue = JSON.stringify(value);
      const result = await this.client.hSet(key, field, serializedValue);
      if (result > 0) {
        await this.client.expire(key, ttl);
      }
      return result;
    } catch (error) {
      logger.error(`Cache hset error for key ${key}, field ${field}:`, error);
      return 0;
    }
  }

  // Hash 자료구조 - 필드 조회
  async hget(key, field) {
    try {
      const value = await this.client.hGet(key, field);
      if (value === null) return null;
      return JSON.parse(value);
    } catch (error) {
      logger.error(`Cache hget error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  // Hash 자료구조 - 전체 조회
  async hgetall(key) {
    try {
      const result = await this.client.hGetAll(key);
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
      logger.error(`Cache hgetall error for key ${key}:`, error);
      return {};
    }
  }

  // 캐시 상태 정보
  async getStats() {
    try {
      const info = await this.client.info();
      return {
        connected: this.client.isReady,
        info,
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return { connected: false, info: null };
    }
  }
}

// 기본 캐시 서비스 인스턴스
export const cacheService = new CacheService(redis);

// Redis 클라이언트 내보내기 (직접 접근이 필요한 경우)
export default redis;
export const getRedisClient = async () => redis;
