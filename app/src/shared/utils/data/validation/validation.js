/**
 * 유틸리티 함수 - 유효성 검증
 * Local 특화 유효성 검증 포함
 */

/**
 * Local 전화번호 유효성 검증
 * 형식: +84 123 456 789 또는 84123456789
 */
export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) {return false;}

  // 공백 및 특수문자 제거
  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');

  // +84 또는 84로 시작하는 11자리 숫자
  const vietnamPhoneRegex = /^(\+?84)[0-9]{9}$/;

  return vietnamPhoneRegex.test(cleaned);
};

/**
 * 이메일 유효성 검증
 */
export const validateEmail = (email) => {
  if (!email) {return false;}

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 비밀번호 유효성 검증
 * 최소 6자, 영문/숫자 조합
 */
export const validatePassword = (password) => {
  if (!password) {return false;}

  return password.length >= 6;
};

/**
 * Local 주소 유효성 검증
 */
export const validateAddress = (address) => {
  if (!address) {return false;}

  const { street, ward, district, city } = address;

  return !!(street && ward && district && city);
};

/**
 * OTP 코드 유효성 검증 (6자리 숫자)
 */
export const validateOTP = (otp) => {
  if (!otp) {return false;}

  const otpRegex = /^[0-9]{6}$/;
  return otpRegex.test(otp);
};

/**
 * 금액 유효성 검증 (VND)
 */
export const validateAmount = (amount) => {
  if (amount === null || amount === undefined) {return false;}

  const numAmount = Number(amount);
  return !isNaN(numAmount) && numAmount >= 0;
};

/**
 * 문자열 길이 검증
 */
export const validateLength = (text, minLength = 0, maxLength = Infinity) => {
  if (!text) {return minLength === 0;}

  return text.length >= minLength && text.length <= maxLength;
};

/**
 * 필수 필드 검증
 */
export const validateRequired = (value) => {
  if (value === null || value === undefined) {return false;}
  if (typeof value === 'string') {return value.trim().length > 0;}
  if (Array.isArray(value)) {return value.length > 0;}
  return !!value;
};

/**
 * 폼 데이터 일괄 검증
 */
export const validateForm = (data, rules) => {
  const errors = {};

  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];

    // 필수 필드 검증
    if (fieldRules.required && !validateRequired(value)) {
      errors[field] = fieldRules.messages?.required || `${field} is required`;
      return;
    }

    // 값이 없으면 다른 검증 스킵
    if (!validateRequired(value)) {return;}

    // 이메일 검증
    if (fieldRules.email && !validateEmail(value)) {
      errors[field] = fieldRules.messages?.email || 'Invalid email format';
      return;
    }

    // 전화번호 검증
    if (fieldRules.phone && !validatePhoneNumber(value)) {
      errors[field] = fieldRules.messages?.phone || 'Invalid phone number format';
      return;
    }

    // 비밀번호 검증
    if (fieldRules.password && !validatePassword(value)) {
      errors[field] = fieldRules.messages?.password || 'Password must be at least 6 characters';
      return;
    }

    // 길이 검증
    if (fieldRules.length && !validateLength(value, fieldRules.length.min, fieldRules.length.max)) {
      errors[field] = fieldRules.messages?.length || 'Invalid length';
      return;
    }

    // 커스텀 검증 함수
    if (fieldRules.custom && !fieldRules.custom(value)) {
      errors[field] = fieldRules.messages?.custom || 'Invalid value';
      return;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors};
};
