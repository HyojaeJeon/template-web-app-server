/**
 * Elasticsearch 통합 진입점
 * 검색 기록 및 인기 검색어 관리
 */

// Config에서 연결 설정 import
export {
  elasticsearchClient,
  esClient,
  initializeElasticsearch,
  checkElasticsearchConnection,
  ELASTICSEARCH_INDICES,
  ELASTICSEARCH_SETTINGS
} from '../../config/elasticsearch.js';

// 서비스
import indexManager from './IndexManager.js';
import searchService from './SearchService.js';

// 통합 Elasticsearch 서비스
class ElasticsearchService {
  constructor() {
    this.indexManager = indexManager;
    this.searchService = searchService;
    this.isConnected = false;
  }

  // 초기화
  async initialize() {
    try {
      const { initializeElasticsearch } = await import('../../config/elasticsearch.js');
      const connected = await initializeElasticsearch();

      if (connected) {
        await this.indexManager.initializeAllIndices();
        this.isConnected = true;
      } else {
        this.isConnected = false;
      }

      return connected;
    } catch (error) {
      console.error('[ElasticsearchService] 초기화 실패:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  // 종료
  async shutdown() {
    // No-op (SyncManager removed)
  }

  // === Index Management ===
  async checkIndicesStatus() {
    return this.indexManager.checkIndicesStatus();
  }

  // === Search History Operations ===
  async getPopularSearches(limit) {
    return this.searchService.getPopularSearches(limit);
  }

  async saveSearchHistory(userId, query, resultsCount) {
    return this.searchService.saveSearchHistory(userId, query, resultsCount);
  }

  async getUserSearchHistory(userId, limit) {
    return this.searchService.getUserSearchHistory(userId, limit);
  }

  async deleteUserSearchHistory(userId) {
    return this.searchService.deleteUserSearchHistory(userId);
  }
}

// Singleton 인스턴스
const elasticsearchService = new ElasticsearchService();

// 개별 서비스 export
export {
  indexManager,
  searchService
};

// 기본 export
export default elasticsearchService;
