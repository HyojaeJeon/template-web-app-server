// 일반적인 Toast 메시지
export const COMMON_MESSAGES = {
  OPERATION_SUCCESS: {
    type: 'success',
    ko: '작업이 완료되었습니다',
    vi: 'Hoàn tất thao tác',
    en: 'Operation completed successfully'
  },
  OPERATION_FAILED: {
    type: 'error',
    ko: '작업에 실패했습니다',
    vi: 'Thao tác thất bại',
    en: 'Operation failed'
  },
  LOADING: {
    type: 'info',
    ko: '로딩 중...',
    vi: 'Đang tải...',
    en: 'Loading...'
  },
  TRY_AGAIN: {
    type: 'warning',
    ko: '다시 시도해주세요',
    vi: 'Vui lòng thử lại',
    en: 'Please try again'
  },
  LINK_NOT_SUPPORTED: {
    type: 'error',
    ko: '지원하지 않는 링크입니다',
    vi: 'Liên kết không được hỗ trợ',
    en: 'Link not supported'
  },
  LINK_OPEN_FAILED: {
    type: 'error',
    ko: '링크 열기에 실패했습니다',
    vi: 'Mở liên kết thất bại',
    en: 'Failed to open link'
  },
  COPY_SUCCESS: {
    type: 'success',
    ko: '복사되었습니다',
    vi: 'Đã sao chép',
    en: 'Copied successfully'
  },
  NO_CHANGES: {
    type: 'info',
    ko: '변경된 내용이 없습니다',
    vi: 'Không có thay đổi nào',
    en: 'No changes to save'
  },
  SAVE_SUCCESS: {
    type: 'success',
    ko: '저장되었습니다',
    vi: 'Đã lưu',
    en: 'Saved successfully'
  },
  SAVE_ERROR: {
    type: 'error',
    ko: '저장에 실패했습니다',
    vi: 'Lưu thất bại',
    en: 'Failed to save'
  },
  // 홈 화면 관련
  HOME_REFRESH_SUCCESS: {
    type: 'success',
    ko: '새로고침 완료',
    vi: 'Đã làm mới',
    en: 'Refreshed successfully'
  },
  // 기능 준비 중
  FEATURE_COMING_SOON: {
    type: 'info',
    ko: '곧 제공될 기능입니다',
    vi: 'Tính năng sắp ra mắt',
    en: 'Feature coming soon'
  },
  // 검색 관련
  SEARCH_FAILED: {
    type: 'error',
    ko: '검색에 실패했습니다',
    vi: 'Tìm kiếm thất bại',
    en: 'Search failed'
  },
  SEARCH_HISTORY_DELETED: {
    type: 'success',
    ko: '검색 기록이 삭제되었습니다',
    vi: 'Đã xóa lịch sử tìm kiếm',
    en: 'Search history deleted'
  },
  ALL_SEARCH_HISTORY_CLEARED: {
    type: 'success',
    ko: '모든 검색 기록이 삭제되었습니다',
    vi: 'Đã xóa tất cả lịch sử tìm kiếm',
    en: 'All search history cleared'
  },
  DELETE_FAILED: {
    type: 'error',
    ko: '삭제에 실패했습니다',
    vi: 'Xóa thất bại',
    en: 'Delete failed'
  },
  DATA_DELETED_SUCCESSFULLY: {
    type: 'success',
    ko: '데이터가 삭제되었습니다',
    vi: 'Đã xóa dữ liệu',
    en: 'Data deleted successfully'
  },
  // 이미지/미디어 관련
  IMAGE_INFO_DISPLAYED: {
    type: 'info',
    ko: '이미지 정보',
    vi: 'Thông tin hình ảnh',
    en: 'Image info'
  },
  MEDIA_UPLOADED_SUCCESS: {
    type: 'success',
    ko: '미디어가 업로드되었습니다',
    vi: 'Đã tải lên phương tiện',
    en: 'Media uploaded successfully'
  },
  MEDIA_UPLOAD_FAILED: {
    type: 'error',
    ko: '미디어 업로드에 실패했습니다',
    vi: 'Tải lên phương tiện thất bại',
    en: 'Media upload failed'
  },
  CAMERA_ERROR: {
    type: 'error',
    ko: '카메라를 사용할 수 없습니다',
    vi: 'Không thể sử dụng camera',
    en: 'Camera error'
  },
  GALLERY_ERROR: {
    type: 'error',
    ko: '갤러리를 열 수 없습니다',
    vi: 'Không thể mở thư viện',
    en: 'Gallery error'
  },
  // 위치 관련
  LOCATION_SHARED_SUCCESS: {
    type: 'success',
    ko: '위치가 공유되었습니다',
    vi: 'Đã chia sẻ vị trí',
    en: 'Location shared successfully'
  },
  LOCATION_SHARE_FAILED: {
    type: 'error',
    ko: '위치 공유에 실패했습니다',
    vi: 'Chia sẻ vị trí thất bại',
    en: 'Location share failed'
  },
  // 파일 관련
  FILE_SIZE_TOO_LARGE: {
    type: 'warning',
    ko: '파일 크기가 너무 큽니다',
    vi: 'Kích thước file quá lớn',
    en: 'File size is too large'
  },
  UNSUPPORTED_FILE_FORMAT: {
    type: 'error',
    ko: '지원하지 않는 파일 형식입니다',
    vi: 'Định dạng file không được hỗ trợ',
    en: 'Unsupported file format'
  },
  // 설정 관련
  SETTINGS_SAVED: {
    type: 'success',
    ko: '설정이 저장되었습니다',
    vi: 'Cài đặt đã được lưu',
    en: 'Settings saved'
  },
  SETTINGS_SAVE_FAILED: {
    type: 'error',
    ko: '설정 저장에 실패했습니다',
    vi: 'Lưu cài đặt thất bại',
    en: 'Failed to save settings'
  },
  // 알림 설정 관련
  NOTIFICATION_SETTINGS_SAVED: {
    type: 'success',
    ko: '알림 설정이 저장되었습니다',
    vi: 'Cài đặt thông báo đã được lưu',
    en: 'Notification settings saved'
  },
  NOTIFICATION_SETTINGS_LOAD_ERROR: {
    type: 'error',
    ko: '알림 설정을 불러오는데 실패했습니다',
    vi: 'Không thể tải cài đặt thông báo',
    en: 'Failed to load notification settings'
  },
  NOTIFICATION_SETTINGS_SAVE_SUCCESS: {
    type: 'success',
    ko: '알림 설정이 저장되었습니다',
    vi: 'Cài đặt thông báo đã được lưu',
    en: 'Notification settings saved'
  },
  NOTIFICATION_SETTINGS_SAVE_ERROR: {
    type: 'error',
    ko: '알림 설정 저장에 실패했습니다',
    vi: 'Lưu cài đặt thông báo thất bại',
    en: 'Failed to save notification settings'
  },
  NOTIFICATION_SETTINGS_UPDATE_SUCCESS: {
    type: 'success',
    ko: '알림 설정이 업데이트되었습니다',
    vi: 'Cài đặt thông báo đã được cập nhật',
    en: 'Notification settings updated'
  },
  PRIVACY_SETTINGS_SAVED: {
    type: 'success',
    ko: '개인정보 설정이 저장되었습니다',
    vi: 'Cài đặt quyền riêng tư đã được lưu',
    en: 'Privacy settings saved'
  },
  // 알림 권한 관련
  NOTIFICATION_PERMISSION_GRANTED: {
    type: 'success',
    ko: '알림 권한이 허용되었습니다',
    vi: 'Quyền thông báo đã được cấp',
    en: 'Notification permission granted'
  },
  NOTIFICATION_PERMISSION_ERROR: {
    type: 'error',
    ko: '알림 권한 설정에 실패했습니다',
    vi: 'Lỗi cài đặt quyền thông báo',
    en: 'Notification permission error'
  },
  // 언어 설정 관련
  LANGUAGE_UPDATE_SUCCESS: {
    type: 'success',
    ko: '언어가 변경되었습니다',
    vi: 'Ngôn ngữ đã được thay đổi',
    en: 'Language changed'
  },
  // 기능 상태 관련
  FEATURE_NOT_READY: {
    type: 'info',
    ko: '준비 중인 기능입니다',
    vi: 'Tính năng đang được chuẩn bị',
    en: 'Feature is being prepared'
  },
  // 프로모션 관련
  PROMOTION_SAVED: {
    type: 'success',
    ko: '프로모션이 저장되었습니다',
    vi: 'Đã lưu khuyến mãi',
    en: 'Promotion saved'
  },
  // 알림 실패 관련
  NOTIFICATION_MARK_READ_FAILED: {
    type: 'error',
    ko: '알림 읽음 처리에 실패했습니다',
    vi: 'Đánh dấu đã đọc thất bại',
    en: 'Failed to mark notification as read'
  },
  NOTIFICATION_MARK_ALL_READ_FAILED: {
    type: 'error',
    ko: '모든 알림 읽음 처리에 실패했습니다',
    vi: 'Đánh dấu tất cả đã đọc thất bại',
    en: 'Failed to mark all notifications as read'
  },
  NOTIFICATION_SETTINGS_UPDATE_FAILED: {
    type: 'error',
    ko: '알림 설정 업데이트에 실패했습니다',
    vi: 'Cập nhật cài đặt thông báo thất bại',
    en: 'Failed to update notification settings'
  },
  NOTIFICATION_DELETE_FAILED: {
    type: 'error',
    ko: '알림 삭제에 실패했습니다',
    vi: 'Xóa thông báo thất bại',
    en: 'Failed to delete notification'
  },
  NOTIFICATION_CLEAR_ALL_FAILED: {
    type: 'error',
    ko: '모든 알림 삭제에 실패했습니다',
    vi: 'Xóa tất cả thông báo thất bại',
    en: 'Failed to clear all notifications'
  },
  // 경고 관련
  UNSAVED_CHANGES_WARNING: {
    type: 'warning',
    ko: '저장하지 않은 변경 사항이 있습니다',
    vi: 'Có thay đổi chưa được lưu',
    en: 'You have unsaved changes'
  },
  // 카메라 관련
  CAMERA_CAPTURE_FAILED: {
    type: 'error',
    ko: '사진 촬영에 실패했습니다',
    vi: 'Chụp ảnh thất bại',
    en: 'Failed to capture photo'
  },
  // 홈 관련
  HOME_REFRESH_SUCCESS: {
    type: 'success',
    ko: '새로고침되었습니다',
    vi: 'Đã làm mới',
    en: 'Refreshed successfully'
  },
  // 지도 관련
  MAP_PICKER_NOT_IMPLEMENTED: {
    type: 'info',
    ko: '지도 선택 기능은 준비 중입니다',
    vi: 'Tính năng chọn bản đồ đang được chuẩn bị',
    en: 'Map picker feature coming soon'
  },
  NAVIGATION_NOT_AVAILABLE: {
    type: 'warning',
    ko: '내비게이션을 사용할 수 없습니다',
    vi: 'Không thể sử dụng điều hướng',
    en: 'Navigation not available'
  },
  // 서버/테마 설정 관련
  SERVER_CONFIG_CHANGED: {
    type: 'info',
    ko: '서버 설정이 변경되었습니다',
    vi: 'Cấu hình máy chủ đã thay đổi',
    en: 'Server configuration changed'
  },
  THEME_CHANGED: {
    type: 'success',
    ko: '테마가 변경되었습니다',
    vi: 'Chủ đề đã được thay đổi',
    en: 'Theme changed'
  },
};
