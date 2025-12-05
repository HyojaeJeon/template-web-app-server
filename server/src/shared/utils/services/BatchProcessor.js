/**
 * 배치 프로세서
 * 대용량 데이터 처리를 위한 배치 작업 실행기
 */

export class BatchProcessor {
  constructor(container) {
    this.container = container;
    this.logger = container.resolve('logger');
    this.redisClient = container.resolve('redisClient');
    this.runningJobs = new Map();
  }

  /**
   * 배치 작업 실행
   *
   * @param jobConfig
   */
  async executeBatchJob(jobConfig) {
    const {
      jobId,
      jobType,
      dataSource,
      batchSize = 1000,
      maxConcurrency = 5,
      retryAttempts = 3,
      processor,
      onProgress,
      onComplete,
      onError,
    } = jobConfig;

    const jobInstance = {
      jobId,
      jobType,
      startTime: Date.now(),
      status: 'RUNNING',
      totalItems: 0,
      processedItems: 0,
      failedItems: 0,
      progress: 0,
    };

    this.runningJobs.set(jobId, jobInstance);

    try {
      this.logger.info(`[BatchProcessor] 배치 작업 시작: ${jobId} (${jobType})`);

      // 전체 데이터 개수 조회
      const totalItems = await this._getTotalItemCount(dataSource);
      jobInstance.totalItems = totalItems;

      if (totalItems === 0) {
        await this._completeJob(jobInstance, onComplete);
        return jobInstance;
      }

      // 배치별로 데이터 처리
      const batches = Math.ceil(totalItems / batchSize);
      const semaphore = new Semaphore(maxConcurrency);

      const processingPromises = [];

      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const promise = semaphore.acquire().then(async (release) => {
          try {
            await this._processBatch({
              jobInstance,
              dataSource,
              batchIndex,
              batchSize,
              processor,
              retryAttempts,
              onProgress,
            });
          } finally {
            release();
          }
        });

        processingPromises.push(promise);
      }

      // 모든 배치 처리 완료 대기
      await Promise.all(processingPromises);

      await this._completeJob(jobInstance, onComplete);

    } catch (error) {
      await this._failJob(jobInstance, error, onError);
      throw error;
    } finally {
      this.runningJobs.delete(jobId);
    }

