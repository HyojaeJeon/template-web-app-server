/**
 * Mobile Auth Errors (M2xxx)
 * 인증/인가 에러
 */

export const MOBILE_AUTH_ERRORS = {
  M2001: {
    key: 'UNAUTHENTICATED',
    vi: 'Bạn cần đăng nhập để thực hiện hành động này',
    ko: '로그인이 필요합니다',
    en: 'Authentication required'
  },
  M2002: {
    key: 'UNAUTHORIZED',
    vi: 'Bạn không có quyền thực hiện hành động này',
    ko: '권한이 없습니다',
    en: 'Unauthorized access'
  },
  M2003: {
    key: 'ACCESS_TOKEN_EXPIRED',
    vi: 'Phiên đăng nhập đã hết hạn, đang làm mới...',
    ko: '세션이 만료되었습니다. 갱신 중...',
    en: 'Session expired, refreshing...'
  },
  M2004: {
    key: 'INVALID_CREDENTIALS',
    vi: 'Thông tin đăng nhập không chính xác',
    ko: '로그인 정보가 올바르지 않습니다',
    en: 'Invalid credentials'
  },
  M2005: {
    key: 'CUSTOMER_NOT_FOUND',
    vi: 'Không tìm thấy khách hàng',
    ko: '고객을 찾을 수 없습니다',
    en: 'Customer not found'
  },
  M2006: {
    key: 'PHONE_ALREADY_EXISTS',
    vi: 'Số điện thoại đã được đăng ký',
    ko: '이미 등록된 전화번호입니다',
    en: 'Phone number already registered'
  },
  M2007: {
    key: 'EMAIL_ALREADY_EXISTS',
    vi: 'Email đã được sử dụng',
    ko: '이미 사용 중인 이메일입니다',
    en: 'Email already in use'
  },
  M2008: {
    key: 'ACCOUNT_SUSPENDED',
    vi: 'Tài khoản đã bị tạm ngưng',
    ko: '계정이 일시 정지되었습니다',
    en: 'Account suspended'
  },
  M2009: {
    key: 'ACCOUNT_DELETED',
    vi: 'Tài khoản đã bị xóa',
    ko: '삭제된 계정입니다',
    en: 'Account deleted'
  },
  M2010: {
    key: 'INVALID_OTP',
    vi: 'Mã OTP không chính xác',
    ko: 'OTP 코드가 올바르지 않습니다',
    en: 'Invalid OTP code'
  },
  M2011: {
    key: 'REFRESH_TOKEN_EXPIRED',
    vi: 'Phiên đăng nhập đã hết hạn hoàn toàn. Vui lòng đăng nhập lại',
    ko: '인증이 완전히 만료되었습니다. 다시 로그인해주세요',
    en: 'Authentication fully expired. Please login again'
  },
  M2013: {
    key: 'OTP_EXPIRED',
    vi: 'Mã OTP đã hết hạn',
    ko: 'OTP 코드가 만료되었습니다',
    en: 'OTP code expired'
  },
  M2014: {
    key: 'INVALID_TOKEN',
    vi: 'Token không hợp lệ',
    ko: '유효하지 않은 토큰입니다',
    en: 'Invalid token'
  },
  M2015: {
    key: 'NO_TOKEN',
    vi: 'Không tìm thấy token',
    ko: '토큰이 없습니다',
    en: 'No token provided'
  },
  M2016: {
    key: 'PERMISSION_DENIED',
    vi: 'Không có quyền truy cập',
    ko: '접근 권한이 없습니다',
    en: 'Permission denied'
  },
  M2012: {
    key: 'PHONE_NOT_VERIFIED',
    vi: 'Số điện thoại chưa được xác thực',
    ko: '전화번호 인증이 필요합니다',
    en: 'Phone verification required'
  }
};