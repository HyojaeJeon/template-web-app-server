/**
 * 일반/기타 에러 코드 및 메시지
 * 코드 범위: C9xxx (Client General Errors)
 */

export const GENERAL_ERRORS = {
  // 일반 에러
  C9001: {
    code: 'UNKNOWN_ERROR',
    message: {
      vi: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
      ko: '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.',
      en: 'An unknown error occurred. Please try again.'
    },
    severity: 'error',
    retryable: true
  },
  C9002: {
    code: 'SOMETHING_WENT_WRONG',
    message: {
      vi: 'Có gì đó không ổn. Vui lòng thử lại sau.',
      ko: '문제가 발생했습니다. 나중에 다시 시도해주세요.',
      en: 'Something went wrong. Please try again later.'
    },
    severity: 'error',
    retryable: true
  },
  C9003: {
    code: 'FEATURE_NOT_IMPLEMENTED',
    message: {
      vi: 'Tính năng này chưa được triển khai.',
      ko: '이 기능은 아직 구현되지 않았습니다.',
      en: 'This feature is not yet implemented.'
    },
    severity: 'info',
    retryable: false
  },
  C9004: {
    code: 'CONFIGURATION_ERROR',
    message: {
      vi: 'Lỗi cấu hình ứng dụng.',
      ko: '앱 설정 오류가 발생했습니다.',
      en: 'Application configuration error.'
    },
    severity: 'error',
    retryable: false
  },

  // 데이터 처리 에러
  C9101: {
    code: 'DATA_PARSING_ERROR',
    message: {
      vi: 'Lỗi xử lý dữ liệu.',
      ko: '데이터 처리 오류가 발생했습니다.',
      en: 'Data processing error.'
    },
    severity: 'error',
    retryable: false
  },
  C9102: {
    code: 'DATA_SYNC_FAILED',
    message: {
      vi: 'Đồng bộ dữ liệu thất bại.',
      ko: '데이터 동기화에 실패했습니다.',
      en: 'Data sync failed.'
    },
    severity: 'warning',
    retryable: true
  },
  C9103: {
    code: 'CACHE_ERROR',
    message: {
      vi: 'Lỗi bộ nhớ đệm.',
      ko: '캐시 오류가 발생했습니다.',
      en: 'Cache error occurred.'
    },
    severity: 'warning',
    retryable: true
  },

  // 파일 처리 에러
  C9201: {
    code: 'FILE_UPLOAD_FAILED',
    message: {
      vi: 'Tải lên tệp thất bại.',
      ko: '파일 업로드에 실패했습니다.',
      en: 'File upload failed.'
    },
    severity: 'error',
    retryable: true
  },
  C9202: {
    code: 'FILE_TOO_LARGE',
    message: {
      vi: 'Tệp quá lớn.',
      ko: '파일이 너무 큽니다.',
      en: 'File is too large.'
    },
    severity: 'warning',
    retryable: false
  },
  C9203: {
    code: 'FILE_TYPE_NOT_SUPPORTED',
    message: {
      vi: 'Loại tệp không được hỗ trợ.',
      ko: '지원하지 않는 파일 형식입니다.',
      en: 'File type not supported.'
    },
    severity: 'warning',
    retryable: false
  },
  C9204: {
    code: 'IMAGE_PROCESSING_FAILED',
    message: {
      vi: 'Xử lý hình ảnh thất bại.',
      ko: '이미지 처리에 실패했습니다.',
      en: 'Image processing failed.'
    },
    severity: 'error',
    retryable: true
  },

  // 시스템 에러
  C9301: {
    code: 'SYSTEM_MAINTENANCE',
    message: {
      vi: 'Hệ thống đang bảo trì. Vui lòng quay lại sau.',
      ko: '시스템 점검 중입니다. 나중에 다시 방문해주세요.',
      en: 'System under maintenance. Please come back later.'
    },
    severity: 'info',
    retryable: false
  },
  C9302: {
    code: 'SERVICE_UNAVAILABLE',
    message: {
      vi: 'Dịch vụ tạm thời không khả dụng.',
      ko: '서비스를 일시적으로 사용할 수 없습니다.',
      en: 'Service temporarily unavailable.'
    },
    severity: 'warning',
    retryable: true
  },
  C9303: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: {
      vi: 'Quá nhiều yêu cầu. Vui lòng chờ một lúc.',
      ko: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      en: 'Too many requests. Please wait a moment.'
    },
    severity: 'warning',
    retryable: true
  },

  // 작업 상태 메시지
  C9401: {
    code: 'OPERATION_SUCCESS',
    message: {
      vi: 'Thao tác thành công.',
      ko: '작업이 성공적으로 완료되었습니다.',
      en: 'Operation successful.'
    },
    severity: 'success',
    retryable: false
  },
  C9402: {
    code: 'OPERATION_CANCELLED',
    message: {
      vi: 'Thao tác đã bị hủy.',
      ko: '작업이 취소되었습니다.',
      en: 'Operation cancelled.'
    },
    severity: 'info',
    retryable: false
  },
  C9403: {
    code: 'OPERATION_IN_PROGRESS',
    message: {
      vi: 'Đang xử lý...',
      ko: '처리 중...',
      en: 'Processing...'
    },
    severity: 'info',
    retryable: false
  }
};

export default GENERAL_ERRORS;