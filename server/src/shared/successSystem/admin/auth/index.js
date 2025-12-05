/**
 * Admin Auth Success Codes (AS100-AS199)
 * 슈퍼관리자 인증 성공 코드
 */

export const ADMIN_AUTH_SUCCESS = {
  // 인증 작업 (AS100-AS199)
  AS101: {
    key: 'LOGIN_SUCCESS',
    vi: 'Đăng nhập thành công',
    en: 'Login successful',
    ko: '로그인되었습니다'
  },
  AS102: {
    key: 'LOGOUT_SUCCESS',
    vi: 'Đăng xuất thành công',
    en: 'Logout successful',
    ko: '로그아웃되었습니다'
  },
  AS103: {
    key: 'TOKEN_REFRESHED',
    vi: 'Làm mới token thành công',
    en: 'Token refreshed successfully',
    ko: '토큰이 갱신되었습니다'
  },
  AS104: {
    key: 'PASSWORD_CHANGED',
    vi: 'Đổi mật khẩu thành công',
    en: 'Password changed successfully',
    ko: '비밀번호가 변경되었습니다'
  },
  AS105: {
    key: 'PROFILE_UPDATED',
    vi: 'Cập nhật hồ sơ thành công',
    en: 'Profile updated successfully',
    ko: '프로필이 업데이트되었습니다'
  },
};

export default ADMIN_AUTH_SUCCESS;
