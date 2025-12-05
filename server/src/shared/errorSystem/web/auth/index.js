/**
 * Store Auth Error Codes - S2xxx
 * 점주 앱 인증/인가 관련 에러 코드
 */

// ==================== 인증/인가 (S2xxx) ====================
export const STORE_AUTH_ERRORS = {
  S2001: {
    key: 'UNAUTHENTICATED',
    vi: 'Yêu cầu đăng nhập',
    ko: '로그인이 필요합니다',
    en: 'Authentication required'
  },
  S2002: {
    key: 'UNAUTHORIZED',
    vi: 'Không có quyền truy cập',
    ko: '접근 권한이 없습니다',
    en: 'Access denied'
  },
  S2003: {
    key: 'TOKEN_EXPIRED',
    vi: 'Phiên đăng nhập đã hết hạn',
    ko: '로그인 세션이 만료되었습니다',
    en: 'Session expired'
  },
  S2004: {
    key: 'INVALID_CREDENTIALS',
    vi: 'Thông tin đăng nhập không chính xác',
    ko: '잘못된 로그인 정보입니다',
    en: 'Invalid credentials'
  },
  S2005: {
    key: 'STORE_ACCOUNT_NOT_FOUND',
    vi: 'Không tìm thấy tài khoản cửa hàng',
    ko: '점주 계정을 찾을 수 없습니다',
    en: 'Store account not found'
  },
  S2006: {
    key: 'EMAIL_ALREADY_EXISTS',
    vi: 'Email đã được sử dụng',
    ko: '이미 사용 중인 이메일입니다',
    en: 'Email already exists'
  },
  S2007: {
    key: 'ACCOUNT_SUSPENDED',
    vi: 'Tài khoản đã bị tạm ngưng',
    ko: '계정이 정지되었습니다',
    en: 'Account suspended'
  },
  S2008: {
    key: 'INVALID_CURRENT_PASSWORD',
    vi: 'Mật khẩu hiện tại không đúng',
    ko: '현재 비밀번호가 올바르지 않습니다',
    en: 'Current password is incorrect'
  },
  S2009: {
    key: 'WEAK_PASSWORD',
    vi: 'Mật khẩu không đủ mạnh',
    ko: '비밀번호가 안전하지 않습니다',
    en: 'Password is too weak'
  },
  S2010: {
    key: 'PASSWORD_MISMATCH',
    vi: 'Mật khẩu xác nhận không khớp',
    ko: '비밀번호 확인이 일치하지 않습니다',
    en: 'Password confirmation does not match'
  },
  S2011: {
    key: 'STAFF_NOT_FOUND',
    vi: 'Không tìm thấy nhân viên',
    ko: '직원을 찾을 수 없습니다',
    en: 'Staff not found'
  },
  S2012: {
    key: 'PHONE_ALREADY_EXISTS',
    vi: 'Số điện thoại đã được sử dụng',
    ko: '이미 사용 중인 전화번호입니다',
    en: 'Phone number already exists'
  },
  S2013: {
    key: 'INVALID_PHONE_FORMAT',
    vi: 'Định dạng số điện thoại không hợp lệ',
    ko: '전화번호 형식이 올바르지 않습니다',
    en: 'Invalid phone number format'
  },
  S2014: {
    key: 'INVALID_EMAIL_FORMAT',
    vi: 'Định dạng email không hợp lệ',
    ko: '이메일 형식이 올바르지 않습니다',
    en: 'Invalid email format'
  },
  S2015: {
    key: 'ACCOUNT_ALREADY_ACTIVATED',
    vi: 'Tài khoản đã được kích hoạt',
    ko: '이미 활성화된 계정입니다',
    en: 'Account already activated'
  },
  S2016: {
    key: 'CANNOT_MODIFY_OWNER_ACCOUNT',
    vi: 'Không thể sửa đổi tài khoản chủ cửa hàng',
    ko: '점주 계정은 수정할 수 없습니다',
    en: 'Cannot modify owner account'
  },
  S2017: {
    key: 'INSUFFICIENT_ROLE_PERMISSION',
    vi: 'Vai trò không đủ quyền hạn',
    ko: '역할 권한이 부족합니다',
    en: 'Insufficient role permission'
  },
  S2018: {
    key: 'TERMS_NOT_ACCEPTED',
    vi: 'Chưa đồng ý điều khoản sử dụng',
    ko: '이용약관에 동의하지 않았습니다',
    en: 'Terms and conditions not accepted'
  }
};

export default STORE_AUTH_ERRORS;