/**
 * Admin System Error Codes (A1xxx)
 * 슈퍼관리자 시스템 에러 코드
 */

export const ADMIN_SYSTEM_ERROR = {
  // 일반 에러 (A1001-A1099)
  A1001: {
    key: 'INTERNAL_SERVER_ERROR',
    vi: 'Lỗi máy chủ nội bộ',
    en: 'Internal server error',
    ko: '내부 서버 오류'
  },
  A1002: {
    key: 'DATABASE_ERROR',
    vi: 'Lỗi cơ sở dữ liệu',
    en: 'Database error',
    ko: '데이터베이스 오류'
  },
  A1003: {
    key: 'VALIDATION_ERROR',
    vi: 'Lỗi xác thực dữ liệu',
    en: 'Validation error',
    ko: '데이터 검증 오류'
  },
  A1004: {
    key: 'INVALID_INPUT',
    vi: 'Dữ liệu đầu vào không hợp lệ',
    en: 'Invalid input data',
    ko: '잘못된 입력 데이터'
  },
  A1005: {
    key: 'RESOURCE_NOT_FOUND',
    vi: 'Không tìm thấy tài nguyên',
    en: 'Resource not found',
    ko: '리소스를 찾을 수 없습니다'
  },
  A1006: {
    key: 'MISSING_REQUIRED_FIELD',
    vi: 'Thiếu trường bắt buộc',
    en: 'Missing required field',
    ko: '필수 필드 누락'
  },
  A1007: {
    key: 'DUPLICATE_PROMO_CODE',
    vi: 'Mã khuyến mãi đã tồn tại',
    en: 'Promotion code already exists',
    ko: '이미 존재하는 프로모션 코드입니다'
  },
  A1008: {
    key: 'INVALID_DATE_RANGE',
    vi: 'Khoảng thời gian không hợp lệ',
    en: 'Invalid date range',
    ko: '잘못된 날짜 범위입니다'
  },
  A1009: {
    key: 'CANNOT_DELETE_ACTIVE_PROMOTION',
    vi: 'Không thể xóa khuyến mãi đang hoạt động',
    en: 'Cannot delete active promotion',
    ko: '활성 프로모션은 삭제할 수 없습니다'
  },
  A1010: {
    key: 'CANNOT_DELETE_ACTIVE_BANNER',
    vi: 'Không thể xóa banner đang hoạt động',
    en: 'Cannot delete active banner',
    ko: '활성 배너는 삭제할 수 없습니다'
  },
  A1011: {
    key: 'CATEGORY_HAS_ITEMS',
    vi: 'Danh mục có sản phẩm',
    en: 'Category has items',
    ko: '카테고리에 아이템이 있습니다'
  },
  A1012: {
    key: 'DUPLICATE_CATEGORY_CODE',
    vi: 'Mã danh mục đã tồn tại',
    en: 'Category code already exists',
    ko: '이미 존재하는 카테고리 코드입니다'
  },
};

export default ADMIN_SYSTEM_ERROR;
