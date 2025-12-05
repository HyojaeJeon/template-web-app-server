/**
 * Web Error Codes - 웹 클라이언트 전용 에러 코드
 * 100% 독립적인 웹 클라이언트 에러 정의
 *
 * 코드 체계:
 * - S1xxx: 시스템/일반 에러
 * - S2xxx: 인증/인가
 * - S3xxx: 매장 관리
 * - S4xxx: 메뉴 관리
 * - S5xxx: POS 통합
 * - S6xxx: 주문 관리
 * - S7xxx: 직원 관리
 * - S8xxx: 통계/분석
 * - S9xxx: 정산/재무
 */

// 도메인별 에러 import
import { STORE_SYSTEM_ERRORS } from './store/system/index.js';
import { STORE_AUTH_ERRORS } from './store/auth/index.js';
import { STORE_SETTINGS_ERRORS } from './store/settings/index.js';
import { STORE_PROFILE_ERRORS } from './store/profile/index.js';
import { STORE_MENU_ERRORS } from './store/menu/index.js';
import { storePaymentsErrorCodes } from './store/payments/index.js';
import { STORE_ORDERS_ERRORS } from './store/orders/index.js';
import { STORE_REVIEWS_ERRORS } from './store/reviews/index.js';
import { STORE_NOTIFICATIONS_ERRORS } from './store/notifications/index.js';
import { STORE_PRINT_ERRORS } from './store/print/index.js';
import { STORE_DASHBOARD_ERRORS } from './store/dashboard/index.js';
import { STORE_CHAT_ERRORS } from './store/chat/index.js';
import { STORE_DELIVERY_ERRORS } from './store/delivery/index.js';
import { STORE_POS_ERRORS } from './store/pos/index.js';
import { STORE_COUPON_ERRORS } from './store/coupon/index.js';
import { STORE_REPORTS_ERRORS } from './store/reports/index.js';
import { STORE_CUSTOMERS_ERRORS } from './store/customers/index.js';
import { STORE_ANALYTICS_ERRORS } from './store/analytics/index.js';
import { FINANCE_ERRORS as STORE_FINANCE_ERRORS } from './store/finance/index.js';
import { STORE_UPLOAD_ERRORS } from './store/upload/index.js';
import { STORE_STAFF_ERRORS } from './store/staff/index.js';
import { STORE_PROMOTION_ERRORS } from './store/promotions/index.js';

// 모든 웹 클라이언트 에러 코드 통합
// ⚠️ 중요: STORE_PROMOTION_ERRORS가 STORE_POS_ERRORS보다 나중에 병합되어야
// S5xxx 에러 코드가 프로모션 도메인으로 올바르게 해석됩니다.
const webErrorCodes = {
  ...STORE_SYSTEM_ERRORS,
  ...STORE_AUTH_ERRORS,
  ...STORE_SETTINGS_ERRORS,
  ...STORE_STAFF_ERRORS,
  ...STORE_PROFILE_ERRORS,
  ...STORE_MENU_ERRORS,
  ...STORE_POS_ERRORS,
  ...STORE_PROMOTION_ERRORS,  // S5xxx 프로모션 에러 (POS 에러를 덮어씀)
  ...storePaymentsErrorCodes,
  ...STORE_ORDERS_ERRORS,
  ...STORE_REVIEWS_ERRORS,
  ...STORE_NOTIFICATIONS_ERRORS,
  ...STORE_PRINT_ERRORS,
  ...STORE_DASHBOARD_ERRORS,
  ...STORE_DELIVERY_ERRORS,
  ...STORE_CHAT_ERRORS,
  ...STORE_COUPON_ERRORS,
  ...STORE_REPORTS_ERRORS,
  ...STORE_CUSTOMERS_ERRORS,
  ...STORE_ANALYTICS_ERRORS,
  ...STORE_FINANCE_ERRORS,
  ...STORE_UPLOAD_ERRORS
};

/**
 * 웹 클라이언트 에러 가져오기
 * @param {string} errorCode - 에러 코드 (예: 'S2001')
 * @param {string} language - 언어 코드 ('vi', 'en', 'ko')
 * @returns {Object} - { key, message } 형태의 에러 객체
 */
export function getWebError(errorCode, language = 'vi') {
  const error = webErrorCodes[errorCode];

  if (!error) {
    console.warn(`⚠️ Web error code not found: ${errorCode}`);
    return {
      key: `[${errorCode}]UNKNOWN_ERROR`,
      message: language === 'ko' ? '알 수 없는 오류가 발생했습니다' :
               language === 'en' ? 'Unknown error occurred' :
               'Đã xảy ra lỗi không xác định'
    };
  }

  const message = error[language] || error.vi || 'Lỗi không xác định';

  return {
    key: `[${errorCode}]${error.key || 'UNKNOWN'}`,
    message
  };
}

// 전체 에러 코드 export (개발/디버그용)
export { webErrorCodes };

// 개별 도메인 에러 re-export (필요시)
export {
  STORE_SYSTEM_ERRORS,
  STORE_AUTH_ERRORS,
  STORE_PROFILE_ERRORS,
  STORE_MENU_ERRORS,
  storePaymentsErrorCodes,
  STORE_ORDERS_ERRORS,
  STORE_REVIEWS_ERRORS,
  STORE_NOTIFICATIONS_ERRORS,
  STORE_PRINT_ERRORS,
  STORE_DASHBOARD_ERRORS,
  STORE_DELIVERY_ERRORS,
  STORE_CHAT_ERRORS,
  STORE_POS_ERRORS,
  STORE_REPORTS_ERRORS,
  STORE_CUSTOMERS_ERRORS,
  STORE_ANALYTICS_ERRORS,
  STORE_FINANCE_ERRORS
};