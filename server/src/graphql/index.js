/**
 * 새로운 Mobile GraphQL 통합 시스템
 * 위치: /src/graphql/index.js
 * 목적: Mobile과 Web 클라이언트의 GraphQL 스키마 통합
 * 날짜: 2025-01-11 (최신 구조로 업데이트)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mergeResolvers } from '@graphql-tools/merge';

// 성능 최적화 모듈들
// UserTypeResolvers는 이제 각 도메인별 리졸버에 통합됨

// ES Module 환경에서 __dirname 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ===============================================
// Mobile Client 통합
// ===============================================

// Mobile 클라이언트 import
import mobileClient from './clients/mobile/index.js';

// Mobile typeDefs와 resolvers 추출 (성능 최적화 적용)
export const mobileTypeDefs = mobileClient.typeDefs;
export const mobileResolvers = mobileClient.resolvers;

// ===============================================
// Web Client 통합 (안전한 import)
// ===============================================

// Web 클라이언트 정적 import (안정성 우선)
import webClientModuleDefault from './clients/web/index.js';
const webClientModule = webClientModuleDefault;

// Web typeDefs와 resolvers 추출 (안전한 접근)
export const webTypeDefs = webClientModule?.typeDefs || 'extend type Query { _empty: String }';
export const webClientResolvers = webClientModule?.resolvers || {
  Query: {
    _empty: () => 'Web client resolvers not available'
  }
};

// ===============================================
// Admin Client 통합
// ===============================================

// Admin 클라이언트 import
import adminClient from './clients/admin/index.js';

// Admin typeDefs와 resolvers 추출
export const adminTypeDefs = adminClient.typeDefs;
export const adminResolvers = adminClient.resolvers;

// ===============================================
// 클라이언트별 Export
// ===============================================

// 기본 export - 클라이언트별 구조
export default {
  clients: {
    mobile: {
      typeDefs: mobileTypeDefs,
      resolvers: mobileResolvers
    },
    web: {
      typeDefs: webTypeDefs,
      resolvers: webClientResolvers
    },
    admin: {
      typeDefs: adminTypeDefs,
      resolvers: adminResolvers
    }
  }
};

// ===============================================
// 성능 최적화 유틸리티들
// ===============================================

/**
 * 요청별 DataLoader 컨텍스트 생성
 * @description /src/dataloaders 사용
 */
export const createDataLoaderContext = async () => {
  try {
    const { createDataLoaderContext: createContext } = await import('../dataloaders/index.js');
    return await createContext();
  } catch (error) {
    console.warn('⚠️ [DataLoader] 로드 실패:', error.message);
    return {
      loaders: {},
      cache: new Map()
    };
  }
};

/**
 * GraphQL 성능 모니터링 플러그인
 */
export const createPerformancePlugin = () => {
  return {
    requestDidStart() {
      return {
        didResolveOperation(requestContext) {
          const startTime = Date.now();
          requestContext.request.http = { startTime };
        },

        didEncounterErrors(requestContext) {
          const duration = requestContext.request.http?.startTime ?
            Date.now() - requestContext.request.http.startTime : 0;
          console.error(`❌ GraphQL Error in ${duration}ms:`, requestContext.errors);
        },

        willSendResponse(requestContext) {
          const duration = requestContext.request.http?.startTime ?
            Date.now() - requestContext.request.http.startTime : 0;

          // 느린 쿼리 로깅 (500ms 이상)
          if (duration > 500) {
            console.warn(`🐌 Slow GraphQL Query (${duration}ms):`,
              requestContext.request.query?.substring(0, 100) + '...');
          }

          // 개발 환경에서 모든 쿼리 로깅
          if (process.env.NODE_ENV === 'development' && process.env.LOG_LEVEL === 'verbose') {
            console.log(`⚡ GraphQL Query completed in ${duration}ms`);
          }
        }
      };
    }
  };
};

// ===============================================
// 통합 정보 출력 (간소화)
// ===============================================

import { logger } from '../shared/utils/utilities/Logger.js';
logger.info('GraphQL시스템최적화완료');
