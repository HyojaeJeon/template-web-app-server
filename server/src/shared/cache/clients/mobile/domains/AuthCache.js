/**
 * Mobile Auth Cache
 * 인증 관련 캐시 관리 (지연 초기화 패턴)
 */

import { userOrderCountLoader, createUserLoader } from '../../../../graphql/dataloaders/authDataLoaders.js';

class AuthCache {
  constructor() {
    this.cacheManager = null;
    this.userLoader = null;
    this.prefix = 'mobile:auth';
    this.isInitialized = false;
  }

  /**
   * 캐시 매니저 초기화 (지연 초기화)
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      const { getMobileCacheManager } = await import('../../../index.js');
      const mobileCacheManager = getMobileCacheManager();
      this.cacheManager = mobileCacheManager;
      this.isInitialized = true;
      console.log('✅ [Auth Cache] 캐시 시스템 연결 완료');
    } catch (error) {
      // 캐시 시스템이 아직 초기화되지 않았을 때는 조용히 실패
      this.isInitialized = false;
    }
  }

  /**
   * 캐시 매니저 가져오기 (자동 초기화)
   */
  async getCacheManager() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.cacheManager;
  }

  /**
   * DataLoader 초기화
   */
  initializeLoaders() {
    this.userLoader = createUserLoader();
  }

  /**
   * 사용자 프로필 캐시 키 생성
   */
  getUserProfileKey(userId) {
    return `${this.prefix}:profile:${userId}`;
  }

  /**
   * 사용자 프로필 캐시 저장
   * TTL: 5분 (자주 변경되는 데이터)
   */
  async cacheUserProfile(userId, profile) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return false;

    try {
      return await cacheManager.profile.setProfile(userId, profile);
    } catch (error) {
      console.error('[Auth Cache] Profile cache save error:', error);
      return false;
    }
  }

  /**
   * 사용자 프로필 캐시 조회
   */
  async getCachedUserProfile(userId) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return null;

    try {
      const cached = await cacheManager.profile.getProfile(userId);
      if (cached) {
        console.log(`[Auth Cache] Profile cache hit for user: ${userId}`);
      }
      return cached;
    } catch (error) {
      console.error('[Auth Cache] Profile cache get error:', error);
      return null;
    }
  }

  /**
   * 사용자 프로필 캐시 무효화
   */
  async invalidateUserProfile(userId) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return;

    try {
      await cacheManager.profile.invalidateProfile(userId);
      // DataLoader 캐시도 무효화
      if (this.userLoader) {
        this.userLoader.clear(userId);
      }
    } catch (error) {
      console.error('[Auth Cache] Profile cache invalidate error:', error);
    }
  }

  /**
   * 토큰 검증 결과 캐시
   * TTL: 1분 (짧은 시간만 유지)
   */
  async cacheTokenValidation(token, result) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return false;

    try {
      const key = `${this.prefix}:token:${token.substring(0, 20)}`;
      return await cacheManager.set(key, result, 60); // 1분
    } catch (error) {
      console.error('[Auth Cache] Token validation cache error:', error);
      return false;
    }
  }

  /**
   * 토큰 검증 결과 조회
   */
  async getCachedTokenValidation(token) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return null;

    try {
      const key = `${this.prefix}:token:${token.substring(0, 20)}`;
      return await cacheManager.get(key);
    } catch (error) {
      console.error('[Auth Cache] Token validation get error:', error);
      return null;
    }
  }

  /**
   * OTP 시도 횟수 관리
   * TTL: 10분
   */
  async incrementOTPAttempts(phone) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return 0;

    try {
      const key = `${this.prefix}:otp:attempts:${phone}`;
      const current = await cacheManager.get(key) || 0;
      const newCount = current + 1;
      await cacheManager.set(key, newCount, 600); // 10분
      return newCount;
    } catch (error) {
      console.error('[Auth Cache] OTP attempts increment error:', error);
      return 0;
    }
  }

  /**
   * OTP 시도 횟수 조회
   */
  async getOTPAttempts(phone) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return 0;

    try {
      const key = `${this.prefix}:otp:attempts:${phone}`;
      return await cacheManager.get(key) || 0;
    } catch (error) {
      console.error('[Auth Cache] OTP attempts get error:', error);
      return 0;
    }
  }

  /**
   * OTP 시도 횟수 초기화
   */
  async resetOTPAttempts(phone) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return;

    try {
      const key = `${this.prefix}:otp:attempts:${phone}`;
      await cacheManager.delete(key);
    } catch (error) {
      console.error('[Auth Cache] OTP attempts reset error:', error);
    }
  }

  /**
   * Rate Limiting - 로그인 시도
   * TTL: 15분
   */
  async incrementLoginAttempts(identifier) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return 0;

    try {
      const key = `${this.prefix}:login:attempts:${identifier}`;
      const current = await cacheManager.get(key) || 0;
      const newCount = current + 1;
      await cacheManager.set(key, newCount, 900); // 15분
      return newCount;
    } catch (error) {
      console.error('[Auth Cache] Login attempts increment error:', error);
      return 0;
    }
  }

  /**
   * 로그인 시도 횟수 조회
   */
  async getLoginAttempts(identifier) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return 0;

    try {
      const key = `${this.prefix}:login:attempts:${identifier}`;
      return await cacheManager.get(key) || 0;
    } catch (error) {
      console.error('[Auth Cache] Login attempts get error:', error);
      return 0;
    }
  }

  /**
   * 로그인 시도 횟수 초기화
   */
  async resetLoginAttempts(identifier) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return;

    try {
      const key = `${this.prefix}:login:attempts:${identifier}`;
      await cacheManager.delete(key);
    } catch (error) {
      console.error('[Auth Cache] Login attempts reset error:', error);
    }
  }

  /**
   * 전화번호 중복 확인 캐시
   * TTL: 10분
   */
  async cachePhoneCheck(phone, exists) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return false;

    try {
      const key = `${this.prefix}:phone:check:${phone}`;
      return await cacheManager.set(key, exists, 600); // 10분
    } catch (error) {
      console.error('[Auth Cache] Phone check cache error:', error);
      return false;
    }
  }

  /**
   * 전화번호 중복 확인 캐시 조회
   */
  async getCachedPhoneCheck(phone) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return null;

    try {
      const key = `${this.prefix}:phone:check:${phone}`;
      return await cacheManager.get(key);
    } catch (error) {
      console.error('[Auth Cache] Phone check get error:', error);
      return null;
    }
  }

  /**
   * 세션 관련 캐시 모두 삭제 (로그아웃 시)
   */
  async clearUserSession(userId) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return;

    try {
      const pattern = `*:${userId}`;
      await cacheManager.invalidate(pattern);

      // DataLoader 캐시 초기화
      if (this.userLoader) {
        this.userLoader.clear(userId);
      }
    } catch (error) {
      console.error('[Auth Cache] Clear session error:', error);
    }
  }

  /**
   * OTP 마지막 전송 시간 저장
   * TTL: 10분
   */
  async setLastOtpTime(phone, timestamp = Date.now()) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return false;

    try {
      const key = `${this.prefix}:otp:lasttime:${phone}`;
      return await cacheManager.set(key, timestamp, 600); // 10분
    } catch (error) {
      console.error('[Auth Cache] OTP last time set error:', error);
      return false;
    }
  }

  /**
   * OTP 마지막 전송 시간 조회
   */
  async getLastOtpTime(phone) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return null;

    try {
      const key = `${this.prefix}:otp:lasttime:${phone}`;
      return await cacheManager.get(key);
    } catch (error) {
      console.error('[Auth Cache] OTP last time get error:', error);
      return null;
    }
  }

  /**
   * OTP 코드 저장
   * TTL: 5분
   */
  async setOTPCode(phone, code, expiresAt) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return false;

    try {
      const key = `${this.prefix}:otp:code:${phone}`;
      const otpData = { code, expiresAt, phone };
      return await cacheManager.set(key, otpData, 300); // 5분
    } catch (error) {
      console.error('[Auth Cache] OTP code set error:', error);
      return false;
    }
  }

  /**
   * OTP 코드 조회
   */
  async getOTPCode(phone) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return null;

    try {
      const key = `${this.prefix}:otp:code:${phone}`;
      return await cacheManager.get(key);
    } catch (error) {
      console.error('[Auth Cache] OTP code get error:', error);
      return null;
    }
  }

  /**
   * OTP 코드 삭제 (사용 후)
   */
  async deleteOTPCode(phone) {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return;

    try {
      const key = `${this.prefix}:otp:code:${phone}`;
      await cacheManager.delete(key);
    } catch (error) {
      console.error('[Auth Cache] OTP code delete error:', error);
    }
  }

  /**
   * 통계 정보 조회
   */
  async getStats() {
    const cacheManager = await this.getCacheManager();
    if (!cacheManager) return null;

    try {
      return await cacheManager.getStats();
    } catch (error) {
      console.error('[Auth Cache] Get stats error:', error);
      return null;
    }
  }
}

// 싱글톤 인스턴스
const authCache = new AuthCache();
authCache.initializeLoaders();

export default authCache;