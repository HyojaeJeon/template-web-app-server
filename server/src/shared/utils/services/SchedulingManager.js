/**
 * 스케줄링 관리자
 * 모든 스케줄링 서비스와 배치 작업을 통합 관리
 */

import { SchedulingService } from './SchedulingService.js';
import { BatchProcessor } from './BatchProcessor.js';

export class SchedulingManager {
  constructor(container) {
    this.container = container;
    this.logger = container.resolve('logger');
    this.schedulingService = new SchedulingService(container);
    this.batchProcessor = new BatchProcessor(container);
    this.isInitialized = false;
    this.jobRegistry = new Map();
  }

  /**
   * 스케줄링 매니저 초기화
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.info('[SchedulingManager] 스케줄링 매니저를 초기화합니다...');

      // BatchProcessor를 컨테이너에 등록
      this.container.register('batchProcessor', this.batchProcessor);

      // 스케줄링 서비스 초기화
      await this.schedulingService.initialize();

      // 배치 작업 클래스들을 등록
      await this._registerBatchJobs();

      // 동적 스케줄 등록
      await this._registerDynamicSchedules();

      this.isInitialized = true;
      this.logger.info('[SchedulingManager] 스케줄링 매니저 초기화가 완료되었습니다.');
    } catch (error) {
      this.logger.error('[SchedulingManager] 스케줄링 매니저 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 배치 작업 클래스들을 컨테이너에 등록
   */
  async _registerBatchJobs() {
    try {
      // 동적 import로 배치 작업 클래스들 로드
      const { LoyaltyBatchJobs } = await import('../../../features/notification/infrastructure/batch/LoyaltyBatchJobs.js');
      const { NotificationBatchJobs } = await import('../../../features/notification/infrastructure/batch/NotificationBatchJobs.js');

      // 컨테이너에 등록
      this.container.register('loyaltyBatchJobs', new LoyaltyBatchJobs(this.container));
      this.container.register('notificationBatchJobs', new NotificationBatchJobs(this.container));

      this.logger.info('[SchedulingManager] 배치 작업 클래스들이 등록되었습니다.');
    } catch (error) {
      this.logger.error('[SchedulingManager] 배치 작업 클래스 등록 실패:', error);
      throw error;
    }
  }

  /**
   * 동적 스케줄 등록 (데이터베이스 기반)
   */
  async _registerDynamicSchedules() {
    try {
      // 이벤트 기반 동적 스케줄들 등록
      await this._registerEventBasedSchedules();
      
      // 프로모션 기반 동적 스케줄들 등록
      await this._registerPromotionBasedSchedules();
      
      this.logger.info('[SchedulingManager] 동적 스케줄들이 등록되었습니다.');
    } catch (error) {
      this.logger.warn('[SchedulingManager] 동적 스케줄 등록 일부 실패:', error);
    }
  }

  /**
   * 이벤트 기반 동적 스케줄 등록
   */
  async _registerEventBasedSchedules() {
    try {
      const eventService = this.container.resolve('eventService');
      const upcomingEvents = await eventService.getUpcomingEvents();
      
      for (const event of upcomingEvents) {
        // 이벤트 시작 1시간 전 알림
        if (event.startTime) {
          const startNotifyTime = new Date(event.startTime);
          startNotifyTime.setHours(startNotifyTime.getHours() - 1);
          
          this.scheduleOneTimeJob(`event_start_notify_${event.id}`, startNotifyTime, async () => {
            await this._handleEventStartNotification(event);
          });
        }

        // 이벤트 종료 알림
        if (event.endTime) {
          this.scheduleOneTimeJob(`event_end_${event.id}`, event.endTime, async () => {
            await this._handleEventEnd(event);
          });
        }
      }
    } catch (error) {
      this.logger.error('[SchedulingManager] 이벤트 기반 스케줄 등록 실패:', error);
    }
  }

  /**
   * 프로모션 기반 동적 스케줄 등록
   */
  async _registerPromotionBasedSchedules() {
    try {
      const couponService = this.container.resolve('couponService');
      const activeCoupons = await couponService.getActiveCoupons();
      
      for (const coupon of activeCoupons) {
        // 쿠폰 만료 1일 전 알림
        if (coupon.expiresAt) {
          const expiryNotifyTime = new Date(coupon.expiresAt);
          expiryNotifyTime.setDate(expiryNotifyTime.getDate() - 1);
          
          this.scheduleOneTimeJob(`coupon_expiry_notify_${coupon.id}`, expiryNotifyTime, async () => {
            await this._handleCouponExpiryNotification(coupon);
          });
        }
      }
    } catch (error) {
      this.logger.error('[SchedulingManager] 프로모션 기반 스케줄 등록 실패:', error);
    }
  }

