/**
 * Elasticsearch 검색 서비스
 * 검색 기록 및 인기 검색어 관리
 */

import {
  elasticsearchClient,
  ELASTICSEARCH_INDICES
} from '../../config/elasticsearch.js';

const logger = {
  info: (msg, meta) => console.log(`[SearchService] ${msg}`, meta || ''),
  error: (msg, meta) => console.error(`[SearchService] ${msg}`, meta || ''),
  warn: (msg, meta) => console.warn(`[SearchService] ${msg}`, meta || ''),
  debug: (msg, meta) => process.env.NODE_ENV === 'development' && console.log(`[SearchService] ${msg}`, meta || ''),
};

class SearchService {
  constructor() {
    this.client = elasticsearchClient;
  }

  /**
   * 인기 검색어
   */
  async getPopularSearches(limit = 10) {
    try {
      const response = await this.client.search({
        index: ELASTICSEARCH_INDICES.SEARCH_HISTORY,
        body: {
          aggs: {
            popular_queries: {
              terms: {
                field: 'query.keyword',
                size: limit,
                order: { _count: 'desc' }
              }
            }
          },
          size: 0
        }
      });

      return response.aggregations?.popular_queries?.buckets?.map(bucket => ({
        query: bucket.key,
        count: bucket.doc_count
      })) || [];
    } catch (error) {
      logger.error('Get popular searches failed', { error: error.message });
      return [];
    }
  }

  /**
   * 검색 기록 저장
   */
  async saveSearchHistory(userId, query, resultsCount) {
    try {
      await this.client.index({
        index: ELASTICSEARCH_INDICES.SEARCH_HISTORY,
        body: {
          userId,
          query,
          results: resultsCount,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Save search history failed', { error: error.message });
    }
  }

  /**
   * 사용자 검색 기록 조회
   */
  async getUserSearchHistory(userId, limit = 20) {
    try {
      const response = await this.client.search({
        index: ELASTICSEARCH_INDICES.SEARCH_HISTORY,
        body: {
          query: {
            term: { userId }
          },
          sort: [{ timestamp: { order: 'desc' } }],
          size: limit
        }
      });

      return response.hits.hits.map(hit => ({
        query: hit._source.query,
        results: hit._source.results,
        timestamp: hit._source.timestamp
      }));
    } catch (error) {
      logger.error('Get user search history failed', { error: error.message });
      return [];
    }
  }

  /**
   * 검색 기록 삭제
   */
  async deleteUserSearchHistory(userId) {
    try {
      await this.client.deleteByQuery({
        index: ELASTICSEARCH_INDICES.SEARCH_HISTORY,
        body: {
          query: {
            term: { userId }
          }
        }
      });
      return true;
    } catch (error) {
      logger.error('Delete user search history failed', { error: error.message });
      return false;
    }
  }
}

// Singleton 인스턴스
const searchService = new SearchService();

export default searchService;
