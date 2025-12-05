/**
 * 읽기 전용 복제본 활용 서비스
 * MySQL Master-Slave 복제 환경에서 읽기/쓰기 분산 처리
 * - 자동 읽기/쓰기 라우팅
 * - 복제본 상태 모니터링
 * - 장애 조치 및 복구
 * - Local 지역별 복제본 최적화
 */

import { Logger } from '../utils';
import { format } from '../utils/format';

class ReadReplicaService {
  constructor() {
    this.logger = new Logger('ReadReplica');
    this.masterConnection = null;
    this.readReplicas = new Map();
    this.replicaHealth = new Map();
    this.queryRouter = new QueryRouter();
    this.isInitialized = false;
    
    // Local 지역별 복제본 설정
    this.vietnamRegions = {
      'HoChiMinh': { priority: 1, location: 'South' },
      'Hanoi': { priority: 2, location: 'North' },
      'DaNang': { priority: 3, location: 'Central' },
      'CanTho': { priority: 4, location: 'MekongDelta' },
      'HaiPhong': { priority: 5, location: 'Northeast' }
    };
    
    // 복제본 설정
    this.replicaConfig = {
      maxLag: 5000, // 최대 5초 지연 허용
      healthCheckInterval: 30000, // 30초마다 상태 확인
      failoverTimeout: 10000, // 10초 내 장애 조치
      connectionTimeout: 5000 // 5초 연결 타임아웃
    };
  }