  /**
   * 일회성 작업 스케줄 등록
   *
   * @param jobId
   * @param executeTime
   * @param taskFunction
   */
  scheduleOneTimeJob(jobId, executeTime, taskFunction) {
    const now = new Date();
    
    if (executeTime <= now) {
      this.logger.warn(`[SchedulingManager] 과거 시간으로 스케줄 시도: ${jobId} (${executeTime})`);
      return;
    }

    const delay = executeTime.getTime() - now.getTime();
    
    const timeoutId = setTimeout(async () => {
      try {
        this.logger.info(`[SchedulingManager] 일회성 작업 실행: ${jobId}`);
        await taskFunction();
        this.jobRegistry.delete(jobId);
      } catch (error) {
        this.logger.error(`[SchedulingManager] 일회성 작업 실패: ${jobId}`, error);
      }
    }, delay);

    this.jobRegistry.set(jobId, {
      type: 'ONE_TIME',
      timeoutId,
      executeTime,
      createdAt: now,
    });

    this.logger.info(`[SchedulingManager] 일회성 작업 예약: ${jobId} (${executeTime.toISOString()})`);
  }

  /**
   * 즉시 배치 작업 실행
   *
   * @param jobType
   * @param jobConfig
   */
  async executeImmediateBatchJob(jobType, jobConfig = {}) {
    try {
      this.logger.info(`[SchedulingManager] 즉시 배치 작업 실행: ${jobType}`);
      
      switch (jobType) {
      case 'LOYALTY_POINTS_EXPIRY': {
        const loyaltyBatchJobs = this.container.resolve('loyaltyBatchJobs');
        return await loyaltyBatchJobs.processPointsExpiry();
      }

      case 'LOYALTY_TIER_EVALUATION': {
        const loyaltyBatchJobs = this.container.resolve('loyaltyBatchJobs');
        return await loyaltyBatchJobs.processTierEvaluation();
      }

      case 'LOYALTY_FESTIVAL_BONUS': {
        const loyaltyBatchJobs = this.container.resolve('loyaltyBatchJobs');
        return await loyaltyBatchJobs.processFestivalBonus(
          jobConfig.festivalType || 'general',
          jobConfig.multiplier || 1.5,
        );
      }

      case 'NOTIFICATION_DAILY_DIGEST': {
        const notificationBatchJobs = this.container.resolve('notificationBatchJobs');
        return await notificationBatchJobs.processDailyDigest();
      }

      case 'NOTIFICATION_BULK_PUSH': {
        const notificationBatchJobs = this.container.resolve('notificationBatchJobs');
        return await notificationBatchJobs.processBulkPushNotification(
          jobConfig.notificationData,
          jobConfig.targetCriteria,
        );
      }

      case 'NOTIFICATION_CLEANUP': {
        const notificationBatchJobs = this.container.resolve('notificationBatchJobs');
        return await notificationBatchJobs.processNotificationCleanup();
      }

      default:
        throw new Error(`지원되지 않는 배치 작업 타입: ${jobType}`);
      }
    } catch (error) {
      this.logger.error(`[SchedulingManager] 즉시 배치 작업 실패: ${jobType}`, error);
      throw error;
    }
  }

  /**
   * 작업 상태 조회
   *
   * @param jobId
   */
  async getJobStatus(jobId) {
    return await this.batchProcessor.getJobStatus(jobId);
  }

  /**
   * 실행 중인 작업 목록
   */
  getRunningJobs() {
    return this.batchProcessor.getRunningJobs();
  }

  /**
   * 등록된 스케줄 작업 목록
   */
  getScheduledTasks() {
    return this.schedulingService.getRegisteredTasks();
  }

  /**
   * 일회성 작업 목록
   */
  getOneTimeJobs() {
    const jobs = [];
    for (const [jobId, jobInfo] of this.jobRegistry) {
      if (jobInfo.type === 'ONE_TIME') {
        jobs.push({
          jobId,
          executeTime: jobInfo.executeTime,
          createdAt: jobInfo.createdAt,
        });
      }
    }
    return jobs;
  }

