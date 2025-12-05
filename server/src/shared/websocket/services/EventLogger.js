/**
 * 실시간 이벤트 로깅 시스템
 * 
 * Socket.IO 이벤트를 체계적으로 기록하고 분석할 수 있는 
 * 중앙집중식 로깅 시스템입니다.
 */

import fs from 'fs/promises';
import path from 'path';
import loggerDefault from '../../utils/utilities/Logger.js';
import models from '../../../models/index.js';
import kv from '../../cache/kv.js';

const logger = loggerDefault;
const { EventLog, Sequelize } = models;

/**
 * 이벤트 로깅 설정
 */
const CONFIG = {
  // 로그 레벨
  LOG_LEVELS: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    CRITICAL: 4
  },
  
  // 이벤트 카테고리
  CATEGORIES: {
    CONNECTION: 'connection',
    AUTHENTICATION: 'authentication',
    NOTIFICATION: 'notification',
    ORDER: 'order',
    CHAT: 'chat',
    POS: 'pos',
    DELIVERY: 'delivery',
    ANALYTICS: 'analytics',
    ERROR: 'error',
    PERFORMANCE: 'performance'
  },
  
  // 로그 보관 정책
  RETENTION: {
    DEBUG: 1, // 1일
    INFO: 7, // 7일
    WARN: 30, // 30일
    ERROR: 90, // 90일
    CRITICAL: 365 // 1년
  },
  
  // 실시간 메트릭스 업데이트 간격
  METRICS_UPDATE_INTERVAL: 5000, // 5초
  
  // 파일 로깅 설정
  FILE_LOGGING: {
    enabled: process.env.NODE_ENV === 'production',
    directory: path.join(process.cwd(), 'logs', 'socket-events'),
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10
  }
};

/**
 * 이벤트 로거 클래스
 */
class EventLogger {
  constructor() {
    this.metrics = {
      totalEvents: 0,
      eventsByCategory: {},
      eventsByNamespace: {},
      errorCount: 0,
      activeConnections: 0,
      avgResponseTime: 0
    };
    
    this.responseTimes = [];
    this.initializeMetrics();
    this.startMetricsUpdater();
  }
  
  /**
   * 메트릭스 초기화
   */
  initializeMetrics() {
    Object.values(CONFIG.CATEGORIES).forEach(category => {
      this.metrics.eventsByCategory[category] = 0;
    });
  }
  
  /**
   * 이벤트 로깅
   */
  async logEvent(options) {
    const {
      namespace,
      eventName,
      category,
      level = 'INFO',
      userId,
      storeId,
      socketId,
      data = {},
      metadata = {},
      duration = null,
      error = null
    } = options;
    
    try {
      const logEntry = {
        namespace,
        eventName,
        category: category || this.categorizeEvent(eventName),
        level,
        userId,
        storeId,
        socketId,
        data: JSON.stringify(data),
        metadata: JSON.stringify(metadata),
        duration,
        error: error ? error.message : null,
        timestamp: new Date()
      };
      
      // 데이터베이스에 저장
      await this.saveToDatabase(logEntry);
      
      // Redis에 실시간 메트릭스 업데이트
      await this.updateRealtimeMetrics(logEntry);
      
      // 파일로 저장 (프로덕션 환경)
      if (CONFIG.FILE_LOGGING.enabled) {
        await this.saveToFile(logEntry);
      }
      
      // 메트릭스 업데이트
      this.updateMetrics(logEntry);
      
      // 에러인 경우 알림
      if (level === 'ERROR' || level === 'CRITICAL') {
        await this.handleErrorEvent(logEntry);
      }
      
    } catch (error) {
      logger.error('Failed to log event:', error);
    }
  }
  
  /**
   * 연결 이벤트 로깅
   */
  async logConnection(socket, action = 'connect') {
    // Socket.user null safety 확보
    const user = socket.user || {};
    const userId = user.id || socket.userId || null;
    const storeId = user.storeId || socket.storeId || null;

    await this.logEvent({
      namespace: socket.nsp.name,
      eventName: `socket:${action}`,
      category: CONFIG.CATEGORIES.CONNECTION,
      level: 'INFO',
      userId,
      storeId,
      socketId: socket.id,
      metadata: {
        ip: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        tokenRefresh: socket.tokenRefresh || false
      }
    });
    
    if (action === 'connect') {
      this.metrics.activeConnections++;
    } else if (action === 'disconnect') {
      this.metrics.activeConnections--;
    }
  }
  
