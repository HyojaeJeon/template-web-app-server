/**
 * Image Cache Management Utilities
 * FastImage 기반 이미지 캐싱 및 최적화 유틸리티
 * 메모리 관리, 프리로딩, 캐시 정리 기능 제공
 */
import OptimizedImage from '../../components/ui/images/OptimizedImage';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ImageCacheManager {
  constructor() {
    this.preloadQueue = new Set();
    this.cacheStats = {
      totalPreloaded: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastCleanup: null,
    };
    this.maxCacheSize = 50 * 1024 * 1024; // 50MB
    this.cleanupInterval = 24 * 60 * 60 * 1000; // 24시간
  }

  /**
   * 이미지 프리로딩
   * @param {Array} imageUrls - 프리로드할 이미지 URL 배열
   * @param {Object} options - 프리로드 옵션
   */
  async preloadImages(imageUrls, options = {}) {
    const {
      priority = OptimizedImage.priority.normal,
      cache = OptimizedImage.cacheControl.web,
      concurrent = 5, // 동시 프리로드 개수 제한
    } = options;

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return [];
    }

    // 중복 제거
    const uniqueUrls = [...new Set(imageUrls.filter(url => url && typeof url === 'string'))];

    // 이미 프리로드 중인 이미지 제외
    const urlsToPreload = uniqueUrls.filter(url => !this.preloadQueue.has(url));

    if (urlsToPreload.length === 0) {
      return [];
    }

    console.log(`[ImageCache] 프리로딩 시작: ${urlsToPreload.length}개 이미지`);

    // 프리로드 큐에 추가
    urlsToPreload.forEach(url => this.preloadQueue.add(url));

    try {
      // 동시 프리로드 개수 제한을 위한 청크 처리
      const chunks = this.chunkArray(urlsToPreload, concurrent);
      const results = [];

      for (const chunk of chunks) {
        const chunkResults = await Promise.allSettled(
          chunk.map(url => this.preloadSingleImage(url, { priority, cache }))
        );
        results.push(...chunkResults);
      }

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - successful;

      this.cacheStats.totalPreloaded += successful;

      console.log(`[ImageCache] 프리로딩 완료: 성공 ${successful}, 실패 ${failed}`);

      return results;
    } finally {
      // 프리로드 큐에서 제거
      urlsToPreload.forEach(url => this.preloadQueue.delete(url));
    }
  }

  /**
   * 단일 이미지 프리로딩
   * @private
   */
  async preloadSingleImage(url, options) {
    try {
      await OptimizedImage.preload([{
        uri: url,
        ...options,
      }]);
      return { url, success: true };
    } catch (error) {
      console.warn(`[ImageCache] 프리로드 실패: ${url}`, error);
      return { url, success: false, error };
    }
  }

  /**
   * 배열을 청크로 나누기
   * @private
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 메모리 캐시 정리
   */
  async clearMemoryCache() {
    try {
      await OptimizedImage.clearMemoryCache();
      console.log('[ImageCache] 메모리 캐시 정리 완료');
      return true;
    } catch (error) {
      console.error('[ImageCache] 메모리 캐시 정리 실패:', error);
      return false;
    }
  }

  /**
   * 디스크 캐시 정리
   */
  async clearDiskCache() {
    try {
      await OptimizedImage.clearDiskCache();
      console.log('[ImageCache] 디스크 캐시 정리 완료');
      return true;
    } catch (error) {
      console.error('[ImageCache] 디스크 캐시 정리 실패:', error);
      return false;
    }
  }

  /**
   * 전체 캐시 정리
   */
  async clearAllCache() {
    const memoryResult = await this.clearMemoryCache();
    const diskResult = await this.clearDiskCache();

    this.cacheStats.lastCleanup = Date.now();
    await this.saveCacheStats();

    return memoryResult && diskResult;
  }

  /**
   * 자동 캐시 정리 (24시간마다)
   */
  async autoCleanupIfNeeded() {
    const stats = await this.loadCacheStats();
    const now = Date.now();

    if (!stats.lastCleanup || (now - stats.lastCleanup) > this.cleanupInterval) {
      console.log('[ImageCache] 자동 캐시 정리 시작');
      await this.clearMemoryCache(); // 메모리만 정리 (디스크는 보존)

      this.cacheStats.lastCleanup = now;
      await this.saveCacheStats();
    }
  }

  /**
   * 중요한 이미지들 프리로딩 (앱 시작 시)
   */
  async preloadCriticalImages() {
    const criticalImages = [
      // 플레이스홀더 이미지들
      require('@assets/images/store_banner.png'),
      // 기타 중요한 이미지 URL들...
    ];

    return this.preloadImages(criticalImages, {
      priority: OptimizedImage.priority.high,
      concurrent: 3,
    });
  }

  /**
   * 매장 이미지들 배치 프리로딩
   */
  async preloadStoreImages(stores) {
    if (!Array.isArray(stores)) return [];

    const imageUrls = stores
      .map(store => [
        store.banner?.url,
        store.logo?.url,
        store.thumbnail?.url,
        ...(store.menu?.items || []).map(item => item.image?.url),
      ])
      .flat()
      .filter(Boolean);

    return this.preloadImages(imageUrls, {
      priority: OptimizedImage.priority.normal,
      concurrent: 8,
    });
  }

  /**
   * 캐시 통계 저장
   * @private
   */
  async saveCacheStats() {
    try {
      await AsyncStorage.setItem(
        '@image_cache_stats',
        JSON.stringify(this.cacheStats)
      );
    } catch (error) {
      console.error('[ImageCache] 캐시 통계 저장 실패:', error);
    }
  }

  /**
   * 캐시 통계 로드
   * @private
   */
  async loadCacheStats() {
    try {
      const stats = await AsyncStorage.getItem('@image_cache_stats');
      if (stats) {
        this.cacheStats = { ...this.cacheStats, ...JSON.parse(stats) };
      }
      return this.cacheStats;
    } catch (error) {
      console.error('[ImageCache] 캐시 통계 로드 실패:', error);
      return this.cacheStats;
    }
  }

  /**
   * 캐시 통계 조회
   */
  getCacheStats() {
    return { ...this.cacheStats };
  }

  /**
   * 캐시 히트 기록
   */
  recordCacheHit() {
    this.cacheStats.cacheHits++;
  }

  /**
   * 캐시 미스 기록
   */
  recordCacheMiss() {
    this.cacheStats.cacheMisses++;
  }
}

// 싱글톤 인스턴스
const imageCacheManager = new ImageCacheManager();

// Hook 형태로 사용할 수 있는 유틸리티
export const useImageCache = () => {
  return {
    preloadImages: imageCacheManager.preloadImages.bind(imageCacheManager),
    preloadStoreImages: imageCacheManager.preloadStoreImages.bind(imageCacheManager),
    clearMemoryCache: imageCacheManager.clearMemoryCache.bind(imageCacheManager),
    clearDiskCache: imageCacheManager.clearDiskCache.bind(imageCacheManager),
    clearAllCache: imageCacheManager.clearAllCache.bind(imageCacheManager),
    autoCleanupIfNeeded: imageCacheManager.autoCleanupIfNeeded.bind(imageCacheManager),
    getCacheStats: imageCacheManager.getCacheStats.bind(imageCacheManager),
  };
};

export default imageCacheManager;