  /**
   * 작업 취소
   *
   * @param jobId
   */
  async cancelJob(jobId) {
    // 실행 중인 배치 작업 취소
    if (await this.batchProcessor.cancelJob(jobId)) {
      return true;
    }

    // 일회성 작업 취소
    const jobInfo = this.jobRegistry.get(jobId);
    if (jobInfo && jobInfo.type === 'ONE_TIME') {
      clearTimeout(jobInfo.timeoutId);
      this.jobRegistry.delete(jobId);
      this.logger.info(`[SchedulingManager] 일회성 작업 취소: ${jobId}`);
      return true;
    }

    // 스케줄 작업 중지
    return this.schedulingService.stopTask(jobId);
  }

  /**
   * 시스템 종료
   */
  async shutdown() {
    try {
      this.logger.info('[SchedulingManager] 스케줄링 매니저를 종료합니다...');

      // 모든 스케줄 작업 중지
      this.schedulingService.stopAllTasks();

      // 모든 일회성 작업 취소
      for (const [jobId, jobInfo] of this.jobRegistry) {
        if (jobInfo.type === 'ONE_TIME') {
          clearTimeout(jobInfo.timeoutId);
        }
      }
      this.jobRegistry.clear();

      this.logger.info('[SchedulingManager] 스케줄링 매니저가 종료되었습니다.');
    } catch (error) {
      this.logger.error('[SchedulingManager] 스케줄링 매니저 종료 실패:', error);
    }
  }

  // ========================================
  // 이벤트 핸들러들
  // ========================================

  /**
   * 이벤트 시작 알림 처리
   *
   * @param event
   */
  async _handleEventStartNotification(event) {
    try {
      const notificationService = this.container.resolve('notificationService');
      
      // 이벤트 관련 사용자들에게 알림
      await notificationService.sendEventNotification({
        eventId: event.id,
        type: 'EVENT_STARTING',
        title: `Sự kiện ${event.title} sắp bắt đầu!`,
        message: 'Sự kiện sẽ bắt đầu trong 1 tiếng. Đừng bỏ lỡ!',
        targetAudience: event.targetAudience || 'ALL',
      });

      this.logger.info(`[SchedulingManager] 이벤트 시작 알림 발송 완료: ${event.title}`);
    } catch (error) {
      this.logger.error(`[SchedulingManager] 이벤트 시작 알림 실패: ${event.id}`, error);
    }
  }

  /**
   * 이벤트 종료 처리
   *
   * @param event
   */
  async _handleEventEnd(event) {
    try {
      const eventService = this.container.resolve('eventService');
      
      // 이벤트 상태를 종료로 변경
      await eventService.updateEventStatus(event.id, 'ENDED');
      
      this.logger.info(`[SchedulingManager] 이벤트 종료 처리 완료: ${event.title}`);
    } catch (error) {
      this.logger.error(`[SchedulingManager] 이벤트 종료 처리 실패: ${event.id}`, error);
    }
  }

  /**
   * 쿠폰 만료 알림 처리
   *
   * @param coupon
   */
  async _handleCouponExpiryNotification(coupon) {
    try {
      const notificationService = this.container.resolve('notificationService');
      const couponService = this.container.resolve('couponService');
      
      // 쿠폰을 보유한 사용자들에게 만료 알림
      const couponHolders = await couponService.getCouponHolders(coupon.id);
      
      for (const holder of couponHolders) {
        await notificationService.sendNotification({
          userId: holder.userId,
          type: 'COUPON_EXPIRING',
          title: 'Mã giảm giá sắp hết hạn',
          message: `Mã giảm giá ${coupon.code} sẽ hết hạn vào ngày mai. Sử dụng ngay!`,
          data: {
            couponId: coupon.id,
            couponCode: coupon.code,
            discountValue: coupon.discountValue,
            expiresAt: coupon.expiresAt,
          },
        });
      }

      this.logger.info(`[SchedulingManager] 쿠폰 만료 알림 발송 완료: ${coupon.code} (${couponHolders.length}명)`);
    } catch (error) {
      this.logger.error(`[SchedulingManager] 쿠폰 만료 알림 실패: ${coupon.id}`, error);
    }
  }
}