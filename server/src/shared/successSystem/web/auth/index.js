/**
 * Store Auth Success Codes (SS001-SS099)
 * 점주 인증 관련 성공 코드
 */

export const STORE_AUTH_SUCCESS = {
  // 인증/계정 관련 (SS001-SS099)
  SS001: {
    key: 'STORE_REGISTRATION_SUCCESSFUL',
    vi: 'Đăng ký cửa hàng thành công',
    en: 'Store registration successful',
    ko: '매장 등록이 완료되었습니다'
  },
  SS002: {
    key: 'STORE_LOGIN_SUCCESSFUL',
    vi: 'Đăng nhập cửa hàng thành công',
    en: 'Store login successful',
    ko: '매장 로그인 성공'
  },
  SS003: {
    key: 'STORE_LOGOUT_SUCCESSFUL',
    vi: 'Đăng xuất cửa hàng thành công',
    en: 'Store logout successful',
    ko: '매장 로그아웃되었습니다'
  },
  SS004: {
    key: 'STORE_PASSWORD_CHANGED',
    vi: 'Mật khẩu cửa hàng đã được thay đổi',
    en: 'Store password changed successfully',
    ko: '매장 비밀번호가 변경되었습니다'
  },
  SS005: {
    key: 'STORE_EMAIL_VERIFIED',
    vi: 'Email cửa hàng đã được xác thực',
    en: 'Store email verified successfully',
    ko: '매장 이메일 인증 완료'
  },
  SS006: {
    key: 'STORE_TOKEN_REFRESHED',
    vi: 'Làm mới token cửa hàng thành công',
    en: 'Store token refreshed successfully',
    ko: '매장 토큰이 갱신되었습니다'
  },
  SS007: {
    key: 'TWO_FACTOR_ENABLED',
    vi: 'Bật xác thực hai yếu tố thành công',
    en: 'Two-factor authentication enabled successfully',
    ko: '2단계 인증이 활성화되었습니다'
  },
  SS008: {
    key: 'SECURITY_SETTINGS_UPDATED',
    vi: 'Cập nhật cài đặt bảo mật thành công',
    en: 'Security settings updated successfully',
    ko: '보안 설정이 업데이트되었습니다'
  },
  SS009: {
    key: 'SESSION_EXTENDED',
    vi: 'Gia hạn phiên làm việc thành công',
    en: 'Session extended successfully',
    ko: '세션이 연장되었습니다'
  },
  SS010: {
    key: 'PASSWORD_RESET_SUCCESSFUL',
    vi: 'Đặt lại mật khẩu thành công',
    en: 'Password reset successful',
    ko: '비밀번호 재설정이 완료되었습니다'
  },
  // 프로필 및 계정 관리 (SS011-SS030)
  SS011: {
    key: 'PROFILE_UPDATED',
    vi: 'Cập nhật hồ sơ thành công',
    en: 'Profile updated successfully',
    ko: '프로필이 업데이트되었습니다'
  },
  SS012: {
    key: 'AVATAR_UPLOADED',
    vi: 'Tải lên ảnh đại diện thành công',
    en: 'Avatar uploaded successfully',
    ko: '프로필 사진이 업로드되었습니다'
  },
  SS013: {
    key: 'ACCOUNT_DEACTIVATED',
    vi: 'Tài khoản đã được vô hiệu hóa',
    en: 'Account deactivated successfully',
    ko: '계정이 비활성화되었습니다'
  },
  SS014: {
    key: 'ACCOUNT_REACTIVATED',
    vi: 'Tài khoản đã được kích hoạt lại',
    en: 'Account reactivated successfully',
    ko: '계정이 재활성화되었습니다'
  },
  SS015: {
    key: 'PERMISSIONS_UPDATED',
    vi: 'Cập nhật quyền hạn thành công',
    en: 'Permissions updated successfully',
    ko: '권한이 업데이트되었습니다'
  },
  // 직원 관리 (SS041-SS060)
  SS041: {
    key: 'STAFF_CREATED',
    vi: 'Tạo tài khoản nhân viên thành công',
    en: 'Staff account created successfully',
    ko: '직원 계정이 생성되었습니다'
  },
  SS042: {
    key: 'STAFF_UPDATED',
    vi: 'Cập nhật thông tin nhân viên thành công',
    en: 'Staff information updated successfully',
    ko: '직원 정보가 업데이트되었습니다'
  },
  SS043: {
    key: 'STAFF_DEACTIVATED',
    vi: 'Vô hiệu hóa tài khoản nhân viên thành công',
    en: 'Staff account deactivated successfully',
    ko: '직원 계정이 비활성화되었습니다'
  },
  SS044: {
    key: 'STAFF_ACTIVATED',
    vi: 'Kích hoạt tài khoản nhân viên thành công',
    en: 'Staff account activated successfully',
    ko: '직원 계정이 활성화되었습니다'
  },
  SS045: {
    key: 'STAFF_PASSWORD_RESET',
    vi: 'Đặt lại mật khẩu nhân viên thành công',
    en: 'Staff password reset successfully',
    ko: '직원 비밀번호가 재설정되었습니다'
  },
  SS046: {
    key: 'STAFF_ROLE_CHANGED',
    vi: 'Thay đổi vai trò nhân viên thành công',
    en: 'Staff role changed successfully',
    ko: '직원 역할이 변경되었습니다'
  },
  SS047: {
    key: 'STAFF_DELETED',
    vi: 'Xóa tài khoản nhân viên thành công',
    en: 'Staff account deleted successfully',
    ko: '직원 계정이 삭제되었습니다'
  },
  // 조회 및 검증 (SS081-SS099)
  SS081: {
    key: 'EMAIL_CHECK_COMPLETED',
    vi: 'Kiểm tra email hoàn tất',
    en: 'Email check completed',
    ko: '이메일 확인 완료'
  },
  SS082: {
    key: 'STAFF_LIST_LOADED',
    vi: 'Tải danh sách nhân viên thành công',
    en: 'Staff list loaded successfully',
    ko: '직원 목록을 불러왔습니다'
  },
  SS083: {
    key: 'PROFILE_LOADED',
    vi: 'Tải hồ sơ thành công',
    en: 'Profile loaded successfully',
    ko: '프로필을 불러왔습니다'
  },
  SS084: {
    key: 'PHONE_CHECK_COMPLETED',
    vi: 'Kiểm tra số điện thoại hoàn tất',
    en: 'Phone number check completed',
    ko: '전화번호 확인 완료'
  },
  SS085: {
    key: 'PERMISSIONS_LOADED',
    vi: 'Tải quyền hạn thành công',
    en: 'Permissions loaded successfully',
    ko: '권한 정보를 불러왔습니다'
  },

  // 고급 인증 및 보안 기능 (SS100-SS199)
  SS111: {
    key: 'ACCOUNT_SETTINGS_UPDATED',
    vi: 'Cập nhật cài đặt tài khoản thành công',
    en: 'Account settings updated successfully',
    ko: '계정 설정이 성공적으로 업데이트되었습니다'
  },
  SS120: {
    key: 'LOGIN_HISTORY_LOADED',
    vi: 'Tải lịch sử đăng nhập thành công',
    en: 'Login history loaded successfully',
    ko: '로그인 기록을 성공적으로 불러왔습니다'
  },
  SS140: {
    key: 'SECURITY_AUDIT_COMPLETED',
    vi: 'Hoàn thành kiểm tra bảo mật',
    en: 'Security audit completed successfully',
    ko: '보안 감사가 성공적으로 완료되었습니다'
  },
  SS150: {
    key: 'PASSWORD_POLICY_UPDATED',
    vi: 'Cập nhật chính sách mật khẩu thành công',
    en: 'Password policy updated successfully',
    ko: '비밀번호 정책이 성공적으로 업데이트되었습니다'
  },
  SS180: {
    key: 'API_KEY_GENERATED',
    vi: 'Tạo API key thành công',
    en: 'API key generated successfully',
    ko: 'API 키가 성공적으로 생성되었습니다'
  }
};

export default STORE_AUTH_SUCCESS;
