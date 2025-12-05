/**
 * 인증 관련 검증 시스템
 * 
 * 사용자 인증, 회원가입, 로그인, 비밀번호 관련 검증을 담당
 * OWASP 보안 가이드라인과 E.164 국제 표준 준수
 */

import { GraphQLError } from 'graphql';
import { SecurityValidator } from './SecurityValidator.js';

export class AuthValidators extends SecurityValidator {
  constructor() {
    super();

    // 국제 전화번호 패턴 (E.164 표준)                                - 글로벌 호환성
    this.e164PhonePattern = /^\+[1-9]\d{1,14}$/;
    
    // 국가별 전화번호 패턴                                           - 지역별 지원
    this.countryPhonePatterns = {
      VN: /^(\+84|84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/, // Local
      KR: /^(\+82|82|0)?1[0-9]{9,10}$/,                                      // 한국
      US: /^(\+1|1)?[2-9][0-9]{2}[2-9][0-9]{6}$/,                          // 미국
    };

    // 차단된 이메일 도메인                                           - 스팸/임시 메일 차단
    this.blockedEmailDomains = [
      '10minutemail.com',
      'guerrillamail.com', 
      'mailinator.com',
      'tempail.com',
      'yopmail.com',
      'throwaway.email',
      'temp-mail.org',
    ];

    // 일반적인 비밀번호 패턴                                          - 보안 강화
    this.commonPasswordPatterns = [
      /^(password|123456|qwerty|abc123|letmein)$/i,                         // 기본 패턴
      /^admin$/i,                                                          // 관리자 패턴  
      /^(qwertyuiop|asdfghjkl|zxcvbnm)/i,                                  // 키보드 패턴
      /^(123456789|987654321|111111|000000)/,                             // 숫자 패턴
      /^(password|admin|user|test|guest|demo)\d{1,4}$/i,                   // 단어+숫자 패턴
    ];

    // 지원되는 소셜 로그인 프로바이더                                  - 외부 인증 서비스
    this.supportedSocialProviders = ['google', 'facebook', 'apple', 'zalo'];
  }

  /**
   * 전화번호 검증 및 E.164 정규화                                   - 국제 표준 변환
   * 
   * @param {string} phone - 입력된 전화번호
   * @returns {string}     - E.164 형식 전화번호 (+82, +84 등)
   */
  validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
      throw new GraphQLError(
        'Phone number is required',
        'PHONE_REQUIRED',
        400
      );
    }

    // 보안 검사 및 길이 제한
    this.checkMaliciousPatterns(phone, 'phone');
    
    if (phone.length > 20) {
      throw new GraphQLError(
        'Phone number too long',
        'PHONE_TOO_LONG',
        400
      );
    }

    // 공백 및 특수문자 제거                                          - 입력 정규화
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // E.164 형식 우선 검증
    if (this.e164PhonePattern.test(cleanPhone)) {
      return cleanPhone;
    }
    
    // 국가별 패턴 검증 및 변환
    for (const [countryCode, pattern] of Object.entries(this.countryPhonePatterns)) {
      if (pattern.test(cleanPhone)) {
        return this.normalizeToE164(cleanPhone, countryCode);
      }
    }

