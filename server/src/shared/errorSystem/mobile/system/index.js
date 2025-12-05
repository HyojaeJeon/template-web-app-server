/**
 * Mobile System Errors (M1xxx)
 * 시스템/일반 에러
 */

export const MOBILE_SYSTEM_ERRORS = {
  M1001: {
    key: 'UNKNOWN_ERROR',
    vi: 'Đã xảy ra lỗi không xác định',
    ko: '알 수 없는 오류가 발생했습니다',
    en: 'An unknown error occurred'
  },
  M1002: {
    key: 'VALIDATION_ERROR',
    vi: 'Dữ liệu không hợp lệ',
    ko: '입력 데이터가 유효하지 않습니다',
    en: 'Invalid input data'
  },
  M1003: {
    key: 'NETWORK_ERROR',
    vi: 'Lỗi kết nối mạng',
    ko: '네트워크 연결 오류',
    en: 'Network connection error'
  },
  M1004: {
    key: 'SERVER_ERROR',
    vi: 'Lỗi máy chủ nội bộ',
    ko: '내부 서버 오류',
    en: 'Internal server error'
  },
  M1005: {
    key: 'INVALID_INPUT',
    vi: 'Dữ liệu nhập không hợp lệ',
    ko: '잘못된 입력값입니다',
    en: 'Invalid input'
  },
  M1006: {
    key: 'MISSING_REQUIRED_FIELD',
    vi: 'Thiếu trường bắt buộc',
    ko: '필수 항목이 누락되었습니다',
    en: 'Missing required field'
  },
  M1007: {
    key: 'PERMISSION_DENIED',
    vi: 'Không có quyền truy cập',
    ko: '접근 권한이 없습니다',
    en: 'Permission denied'
  },
  M1008: {
    key: 'RATE_LIMIT_EXCEEDED',
    vi: 'Vượt quá giới hạn yêu cầu',
    ko: '요청 한도를 초과했습니다',
    en: 'Rate limit exceeded'
  },
  M1009: {
    key: 'SERVICE_UNAVAILABLE',
    vi: 'Dịch vụ tạm thời không khả dụng',
    ko: '서비스를 일시적으로 사용할 수 없습니다',
    en: 'Service temporarily unavailable'
  },
  M1010: {
    key: 'MAINTENANCE_MODE',
    vi: 'Hệ thống đang bảo trì',
    ko: '시스템 점검 중입니다',
    en: 'System under maintenance'
  },
  M1126: {
    key: 'DATA_SYNC_FAILED',
    vi: 'Đồng bộ dữ liệu thất bại',
    ko: '데이터 동기화에 실패했습니다',
    en: 'Data synchronization failed'
  },
  M1127: {
    key: 'BANNER_LOAD_FAILED',
    vi: 'Không thể tải banner',
    ko: '배너를 불러올 수 없습니다',
    en: 'Failed to load banners'
  },
  M1150: {
    key: 'HOME_INTERACTION_FAILED',
    vi: 'Không thể ghi nhận tương tác trang chủ',
    ko: '홈 화면 상호작용 기록에 실패했습니다',
    en: 'Failed to track home interaction'
  }
};