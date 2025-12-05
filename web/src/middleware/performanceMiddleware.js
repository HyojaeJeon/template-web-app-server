/**
 * 성능 모니터링 미들웨어
 * - API 응답 시간 추적
 * - 메모리 사용량 모니터링
 * - CPU 사용량 추적
 * - 데이터베이스 쿼리 성능 분석
 * - 실시간 성능 알림
 */

import { performance } from 'perf_hooks';

import { Logger } from '../shared/utils/Logger';

class PerformanceMiddleware {
  constructor() {
    this.logger = new Logger('Performance');
    this.metrics = {
      requests: new Map(), // 요청별 성능 데이터
      apiEndpoints: new Map(), // API 엔드포인트별 통계
      systemMetrics: {
        cpu: [],
        memory: [],
        responseTime: [],
        errorRate: []
      }
    };
    
    // 성능 임계값 설정
    this.thresholds = {
      responseTime: {
        warning: 1000, // 1초
        critical: 3000  // 3초
      },
      memory: {
        warning: 80, // 80%
        critical: 90  // 90%
      },
      cpu: {
        warning: 70, // 70%
        critical: 85  // 85%
      },
      errorRate: {
        warning: 5,  // 5%
        critical: 10 // 10%
      }
    };
    
    this.subscribers = [];
    
    // 정기적인 시스템 메트릭 수집
    this.startSystemMonitoring();
  }

