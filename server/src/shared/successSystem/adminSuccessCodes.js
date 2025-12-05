/**
 * Admin Success Codes - 중앙 집중식 관리
 * Prefix: AS (Admin Success)
 * Range: AS001-AS1299
 */

import ADMIN_SYSTEM_SUCCESS from './admin/system/index.js';
import ADMIN_AUTH_SUCCESS from './admin/auth/index.js';
import ADMIN_MANAGEMENT_SUCCESS from './admin/management/index.js';

/**
 * 모든 Admin 성공 코드 통합
 */
export const ADMIN_SUCCESS_CODES = {
  ...ADMIN_SYSTEM_SUCCESS,
  ...ADMIN_AUTH_SUCCESS,
  ...ADMIN_MANAGEMENT_SUCCESS,
};

/**
 * Admin 성공 메시지 조회
 * @param {string} code - 성공 코드 (예: 'AS101')
 * @param {string} language - 언어 코드 (vi, en, ko)
 * @returns {object} - { code, key, message }
 */
export const getAdminSuccess = (code, language = 'vi') => {
  const success = ADMIN_SUCCESS_CODES[code];

  if (!success) {
    return {
      code: 'AS001',
      key: 'OPERATION_SUCCESS',
      message: language === 'vi' ? 'Thao tác thành công' :
               language === 'en' ? 'Operation successful' :
               '작업이 완료되었습니다'
    };
  }

  return {
    code,
    key: success.key,
    message: success[language] || success.vi
  };
};

export default ADMIN_SUCCESS_CODES;
