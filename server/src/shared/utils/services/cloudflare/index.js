/**
 * Cloudflare 서비스 통합 모듈                                                                        // 클라우드플레어 관련 모든 기능 통합
 * 
 * @module CloudflareServices
 * @description
 * Cloudflare Images API를 위한 완전한 Node.js 서비스 라이브러리                                      // 이미지 처리를 위한 완전한 솔루션
 * 이미지 업로드, 관리, 변형, 배치 처리 등 모든 기능을 통합 제공                                      // 모든 이미지 관련 작업을 한 곳에서
 * 
 * @features
 * - 통합 이미지 업로드 시스템 (단일/다중)                                                           // 다양한 업로드 방식 지원
 * - Cloudflare Images 완전 관리                                                                    // 전체 이미지 라이프사이클 관리
 * - Store 앱 전용 Variants 시스템                                                                  // 점주 앱 최적화 변형
 * - GraphQL 리졸버 통합 지원                                                                       // GraphQL과 완벽 연동
 * - 에러 처리 및 재시도 로직                                                                       // 안정적인 업로드 보장
 * - 메타데이터 자동 보강                                                                           // 추가 정보 자동 생성
 * 
 * @example
 * // 기본 사용법 - 이미지 업로드
 * import { handleImageUpload } from '@graphql/shared/utils/services/cloudflare';
 * 
 * const result = await handleImageUpload({
 *   image: "data:image/jpeg;base64,/9j/4AAQ...",
 *   filename: 'menu.jpg',
 *   mimetype: 'image/jpeg',
 *   metadata: { storeId: 123 },
 *   variants: ['store-thumb', 'store-card']
 * }, context);
 * 
 * @example
 * // Cloudflare Images 직접 조작
 * import { cloudflareImages } from '@graphql/shared/utils/services/cloudflare';
 * 
 * const imageInfo = await cloudflareImages.getImageInfo('image-id');
 * const imageUrl = cloudflareImages.getImageUrl('image-id', 'store-detail');
 * 
 * @example
 * // Store Variants 관리
 * import { createAllStoreVariants, STORE_VARIANTS } from '@graphql/shared/utils/services/cloudflare';
 * 
 * // 모든 Store 변형 생성
 * const results = await createAllStoreVariants();
 * 
 * // 사용 가능한 변형 목록 확인
 * console.log(Object.keys(STORE_VARIANTS));
 * 
 * @author Delivery VN Team
 * @version 1.0.0
 * @license MIT
 */

// 메인 Cloudflare Images 유틸리티                                                                   // 핵심 이미지 처리 클래스
import cloudflareImages, { 
  CloudflareImagesUtil, 
  getMessage 
} from './CloudflareImages.js';

// 이미지 업로드 핸들러                                                                               // 업로드 전용 처리 함수들
import { 
  handleImageUpload,
  handleMultipleImageUploads,
  handleImageDelete
} from './ImageUploadHandler.js';

// Store Variants 관리 시스템                                                                        // 점주 앱 전용 변형 관리
import storeVariants, {
  STORE_VARIANTS,
  listCurrentVariants,
  createVariant,
  createAllStoreVariants,
  deleteVariant,
  getVariantConfig,
  validateStoreVariants,
  cleanupLegacyVariants
} from './StoreVariants.js';

// Direct Upload 서비스                                                                             // Cloudflare Direct Upload v2 시스템
import DirectUploadService, {
  requestDirectUploadUrl,
  requestMultipleDirectUploadUrls,
  verifyUploadedImageId,
  verifyMultipleUploadedImageIds
} from './DirectUploadService.js';

// Rollback 서비스                                                                                  // Direct Upload 롤백 시스템
import RollbackService, {
  rollbackUploadedImage,
  rollbackMultipleUploadedImages,
  rollbackWithImages,
  conditionalRollback
} from './RollbackService.js';

// ========================================
// 편의 함수들 (Convenience Functions)                                                              // 자주 사용하는 기능들의 간편 함수
// ========================================

/**
 * 언어 설정 변경 헬퍼                                                                               // 사용자 언어 간편 변경
 * @param {string} lang - 언어 코드 ('ko', 'en', 'vi')
 */
export function setLanguage(lang) {
  cloudflareImages.setLanguage(lang);
}

/**
 * 현재 설정 확인 헬퍼                                                                               // 시스템 설정 상태 확인
 * @returns {Object} 현재 설정 객체
 */
export function getConfig() {
  return cloudflareImages.getConfig();
}