  /**
   * 읽기 복제본 서비스 초기화
   */
  async initialize() {
    try {
      this.logger.info('읽기 복제본 서비스 초기화 시작');
      
      // 마스터 데이터베이스 연결
      await this.initializeMasterConnection();
      
      // 읽기 복제본들 초기화
      await this.initializeReadReplicas();
      
      // 복제본 상태 모니터링 시작
      this.startHealthMonitoring();
      
      // 쿼리 라우터 초기화
      await this.queryRouter.initialize();
      
      this.isInitialized = true;
      this.logger.info('읽기 복제본 서비스 초기화 완료');
      
    } catch (error) {
      this.logger.error('읽기 복제본 서비스 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 마스터 데이터베이스 연결 초기화
   */
  async initializeMasterConnection() {
    const masterConfig = {
      host: process.env.DB_MASTER_HOST || 'localhost',
      port: process.env.DB_MASTER_PORT || 3306,
      user: process.env.DB_MASTER_USER || 'root',
      password: process.env.DB_MASTER_PASSWORD || '',
      database: process.env.DB_NAME || 'delivery_mvp',
      connectionLimit: 20,
      acquireTimeout: 60000,
      timeout: 60000
    };
    
    this.masterConnection = await this.createConnection(masterConfig, 'MASTER');
    this.logger.info('마스터 데이터베이스 연결 완료');
  }

  /**
   * 읽기 복제본들 초기화
   */
  async initializeReadReplicas() {
    const replicaConfigs = this.getReplicaConfigs();
    
    for (const config of replicaConfigs) {
      try {
        const connection = await this.createConnection(config, 'REPLICA');
        this.readReplicas.set(config.id, {
          connection,
          config,
          isHealthy: true,
          lastHealthCheck: new Date(),
          queryCount: 0,
          avgResponseTime: 0,
          lagTime: 0
        });
        
        this.logger.info(`읽기 복제본 연결 완료: ${config.id} (${config.region})`);
        
      } catch (error) {
        this.logger.error(`읽기 복제본 연결 실패: ${config.id}`, error);
        // 복제본 연결 실패는 서비스 시작을 막지 않음
      }
    }
  }

  /**
   * 복제본 설정 생성
   */
  getReplicaConfigs() {
    const replicas = [];
    
    // 환경변수에서 복제본 설정 로드
    const replicaCount = parseInt(process.env.DB_REPLICA_COUNT || '2');
    
    for (let i = 1; i <= replicaCount; i++) {
      const replicaId = `replica_${i}`;
      const region = Object.keys(this.vietnamRegions)[i - 1] || 'Default';
      
      replicas.push({
        id: replicaId,
        host: process.env[`DB_REPLICA${i}_HOST`] || 'localhost',
        port: process.env[`DB_REPLICA${i}_PORT`] || (3306 + i),
        user: process.env[`DB_REPLICA${i}_USER`] || 'replica_user',
        password: process.env[`DB_REPLICA${i}_PASSWORD`] || '',
        database: process.env.DB_NAME || 'delivery_mvp',
        region,
        priority: this.vietnamRegions[region]?.priority || 99,
        connectionLimit: 15,
        acquireTimeout: 30000,
        timeout: 30000
      });
    }
    
    return replicas.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 데이터베이스 연결 생성
   */
  async createConnection(config, type) {
    // 실제 구현에서는 mysql2 또는 Sequelize 연결 풀 생성
    this.logger.info(`${type} 연결 생성: ${config.host}:${config.port}`);
    
    // Mock connection 객체
    return {
      config,
      type,
      isConnected: true,
      query: async (sql, params) => {
        // 실제 쿼리 실행 로직
        this.logger.debug(`${type} 쿼리 실행: ${sql.substring(0, 100)}...`);
        return [];
      },
      close: async () => {
        this.logger.info(`${type} 연결 종료`);
      }
    };
  }

  /**
   * 복제본 상태 모니터링 시작
   */
  startHealthMonitoring() {
    setInterval(async () => {
      await this.performHealthChecks();
    }, this.replicaConfig.healthCheckInterval);
    
    this.logger.info('복제본 상태 모니터링 시작');
  }

  /**
   * 복제본 건강 상태 확인
   */
  async performHealthChecks() {
    for (const [replicaId, replica] of this.readReplicas) {
      try {
        const startTime = Date.now();
        
        // 연결 상태 확인
        await replica.connection.query('SELECT 1 as health_check');
        
        // 복제 지연 시간 확인
        const lagTime = await this.checkReplicationLag(replica.connection);
        
        // 응답 시간 계산
        const responseTime = Date.now() - startTime;
        
        // 건강 상태 업데이트
        const isHealthy = lagTime <= this.replicaConfig.maxLag && responseTime <= 1000;
        
        this.replicaHealth.set(replicaId, {
          isHealthy,
          lastCheck: new Date(),
          lagTime,
          responseTime,
          consecutiveFailures: isHealthy ? 0 : (this.replicaHealth.get(replicaId)?.consecutiveFailures || 0) + 1
        });
        
        replica.isHealthy = isHealthy;
        replica.lagTime = lagTime;
        replica.lastHealthCheck = new Date();
        
        if (!isHealthy) {
          this.logger.warn(`복제본 상태 불량: ${replicaId} (지연: ${lagTime}ms, 응답: ${responseTime}ms)`);
        }
        
      } catch (error) {
        this.logger.error(`복제본 상태 확인 실패: ${replicaId}`, error);
        
        const healthInfo = this.replicaHealth.get(replicaId) || {};
        this.replicaHealth.set(replicaId, {
          ...healthInfo,
          isHealthy: false,
          lastCheck: new Date(),
          consecutiveFailures: (healthInfo.consecutiveFailures || 0) + 1,
          lastError: error.message
        });
        
        replica.isHealthy = false;
      }
    }
    
    // 장애 조치 필요 시 실행
    await this.handleFailedReplicas();
  }

  /**
   * 복제 지연 시간 확인
   */
  async checkReplicationLag(connection) {
    try {
      const result = await connection.query(`
        SELECT TIMESTAMPDIFF(MICROSECOND, 
          (SELECT MAX(createdAt) FROM Orders), 
          NOW()
        ) / 1000 as lag_ms
      `);
      
      return result[0]?.lag_ms || 0;
      
    } catch (error) {
      this.logger.error('복제 지연 확인 실패:', error);
      return 999999; // 매우 큰 값으로 설정하여 unhealthy 처리
    }
  }

  /**
   * 장애 발생 복제본 처리
   */
  async handleFailedReplicas() {
    const failedReplicas = Array.from(this.replicaHealth.entries())
      .filter(([_, health]) => !health.isHealthy && health.consecutiveFailures >= 3);
    
    for (const [replicaId, health] of failedReplicas) {
      this.logger.warn(`복제본 장애 감지: ${replicaId} (연속 실패: ${health.consecutiveFailures}회)`);
      
      // 복제본을 라우팅에서 제외
      this.queryRouter.excludeReplica(replicaId);
      
      // 자동 복구 시도
      await this.attemptReplicaRecovery(replicaId);
    }
  }

  /**
   * 복제본 복구 시도
   */
  async attemptReplicaRecovery(replicaId) {
    try {
      this.logger.info(`복제본 복구 시도: ${replicaId}`);
      
      const replica = this.readReplicas.get(replicaId);
      if (!replica) return;
      
      // 기존 연결 종료
      await replica.connection.close();
      
      // 새 연결 생성
      const newConnection = await this.createConnection(replica.config, 'REPLICA');
      replica.connection = newConnection;
      
      // 복제 상태 확인
      const lagTime = await this.checkReplicationLag(newConnection);
      
      if (lagTime <= this.replicaConfig.maxLag) {
        replica.isHealthy = true;
        this.replicaHealth.set(replicaId, {
          isHealthy: true,
          lastCheck: new Date(),
          lagTime,
          consecutiveFailures: 0,
          recoveredAt: new Date()
        });
        
        // 라우팅에 다시 포함
        this.queryRouter.includeReplica(replicaId);
        
        this.logger.info(`복제본 복구 성공: ${replicaId}`);
        
      } else {
        this.logger.warn(`복제본 복구 실패: ${replicaId} (지연 시간: ${lagTime}ms)`);
      }
      
    } catch (error) {
      this.logger.error(`복제본 복구 실패: ${replicaId}`, error);
    }
  }

  /**
   * 읽기 쿼리 실행 (복제본 사용)
   */
  async executeReadQuery(sql, params = [], options = {}) {
    try {
      // 적절한 복제본 선택
      const replica = await this.selectOptimalReplica(options);
      
      if (!replica) {
        this.logger.warn('사용 가능한 복제본이 없음, 마스터에서 읽기 실행');
        return this.executeOnMaster(sql, params);
      }
      
      const startTime = Date.now();
      const result = await replica.connection.query(sql, params);
      const queryTime = Date.now() - startTime;
      
      // 성능 통계 업데이트
      this.updateReplicaStats(replica.config.id, queryTime);
      
      this.logger.debug(`읽기 쿼리 실행 완료: ${replica.config.id} (${queryTime}ms)`);
      
      return result;
      
    } catch (error) {
      this.logger.error('읽기 쿼리 실행 실패:', error);
      
      // 장애 조치: 마스터에서 실행
      return this.executeOnMaster(sql, params);
    }
  }

  /**
   * 쓰기 쿼리 실행 (마스터 사용)
   */
  async executeWriteQuery(sql, params = []) {
    try {
      const startTime = Date.now();
      const result = await this.masterConnection.query(sql, params);
      const queryTime = Date.now() - startTime;
      
      this.logger.debug(`쓰기 쿼리 실행 완료: MASTER (${queryTime}ms)`);
      
      // 복제본 동기화 대기 (옵션)
      if (this.shouldWaitForSync(sql)) {
        await this.waitForReplicationSync();
      }
      
      return result;
      
    } catch (error) {
      this.logger.error('쓰기 쿼리 실행 실패:', error);
      throw error;
    }
  }

  /**
   * 최적 복제본 선택
   */
  async selectOptimalReplica(options = {}) {
    const healthyReplicas = Array.from(this.readReplicas.values())
      .filter(replica => replica.isHealthy);
    
    if (healthyReplicas.length === 0) {
      return null;
    }
    
    // 지역 우선순위 적용 (Local 특화)
    if (options.userRegion) {
      const regionReplicas = healthyReplicas.filter(
        replica => replica.config.region === options.userRegion
      );
      
      if (regionReplicas.length > 0) {
        return this.selectByPerformance(regionReplicas);
      }
    }
    
    // 성능 기반 선택
    return this.selectByPerformance(healthyReplicas);
  }

  /**
   * 성능 기반 복제본 선택
   */
  selectByPerformance(replicas) {
    // 가중치 계산: 응답시간 + 지연시간 + 쿼리 부하
    return replicas.reduce((best, current) => {
      const currentScore = this.calculateReplicaScore(current);
      const bestScore = best ? this.calculateReplicaScore(best) : Infinity;
      
      return currentScore < bestScore ? current : best;
    }, null);
  }

  /**
   * 복제본 점수 계산
   */
  calculateReplicaScore(replica) {
    const health = this.replicaHealth.get(replica.config.id) || {};
    
    const responseWeight = (health.responseTime || 1000) * 0.4;
    const lagWeight = (health.lagTime || 5000) * 0.3;
    const loadWeight = replica.queryCount * 0.2;
    const priorityWeight = replica.config.priority * 0.1;
    
    return responseWeight + lagWeight + loadWeight + priorityWeight;
  }

  /**
   * 복제본 통계 업데이트
   */
  updateReplicaStats(replicaId, queryTime) {
    const replica = this.readReplicas.get(replicaId);
    if (!replica) return;
    
    replica.queryCount += 1;
    replica.avgResponseTime = (replica.avgResponseTime + queryTime) / 2;
  }

  /**
   * 마스터에서 쿼리 실행 (장애 조치)
   */
  async executeOnMaster(sql, params) {
    if (!this.masterConnection) {
      throw new Error('마스터 데이터베이스 연결이 없습니다');
    }
    
    this.logger.warn('마스터에서 읽기 쿼리 실행 (복제본 장애)');
    return this.masterConnection.query(sql, params);
  }

  /**
   * 복제 동기화 대기 필요 여부 확인
   */
  shouldWaitForSync(sql) {
    // 중요한 쓰기 작업 후 동기화 대기
    const criticalOperations = [
      'INSERT INTO Orders',
      'UPDATE Orders SET status',
      'INSERT INTO Payments',
      'UPDATE Store SET'
    ];
    
    return criticalOperations.some(op => sql.trim().toUpperCase().startsWith(op.toUpperCase()));
  }

  /**
   * 복제 동기화 대기
   */
  async waitForReplicationSync(maxWaitTime = 10000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const healthyReplicasCount = Array.from(this.readReplicas.values())
        .filter(replica => replica.isHealthy && replica.lagTime <= this.replicaConfig.maxLag)
        .length;
      
      if (healthyReplicasCount > 0) {
        this.logger.debug(`복제 동기화 완료 (${Date.now() - startTime}ms)`);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.logger.warn(`복제 동기화 대기 시간 초과 (${maxWaitTime}ms)`);
  }

  /**
   * Local 지역별 읽기 최적화
   */
  async executeRegionalReadQuery(sql, params, userLocation) {
    try {
      // 사용자 위치 기반 최적 복제본 선택
      const userRegion = this.determineUserRegion(userLocation);
      const replica = await this.selectOptimalReplica({ userRegion });
      
      if (replica) {
        return this.executeReadQuery(sql, params, { preferredReplica: replica.config.id });
      }
      
      // 지역 복제본이 없으면 일반 읽기 실행
      return this.executeReadQuery(sql, params);
      
    } catch (error) {
      this.logger.error('지역별 읽기 쿼리 실행 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 위치에서 지역 결정
   */
  determineUserRegion(location) {
    if (!location) return null;
    
    const locationStr = typeof location === 'string' ? location : 
      `${location.city} ${location.district}`;
    
    // Local 주요 도시 매칭
    for (const [region, info] of Object.entries(this.vietnamRegions)) {
      if (locationStr.includes(region) || locationStr.includes(info.location)) {
        return region;
      }
    }
    
    return null;
  }

  /**
   * 배달 경로 최적화 쿼리
   */
  async executeDeliveryOptimizedQuery(storeLocation, deliveryLocation) {
    try {
      // 동일 지역 내 배달은 지역 복제본 사용
      const storeRegion = this.determineUserRegion(storeLocation);
      const deliveryRegion = this.determineUserRegion(deliveryLocation);
      
      const preferredRegion = storeRegion === deliveryRegion ? storeRegion : null;
      
      const sql = `
        SELECT o.*, s.name as storeName, s.latitude, s.longitude
        FROM Orders o
        JOIN Stores s ON o.storeId = s.id
        WHERE o.deliveryCity = ? 
          AND o.status IN ('PREPARING', 'READY', 'PICKED_UP')
          AND s.city = ?
        ORDER BY o.estimatedDeliveryTime ASC
        LIMIT 50
      `;
      
      return this.executeRegionalReadQuery(
        sql, 
        [deliveryLocation.city, storeLocation.city], 
        preferredRegion
      );
      
    } catch (error) {
      this.logger.error('배달 최적화 쿼리 실행 실패:', error);
      throw error;
    }
  }

  /**
   * 복제본 성능 리포트 생성
   */
  async generatePerformanceReport() {
    try {
      const report = {
        overview: {
          totalReplicas: this.readReplicas.size,
          healthyReplicas: Array.from(this.readReplicas.values()).filter(r => r.isHealthy).length,
          avgLagTime: 0,
          avgResponseTime: 0,
          totalQueries: 0
        },
        regionPerformance: {},
        recommendations: []
      };
      
      // 전체 평균 계산
      let totalLag = 0, totalResponse = 0, totalQueries = 0;
      
      for (const [replicaId, replica] of this.readReplicas) {
        const health = this.replicaHealth.get(replicaId) || {};
        
        totalLag += health.lagTime || 0;
        totalResponse += health.responseTime || 0;
        totalQueries += replica.queryCount;
        
        // 지역별 성능 수집
        const region = replica.config.region;
        if (!report.regionPerformance[region]) {
          report.regionPerformance[region] = {
            replicas: 0,
            avgLag: 0,
            avgResponse: 0,
            queryCount: 0,
            healthyReplicas: 0
          };
        }
        
        const regionStats = report.regionPerformance[region];
        regionStats.replicas += 1;
        regionStats.avgLag += health.lagTime || 0;
        regionStats.avgResponse += health.responseTime || 0;
        regionStats.queryCount += replica.queryCount;
        
        if (replica.isHealthy) {
          regionStats.healthyReplicas += 1;
        }
      }
      
      // 평균 계산
      const replicaCount = this.readReplicas.size;
      report.overview.avgLagTime = Math.round(totalLag / replicaCount);
      report.overview.avgResponseTime = Math.round(totalResponse / replicaCount);
      report.overview.totalQueries = totalQueries;
      
      // 지역별 평균 계산
      for (const region in report.regionPerformance) {
        const stats = report.regionPerformance[region];
        stats.avgLag = Math.round(stats.avgLag / stats.replicas);
        stats.avgResponse = Math.round(stats.avgResponse / stats.replicas);
      }
      
      // 권장사항 생성
      report.recommendations = this.generateReplicaRecommendations(report);
      
      return report;
      
    } catch (error) {
      this.logger.error('성능 리포트 생성 실패:', error);
      return null;
    }
  }

  /**
   * 복제본 권장사항 생성
   */
  generateReplicaRecommendations(report) {
    const recommendations = [];
    
    // 지연 시간 기반 권장사항
    if (report.overview.avgLagTime > this.replicaConfig.maxLag) {
      recommendations.push({
        type: 'LAG_OPTIMIZATION',
        priority: 'HIGH',
        message: `평균 복제 지연이 ${report.overview.avgLagTime}ms입니다. 네트워크 최적화가 필요합니다.`,
        action: 'optimizeReplicationNetwork'
      });
    }
    
    // 응답 시간 기반 권장사항
    if (report.overview.avgResponseTime > 1000) {
      recommendations.push({
        type: 'RESPONSE_TIME',
        priority: 'MEDIUM',
        message: '복제본 응답 시간이 느립니다. 하드웨어 업그레이드를 고려하세요.',
        action: 'upgradeReplicaHardware'
      });
    }
    
    // 지역별 불균형 감지
    const regionStats = Object.values(report.regionPerformance);
    const loadImbalance = Math.max(...regionStats.map(r => r.queryCount)) / 
                         Math.min(...regionStats.map(r => r.queryCount));
    
    if (loadImbalance > 3) {
      recommendations.push({
        type: 'LOAD_BALANCING',
        priority: 'MEDIUM',
        message: '지역별 쿼리 부하가 불균형합니다. 로드 밸런싱 조정이 필요합니다.',
        action: 'rebalanceRegionalLoad'
      });
    }
    
    // Local 특화 권장사항
    const vietnamSpecific = this.generateVietnamSpecificRecommendations(report);
    recommendations.push(...vietnamSpecific);
    
    return recommendations;
  }

  /**
   * Local 특화 권장사항
   */
  generateVietnamSpecificRecommendations(report) {
    const recommendations = [];
    
    // 호치민/하노이 지역 최적화
    const hcmStats = report.regionPerformance['HoChiMinh'];
    const hanoiStats = report.regionPerformance['Hanoi'];
    
    if (hcmStats && hcmStats.queryCount > hanoiStats?.queryCount * 2) {
      recommendations.push({
        type: 'VIETNAM_REGIONAL',
        priority: 'HIGH',
        message: '호치민 지역의 쿼리 부하가 높습니다. 추가 복제본 배치를 권장합니다.',
        action: 'addHoChiMinhReplica',
        region: 'HoChiMinh'
      });
    }
    
    // 피크 시간 대응
    recommendations.push({
      type: 'PEAK_TIME_OPTIMIZATION',
      priority: 'MEDIUM',
      message: 'Local 점심/저녁 피크 시간(11-13시, 17-20시) 복제본 확장을 권장합니다.',
      action: 'configurePeakTimeScaling',
      peakHours: [11, 12, 13, 17, 18, 19, 20]
    });
    
    return recommendations;
  }

  /**
   * 트랜잭션 읽기 일관성 보장
   */
  async executeConsistentRead(sql, params = []) {
    // 강한 일관성이 필요한 경우 마스터에서 읽기
    this.logger.debug('일관성 읽기: 마스터 사용');
    return this.executeOnMaster(sql, params);
  }

  /**
   * 복제본 상태 요약
   */
  getReplicaStatus() {
    const status = {
      isInitialized: this.isInitialized,
      masterStatus: this.masterConnection ? 'CONNECTED' : 'DISCONNECTED',
      replicas: {},
      summary: {
        total: this.readReplicas.size,
        healthy: 0,
        unhealthy: 0,
        avgLag: 0,
        totalQueries: 0
      }
    };
    
    let totalLag = 0, healthyCount = 0;
    
    for (const [replicaId, replica] of this.readReplicas) {
      const health = this.replicaHealth.get(replicaId) || {};
      
      status.replicas[replicaId] = {
        isHealthy: replica.isHealthy,
        region: replica.config.region,
        lagTime: health.lagTime || 0,
        responseTime: health.responseTime || 0,
        queryCount: replica.queryCount,
        lastHealthCheck: replica.lastHealthCheck,
        consecutiveFailures: health.consecutiveFailures || 0
      };
      
      if (replica.isHealthy) {
        healthyCount++;
        totalLag += health.lagTime || 0;
      }
      
      status.summary.totalQueries += replica.queryCount;
    }
    
    status.summary.healthy = healthyCount;
    status.summary.unhealthy = status.summary.total - healthyCount;
    status.summary.avgLag = healthyCount > 0 ? Math.round(totalLag / healthyCount) : 0;
    
    return status;
  }

  /**
   * 서비스 정리
   */
  async cleanup() {
    try {
      this.logger.info('읽기 복제본 서비스 정리 시작');
      
      // 모든 복제본 연결 종료
      for (const [replicaId, replica] of this.readReplicas) {
        await replica.connection.close();
        this.logger.info(`복제본 연결 종료: ${replicaId}`);
      }
      
      // 마스터 연결 종료
      if (this.masterConnection) {
        await this.masterConnection.close();
        this.logger.info('마스터 연결 종료');
      }
      
      this.readReplicas.clear();
      this.replicaHealth.clear();
      this.isInitialized = false;
      
      this.logger.info('읽기 복제본 서비스 정리 완료');
      
    } catch (error) {
      this.logger.error('서비스 정리 실패:', error);
    }
  }
}

/**
 * 쿼리 라우터 클래스
 * 읽기/쓰기 쿼리를 자동으로 적절한 데이터베이스로 라우팅
 */
class QueryRouter {
  constructor() {
    this.logger = new Logger('QueryRouter');
    this.excludedReplicas = new Set();
    this.routingRules = new Map();
  }

  async initialize() {
    // 라우팅 규칙 설정
    this.setupRoutingRules();
    this.logger.info('쿼리 라우터 초기화 완료');
  }

  setupRoutingRules() {
    // 읽기 전용 쿼리 패턴
    const readOnlyPatterns = [
      /^SELECT/i,
      /^SHOW/i,
      /^DESCRIBE/i,
      /^EXPLAIN/i
    ];
    
    // 쓰기 쿼리 패턴
    const writePatterns = [
      /^INSERT/i,
      /^UPDATE/i,
      /^DELETE/i,
      /^CREATE/i,
      /^ALTER/i,
      /^DROP/i
    ];
    
    this.routingRules.set('READ_ONLY', readOnlyPatterns);
    this.routingRules.set('WRITE', writePatterns);
  }

  isReadOnlyQuery(sql) {
    const readPatterns = this.routingRules.get('READ_ONLY') || [];
    return readPatterns.some(pattern => pattern.test(sql.trim()));
  }

  isWriteQuery(sql) {
    const writePatterns = this.routingRules.get('WRITE') || [];
    return writePatterns.some(pattern => pattern.test(sql.trim()));
  }

  excludeReplica(replicaId) {
    this.excludedReplicas.add(replicaId);
    this.logger.info(`복제본 라우팅 제외: ${replicaId}`);
  }

  includeReplica(replicaId) {
    this.excludedReplicas.delete(replicaId);
    this.logger.info(`복제본 라우팅 포함: ${replicaId}`);
  }
}

// 싱글톤 인스턴스
const readReplicaService = new ReadReplicaService();

export default readReplicaService;