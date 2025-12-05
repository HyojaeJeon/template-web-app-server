/**
 * 성능 최적화 서비스
 * 쿼리 최적화, 캐시 전략, 데이터 로딩 최적화 등을 관리
 */

export class PerformanceOptimizer {
  constructor(container) {
    this.container = container;
    this.logger = container.resolve('logger');
    this.cacheService = container.resolve('cacheService');
    this.sequelize = container.resolve('sequelize');
    this.metrics = {
      queryCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgQueryTime: 0,
      totalQueries: [],
    };
  }

  /**
   * DataLoader 패턴으로 N+1 쿼리 해결
   *
   * @param batchLoadFn
   * @param options
   */
  createDataLoader(batchLoadFn, options = {}) {
    const DataLoader = require('dataloader');
    
    return new DataLoader(async (keys) => {
      const startTime = Date.now();
      
      try {
        const results = await batchLoadFn(keys);
        
        // 성능 메트릭 수집
        const duration = Date.now() - startTime;
        this._recordQueryMetric('dataloader', duration, keys.length);
        
        return results;
      } catch (error) {
        this.logger.error('[PerformanceOptimizer] DataLoader 배치 로딩 실패:', error);
        throw error;
      }
    }, {
      cache: true,
      maxBatchSize: options.maxBatchSize || 100,
      batchScheduleFn: options.batchScheduleFn || undefined,
      ...options,
    });
  }

  /**
   * 쿼리 최적화 - Local 특화 인덱스 힌트
   *
   * @param model
   * @param query
   */
  optimizeQueryForVietnam(model, query) {
    const optimizedQuery = { ...query };

    // Local 지역 기반 쿼리 최적화
    if (query.where && (query.where.district || query.where.ward)) {
      optimizedQuery.order = optimizedQuery.order || [];
      // 지역별 인덱스 활용을 위한 정렬 추가
      optimizedQuery.order.push(['district', 'ASC'], ['ward', 'ASC']);
    }

    // Local 전화번호 검색 최적화
    if (query.where && query.where.phone) {
      optimizedQuery.where.phone = {
        [this.sequelize.Op.like]: `${query.where.phone}%`,
      };
    }

    // Local 주소 검색 최적화 (전체 텍스트 검색)
    if (query.where && query.where.address) {
      optimizedQuery.where.address = {
        [this.sequelize.Op.match]: this.sequelize.fn('AGAINST', query.where.address, 'IN BOOLEAN MODE'),
      };
    }

    return optimizedQuery;
  }

  /**
   * 스마트 캐시 전략
   *
   * @param key
   * @param dataFetcher
   * @param options
   */
  async smartCache(key, dataFetcher, options = {}) {
    const {
      ttl = 3600,
      tags = [],
      refreshThreshold = 0.8, // TTL의 80%가 지나면 백그라운드 새로고침
      forceRefresh = false,
    } = options;

    try {
      // 강제 새로고침이 아닌 경우 캐시 확인
      if (!forceRefresh) {
        const cachedData = await this.cacheService.get(key);
        const keyTTL = await this.cacheService.ttl(key);
        
        if (cachedData) {
          this.metrics.cacheHits++;
          
          // TTL 기반 백그라운드 새로고침
          if (keyTTL > 0 && keyTTL < (ttl * refreshThreshold)) {
            // 백그라운드에서 새로고침 (비동기)
            this._backgroundRefresh(key, dataFetcher, ttl, tags);
          }
          
          return cachedData;
        }
      }

      this.metrics.cacheMisses++;

      // 데이터 fetch
      const startTime = Date.now();
      const freshData = await dataFetcher();
      const duration = Date.now() - startTime;

      // 캐시 저장
      await this.cacheService.set(key, freshData, ttl);
      
      // 태그 기반 캐시 무효화를 위한 태그 등록
      if (tags.length > 0) {
        await this._registerCacheTags(key, tags);
      }

      this._recordQueryMetric('cache_miss', duration, 1);
      
      return freshData;
    } catch (error) {
      this.logger.error('[PerformanceOptimizer] 스마트 캐시 실패:', error);
      throw error;
    }
  }

  /**
   * 백그라운드 캐시 새로고침
   *
   * @param key
   * @param dataFetcher
   * @param ttl
   * @param tags
   */
  async _backgroundRefresh(key, dataFetcher, ttl, tags) {
    try {
      const freshData = await dataFetcher();
      await this.cacheService.set(key, freshData, ttl);
      
      if (tags.length > 0) {
        await this._registerCacheTags(key, tags);
      }
      
      this.logger.debug(`[PerformanceOptimizer] 백그라운드 캐시 새로고침 완료: ${key}`);
    } catch (error) {
      this.logger.error(`[PerformanceOptimizer] 백그라운드 새로고침 실패: ${key}`, error);
    }
  }

