/**
 * Mobile Cache Manager
 * 모바일앱 전용 캐시 관리 시스템
 *
 * @description
 * - Mobile 클라이언트 전용 캐시 전략
 * - TTL 및 무효화 정책 관리
 * - 도메인별 캐시 모듈은 필요시 추가
 *
 * @author Template Project
 * @since 2025-01-14
 */

import { CacheManager } from '../../core/CacheManager.js';
import { logger } from '../../../utils/utilities/Logger.js';

export class MobileCacheManager extends CacheManager {
  constructor(redis) {
    super(redis, 'mobile:');
    logger.info('모바일 캐시 매니저 초기화 완료');
  }

  /**
   * Mobile 전용 TTL 설정 (초 단위)
   */
  getTTLConfig() {
    return {
      // 사용자 관련
      USER_PROFILE: 1800,              // 30분 - 사용자 프로필
      USER_SETTINGS: 3600,             // 1시간 - 설정
      USER_SESSION: 86400,             // 24시간 - 세션

      // 인증 관련
      AUTH_TOKEN: 3600,                // 1시간 - 인증 토큰
      REFRESH_TOKEN: 604800,           // 7일 - 리프레시 토큰

      // 일반
      CACHE_DEFAULT: 300,              // 5분 - 기본 캐시
    };
  }

  /**
   * 사용자별 전체 캐시 무효화
   */
  async invalidateUserCache(userId) {
    if (!userId) return 0;

    const patterns = [
      `user:${userId}:*`,
      `auth:${userId}:*`,
    ];

    const results = await Promise.all(
      patterns.map(pattern => this.invalidate(pattern))
    );

    const totalInvalidated = results.reduce((sum, count) => sum + count, 0);
    logger.debug('모바일 사용자 캐시 무효화', { userId, totalInvalidated });

    return totalInvalidated;
  }

  /**
   * 캐시 워밍업 - 자주 사용되는 데이터 미리 캐싱
   */
  async warmupCache(data = {}) {
    // 필요시 워밍업 로직 추가
    logger.info('모바일 캐시 워밍업 완료');
  }

  /**
   * 캐시 상태 리포트
   */
  async getStatusReport() {
    const baseStats = await this.getStats();

    return {
      ...baseStats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 정리 및 종료
   */
  async cleanup() {
    await super.cleanup();
    logger.info('모바일 캐시 정리 완료');
  }
}

export default MobileCacheManager;
