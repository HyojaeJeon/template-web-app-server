/**
 * Store Cache Manager
 * Web 전용 캐시 관리 시스템
 *
 * @description
 * - Store 클라이언트 전용 캐시 전략
 * - POS 연동, 통계, 메뉴 관리 등
 * - 실시간성이 중요한 데이터는 짧은 TTL
 *
 * @author DeliveryVN Development Team
 * @since 2025-01-14
 */

import { CacheManager } from '../../core/CacheManager.js';

import { logger } from '../../../utils/utilities/Logger.js';

export class WebCacheManager extends CacheManager {
  constructor(redis) {
    super(redis, 'store:');

    logger.info('웹 캐시 매니저 초기화 완료');
  }

  /**
   * Store 전용 TTL 설정 (초 단위)
   */
  getTTLConfig() {
    return {
      // POS 관련
      POS_CONNECTION: 30,              // 30초 - POS 연결 상태
      POS_SYNC_STATUS: 60,             // 1분 - 동기화 상태

      // 주문 관련
      ACTIVE_ORDERS: 30,                // 30초 - 활성 주문 (실시간)
      ORDER_QUEUE: 60,                  // 1분 - 주문 대기열
      ORDER_HISTORY: 600,               // 10분 - 주문 내역

      // 통계 관련
      DAILY_STATS: 1800,                // 30분 - 일일 통계
      WEEKLY_STATS: 3600,               // 1시간 - 주간 통계
      MONTHLY_STATS: 7200,              // 2시간 - 월간 통계

      // 메뉴 관리
      MENU_LIST: 300,                   // 5분 - 메뉴 목록
      MENU_CATEGORY: 600,               // 10분 - 카테고리
      MENU_ITEM: 600,                   // 10분 - 메뉴 아이템

      // 매장 정보
      STORE_INFO: 3600,                 // 1시간 - 매장 정보
      STORE_SETTINGS: 3600,             // 1시간 - 매장 설정
      STAFF_LIST: 1800,                 // 30분 - 직원 목록

      // 고객 관리
      CUSTOMER_LIST: 600,               // 10분 - 고객 목록
      CUSTOMER_DETAIL: 900,             // 15분 - 고객 상세

      // 정산
      SETTLEMENT_DAILY: 3600,           // 1시간 - 일일 정산
      PAYMENT_SUMMARY: 1800,            // 30분 - 결제 요약
    };
  }

  /**
   * 매장별 전체 캐시 무효화
   */
  async invalidateStoreCache(storeId) {
    if (!storeId) return;

    const patterns = [
      `store:${storeId}:*`,
      `menu:${storeId}:*`,
      `order:store:${storeId}:*`,
      `pos:${storeId}:*`,
      `stats:${storeId}:*`,
    ];

    const results = await Promise.all(
      patterns.map(pattern => this.invalidate(pattern))
    );

    const totalInvalidated = results.reduce((sum, count) => sum + count, 0);
    logger.debug('웹 캐시 무효화', { scope: 'web', storeId, totalInvalidated });

    return totalInvalidated;
  }

  /**
   * POS 관련 캐시 무효화
   */
  async invalidatePOSCache(storeId) {
    const patterns = [
      `pos:${storeId}:*`,
      `order:store:${storeId}:active`,
      `order:store:${storeId}:queue`,
    ];

    const results = await Promise.all(
      patterns.map(pattern => this.invalidate(pattern))
    );

    const totalInvalidated = results.reduce((sum, count) => sum + count, 0);
    logger.debug('웹 POS 캐시 무효화', { storeId, totalInvalidated });

    return totalInvalidated;
  }

  /**
   * 통계 캐시 무효화
   */
  async invalidateStatsCache(storeId, period = 'all') {
    let patterns = [];

    switch (period) {
      case 'daily':
        patterns = [`stats:${storeId}:daily:*`];
        break;
      case 'weekly':
        patterns = [`stats:${storeId}:weekly:*`];
        break;
      case 'monthly':
        patterns = [`stats:${storeId}:monthly:*`];
        break;
      default:
        patterns = [`stats:${storeId}:*`];
    }

    const results = await Promise.all(
      patterns.map(pattern => this.invalidate(pattern))
    );

    const totalInvalidated = results.reduce((sum, count) => sum + count, 0);
    logger.debug('웹 통계 캐시 무효화', { storeId, period, totalInvalidated });

    return totalInvalidated;
  }

  /**
   * 메뉴 변경 시 캐시 무효화
   */
  async invalidateMenuCache(storeId, menuId = null) {
    const patterns = menuId
      ? [`menu:${storeId}:item:${menuId}`, `menu:${storeId}:list`]
      : [`menu:${storeId}:*`];

    const results = await Promise.all(
      patterns.map(pattern => this.invalidate(pattern))
    );

    const totalInvalidated = results.reduce((sum, count) => sum + count, 0);
    logger.debug('웹 메뉴 캐시 무효화', { storeId, menuId: menuId || 'all', totalInvalidated });

    return totalInvalidated;
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
    logger.info('웹 캐시 정리 완료');
  }
}

export default WebCacheManager;
