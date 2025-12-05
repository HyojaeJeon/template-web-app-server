/**
 * 통합 보안 검증 시스템
 * OWASP 보안 가이드라인 기반 입력 검증 및 보안 필터링
 *
 * 통합된 기능:
 * - security/Validators.js의 전화번호/이메일/비밀번호 검증
 * - validators/InputValidators.js의 악성 패턴 검사
 * - 모든 보안 관련 검증 로직 중앙화
 */

import { GraphQLError } from 'graphql';
import Joi from 'joi';

export class SecurityValidator {
  constructor() {
    // ===== 전화번호 패턴 (E.164 및 국가별) =====
    this.e164PhonePattern = /^\+[1-9]\d{1,14}$/;
    this.vietnamPhonePattern = /^(\+84|84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;
    this.koreaPhonePattern = /^(\+82|82|0)?1[0-9]{9,10}$/;
    this.usPhonePattern = /^(\+1|1)?[2-9][0-9]{2}[2-9][0-9]{6}$/;

    // ===== 이메일 패턴 (RFC 5322) =====
    this.emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    // ===== 악성 패턴 (통합 보안 검사) =====
    this.maliciousPatterns = [
      // SQL Injection 패턴
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /('.*or.*'.*=.*'|'.*union.*select|'.*drop.*table|'.*insert.*into|'.*update.*set|'.*delete.*from)/gi,
      /(--|\#|\/\*|\*\/)/g,
      /(';\s*(drop|delete|update|insert|select|union))/gi,

      // XSS 공격 패턴
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript\s*:/gi,
      /(javascript:|vbscript:|onload=|onerror=)/i,
      /on(load|click|error|focus|blur)\s*=/gi,
      /<\s*(iframe|object|embed|applet)/gi,

      // Path Traversal
      /\.\.[\/\\]/,
      /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/gi,

      // LDAP 인젝션
      /(\(\|)|(\)\()|(\*\))|(\|\()|(!\()/g,

      // 명령 실행 패턴
      /(;\s*(rm|cat|ls|ps|kill|chmod|chown|curl|wget))/gi,

      // NoSQL 인젝션
      /(\$where|\$ne|\$gt|\$lt|\$regex|\$exists)/gi,
    ];

    // ===== 기본 패턴 (형식 검증) =====
    this.basicPatterns = {
      uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
      slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      base64: /^[A-Za-z0-9+/]*={0,2}$/,
    };

    // ===== 차단된 도메인 (임시 이메일 서비스) =====
    this.blockedDomains = [
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
      'tempail.com',
      'yopmail.com',
      'throwaway.email',
      'temp-mail.org',
    ];

    // ===== 허용된 HTML 태그 =====
    this.allowedHtmlTags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'];
  }

  // ========================================
  // 핵심 보안 검사 메서드
  // ========================================

  /**
   * 악성 패턴 통합 검사
   * @param {string} input - 검사할 입력값
   * @param {string} fieldName - 필드명
   * @throws {GraphQLError} - 악성 패턴 발견 시
   */
  checkMaliciousPatterns(input, fieldName = 'input') {
    if (!input || typeof input !== 'string') return;

    for (const pattern of this.maliciousPatterns) {
      if (pattern.test(input)) {
        throw new GraphQLError(
          `Dangerous pattern detected in ${fieldName}`,
          { extensions: { code: 'MALICIOUS_PATTERN_DETECTED' } }
        );
      }
    }
  }

  /**
   * HTML 태그 제거 (XSS 방지)
   * @param {string} input - 처리할 문자열
   * @param {boolean} allowBasicTags - 기본 태그 허용 여부
   * @returns {string} - 정제된 문자열
   */
  sanitizeHtml(input, allowBasicTags = false) {
    if (!input) return '';

    if (allowBasicTags) {
      // 허용된 태그만 남기고 제거
      const allowedPattern = new RegExp(`<(?!\/?(?:${this.allowedHtmlTags.join('|')})\\s*\/?>)[^>]+>`, 'gi');
      return input.replace(allowedPattern, '');
    }

    // 모든 HTML 태그 제거
    return input.replace(/<[^>]*>/g, '');
  }

  // ========================================
  // 전화번호 검증
  // ========================================

  /**
   * 전화번호 검증 및 E.164 변환
   * @param {string} phone - 전화번호
   * @returns {string} - E.164 형식 전화번호
   */
  validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
      throw new GraphQLError(
        'Phone number is required',
        { extensions: { code: 'PHONE_REQUIRED' } }
      );
    }

    // 보안 검사
    this.checkMaliciousPatterns(phone, 'phone');

    // 길이 제한
    if (phone.length > 20) {
      throw new GraphQLError(
        'Phone number too long',
        { extensions: { code: 'PHONE_TOO_LONG' } }
      );
    }

    // 정규화
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // E.164 형식 검증
    if (this.e164PhonePattern.test(cleanPhone)) {
      return cleanPhone;
    }

    // 국가별 변환
    if (this.vietnamPhonePattern.test(cleanPhone)) {
      return this.normalizeToE164(cleanPhone, 'VN');
    } else if (this.koreaPhonePattern.test(cleanPhone)) {
      return this.normalizeToE164(cleanPhone, 'KR');
    } else if (this.usPhonePattern.test(cleanPhone)) {
      return this.normalizeToE164(cleanPhone, 'US');
    }

    throw new GraphQLError(
      'Invalid phone number format',
      { extensions: { code: 'INVALID_PHONE_FORMAT' } }
    );
  }

  /**
   * E.164 형식으로 정규화
   */
  normalizeToE164(phone, countryCode) {
    let cleanNumber = phone.replace(/[\s\-\(\)]/g, '');

    switch (countryCode) {
      case 'VN':
        if (cleanNumber.startsWith('+84')) return cleanNumber;
        if (cleanNumber.startsWith('84')) return '+' + cleanNumber;
        if (cleanNumber.startsWith('0')) return '+84' + cleanNumber.substring(1);
        return '+84' + cleanNumber;

      case 'KR':
        if (cleanNumber.startsWith('+82')) return cleanNumber;
        if (cleanNumber.startsWith('82')) return '+' + cleanNumber;
        if (cleanNumber.startsWith('0')) return '+82' + cleanNumber.substring(1);
        return '+82' + cleanNumber;

      case 'US':
        if (cleanNumber.startsWith('+1')) return cleanNumber;
        if (cleanNumber.startsWith('1') && cleanNumber.length === 11) {
          return '+' + cleanNumber;
        }
        return '+1' + cleanNumber;

      default:
        if (cleanNumber.startsWith('+')) return cleanNumber;
        throw new GraphQLError(
          `Unsupported country code: ${countryCode}`,
          { extensions: { code: 'UNSUPPORTED_COUNTRY' } }
        );
    }
  }

  // ========================================
  // 이메일 검증
  // ========================================

  /**
   * 이메일 검증
   * @param {string} email - 이메일 주소
   * @returns {string|null} - 정규화된 이메일
   */
  validateEmail(email) {
    if (!email) return null;

    if (typeof email !== 'string') {
      throw new GraphQLError(
        'Email must be a string',
        { extensions: { code: 'INVALID_EMAIL_TYPE' } }
      );
    }

    // 보안 검사
    this.checkMaliciousPatterns(email, 'email');

    // 길이 제한
    if (email.length > 254) {
      throw new GraphQLError(
        'Email address too long',
        { extensions: { code: 'EMAIL_TOO_LONG' } }
      );
    }

    // 형식 검증
    if (!this.emailPattern.test(email)) {
      throw new GraphQLError(
        'Invalid email format',
        { extensions: { code: 'INVALID_EMAIL_FORMAT' } }
      );
    }

    // 도메인 검사
    const domain = email.split('@')[1];
    if (this.isSuspiciousDomain(domain)) {
      throw new GraphQLError(
        'Email domain not allowed',
        { extensions: { code: 'DOMAIN_NOT_ALLOWED' } }
      );
    }

    return email.toLowerCase().trim();
  }

  /**
   * 의심스러운 도메인 검사
   */
  isSuspiciousDomain(domain) {
    return this.blockedDomains.some(blocked => domain.includes(blocked));
  }

  // ========================================
  // 비밀번호 검증
  // ========================================

  /**
   * 비밀번호 검증 (OWASP 가이드라인)
   * @param {string} password - 비밀번호
   * @returns {string} - 검증된 비밀번호
   */
  validatePassword(password) {
    if (!password || typeof password !== 'string') {
      throw new GraphQLError(
        'Password is required',
        { extensions: { code: 'PASSWORD_REQUIRED' } }
      );
    }

    // 길이 검증
    if (password.length < 8) {
      throw new GraphQLError(
        'Password must be at least 8 characters',
        { extensions: { code: 'PASSWORD_TOO_SHORT' } }
      );
    }

    if (password.length > 128) {
      throw new GraphQLError(
        'Password too long',
        { extensions: { code: 'PASSWORD_TOO_LONG' } }
      );
    }

    // 복잡성 검증 (프로덕션 환경)
    if (process.env.NODE_ENV === 'production') {
      const requirements = {
        hasLowercase: /[a-z]/.test(password),
        hasUppercase: /[A-Z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      };

      const passedChecks = Object.values(requirements).filter(Boolean).length;

      if (passedChecks < 3) {
        throw new GraphQLError(
          'Password must contain at least 3 of: lowercase, uppercase, number, special character',
          { extensions: { code: 'PASSWORD_TOO_WEAK' } }
        );
      }
    }

    // 일반적인 패스워드 검사
    if (this.isCommonPassword(password)) {
      throw new GraphQLError(
        'Password is too common',
        { extensions: { code: 'COMMON_PASSWORD' } }
      );
    }

    return password;
  }

  /**
   * 일반적인 비밀번호 패턴 검사
   */
  isCommonPassword(password) {
    const commonPatterns = [
      /^(password|123456|qwerty|abc123|letmein)$/i,
      /^admin$/i,
      /^(qwertyuiop|asdfghjkl|zxcvbnm)/i,
      /^(123456789|987654321|111111|000000)/,
      /^(password|admin|user|test|guest|demo)\d{1,4}$/i,
    ];

    return commonPatterns.some(pattern => pattern.test(password));
  }

  // ========================================
  // 일반 문자열 검증
  // ========================================

  /**
   * 사용자명 검증
   * @param {string} fullName - 사용자 이름
   * @returns {string} - 정제된 이름
   */
  validateFullName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
      throw new GraphQLError(
        'Full name is required',
        { extensions: { code: 'FULLNAME_REQUIRED' } }
      );
    }

    // 보안 검사
    this.checkMaliciousPatterns(fullName, 'fullName');

    // HTML 태그 제거
    const sanitized = this.sanitizeHtml(fullName);

    // 길이 검증
    if (sanitized.trim().length < 2) {
      throw new GraphQLError(
        'Full name too short',
        { extensions: { code: 'FULLNAME_TOO_SHORT' } }
      );
    }

    if (sanitized.length > 100) {
      throw new GraphQLError(
        'Full name too long',
        { extensions: { code: 'FULLNAME_TOO_LONG' } }
      );
    }

    return sanitized.trim();
  }

  /**
   * 문자열 길이 검증
   * @param {string} value - 검증할 값
   * @param {number} min - 최소 길이
   * @param {number} max - 최대 길이
   * @param {string} fieldName - 필드명
   * @returns {string} - 정제된 값
   */
  validateStringLength(value, min = 1, max = 255, fieldName = 'field') {
    if (!value || typeof value !== 'string') {
      throw new GraphQLError(
        `${fieldName} is required`,
        { extensions: { code: 'FIELD_REQUIRED' } }
      );
    }

    const trimmed = value.trim();

    if (trimmed.length < min) {
      throw new GraphQLError(
        `${fieldName} must be at least ${min} characters`,
        { extensions: { code: 'FIELD_TOO_SHORT' } }
      );
    }

    if (trimmed.length > max) {
      throw new GraphQLError(
        `${fieldName} must be at most ${max} characters`,
        { extensions: { code: 'FIELD_TOO_LONG' } }
      );
    }

    // 보안 검사
    this.checkMaliciousPatterns(trimmed, fieldName);

    return trimmed;
  }

  // ========================================
  // 특수 형식 검증
  // ========================================

  /**
   * UUID 검증
   */
  validateUUID(value, fieldName = 'ID') {
    if (!value || !this.basicPatterns.uuid.test(value)) {
      throw new GraphQLError(
        `Invalid ${fieldName} format`,
        { extensions: { code: 'INVALID_UUID' } }
      );
    }
    return value;
  }

  /**
   * URL 검증
   */
  validateURL(url, fieldName = 'URL') {
    if (!url || !this.basicPatterns.url.test(url)) {
      throw new GraphQLError(
        `Invalid ${fieldName} format`,
        { extensions: { code: 'INVALID_URL' } }
      );
    }

    // 보안 검사
    this.checkMaliciousPatterns(url, fieldName);

    return url;
  }

  /**
   * Slug 검증
   */
  validateSlug(slug) {
    if (!slug || !this.basicPatterns.slug.test(slug)) {
      throw new GraphQLError(
        'Invalid slug format',
        { extensions: { code: 'INVALID_SLUG' } }
      );
    }
    return slug;
  }

  // ========================================
  // 통합 검증 메서드
  // ========================================

  /**
   * 회원가입 입력 통합 검증
   */
  validateRegistrationInput(input) {
    return {
      phone: this.validatePhone(input.phone),
      password: this.validatePassword(input.password),
      fullName: this.validateFullName(input.name || input.fullName),
      email: input.email ? this.validateEmail(input.email) : null,
    };
  }

  /**
   * 로그인 입력 통합 검증
   */
  validateLoginInput(input) {
    if (input.email) {
      return {
        identifier: this.validateEmail(input.email),
        password: this.validatePassword(input.password),
        type: 'email',
      };
    } else if (input.phone) {
      if (input.phone.includes('@')) {
        return {
          identifier: this.validateEmail(input.phone),
          password: this.validatePassword(input.password),
          type: 'email',
        };
      } else {
        return {
          identifier: this.validatePhone(input.phone),
          password: this.validatePassword(input.password),
          type: 'phone',
        };
      }
    }

    throw new GraphQLError(
      'Phone number or email is required',
      { extensions: { code: 'IDENTIFIER_REQUIRED' } }
    );
  }

  /**
   * 소셜 로그인 입력 검증
   */
  validateSocialLoginInput(input) {
    const { provider, providerId, accessToken, email, fullName } = input;

    if (!provider || !providerId || !accessToken) {
      throw new GraphQLError(
        'Provider, providerId, and accessToken are required',
        { extensions: { code: 'SOCIAL_LOGIN_INCOMPLETE' } }
      );
    }

    const supportedProviders = ['google', 'facebook'];
    if (!supportedProviders.includes(provider.toLowerCase())) {
      throw new GraphQLError(
        'Unsupported social login provider',
        { extensions: { code: 'UNSUPPORTED_PROVIDER' } }
      );
    }

    return {
      provider: provider.toLowerCase(),
      providerId: String(providerId),
      accessToken: String(accessToken),
      email: email ? this.validateEmail(email) : null,
      fullName: fullName ? this.validateFullName(fullName) : null,
    };
  }

  // ========================================
  // Joi 스키마 생성 헬퍼
  // ========================================

  /**
   * Joi 스키마 생성
   */
  createJoiSchemas() {
    return {
      email: Joi.string()
        .email({ minDomainSegments: 2 })
        .lowercase()
        .trim()
        .required()
        .messages({
          'string.email': 'Email không hợp lệ',
          'string.empty': 'Email là bắt buộc'
        }),

      phone: Joi.string()
        .pattern(this.vietnamPhonePattern)
        .required()
        .messages({
          'string.pattern.base': 'Số điện thoại không hợp lệ',
          'string.empty': 'Số điện thoại là bắt buộc'
        }),

      password: Joi.string()
        .min(8)
        .max(128)
        .required()
        .messages({
          'string.min': 'Mật khẩu phải có ít nhất 8 ký tự',
          'string.max': 'Mật khẩu quá dài',
          'string.empty': 'Mật khẩu là bắt buộc'
        }),

      fullName: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
          'string.min': 'Tên phải có ít nhất 2 ký tự',
          'string.max': 'Tên quá dài',
          'string.empty': 'Tên là bắt buộc'
        }),
    };
  }
}

// Singleton export
export const securityValidator = new SecurityValidator();

export default SecurityValidator;