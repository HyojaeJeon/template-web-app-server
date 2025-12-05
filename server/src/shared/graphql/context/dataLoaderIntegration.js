/**
 * @file DataLoader Integration Patch - GraphQL Context 확장
 * @description 기존 GraphQL Context에 Settings DataLoader 통합
 * @author Agent 13 - Settings/Configuration Domain
 * @date 2025-09-17
 */

import { addSettingsDataLoaders } from './settingsContext.js';

/**
 * 기존 GraphQL Context에 DataLoader들을 안전하게 통합
 * @param {object} baseContext - 기존 context
 * @returns {object} DataLoader가 추가된 확장된 context
 */
export const enhanceContextWithDataLoaders = (baseContext) => {
  // Settings DataLoader 통합
  const contextWithSettings = addSettingsDataLoaders(baseContext);

  // 향후 다른 도메인 DataLoader도 여기서 추가 가능
  // const contextWithOrders = addOrdersDataLoaders(contextWithSettings);
  // const contextWithMenu = addMenuDataLoaders(contextWithOrders);

  return {
    ...contextWithSettings,
    // DataLoader 헬퍼 함수들
    dataLoaderHelpers: {
      // 모든 DataLoader 캐시 클리어
      clearAllCaches: () => {
        Object.values(contextWithSettings.dataloaders || {}).forEach(loader => {
          if (loader && typeof loader.clearAll === 'function') {
            loader.clearAll();
          }
        });
      },

      // 특정 키들만 캐시 클리어
      clearCacheKeys: (loaderName, keys) => {
        const loader = contextWithSettings.dataloaders?.[loaderName];
        if (loader && typeof loader.clear === 'function') {
          if (Array.isArray(keys)) {
            keys.forEach(key => loader.clear(key));
          } else {
            loader.clear(keys);
          }
        }
      },

      // DataLoader 상태 정보
      getDataLoaderStats: () => {
        const stats = {};
        Object.entries(contextWithSettings.dataloaders || {}).forEach(([name, loader]) => {
          if (loader && loader._cache) {
            stats[name] = {
              cacheSize: loader._cache.size,
              batchLoadCount: loader._batchLoadFn ? 1 : 0
            };
          }
        });
        return stats;
      }
    }
  };
};

/**
 * Settings 도메인을 위한 Context 검증
 * @param {object} context - GraphQL context
 * @returns {boolean} Settings DataLoader가 올바르게 설정되었는지 확인
 */
export const validateSettingsContext = (context) => {
  const requiredDataLoaders = [
    'notificationSettings',
    'deliverySettings',
    'storeSettings',
    'printSettings',
    'userSettings',
    'appSettings'
  ];

  const missingLoaders = requiredDataLoaders.filter(
    loaderName => !context.dataloaders?.[loaderName]
  );

  if (missingLoaders.length > 0) {
    console.error('[Settings Context] Missing DataLoaders:', missingLoaders);
    return false;
  }

  // settingsHelpers 검증
  if (!context.settingsHelpers?.getCacheStats) {
    console.error('[Settings Context] Missing settingsHelpers');
    return false;
  }

  return true;
};

/**
 * Performance 모니터링을 위한 Context 래퍼
 * @param {object} context - GraphQL context
 * @returns {object} 성능 모니터링이 추가된 context
 */
export const addPerformanceMonitoring = (context) => {
  const startTime = Date.now();
  let queryCount = 0;
  let cacheHits = 0;
  let cacheMisses = 0;

  // DataLoader 메서드 래핑하여 통계 수집
  const wrapDataLoader = (loader, name) => {
    const originalLoad = loader.load.bind(loader);
    const originalLoadMany = loader.loadMany.bind(loader);

    loader.load = async (key) => {
      queryCount++;
      const cacheKey = loader._cacheKeyFn ? loader._cacheKeyFn(key) : key;
      const isInCache = loader._cache.has(cacheKey);

      if (isInCache) {
        cacheHits++;
      } else {
        cacheMisses++;
      }

      return originalLoad(key);
    };

    loader.loadMany = async (keys) => {
      queryCount += keys.length;
      keys.forEach(key => {
        const cacheKey = loader._cacheKeyFn ? loader._cacheKeyFn(key) : key;
        if (loader._cache.has(cacheKey)) {
          cacheHits++;
        } else {
          cacheMisses++;
        }
      });

      return originalLoadMany(keys);
    };

    return loader;
  };

  // 모든 DataLoader에 성능 모니터링 추가
  const wrappedDataLoaders = {};
  Object.entries(context.dataloaders || {}).forEach(([name, loader]) => {
    wrappedDataLoaders[name] = wrapDataLoader(loader, name);
  });

  return {
    ...context,
    dataloaders: wrappedDataLoaders,
    performance: {
      getStats: () => ({
        executionTime: Date.now() - startTime,
        queryCount,
        cacheHits,
        cacheMisses,
        cacheHitRate: queryCount > 0 ? (cacheHits / queryCount * 100).toFixed(2) : 0,
        timestamp: new Date().toISOString()
      }),
      reset: () => {
        queryCount = 0;
        cacheHits = 0;
        cacheMisses = 0;
      }
    }
  };
};

/**
 * 개발 환경을 위한 Debug Context
 */
export const addDebugContext = (context) => {
  if (process.env.NODE_ENV !== 'development') {
    return context;
  }

  return {
    ...context,
    debug: {
      // DataLoader 캐시 상태 로깅
      logCacheState: () => {
        console.log('[Debug] DataLoader Cache State:');
        Object.entries(context.dataloaders || {}).forEach(([name, loader]) => {
          console.log(`  ${name}: ${loader._cache?.size || 0} items`);
        });
      },

      // 설정값 변경 추적
      trackSettingsChange: (type, storeId, before, after) => {
        console.log(`[Debug] Settings Change - ${type}:`, {
          storeId,
          changed: Object.keys(after).filter(key => before[key] !== after[key]),
          timestamp: new Date().toISOString()
        });
      },

      // 성능 경고
      warnSlowQueries: (threshold = 1000) => {
        const stats = context.performance?.getStats();
        if (stats && stats.executionTime > threshold) {
          console.warn(`[Debug] Slow Query Detected: ${stats.executionTime}ms`);
          console.warn(`[Debug] Cache Hit Rate: ${stats.cacheHitRate}%`);
        }
      }
    }
  };
};

/**
 * 메인 Context 통합 함수
 * 모든 확장 기능을 적용한 최종 Context 생성
 */
export const createEnhancedGraphQLContext = (baseContext) => {
  let enhancedContext = baseContext;

  // 1. DataLoader 통합
  enhancedContext = enhanceContextWithDataLoaders(enhancedContext);

  // 2. 성능 모니터링 추가
  if (process.env.ENABLE_PERFORMANCE_MONITORING === 'true') {
    enhancedContext = addPerformanceMonitoring(enhancedContext);
  }

  // 3. 개발 환경 디버깅 추가
  enhancedContext = addDebugContext(enhancedContext);

  // 4. Context 검증
  if (!validateSettingsContext(enhancedContext)) {
    console.error('[Context] Settings DataLoader validation failed');
  }

  return enhancedContext;
};

export default {
  enhanceContextWithDataLoaders,
  validateSettingsContext,
  addPerformanceMonitoring,
  addDebugContext,
  createEnhancedGraphQLContext
};