    return jobInstance;
  }

  /**
   * 개별 배치 처리
   *
   * @param root0
   * @param root0.jobInstance
   * @param root0.dataSource
   * @param root0.batchIndex
   * @param root0.batchSize
   * @param root0.processor
   * @param root0.retryAttempts
   * @param root0.onProgress
   */
  async _processBatch({
    jobInstance,
    dataSource,
    batchIndex,
    batchSize,
    processor,
    retryAttempts,
    onProgress,
  }) {
    const offset = batchIndex * batchSize;
    
    try {
      // 배치 데이터 조회
      const batchData = await this._getBatchData(dataSource, offset, batchSize);
      
      if (batchData.length === 0) {
        return;
      }

      // 개별 아이템 처리 (재시도 로직 포함)
      const results = await Promise.allSettled(
        batchData.map(async (item) => {
          return await this._processItemWithRetry(item, processor, retryAttempts);
        }),
      );

      // 결과 집계
      let successCount = 0;
      let failureCount = 0;

      for (const result of results) {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          failureCount++;
          this.logger.warn(`[BatchProcessor] 아이템 처리 실패 (작업: ${jobInstance.jobId}):`, result.reason);
        }
      }

      // 작업 상태 업데이트
      jobInstance.processedItems += successCount;
      jobInstance.failedItems += failureCount;
      jobInstance.progress = Math.round((jobInstance.processedItems + jobInstance.failedItems) / jobInstance.totalItems * 100);

      // 진행률 콜백 호출
      if (onProgress) {
        await onProgress(jobInstance);
      }

      // Redis에 진행 상태 저장 (모니터링용)
      await this._updateJobProgress(jobInstance);

      this.logger.info(`[BatchProcessor] 배치 처리 완료 (작업: ${jobInstance.jobId}, 배치: ${batchIndex + 1}): 성공 ${successCount}, 실패 ${failureCount}`);

    } catch (error) {
      this.logger.error(`[BatchProcessor] 배치 처리 실패 (작업: ${jobInstance.jobId}, 배치: ${batchIndex + 1}):`, error);
      throw error;
    }
  }

  /**
   * 재시도 로직을 포함한 아이템 처리
   *
   * @param item
   * @param processor
   * @param maxRetries
   */
  async _processItemWithRetry(item, processor, maxRetries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await processor(item);
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          // 지수 백오프 대기 (1초, 2초, 4초...)
          const delayMs = Math.pow(2, attempt - 1) * 1000;
          await this._sleep(delayMs);
          
          this.logger.warn(`[BatchProcessor] 아이템 처리 재시도 ${attempt}/${maxRetries}:`, error.message);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * 전체 아이템 개수 조회
   *
   * @param dataSource
   */
  async _getTotalItemCount(dataSource) {
    if (typeof dataSource.getTotalCount === 'function') {
      return await dataSource.getTotalCount();
    }
    
    if (Array.isArray(dataSource)) {
      return dataSource.length;
    }
    
    throw new Error('지원되지 않는 데이터 소스 형식입니다.');
  }

  /**
   * 배치 데이터 조회
   *
   * @param dataSource
   * @param offset
   * @param limit
   */
  async _getBatchData(dataSource, offset, limit) {
    if (typeof dataSource.getBatch === 'function') {
      return await dataSource.getBatch(offset, limit);
    }
    
    if (Array.isArray(dataSource)) {
      return dataSource.slice(offset, offset + limit);
    }
    
    throw new Error('지원되지 않는 데이터 소스 형식입니다.');
  }

  /**
   * 작업 완료 처리
   *
   * @param jobInstance
   * @param onComplete
   */
  async _completeJob(jobInstance, onComplete) {
    jobInstance.status = 'COMPLETED';
    jobInstance.endTime = Date.now();
    jobInstance.duration = jobInstance.endTime - jobInstance.startTime;
    jobInstance.progress = 100;

    await this._updateJobProgress(jobInstance);

    if (onComplete) {
      await onComplete(jobInstance);
    }

    this.logger.info(`[BatchProcessor] 배치 작업 완료: ${jobInstance.jobId} (${jobInstance.duration}ms, 성공: ${jobInstance.processedItems}, 실패: ${jobInstance.failedItems})`);
  }

  /**
   * 작업 실패 처리
   *
   * @param jobInstance
   * @param error
   * @param onError
   */
  async _failJob(jobInstance, error, onError) {
    jobInstance.status = 'FAILED';
    jobInstance.endTime = Date.now();
    jobInstance.duration = jobInstance.endTime - jobInstance.startTime;
    jobInstance.error = error.message;

    await this._updateJobProgress(jobInstance);

    if (onError) {
      await onError(jobInstance, error);
    }

    this.logger.error(`[BatchProcessor] 배치 작업 실패: ${jobInstance.jobId} (${jobInstance.duration}ms):`, error);
  }

  /**
   * 작업 진행 상태를 Redis에 저장
   *
   * @param jobInstance
   */
  async _updateJobProgress(jobInstance) {
    try {
      const key = `batch_job:${jobInstance.jobId}`;
      const progressData = {
        jobId: jobInstance.jobId,
        jobType: jobInstance.jobType,
        status: jobInstance.status,
        totalItems: jobInstance.totalItems,
        processedItems: jobInstance.processedItems,
        failedItems: jobInstance.failedItems,
        progress: jobInstance.progress,
        startTime: jobInstance.startTime,
        endTime: jobInstance.endTime || null,
        duration: jobInstance.duration || null,
        error: jobInstance.error || null,
        updatedAt: Date.now(),
      };

      await this.redisClient.setex(key, 86400, JSON.stringify(progressData)); // 24시간 보관
    } catch (error) {
      this.logger.error('[BatchProcessor] 작업 진행 상태 저장 실패:', error);
    }
  }

  /**
   * 배치 작업 상태 조회
   *
   * @param jobId
   */
  async getJobStatus(jobId) {
    try {
      // 실행 중인 작업에서 먼저 확인
      if (this.runningJobs.has(jobId)) {
        return this.runningJobs.get(jobId);
      }

      // Redis에서 조회
      const key = `batch_job:${jobId}`;
      const progressData = await this.redisClient.get(key);
      
      if (progressData) {
        return JSON.parse(progressData);
      }

      return null;
    } catch (error) {
      this.logger.error('[BatchProcessor] 작업 상태 조회 실패:', error);
      return null;
    }
  }

  /**
   * 실행 중인 모든 작업 목록 조회
   */
  getRunningJobs() {
    return Array.from(this.runningJobs.values());
  }

  /**
   * 작업 중단
   *
   * @param jobId
   */
  async cancelJob(jobId) {
    const jobInstance = this.runningJobs.get(jobId);
    
    if (!jobInstance) {
      return false;
    }

    jobInstance.status = 'CANCELLED';
    jobInstance.endTime = Date.now();
    jobInstance.duration = jobInstance.endTime - jobInstance.startTime;

    await this._updateJobProgress(jobInstance);
    this.runningJobs.delete(jobId);

    this.logger.info(`[BatchProcessor] 배치 작업 중단: ${jobId}`);
    return true;
  }

  /**
   * 유틸리티: Sleep 함수
   *
   * @param ms
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 세마포어 클래스 (동시 실행 수 제한)
 */
class Semaphore {
  constructor(capacity) {
    this.capacity = capacity;
    this.available = capacity;
    this.waitQueue = [];
  }

  async acquire() {
    return new Promise((resolve) => {
      if (this.available > 0) {
        this.available--;
        resolve(() => this.release());
      } else {
        this.waitQueue.push(() => {
          this.available--;
          resolve(() => this.release());
        });
      }
    });
  }

  release() {
    this.available++;
    
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      next();
    }
  }
}