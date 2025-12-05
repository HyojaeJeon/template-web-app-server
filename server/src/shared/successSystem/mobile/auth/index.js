/**
 * Mobile Auth Success Codes (MS001-MS099)
 * 인증/계정 관련 성공 메시지
 */

export const MOBILE_AUTH_SUCCESS = {
  MS001: {
    key: 'REGISTRATION_SUCCESSFUL',
    vi: 'Đăng ký thành công',
    en: 'Registration successful',
    ko: '회원가입이 완료되었습니다'
  },
  MS002: {
    key: 'LOGIN_SUCCESSFUL',
    vi: 'Đăng nhập thành công',
    en: 'Login successful',
    ko: '로그인 성공'
  },
  MS003: {
    key: 'LOGOUT_SUCCESSFUL',
    vi: 'Đăng xuất thành công',
    en: 'Logout successful',
    ko: '로그아웃되었습니다'
  },
  MS004: {
    key: 'PASSWORD_CHANGED',
    vi: 'Mật khẩu đã được thay đổi',
    en: 'Password changed successfully',
    ko: '비밀번호가 변경되었습니다'
  },
  MS005: {
    key: 'OTP_SENT',
    vi: 'Mã OTP đã được gửi',
    en: 'OTP code sent successfully',
    ko: 'OTP 코드가 전송되었습니다'
  },
  MS006: {
    key: 'OTP_VERIFIED',
    vi: 'Xác thực OTP thành công',
    en: 'OTP verified successfully',
    ko: 'OTP 인증 완료'
  },
  MS007: {
    key: 'PHONE_VERIFIED',
    vi: 'Xác thực số điện thoại thành công',
    en: 'Phone number verified successfully',
    ko: '전화번호 인증 완료'
  },
  MS008: {
    key: 'TOKEN_REFRESHED',
    vi: 'Làm mới token thành công',
    en: 'Token refreshed successfully',
    ko: '토큰이 갱신되었습니다'
  },
  MS009: {
    key: 'ACCOUNT_DELETED',
    vi: 'Tài khoản đã được xóa',
    en: 'Account deleted successfully',
    ko: '계정이 삭제되었습니다'
  },

  // 고급 인증 기능 성공 (MS100-MS116)
  MS100: {
    key: 'PROFILE_UPDATED',
    vi: 'Cập nhật hồ sơ thành công',
    en: 'Profile updated successfully',
    ko: '프로필이 업데이트되었습니다'
  },
  MS101: {
    key: 'AVATAR_UPLOADED',
    vi: 'Tải lên ảnh đại diện thành công',
    en: 'Avatar uploaded successfully',
    ko: '프로필 사진이 업로드되었습니다'
  },
  MS102: {
    key: 'EMAIL_VERIFIED',
    vi: 'Xác thực email thành công',
    en: 'Email verified successfully',
    ko: '이메일 인증이 완료되었습니다'
  },
  MS103: {
    key: 'PASSWORD_RESET_SENT',
    vi: 'Liên kết đặt lại mật khẩu đã được gửi',
    en: 'Password reset link sent successfully',
    ko: '비밀번호 재설정 링크가 전송되었습니다'
  },
  MS110: {
    key: 'TWO_FACTOR_ENABLED',
    vi: 'Bật xác thực hai yếu tố thành công',
    en: 'Two-factor authentication enabled successfully',
    ko: '2단계 인증이 활성화되었습니다'
  },
  MS114: {
    key: 'ACCOUNT_VERIFIED',
    vi: 'Xác thực tài khoản thành công',
    en: 'Account verified successfully',
    ko: '계정 인증이 완료되었습니다'
  },
  MS115: {
    key: 'SECURITY_SETTINGS_UPDATED',
    vi: 'Cập nhật cài đặt bảo mật thành công',
    en: 'Security settings updated successfully',
    ko: '보안 설정이 업데이트되었습니다'
  },
  MS116: {
    key: 'SESSION_EXTENDED',
    vi: 'Gia hạn phiên làm việc thành công',
    en: 'Session extended successfully',
    ko: '세션이 연장되었습니다'
  }
};