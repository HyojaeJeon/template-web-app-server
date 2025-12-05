/**
 * Mobile Success Codes (MS001-MS999)
 * 모바일 클라이언트 성공 코드 시스템
 * 
 * 코드 체계:
 * MS001-MS099: 인증/계정 관련
 * MS100-MS199: 프로필 관련
 * MS200-MS299: 주문 관련
 * MS300-MS399: 장바구니 관련
 * MS400-MS499: 결제 관련
 * MS500-MS599: 리뷰 관련
 * MS600-MS699: 쿠폰 관련
 * MS700-MS799: 알림 관련
 * MS800-MS899: 검색 관련
 * MS900-MS999: 기타 작업
 */

// 도메인별 성공 코드 import
import { MOBILE_AUTH_SUCCESS } from './mobile/auth/index.js';
import { MOBILE_PROFILE_SUCCESS } from './mobile/profile/index.js';
import { MOBILE_ORDERS_SUCCESS } from './mobile/orders/index.js';
import { MOBILE_CART_SUCCESS } from './mobile/cart/index.js';
import { MOBILE_MENU_SUCCESS } from './mobile/menu/index.js';
import { MOBILE_PAYMENT_SUCCESS } from './mobile/payment/index.js';
import { MOBILE_REVIEWS_SUCCESS } from './mobile/reviews/index.js';
import { MOBILE_NOTIFICATIONS_SUCCESS } from './mobile/notifications/index.js';
import { MOBILE_SYSTEM_SUCCESS } from './mobile/system/index.js';
import { MOBILE_COUPON_SUCCESS } from './mobile/coupon/index.js';
import { MOBILE_STORE_SUCCESS } from './mobile/store/index.js';
import { MOBILE_ADDRESSES_SUCCESS } from './mobile/addresses/index.js';
import { MOBILE_BANNERS_SUCCESS } from './mobile/banners/index.js';
import { MOBILE_POINTS_SUCCESS } from './mobile/points/index.js';
import { MOBILE_FAVORITES_SUCCESS } from './mobile/favorites/index.js';
import { MOBILE_HOME_SUCCESS } from './mobile/home/index.js';
import { MOBILE_SEARCH_SUCCESS } from './mobile/search/index.js';
import { MOBILE_CHAT_SUCCESS } from './mobile/chat/index.js';
import { mobileLocationSuccessCodes } from './mobile/location.js';

// 모든 모바일 성공 코드 통합
const mobileSuccessCodes = {
  ...MOBILE_AUTH_SUCCESS,
  ...MOBILE_PROFILE_SUCCESS,
  ...MOBILE_ORDERS_SUCCESS,
  ...MOBILE_CART_SUCCESS,
  ...MOBILE_MENU_SUCCESS,
  ...MOBILE_PAYMENT_SUCCESS,
  ...MOBILE_REVIEWS_SUCCESS,
  ...MOBILE_COUPON_SUCCESS,
  ...MOBILE_NOTIFICATIONS_SUCCESS,
  ...MOBILE_HOME_SUCCESS,
  ...MOBILE_STORE_SUCCESS,
  ...MOBILE_ADDRESSES_SUCCESS,
  ...MOBILE_BANNERS_SUCCESS,
  ...MOBILE_POINTS_SUCCESS,
  ...MOBILE_FAVORITES_SUCCESS,
  ...MOBILE_SEARCH_SUCCESS,
  ...MOBILE_CHAT_SUCCESS,
  ...mobileLocationSuccessCodes,

  // MS800번대 검색 관련 (현재 미구현 도메인)
  MS800: {
    key: 'SEARCH_SAVED',
    vi: 'Lưu tìm kiếm thành công',
    en: 'Search saved successfully',
    ko: '검색이 저장되었습니다'
  },
  MS801: {
    key: 'SEARCH_HISTORY_CLEARED',
    vi: 'Xóa lịch sử tìm kiếm thành công',
    en: 'Search history cleared successfully',
    ko: '검색 기록이 삭제되었습니다'
  },
  MS802: {
    key: 'FILTER_APPLIED',
    vi: 'Áp dụng bộ lọc thành công',
    en: 'Filter applied successfully',
    ko: '필터가 적용되었습니다'
  },
  
  ...MOBILE_SYSTEM_SUCCESS
};

/**
 * 모바일 성공 메시지 가져오기
 * @param {string} code - 성공 코드 (예: 'MS001')
 * @param {string} language - 언어 코드 ('vi', 'en', 'ko')
 * @returns {object} 성공 메시지 객체
 */
export const getMobileSuccess = (code, language = 'vi') => {
  const success = mobileSuccessCodes[code];
  
  if (!success) {
    console.warn(`Unknown mobile success code: ${code}`);
    return {
      key: 'UNKNOWN_SUCCESS',
      message: 'Operation successful'
    };
  }

  return {
    key: success.key,
    message: success[language] || success.vi || success.en
  };
};

// 개별 도메인 성공 코드 export (필요시 직접 접근 가능)
export {
  MOBILE_AUTH_SUCCESS,
  MOBILE_PROFILE_SUCCESS,
  MOBILE_ORDERS_SUCCESS,
  MOBILE_CART_SUCCESS,
  MOBILE_MENU_SUCCESS,
  MOBILE_PAYMENT_SUCCESS,
  MOBILE_REVIEWS_SUCCESS,
  MOBILE_NOTIFICATIONS_SUCCESS,
  MOBILE_SYSTEM_SUCCESS,
  MOBILE_HOME_SUCCESS,
  MOBILE_STORE_SUCCESS,
  MOBILE_ADDRESSES_SUCCESS,
  MOBILE_BANNERS_SUCCESS,
  MOBILE_POINTS_SUCCESS,
  MOBILE_FAVORITES_SUCCESS,
  MOBILE_COUPON_SUCCESS,
  MOBILE_SEARCH_SUCCESS,
  MOBILE_CHAT_SUCCESS
};

export default mobileSuccessCodes;