  /**
   * Express 미들웨어 생성
   */
  createMiddleware() {
    return (req, res, next) => {
      const startTime = performance.now();
      const requestId = this.generateRequestId();
      
      // 요청 시작 로깅
      this.logRequestStart(req, requestId);
      
      // 응답 완료 시 성능 데이터 수집
      res.on('finish', () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.processRequestMetrics(req, res, duration, requestId);
      });
      
      next();
    };
  }

  /**
   * Next.js 미들웨어 생성
   */
  createNextMiddleware() {
    return async (req, res, next) => {
      const startTime = performance.now();
      const requestId = this.generateRequestId();
      
      // 요청 시작 메트릭 수집
      const requestMetric = {
        id: requestId,
        url: req.url,
        method: req.method,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        startTime,
        timestamp: new Date().toISOString()
      };
      
      this.metrics.requests.set(requestId, requestMetric);
      
      try {
        // 요청 처리
        if (next) {
          await next();
        }
      } finally {
        // 성능 데이터 처리
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.processNextRequestMetrics(req, res, duration, requestId);
      }
    };
  }

  /**
   * 요청 시작 로깅
   *
   * @param req
   * @param requestId
   */
  logRequestStart(req, requestId) {
    this.logger.debug('요청 시작:', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    });
  }

  /**
   * Express 요청 메트릭 처리
   *
   * @param req
   * @param res
   * @param duration
   * @param requestId
   */
  processRequestMetrics(req, res, duration, requestId) {
    const endpoint = `${req.method} ${req.route?.path || req.url}`;
    const statusCode = res.statusCode;
    const isError = statusCode >= 400;
    
    // 개별 요청 메트릭 업데이트
    const requestMetric = this.metrics.requests.get(requestId);
    if (requestMetric) {
      requestMetric.duration = duration;
      requestMetric.statusCode = statusCode;
      requestMetric.endTime = performance.now();
      requestMetric.isError = isError;
    }
    
    // 엔드포인트별 통계 업데이트
    this.updateEndpointStats(endpoint, duration, isError);
    
    // 성능 임계값 확인
    this.checkPerformanceThresholds(endpoint, duration, statusCode);
    
    // 로깅
    const logLevel = isError ? 'error' : duration > this.thresholds.responseTime.warning ? 'warn' : 'info';
    this.logger[logLevel]('요청 완료:', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode,
      duration: `${Math.round(duration)}ms`,
      endpoint
    });
    
    // 요청 데이터 정리 (메모리 관리)
    setTimeout(() => {
      this.metrics.requests.delete(requestId);
    }, 60000); // 1분 후 제거
  }

  /**
   * Next.js 요청 메트릭 처리
   *
   * @param req
   * @param res
   * @param duration
   * @param requestId
   */
  processNextRequestMetrics(req, res, duration, requestId) {
    const endpoint = `${req.method} ${req.url}`;
    const statusCode = res?.statusCode || 200;
    const isError = statusCode >= 400;
    
    // 요청 메트릭 업데이트
    const requestMetric = this.metrics.requests.get(requestId);
    if (requestMetric) {
      requestMetric.duration = duration;
      requestMetric.statusCode = statusCode;
      requestMetric.endTime = performance.now();
      requestMetric.isError = isError;
    }
    
    // 엔드포인트별 통계 업데이트
    this.updateEndpointStats(endpoint, duration, isError);
    
    // 성능 임계값 확인
    this.checkPerformanceThresholds(endpoint, duration, statusCode);
    
    // 로깅
    this.logger.info('Next.js 요청 완료:', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode,
      duration: `${Math.round(duration)}ms`
    });
  }

  /**
   * 엔드포인트별 통계 업데이트
   *
   * @param endpoint
   * @param duration
   * @param isError
   */
  updateEndpointStats(endpoint, duration, isError) {
    if (!this.metrics.apiEndpoints.has(endpoint)) {
      this.metrics.apiEndpoints.set(endpoint, {
        totalRequests: 0,
        totalDuration: 0,
        errorCount: 0,
        minDuration: Infinity,
        maxDuration: 0,
        recentDurations: [],
        errorRate: 0,
        avgDuration: 0,
        p95Duration: 0,
        p99Duration: 0
      });
    }
    
    const stats = this.metrics.apiEndpoints.get(endpoint);
    
    // 기본 통계 업데이트
    stats.totalRequests += 1;
    stats.totalDuration += duration;
    stats.minDuration = Math.min(stats.minDuration, duration);
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    
    if (isError) {
      stats.errorCount += 1;
    }
    
    // 최근 응답 시간 추적 (최근 100개 요청)
    stats.recentDurations.push(duration);
    if (stats.recentDurations.length > 100) {
      stats.recentDurations.shift();
    }
    
    // 계산된 메트릭 업데이트
    stats.avgDuration = stats.totalDuration / stats.totalRequests;
    stats.errorRate = (stats.errorCount / stats.totalRequests) * 100;
    
    // 백분위수 계산
    if (stats.recentDurations.length > 0) {
      const sorted = [...stats.recentDurations].sort((a, b) => a - b);
      stats.p95Duration = this.getPercentile(sorted, 95);
      stats.p99Duration = this.getPercentile(sorted, 99);
    }
  }

  /**
   * 성능 임계값 확인
   *
   * @param endpoint
   * @param duration
   * @param statusCode
   */
  checkPerformanceThresholds(endpoint, duration, statusCode) {
    // 응답 시간 임계값 확인
    if (duration > this.thresholds.responseTime.critical) {
      this.triggerAlert({
        type: 'CRITICAL_RESPONSE_TIME',
        endpoint,
        duration,
        threshold: this.thresholds.responseTime.critical,
        message: `${endpoint}의 응답 시간이 ${Math.round(duration)}ms로 임계값(${this.thresholds.responseTime.critical}ms)을 초과했습니다`
      });
    } else if (duration > this.thresholds.responseTime.warning) {
      this.triggerAlert({
        type: 'WARNING_RESPONSE_TIME',
        endpoint,
        duration,
        threshold: this.thresholds.responseTime.warning,
        message: `${endpoint}의 응답 시간이 ${Math.round(duration)}ms로 경고 임계값을 초과했습니다`
      });
    }
    
    // 에러율 임계값 확인
    const endpointStats = this.metrics.apiEndpoints.get(endpoint);
    if (endpointStats && endpointStats.totalRequests >= 10) { // 최소 10개 요청 후 확인
      if (endpointStats.errorRate > this.thresholds.errorRate.critical) {
        this.triggerAlert({
          type: 'CRITICAL_ERROR_RATE',
          endpoint,
          errorRate: endpointStats.errorRate,
          threshold: this.thresholds.errorRate.critical,
          message: `${endpoint}의 에러율이 ${endpointStats.errorRate.toFixed(1)}%로 임계값을 초과했습니다`
        });
      } else if (endpointStats.errorRate > this.thresholds.errorRate.warning) {
        this.triggerAlert({
          type: 'WARNING_ERROR_RATE',
          endpoint,
          errorRate: endpointStats.errorRate,
          threshold: this.thresholds.errorRate.warning,
          message: `${endpoint}의 에러율이 경고 수준입니다 (${endpointStats.errorRate.toFixed(1)}%)`
        });
      }
    }
  }

  /**
   * 시스템 메트릭 모니터링 시작
   */
  startSystemMonitoring() {
    // 5초마다 시스템 메트릭 수집
    setInterval(() => {
      this.collectSystemMetrics();
    }, 5000);
    
    // 1분마다 메트릭 요약 및 정리
    setInterval(() => {
      this.processMetricsSummary();
    }, 60000);
  }

  /**
   * 시스템 메트릭 수집
   */
  collectSystemMetrics() {
    if (typeof process !== 'undefined') {
      // Node.js 환경에서만 실행
      try {
        // 메모리 사용량
        const memoryUsage = process.memoryUsage();
        const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        
        // CPU 사용량 (간단한 추정)
        const cpuUsage = process.cpuUsage();
        const cpuPercentage = ((cpuUsage.user + cpuUsage.system) / 1000000) * 100; // 마이크로초를 퍼센트로 변환
        
        // 메트릭 저장
        this.metrics.systemMetrics.memory.push({
          timestamp: Date.now(),
          percentage: memoryPercentage,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external
        });
        
        this.metrics.systemMetrics.cpu.push({
          timestamp: Date.now(),
          percentage: Math.min(cpuPercentage, 100), // 최대 100%로 제한
          user: cpuUsage.user,
          system: cpuUsage.system
        });
        
        // 최근 100개 데이터만 유지
        if (this.metrics.systemMetrics.memory.length > 100) {
          this.metrics.systemMetrics.memory.shift();
        }
        if (this.metrics.systemMetrics.cpu.length > 100) {
          this.metrics.systemMetrics.cpu.shift();
        }
        
        // 임계값 확인
        this.checkSystemThresholds(memoryPercentage, cpuPercentage);
        
      } catch (error) {
        this.logger.error('시스템 메트릭 수집 실패:', error);
      }
    }
  }

  /**
   * 시스템 임계값 확인
   *
   * @param memoryPercentage
   * @param cpuPercentage
   */
  checkSystemThresholds(memoryPercentage, cpuPercentage) {
    // 메모리 사용량 확인
    if (memoryPercentage > this.thresholds.memory.critical) {
      this.triggerAlert({
        type: 'CRITICAL_MEMORY_USAGE',
        memoryPercentage,
        threshold: this.thresholds.memory.critical,
        message: `메모리 사용량이 ${memoryPercentage.toFixed(1)}%로 임계 수준에 도달했습니다`
      });
    } else if (memoryPercentage > this.thresholds.memory.warning) {
      this.triggerAlert({
        type: 'WARNING_MEMORY_USAGE',
        memoryPercentage,
        threshold: this.thresholds.memory.warning,
        message: `메모리 사용량이 ${memoryPercentage.toFixed(1)}%로 경고 수준입니다`
      });
    }
    
    // CPU 사용량 확인
    if (cpuPercentage > this.thresholds.cpu.critical) {
      this.triggerAlert({
        type: 'CRITICAL_CPU_USAGE',
        cpuPercentage,
        threshold: this.thresholds.cpu.critical,
        message: `CPU 사용량이 ${cpuPercentage.toFixed(1)}%로 임계 수준에 도달했습니다`
      });
    } else if (cpuPercentage > this.thresholds.cpu.warning) {
      this.triggerAlert({
        type: 'WARNING_CPU_USAGE',
        cpuPercentage,
        threshold: this.thresholds.cpu.warning,
        message: `CPU 사용량이 ${cpuPercentage.toFixed(1)}%로 경고 수준입니다`
      });
    }
  }

  /**
   * 메트릭 요약 처리
   */
  processMetricsSummary() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // 최근 1분간의 요청 통계
    const recentRequests = Array.from(this.metrics.requests.values())
      .filter(req => new Date(req.timestamp).getTime() > oneMinuteAgo);
    
    if (recentRequests.length > 0) {
      const avgResponseTime = recentRequests.reduce((sum, req) => sum + (req.duration || 0), 0) / recentRequests.length;
      const errorCount = recentRequests.filter(req => req.isError).length;
      const errorRate = (errorCount / recentRequests.length) * 100;
      
      // 응답 시간 메트릭 저장
      this.metrics.systemMetrics.responseTime.push({
        timestamp: now,
        avgResponseTime,
        requestCount: recentRequests.length,
        p95: this.getPercentile(recentRequests.map(r => r.duration || 0).sort((a, b) => a - b), 95)
      });
      
      // 에러율 메트릭 저장
      this.metrics.systemMetrics.errorRate.push({
        timestamp: now,
        errorRate,
        errorCount,
        totalRequests: recentRequests.length
      });
      
      // 최근 100개 데이터만 유지
      if (this.metrics.systemMetrics.responseTime.length > 100) {
        this.metrics.systemMetrics.responseTime.shift();
      }
      if (this.metrics.systemMetrics.errorRate.length > 100) {
        this.metrics.systemMetrics.errorRate.shift();
      }
    }
    
    this.logger.info('메트릭 요약 처리 완료:', {
      totalEndpoints: this.metrics.apiEndpoints.size,
      activeRequests: this.metrics.requests.size,
      recentRequests: recentRequests.length
    });
  }

  /**
   * 백분위수 계산
   *
   * @param sortedArray
   * @param percentile
   */
  getPercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) {return 0;}
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  /**
   * 알림 트리거
   *
   * @param alert
   */
  triggerAlert(alert) {
    const alertWithId = {
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      ...alert
    };
    
    // 로깅
    const logLevel = alert.type.includes('CRITICAL') ? 'error' : 'warn';
    this.logger[logLevel]('성능 알림:', alertWithId);
    
    // 구독자들에게 알림
    this.subscribers.forEach(callback => {
      try {
        callback(alertWithId);
      } catch (error) {
        this.logger.error('알림 구독자 콜백 실행 실패:', error);
      }
    });
  }

  /**
   * 알림 구독
   *
   * @param callback
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * 성능 통계 조회
   */
  getPerformanceStats() {
    const endpointStats = Array.from(this.metrics.apiEndpoints.entries()).map(([endpoint, stats]) => ({
      endpoint,
      ...stats
    }));
    
    // 최근 시스템 메트릭
    const recentMemory = this.metrics.systemMetrics.memory.slice(-10);
    const recentCpu = this.metrics.systemMetrics.cpu.slice(-10);
    const recentResponseTime = this.metrics.systemMetrics.responseTime.slice(-10);
    const recentErrorRate = this.metrics.systemMetrics.errorRate.slice(-10);
    
    return {
      endpoints: endpointStats,
      system: {
        memory: {
          current: recentMemory.length > 0 ? recentMemory[recentMemory.length - 1] : null,
          history: recentMemory
        },
        cpu: {
          current: recentCpu.length > 0 ? recentCpu[recentCpu.length - 1] : null,
          history: recentCpu
        },
        responseTime: {
          current: recentResponseTime.length > 0 ? recentResponseTime[recentResponseTime.length - 1] : null,
          history: recentResponseTime
        },
        errorRate: {
          current: recentErrorRate.length > 0 ? recentErrorRate[recentErrorRate.length - 1] : null,
          history: recentErrorRate
        }
      },
      summary: {
        totalRequests: Array.from(this.metrics.apiEndpoints.values()).reduce((sum, stats) => sum + stats.totalRequests, 0),
        activeRequests: this.metrics.requests.size,
        totalEndpoints: this.metrics.apiEndpoints.size,
        lastUpdated: new Date().toISOString()
      }
    };
  }

  /**
   * 요청 ID 생성
   */
  generateRequestId() {
    return `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 알림 ID 생성
   */
  generateAlertId() {
    return `ALERT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 미들웨어 정리
   */
  cleanup() {
    this.subscribers = [];
    this.metrics.requests.clear();
    this.metrics.apiEndpoints.clear();
    this.metrics.systemMetrics.memory = [];
    this.metrics.systemMetrics.cpu = [];
    this.metrics.systemMetrics.responseTime = [];
    this.metrics.systemMetrics.errorRate = [];
    
    this.logger.info('성능 모니터링 미들웨어가 정리되었습니다');
  }
}

// 싱글톤 인스턴스
const performanceMiddleware = new PerformanceMiddleware();

export default performanceMiddleware;