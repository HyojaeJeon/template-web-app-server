/**
 * 스케줄링 서비스
 * 다양한 배치 작업들을 스케줄링하고 관리하는 서비스
 */

import cron from 'node-cron';

export class SchedulingService {
  constructor(container) {
    this.container = container;
    this.logger = container.resolve('logger');
    this.scheduledTasks = new Map();
    this.isInitialized = false;
  }

  /**
   * 스케줄링 서비스 초기화
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.info('[SchedulingService] 스케줄링 서비스를 초기화합니다...');

      // 기본 스케줄 작업들을 등록
      await this._registerDefaultSchedules();

      this.isInitialized = true;
      this.logger.info('[SchedulingService] 스케줄링 서비스 초기화가 완료되었습니다.');
    } catch (error) {
      this.logger.error('[SchedulingService] 스케줄링 서비스 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 기본 스케줄 작업들을 등록
   */
  async _registerDefaultSchedules() {
    // 매일 자정 3시 - 포인트 만료 처리
    this.scheduleTask(
      'loyalty-points-expiry',
      '0 3 * * *',
      this._handleLoyaltyPointsExpiry.bind(this),
      { timezone: 'Asia/Ho_Chi_Minh' },
    );

    // 매일 오전 9시 - 푸시 알림 다이제스트 발송
    this.scheduleTask(
      'daily-notification-digest',
      '0 9 * * *',
      this._handleDailyNotificationDigest.bind(this),
      { timezone: 'Asia/Ho_Chi_Minh' },
    );

    // 매주 월요일 오전 6시 - 주간 분석 리포트 생성
    this.scheduleTask(
      'weekly-analytics-report',
      '0 6 * * 1',
      this._handleWeeklyAnalyticsReport.bind(this),
      { timezone: 'Asia/Ho_Chi_Minh' },
    );

    // 매월 1일 오전 2시 - 월간 로열티 티어 재평가
    this.scheduleTask(
      'monthly-tier-evaluation',
      '0 2 1 * *',
      this._handleMonthlyTierEvaluation.bind(this),
      { timezone: 'Asia/Ho_Chi_Minh' },
    );

    // 매시간 30분 - 이벤트 상태 업데이트
    this.scheduleTask(
      'hourly-event-update',
      '30 * * * *',
      this._handleHourlyEventUpdate.bind(this),
      { timezone: 'Asia/Ho_Chi_Minh' },
    );

    // 매 15분 - 배달 상태 동기화
    this.scheduleTask(
      'delivery-sync',
      '*/15 * * * *',
      this._handleDeliverySync.bind(this),
      { timezone: 'Asia/Ho_Chi_Minh' },
    );

    // 매년 12월 31일 23시 - Local 축제 이벤트 생성 (다음년도)
    this.scheduleTask(
      'vietnamese-festival-generation',
      '0 23 31 12 *',
      this._handleVietnameseFestivalGeneration.bind(this),
      { timezone: 'Asia/Ho_Chi_Minh' },
    );
  }

  /**
   * 스케줄 작업 등록
   *
   * @param taskId
   * @param cronExpression
   * @param taskFunction
   * @param options
   */
  scheduleTask(taskId, cronExpression, taskFunction, options = {}) {
    try {
      if (this.scheduledTasks.has(taskId)) {
        this.logger.warn(`[SchedulingService] 작업 ${taskId}이 이미 등록되어 있습니다. 기존 작업을 중지합니다.`);
        this.stopTask(taskId);
      }

      const task = cron.schedule(cronExpression, async () => {
        const startTime = Date.now();
        const executionId = `${taskId}_${Date.now()}`;
        
        try {
          this.logger.info(`[SchedulingService] 배치 작업 시작: ${taskId} (${executionId})`);
          
          await taskFunction();
          
          const duration = Date.now() - startTime;
          this.logger.info(`[SchedulingService] 배치 작업 완료: ${taskId} (${duration}ms)`);
          
          // 작업 실행 기록 저장
          await this._recordTaskExecution(taskId, executionId, 'SUCCESS', duration);
          
        } catch (error) {
          const duration = Date.now() - startTime;
          this.logger.error(`[SchedulingService] 배치 작업 실패: ${taskId}`, error);
          
          // 작업 실행 기록 저장
          await this._recordTaskExecution(taskId, executionId, 'FAILED', duration, error.message);
        }
      }, {
        scheduled: false,
        timezone: options.timezone || 'Asia/Ho_Chi_Minh',
      });

      this.scheduledTasks.set(taskId, {
        task,
        cronExpression,
        options,
        createdAt: new Date(),
      });

      // 즉시 시작하지 않고 필요할 때만 시작
      if (options.autoStart !== false) {
        task.start();
        this.logger.info(`[SchedulingService] 스케줄 작업 등록 완료: ${taskId} (${cronExpression})`);
      }

      return task;
    } catch (error) {
      this.logger.error(`[SchedulingService] 스케줄 작업 등록 실패: ${taskId}`, error);
      throw error;
    }
  }

