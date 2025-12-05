// 유효성 검사 관련 Toast 메시지
export const VALIDATION_MESSAGES = {
  VALIDATION_EMAIL_INVALID: {
    type: 'error',
    ko: '올바른 이메일 주소를 입력해주세요',
    vi: 'Vui lòng nhập email hợp lệ',
    en: 'Please enter a valid email address'
  },
  VALIDATION_PASSWORD_TOO_SHORT: {
    type: 'error',
    ko: '비밀번호는 8자 이상이어야 합니다',
    vi: 'Mật khẩu phải có ít nhất 8 ký tự',
    en: 'Password must be at least 8 characters'
  },
  VALIDATION_PHONE_INVALID: {
    type: 'error',
    ko: '올바른 전화번호를 입력해주세요',
    vi: 'Vui lòng nhập số điện thoại hợp lệ',
    en: 'Please enter a valid phone number'
  },
  VALIDATION_REQUIRED_FIELD: {
    type: 'error',
    ko: '필수 입력 항목입니다',
    vi: 'Trường này là bắt buộc',
    en: 'This field is required'
  },
  VALIDATION_NAME_REQUIRED: {
    type: 'error',
    ko: '이름을 올바르게 입력해주세요',
    vi: 'Vui lòng nhập tên đúng',
    en: 'Please enter your name correctly'
  },
  VALIDATION_PHONE_REQUIRED: {
    type: 'error',
    ko: '전화번호를 올바르게 입력해주세요',
    vi: 'Vui lòng nhập số điện thoại đúng',
    en: 'Please enter your phone number correctly'
  },
  VALIDATION_PASSWORD_MIN_LENGTH: {
    type: 'error',
    ko: '비밀번호를 6자 이상 입력해주세요',
    vi: 'Vui lòng nhập mật khẩu từ 6 ký tự trở lên',
    en: 'Please enter a password of 6 or more characters'
  },
  VALIDATION_PASSWORD_MISMATCH: {
    type: 'error',
    ko: '비밀번호가 일치하지 않습니다',
    vi: 'Mật khẩu không khớp',
    en: 'Passwords do not match'
  },
  // 계정 정지 관련
  VALIDATION_SUSPENSION_PERIOD_REQUIRED: {
    type: 'error',
    ko: '정지 기간을 선택해주세요',
    vi: 'Vui lòng chọn thời gian tạm ngưng',
    en: 'Please select suspension period'
  },
  VALIDATION_SUSPENSION_REASON_REQUIRED: {
    type: 'error',
    ko: '정지 사유를 선택해주세요',
    vi: 'Vui lòng chọn lý do tạm ngưng',
    en: 'Please select suspension reason'
  },
  VALIDATION_SUSPENSION_CUSTOM_REASON_REQUIRED: {
    type: 'error',
    ko: '직접 입력 사유를 입력해주세요',
    vi: 'Vui lòng nhập lý do tự điền',
    en: 'Please enter custom reason'
  },
  // 메시지 관련
  VALIDATION_MESSAGE_TOO_LONG: {
    type: 'warning',
    ko: '메시지가 너무 깁니다',
    vi: 'Tin nhắn quá dài',
    en: 'Message is too long'
  },
  // 주소 유효성 검사
  VALIDATION_ADDRESS_FAILED: {
    type: 'error',
    ko: '주소 검증에 실패했습니다',
    vi: 'Xác minh địa chỉ thất bại',
    en: 'Address validation failed'
  },
};