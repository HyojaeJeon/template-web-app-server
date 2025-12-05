/**
 * 리졸버별 필요 권한 매핑 테이블
 *
 * withSAuth가 리졸버 이름(name)을 보고 자동으로 권한을 체크합니다.
 *
 * 사용법:
 * - 리졸버 이름만 등록하면 자동으로 권한 체크
 * - 권한이 없으면 S2002(UNAUTHORIZED) 에러 자동 발생
 * - 리졸버 코드 수정 불필요
 *
 * 권한 종류 (StoreAccount 모델 참고):
 * - MANAGE_STORE_INFO: 매장 정보 관리
 * - MANAGE_BUSINESS_HOURS: 영업 시간 관리
 * - MANAGE_DELIVERY_SETTINGS: 배달 설정 관리
 * - CREATE_MENU_ITEM: 메뉴 생성
 * - UPDATE_MENU_ITEM: 메뉴 수정
 * - DELETE_MENU_ITEM: 메뉴 삭제
 * - MANAGE_MENU_CATEGORIES: 카테고리 관리
 * - VIEW_ORDERS: 주문 조회
 * - MANAGE_ORDERS: 주문 관리
 * - PROCESS_REFUNDS: 환불 처리
 * - INVITE_STAFF: 직원 초대
 * - MANAGE_STAFF_ROLES: 직원 역할 관리
 * - VIEW_REVENUE: 매출 조회
 * - VIEW_REPORTS: 리포트 조회
 * - MANAGE_PROMOTIONS: 프로모션 관리
 * - MANAGE_POS_SETTINGS: POS 설정 관리
 * - MANAGE_BANK_ACCOUNT: 계좌 정보 관리
 */

export const RESOLVER_PERMISSIONS = {
  // ============================================
  // 매장 관리 (Store Management)
  // ============================================
  'sUpdateStoreInfo': ['MANAGE_STORE_INFO'],
  'sUpdateBusinessHours': ['MANAGE_BUSINESS_HOURS'],
  'sUpdateDeliverySettings': ['MANAGE_DELIVERY_SETTINGS'],
  'sUpdateStoreStatus': ['MANAGE_STORE_INFO'],

  // ============================================
  // 메뉴 관리 (Menu Management)
  // ============================================

  // 카테고리
  'sCreateMenuCategory': ['MANAGE_MENU_CATEGORIES'],
  'sUpdateMenuCategory': ['MANAGE_MENU_CATEGORIES'],
  'sDeleteMenuCategory': ['MANAGE_MENU_CATEGORIES'],

  // 메뉴 아이템
  'sCreateMenuItem': ['CREATE_MENU_ITEM'],
  'sUpdateMenuItem': ['UPDATE_MENU_ITEM'],
  'sDeleteMenuItem': ['DELETE_MENU_ITEM'],
  'sDuplicateMenuItem': ['CREATE_MENU_ITEM'],
  'sToggleMenuItemStatus': ['UPDATE_MENU_ITEM'],
  'sToggleFeaturedStatus': ['UPDATE_MENU_ITEM'],
  'sToggleBestSellerStatus': ['UPDATE_MENU_ITEM'],
  'sBulkUpdatePrices': ['UPDATE_MENU_ITEM'],
  'sBulkToggleAvailability': ['UPDATE_MENU_ITEM'],
  'sBulkUpdateCategory': ['UPDATE_MENU_ITEM'],

  // 시즌 메뉴
  'sCreateSeasonalMenu': ['CREATE_MENU_ITEM'],

  // 옵션 그룹
  'sCreateMenuOptionGroup': ['CREATE_MENU_ITEM'],
  'sUpdateMenuOptionGroup': ['UPDATE_MENU_ITEM'],
  'sDeleteMenuOptionGroup': ['DELETE_MENU_ITEM'],

  // 옵션
  'sCreateMenuOption': ['CREATE_MENU_ITEM'],
  'sUpdateMenuOption': ['UPDATE_MENU_ITEM'],
  'sDeleteMenuOption': ['DELETE_MENU_ITEM'],

  // 이미지
  'sDeleteMenuImage': ['UPDATE_MENU_ITEM'],
  'sDeleteUploadedImages': ['DELETE_MENU_ITEM'],

  // 번들 (세트 메뉴)
  'sCreateBundle': ['CREATE_MENU_ITEM'],
  'sUpdateBundle': ['UPDATE_MENU_ITEM'],
  'sUpdateBundleByStep': ['UPDATE_MENU_ITEM'],
  'sDeleteBundle': ['DELETE_MENU_ITEM'],
  'sCreateBundleGroup': ['CREATE_MENU_ITEM'],
  'sUpdateBundleGroup': ['UPDATE_MENU_ITEM'],
  'sDeleteBundleGroup': ['DELETE_MENU_ITEM'],
  'sCreateBundleItem': ['CREATE_MENU_ITEM'],
  'sUpdateBundleItem': ['UPDATE_MENU_ITEM'],
  'sDeleteBundleItem': ['DELETE_MENU_ITEM'],

  // ============================================
  // 주문 관리 (Order Management)
  // ============================================
  'sUpdateOrderStatus': ['MANAGE_ORDERS'],
  'sCancelOrder': ['MANAGE_ORDERS'],
  'sAcceptOrder': ['MANAGE_ORDERS'],
  'sRejectOrder': ['MANAGE_ORDERS'],
  'sProcessRefund': ['PROCESS_REFUNDS'],

  // ============================================
  // 직원 관리 (Staff Management)
  // ============================================
  'sInviteStaff': ['INVITE_STAFF'],
  'sUpdateStaffRole': ['MANAGE_STAFF_ROLES'],
  'sDeleteStaff': ['MANAGE_STAFF_ROLES'],
  'sSuspendStaff': ['MANAGE_STAFF_ROLES'],
  'sActivateStaff': ['MANAGE_STAFF_ROLES'],

  // ============================================
  // 재무 관리 (Financial Management)
  // ============================================
  'sUpdateBankAccount': ['MANAGE_BANK_ACCOUNT'],

  // ============================================
  // 프로모션 관리 (Promotion Management)
  // ============================================
  'sCreatePromotion': ['MANAGE_PROMOTIONS'],
  'sUpdatePromotion': ['MANAGE_PROMOTIONS'],
  'sDeletePromotion': ['MANAGE_PROMOTIONS'],

  // ============================================
  // POS 설정 (POS Settings)
  // ============================================
  'sUpdatePosSettings': ['MANAGE_POS_SETTINGS'],
  'sConnectPosDevice': ['MANAGE_POS_SETTINGS'],
  'sDisconnectPosDevice': ['MANAGE_POS_SETTINGS'],
};

/**
 * 리졸버 이름으로 필요한 권한 목록 조회
 * @param {string} resolverName - 리졸버 이름 (예: 'sCreateMenuItem')
 * @returns {string[]} 필요한 권한 배열 (예: ['CREATE_MENU_ITEM'])
 */
export function getRequiredPermissions(resolverName) {
  return RESOLVER_PERMISSIONS[resolverName] || [];
}

/**
 * 권한 체크가 필요한 리졸버인지 확인
 * @param {string} resolverName - 리졸버 이름
 * @returns {boolean}
 */
export function hasPermissionRequirement(resolverName) {
  return resolverName in RESOLVER_PERMISSIONS;
}