  /**
   * 스케줄 작업 중지
   *
   * @param taskId
   */
  stopTask(taskId) {
    const taskInfo = this.scheduledTasks.get(taskId);
    if (taskInfo) {
      taskInfo.task.stop();
      this.scheduledTasks.delete(taskId);
      this.logger.info(`[SchedulingService] 스케줄 작업 중지: ${taskId}`);
      return true;
    }
    return false;
  }

  /**
   * 모든 스케줄 작업 중지
   */
  stopAllTasks() {
    for (const [taskId] of this.scheduledTasks) {
      this.stopTask(taskId);
    }
    this.logger.info('[SchedulingService] 모든 스케줄 작업이 중지되었습니다.');
  }

  /**
   * 등록된 작업 목록 조회
   */
  getRegisteredTasks() {
    const tasks = [];
    for (const [taskId, taskInfo] of this.scheduledTasks) {
      tasks.push({
        taskId,
        cronExpression: taskInfo.cronExpression,
        isRunning: taskInfo.task.running,
        createdAt: taskInfo.createdAt,
        options: taskInfo.options,
      });
    }
    return tasks;
  }

  /**
   * 작업 실행 기록 저장
   *
   * @param taskId
   * @param executionId
   * @param status
   * @param duration
   * @param errorMessage
   */
  async _recordTaskExecution(taskId, executionId, status, duration, errorMessage = null) {
    try {
      // 실행 기록을 데이터베이스에 저장 (선택적)
      // const executionRecord = {
      //   taskId,
      //   executionId,
      //   status,
      //   duration,
      //   errorMessage,
      //   executedAt: new Date()
      // };
      // await this.scheduledTaskExecutionRepository.create(executionRecord);
      
      this.logger.info(`[SchedulingService] 작업 실행 기록: ${taskId} - ${status} (${duration}ms)`);
    } catch (error) {
      this.logger.error('[SchedulingService] 작업 실행 기록 저장 실패:', error);
    }
  }

  // ========================================
  // 개별 배치 작업 핸들러들
  // ========================================

