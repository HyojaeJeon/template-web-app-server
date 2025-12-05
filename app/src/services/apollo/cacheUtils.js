/**
 * Apollo Cache Utilities
 * 캐시 초기화 및 순환 참조 방지 관련 유틸리티
 */

import { getApolloClient } from './apolloClient';
import logger from '@shared/utils/system/logger';

/**
 * 캐시 강제 초기화
 * 순환 참조 오류 발생 시 사용
 */
export const forceCacheReset = async () => {
  try {
    const client = getApolloClient();

    if (!client) {
      logger.error('Apollo client not available for cache reset');
      return false;
    }

    logger.info('Starting force cache reset...');

    // 1. 모든 쿼리 중지
    try {
      client.stop();
      logger.debug('Apollo client stopped');
    } catch (stopError) {
      logger.warn('Failed to stop Apollo client:', stopError);
    }

    // 2. 캐시 완전 초기화
    try {
      await client.resetStore();
      logger.debug('Apollo store reset completed');
    } catch (resetError) {
      logger.warn('resetStore failed, trying clearStore:', resetError);
      try {
        await client.clearStore();
        logger.debug('Apollo store cleared');
      } catch (clearError) {
        logger.error('Both resetStore and clearStore failed:', clearError);
        throw clearError;
      }
    }

    // 3. 가비지 컬렉션
    try {
      if (client.cache && client.cache.gc) {
        await client.cache.gc();
        logger.debug('Cache garbage collection completed');
      }
    } catch (gcError) {
      logger.warn('Cache garbage collection failed:', gcError);
    }

    logger.info('Apollo cache forcefully reset successfully');
    return true;
  } catch (error) {
    logger.error('Force cache reset failed:', error);

    // React Native에서는 window.location이 없으므로 제거
    // 대신 사용자에게 앱 재시작을 요청
    logger.error('Critical: Cache reset failed completely. App restart may be required.');
    return false;
  }
};

/**
 * 순환 참조 감지 및 정리
 * JSON.stringify 오류 발생 시 사용
 */
export const sanitizeCircularData = (obj, seen = new WeakSet()) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (seen.has(obj)) {
    return '[Circular Reference]';
  }

  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeCircularData(item, seen));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Apollo Client 내부 필드 제거
    if (key.startsWith('__') || key === '__typename') {
      continue;
    }

    sanitized[key] = sanitizeCircularData(value, seen);
  }

  seen.delete(obj);
  return sanitized;
};

/**
 * 특정 쿼리 캐시만 제거
 * Apollo Client v3 호환 방식으로 구현
 */
export const evictQueryCache = (queryName, variables = {}) => {
  try {
    const client = getApolloClient();

    if (!client || !client.cache) {
      logger.warn(`Apollo client or cache not available for ${queryName}`);
      return false;
    }

    // Apollo Client v3의 올바른 evict 방법
    try {
      // 1. ROOT_QUERY에서 특정 필드 제거
      client.cache.evict({
        id: 'ROOT_QUERY',
        fieldName: queryName
      });

      // 2. 변수가 있는 경우 해당 캐시 키로도 제거 시도
      if (variables && Object.keys(variables).length > 0) {
        const cacheKey = `${queryName}(${JSON.stringify(variables)})`;
        client.cache.evict({
          id: 'ROOT_QUERY',
          fieldName: cacheKey
        });
      }

      // 3. 가비지 컬렉션 실행
      client.cache.gc();

      logger.info(`Successfully evicted cache for query: ${queryName}`);
      return true;
    } catch (evictError) {
      logger.warn(`Direct evict failed for ${queryName}, trying cache modification:`, evictError);

      // 대안: cache.modify 사용
      try {
        client.cache.modify({
          id: 'ROOT_QUERY',
          fields: {
            [queryName]: (existing, { DELETE }) => DELETE
          }
        });

        client.cache.gc();
        logger.info(`Cache modified successfully for query: ${queryName}`);
        return true;
      } catch (modifyError) {
        logger.error(`Cache modify also failed for ${queryName}:`, modifyError);
        return false;
      }
    }
  } catch (error) {
    logger.error(`Failed to evict cache for query ${queryName}:`, error);
    return false;
  }
};

export default {
  forceCacheReset,
  sanitizeCircularData,
  evictQueryCache
};