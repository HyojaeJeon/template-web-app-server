/**
 * 유효성 검사 관련 에러 코드 및 메시지
 * 코드 범위: C2xxx (Client Validation Errors)
 */

export const VALIDATION_ERRORS = {
  // 이메일 검증
  C2001: {
    code: 'VALIDATION_EMAIL_INVALID',
    message: {
      vi: 'Email không hợp lệ. Vui lòng kiểm tra lại.',
      ko: '올바른 이메일 주소를 입력해주세요.',
      en: 'Please enter a valid email address.'
    },
    severity: 'warning',
    retryable: false
  },
  C2002: {
    code: 'VALIDATION_EMAIL_REQUIRED',
    message: {
      vi: 'Vui lòng nhập email.',
      ko: '이메일을 입력해주세요.',
      en: 'Email is required.'
    },
    severity: 'warning',
    retryable: false
  },

  // 비밀번호 검증
  C2101: {
    code: 'VALIDATION_PASSWORD_TOO_SHORT',
    message: {
      vi: 'Mật khẩu phải có ít nhất 6 ký tự.',
      ko: '비밀번호는 6자 이상이어야 합니다.',
      en: 'Password must be at least 6 characters.'
    },
    severity: 'warning',
    retryable: false
  },
  C2102: {
    code: 'VALIDATION_PASSWORD_REQUIRED',
    message: {
      vi: 'Vui lòng nhập mật khẩu.',
      ko: '비밀번호를 입력해주세요.',
      en: 'Password is required.'
    },
    severity: 'warning',
    retryable: false
  },
  C2103: {
    code: 'VALIDATION_PASSWORD_MISMATCH',
    message: {
      vi: 'Mật khẩu không khớp. Vui lòng thử lại.',
      ko: '비밀번호가 일치하지 않습니다.',
      en: 'Passwords do not match.'
    },
    severity: 'warning',
    retryable: false
  },
  C2104: {
    code: 'VALIDATION_PASSWORD_WEAK',
    message: {
      vi: 'Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn.',
      ko: '비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.',
      en: 'Password is too weak. Please use a stronger password.'
    },
    severity: 'warning',
    retryable: false
  },

  // 전화번호 검증
  C2201: {
    code: 'VALIDATION_PHONE_INVALID',
    message: {
      vi: 'Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.',
      ko: '올바른 전화번호를 입력해주세요.',
      en: 'Please enter a valid phone number.'
    },
    severity: 'warning',
    retryable: false
  },
  C2202: {
    code: 'VALIDATION_PHONE_REQUIRED',
    message: {
      vi: 'Vui lòng nhập số điện thoại.',
      ko: '전화번호를 입력해주세요.',
      en: 'Phone number is required.'
    },
    severity: 'warning',
    retryable: false
  },
  C2203: {
    code: 'VALIDATION_PHONE_FORMAT',
    message: {
      vi: 'Số điện thoại phải bắt đầu bằng +84 hoặc 84.',
      ko: '전화번호는 +84 또는 84로 시작해야 합니다.',
      en: 'Phone number must start with +84 or 84.'
    },
    severity: 'warning',
    retryable: false
  },

  // 이름 검증
  C2301: {
    code: 'VALIDATION_NAME_REQUIRED',
    message: {
      vi: 'Vui lòng nhập tên.',
      ko: '이름을 입력해주세요.',
      en: 'Name is required.'
    },
    severity: 'warning',
    retryable: false
  },
  C2302: {
    code: 'VALIDATION_NAME_TOO_SHORT',
    message: {
      vi: 'Tên phải có ít nhất 2 ký tự.',
      ko: '이름은 2자 이상이어야 합니다.',
      en: 'Name must be at least 2 characters.'
    },
    severity: 'warning',
    retryable: false
  },
  C2303: {
    code: 'VALIDATION_NAME_INVALID',
    message: {
      vi: 'Tên không hợp lệ. Vui lòng không sử dụng ký tự đặc biệt.',
      ko: '이름이 올바르지 않습니다. 특수문자를 사용할 수 없습니다.',
      en: 'Invalid name. Special characters are not allowed.'
    },
    severity: 'warning',
    retryable: false
  },

  // 주소 검증
  C2401: {
    code: 'VALIDATION_ADDRESS_REQUIRED',
    message: {
      vi: 'Vui lòng nhập địa chỉ.',
      ko: '주소를 입력해주세요.',
      en: 'Address is required.'
    },
    severity: 'warning',
    retryable: false
  },
  C2402: {
    code: 'VALIDATION_ADDRESS_INCOMPLETE',
    message: {
      vi: 'Vui lòng nhập địa chỉ đầy đủ.',
      ko: '전체 주소를 입력해주세요.',
      en: 'Please enter complete address.'
    },
    severity: 'warning',
    retryable: false
  },

  // 일반 필드 검증
  C2501: {
    code: 'VALIDATION_REQUIRED_FIELD',
    message: {
      vi: 'Trường này là bắt buộc.',
      ko: '필수 입력 항목입니다.',
      en: 'This field is required.'
    },
    severity: 'warning',
    retryable: false
  },
  C2502: {
    code: 'VALIDATION_INVALID_FORMAT',
    message: {
      vi: 'Định dạng không hợp lệ.',
      ko: '올바른 형식이 아닙니다.',
      en: 'Invalid format.'
    },
    severity: 'warning',
    retryable: false
  },
  C2503: {
    code: 'VALIDATION_TEXT_TOO_LONG',
    message: {
      vi: 'Văn bản quá dài.',
      ko: '텍스트가 너무 깁니다.',
      en: 'Text is too long.'
    },
    severity: 'warning',
    retryable: false
  },
  C2504: {
    code: 'VALIDATION_TEXT_TOO_SHORT',
    message: {
      vi: 'Văn bản quá ngắn.',
      ko: '텍스트가 너무 짧습니다.',
      en: 'Text is too short.'
    },
    severity: 'warning',
    retryable: false
  },

  // 숫자/금액 검증
  C2601: {
    code: 'VALIDATION_AMOUNT_INVALID',
    message: {
      vi: 'Số tiền không hợp lệ.',
      ko: '올바른 금액을 입력해주세요.',
      en: 'Please enter a valid amount.'
    },
    severity: 'warning',
    retryable: false
  },
  C2602: {
    code: 'VALIDATION_AMOUNT_MIN',
    message: {
      vi: 'Số tiền tối thiểu không đạt.',
      ko: '최소 금액에 도달하지 않았습니다.',
      en: 'Minimum amount not reached.'
    },
    severity: 'warning',
    retryable: false
  },
  C2603: {
    code: 'VALIDATION_AMOUNT_MAX',
    message: {
      vi: 'Số tiền vượt quá giới hạn.',
      ko: '최대 금액을 초과했습니다.',
      en: 'Maximum amount exceeded.'
    },
    severity: 'warning',
    retryable: false
  },

  // OTP/인증 코드 검증
  C2701: {
    code: 'VALIDATION_OTP_INVALID',
    message: {
      vi: 'Mã OTP không hợp lệ.',
      ko: 'OTP 코드가 올바르지 않습니다.',
      en: 'Invalid OTP code.'
    },
    severity: 'warning',
    retryable: false
  },
  C2702: {
    code: 'VALIDATION_OTP_EXPIRED',
    message: {
      vi: 'Mã OTP đã hết hạn.',
      ko: 'OTP 코드가 만료되었습니다.',
      en: 'OTP code has expired.'
    },
    severity: 'warning',
    retryable: false
  }
};

export default VALIDATION_ERRORS;