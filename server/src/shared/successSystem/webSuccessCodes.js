/**
 * Web Success Codes (SS001-SS999)
 * 웹 클라이언트 성공 코드 시스템
 *
 * 코드 체계:
 * SS001-SS099: 인증/계정 관련
 * SS100-SS199: 매장 관리
 * SS200-SS299: 메뉴 관리
 * SS300-SS399: 주문 관리
 * SS400-SS499: 결제 관리 (Payments)
 * SS500-SS599: 쿠폰/프로모션
 * SS600-SS699: 리뷰 관리
 * SS700-SS799: 통계/분석
 * SS800-SS899: POS 연동
 * SS900-SS999: 직원 관리 (Staff) + 기타 작업
 */

// 도메인별 성공 코드 import
import { STORE_AUTH_SUCCESS } from './store/auth/index.js';
import { STORE_SETTINGS_SUCCESS } from './store/settings/index.js';
import { STORE_PROFILE_SUCCESS } from './store/profile/index.js';
import { STORE_MENU_SUCCESS } from './store/menu/index.js';
import { STORE_ORDERS_SUCCESS } from './store/orders/index.js';
import { STORE_SYSTEM_SUCCESS } from './store/system/index.js';
import { STORE_REVIEWS_SUCCESS } from './store/reviews/index.js';
import { storePaymentsSuccessCodes } from './store/payments/index.js';
import { STORE_NOTIFICATIONS_SUCCESS } from './store/notifications/index.js';
import { STORE_PRINT_SUCCESS } from './store/print/index.js';
import { STORE_DASHBOARD_SUCCESS } from './store/dashboard/index.js';
import { STORE_CHAT_SUCCESS } from './store/chat/index.js';
import { STORE_DELIVERY_SUCCESS } from './store/delivery/index.js';
import { STORE_POS_SUCCESS } from './store/pos/index.js';
import { STORE_COUPON_SUCCESS } from './store/coupon/index.js';
import { REPORTS_SUCCESS } from './store/reports/index.js';
import { STORE_CUSTOMERS_SUCCESS } from './store/customers/index.js';
import { STORE_STAFF_SUCCESS } from './store/staff/index.js';
import { STORE_PROMOTIONS_SUCCESS } from './store/promotions/index.js';

// 모든 웹 클라이언트 성공 코드 통합
// ⚠️ 주의: 스프레드 순서가 중요! 같은 코드는 마지막 것이 우선순위
// SS190-SS196: Settings(Brand)가 Promotions 덮어씀
// SS400-SS499: Payments가 최종 덮어씀
const webSuccessCodes = {
  ...STORE_AUTH_SUCCESS,
  ...STORE_PROFILE_SUCCESS,
  ...STORE_MENU_SUCCESS,
  ...STORE_ORDERS_SUCCESS,
  ...STORE_REVIEWS_SUCCESS,
  ...STORE_NOTIFICATIONS_SUCCESS,
  ...STORE_PRINT_SUCCESS,
  ...STORE_DASHBOARD_SUCCESS,
  ...STORE_CHAT_SUCCESS,
  ...STORE_DELIVERY_SUCCESS,
  ...STORE_POS_SUCCESS,
  ...STORE_COUPON_SUCCESS,
  ...STORE_PROMOTIONS_SUCCESS,   // SS190-SS195: 프로모션 (덮어써짐)
  ...REPORTS_SUCCESS,
  ...STORE_CUSTOMERS_SUCCESS,
  ...STORE_SYSTEM_SUCCESS,
  ...STORE_STAFF_SUCCESS,
  ...STORE_SETTINGS_SUCCESS,      // ✅ SS190-SS196: Brand Identity (최종 우선순위)
  ...storePaymentsSuccessCodes    // ✅ SS400: 결제 내역 조회 (최종 우선순위)
};

/**
 * 웹 클라이언트 성공 메시지 가져오기
 * @param {string} successCode - 성공 코드 (예: 'SS001')
 * @param {string} language - 언어 코드 ('vi', 'en', 'ko')
 * @returns {Object} - { key, message } 형태의 성공 객체
 */
export function getWebSuccess(successCode, language = 'vi') {
  const success = webSuccessCodes[successCode];

  if (!success) {
    console.warn(`⚠️ Web success code not found: ${successCode}`);
    return {
      key: `[${successCode}]UNKNOWN_SUCCESS`,
      message: language === 'ko' ? '작업이 완료되었습니다' :
               language === 'en' ? 'Operation completed successfully' :
               'Thao tác hoàn thành thành công'
    };
  }

  const message = success[language] || success.vi || 'Thành công';

  return {
    key: `[${successCode}]${success.key || 'SUCCESS'}`,
    message
  };
}

// 전체 성공 코드 export (개발/디버그용)
export { webSuccessCodes };

// 개별 도메인 성공 코드 re-export (필요시)
export {
  STORE_AUTH_SUCCESS,
  STORE_PROFILE_SUCCESS,
  STORE_MENU_SUCCESS,
  STORE_ORDERS_SUCCESS,
  STORE_SYSTEM_SUCCESS,
  storePaymentsSuccessCodes,
  STORE_REVIEWS_SUCCESS,
  STORE_NOTIFICATIONS_SUCCESS,
  STORE_PRINT_SUCCESS,
  STORE_DASHBOARD_SUCCESS,
  STORE_CHAT_SUCCESS,
  STORE_DELIVERY_SUCCESS,
  STORE_POS_SUCCESS,
  REPORTS_SUCCESS,
  STORE_CUSTOMERS_SUCCESS
};