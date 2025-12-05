/**
 * Mobile Error Codes - 모바일 앱 전용 에러 코드
 * 100% 독립적인 모바일 클라이언트 에러 정의
 * 
 * 코드 체계:
 * - M1xxx: 시스템/일반 에러
 * - M2xxx: 인증/인가
 * - M3xxx: 주문 관련
 * - M4xxx: 결제 관련
 * - M5xxx: 장바구니
 * - M6xxx: 프로필/설정
 * - M7xxx: 포인트/리워드
 * - M8xxx: 즐겨찾기/알림
 * - M9xxx: 위치/배달
 */

// 도메인별 에러 import
import { MOBILE_SYSTEM_ERRORS } from './mobile/system/index.js';
import { MOBILE_AUTH_ERRORS } from './mobile/auth/index.js';
import { MOBILE_ORDER_ERRORS } from './mobile/orders/index.js';
import { MOBILE_PAYMENT_ERRORS } from './mobile/payment/index.js';
import { MOBILE_CART_ERRORS } from './mobile/cart/index.js';
import { MOBILE_PROFILE_ERRORS } from './mobile/profile/index.js';
import { MOBILE_REVIEWS_ERRORS } from './mobile/reviews/index.js';
import { MOBILE_NOTIFICATIONS_ERRORS } from './mobile/notifications/index.js';
import { MOBILE_COUPON_ERRORS } from './mobile/coupon/index.js';
import { MOBILE_SEARCH_ERRORS } from './mobile/search/index.js';
import { MOBILE_STORE_ERRORS } from './mobile/store/index.js';
import { MOBILE_ADDRESSES_ERRORS } from './mobile/addresses/index.js';
import { MOBILE_BANNERS_ERRORS } from './mobile/banners/index.js';
import { MOBILE_POINTS_ERRORS } from './mobile/points/index.js';
import { MOBILE_FAVORITES_ERRORS } from './mobile/favorites/index.js';
import { mobileLocationErrorCodes } from './mobile/location.js';
import { MOBILE_PROMOTION_ERRORS } from './mobile/promotions/index.js';

// 모든 모바일 에러 코드 통합
// 주의: 중복 코드가 있을 경우 나중에 선언된 것이 우선됨
const mobileErrorCodes = {
  ...MOBILE_SYSTEM_ERRORS,
  ...MOBILE_AUTH_ERRORS,
  ...MOBILE_ORDER_ERRORS,
  ...MOBILE_PAYMENT_ERRORS,
  ...MOBILE_CART_ERRORS,
  ...MOBILE_PROFILE_ERRORS,
  ...MOBILE_REVIEWS_ERRORS,
  ...MOBILE_NOTIFICATIONS_ERRORS,
  ...MOBILE_COUPON_ERRORS,
  ...MOBILE_STORE_ERRORS,
  ...MOBILE_ADDRESSES_ERRORS,
  ...MOBILE_BANNERS_ERRORS,
  ...MOBILE_POINTS_ERRORS,
  ...MOBILE_FAVORITES_ERRORS,
  ...MOBILE_PROMOTION_ERRORS, // M3020-M3029: 프로모션 검증
  ...mobileLocationErrorCodes, // M9xxx: Location 에러 (범위 넓음)
  ...MOBILE_SEARCH_ERRORS // M9xxx: Search 에러 - Location과 겹치지만 Search 우선
};

/**
 * 모바일 에러 가져오기
 * @param {string} code - 에러 코드 (예: 'M1001')
 * @param {string} language - 언어 코드 ('vi', 'en', 'ko')
 * @returns {object} 에러 객체
 */
export const getMobileError = (code, language = 'vi') => {
  const error = mobileErrorCodes[code];
  
  if (!error) {
    console.warn(`Unknown mobile error code: ${code}`);
    return {
      key: `[${code}]UNKNOWN_ERROR`,
      message: 'An error occurred'
    };
  }

  // 언어별 메시지 반환 (없으면 Local어 -> 영어 순으로 fallback)
  const message = error[language] || error.vi || error.en || 'An error occurred';
  
  return {
    key: `[${code}]${error.key}`,
    message
  };
};

// 개별 도메인 에러 export (필요시 직접 접근 가능)
export {
  MOBILE_SYSTEM_ERRORS,
  MOBILE_AUTH_ERRORS,
  MOBILE_ORDER_ERRORS,
  MOBILE_PAYMENT_ERRORS,
  MOBILE_CART_ERRORS,
  MOBILE_PROFILE_ERRORS,
  MOBILE_REVIEWS_ERRORS,
  MOBILE_NOTIFICATIONS_ERRORS,
  MOBILE_COUPON_ERRORS,
  MOBILE_SEARCH_ERRORS,
  MOBILE_STORE_ERRORS,
  MOBILE_ADDRESSES_ERRORS,
  MOBILE_BANNERS_ERRORS,
  MOBILE_POINTS_ERRORS,
  MOBILE_FAVORITES_ERRORS
};

export default mobileErrorCodes;