/**
 * 이미지 URL 생성 헬퍼                                                                              // 변형 이미지 URL 빠른 생성
 * @param {string} imageId - 이미지 ID
 * @param {string} [variant='public'] - 변형 이름
 * @returns {string} 완전한 이미지 URL
 * 
 * @example
 * const thumbUrl = getImageUrl('abc123', 'store-thumb');
 * // 결과: "https://imagedelivery.net/hash/abc123/store-thumb"
 */
export function getImageUrl(imageId, variant = 'public') {
  return cloudflareImages.getImageUrl(imageId, variant);
}

/**
 * 유연한 변형 URL 생성 헬퍼                                                                          // 동적 이미지 변형 URL 생성
 * @param {string} imageId - 이미지 ID
 * @param {Object} options - 변형 옵션
 * @param {number} options.width - 너비
 * @param {number} options.height - 높이
 * @param {string} options.fit - 맞춤 방식 ('cover', 'contain', 'fill')
 * @param {number} options.quality - 품질 (1-100)
 * @param {string} options.format - 포맷 ('webp', 'avif', 'jpeg', 'png')
 * @returns {string} 완전한 이미지 URL
 * 
 * @example
 * const customUrl = getFlexibleImageUrl('abc123', {
 *   width: 400,
 *   height: 300,
 *   fit: 'cover',
 *   quality: 85,
 *   format: 'webp'
 * });
 */
export function getFlexibleImageUrl(imageId, options = {}) {
  return cloudflareImages.getFlexibleImageUrl(imageId, options);
}

/**
 * 디바이스별 최적화 옵션 헬퍼                                                                        // 디바이스 맞춤 설정 제공
 * @param {string} device - 디바이스 타입 ('mobile', 'tablet', 'desktop')
 * @returns {Object} 최적화 옵션 객체
 * 
 * @example
 * const mobileOptions = getOptimizedOptions('mobile');
 * // 결과: { width: 400, height: 300, quality: 80, format: 'webp' }
 */
export function getOptimizedOptions(device = 'desktop') {
  const deviceOptions = {
    mobile: {
      width: 400,
      height: 300,
      quality: 80,
      format: 'webp'
    },
    tablet: {
      width: 800,
      height: 600,
      quality: 85,
      format: 'webp'
    },
    desktop: {
      width: 1200,
      height: 800,
      quality: 90,
      format: 'webp'
    }
  };
  
  return deviceOptions[device] || deviceOptions.desktop;
}

/**
 * 지원 형식 확인 헬퍼                                                                               // 파일 형식 유효성 빠른 확인
 * @param {string} filename - 파일명 또는 MIME 타입
 * @returns {boolean} 지원 여부
 * 
 * @example
 * const isSupported = isSupportedFormat('image.jpg'); // true
 * const isSupportedMime = isSupportedFormat('image/webp'); // true
 */
export function isSupportedFormat(filename) {
  return cloudflareImages.isSupportedFormat(filename);
}

/**
 * 이미지 크기 검증 헬퍼                                                                             // 크기 제한 빠른 확인
 * @param {number} width - 너비
 * @param {number} height - 높이
 * @param {number} fileSize - 파일 크기 (bytes)
 * @returns {Object} 검증 결과
 * 
 * @example
 * const validation = validateImageDimensions(1920, 1080, 2048000);
 * if (!validation.valid) {
 *   console.log('오류:', validation.errors);
 * }
 */
export function validateImageDimensions(width, height, fileSize) {
  return cloudflareImages.validateImageDimensions(width, height, fileSize);
}

/**
 * 반응형 이미지 URL 세트 생성                                                                        // 다양한 크기 URL 일괄 생성
 * @param {string} imageId - 이미지 ID
 * @param {Array} variants - 필요한 변형 목록
 * @returns {Object} 변형별 URL 객체
 * 
 * @example
 * const responsiveUrls = getResponsiveImageUrls('abc123', [
 *   'store-thumb', 'store-card', 'store-detail'
 * ]);
 * // 결과: {
 * //   'store-thumb': 'https://...',
 * //   'store-card': 'https://...',
 * //   'store-detail': 'https://...'
 * // }
 */
export function getResponsiveImageUrls(imageId, variants = ['store-thumb', 'store-card', 'store-detail']) {
  const urls = {};
  
  variants.forEach(variant => {
    urls[variant] = getImageUrl(imageId, variant);
  });
  
  return urls;
}

/**
 * Store 앱용 완전한 이미지 세트 생성                                                                  // 점주 앱용 전체 URL 세트
 * @param {string} imageId - 이미지 ID
 * @returns {Object} Store 앱용 모든 변형 URL
 * 
 * @example
 * const storeImageSet = getStoreImageSet('abc123');
 * // 결과: Store 앱에서 사용하는 모든 변형의 URL 객체
 */
export function getStoreImageSet(imageId) {
  return getResponsiveImageUrls(imageId, Object.keys(STORE_VARIANTS));
}

