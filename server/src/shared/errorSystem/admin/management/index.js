/**
 * Admin Management Error Codes (A3xxx-A9xxx)
 * 슈퍼관리자 관리 에러 코드
 */

export const ADMIN_MANAGEMENT_ERROR = {
  // 관리자 관리 (A3xxx)
  A3001: {
    key: 'ADMIN_NOT_FOUND',
    vi: 'Không tìm thấy quản trị viên',
    en: 'Admin not found',
    ko: '관리자를 찾을 수 없습니다'
  },
  A3002: {
    key: 'EMAIL_ALREADY_EXISTS',
    vi: 'Email đã được sử dụng',
    en: 'Email already exists',
    ko: '이미 사용 중인 이메일입니다'
  },

  // 매장 관리 (A4xxx)
  A4001: {
    key: 'STORE_NOT_FOUND',
    vi: 'Không tìm thấy cửa hàng',
    en: 'Store not found',
    ko: '매장을 찾을 수 없습니다'
  },
  A4002: {
    key: 'STORE_ALREADY_APPROVED',
    vi: 'Cửa hàng đã được phê duyệt',
    en: 'Store already approved',
    ko: '이미 승인된 매장입니다'
  },
  A4003: {
    key: 'STORE_ALREADY_REJECTED',
    vi: 'Cửa hàng đã bị từ chối',
    en: 'Store already rejected',
    ko: '이미 거부된 매장입니다'
  },

  // 사용자 관리 (A5xxx)
  A5001: {
    key: 'USER_NOT_FOUND',
    vi: 'Không tìm thấy người dùng',
    en: 'User not found',
    ko: '사용자를 찾을 수 없습니다'
  },
  A5002: {
    key: 'USER_ALREADY_SUSPENDED',
    vi: 'Người dùng đã bị tạm ngưng',
    en: 'User already suspended',
    ko: '이미 정지된 사용자입니다'
  },

  // 주문 관리 (A6xxx)
  A6001: {
    key: 'ORDER_NOT_FOUND',
    vi: 'Không tìm thấy đơn hàng',
    en: 'Order not found',
    ko: '주문을 찾을 수 없습니다'
  },

  // 데이터 처리 (A7xxx)
  A7001: {
    key: 'DATA_EXPORT_FAILED',
    vi: 'Xuất dữ liệu thất bại',
    en: 'Data export failed',
    ko: '데이터 내보내기 실패'
  },

  // 로그 관리 (A8xxx)
  A8001: {
    key: 'LOG_NOT_FOUND',
    vi: 'Không tìm thấy nhật ký',
    en: 'Log not found',
    ko: '로그를 찾을 수 없습니다'
  },

  // 기타 에러 (A9xxx)
  A9001: {
    key: 'OPERATION_NOT_ALLOWED',
    vi: 'Thao tác không được phép',
    en: 'Operation not allowed',
    ko: '허용되지 않은 작업입니다'
  },
};

export default ADMIN_MANAGEMENT_ERROR;