  /**
   * 태그 기반 캐시 무효화 시스템
   *
   * @param cacheKey
   * @param tags
   */
  async _registerCacheTags(cacheKey, tags) {
    for (const tag of tags) {
      const tagKey = `cache_tag:${tag}`;
      await this.cacheService.sadd(tagKey, cacheKey);
      // 태그도 TTL 설정 (캐시와 같은 수명)
      await this.cacheService.expire(tagKey, 3600);
    }
  }

  /**
   * 태그별 캐시 무효화
   *
   * @param tag
   */
  async invalidateCacheByTag(tag) {
    try {
      const tagKey = `cache_tag:${tag}`;
      const cacheKeys = await this.cacheService.smembers(tagKey);
      
      if (cacheKeys.length > 0) {
        // 모든 관련 캐시 삭제
        for (const cacheKey of cacheKeys) {
          await this.cacheService.delete(cacheKey);
        }
        
        // 태그 자체도 삭제
        await this.cacheService.delete(tagKey);
        
        this.logger.info(`[PerformanceOptimizer] 태그 기반 캐시 무효화: ${tag} (${cacheKeys.length}개)`);
      }
      
      return cacheKeys.length;
    } catch (error) {
      this.logger.error(`[PerformanceOptimizer] 태그 캐시 무효화 실패: ${tag}`, error);
      return 0;
    }
  }

  /**
   * 쿼리 성능 모니터링 미들웨어
   */
  createQueryMonitoringMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const originalQuery = this.sequelize.query.bind(this.sequelize);
      
      // Sequelize 쿼리 후킹
      this.sequelize.query = async (...args) => {
        const queryStartTime = Date.now();
        
        try {
          const result = await originalQuery(...args);
          const queryDuration = Date.now() - queryStartTime;
          
          this._recordQueryMetric('sql', queryDuration, 1, args[0]);
          
          return result;
        } catch (error) {
          const queryDuration = Date.now() - queryStartTime;
          this._recordQueryMetric('sql_error', queryDuration, 1, args[0]);
          throw error;
        }
      };

      // 응답 후 복원
      res.on('finish', () => {
        this.sequelize.query = originalQuery;
        const totalDuration = Date.now() - startTime;
        this._recordRequestMetric(req.path, totalDuration);
      });

