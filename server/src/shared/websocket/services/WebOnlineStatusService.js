/**
 * 점주 온라인 상태 추적 서비스
 * - Redis를 사용한 실시간 온라인 상태 관리
 * - 점주 접속/종료 시 고객들에게 실시간 알림
 * - 마지막 접속 시간 추적
 */

import kv from '../../cache/kv.js';
import { CACHE_TTL } from '../../cache/constants.js';
import logger from '../../utils/utilities/Logger.js';

class StoreOnlineStatusService {
  constructor(io) {
    this.io = io;
    // 점주 온라인 상태를 메모리에도 캐싱 (빠른 조회)
    this.onlineStores = new Map(); // storeId -> { lastSeenAt, socketIds: Set }
  }

  /**
   * 점주 접속 처리
   * @param {number} storeId - 매장 ID
   * @param {string} socketId - Socket ID
   */
  async handleStoreConnect(storeId, socketId) {
    try {
      const now = new Date().toISOString();

      // 메모리 캐시 업데이트
      if (!this.onlineStores.has(storeId)) {
        this.onlineStores.set(storeId, {
          lastSeenAt: now,
          socketIds: new Set([socketId])
        });
      } else {
        const storeData = this.onlineStores.get(storeId);
        storeData.socketIds.add(socketId);
        storeData.lastSeenAt = now;
      }

      // Redis에 온라인 상태 저장 (24시간 TTL)
      const redisKey = `store:${storeId}:online`;
      await kv.setex(redisKey, CACHE_TTL.DAY1, JSON.stringify({
        isOnline: true,
        lastSeenAt: now,
        socketCount: this.onlineStores.get(storeId).socketIds.size
      }));

      // 해당 매장을 채팅 중인 고객들에게 알림
      await this.broadcastStoreStatus(storeId, true, now);

      logger.info('✅ [StoreOnline] 점주 접속', {
        storeId,
        socketId,
        socketCount: this.onlineStores.get(storeId).socketIds.size
      });
    } catch (error) {
      logger.error('❌ [StoreOnline] 접속 처리 실패:', error);
    }
  }

  /**
   * 점주 종료 처리
   * @param {number} storeId - 매장 ID
   * @param {string} socketId - Socket ID
   */
  async handleStoreDisconnect(storeId, socketId) {
    try {
      const now = new Date().toISOString();

      if (!this.onlineStores.has(storeId)) {
        return; // 이미 처리됨
      }

      const storeData = this.onlineStores.get(storeId);
      storeData.socketIds.delete(socketId);
      storeData.lastSeenAt = now;

      // 모든 소켓이 종료되었는지 확인
      const isStillOnline = storeData.socketIds.size > 0;

      if (!isStillOnline) {
        // 완전히 오프라인
        this.onlineStores.delete(storeId);

        // Redis 업데이트
        const redisKey = `store:${storeId}:online`;
        await kv.setex(redisKey, CACHE_TTL.DAY1, JSON.stringify({
          isOnline: false,
          lastSeenAt: now,
          socketCount: 0
        }));

        // 고객들에게 오프라인 알림
        await this.broadcastStoreStatus(storeId, false, now);

        logger.info('🔴 [StoreOnline] 점주 완전 종료', {
          storeId,
          socketId,
          lastSeenAt: now
        });
      } else {
        // 아직 다른 소켓이 연결되어 있음 (다중 탭)
        const redisKey = `store:${storeId}:online`;
        await kv.setex(redisKey, CACHE_TTL.DAY1, JSON.stringify({
          isOnline: true,
          lastSeenAt: now,
          socketCount: storeData.socketIds.size
        }));

        logger.info('⚠️ [StoreOnline] 점주 일부 종료 (다중 연결)', {
          storeId,
          socketId,
          remainingSockets: storeData.socketIds.size
        });
      }
    } catch (error) {
      logger.error('❌ [StoreOnline] 종료 처리 실패:', error);
    }
  }

  /**
   * 점주 온라인 상태를 고객들에게 브로드캐스트
   * @param {number} storeId - 매장 ID
   * @param {boolean} isOnline - 온라인 여부
   * @param {string} lastSeenAt - 마지막 접속 시간
   */
  async broadcastStoreStatus(storeId, isOnline, lastSeenAt) {
    try {
      // 해당 매장과 채팅 중인 고객들에게 이벤트 발송
      this.io.to(`store:${storeId}`).emit('store:online:status', {
        storeId,
        isOnline,
        lastSeenAt,
        timestamp: new Date().toISOString()
      });

      logger.info('📡 [StoreOnline] 상태 브로드캐스트', {
        storeId,
        isOnline,
        room: `store:${storeId}`
      });
    } catch (error) {
      logger.error('❌ [StoreOnline] 브로드캐스트 실패:', error);
    }
  }

  /**
   * 점주 온라인 상태 조회 (외부 API용)
   * @param {number} storeId - 매장 ID
   * @returns {Promise<{isOnline: boolean, lastSeenAt: string}>}
   */
  async getStoreOnlineStatus(storeId) {
    try {
      // 메모리 캐시 우선 확인
      if (this.onlineStores.has(storeId)) {
        const storeData = this.onlineStores.get(storeId);
        return {
          isOnline: true,
          lastSeenAt: storeData.lastSeenAt,
          socketCount: storeData.socketIds.size
        };
      }

      // Redis에서 조회
      const redisKey = `store:${storeId}:online`;
      const cached = await kv.get(redisKey);

      if (cached) {
        return JSON.parse(cached);
      }

      // 데이터 없음 - 오프라인으로 간주
      return {
        isOnline: false,
        lastSeenAt: null,
        socketCount: 0
      };
    } catch (error) {
      logger.error('❌ [StoreOnline] 상태 조회 실패:', error);
      return {
        isOnline: false,
        lastSeenAt: null,
        socketCount: 0
      };
    }
  }

  /**
   * 여러 매장의 온라인 상태 일괄 조회
   * @param {number[]} storeIds - 매장 ID 배열
   * @returns {Promise<Map<number, {isOnline: boolean, lastSeenAt: string}>>}
   */
  async getBulkStoreOnlineStatus(storeIds) {
    try {
      const results = new Map();

      for (const storeId of storeIds) {
        const status = await this.getStoreOnlineStatus(storeId);
        results.set(storeId, status);
      }

      return results;
    } catch (error) {
      logger.error('❌ [StoreOnline] 일괄 조회 실패:', error);
      return new Map();
    }
  }

  /**
   * 점주 하트비트 (주기적 연결 확인)
   * @param {number} storeId - 매장 ID
   */
  async updateHeartbeat(storeId) {
    try {
      const now = new Date().toISOString();

      if (this.onlineStores.has(storeId)) {
        const storeData = this.onlineStores.get(storeId);
        storeData.lastSeenAt = now;

        // Redis 업데이트
        const redisKey = `store:${storeId}:online`;
        await kv.setex(redisKey, CACHE_TTL.DAY1, JSON.stringify({
          isOnline: true,
          lastSeenAt: now,
          socketCount: storeData.socketIds.size
        }));
      }
    } catch (error) {
      logger.error('❌ [StoreOnline] 하트비트 실패:', error);
    }
  }
}

export default StoreOnlineStatusService;
