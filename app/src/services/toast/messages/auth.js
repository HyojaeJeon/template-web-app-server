// 인증 관련 Toast 메시지
export const AUTH_MESSAGES = {
  AUTH_LOGIN_SUCCESS: {
    type: 'success',
    ko: '로그인되었습니다',
    vi: 'Đăng nhập thành công',
    en: 'Logged in successfully'
  },
  AUTH_LOGIN_FAILED: {
    type: 'error',
    ko: '로그인에 실패했습니다',
    vi: 'Đăng nhập thất bại',
    en: 'Login failed'
  },
  AUTH_LOGOUT_SUCCESS: {
    type: 'success',
    ko: '로그아웃되었습니다',
    vi: 'Đã đăng xuất',
    en: 'Logged out successfully'
  },
  AUTH_REGISTER_SUCCESS: {
    type: 'success',
    ko: '회원가입이 완료되었습니다',
    vi: 'Đăng ký thành công',
    en: 'Registration completed'
  },
  AUTH_REGISTER_FAILED: {
    type: 'error',
    ko: '회원가입에 실패했습니다',
    vi: 'Đăng ký thất bại',
    en: 'Registration failed'
  },
  AUTH_PASSWORD_CHANGED: {
    type: 'success',
    ko: '비밀번호가 변경되었습니다',
    vi: 'Đã thay đổi mật khẩu',
    en: 'Password changed successfully'
  },
  AUTH_UNAUTHORIZED: {
    type: 'error',
    ko: '권한이 없습니다',
    vi: 'Không có quyền truy cập',
    en: 'Unauthorized access'
  },
  AUTH_LOGOUT_PROCESSING: {
    type: 'info',
    ko: '로그아웃 중입니다...',
    vi: 'Đang đăng xuất...',
    en: 'Logging out...'
  },
  AUTH_LOGOUT_ERROR: {
    type: 'error',
    ko: '로그아웃 중 오류가 발생했습니다',
    vi: 'Lỗi khi đăng xuất',
    en: 'Logout error occurred'
  },
  AUTH_TEST_LOGIN_PROCESSING: {
    type: 'info',
    ko: '테스트 로그인 중입니다...',
    vi: 'Đang đăng nhập thử nghiệm...',
    en: 'Test login processing...'
  },
  AUTH_PHONE_LOGIN_SUCCESS: {
    type: 'success',
    ko: '전화번호로 로그인되었습니다',
    vi: 'Đăng nhập bằng số điện thoại thành công',
    en: 'Phone login successful'
  },
  AUTH_SESSION_EXPIRED: {
    type: 'error',
    ko: '세션이 만료되었습니다. 다시 로그인해주세요',
    vi: 'Phiên đã hết hạn. Vui lòng đăng nhập lại',
    en: 'Session expired. Please login again'
  },
  AUTH_TOKEN_REFRESH_FAILED: {
    type: 'error',
    ko: '인증 토큰 갱신에 실패했습니다',
    vi: 'Làm mới token xác thực thất bại',
    en: 'Token refresh failed'
  },
  AUTH_SOCIAL_LOGIN_SUCCESS: {
    type: 'success',
    ko: '소셜 로그인에 성공했습니다',
    vi: 'Đăng nhập mạng xã hội thành công',
    en: 'Social login successful'
  },
  AUTH_PHONE_REQUIRED: {
    type: 'error',
    ko: '전화번호가 필요합니다',
    vi: 'Cần số điện thoại',
    en: 'Phone number required'
  },
  AUTH_LOGIN_COMPLETED: {
    type: 'success',
    ko: '로그인이 완료되었습니다',
    vi: 'Hoàn tất đăng nhập',
    en: 'Login completed'
  },
  AUTH_LOGIN_ERROR: {
    type: 'error',
    ko: '로그인 중 오류가 발생했습니다',
    vi: 'Lỗi khi đăng nhập',
    en: 'Login error occurred'
  },
  AUTH_FORGOT_PASSWORD_COMING_SOON: {
    type: 'info',
    ko: '비밀번호 찾기 기능은 곧 제공될 예정입니다',
    vi: 'Tính năng quên mật khẩu sẽ sớm ra mắt',
    en: 'Forgot password feature coming soon'
  },
  AUTH_PASSWORD_RESET_FAILED: {
    type: 'error',
    ko: '비밀번호 재설정에 실패했습니다',
    vi: 'Đặt lại mật khẩu thất bại',
    en: 'Password reset failed'
  },
  AUTH_SOCIAL_LOGIN_NOT_IMPLEMENTED: {
    type: 'info',
    ko: '소셜 로그인 기능은 아직 구현되지 않았습니다',
    vi: 'Tính năng đăng nhập mạng xã hội chưa được triển khai',
    en: 'Social login not implemented yet'
  },
  AUTH_CUSTOMER_NOT_FOUND_REDIRECT: {
    type: 'error',
    ko: '사용자를 찾을 수 없습니다. 회원가입 페이지로 이동합니다',
    vi: 'Không tìm thấy người dùng. Chuyển đến trang đăng ký',
    en: 'User not found. Redirecting to signup'
  },
  AUTH_LOGIN_REQUIRED: {
    type: 'warning',
    ko: '로그인이 필요합니다',
    vi: 'Yêu cầu đăng nhập',
    en: 'Login required'
  },
  // Alias mappings (사용 코드와 정의 코드 매핑)
  LOGIN_SUCCESS: {
    type: 'success',
    ko: '로그인되었습니다',
    vi: 'Đăng nhập thành công',
    en: 'Logged in successfully'
  },
  REGISTER_SUCCESS: {
    type: 'success',
    ko: '회원가입이 완료되었습니다',
    vi: 'Đăng ký thành công',
    en: 'Registration completed'
  },
  LOGOUT_SUCCESS: {
    type: 'success',
    ko: '로그아웃되었습니다',
    vi: 'Đã đăng xuất',
    en: 'Logged out successfully'
  },
  SOCIAL_LOGIN_SUCCESS: {
    type: 'success',
    ko: '소셜 로그인에 성공했습니다',
    vi: 'Đăng nhập mạng xã hội thành công',
    en: 'Social login successful'
  },
  // OTP 관련
  OTP_SENT_SUCCESS: {
    type: 'success',
    ko: '인증번호가 전송되었습니다',
    vi: 'Mã OTP đã được gửi',
    en: 'OTP sent successfully'
  },
  OTP_VERIFY_SUCCESS: {
    type: 'success',
    ko: '인증이 완료되었습니다',
    vi: 'Xác minh thành công',
    en: 'Verification successful'
  },
  // 비밀번호 관련
  PASSWORD_CHANGE_SUCCESS: {
    type: 'success',
    ko: '비밀번호가 변경되었습니다',
    vi: 'Đã thay đổi mật khẩu',
    en: 'Password changed successfully'
  },
  PASSWORD_RESET_REQUEST_SUCCESS: {
    type: 'success',
    ko: '비밀번호 재설정 링크가 전송되었습니다',
    vi: 'Liên kết đặt lại mật khẩu đã được gửi',
    en: 'Password reset link sent'
  },
  PASSWORD_RESET_SUCCESS: {
    type: 'success',
    ko: '비밀번호가 재설정되었습니다',
    vi: 'Mật khẩu đã được đặt lại',
    en: 'Password reset successfully'
  },
  // 계정 관련
  ACCOUNT_DEACTIVATE_SUCCESS: {
    type: 'success',
    ko: '계정이 비활성화되었습니다',
    vi: 'Tài khoản đã bị vô hiệu hóa',
    en: 'Account deactivated'
  },
  ACCOUNT_DELETE_SUCCESS: {
    type: 'success',
    ko: '계정이 삭제되었습니다',
    vi: 'Tài khoản đã bị xóa',
    en: 'Account deleted'
  },
  ACCOUNT_SUSPENSION_SUCCESS: {
    type: 'success',
    ko: '계정이 일시 정지되었습니다',
    vi: 'Tài khoản đã bị tạm ngưng',
    en: 'Account suspended'
  },
};