  /**
   * 인증 이벤트 로깅
   */
  async logAuthentication(socket, success, error = null) {
    await this.logEvent({
      namespace: socket.nsp.name,
      eventName: `auth:${success ? 'success' : 'failed'}`,
      category: CONFIG.CATEGORIES.AUTHENTICATION,
      level: success ? 'INFO' : 'WARN',
      socketId: socket.id,
      error,
      metadata: {
        ip: socket.handshake.address
      }
    });
  }
  
  /**
   * 비즈니스 이벤트 로깅
   */
  async logBusinessEvent(socket, eventName, data, startTime = null) {
    const duration = startTime ? Date.now() - startTime : null;

    // Socket.user null safety 확보
    const user = socket.user || {};
    const userId = user.id || socket.userId || null;
    const storeId = user.storeId || socket.storeId || null;

    await this.logEvent({
      namespace: socket.nsp.name,
      eventName,
      category: this.categorizeEvent(eventName),
      level: 'INFO',
      userId,
      storeId,
      socketId: socket.id,
      data,
      duration
    });
    
    if (duration) {
      this.responseTimes.push(duration);
      if (this.responseTimes.length > 100) {
        this.responseTimes.shift();
      }
    }
  }
  
  /**
   * 에러 이벤트 로깅
   */
  async logError(socket, eventName, error, context = {}) {
    // Socket.user null safety 확보 (에러 상황에서도 안전하게)
    const user = socket?.user || {};
    const userId = user.id || socket?.userId || null;
    const storeId = user.storeId || socket?.storeId || null;

    await this.logEvent({
      namespace: socket?.nsp?.name || 'unknown',
      eventName,
      category: CONFIG.CATEGORIES.ERROR,
      level: 'ERROR',
      userId,
      storeId,
      socketId: socket?.id,
      error,
      data: context,
      metadata: {
        stack: error.stack,
        tokenRefresh: socket?.tokenRefresh || false
      }
    });
    
    this.metrics.errorCount++;
  }
  
  /**
   * 이벤트 카테고리 자동 분류
   */
  categorizeEvent(eventName) {
    if (eventName.includes('notification')) return CONFIG.CATEGORIES.NOTIFICATION;
    if (eventName.includes('order')) return CONFIG.CATEGORIES.ORDER;
    if (eventName.includes('chat')) return CONFIG.CATEGORIES.CHAT;
    if (eventName.includes('pos')) return CONFIG.CATEGORIES.POS;
    if (eventName.includes('delivery')) return CONFIG.CATEGORIES.DELIVERY;
    if (eventName.includes('analytics')) return CONFIG.CATEGORIES.ANALYTICS;
    return 'general';
  }
  
  /**
   * 데이터베이스에 로그 저장
   */
  async saveToDatabase(logEntry) {
    try {
      await EventLog.create(logEntry);
    } catch (error) {
      logger.error('Failed to save log to database:', error);
    }
  }
  
  /**
   * Redis에 실시간 메트릭스 업데이트
   */
  async updateRealtimeMetrics(logEntry) {
    try {
      const key = `socket:metrics:${logEntry.namespace}`;
      // 카운터 증가
      await kv.hincrby(key, 'total_events', 1);
      await kv.hincrby(key, `events_${logEntry.category}`, 1);
      await kv.hincrby(key, `level_${logEntry.level}`, 1);

      // 최근 이벤트 리스트 업데이트 (최대 100개)
      const recentKey = `socket:recent:${logEntry.namespace}`;
      await kv.lpush(recentKey, JSON.stringify({
        eventName: logEntry.eventName,
        userId: logEntry.userId,
        timestamp: logEntry.timestamp
      }));
      await kv.ltrim(recentKey, 0, 99);

      // TTL 설정 (1시간)
      await kv.expire(key, 3600);
      await kv.expire(recentKey, 3600);
    } catch (error) {
      logger.error('Failed to update metrics (cache):', error);
    }
  }
  
