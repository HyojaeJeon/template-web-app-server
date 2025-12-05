/**
 * Admin Management Success Codes (AS200-AS999)
 * 슈퍼관리자 관리 성공 코드
 */

export const ADMIN_MANAGEMENT_SUCCESS = {
  // 사용자 관리 (AS200-AS299)
  AS201: {
    key: 'USER_CREATED',
    vi: 'Tạo người dùng thành công',
    en: 'User created successfully',
    ko: '사용자가 생성되었습니다'
  },
  AS202: {
    key: 'USER_UPDATED',
    vi: 'Cập nhật người dùng thành công',
    en: 'User updated successfully',
    ko: '사용자가 업데이트되었습니다'
  },
  AS203: {
    key: 'USER_DELETED',
    vi: 'Xóa người dùng thành công',
    en: 'User deleted successfully',
    ko: '사용자가 삭제되었습니다'
  },
  AS204: {
    key: 'USER_SUSPENDED',
    vi: 'Tạm ngưng người dùng thành công',
    en: 'User suspended successfully',
    ko: '사용자가 정지되었습니다'
  },
  AS205: {
    key: 'USER_ACTIVATED',
    vi: 'Kích hoạt người dùng thành công',
    en: 'User activated successfully',
    ko: '사용자가 활성화되었습니다'
  },

  // 매장 관리 (AS300-AS399)
  AS301: {
    key: 'STORE_CREATED',
    vi: 'Tạo cửa hàng thành công',
    en: 'Store created successfully',
    ko: '매장이 생성되었습니다'
  },
  AS302: {
    key: 'STORE_UPDATED',
    vi: 'Cập nhật cửa hàng thành công',
    en: 'Store updated successfully',
    ko: '매장이 업데이트되었습니다'
  },
  AS303: {
    key: 'STORE_DELETED',
    vi: 'Xóa cửa hàng thành công',
    en: 'Store deleted successfully',
    ko: '매장이 삭제되었습니다'
  },
  AS304: {
    key: 'STORE_APPROVED',
    vi: 'Phê duyệt cửa hàng thành công',
    en: 'Store approved successfully',
    ko: '매장이 승인되었습니다'
  },
  AS305: {
    key: 'STORE_REJECTED',
    vi: 'Từ chối cửa hàng thành công',
    en: 'Store rejected successfully',
    ko: '매장이 거부되었습니다'
  },
  AS306: {
    key: 'STORE_SUSPENDED',
    vi: 'Tạm ngưng cửa hàng thành công',
    en: 'Store suspended successfully',
    ko: '매장이 정지되었습니다'
  },
  AS307: {
    key: 'STORE_ACTIVATED',
    vi: 'Kích hoạt cửa hàng thành công',
    en: 'Store activated successfully',
    ko: '매장이 활성화되었습니다'
  },

  // 주문 관리 (AS400-AS499)
  AS401: {
    key: 'ORDER_CANCELLED',
    vi: 'Hủy đơn hàng thành công',
    en: 'Order cancelled successfully',
    ko: '주문이 취소되었습니다'
  },
  AS402: {
    key: 'REFUND_PROCESSED',
    vi: 'Xử lý hoàn tiền thành công',
    en: 'Refund processed successfully',
    ko: '환불이 처리되었습니다'
  },

  // 번역 관리 (AS450-AS499)
  AS450: {
    key: 'TRANSLATION_SUCCESS',
    vi: 'Dịch thành công',
    en: 'Translation completed successfully',
    ko: '번역이 완료되었습니다'
  },
  AS451: {
    key: 'TRANSLATION_NO_FIELDS',
    vi: 'Không có trường để dịch',
    en: 'No fields to translate',
    ko: '번역할 필드가 없습니다'
  },

  // 관리자 계정 관리 (AS500-AS599)
  AS501: {
    key: 'ADMIN_CREATED',
    vi: 'Tạo quản trị viên thành công',
    en: 'Admin created successfully',
    ko: '관리자가 생성되었습니다'
  },
  AS502: {
    key: 'ADMIN_UPDATED',
    vi: 'Cập nhật quản trị viên thành công',
    en: 'Admin updated successfully',
    ko: '관리자가 업데이트되었습니다'
  },
  AS503: {
    key: 'ADMIN_DELETED',
    vi: 'Xóa quản trị viên thành công',
    en: 'Admin deleted successfully',
    ko: '관리자가 삭제되었습니다'
  },

  // 프로모션 관리 (AS600-AS699)
  AS601: {
    key: 'PROMOTION_STATUS_UPDATED',
    vi: 'Cập nhật trạng thái khuyến mãi thành công',
    en: 'Promotion status updated successfully',
    ko: '프로모션 상태가 업데이트되었습니다'
  },
  AS602: {
    key: 'PROMOTION_ACTIVATED',
    vi: 'Kích hoạt khuyến mãi thành công',
    en: 'Promotion activated successfully',
    ko: '프로모션이 활성화되었습니다'
  },
  AS603: {
    key: 'PROMOTION_DEACTIVATED',
    vi: 'Vô hiệu hóa khuyến mãi thành công',
    en: 'Promotion deactivated successfully',
    ko: '프로모션이 비활성화되었습니다'
  },
  AS604: {
    key: 'PROMOTION_APPROVED',
    vi: 'Phê duyệt khuyến mãi thành công',
    en: 'Promotion approved successfully',
    ko: '프로모션이 승인되었습니다'
  },
  AS605: {
    key: 'PROMOTION_REJECTED',
    vi: 'Từ chối khuyến mãi thành công',
    en: 'Promotion rejected successfully',
    ko: '프로모션이 거부되었습니다'
  },
  AS606: {
    key: 'PROMOTION_DELETED',
    vi: 'Xóa khuyến mãi thành công',
    en: 'Promotion deleted successfully',
    ko: '프로모션이 삭제되었습니다'
  },
  AS607: {
    key: 'PROMOTION_CREATED',
    vi: 'Tạo khuyến mãi thành công',
    en: 'Promotion created successfully',
    ko: '프로모션이 생성되었습니다'
  },
  AS608: {
    key: 'PROMOTION_UPDATED',
    vi: 'Cập nhật khuyến mãi thành công',
    en: 'Promotion updated successfully',
    ko: '프로모션이 업데이트되었습니다'
  },

  // 배너 관리 (AS700-AS799)
  AS701: {
    key: 'BANNER_CREATED',
    vi: 'Tạo banner thành công',
    en: 'Banner created successfully',
    ko: '배너가 생성되었습니다'
  },
  AS702: {
    key: 'BANNER_UPDATED',
    vi: 'Cập nhật banner thành công',
    en: 'Banner updated successfully',
    ko: '배너가 업데이트되었습니다'
  },
  AS703: {
    key: 'BANNER_DELETED',
    vi: 'Xóa banner thành công',
    en: 'Banner deleted successfully',
    ko: '배너가 삭제되었습니다'
  },
  AS704: {
    key: 'BANNER_ACTIVATED',
    vi: 'Kích hoạt banner thành công',
    en: 'Banner activated successfully',
    ko: '배너가 활성화되었습니다'
  },
  AS705: {
    key: 'BANNER_DEACTIVATED',
    vi: 'Vô hiệu hóa banner thành công',
    en: 'Banner deactivated successfully',
    ko: '배너가 비활성화되었습니다'
  },

  // 카테고리 관리 (AS800-AS899)
  AS801: {
    key: 'CATEGORY_CREATED',
    vi: 'Tạo danh mục thành công',
    en: 'Category created successfully',
    ko: '카테고리가 생성되었습니다'
  },
  AS802: {
    key: 'CATEGORY_UPDATED',
    vi: 'Cập nhật danh mục thành công',
    en: 'Category updated successfully',
    ko: '카테고리가 업데이트되었습니다'
  },
  AS803: {
    key: 'CATEGORY_DELETED',
    vi: 'Xóa danh mục thành công',
    en: 'Category deleted successfully',
    ko: '카테고리가 삭제되었습니다'
  },
  AS804: {
    key: 'CATEGORIES_REORDERED',
    vi: 'Sắp xếp lại danh mục thành công',
    en: 'Categories reordered successfully',
    ko: '카테고리 순서가 변경되었습니다'
  },

  // 메뉴 관리 (AS900-AS999)
  AS900: {
    key: 'MENU_LIST_RETRIEVED',
    vi: 'Lấy danh sách menu thành công',
    en: 'Menu list retrieved successfully',
    ko: '메뉴 목록을 조회했습니다'
  },
  AS901: {
    key: 'MENU_CATEGORIES_RETRIEVED',
    vi: 'Lấy danh mục menu thành công',
    en: 'Menu categories retrieved successfully',
    ko: '메뉴 카테고리를 조회했습니다'
  },
  AS902: {
    key: 'MENU_PAGE_RETRIEVED',
    vi: 'Lấy trang menu thành công',
    en: 'Menu page retrieved successfully',
    ko: '메뉴 페이지를 조회했습니다'
  },
  AS910: {
    key: 'MENU_CATEGORY_CREATED',
    vi: 'Tạo danh mục menu thành công',
    en: 'Menu category created successfully',
    ko: '메뉴 카테고리가 생성되었습니다'
  },
  AS911: {
    key: 'MENU_CATEGORY_UPDATED',
    vi: 'Cập nhật danh mục menu thành công',
    en: 'Menu category updated successfully',
    ko: '메뉴 카테고리가 업데이트되었습니다'
  },
  AS912: {
    key: 'MENU_CATEGORY_DELETED',
    vi: 'Xóa danh mục menu thành công',
    en: 'Menu category deleted successfully',
    ko: '메뉴 카테고리가 삭제되었습니다'
  },
  AS913: {
    key: 'MENU_CATEGORIES_REORDERED',
    vi: 'Sắp xếp lại danh mục menu thành công',
    en: 'Menu categories reordered successfully',
    ko: '메뉴 카테고리 순서가 변경되었습니다'
  },
  AS920: {
    key: 'MENU_ITEM_CREATED',
    vi: 'Tạo món ăn thành công',
    en: 'Menu item created successfully',
    ko: '메뉴 아이템이 생성되었습니다'
  },
  AS921: {
    key: 'MENU_ITEM_UPDATED',
    vi: 'Cập nhật món ăn thành công',
    en: 'Menu item updated successfully',
    ko: '메뉴 아이템이 업데이트되었습니다'
  },
  AS922: {
    key: 'MENU_ITEM_DELETED',
    vi: 'Xóa món ăn thành công',
    en: 'Menu item deleted successfully',
    ko: '메뉴 아이템이 삭제되었습니다'
  },
  AS923: {
    key: 'MENU_ITEM_ACTIVATED',
    vi: 'Kích hoạt món ăn thành công',
    en: 'Menu item activated successfully',
    ko: '메뉴 아이템이 활성화되었습니다'
  },
  AS924: {
    key: 'MENU_ITEM_DEACTIVATED',
    vi: 'Vô hiệu hóa món ăn thành công',
    en: 'Menu item deactivated successfully',
    ko: '메뉴 아이템이 비활성화되었습니다'
  },
  AS925: {
    key: 'MENU_ITEM_FEATURED_UPDATED',
    vi: 'Cập nhật trạng thái nổi bật thành công',
    en: 'Featured status updated successfully',
    ko: '추천 메뉴 상태가 업데이트되었습니다'
  },
  AS926: {
    key: 'MENU_ITEM_BESTSELLER_UPDATED',
    vi: 'Cập nhật trạng thái bán chạy thành công',
    en: 'Bestseller status updated successfully',
    ko: '베스트셀러 상태가 업데이트되었습니다'
  },
  AS930: {
    key: 'BULK_UPDATE_COMPLETED',
    vi: 'Cập nhật hàng loạt thành công',
    en: 'Bulk update completed successfully',
    ko: '일괄 업데이트가 완료되었습니다'
  },
  AS931: {
    key: 'BULK_PRICE_UPDATE_COMPLETED',
    vi: 'Cập nhật giá hàng loạt thành công',
    en: 'Bulk price update completed successfully',
    ko: '가격 일괄 업데이트가 완료되었습니다'
  },
  AS932: {
    key: 'BULK_CATEGORY_UPDATE_COMPLETED',
    vi: 'Cập nhật danh mục hàng loạt thành công',
    en: 'Bulk category update completed successfully',
    ko: '카테고리 일괄 이동이 완료되었습니다'
  },
  AS933: {
    key: 'STOCK_UPDATE_COMPLETED',
    vi: 'Cập nhật kho hàng thành công',
    en: 'Stock update completed successfully',
    ko: '재고가 업데이트되었습니다'
  },
};

export default ADMIN_MANAGEMENT_SUCCESS;
