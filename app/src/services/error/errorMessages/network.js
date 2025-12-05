/**
 * 네트워크 관련 에러 코드 및 메시지
 * 코드 범위: C1xxx (Client Network Errors)
 */

export const NETWORK_ERRORS = {
  // 연결 에러
  C1001: {
    code: 'NETWORK_TIMEOUT',
    message: {
      vi: 'Yêu cầu đã hết thời gian. Vui lòng thử lại.',
      ko: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
      en: 'Request timed out. Please try again.'
    },
    severity: 'error',
    retryable: true
  },
  C1002: {
    code: 'NETWORK_OFFLINE',
    message: {
      vi: 'Không có kết nối internet. Vui lòng kiểm tra kết nối.',
      ko: '인터넷 연결이 없습니다. 연결을 확인해주세요.',
      en: 'No internet connection. Please check your connection.'
    },
    severity: 'error',
    retryable: false
  },
  C1003: {
    code: 'CONNECTION_LOST',
    message: {
      vi: 'Kết nối bị gián đoạn. Đang thử kết nối lại...',
      ko: '연결이 끊어졌습니다. 다시 연결 중...',
      en: 'Connection lost. Reconnecting...'
    },
    severity: 'warning',
    retryable: true
  },
  C1004: {
    code: 'SERVER_UNREACHABLE',
    message: {
      vi: 'Không thể kết nối đến máy chủ.',
      ko: '서버에 연결할 수 없습니다.',
      en: 'Cannot connect to server.'
    },
    severity: 'error',
    retryable: true
  },
  C1005: {
    code: 'SSL_ERROR',
    message: {
      vi: 'Lỗi bảo mật kết nối. Vui lòng thử lại.',
      ko: '보안 연결 오류. 다시 시도해주세요.',
      en: 'Secure connection error. Please try again.'
    },
    severity: 'error',
    retryable: true
  },
  C1006: {
    code: 'REQUEST_FAILED',
    message: {
      vi: 'Yêu cầu thất bại. Vui lòng thử lại.',
      ko: '요청이 실패했습니다. 다시 시도해주세요.',
      en: 'Request failed. Please try again.'
    },
    severity: 'error',
    retryable: true
  }
};

export default NETWORK_ERRORS;