/**
 * Elasticsearch 인덱스 관리자
 * 인덱스 생성, 매핑 설정, 초기화 담당
 */

import {
  elasticsearchClient,
  ELASTICSEARCH_INDICES,
  ELASTICSEARCH_SETTINGS
} from '../../config/elasticsearch.js';

const logger = {
  info: (msg, meta) => console.log(`[IndexManager] ${msg}`, meta || ''),
  error: (msg, meta) => console.error(`[IndexManager] ${msg}`, meta || ''),
  warn: (msg, meta) => console.warn(`[IndexManager] ${msg}`, meta || ''),
  debug: (msg, meta) => process.env.NODE_ENV === 'development' && console.log(`[IndexManager] ${msg}`, meta || ''),
};

// 인덱스 매핑 정의
export const ELASTICSEARCH_MAPPINGS = {
  search_history: {
    properties: {
      id: { type: 'keyword' },
      userId: { type: 'keyword' },
      query: {
        type: 'text',
        analyzer: 'multilang_analyzer',
        fields: {
          keyword: { type: 'keyword' }
        }
      },
      results: { type: 'integer' },
      timestamp: { type: 'date' },
    },
  },
};

class IndexManager {
  constructor() {
    this.client = elasticsearchClient;
  }

  /**
   * 모든 기본 인덱스를 초기화
   */
  async initializeAllIndices() {
    try {
      logger.info('Elasticsearch 인덱스 초기화 시작...');

      await this.createIndex(
        ELASTICSEARCH_INDICES.SEARCH_HISTORY,
        ELASTICSEARCH_MAPPINGS.search_history
      );

      logger.info('Elasticsearch 인덱스 초기화 완료');
      return true;
    } catch (error) {
      logger.error('Elasticsearch 인덱스 초기화 실패:', error);
      return false;
    }
  }

  /**
   * 인덱스 생성
   */
  async createIndex(indexName, mapping, customSettings = {}) {
    try {
      const exists = await this.client.indices.exists({ index: indexName });

      if (exists) {
        logger.info(`인덱스 '${indexName}'이 이미 존재합니다`);
        return true;
      }

      const settings = {
        ...ELASTICSEARCH_SETTINGS,
        ...customSettings,
      };

      await this.client.indices.create({
        index: indexName,
        body: {
          settings,
          mappings: mapping,
        },
      });

      logger.info(`인덱스 '${indexName}' 생성 완료`);
      return true;
    } catch (error) {
      logger.error(`인덱스 '${indexName}' 생성 실패:`, error);
      return false;
    }
  }

  /**
   * 인덱스 삭제
   */
  async deleteIndex(indexName) {
    try {
      await this.client.indices.delete({
        index: indexName,
        ignore_unavailable: true,
      });
      logger.info(`인덱스 '${indexName}' 삭제됨`);
      return true;
    } catch (error) {
      logger.error(`인덱스 '${indexName}' 삭제 실패:`, error.message);
      return false;
    }
  }

  /**
   * 인덱스 상태 확인
   */
  async checkIndicesStatus() {
    try {
      logger.info('Elasticsearch 인덱스 상태 확인 중...');

      const status = {};
      const allIndices = Object.values(ELASTICSEARCH_INDICES);

      for (const indexName of allIndices) {
        try {
          const exists = await this.client.indices.exists({ index: indexName });

          if (exists) {
            const stats = await this.client.indices.stats({ index: indexName });
            status[indexName] = {
              exists: true,
              documentCount: stats.indices[indexName]?.total?.docs?.count || 0,
              sizeInBytes: stats.indices[indexName]?.total?.store?.size_in_bytes || 0,
            };
          } else {
            status[indexName] = { exists: false };
          }
        } catch (error) {
          status[indexName] = {
            exists: false,
            error: error.message,
          };
        }
      }

      logger.info('인덱스 상태 확인 완료:', status);
      return status;
    } catch (error) {
      logger.error('인덱스 상태 확인 중 오류:', error);
      return {};
    }
  }

  /**
   * 인덱스 통계 조회
   */
  async getIndexStats(indexName) {
    try {
      const stats = await this.client.indices.stats({ index: indexName });
      return stats;
    } catch (error) {
      logger.error(`인덱스 통계 조회 실패 (${indexName}):`, error);
      return null;
    }
  }
}

// Singleton 인스턴스
const indexManager = new IndexManager();

export default indexManager;
