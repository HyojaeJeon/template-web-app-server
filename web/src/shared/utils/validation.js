/**
 * 기본 검증 유틸리티 함수
 * @description 인증 및 기본 입력 검증
 */

// XSS 위험 패턴
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi
];

/**
 * XSS 공격 패턴 새니타이제이션
 */
export function sanitizeXSS(input) {
  if (typeof input !== 'string') return input;

  let sanitized = input;

  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  return sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * 이메일 주소 검증
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || typeof email !== 'string') {
    return { valid: false, error: '이메일을 입력해주세요.' };
  }

  if (email.length > 254) {
    return { valid: false, error: '이메일이 너무 깁니다.' };
  }

  if (!emailRegex.test(email)) {
    return { valid: false, error: '올바른 이메일 형식이 아닙니다.' };
  }

  return { valid: true };
}

/**
 * 비밀번호 강도 검증
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: '비밀번호를 입력해주세요.' };
  }

  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const failedRequirements = [];

  if (!requirements.minLength) failedRequirements.push('최소 8자 이상');
  if (!requirements.hasUpperCase) failedRequirements.push('대문자 포함');
  if (!requirements.hasLowerCase) failedRequirements.push('소문자 포함');
  if (!requirements.hasNumber) failedRequirements.push('숫자 포함');
  if (!requirements.hasSpecial) failedRequirements.push('특수문자 포함');

  const metCount = Object.values(requirements).filter(Boolean).length;
  const strength = metCount >= 5 ? 'strong' : metCount >= 3 ? 'medium' : 'weak';

  if (failedRequirements.length > 0) {
    return {
      valid: false,
      error: `비밀번호 요구사항: ${failedRequirements.join(', ')}`,
      requirements,
      strength
    };
  }

  return { valid: true, requirements, strength };
}

/**
 * 전화번호 검증
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: '전화번호를 입력해주세요.' };
  }

  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  const phoneRegex = /^[0-9]{10,11}$/;

  if (!phoneRegex.test(cleanPhone)) {
    return { valid: false, error: '올바른 전화번호 형식이 아닙니다.' };
  }

  return { valid: true, formatted: cleanPhone };
}

/**
 * 필수 값 검증
 */
export function validateRequired(value) {
  if (value === null || value === undefined) {
    return { valid: false, error: '필수 입력 항목입니다.' };
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { valid: false, error: '필수 입력 항목입니다.' };
  }

  if (Array.isArray(value) && value.length === 0) {
    return { valid: false, error: '최소 하나 이상 선택해주세요.' };
  }

  return { valid: true };
}

/**
 * 통합 입력 검증 함수
 */
export function validateInput(input, type, options = {}) {
  const { maxLength = 1000, allowEmpty = false } = options;

  if (!input || input.trim() === '') {
    return allowEmpty
      ? { valid: true, sanitized: '' }
      : { valid: false, error: '입력값이 필요합니다.' };
  }

  if (typeof input !== 'string') {
    return { valid: false, error: '문자열 타입이 아닙니다.' };
  }

  if (input.length > maxLength) {
    return { valid: false, error: `최대 ${maxLength}자까지 입력 가능합니다.` };
  }

  switch (type) {
    case 'email':
      return validateEmail(input);
    case 'password':
      return validatePassword(input);
    case 'phone':
      return validatePhone(input);
    case 'text':
    default:
      return { valid: true, sanitized: sanitizeXSS(input) };
  }
}

export default {
  sanitizeXSS,
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequired,
  validateInput
};