  /**
   * 로열티 포인트 만료 처리
   */
  async _handleLoyaltyPointsExpiry() {
    const loyaltyService = this.container.resolve('loyaltyService');
    const notificationService = this.container.resolve('notificationService');

    try {
      // 만료 예정 포인트 조회 (30일 전 알림)
      const expiringPoints = await loyaltyService.getExpiringPoints(30);
      
      // 사용자별로 만료 예정 알림 발송
      for (const userPoints of expiringPoints) {
        await notificationService.sendNotification({
          userId: userPoints.userId,
          type: 'LOYALTY_POINTS_EXPIRING',
          title: 'Điểm thưởng sắp hết hạn',
          message: `${userPoints.points} điểm của bạn sẽ hết hạn vào ${userPoints.expiryDate}`,
          data: {
            pointsExpiring: userPoints.points,
            expiryDate: userPoints.expiryDate,
          },
        });
      }

      // 실제 만료된 포인트 처리
      const expiredResult = await loyaltyService.processExpiredPoints();
      
      this.logger.info(`[LoyaltyPointsExpiry] 포인트 만료 처리 완료: ${expiredResult.expiredUsers}명, ${expiredResult.totalExpiredPoints}점`);

    } catch (error) {
      this.logger.error('[LoyaltyPointsExpiry] 포인트 만료 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 일일 알림 다이제스트 발송
   */
  async _handleDailyNotificationDigest() {
    const notificationService = this.container.resolve('notificationService');
    const userService = this.container.resolve('userService');

    try {
      // 다이제스트 수신 설정한 사용자들 조회
      const digestUsers = await userService.getUsersWithDigestEnabled();
      
      for (const user of digestUsers) {
        // 사용자별 어제의 주요 알림들 요약
        const digest = await notificationService.generateDailyDigest(user.userId);
        
        if (digest.hasContent) {
          await notificationService.sendDigestNotification(user.userId, digest);
        }
      }

      this.logger.info(`[DailyNotificationDigest] 일일 다이제스트 발송 완료: ${digestUsers.length}명`);

    } catch (error) {
      this.logger.error('[DailyNotificationDigest] 일일 다이제스트 발송 실패:', error);
      throw error;
    }
  }

  /**
   * 주간 분석 리포트 생성
   */
  async _handleWeeklyAnalyticsReport() {
    const analyticsService = this.container.resolve('analyticsService');
    const notificationService = this.container.resolve('notificationService');

    try {
      // 주간 분석 리포트 생성
      const weeklyReport = await analyticsService.generateWeeklyReport();
      
      // 관리자들에게 리포트 알림
      await notificationService.sendAdminNotification({
        type: 'WEEKLY_ANALYTICS_REPORT',
        title: 'Báo cáo phân tích tuần',
        message: '리포트가 생성되었습니다.',
        data: {
          reportId: weeklyReport.id,
          reportUrl: weeklyReport.url,
          summary: weeklyReport.summary,
        },
      });

      this.logger.info('[WeeklyAnalyticsReport] 주간 분석 리포트 생성 완료');

    } catch (error) {
      this.logger.error('[WeeklyAnalyticsReport] 주간 분석 리포트 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 월간 로열티 티어 재평가
   */
  async _handleMonthlyTierEvaluation() {
    const loyaltyService = this.container.resolve('loyaltyService');
    const notificationService = this.container.resolve('notificationService');

    try {
      // 모든 사용자 티어 재평가
      const evaluationResult = await loyaltyService.evaluateAllUserTiers();
      
      // 티어 승급/강등된 사용자들에게 알림
      for (const tierChange of evaluationResult.tierChanges) {
        const isUpgrade = tierChange.newTier > tierChange.oldTier;
        
        await notificationService.sendNotification({
          userId: tierChange.userId,
          type: isUpgrade ? 'LOYALTY_TIER_UPGRADE' : 'LOYALTY_TIER_DOWNGRADE',
          title: isUpgrade ? 'Chúc mừng! Hạng thành viên được nâng cấp' : 'Thông báo thay đổi hạng thành viên',
          message: `Hạng thành viên của bạn đã ${isUpgrade ? 'được nâng lên' : 'thay đổi thành'} ${tierChange.newTierName}`,
          data: {
            oldTier: tierChange.oldTierName,
            newTier: tierChange.newTierName,
            benefits: tierChange.newBenefits,
          },
        });
      }

      this.logger.info(`[MonthlyTierEvaluation] 월간 티어 재평가 완료: 승급 ${evaluationResult.upgrades}명, 강등 ${evaluationResult.downgrades}명`);

    } catch (error) {
      this.logger.error('[MonthlyTierEvaluation] 월간 티어 재평가 실패:', error);
      throw error;
    }
  }

  /**
   * 시간별 이벤트 상태 업데이트
   */
  async _handleHourlyEventUpdate() {
    const eventService = this.container.resolve('eventService');

    try {
      // 시작/종료되어야 할 이벤트들 처리
      const updateResult = await eventService.updateEventStatuses();
      
      this.logger.info(`[HourlyEventUpdate] 이벤트 상태 업데이트: 시작 ${updateResult.started}개, 종료 ${updateResult.ended}개`);

    } catch (error) {
      this.logger.error('[HourlyEventUpdate] 이벤트 상태 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 배달 상태 동기화
   */
  async _handleDeliverySync() {
    const orderService = this.container.resolve('orderService');
    const deliveryService = this.container.resolve('deliveryService');

    try {
      // 진행 중인 배달 상태 동기화
      const activeDeliveries = await orderService.getActiveDeliveries();
      
      for (const delivery of activeDeliveries) {
        await deliveryService.syncDeliveryStatus(delivery.id);
      }
      
      this.logger.info(`[DeliverySync] 배달 상태 동기화 완료: ${activeDeliveries.length}건`);

    } catch (error) {
      this.logger.error('[DeliverySync] 배달 상태 동기화 실패:', error);
      throw error;
    }
  }

  /**
   * Local 축제 이벤트 생성 (다음 년도)
   */
  async _handleVietnameseFestivalGeneration() {
    const eventService = this.container.resolve('eventService');
    const couponService = this.container.resolve('couponService');

    try {
      const nextYear = new Date().getFullYear() + 1;
      
      // 다음 년도 Local 축제 이벤트 생성
      const festivalEvents = await eventService.generateVietnameseFestivalEvents(nextYear, {
        autoPublish: false, // 관리자 검토 후 게시
        createdBy: 'system',
      });

      // 축제별 쿠폰도 함께 생성
      for (const event of festivalEvents) {
        await couponService.generateVietnameseFestivalCoupons({
          festival: event.festival,
          discountPercentage: event.defaultDiscount,
          quantity: 10000,
          durationDays: event.durationDays,
          createdBy: 'system',
        });
      }

      this.logger.info(`[VietnameseFestivalGeneration] ${nextYear}년 Local 축제 이벤트 생성 완료: ${festivalEvents.length}개`);

    } catch (error) {
      this.logger.error('[VietnameseFestivalGeneration] Local 축제 이벤트 생성 실패:', error);
      throw error;
    }
  }
}