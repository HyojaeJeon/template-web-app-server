/**
 * Shared Utils - 통합 Export
 * Local 배달 앱을 위한 유틸리티 함수들의 중앙 집중식 export
 * 
 * 구조:
 * - business: 비즈니스 로직 관련 (장바구니, 배달, 검색)
 * - data: 데이터 처리 및 변환 (포맷팅, 유효성 검사)
 * - platform: 플랫폼/디바이스 관련 (접근성, 이미지, 위치)
 * - localization: 다국어 및 지역화
 * - ui: UI 관련 유틸리티 (스타일)
 * - system: 시스템 레벨 (로깅)
 */

// ===== BUSINESS LOGIC =====
// 장바구니 관리
export {
  persistCart,
  restoreCart,
  clearPersistedCart,
  getCartMetadata,
  hasPersistedCart
} from './business/cart/cartPersistence';

// 배달 구역 검증
export {
  checkDeliveryZone,
  checkSpecialDeliveryConditions,
  checkCurrentLocationDelivery,
  calculateDistance,
  extractDistrict
} from './business/delivery/deliveryZoneChecker';

// 검색 결과 변환
export {
  transformSearchResults,
  transformPopularSearches,
  transformSearchCategories
} from './business/search/searchTransform';

// ===== DATA PROCESSING =====
// 날짜 포맷팅
export * from './data/format/dateUtils';

// 일반 포맷터 (가격, 통화 등)
export {
  formatCurrency,
  formatVND,
  formatCurrencyShort,
  formatDistance,
  formatDuration,
  formatDate,
  formatRelativeTime,
  formatPhoneNumber as formatPhoneNumberBasic,  // 기본 Local어 포맷팅
  formatPercent,
  formatOrderNumber,
  formatRating
} from './data/format/formatters';

// 전화번호 유틸리티 (국제 전화번호 시스템)
export {
  COUNTRIES,
  DEFAULT_COUNTRY,
  getCountryByCode,
  getCountryByDialCode,
  detectCountryFromPhone,
  normalizePhoneNumber,
  formatToLocal,
  formatPhoneNumber,  // 국제 전화번호 포맷팅 (메인)
  formatPhoneNumberInput,
  validatePhoneNumber,
  maskPhoneNumber,
  getCountryName
} from './data/format/phoneUtils';

// 입력 유효성 검사
export * from './data/validation/validation';

// ===== PLATFORM UTILITIES =====
// 접근성 지원
export * from './platform/accessibility/accessibilityHelper';
export * from './platform/accessibility/touchUtils';

// 이미지 처리
// React Native 0.80+ 호환성을 위해 default export만 사용
import imageCacheManager from './platform/image/imageCache';
import imageUtils from './platform/image/imageUtils';

export { imageCacheManager, imageUtils };

// 위치 및 거리 계산
export {
  calculateDistance as calculateLocationDistance,
  validateVietnameseAddress,
  formatVietnameseAddress,
  isPointInPolygon,
  isPointInRadius,
  isDeliveryAvailable,
  calculateDeliveryFee,
  calculateEstimatedDeliveryTime,
  calculateMapRegion,
  toVietnameseTime,
  isStoreOpen,
  reverseGeocode,
  geocodeAddress
} from './platform/location/locationUtils';

export {
  calculateStoreDistance,
  formatDistance as formatDistanceStore,
  estimateDeliveryTime,
  isDeliveryAvailable as isStoreDeliveryAvailable
} from './platform/location/distanceCalculator';

export {
  calculateStoreStatus,
  getStatusBadgeStyle
} from './platform/location/storeStatusCalculator';

// ===== LOCALIZATION =====
// Local 지역화 유틸리티
export * from './localization/localizationUtils';
export * from './localization/vietnam';

// VND 화폐 포맷팅은 data/format/formatters.js에서 export됨

// ===== SYSTEM LEVEL =====
// 로깅 시스템
export { default as logger, Logger } from './system/logger';

/**
 * 사용 예시:
 * 
 * // 개별 import (권장)
 * import { persistCart, formatVND, logger } from '@shared/utils';
 * 
 * // 카테고리별 import
 * import { checkDeliveryZone } from '@shared/utils/business/delivery/deliveryZoneChecker';
 * 
 * // 시스템 레벨
 * import { logger } from '@shared/utils';
 * logger.info('Utils loaded successfully');
 */