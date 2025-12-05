import { Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import logger from '@shared/utils/system/logger';

// FastImage 호환 인터페이스 제공 (성능 최적화)
const FastImage = {
  priority: {
    low: 'low',
    normal: 'normal',
    high: 'high'
  },
  cacheControl: {
    immutable: 'immutable',
    web: 'web',
    cacheOnly: 'cacheOnly'
  },
  resizeMode: {
    contain: 'contain',
    cover: 'cover',
    stretch: 'stretch',
    center: 'center'
  },
  preload: async (sources) => {
    // 배치 이미지 프리로드 최적화
    if (Array.isArray(sources)) {
      const batchSize = 5; // 동시 처리 제한
      const batches = [];

      for (let i = 0; i < sources.length; i += batchSize) {
        batches.push(sources.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        await Promise.allSettled(batch.map(source => {
          const uri = typeof source === 'string' ? source : source.uri;
          return Image.prefetch(uri);
        }));
      }
    }
    return Promise.resolve();
  },
  clearDiskCache: () => Promise.resolve(),
  clearMemoryCache: () => Promise.resolve(),
  getCachePath: (uri) => Promise.resolve(null)
};

class ImageCacheManager {
  constructor() {
    this.cacheSize = 100 * 1024 * 1024; // 100MB 캐시 크기 증가
    this.maxCacheAge = 7 * 24 * 60 * 60 * 1000; // 7일
    this.cacheMap = new Map();
    this.preloadQueue = new Set();
    this.isInitialized = false;
    this.memoryCache = new Map(); // 메모리 캐시 추가
    this.maxMemoryCacheSize = 50; // 메모리 캐시 최대 엔트리 수
  }

  /**
   * 캐시 매니저 초기화 (성능 최적화)
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }

      // 기존 캐시 정보 로드
      await this.loadCacheMetadata();

      // 만료된 캐시 정리 (백그라운드에서 실행)
      this.cleanExpiredCache().catch(error => {
        logger.error('백그라운드 캐시 정리 실패', error);
      });

      this.isInitialized = true;
      logger.info('이미지 캐시 매니저 초기화 완료');

      return true;
    } catch (error) {
      logger.error('이미지 캐시 초기화 실패', error);
      return false;
    }
  }

  /**
   * 이미지 프리로드 (성능 최적화: 배치 처리 + 우선순위)
   */
  async preloadImages(imageUrls = [], priority = FastImage.priority.normal) {
    try {
      if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        return;
      }

      // 유효한 URL만 필터링 + 중복 제거
      const validUrls = [...new Set(imageUrls)]
        .filter(url => this.isValidImageUrl(url))
        .filter(url => !this.preloadQueue.has(url) && !this.memoryCache.has(url));

      if (validUrls.length === 0) {
        return;
      }

      // 프리로드 큐에 추가
      validUrls.forEach(url => this.preloadQueue.add(url));

      // 우선순위에 따른 배치 크기 조정
      const batchSize = priority === FastImage.priority.high ? 3 :
                       priority === FastImage.priority.normal ? 5 : 8;

      // 배치별로 처리
      for (let i = 0; i < validUrls.length; i += batchSize) {
        const batch = validUrls.slice(i, i + batchSize);

        await Promise.allSettled(batch.map(async (url) => {
          try {
            await Image.prefetch(url);

            // 메모리 캐시에 추가
            this.addToMemoryCache(url);

            // 캐시 메타데이터 업데이트
            const timestamp = Date.now();
            this.cacheMap.set(url, {
              url,
              timestamp,
              accessed: timestamp,
              priority,
              size: 0
            });
          } catch (error) {
            logger.debug(`이미지 프리로드 실패: ${url}`, error);
          }
        }));

        // CPU 부하 방지를 위한 작은 지연
        if (i + batchSize < validUrls.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // 프리로드 큐에서 제거
      validUrls.forEach(url => this.preloadQueue.delete(url));

      logger.info(`📸 이미지 ${validUrls.length}개 프리로드 완료`);
    } catch (error) {
      logger.error('[ERROR] 이미지 프리로드 실패:', error);
    }
  }

  /**
   * 메모리 캐시 관리 (LRU 방식)
   */
  addToMemoryCache(url) {
    // 최대 크기 초과 시 가장 오래된 것 제거
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    // 기존 엔트리가 있으면 제거 후 다시 추가 (LRU 순서 유지)
    if (this.memoryCache.has(url)) {
      this.memoryCache.delete(url);
    }

    this.memoryCache.set(url, Date.now());
  }

  /**
   * 스크린별 특화 이미지 프리로드
   */
  async preloadScreenImages(screenType, data = []) {
    try {
      let imageUrls = [];
      let priority = FastImage.priority.normal;

      switch (screenType) {
        case 'favorites':
          // 즐겨찾기 화면: 매장 이미지, 메뉴 이미지
          data.forEach(item => {
            if (item.store?.imageUrl) imageUrls.push(item.store.imageUrl);
            if (item.profileImage) imageUrls.push(item.profileImage);
          });
          priority = FastImage.priority.high; // 사용자가 자주 보는 화면
          break;

        case 'checkout':
          // 체크아웃 화면: 장바구니 아이템 이미지
          data.forEach(item => {
            if (item.menuItem?.profileImage) imageUrls.push(item.menuItem.profileImage);
          });
          priority = FastImage.priority.high; // 구매 전 중요한 화면
          break;

        case 'coupon':
          // 쿠폰 화면: 쿠폰 이미지, 브랜드 로고
          data.forEach(coupon => {
            if (coupon.imageUrl) imageUrls.push(coupon.imageUrl);
            if (coupon.store?.imageUrl) imageUrls.push(coupon.store.imageUrl);
          });
          priority = FastImage.priority.normal;
          break;

        case 'menu':
          // 메뉴 화면: 메뉴 아이템 이미지
          data.forEach(menu => {
            if (menu.profileImage) imageUrls.push(menu.profileImage);
            if (menu.store?.imageUrl) imageUrls.push(menu.store.imageUrl);
          });
          priority = FastImage.priority.normal;
          break;

        case 'store':
          // 매장 화면: 매장 이미지, 메뉴 이미지
          data.forEach(store => {
            if (store.imageUrl) imageUrls.push(store.imageUrl);
            if (store.coverImage) imageUrls.push(store.coverImage);
            if (store.menuItems) {
              store.menuItems.forEach(item => {
                if (item.profileImage) imageUrls.push(item.profileImage);
              });
            }
          });
          priority = FastImage.priority.normal;
          break;

        default:
          logger.warn(`지원되지 않는 스크린 타입: ${screenType}`);
          return;
      }

      await this.preloadImages(imageUrls, priority);
      logger.info(`🎯 ${screenType} 스크린 이미지 ${imageUrls.length}개 프리로드 완료`);
    } catch (error) {
      logger.error(`[ERROR] ${screenType} 스크린 이미지 프리로드 실패:`, error);
    }
  }

  /**
   * 이미지 URL 유효성 검사 (개선된 패턴)
   */
  isValidImageUrl(url) {
    try {
      if (!url || typeof url !== 'string') {
        return false;
      }

      // HTTP/HTTPS URL 검사
      if (!url.match(/^https?:\/\//)) {
        return false;
      }

      // 이미지 확장자 검사 (더 많은 형식 지원)
      const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)(\?.*)?$/i;
      return imageExtensions.test(url);
    } catch {
      return false;
    }
  }

  /**
   * 스마트 캐시 정리 (성능 최적화)
   */
  async smartCacheCleanup() {
    try {
      const now = Date.now();
      const cacheEntries = Array.from(this.cacheMap.entries());

      // 정리 기준 설정
      const maxEntries = 1000; // 최대 캐시 엔트리 수
      const expiredUrls = [];
      const lowPriorityUrls = [];

      cacheEntries.forEach(([url, metadata]) => {
        // 만료된 캐시
        if (now - metadata.timestamp > this.maxCacheAge) {
          expiredUrls.push(url);
        }
        // 낮은 우선순위이고 30일 이상 미접근
        else if (metadata.priority === FastImage.priority.low &&
                 now - metadata.accessed > 30 * 24 * 60 * 60 * 1000) {
          lowPriorityUrls.push(url);
        }
      });

      // 엔트리 수가 너무 많으면 LRU 정리
      let lruUrls = [];
      if (cacheEntries.length > maxEntries) {
        const sortedByAccess = cacheEntries
          .sort(([, a], [, b]) => a.accessed - b.accessed);
        const removeCount = cacheEntries.length - maxEntries;
        lruUrls = sortedByAccess.slice(0, removeCount).map(([url]) => url);
      }

      // 정리 실행
      const toRemove = [...new Set([...expiredUrls, ...lowPriorityUrls, ...lruUrls])];
      toRemove.forEach(url => {
        this.cacheMap.delete(url);
        this.memoryCache.delete(url);
      });

      if (toRemove.length > 0) {
        await this.saveCacheMetadata();
        logger.info(`🧹 스마트 캐시 정리: ${toRemove.length}개 제거`);
      }
    } catch (error) {
      logger.error('[ERROR] 스마트 캐시 정리 실패:', error);
    }
  }

  /**
   * 만료된 캐시 정리 (백그라운드 실행)
   */
  async cleanExpiredCache() {
    try {
      const now = Date.now();
      const expiredUrls = [];

      for (const [url, metadata] of this.cacheMap.entries()) {
        if (now - metadata.timestamp > this.maxCacheAge) {
          expiredUrls.push(url);
        }
      }

      if (expiredUrls.length > 0) {
        // 메타데이터에서 제거
        expiredUrls.forEach(url => {
          this.cacheMap.delete(url);
          this.memoryCache.delete(url);
        });

        // 메타데이터 저장
        await this.saveCacheMetadata();

        logger.info(`🧹 만료된 캐시 ${expiredUrls.length}개 정리 완료`);
      }
    } catch (error) {
      logger.error('[ERROR] 캐시 정리 실패:', error);
    }
  }

  /**
   * 캐시된 이미지 접근 시간 업데이트
   */
  updateAccessTime(url) {
    try {
      if (this.cacheMap.has(url)) {
        const cached = this.cacheMap.get(url);
        cached.accessed = Date.now();
        this.cacheMap.set(url, cached);
      }

      // 메모리 캐시도 업데이트 (LRU 순서 유지)
      if (this.memoryCache.has(url)) {
        this.addToMemoryCache(url);
      }
    } catch (error) {
      logger.error('[ERROR] 접근 시간 업데이트 실패:', error);
    }
  }

  /**
   * 전체 캐시 정리
   */
  async clearAllCache() {
    try {
      // 메타데이터 초기화
      this.cacheMap.clear();
      this.memoryCache.clear();
      this.preloadQueue.clear();

      // AsyncStorage에서 메타데이터 삭제
      await AsyncStorage.removeItem('image_cache_metadata');

      logger.info('🧹 전체 이미지 캐시 삭제 완료');
    } catch (error) {
      logger.error('[ERROR] 전체 캐시 삭제 실패:', error);
    }
  }

  /**
   * 캐시 메타데이터 로드
   */
  async loadCacheMetadata() {
    try {
      const metadata = await AsyncStorage.getItem('image_cache_metadata');
      if (metadata) {
        const parsed = JSON.parse(metadata);
        this.cacheMap = new Map(parsed.cacheMap || []);
        logger.info(`📸 캐시 메타데이터 ${this.cacheMap.size}개 로드 완료`);
      }
    } catch (error) {
      logger.error('[ERROR] 캐시 메타데이터 로드 실패:', error);
      this.cacheMap = new Map();
    }
  }

  /**
   * 캐시 메타데이터 저장 (배치 저장으로 성능 최적화)
   */
  async saveCacheMetadata() {
    try {
      const metadata = {
        cacheMap: Array.from(this.cacheMap.entries()),
        lastUpdated: Date.now(),
        version: '2.0' // 버전 추가
      };

      await AsyncStorage.setItem('image_cache_metadata', JSON.stringify(metadata));
    } catch (error) {
      logger.error('[ERROR] 캐시 메타데이터 저장 실패:', error);
    }
  }

  /**
   * 최적화된 이미지 소스 생성
   */
  getOptimizedImageSource(url, options = {}) {
    try {
      if (!this.isValidImageUrl(url)) {
        return null;
      }

      // 접근 시간 업데이트
      this.updateAccessTime(url);

      const defaultOptions = {
        priority: FastImage.priority.normal,
        cache: FastImage.cacheControl.web
      };

      return {
        uri: url,
        ...defaultOptions,
        ...options
      };
    } catch (error) {
      logger.error('[ERROR] 최적화된 이미지 소스 생성 실패:', error);
      return { uri: url };
    }
  }

  /**
   * 캐시 상태 정보 (성능 모니터링)
   */
  getCacheStats() {
    try {
      const now = Date.now();
      const cacheEntries = Array.from(this.cacheMap.values());

      const stats = {
        totalEntries: cacheEntries.length,
        memoryEntries: this.memoryCache.size,
        totalSize: cacheEntries.reduce((sum, entry) => sum + (entry.size || 0), 0),
        oldestEntry: cacheEntries.length > 0
          ? Math.min(...cacheEntries.map(entry => entry.timestamp))
          : null,
        newestEntry: cacheEntries.length > 0
          ? Math.max(...cacheEntries.map(entry => entry.timestamp))
          : null,
        preloadQueueSize: this.preloadQueue.size,
        initialized: this.isInitialized,
        platform: Platform.OS,
        priorityDistribution: this.getPriorityDistribution(cacheEntries)
      };

      return stats;
    } catch (error) {
      logger.error('[ERROR] 캐시 통계 생성 실패:', error);
      return null;
    }
  }

  /**
   * 우선순위별 분포 통계
   */
  getPriorityDistribution(cacheEntries) {
    const distribution = {
      high: 0,
      normal: 0,
      low: 0
    };

    cacheEntries.forEach(entry => {
      if (entry.priority) {
        distribution[entry.priority] = (distribution[entry.priority] || 0) + 1;
      }
    });

    return distribution;
  }
}

// 싱글톤 인스턴스 생성
const imageCacheManager = new ImageCacheManager();

// FastImage 호환 컴포넌트 (성능 최적화된 Image 래퍼)
export const OptimizedImage = ({ source, style, resizeMode, onLoad, onError, ...props }) => {
  const optimizedSource = typeof source === 'string'
    ? imageCacheManager.getOptimizedImageSource(source)
    : source;

  return (
    <Image
      source={optimizedSource}
      style={style}
      resizeMode={resizeMode}
      onLoad={onLoad}
      onError={onError}
      {...props}
    />
  );
};

export { FastImage };
export default imageCacheManager;