  /**
   * 파일에 로그 저장
   */
  async saveToFile(logEntry) {
    try {
      const date = new Date();
      const fileName = `events_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.log`;
      const filePath = path.join(CONFIG.FILE_LOGGING.directory, fileName);
      
      // 디렉토리 생성
      await fs.mkdir(CONFIG.FILE_LOGGING.directory, { recursive: true });
      
      // 로그 추가
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(filePath, logLine);
      
      // 파일 크기 확인 및 로테이션
      const stats = await fs.stat(filePath);
      if (stats.size > CONFIG.FILE_LOGGING.maxFileSize) {
        await this.rotateLogFile(filePath);
      }
      
    } catch (error) {
      logger.error('Failed to save log to file:', error);
    }
  }
  
  /**
   * 로그 파일 로테이션
   */
  async rotateLogFile(filePath) {
    const timestamp = Date.now();
    const rotatedPath = `${filePath}.${timestamp}`;
    await fs.rename(filePath, rotatedPath);
    
    // 오래된 파일 삭제
    const dir = path.dirname(filePath);
    const files = await fs.readdir(dir);
    const logFiles = files.filter(f => f.includes('.log.')).sort();
    
    if (logFiles.length > CONFIG.FILE_LOGGING.maxFiles) {
      const toDelete = logFiles.slice(0, logFiles.length - CONFIG.FILE_LOGGING.maxFiles);
      for (const file of toDelete) {
        await fs.unlink(path.join(dir, file));
      }
    }
  }
  
  /**
   * 메트릭스 업데이트
   */
  updateMetrics(logEntry) {
    this.metrics.totalEvents++;
    
    if (this.metrics.eventsByCategory[logEntry.category] !== undefined) {
      this.metrics.eventsByCategory[logEntry.category]++;
    }
    
    if (!this.metrics.eventsByNamespace[logEntry.namespace]) {
      this.metrics.eventsByNamespace[logEntry.namespace] = 0;
    }
    this.metrics.eventsByNamespace[logEntry.namespace]++;
    
    // 평균 응답 시간 계산
    if (this.responseTimes.length > 0) {
      const sum = this.responseTimes.reduce((a, b) => a + b, 0);
      this.metrics.avgResponseTime = Math.round(sum / this.responseTimes.length);
    }
  }
  
  /**
   * 에러 이벤트 처리
   */
  async handleErrorEvent(logEntry) {
    // 크리티컬 에러인 경우 즉시 알림
    if (logEntry.level === 'CRITICAL') {
      // TODO: 슬랙, 이메일 등으로 알림 발송
      logger.error('CRITICAL ERROR:', logEntry);
    }
    
    // 에러 카운트 업데이트 (KV)
    try {
      const key = `socket:errors:${logEntry.namespace}`;
      await kv.hincrby(key, 'total', 1);
      await kv.hincrby(key, logEntry.eventName, 1);
      await kv.expire(key, 86400); // 24시간
    } catch (error) {
      logger.error('Failed to update error metrics:', error);
    }
  }
  
  /**
   * 메트릭스 주기적 업데이트
   */
  startMetricsUpdater() {
    setInterval(async () => {
      try {
        await kv.set('socket:metrics:summary', JSON.stringify(this.metrics));
        await kv.expire('socket:metrics:summary', 60); // 1분
      } catch (error) {
        logger.error('Failed to update metrics summary:', error);
      }
    }, CONFIG.METRICS_UPDATE_INTERVAL);
  }
  
  /**
   * 메트릭스 조회
   */
  async getMetrics(namespace = null) {
    try {
      if (namespace) {
        const key = `socket:metrics:${namespace}`;
        const metrics = await kv.hgetall(key);
        return metrics;
      }

      const summary = await kv.get('socket:metrics:summary');
      return summary ? JSON.parse(summary) : this.metrics;
    } catch (error) {
      logger.error('Failed to get metrics:', error);
      return this.metrics;
    }
  }
  
