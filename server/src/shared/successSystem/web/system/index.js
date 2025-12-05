/**
 * Store System Success Codes (SS400-SS499, SS900-SS999)
 * 점주 시스템 관련 성공 코드 (직원 관리 + 설정)
 */

export const STORE_SYSTEM_SUCCESS = {
  // 고급 계정 관리 (SS100-SS199)
  SS100: {
    key: 'STORE_PROFILE_UPDATED',
    vi: 'Cập nhật hồ sơ cửa hàng thành công',
    en: 'Store profile updated successfully',
    ko: '매장 프로필이 업데이트되었습니다'
  },
  SS101: {
    key: 'STORE_LOGO_UPLOADED',
    vi: 'Tải lên logo cửa hàng thành công',
    en: 'Store logo uploaded successfully',
    ko: '매장 로고가 업로드되었습니다'
  },
  SS110: {
    key: 'STORE_HOURS_UPDATED',
    vi: 'Cập nhật giờ hoạt động thành công',
    en: 'Store hours updated successfully',
    ko: '영업시간이 업데이트되었습니다'
  },
  SS111: {
    key: 'STORE_LOCATION_UPDATED',
    vi: 'Cập nhật vị trí cửa hàng thành công',
    en: 'Store location updated successfully',
    ko: '매장 위치가 업데이트되었습니다'
  },
  SS120: {
    key: 'STORE_VERIFICATION_SUBMITTED',
    vi: 'Gửi yêu cầu xác minh cửa hàng thành công',
    en: 'Store verification submitted successfully',
    ko: '매장 인증이 요청되었습니다'
  },
  SS130: {
    key: 'STORE_SUBSCRIPTION_ACTIVATED',
    vi: 'Kích hoạt gói đăng ký thành công',
    en: 'Store subscription activated successfully',
    ko: '매장 구독이 활성화되었습니다'
  },
  SS131: {
    key: 'STORE_PLAN_UPGRADED',
    vi: 'Nâng cấp gói dịch vụ thành công',
    en: 'Store plan upgraded successfully',
    ko: '매장 플랜이 업그레이드되었습니다'
  },
  SS140: {
    key: 'STORE_SECURITY_AUDIT_COMPLETED',
    vi: 'Hoàn thành kiểm tra bảo mật cửa hàng',
    en: 'Store security audit completed successfully',
    ko: '매장 보안 감사가 완료되었습니다'
  },
  SS150: {
    key: 'STORE_DATA_EXPORTED',
    vi: 'Xuất dữ liệu cửa hàng thành công',
    en: 'Store data exported successfully',
    ko: '매장 데이터 내보내기가 완료되었습니다'
  },
  SS161: {
    key: 'STORE_PERFORMANCE_OPTIMIZED',
    vi: 'Tối ưu hóa hiệu suất cửa hàng thành công',
    en: 'Store performance optimized successfully',
    ko: '매장 성능이 최적화되었습니다'
  },
  SS180: {
    key: 'STORE_API_KEY_GENERATED',
    vi: 'Tạo API key cửa hàng thành công',
    en: 'Store API key generated successfully',
    ko: '매장 API 키가 생성되었습니다'
  },
  SS181: {
    key: 'STORE_WEBHOOK_CONFIGURED',
    vi: 'Cấu hình webhook cửa hàng thành công',
    en: 'Store webhook configured successfully',
    ko: '매장 웹훅이 설정되었습니다'
  },
  SS182: {
    key: 'STORE_INTEGRATION_ENABLED',
    vi: 'Bật tích hợp cửa hàng thành công',
    en: 'Store integration enabled successfully',
    ko: '매장 통합이 활성화되었습니다'
  },
  SS183: {
    key: 'STORE_COMPLIANCE_VERIFIED',
    vi: 'Xác minh tuân thủ cửa hàng thành công',
    en: 'Store compliance verified successfully',
    ko: '매장 컴플라이언스가 확인되었습니다'
  },
  SS184: {
    key: 'STORE_CERTIFICATION_UPDATED',
    vi: 'Cập nhật chứng chỉ cửa hàng thành công',
    en: 'Store certification updated successfully',
    ko: '매장 인증서가 업데이트되었습니다'
  },
  SS185: {
    key: 'STORE_GDPR_SETTINGS_CONFIGURED',
    vi: 'Cấu hình cài đặt GDPR thành công',
    en: 'GDPR settings configured successfully',
    ko: 'GDPR 설정이 구성되었습니다'
  },

  // 번역 서비스 (SS301)
  SS301: {
    key: 'TRANSLATION_COMPLETED',
    vi: 'Dịch thành công',
    en: 'Translation completed successfully',
    ko: '번역이 완료되었습니다'
  },

  // 직원 관리 (SS400-SS499)
  SS400: {
    key: 'STAFF_ADDED',
    vi: 'Thêm nhân viên thành công',
    en: 'Staff member added successfully',
    ko: '직원이 추가되었습니다'
  },
  SS401: {
    key: 'STAFF_UPDATED',
    vi: 'Cập nhật thông tin nhân viên thành công',
    en: 'Staff information updated successfully',
    ko: '직원 정보가 업데이트되었습니다'
  },
  SS402: {
    key: 'STAFF_REMOVED',
    vi: 'Xóa nhân viên thành công',
    en: 'Staff member removed successfully',
    ko: '직원이 삭제되었습니다'
  },
  SS403: {
    key: 'STAFF_ROLE_CHANGED',
    vi: 'Thay đổi vai trò nhân viên thành công',
    en: 'Staff role changed successfully',
    ko: '직원 역할이 변경되었습니다'
  },
  SS404: {
    key: 'STAFF_ACTIVATED',
    vi: 'Kích hoạt nhân viên thành công',
    en: 'Staff member activated successfully',
    ko: '직원이 활성화되었습니다'
  },
  SS405: {
    key: 'STAFF_DEACTIVATED',
    vi: 'Vô hiệu hóa nhân viên thành công',
    en: 'Staff member deactivated successfully',
    ko: '직원이 비활성화되었습니다'
  },
  SS406: {
    key: 'STAFF_PERMISSIONS_UPDATED',
    vi: 'Cập nhật quyền nhân viên thành công',
    en: 'Staff permissions updated successfully',
    ko: '직원 권한이 업데이트되었습니다'
  },

  // 기타 작업/설정 (SS900-SS999)
  SS900: {
    key: 'SETTINGS_SAVED',
    vi: 'Lưu cài đặt thành công',
    en: 'Settings saved successfully',
    ko: '설정이 저장되었습니다'
  },
  SS901: {
    key: 'NOTIFICATION_SETTINGS_UPDATED',
    vi: 'Cập nhật cài đặt thông báo thành công',
    en: 'Notification settings updated successfully',
    ko: '알림 설정이 업데이트되었습니다'
  },
  SS902: {
    key: 'BACKUP_CREATED',
    vi: 'Tạo bản sao lưu thành công',
    en: 'Backup created successfully',
    ko: '백업이 생성되었습니다'
  },
  SS903: {
    key: 'DATA_RESTORED',
    vi: 'Khôi phục dữ liệu thành công',
    en: 'Data restored successfully',
    ko: '데이터가 복원되었습니다'
  },
  SS904: {
    key: 'SUBSCRIPTION_RENEWED',
    vi: 'Gia hạn đăng ký thành công',
    en: 'Subscription renewed successfully',
    ko: '구독이 갱신되었습니다'
  },
  SS905: {
    key: 'BILLING_INFO_UPDATED',
    vi: 'Cập nhật thông tin thanh toán thành công',
    en: 'Billing information updated successfully',
    ko: '결제 정보가 업데이트되었습니다'
  },
  SS906: {
    key: 'TAX_INFO_UPDATED',
    vi: 'Cập nhật thông tin thuế thành công',
    en: 'Tax information updated successfully',
    ko: '세금 정보가 업데이트되었습니다'
  },
  SS907: {
    key: 'BANK_ACCOUNT_LINKED',
    vi: 'Liên kết tài khoản ngân hàng thành công',
    en: 'Bank account linked successfully',
    ko: '은행 계좌가 연결되었습니다'
  },
  SS908: {
    key: 'INTEGRATION_CONFIGURED',
    vi: 'Cấu hình tích hợp thành công',
    en: 'Integration configured successfully',
    ko: '연동 설정이 완료되었습니다'
  },
  SS909: {
    key: 'SYSTEM_MAINTENANCE_COMPLETED',
    vi: 'Hoàn thành bảo trì hệ thống',
    en: 'System maintenance completed successfully',
    ko: '시스템 유지보수가 완료되었습니다'
  },
  SS910: {
    key: 'API_KEY_REGENERATED',
    vi: 'Tạo lại API key thành công',
    en: 'API key regenerated successfully',
    ko: 'API 키가 재생성되었습니다'
  }
};

export default STORE_SYSTEM_SUCCESS;
