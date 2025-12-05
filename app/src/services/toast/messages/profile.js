// 프로필 관련 Toast 메시지
export const PROFILE_MESSAGES = {
  PROFILE_UPDATED: {
    type: 'success',
    ko: '프로필이 업데이트되었습니다',
    vi: 'Hồ sơ đã được cập nhật',
    en: 'Profile updated'
  },
  PROFILE_UPDATE_FAILED: {
    type: 'error',
    ko: '프로필 업데이트에 실패했습니다',
    vi: 'Cập nhật hồ sơ thất bại',
    en: 'Profile update failed'
  },
  PROFILE_AVATAR_UPLOAD_SUCCESS: {
    type: 'success',
    ko: '프로필 사진이 업로드되었습니다',
    vi: 'Tải ảnh đại diện thành công',
    en: 'Avatar uploaded successfully'
  },
  PROFILE_NOTIFICATIONS_UPDATE_SUCCESS: {
    type: 'success',
    ko: '알림 설정이 업데이트되었습니다',
    vi: 'Cài đặt thông báo đã được cập nhật',
    en: 'Notification settings updated'
  },
  PROFILE_FEEDBACK_SUBMIT_SUCCESS: {
    type: 'success',
    ko: '피드백이 전송되었습니다',
    vi: 'Phản hồi đã được gửi',
    en: 'Feedback submitted successfully'
  },
  PROFILE_AVATAR_UPDATE_SUCCESS: {
    type: 'success',
    ko: '프로필 사진이 업데이트되었습니다',
    vi: 'Ảnh đại diện đã được cập nhật',
    en: 'Profile picture updated successfully'
  },
  PROFILE_AVATAR_UPDATE_FAILED: {
    type: 'error',
    ko: '프로필 사진 업데이트에 실패했습니다',
    vi: 'Cập nhật ảnh đại diện thất bại',
    en: 'Failed to update profile picture'
  },
  PROFILE_AVATAR_DEFAULT_SELECTED: {
    type: 'success',
    ko: '기본 아바타가 선택되었습니다',
    vi: 'Đã chọn avatar mặc định',
    en: 'Default avatar selected'
  },
  PROFILE_EDIT_SAVE_SUCCESS: {
    type: 'success',
    ko: '프로필이 저장되었습니다',
    vi: 'Hồ sơ đã được lưu',
    en: 'Profile saved successfully'
  },
  PROFILE_EDIT_SAVE_ERROR: {
    type: 'error',
    ko: '프로필 저장에 실패했습니다',
    vi: 'Lưu hồ sơ thất bại',
    en: 'Failed to save profile'
  },
  PROFILE_EDIT_VALIDATION_ERROR: {
    type: 'error',
    ko: '입력 정보를 확인해주세요',
    vi: 'Vui lòng kiểm tra thông tin nhập',
    en: 'Please check the input information'
  },
  PROFILE_EDIT_UNSAVED_CHANGES: {
    type: 'warning',
    ko: '저장되지 않은 변경사항이 있습니다',
    vi: 'Có thay đổi chưa được lưu',
    en: 'There are unsaved changes'
  },
  PROFILE_AVATAR_SELECT_INFO: {
    type: 'info',
    ko: '아바타를 선택해주세요',
    vi: 'Vui lòng chọn avatar',
    en: 'Please select an avatar'
  },

  // 클라우드플레어 이미지 업로드 관련 메시지
  PROFILE_IMAGE_UPLOAD_SUCCESS: {
    type: 'success',
    ko: '이미지가 성공적으로 업로드되었습니다',
    vi: 'Tải ảnh lên thành công',
    en: 'Image uploaded successfully'
  },
  PROFILE_IMAGE_UPLOAD_FAILED: {
    type: 'error',
    ko: '이미지 업로드에 실패했습니다',
    vi: 'Tải ảnh lên thất bại',
    en: 'Image upload failed'
  },
  PROFILE_IMAGE_SELECT_FAILED: {
    type: 'error',
    ko: '이미지 선택에 실패했습니다',
    vi: 'Chọn ảnh thất bại',
    en: 'Failed to select image'
  },
  PROFILE_IMAGE_INVALID_TYPE: {
    type: 'error',
    ko: '지원하지 않는 이미지 형식입니다',
    vi: 'Định dạng ảnh không được hỗ trợ',
    en: 'Unsupported image format'
  },
  PROFILE_IMAGE_TOO_LARGE: {
    type: 'error',
    ko: '이미지 크기가 너무 큽니다 (최대 10MB)',
    vi: 'Kích thước ảnh quá lớn (tối đa 10MB)',
    en: 'Image size too large (max 10MB)'
  },
  PROFILE_IMAGE_DELETE_SUCCESS: {
    type: 'success',
    ko: '프로필 이미지가 삭제되었습니다',
    vi: 'Đã xóa ảnh hồ sơ',
    en: 'Profile image deleted'
  },
  PROFILE_IMAGE_DELETE_FAILED: {
    type: 'error',
    ko: '프로필 이미지 삭제에 실패했습니다',
    vi: 'Xóa ảnh hồ sơ thất bại',
    en: 'Failed to delete profile image'
  },
  PROFILE_SELECT_IMAGE_SOURCE: {
    type: 'info',
    ko: '이미지 소스를 선택하세요',
    vi: 'Chọn nguồn ảnh',
    en: 'Select image source'
  },
  PROFILE_UPDATE_SUCCESS: {
    type: 'success',
    ko: '프로필이 성공적으로 업데이트되었습니다',
    vi: 'Cập nhật hồ sơ thành công',
    en: 'Profile updated successfully'
  },
  PROFILE_UNSAVED_CHANGES_WARNING: {
    type: 'warning',
    ko: '저장되지 않은 변경사항이 있습니다',
    vi: 'Có thay đổi chưa được lưu',
    en: 'You have unsaved changes'
  },
  PROFILE_IMAGE_UPDATE_SUCCESS: {
    type: 'success',
    ko: '프로필 이미지가 업데이트되었습니다',
    vi: 'Cập nhật ảnh hồ sơ thành công',
    en: 'Profile image updated successfully'
  },
  PROFILE_IMAGE_UPDATE_FAILED: {
    type: 'error',
    ko: '프로필 이미지 업데이트에 실패했습니다',
    vi: 'Cập nhật ảnh hồ sơ thất bại',
    en: 'Failed to update profile image'
  },
  PROFILE_UPDATE_ERROR: {
    type: 'error',
    ko: '프로필 업데이트에 실패했습니다',
    vi: 'Cập nhật hồ sơ thất bại',
    en: 'Failed to update profile'
  },
  // 주소 관련
  PROFILE_ADDRESS_UPDATE_SUCCESS: {
    type: 'success',
    ko: '주소가 업데이트되었습니다',
    vi: 'Địa chỉ đã được cập nhật',
    en: 'Address updated'
  },
  PROFILE_ADDRESS_UPDATE_ERROR: {
    type: 'error',
    ko: '주소 업데이트에 실패했습니다',
    vi: 'Cập nhật địa chỉ thất bại',
    en: 'Failed to update address'
  },
  // 위치 권한 관련
  LOCATION_PERMISSION_GRANTED: {
    type: 'success',
    ko: '위치 권한이 허용되었습니다',
    vi: 'Quyền vị trí đã được cấp',
    en: 'Location permission granted'
  },
  LOCATION_PERMISSION_DENIED: {
    type: 'error',
    ko: '위치 권한이 거부되었습니다',
    vi: 'Quyền vị trí bị từ chối',
    en: 'Location permission denied'
  },
  LOCATION_PERMISSION_ERROR: {
    type: 'error',
    ko: '위치 권한 설정에 실패했습니다',
    vi: 'Lỗi cài đặt quyền vị trí',
    en: 'Location permission error'
  },
  // 프로필 새로고침 관련
  PROFILE_REFRESH_ERROR: {
    type: 'error',
    ko: '프로필 새로고침에 실패했습니다',
    vi: 'Làm mới hồ sơ thất bại',
    en: 'Failed to refresh profile'
  },
};