      next();
    };
  }

  /**
   * 쿼리 메트릭 수집
   *
   * @param type
   * @param duration
   * @param count
   * @param query
   */
  _recordQueryMetric(type, duration, count = 1, query = '') {
    this.metrics.queryCount += count;
    
    const queryInfo = {
      type,
      duration,
      count,
      query: query.substring(0, 200), // 쿼리 앞부분만 저장
      timestamp: Date.now(),
    };
    
    this.metrics.totalQueries.push(queryInfo);
    
    // 최근 1000개 쿼리만 보관
    if (this.metrics.totalQueries.length > 1000) {
      this.metrics.totalQueries.shift();
    }
    
    // 평균 쿼리 시간 계산
    this.metrics.avgQueryTime = this.metrics.totalQueries.reduce((sum, q) => sum + q.duration, 0) / this.metrics.totalQueries.length;
    
    // 느린 쿼리 경고 (500ms 이상)
    if (duration > 500) {
      this.logger.warn(`[PerformanceOptimizer] 느린 쿼리 감지: ${type} (${duration}ms)`, { query: query.substring(0, 500) });
    }
  }

  /**
   * 요청 메트릭 수집
   *
   * @param path
   * @param duration
   */
  _recordRequestMetric(path, duration) {
    // Redis에 요청별 통계 저장
    const hour = new Date().getHours();
    const today = new Date().toISOString().split('T')[0];
    const key = `perf_metrics:requests:${today}:${hour}`;
    
    this.cacheService.hashSet(key, path, {
      count: 1,
      totalDuration: duration,
      avgDuration: duration,
      lastRequest: Date.now(),
    }, 86400); // 24시간 보관
  }

  /**
   * 데이터베이스 연결 풀 최적화
   */
  optimizeDatabasePool() {
    const poolConfig = {
      max: process.env.NODE_ENV === 'production' ? 20 : 5,
      min: 2,
      acquire: 30000, // 30초
      idle: 10000,    // 10초
      evict: 10000,   // 10초마다 유휴 연결 정리
      handleDisconnects: true,
      dialectOptions: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_vietnamese_ci', // Local어 콜레이션
        timezone: '+07:00', // Local 시간대
        acquireTimeout: 30000,
        timeout: 60000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      },
    };

    return poolConfig;
  }

  /**
   * GraphQL 쿼리 최적화
   */
  createGraphQLOptimizer() {
    return {
      // 쿼리 복잡도 분석
      complexity: (args) => {
        const { query, variables } = args;
        let complexity = 1;
        
        // 중첩 쿼리 복잡도 계산
        const depth = this._calculateQueryDepth(query);
        complexity *= Math.pow(2, depth - 1);
        
        // 리스트 쿼리 복잡도 증가
        if (query.includes('allStores') || query.includes('allOrders')) {
          complexity *= 5;
        }
        
        return complexity;
      },

      // 쿼리 캐싱 키 생성
      cacheKeyGenerator: (query, variables) => {
        const queryHash = require('crypto')
          .createHash('md5')
          .update(query)
          .digest('hex');
          
        const variablesHash = require('crypto')
          .createHash('md5')
          .update(JSON.stringify(variables || {}))
          .digest('hex');
          
        return `gql:${queryHash}:${variablesHash}`;
      },
    };
  }

  /**
   * GraphQL 쿼리 깊이 계산
   *
   * @param query
   */
  _calculateQueryDepth(query) {
    const lines = query.split('\n');
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (const line of lines) {
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      
      currentDepth += openBraces - closeBraces;
      maxDepth = Math.max(maxDepth, currentDepth);
    }
    
    return maxDepth;
  }

  /**
   * 이미지 최적화 전략
   */
  createImageOptimizer() {
    return {
      // Local 음식 이미지 최적화 설정
      foodImageSizes: [
        { name: 'thumbnail', width: 150, height: 150, quality: 80 },
        { name: 'small', width: 300, height: 300, quality: 85 },
        { name: 'medium', width: 600, height: 400, quality: 85 },
        { name: 'large', width: 1200, height: 800, quality: 90 },
      ],
      
      // WebP 변환 설정
      webpConfig: {
        quality: 85,
        effort: 6,
        nearLossless: false,
      },
      
      // CDN 캐시 헤더
      cacheHeaders: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Vary': 'Accept',
      },
    };
  }

  /**
   * 성능 메트릭 리포트 생성
   */
  async generatePerformanceReport() {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        database: {
          queryCount: this.metrics.queryCount,
          avgQueryTime: Math.round(this.metrics.avgQueryTime * 100) / 100,
          slowQueries: this.metrics.totalQueries
            .filter(q => q.duration > 500)
            .slice(-10), // 최근 10개 느린 쿼리
        },
        cache: {
          hitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100,
          totalHits: this.metrics.cacheHits,
          totalMisses: this.metrics.cacheMisses,
        },
        recommendations: [],
      };

      // 성능 권장사항 생성
      if (report.cache.hitRate < 70) {
        report.recommendations.push({
          type: 'CACHE_OPTIMIZATION',
          message: '캐시 히트율이 낮습니다. 캐시 키와 TTL을 검토해보세요.',
          priority: 'HIGH',
        });
      }

      if (report.database.avgQueryTime > 200) {
        report.recommendations.push({
          type: 'QUERY_OPTIMIZATION', 
          message: '평균 쿼리 시간이 길습니다. 인덱스와 쿼리를 최적화해보세요.',
          priority: 'HIGH',
        });
      }

      if (report.database.slowQueries.length > 5) {
        report.recommendations.push({
          type: 'SLOW_QUERY_ANALYSIS',
          message: '느린 쿼리가 많이 발견되었습니다. 쿼리 최적화가 필요합니다.',
          priority: 'MEDIUM',
        });
      }

      return report;
    } catch (error) {
      this.logger.error('[PerformanceOptimizer] 성능 리포트 생성 실패:', error);
      return { error: error.message };
    }
  }

  /**
   * 메트릭 초기화
   */
  resetMetrics() {
    this.metrics = {
      queryCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgQueryTime: 0,
      totalQueries: [],
    };
    
    this.logger.info('[PerformanceOptimizer] 성능 메트릭이 초기화되었습니다.');
  }

  /**
   * 현재 메트릭 조회
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100 || 0,
    };
  }
}