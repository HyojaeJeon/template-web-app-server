/**
 * Store System Errors (S1xxx)
 * 시스템/일반 에러
 */

export const STORE_SYSTEM_ERRORS = {
  S1001: {
    key: 'UNKNOWN_ERROR',
    vi: 'Đã xảy ra lỗi không xác định',
    ko: '알 수 없는 오류가 발생했습니다',
    en: 'An unknown error occurred'
  },
  S1002: {
    key: 'VALIDATION_ERROR',
    vi: 'Dữ liệu không hợp lệ',
    ko: '입력 데이터가 유효하지 않습니다',
    en: 'Invalid input data'
  },
  S1003: {
    key: 'NETWORK_ERROR',
    vi: 'Lỗi kết nối mạng',
    ko: '네트워크 연결 오류',
    en: 'Network connection error'
  },
  S1004: {
    key: 'SERVER_ERROR',
    vi: 'Lỗi máy chủ nội bộ',
    ko: '내부 서버 오류',
    en: 'Internal server error'
  },
  S1005: {
    key: 'INVALID_INPUT',
    vi: 'Dữ liệu nhập không hợp lệ',
    ko: '잘못된 입력값입니다',
    en: 'Invalid input'
  },
  S1006: {
    key: 'MISSING_REQUIRED_FIELD',
    vi: 'Thiếu trường bắt buộc',
    ko: '필수 필드가 누락되었습니다',
    en: 'Missing required field'
  },
  S1007: {
    key: 'RATE_LIMIT_EXCEEDED',
    vi: 'Vượt quá giới hạn yêu cầu',
    ko: '요청 한도를 초과했습니다',
    en: 'Rate limit exceeded'
  },
  S1008: {
    key: 'DATABASE_ERROR',
    vi: 'Lỗi cơ sở dữ liệu',
    ko: '데이터베이스 오류',
    en: 'Database error'
  },
  S1009: {
    key: 'FILE_UPLOAD_ERROR',
    vi: 'Lỗi tải lên tệp',
    ko: '파일 업로드 오류',
    en: 'File upload error'
  },
  S1010: {
    key: 'MAINTENANCE_MODE',
    vi: 'Hệ thống đang bảo trì',
    ko: '시스템 점검 중입니다',
    en: 'System under maintenance'
  },

  // 번역 서비스 에러 (S9001)
  S9001: {
    key: 'TRANSLATION_FAILED',
    vi: 'Dịch thất bại',
    ko: '번역에 실패했습니다',
    en: 'Translation failed'
  }
};