/**
 * 이미지 메타데이터 추출                                                                             // 이미지 정보 간편 조회
 * @param {string} imageId - 이미지 ID
 * @returns {Promise<Object|null>} 이미지 메타데이터
 * 
 * @example
 * const metadata = await getImageMetadata('abc123');
 * if (metadata) {
 *   console.log('업로드 시간:', metadata.uploaded);
 *   console.log('파일 크기:', metadata.size);
 * }
 */
export async function getImageMetadata(imageId) {
  try {
    const result = await cloudflareImages.getImageInfo(imageId);
    
    if (result.success) {
      return {
        id: result.data.id,
        filename: result.data.filename,
        uploaded: result.data.uploaded,
        size: result.data.size,
        variants: result.data.variants,
        metadata: result.data.meta
      };
    }
    
    return null;
  } catch (error) {
    console.error('이미지 메타데이터 조회 실패:', error.message);
    return null;
  }
}

// ========================================
// 기본 내보내기 (Default Exports)                                                                  // 주요 기능들의 기본 내보내기
// ========================================

// 메인 Cloudflare Images 인스턴스                                                                  // 핵심 이미지 처리 객체
export default cloudflareImages;

// ========================================
// 네임드 내보내기 (Named Exports)                                                                  // 개별 기능별 내보내기
// ========================================

// Cloudflare Images 핵심                                                                          // 이미지 처리 핵심 기능
export { 
  cloudflareImages,
  CloudflareImagesUtil,
  getMessage
};

// 이미지 업로드 핸들러                                                                               // 업로드 전용 함수들
export {
  handleImageUpload,
  handleMultipleImageUploads,
  handleImageDelete
};

// Store Variants 관리                                                                             // 점주 앱 변형 관리 기능
export {
  storeVariants,
  STORE_VARIANTS,
  listCurrentVariants,
  createVariant,
  createAllStoreVariants,
  deleteVariant,
  getVariantConfig,
  validateStoreVariants,
  cleanupLegacyVariants
};

// Direct Upload 서비스                                                                            // Cloudflare Direct Upload v2 기능
export {
  DirectUploadService,
  requestDirectUploadUrl,
  requestMultipleDirectUploadUrls,
  verifyUploadedImageId,
  verifyMultipleUploadedImageIds
};

// Rollback 서비스                                                                                  // Direct Upload 롤백 기능
export {
  RollbackService,
  rollbackUploadedImage,
  rollbackMultipleUploadedImages,
  rollbackWithImages,
  conditionalRollback
};

// ========================================
// 타입 정의 (JSDoc Types)                                                                          // TypeScript 지원을 위한 타입 정의
// ========================================

/**
 * @typedef {Object} ImageUploadInput
 * @property {string} image - Base64 인코딩된 이미지 데이터
 * @property {string} filename - 파일명
 * @property {string} mimetype - MIME 타입
 * @property {Object} [metadata] - 추가 메타데이터
 * @property {Array<string>} [variants] - 필요한 변형 목록
 * @property {string} [blurPreview] - 블러 프리뷰 데이터
 */

/**
 * @typedef {Object} ImageUploadResult
 * @property {boolean} success - 성공 여부
 * @property {string} cloudflareId - Cloudflare 이미지 ID
 * @property {string} cloudflareUrl - 메인 이미지 URL
 * @property {string} filename - 파일명
 * @property {string} mimetype - MIME 타입
 * @property {number} size - 파일 크기 (bytes)
 * @property {string} sizeMB - 파일 크기 (MB)
 * @property {Object} urls - 모든 변형 URL 객체
 * @property {Object} metadata - 보강된 메타데이터
 * @property {Object} cloudflareResponse - 원본 API 응답
 * @property {string} uploadedAt - 업로드 시간
 * @property {string} uploadedBy - 업로드 사용자 ID
 * @property {string} [blurPreview] - 블러 프리뷰 (선택사항)
 */

/**
 * @typedef {Object} VariantConfig
 * @property {number} width - 너비
 * @property {number} height - 높이
 * @property {string} fit - 맞춤 방식
 * @property {number} quality - 품질
 * @property {string} [format] - 포맷
 * @property {number} [blur] - 블러 정도
 * @property {string} metadata - 메타데이터 처리 방식
 * @property {string} description - 변형 설명
 */

/**
 * @typedef {Object} CloudflareConfig
 * @property {string} accountId - 계정 ID
 * @property {string} language - 언어 설정
 * @property {string} baseUrl - 기본 URL
 * @property {boolean} hasApiKey - API 키 존재 여부
 * @property {boolean} hasGlobalApiKey - Global API 키 존재 여부
 */