  /**
   * 최근 이벤트 조회
   */
  async getRecentEvents(namespace, limit = 10) {
    try {
      const key = `socket:recent:${namespace}`;
      const events = await kv.lrange(key, 0, limit - 1);
      return events.map(e => JSON.parse(e));
    } catch (error) {
      logger.error('Failed to get recent events:', error);
      return [];
    }
  }
  
  /**
   * 로그 검색
   */
  async searchLogs(criteria) {
    const {
      namespace,
      eventName,
      category,
      level,
      userId,
      storeId,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = criteria;
    
    const where = {};
    
    if (namespace) where.namespace = namespace;
    if (eventName) where.eventName = eventName;
    if (category) where.category = category;
    if (level) where.level = level;
    if (userId) where.userId = userId;
    if (storeId) where.storeId = storeId;
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Sequelize.Op.gte] = startDate;
      if (endDate) where.timestamp[Sequelize.Op.lte] = endDate;
    }
    
    try {
      const logs = await EventLog.findAll({
        where,
        limit,
        offset,
        order: [['timestamp', 'DESC']]
      });
      
      return logs;
    } catch (error) {
      logger.error('Failed to search logs:', error);
      return [];
    }
  }
  
  /**
   * 로그 정리 (오래된 로그 삭제)
   */
  async cleanupOldLogs() {
    try {
      for (const [level, days] of Object.entries(CONFIG.RETENTION)) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        await EventLog.destroy({
          where: {
            level,
            timestamp: {
              [Sequelize.Op.lt]: cutoffDate
            }
          }
        });
      }
      
      logger.info('Old logs cleaned up successfully');
    } catch (error) {
      logger.error('Failed to cleanup old logs:', error);
    }
  }
  
  /**
   * 이벤트 통계 생성
   */
  async generateStatistics(namespace, period = 'day') {
    const stats = {
      period,
      namespace,
      totalEvents: 0,
      eventsByCategory: {},
      eventsByHour: {},
      topEvents: [],
      errorRate: 0,
      avgResponseTime: 0
    };
    
    try {
      const startDate = new Date();
      if (period === 'day') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      }
      
      const logs = await EventLog.findAll({
        where: {
          namespace,
          timestamp: {
            [Sequelize.Op.gte]: startDate
          }
        },
        attributes: [
          'eventName',
          'category',
          'level',
          [Sequelize.fn('COUNT', '*'), 'count'],
          [Sequelize.fn('AVG', Sequelize.col('duration')), 'avgDuration']
        ],
        group: ['eventName', 'category', 'level'],
        raw: true
      });
      
      // 통계 집계
      logs.forEach(log => {
        stats.totalEvents += parseInt(log.count);
        
        if (!stats.eventsByCategory[log.category]) {
          stats.eventsByCategory[log.category] = 0;
        }
        stats.eventsByCategory[log.category] += parseInt(log.count);
        
        stats.topEvents.push({
          event: log.eventName,
          count: parseInt(log.count),
          avgDuration: parseFloat(log.avgDuration) || 0
        });
      });
      
      // Top 10 이벤트
      stats.topEvents.sort((a, b) => b.count - a.count);
      stats.topEvents = stats.topEvents.slice(0, 10);
      
      // 에러율 계산
      const errorCount = logs.filter(l => l.level === 'ERROR' || l.level === 'CRITICAL')
                              .reduce((sum, l) => sum + parseInt(l.count), 0);
      stats.errorRate = stats.totalEvents > 0 ? (errorCount / stats.totalEvents * 100).toFixed(2) : 0;
      
      return stats;
      
    } catch (error) {
      logger.error('Failed to generate statistics:', error);
      return stats;
    }
  }
}

// 싱글톤 인스턴스
const eventLogger = new EventLogger();

// 로그 정리 스케줄러 (매일 자정)
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    eventLogger.cleanupOldLogs();
  }
}, 60000); // 1분마다 체크

export default eventLogger;

// 편의 함수 export
export const {
  logEvent,
  logConnection,
  logAuthentication,
  logBusinessEvent,
  logError,
  getMetrics,
  getRecentEvents,
  searchLogs,
  generateStatistics
} = eventLogger;
