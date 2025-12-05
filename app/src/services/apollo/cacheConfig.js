/**
 * Apollo Cache Configuration - 기본 뼈대
 *
 * @description 인증 및 기본 캐시 정책
 */

import { InMemoryCache } from '@apollo/client';
import logger from '@shared/utils/system/logger';

// ===============================================
// Apollo Cache 생성
// ===============================================

export const createCache = () => {
  return new InMemoryCache({
    addTypename: true,

    typePolicies: {
      Query: {
        fields: {
          // 인증 관련
          mValidateToken: {
            merge(existing, incoming) {
              return incoming;
            }
          },

          mGetProfile: {
            merge(existing, incoming) {
              return incoming;
            }
          },

          mGetHomeData: {
            keyArgs: ['input', ['location']],
            merge(existing, incoming) {
              return incoming;
            }
          }
        }
      },

      // 타입 정책
      User: {
        keyFields: ['id']
      },

      ChatRoom: {
        keyFields: ['id']
      },

      ChatMessage: {
        keyFields: ['id']
      }
    }
  });
};

// ===============================================
// Cache Reset Helper
// ===============================================

export const resetCache = async (cache) => {
  try {
    await cache.reset();
    logger.info('Cache reset completed');
  } catch (error) {
    logger.error('Cache reset failed:', error);
    try {
      await cache.gc();
      await cache.reset();
    } catch (fallbackError) {
      logger.error('Force cache reset failed:', fallbackError);
    }
  }
};

export const refreshCacheForLanguage = async (client, language) => {
  try {
    logger.info(`Refreshing cache for language: ${language}`);

    await client.refetchQueries({
      include: ['mGetHomeData']
    });

    logger.info('Language cache refresh completed');
    return true;
  } catch (error) {
    logger.error('Language cache refresh failed:', error);
    return false;
  }
};
