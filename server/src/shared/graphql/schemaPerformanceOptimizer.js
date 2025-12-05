/**
 * GraphQL 스키마 성능 최적화 시스템
 * 대량의 ENUM 정의를 효율적으로 처리하기 위한 최적화 솔루션
 */

import { LRUCache } from 'lru-cache';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 * 스키마 캐싱 시스템
 */
class SchemaCache {
  constructor(options = {}) {
    this.cache = new LRUCache({
      max: options.maxSize || 100,
      ttl: options.ttl || 3600000, // 1시간
      updateAgeOnGet: true,
      allowStale: false
    });

    this.compressionCache = new LRUCache({
      max: options.compressionCacheSize || 50,
      ttl: options.compressionTtl || 1800000, // 30분
    });

    this.hitCount = 0;
    this.missCount = 0;
    this.compressionEnabled = options.enableCompression !== false;

    console.log('📦 스키마 캐시 시스템 초기화:', {
      maxSize: this.cache.max,
      ttl: this.cache.ttl / 1000 + 's',
      compression: this.compressionEnabled
    });
  }

  /**
   * 캐시에서 스키마 조회
   */
  async get(key) {
    const startTime = performance.now();

    try {
      // 1. 일반 캐시 확인
      let cached = this.cache.get(key);

      if (cached) {
        this.hitCount++;

        // 압축된 데이터인 경우 압축 해제
        if (cached.compressed && this.compressionEnabled) {
          const compressed = this.compressionCache.get(key);
          if (compressed) {
            cached.content = await gunzipAsync(compressed);
            cached.content = cached.content.toString('utf8');
          }
        }

        const endTime = performance.now();
        cached.accessTime = endTime - startTime;

        return cached;
      }

      this.missCount++;
      return null;

    } catch (error) {
      console.error('스키마 캐시 조회 실패:', error.message);
      this.missCount++;
      return null;
    }
  }

  /**
   * 스키마를 캐시에 저장
   */
  async set(key, content, metadata = {}) {
    const startTime = performance.now();

    try {
      const entry = {
        content,
        metadata,
        timestamp: Date.now(),
        size: Buffer.byteLength(content, 'utf8'),
        compressed: false
      };

      // 큰 스키마는 압축 저장
      if (this.compressionEnabled && entry.size > 10 * 1024) { // 10KB 이상
        const compressed = await gzipAsync(content);
        const compressionRatio = compressed.length / entry.size;

        if (compressionRatio < 0.8) { // 20% 이상 압축 효과가 있을 때만
          this.compressionCache.set(key, compressed);
          entry.compressed = true;
          entry.compressedSize = compressed.length;
          entry.compressionRatio = compressionRatio;

          console.log(`📦 스키마 압축 저장: ${key} (${entry.size}B → ${compressed.length}B, ${Math.round(compressionRatio * 100)}%)`);
        }
      }

      this.cache.set(key, entry);

      const endTime = performance.now();
      console.log(`📦 스키마 캐시 저장: ${key} (${Math.round(endTime - startTime)}ms)`);

      return true;

    } catch (error) {
      console.error('스키마 캐시 저장 실패:', error.message);
      return false;
    }
  }

  /**
   * 캐시 통계
   */
  getStats() {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? (this.hitCount / total * 100).toFixed(1) : 0;

    return {
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: hitRate + '%',
      cacheSize: this.cache.size,
      maxSize: this.cache.max,
      compressionCacheSize: this.compressionCache.size
    };
  }

  /**
   * 캐시 초기화
   */
  clear() {
    this.cache.clear();
    this.compressionCache.clear();
    this.hitCount = 0;
    this.missCount = 0;

    console.log('📦 스키마 캐시 초기화 완료');
  }
}

/**
 * 지연 로딩 시스템
 */
class LazySchemaLoader {
  constructor(options = {}) {
    this.basePath = options.basePath || join(__dirname, 'types');
    this.chunkSize = options.chunkSize || 10;
    this.loadTimeout = options.loadTimeout || 5000;
    this.cache = new SchemaCache(options.cache);

    this.loadedChunks = new Set();
    this.loadingPromises = new Map();
    this.dependencyMap = new Map();

    this.initializeDependencies();

    console.log('⚡ 지연 로딩 시스템 초기화:', {
      basePath: this.basePath,
      chunkSize: this.chunkSize,
      loadTimeout: this.loadTimeout + 'ms'
    });
  }

