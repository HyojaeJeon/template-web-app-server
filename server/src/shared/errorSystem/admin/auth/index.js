/**
 * Admin Auth Error Codes (A2xxx)
 * 슈퍼관리자 인증/인가 에러 코드
 */

export const ADMIN_AUTH_ERROR = {
  // 인증 에러 (A2001-A2099)
  A2001: {
    key: 'UNAUTHENTICATED',
    vi: 'Chưa xác thực',
    en: 'Unauthenticated',
    ko: '인증되지 않음'
  },
  A2002: {
    key: 'UNAUTHORIZED',
    vi: 'Không có quyền truy cập',
    en: 'Unauthorized access',
    ko: '권한 없음'
  },
  A2003: {
    key: 'TOKEN_EXPIRED',
    vi: 'Token đã hết hạn',
    en: 'Token expired',
    ko: '토큰 만료'
  },
  A2004: {
    key: 'ACCOUNT_SUSPENDED',
    vi: 'Tài khoản đã bị tạm ngưng',
    en: 'Account suspended',
    ko: '계정이 정지되었습니다'
  },
  A2005: {
    key: 'ACCOUNT_TERMINATED',
    vi: 'Tài khoản đã bị chấm dứt',
    en: 'Account terminated',
    ko: '계정이 해지되었습니다'
  },
  A2006: {
    key: 'INVALID_CREDENTIALS',
    vi: 'Email hoặc mật khẩu không đúng',
    en: 'Invalid email or password',
    ko: '이메일 또는 비밀번호가 올바르지 않습니다'
  },
  A2007: {
    key: 'INVALID_TOKEN',
    vi: 'Token không hợp lệ',
    en: 'Invalid token',
    ko: '유효하지 않은 토큰'
  },
  A2008: {
    key: 'CANNOT_DELETE_SELF',
    vi: 'Không thể xóa tài khoản của chính mình',
    en: 'Cannot delete your own account',
    ko: '본인 계정은 삭제할 수 없습니다'
  },
  A2009: {
    key: 'INSUFFICIENT_PERMISSIONS',
    vi: 'Không đủ quyền để thực hiện thao tác này',
    en: 'Insufficient permissions for this operation',
    ko: '이 작업을 수행할 권한이 부족합니다'
  },
};

export default ADMIN_AUTH_ERROR;