    throw new GraphQLError(
      'Invalid phone number format. Please use international format (+country code)',
      'INVALID_PHONE_FORMAT',
      400
    );
  }

  /**
   * 국가별 번호를 E.164 형식으로 변환                               - 표준화 처리
   * 
   * @param {string} phone       - 정제된 전화번호
   * @param {string} countryCode - 국가 코드 (VN, KR, US)
   * @returns {string}           - E.164 형식 번호
   */
  normalizeToE164(phone, countryCode) {
    let cleanNumber = phone.replace(/[\s\-\(\)]/g, '');
    
    switch (countryCode) {
      case 'VN':                                                           // Local +84
        if (cleanNumber.startsWith('+84')) return cleanNumber;
        if (cleanNumber.startsWith('84')) return '+' + cleanNumber;
        if (cleanNumber.startsWith('0')) return '+84' + cleanNumber.substring(1);
        return '+84' + cleanNumber;
        
      case 'KR':                                                           // 한국 +82
        if (cleanNumber.startsWith('+82')) return cleanNumber;
        if (cleanNumber.startsWith('82')) return '+' + cleanNumber;
        if (cleanNumber.startsWith('0')) return '+82' + cleanNumber.substring(1);
        return '+82' + cleanNumber;
        
      case 'US':                                                           // 미국 +1
        if (cleanNumber.startsWith('+1')) return cleanNumber;
        if (cleanNumber.startsWith('1') && cleanNumber.length === 11) return '+' + cleanNumber;
        return '+1' + cleanNumber;
        
      default:
        if (cleanNumber.startsWith('+')) return cleanNumber;
        throw new GraphQLError(
          `Unsupported country code: ${countryCode}`,
          'UNSUPPORTED_COUNTRY',
          400
        );
    }
  }

  /**
   * 비밀번호 복잡성 검증                                           - OWASP 가이드라인
   * 
   * @param {string} password - 입력된 비밀번호
   * @returns {string}        - 검증된 비밀번호
   */
  validatePassword(password) {
    if (!password || typeof password !== 'string') {
      throw new GraphQLError(
        'Password is required',
        'PASSWORD_REQUIRED',
        400
      );
    }

    // 길이 검증                                                     - 기본 보안 요구사항
    if (password.length < 8) {
      throw new GraphQLError(
        'Password must be at least 8 characters',
        'PASSWORD_TOO_SHORT',
        400
      );
    }

    if (password.length > 128) {
      throw new GraphQLError(
        'Password too long',
        'PASSWORD_TOO_LONG',
        400
      );
    }

    // 프로덕션 환경에서만 복잡성 요구사항 적용                          - 개발 편의성
    if (process.env.NODE_ENV === 'production') {
      const requirements = {
        hasLowercase: /[a-z]/.test(password),                              // 소문자
        hasUppercase: /[A-Z]/.test(password),                              // 대문자
        hasNumber: /\d/.test(password),                                    // 숫자
        hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), // 특수문자
      };

      const passedChecks = Object.values(requirements).filter(Boolean).length;
      
      if (passedChecks < 3) {
        throw new GraphQLError(
          'Password must contain at least 3 of: lowercase, uppercase, number, special character',
          'PASSWORD_TOO_WEAK',
          400
        );
      }
    }

    // 일반적인 비밀번호 차단                                          - 보안 강화
    if (this.isCommonPassword(password)) {
      throw new GraphQLError(
        'Password is too common. Please choose a different password',
        'COMMON_PASSWORD',
        400
      );
    }

    return password;
  }

  /**
   * 사용자 이름 검증                                               - XSS 방지
   * 
   * @param {string} fullName - 사용자 이름
   * @returns {string}        - 정제된 이름
   */
  validateFullName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
      throw new GraphQLError(
        'Full name is required',
        'FULLNAME_REQUIRED',
        400
      );
    }

    // 보안 검사
    this.checkMaliciousPatterns(fullName, 'fullName');

    // 길이 제한
    const trimmed = fullName.trim();
    if (trimmed.length < 2) {
      throw new GraphQLError(
        'Full name too short',
        'FULLNAME_TOO_SHORT',
        400
      );
    }

    if (trimmed.length > 100) {
      throw new GraphQLError(
        'Full name too long',
        'FULLNAME_TOO_LONG',
        400
      );
    }

    // HTML 태그 검사                                               - XSS 방지
    if (/<[^>]*>/g.test(trimmed)) {
      throw new GraphQLError(
        'Full name cannot contain HTML tags',
        'INVALID_FULLNAME_FORMAT',
        400
      );
    }

    return trimmed;
  }

  /**
   * 이메일 검증 (인증용)                                           - 확장된 보안 검사
   * 
   * @param {string} email - 이메일 주소
   * @returns {string}     - 정제된 이메일
   */
  validateEmailForAuth(email) {
    // 기본 이메일 검증 수행
    const validatedEmail = this.validateEmail(email, false);
    
    if (!validatedEmail) return null;

    // 차단된 도메인 검사                                            - 스팸 방지
    const domain = validatedEmail.split('@')[1];
    if (this.isSuspiciousDomain(domain)) {
      throw new GraphQLError(
        'Email domain not allowed',
        'DOMAIN_NOT_ALLOWED',
        400
      );
    }

    return validatedEmail;
  }

  /**
   * 의심스러운 이메일 도메인 검사                                   - 보안 필터링
   * 
   * @param {string} domain - 이메일 도메인
   * @returns {boolean}     - 차단 여부
   */
  isSuspiciousDomain(domain) {
    return this.blockedEmailDomains.some(blocked => 
      domain.toLowerCase().includes(blocked.toLowerCase())
    );
  }

  /**
   * 일반적인 비밀번호 패턴 검사                                     - 보안 강화
   * 
   * @param {string} password - 비밀번호
   * @returns {boolean}       - 일반적인 패스워드 여부
   */
  isCommonPassword(password) {
    return this.commonPasswordPatterns.some(pattern => pattern.test(password));
  }

  /**
   * 회원가입 입력 통합 검증                                        - 원스톱 검증
   * 
   * @param {object} input - 회원가입 입력 데이터
   * @returns {object}     - 검증된 데이터
   */
  validateRegistrationInput(input) {
    return {
      phone: this.validatePhone(input.phone),
      password: this.validatePassword(input.password),
      fullName: this.validateFullName(input.name || input.fullName),
      email: input.email ? this.validateEmailForAuth(input.email) : null,
    };
  }

  /**
   * 로그인 입력 통합 검증                                          - 다중 식별자 지원
   * 
   * @param {object} input - 로그인 입력 데이터
   * @returns {object}     - 검증된 로그인 데이터
   */
  validateLoginInput(input) {
    // 이메일 직접 입력
    if (input.email) {
      return {
        identifier: this.validateEmailForAuth(input.email),
        password: this.validatePassword(input.password),
        type: 'email',
      };
    } 
    
    // phone 필드에 이메일이나 전화번호 입력
    if (input.phone) {
      if (input.phone.includes('@')) {
        // 이메일 형식으로 입력됨
        return {
          identifier: this.validateEmailForAuth(input.phone),
          password: this.validatePassword(input.password),
          type: 'email',
        };
      } else {
        // 전화번호로 입력됨
        return {
          identifier: this.validatePhone(input.phone),
          password: this.validatePassword(input.password),
          type: 'phone',
        };
      }
    }

    throw new GraphQLError(
      'Phone number or email is required',
      'IDENTIFIER_REQUIRED',
      400
    );
  }

  /**
   * 소셜 로그인 입력 검증                                          - 외부 인증 서비스
   * 
   * @param {object} input - 소셜 로그인 데이터
   * @returns {object}     - 검증된 소셜 데이터
   */
  validateSocialLoginInput(input) {
    const { provider, providerId, accessToken, email, fullName } = input;

    // 필수 필드 검증
    if (!provider || !providerId || !accessToken) {
      throw new GraphQLError(
        'Provider, providerId, and accessToken are required',
        'SOCIAL_LOGIN_INCOMPLETE',
        400
      );
    }

    // 지원 프로바이더 확인
    if (!this.supportedSocialProviders.includes(provider.toLowerCase())) {
      throw new GraphQLError(
        'Unsupported social login provider',
        'UNSUPPORTED_PROVIDER',
        400
      );
    }

    return {
      provider: provider.toLowerCase(),
      providerId: String(providerId),
      accessToken: String(accessToken),
      email: email ? this.validateEmailForAuth(email) : null,
      fullName: fullName ? this.validateFullName(fullName) : null,
    };
  }

  /**
   * 비밀번호 재설정 토큰 검증                                       - 보안 토큰 관리
   * 
   * @param {string} token - 재설정 토큰
   * @returns {string}     - 검증된 토큰
   */
  validateResetToken(token) {
    if (!token || typeof token !== 'string') {
      throw new GraphQLError(
        'Reset token is required',
        'RESET_TOKEN_REQUIRED',
        400
      );
    }

    // 토큰 길이 검증 (보통 32-64자)
    if (token.length < 32 || token.length > 128) {
      throw new GraphQLError(
        'Invalid reset token format',
        'INVALID_RESET_TOKEN',
        400
      );
    }

    // 악성 패턴 검사
    this.checkMaliciousPatterns(token, 'resetToken');

    return token;
  }
}

export default AuthValidators;