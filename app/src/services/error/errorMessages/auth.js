/**
 * 인증/인가 관련 에러 코드 및 메시지
 * 코드 범위: C3xxx (Client Auth Errors)
 */

export const AUTH_ERRORS = {
  // 로그인 에러
  C3001: {
    code: 'AUTH_LOGIN_FAILED',
    message: {
      vi: 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin.',
      ko: '로그인에 실패했습니다. 정보를 확인해주세요.',
      en: 'Login failed. Please check your credentials.'
    },
    severity: 'error',
    retryable: false
  },
  C3002: {
    code: 'AUTH_INVALID_CREDENTIALS',
    message: {
      vi: 'Thông tin đăng nhập không chính xác.',
      ko: '로그인 정보가 올바르지 않습니다.',
      en: 'Invalid login credentials.'
    },
    severity: 'error',
    retryable: false
  },
  C3003: {
    code: 'AUTH_ACCOUNT_LOCKED',
    message: {
      vi: 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.',
      ko: '계정이 잠겼습니다. 고객센터에 문의해주세요.',
      en: 'Account is locked. Please contact support.'
    },
    severity: 'error',
    retryable: false
  },
  C3004: {
    code: 'AUTH_ACCOUNT_NOT_FOUND',
    message: {
      vi: 'Tài khoản không tồn tại.',
      ko: '계정을 찾을 수 없습니다.',
      en: 'Account not found.'
    },
    severity: 'error',
    retryable: false
  },

  // 토큰 관련
  C3101: {
    code: 'AUTH_TOKEN_EXPIRED',
    message: {
      vi: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      ko: '세션이 만료되었습니다. 다시 로그인해주세요.',
      en: 'Session expired. Please login again.'
    },
    severity: 'warning',
    retryable: false,
    requiresAuth: true
  },
  C3102: {
    code: 'AUTH_TOKEN_INVALID',
    message: {
      vi: 'Phiên đăng nhập không hợp lệ.',
      ko: '유효하지 않은 세션입니다.',
      en: 'Invalid session.'
    },
    severity: 'error',
    retryable: false,
    requiresAuth: true
  },
  C3103: {
    code: 'AUTH_TOKEN_REFRESH_FAILED',
    message: {
      vi: 'Không thể làm mới phiên đăng nhập.',
      ko: '세션 갱신에 실패했습니다.',
      en: 'Failed to refresh session.'
    },
    severity: 'error',
    retryable: true,
    requiresAuth: true
  },

  // 권한 관련
  C3201: {
    code: 'AUTH_PERMISSION_DENIED',
    message: {
      vi: 'Bạn không có quyền thực hiện thao tác này.',
      ko: '이 작업을 수행할 권한이 없습니다.',
      en: 'You do not have permission to perform this action.'
    },
    severity: 'error',
    retryable: false
  },
  C3202: {
    code: 'AUTH_LOGIN_REQUIRED',
    message: {
      vi: 'Vui lòng đăng nhập để tiếp tục.',
      ko: '계속하려면 로그인이 필요합니다.',
      en: 'Please login to continue.'
    },
    severity: 'info',
    retryable: false,
    requiresAuth: true
  },
  C3203: {
    code: 'AUTH_ACCESS_RESTRICTED',
    message: {
      vi: 'Truy cập bị hạn chế.',
      ko: '접근이 제한되었습니다.',
      en: 'Access restricted.'
    },
    severity: 'error',
    retryable: false
  },

  // 회원가입 관련
  C3301: {
    code: 'AUTH_SIGNUP_FAILED',
    message: {
      vi: 'Đăng ký thất bại. Vui lòng thử lại.',
      ko: '회원가입에 실패했습니다. 다시 시도해주세요.',
      en: 'Signup failed. Please try again.'
    },
    severity: 'error',
    retryable: true
  },
  C3302: {
    code: 'AUTH_USER_EXISTS',
    message: {
      vi: 'Tài khoản đã tồn tại.',
      ko: '이미 존재하는 계정입니다.',
      en: 'Account already exists.'
    },
    severity: 'warning',
    retryable: false
  },
  C3303: {
    code: 'AUTH_PHONE_EXISTS',
    message: {
      vi: 'Số điện thoại đã được đăng ký.',
      ko: '이미 등록된 전화번호입니다.',
      en: 'Phone number already registered.'
    },
    severity: 'warning',
    retryable: false
  },
  C3304: {
    code: 'AUTH_EMAIL_EXISTS',
    message: {
      vi: 'Email đã được đăng ký.',
      ko: '이미 등록된 이메일입니다.',
      en: 'Email already registered.'
    },
    severity: 'warning',
    retryable: false
  },

  // 인증 관련
  C3401: {
    code: 'AUTH_VERIFICATION_REQUIRED',
    message: {
      vi: 'Cần xác thực tài khoản.',
      ko: '계정 인증이 필요합니다.',
      en: 'Account verification required.'
    },
    severity: 'warning',
    retryable: false
  },
  C3402: {
    code: 'AUTH_VERIFICATION_FAILED',
    message: {
      vi: 'Xác thực thất bại.',
      ko: '인증에 실패했습니다.',
      en: 'Verification failed.'
    },
    severity: 'error',
    retryable: true
  },
  C3403: {
    code: 'AUTH_PHONE_VERIFICATION_REQUIRED',
    message: {
      vi: 'Cần xác thực số điện thoại.',
      ko: '전화번호 인증이 필요합니다.',
      en: 'Phone verification required.'
    },
    severity: 'warning',
    retryable: false
  },

  // 비밀번호 관련
  C3501: {
    code: 'AUTH_PASSWORD_RESET_FAILED',
    message: {
      vi: 'Không thể đặt lại mật khẩu.',
      ko: '비밀번호 재설정에 실패했습니다.',
      en: 'Failed to reset password.'
    },
    severity: 'error',
    retryable: true
  },
  C3502: {
    code: 'AUTH_PASSWORD_RESET_TOKEN_INVALID',
    message: {
      vi: 'Liên kết đặt lại mật khẩu không hợp lệ.',
      ko: '비밀번호 재설정 링크가 유효하지 않습니다.',
      en: 'Invalid password reset link.'
    },
    severity: 'error',
    retryable: false
  },
  C3503: {
    code: 'AUTH_PASSWORD_RESET_TOKEN_EXPIRED',
    message: {
      vi: 'Liên kết đặt lại mật khẩu đã hết hạn.',
      ko: '비밀번호 재설정 링크가 만료되었습니다.',
      en: 'Password reset link has expired.'
    },
    severity: 'warning',
    retryable: false
  }
};

export default AUTH_ERRORS;