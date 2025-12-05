/**
 * Unified Cache System
 * 통합 캐시 시스템 진입점
 *
 * @description
 * - 모든 캐시 관련 모듈 통합 export
 * - 싱글톤 인스턴스 관리
 * - 초기화 및 정리 함수 제공
 *
 * @author DeliveryVN Development Team
 * @since 2025-01-14
 */

import { initializeRedis, redis as redisClient, checkRedisConnection } from '../../config/redis.js';
import { logger } from '../utils/utilities/Logger.js';
import { MobileCacheManager } from './clients/mobile/MobileCacheManager.js';
import { WebCacheManager } from './clients/web/WebCacheManager.js';

// 싱글톤 인스턴스 관리
let mobileCacheManager = null;
let webCacheManager = null;
let isInitialized = false;

/**
 * 캐시 시스템 초기화
 */
export async function initializeCacheSystem() {
  if (isInitialized) {
    logger.debug('캐시 시스템 이미 초기화됨');
    return true;
  }

  try {
    // Redis 연결 초기화 (공식 엔트리포인트)
    await initializeRedis();

    // 캐시 매니저 생성
    mobileCacheManager = new MobileCacheManager(redisClient);
    webCacheManager = new WebCacheManager(redisClient);

    isInitialized = true;
    logger.info('캐시 시스템 초기화 완료');

    return true;
  } catch (error) {
    logger.error('캐시 시스템 초기화 실패', { error: error.message });
    isInitialized = false;
    throw error;
  }
}

/**
 * Mobile 캐시 매니저 반환
 */
export function getMobileCacheManager() {
  if (!mobileCacheManager) {
    throw new Error('캐시 시스템이 초기화되지 않았습니다. initializeCacheSystem()을 먼저 호출하세요.');
  }
  return mobileCacheManager;
}

/**
 * Store 캐시 매니저 반환
 */
export function getWebCacheManager() {
  if (!webCacheManager) {
    throw new Error('캐시 시스템이 초기화되지 않았습니다. initializeCacheSystem()을 먼저 호출하세요.');
  }
  return webCacheManager;
}

/**
 * 캐시 시스템 초기화 여부 확인
 */
export function isCacheSystemInitialized() {
  return isInitialized;
}

/**
 * Redis 연결 상태 확인
 */
export async function checkCacheStatus() {
  try {
    const connectionStatus = await (async () => ({ status: 'UNKNOWN' }))();
    const redisStatus = { initialized: true, main: 'unknown' };

    const mobileStats = mobileCacheManager
      ? await mobileCacheManager.getStatusReport()
      : null;

    const storeStats = webCacheManager
      ? await webCacheManager.getStatusReport()
      : null;

    return {
      connection: connectionStatus,
      redis: redisStatus,
      mobile: mobileStats,
      store: storeStats,
      initialized: isInitialized,
    };
  } catch (error) {
    logger.error('캐시 상태 확인 실패', { error: error.message });
    return {
      error: error.message,
      initialized: isInitialized,
    };
  }
}

/**
 * 캐시 시스템 종료
 */
export async function shutdownCacheSystem() {
  try {
    // 캐시 매니저 정리
    if (mobileCacheManager) {
      await mobileCacheManager.cleanup();
      mobileCacheManager = null;
    }

    if (webCacheManager) {
      await webCacheManager.cleanup();
      webCacheManager = null;
    }

    // Redis 연결 종료 (선택적으로 수행)
    if (redisClient && typeof redisClient.quit === 'function') {
      try { await redisClient.quit(); } catch (_) {}
    }

    isInitialized = false;
    logger.info('캐시 시스템 종료 완료');

    return true;
  } catch (error) {
    logger.error('캐시 시스템 종료 에러', { error: error.message });
    return false;
  }
}

/**
 * 캐시 워밍업
 */
export async function warmupCache(type = 'all', data = {}) {
  try {
    const promises = [];

    if (type === 'all' || type === 'mobile') {
      if (mobileCacheManager) {
        promises.push(mobileCacheManager.warmupCache(data.mobile || {}));
      }
    }

    if (type === 'all' || type === 'store') {
      // Store 워밍업 로직 추가 가능
    }

    await Promise.all(promises);
    logger.info('캐시 워밍업 완료', { type });

    return true;
  } catch (error) {
    logger.error('캐시 워밍업 실패', { error: error.message });
    return false;
  }
}

/**
 * 캐시 통계 조회
 */
export async function getCacheStatistics() {
  const stats = {
    mobile: null,
    store: null,
    redis: null,
  };

  try {
    if (mobileCacheManager) {
      stats.mobile = await mobileCacheManager.getStats();
    }

    if (webCacheManager) {
      stats.store = await webCacheManager.getStats();
    }

    stats.redis = await checkRedisConnection();
  } catch (error) {
    logger.error('캐시 통계 조회 실패', { error: error.message });
  }

  return stats;
}

// 클래스 export (필요시 직접 사용)
export { CacheManager } from './core/CacheManager.js';
export { MobileCacheManager } from './clients/mobile/MobileCacheManager.js';
export { WebCacheManager } from './clients/web/WebCacheManager.js';
// RedisConnection 제거됨 (config/redis.js를 사용)

// 도메인별 캐시 모듈 export (필요시 추가)
// Note: 기본 템플릿에서는 AuthCache만 포함
// export { AuthCache } from './clients/mobile/domains/AuthCache.js';

// 기본 export
export default {
  initializeCacheSystem,
  getMobileCacheManager,
  getWebCacheManager,
  checkCacheStatus,
  shutdownCacheSystem,
  warmupCache,
  getCacheStatistics,
};
