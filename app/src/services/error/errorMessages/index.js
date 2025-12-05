/**
 * 통합 에러 메시지 시스템
 * 모든 클라이언트 에러 코드와 메시지를 중앙 관리
 */

import NETWORK_ERRORS from '@services/error/errorMessages/network';
import VALIDATION_ERRORS from '@services/error/errorMessages/validation';
import AUTH_ERRORS from '@services/error/errorMessages/auth';
import GENERAL_ERRORS from '@services/error/errorMessages/general';

// 모든 에러 코드 통합
export const ERROR_MESSAGES = {
  ...NETWORK_ERRORS,
  ...VALIDATION_ERRORS,
  ...AUTH_ERRORS,
  ...GENERAL_ERRORS
};

// 에러 카테고리 정의
export const ERROR_CATEGORIES = {
  NETWORK: {
    range: 'C1xxx',
    name: {
      vi: 'Lỗi mạng',
      ko: '네트워크 오류',
      en: 'Network Error'
    },
    codes: Object.keys(NETWORK_ERRORS)
  },
  VALIDATION: {
    range: 'C2xxx',
    name: {
      vi: 'Lỗi xác thực',
      ko: '유효성 검사 오류',
      en: 'Validation Error'
    },
    codes: Object.keys(VALIDATION_ERRORS)
  },
  AUTH: {
    range: 'C3xxx',
    name: {
      vi: 'Lỗi xác thực',
      ko: '인증 오류',
      en: 'Authentication Error'
    },
    codes: Object.keys(AUTH_ERRORS)
  },
  GENERAL: {
    range: 'C9xxx',
    name: {
      vi: 'Lỗi chung',
      ko: '일반 오류',
      en: 'General Error'
    },
    codes: Object.keys(GENERAL_ERRORS)
  }
};

// 도메인별 에러 export
export {
  NETWORK_ERRORS,
  VALIDATION_ERRORS,
  AUTH_ERRORS,
  GENERAL_ERRORS
};

export default ERROR_MESSAGES;