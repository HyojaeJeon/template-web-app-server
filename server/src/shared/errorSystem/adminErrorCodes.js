/**
 * Admin Error Codes - 중앙 집중식 관리
 * Prefix: A (Admin)
 * Range: A1001-A9999
 */

import ADMIN_SYSTEM_ERROR from './admin/system/index.js';
import ADMIN_AUTH_ERROR from './admin/auth/index.js';
import ADMIN_MANAGEMENT_ERROR from './admin/management/index.js';

/**
 * 모든 Admin 에러 코드 통합
 */
export const ADMIN_ERROR_CODES = {
  ...ADMIN_SYSTEM_ERROR,
  ...ADMIN_AUTH_ERROR,
  ...ADMIN_MANAGEMENT_ERROR,
};

/**
 * Admin 에러 메시지 조회
 * @param {string} code - 에러 코드 (예: 'A2001')
 * @param {string} language - 언어 코드 (vi, en, ko)
 * @returns {object} - { code, key, message }
 */
export const getAdminError = (code, language = 'vi') => {
  const error = ADMIN_ERROR_CODES[code];

  if (!error) {
    return {
      code: 'A1001',
      key: 'INTERNAL_SERVER_ERROR',
      message: language === 'vi' ? 'Lỗi máy chủ nội bộ' :
               language === 'en' ? 'Internal server error' :
               '내부 서버 오류'
    };
  }

  return {
    code,
    key: error.key,
    message: error[language] || error.vi
  };
};

/**
 * GraphQL 에러 형식으로 변환
 * @param {string} code - 에러 코드
 * @param {string} language - 언어 코드
 * @returns {Error}
 */
export const createAdminError = (code, language = 'vi') => {
  const errorInfo = getAdminError(code, language);
  const error = new Error(errorInfo.message);
  error.extensions = {
    code: `[${code}]${errorInfo.key}`
  };
  return error;
};

export default ADMIN_ERROR_CODES;