  /**
   * 의존성 맵 초기화
   */
  initializeDependencies() {
    // 도메인별 의존성 정의
    this.dependencyMap.set('auth', ['user', 'system']);
    this.dependencyMap.set('order', ['payment', 'store', 'menu']);
    this.dependencyMap.set('payment', ['system']);
    this.dependencyMap.set('delivery', ['order', 'user']);
    this.dependencyMap.set('review', ['order', 'user']);
    this.dependencyMap.set('notification', ['user', 'order']);
  }

  /**
   * 스키마 청크 로딩
   */
  async loadChunk(chunkId) {
    const cacheKey = `chunk:${chunkId}`;

    // 캐시 확인
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached.content;
    }

    // 이미 로딩 중인 경우 기다림
    if (this.loadingPromises.has(chunkId)) {
      return await this.loadingPromises.get(chunkId);
    }

    // 새로운 로딩 프로미스 생성
    const loadingPromise = this._loadChunkWithTimeout(chunkId);
    this.loadingPromises.set(chunkId, loadingPromise);

    try {
      const content = await loadingPromise;
      this.loadedChunks.add(chunkId);

      // 캐시에 저장
      await this.cache.set(cacheKey, content, {
        chunkId,
        loadTime: Date.now()
      });

      return content;

    } finally {
      this.loadingPromises.delete(chunkId);
    }
  }

  /**
   * 타임아웃이 있는 청크 로딩
   */
  async _loadChunkWithTimeout(chunkId) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`스키마 청크 로딩 타임아웃: ${chunkId}`));
      }, this.loadTimeout);

      this._loadChunkFile(chunkId)
        .then(content => {
          clearTimeout(timer);
          resolve(content);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * 실제 파일 로딩
   */
  async _loadChunkFile(chunkId) {
    const startTime = performance.now();

    try {
      const filePath = join(this.basePath, `${chunkId}-enums.graphql`);

      if (!existsSync(filePath)) {
        throw new Error(`스키마 파일을 찾을 수 없습니다: ${filePath}`);
      }

      const content = readFileSync(filePath, 'utf8');

      const endTime = performance.now();
      console.log(`⚡ 스키마 청크 로딩: ${chunkId} (${Math.round(endTime - startTime)}ms, ${Math.round(content.length / 1024)}KB)`);

      return content;

    } catch (error) {
      console.error(`스키마 청크 로딩 실패: ${chunkId}`, error.message);
      throw error;
    }
  }

  /**
   * 의존성이 있는 스키마 로딩
   */
  async loadWithDependencies(domain) {
    const startTime = performance.now();

    try {
      const dependencies = this.dependencyMap.get(domain) || [];
      const allDomains = [domain, ...dependencies];

      // 의존성 먼저 로딩
      const loadPromises = allDomains.map(d => this.loadChunk(d));
      const contents = await Promise.all(loadPromises);

      const mergedContent = contents.join('\n\n');

      const endTime = performance.now();
      console.log(`⚡ 의존성 포함 로딩: ${domain} (+${dependencies.length}개 의존성, ${Math.round(endTime - startTime)}ms)`);

      return mergedContent;

    } catch (error) {
      console.error(`의존성 로딩 실패: ${domain}`, error.message);
      throw error;
    }
  }

  /**
   * 중요한 스키마 미리 로딩
   */
  async preloadCritical() {
    const criticalDomains = ['auth', 'order', 'payment', 'user', 'system'];

    console.log('⚡ 중요 스키마 미리 로딩 시작...');

    const preloadPromises = criticalDomains.map(async domain => {
      try {
        await this.loadChunk(domain);
        console.log(`   ✅ ${domain}`);
      } catch (error) {
        console.log(`   ❌ ${domain}: ${error.message}`);
      }
    });

    await Promise.allSettled(preloadPromises);

    console.log('⚡ 중요 스키마 미리 로딩 완료');
  }

  /**
   * 로딩 통계
   */
  getStats() {
    return {
      loadedChunks: this.loadedChunks.size,
      totalChunks: this.dependencyMap.size,
      loadingInProgress: this.loadingPromises.size,
      cacheStats: this.cache.getStats()
    };
  }
}

/**
 * 스키마 빌드 최적화
 */
class SchemaBuildOptimizer {
  constructor(options = {}) {
    this.enableParallelization = options.enableParallelization !== false;
    this.maxConcurrency = options.maxConcurrency || 4;
    this.enableMemoization = options.enableMemoization !== false;

    this.memoizedBuilds = new Map();
    this.buildStats = {
      totalBuilds: 0,
      cacheHits: 0,
      parallelBuilds: 0,
      avgBuildTime: 0
    };

    console.log('🏗️ 스키마 빌드 최적화 시스템 초기화:', {
      parallelization: this.enableParallelization,
      maxConcurrency: this.maxConcurrency,
      memoization: this.enableMemoization
    });
  }

  /**
   * 최적화된 스키마 빌드
   */
  async buildOptimized(typeDefs, options = {}) {
    const startTime = performance.now();
    this.buildStats.totalBuilds++;

    try {
      // 메모이제이션 확인
      if (this.enableMemoization) {
        const hash = this._generateHash(typeDefs);
        const cached = this.memoizedBuilds.get(hash);

        if (cached && !this._isExpired(cached)) {
          this.buildStats.cacheHits++;
          const endTime = performance.now();

          console.log(`🏗️ 메모이제이션 히트 (${Math.round(endTime - startTime)}ms)`);

          return cached.schema;
        }
      }

      // 병렬 빌드
      let schema;
      if (this.enableParallelization && Array.isArray(typeDefs)) {
        schema = await this._buildParallel(typeDefs, options);
        this.buildStats.parallelBuilds++;
      } else {
        schema = await this._buildSequential(typeDefs, options);
      }

      // 메모이제이션 저장
      if (this.enableMemoization && schema) {
        const hash = this._generateHash(typeDefs);
        this.memoizedBuilds.set(hash, {
          schema,
          timestamp: Date.now(),
          ttl: options.cacheTtl || 3600000 // 1시간
        });
      }

      const endTime = performance.now();
      const buildTime = endTime - startTime;

      // 평균 빌드 시간 업데이트
      this.buildStats.avgBuildTime = (
        (this.buildStats.avgBuildTime * (this.buildStats.totalBuilds - 1) + buildTime) /
        this.buildStats.totalBuilds
      );

      console.log(`🏗️ 스키마 빌드 완료 (${Math.round(buildTime)}ms)`);

      return schema;

    } catch (error) {
      console.error('스키마 빌드 실패:', error.message);
      throw error;
    }
  }

  /**
   * 병렬 빌드
   */
  async _buildParallel(typeDefsArray, options) {
    const chunks = this._chunkArray(typeDefsArray, this.maxConcurrency);
    const buildPromises = chunks.map(chunk => this._buildChunk(chunk, options));

    const results = await Promise.all(buildPromises);

    // 결과 병합
    return this._mergeSchemas(results);
  }

  /**
   * 순차 빌드
   */
  async _buildSequential(typeDefs, options) {
    const { buildSchema } = await import('graphql');
    return buildSchema(typeDefs, options);
  }

  /**
   * 청크 빌드
   */
  async _buildChunk(chunk, options) {
    const { buildSchema } = await import('graphql');
    const mergedTypeDefs = Array.isArray(chunk) ? chunk.join('\n\n') : chunk;
    return buildSchema(mergedTypeDefs, options);
  }

  /**
   * 스키마 병합
   */
  _mergeSchemas(schemas) {
    // 여기서는 단순화를 위해 첫 번째 스키마 반환
    // 실제 구현에서는 적절한 스키마 병합 로직 필요
    return schemas[0];
  }

  /**
   * 배열 청킹
   */
  _chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 해시 생성 (단순 구현)
   */
  _generateHash(typeDefs) {
    const content = Array.isArray(typeDefs) ? typeDefs.join('') : typeDefs;
    return Buffer.from(content).toString('base64').substring(0, 16);
  }

  /**
   * 캐시 만료 확인
   */
  _isExpired(cached) {
    return Date.now() - cached.timestamp > cached.ttl;
  }

  /**
   * 빌드 통계
   */
  getStats() {
    return {
      ...this.buildStats,
      avgBuildTime: Math.round(this.buildStats.avgBuildTime),
      cacheHitRate: this.buildStats.totalBuilds > 0
        ? Math.round(this.buildStats.cacheHits / this.buildStats.totalBuilds * 100)
        : 0,
      memoizedSchemas: this.memoizedBuilds.size
    };
  }

  /**
   * 캐시 정리
   */
  clearCache() {
    this.memoizedBuilds.clear();
    console.log('🏗️ 스키마 빌드 캐시 정리 완료');
  }
}

/**
 * 통합 성능 최적화 관리자
 */
class SchemaPerformanceManager {
  constructor(options = {}) {
    this.lazyLoader = new LazySchemaLoader(options.lazyLoading);
    this.buildOptimizer = new SchemaBuildOptimizer(options.buildOptimization);

    this.performanceMetrics = {
      startTime: Date.now(),
      totalRequests: 0,
      avgResponseTime: 0,
      memoryUsage: this._getMemoryUsage()
    };

    this.monitoringInterval = setInterval(() => {
      this._updateMetrics();
    }, 60000); // 1분마다 메트릭 업데이트

    console.log('📊 스키마 성능 관리자 초기화 완료');
  }

  /**
   * 최적화된 스키마 로딩
   */
  async loadSchema(domains, options = {}) {
    const startTime = performance.now();
    this.performanceMetrics.totalRequests++;

    try {
      let typeDefs;

      if (Array.isArray(domains) && domains.length > 0) {
        // 특정 도메인들 로딩
        const loadPromises = domains.map(domain =>
          this.lazyLoader.loadWithDependencies(domain)
        );
        const contents = await Promise.all(loadPromises);
        typeDefs = contents.join('\n\n');
      } else {
        // 전체 스키마 로딩
        typeDefs = await this.lazyLoader.loadChunk('index');
      }

      const schema = await this.buildOptimizer.buildOptimized(typeDefs, options);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // 평균 응답 시간 업데이트
      this.performanceMetrics.avgResponseTime = (
        (this.performanceMetrics.avgResponseTime * (this.performanceMetrics.totalRequests - 1) + responseTime) /
        this.performanceMetrics.totalRequests
      );

      console.log(`📊 스키마 로딩 완료 (${Math.round(responseTime)}ms)`);

      return schema;

    } catch (error) {
      console.error('스키마 로딩 실패:', error.message);
      throw error;
    }
  }

  /**
   * 시스템 사전 준비
   */
  async warmup() {
    console.log('📊 시스템 워밍업 시작...');

    const startTime = performance.now();

    try {
      // 중요 스키마 미리 로딩
      await this.lazyLoader.preloadCritical();

      const endTime = performance.now();
      console.log(`📊 시스템 워밍업 완료 (${Math.round(endTime - startTime)}ms)`);

    } catch (error) {
      console.error('시스템 워밍업 실패:', error.message);
    }
  }

  /**
   * 메트릭 업데이트
   */
  _updateMetrics() {
    this.performanceMetrics.memoryUsage = this._getMemoryUsage();
  }

  /**
   * 메모리 사용량 조회
   */
  _getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024)
    };
  }

  /**
   * 전체 성능 통계
   */
  getPerformanceStats() {
    return {
      uptime: Date.now() - this.performanceMetrics.startTime,
      totalRequests: this.performanceMetrics.totalRequests,
      avgResponseTime: Math.round(this.performanceMetrics.avgResponseTime),
      memoryUsage: this.performanceMetrics.memoryUsage,
      lazyLoader: this.lazyLoader.getStats(),
      buildOptimizer: this.buildOptimizer.getStats()
    };
  }

  /**
   * 리소스 정리
   */
  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.buildOptimizer.clearCache();

    console.log('📊 스키마 성능 관리자 종료');
  }
}

export {
  SchemaCache,
  LazySchemaLoader,
  SchemaBuildOptimizer,
  SchemaPerformanceManager
};