/**
 * 암호화 통합 유틸리티
 * 패스워드 해싱, 데이터 암호화/복호화, 토큰 생성
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { logger } from '../utilities/Logger.js';

class EncryptionManager {
  constructor() {
    // 암호화 설정                                                  // 보안 파라미터
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.algorithm = 'aes-256-gcm';
    this.encryptionKey = this.getEncryptionKey();
  }

  /**
   * 암호화 키 가져오기
   */
  getEncryptionKey() {                                              // 32바이트 키 생성
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      logger.warn('ENCRYPTION_KEY 미설정 - 기본 키 사용(운영 비권장)');
      return crypto.scryptSync('default-key', 'salt', 32);
    }
    return Buffer.from(key, 'hex');
  }

  /**
   * 패스워드 해싱
   */
  async hashPassword(password) {                                    // bcrypt 해싱
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * 패스워드 검증
   */
  async verifyPassword(password, hash) {                            // 해시 비교
    if (!password || !hash) {
      return false;
    }
    return bcrypt.compare(password, hash);
  }

  /**
   * 데이터 암호화
   */
  encrypt(text) {                                                   // AES-256-GCM 암호화
    try {
      const iv = crypto.randomBytes(16);                            // 초기화 벡터
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();                          // 인증 태그
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      throw new Error('Encryption failed: ' + error.message);
    }
  }

  /**
   * 데이터 복호화  
   */
  decrypt(encryptedData) {                                          // AES-256-GCM 복호화
    try {
      const { encrypted, iv, authTag } = encryptedData;
      
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        Buffer.from(iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));             // 인증 태그 설정
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed: ' + error.message);
    }
  }

  /**
   * 문자열 암호화 (간편 버전)
   */
  encryptString(text) {                                             // Base64 인코딩 포함
    const encrypted = this.encrypt(text);
    return Buffer.from(JSON.stringify(encrypted)).toString('base64');
  }

  /**
   * 문자열 복호화 (간편 버전)
   */
  decryptString(encryptedString) {                                  // Base64 디코딩 포함
    try {
      const encryptedData = JSON.parse(
        Buffer.from(encryptedString, 'base64').toString('utf8')
      );
      return this.decrypt(encryptedData);
    } catch (error) {
      throw new Error('Invalid encrypted string');
    }
  }

  /**
   * 랜덤 토큰 생성
   */
  generateToken(length = 32) {                                      // 안전한 랜덤 토큰
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * OTP 토큰 생성
   */
  generateOTP(length = 6) {                                         // 숫자 OTP
    const digits = '0123456789';
    let otp = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      otp += digits[randomBytes[i] % 10];
    }
    
    return otp;
  }

  /**
   * 이메일 검증 토큰 생성
   */
  generateEmailToken() {                                            // 이메일 확인용
    return this.generateToken(32);
  }

  /**
   * 패스워드 리셋 토큰 생성
   */
  generateResetToken() {                                            // 비밀번호 재설정용
    return {
      token: this.generateToken(32),
      expires: new Date(Date.now() + 3600000) // 1시간
    };
  }

  /**
   * HMAC 서명 생성
   */
  generateHMAC(data, secret = process.env.HMAC_SECRET) {            // 메시지 인증 코드
    if (!secret) {
      throw new Error('HMAC secret is required');
    }
    
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(data));
    return hmac.digest('hex');
  }

  /**
   * HMAC 서명 검증
   */
  verifyHMAC(data, signature, secret = process.env.HMAC_SECRET) {   // 서명 검증
    const expectedSignature = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * 민감 데이터 마스킹
   */
  maskSensitiveData(data, type = 'email') {                        // 개인정보 보호
    switch (type) {
      case 'email': {
        const [local, domain] = data.split('@');
        if (!domain) return '***';
        const masked = local.substring(0, 2) + '***';
        return `${masked}@${domain}`;
      }
      case 'phone': {
        const cleaned = data.replace(/\D/g, '');
        if (cleaned.length < 10) return '***';
        return cleaned.substring(0, 3) + '****' + cleaned.substring(7);
      }
      case 'card': {
        const cleaned = data.replace(/\D/g, '');
        if (cleaned.length < 12) return '****';
        return '**** **** **** ' + cleaned.substring(cleaned.length - 4);
      }
      default:
        return '***';
    }
  }

  /**
   * 패스워드 강도 검사
   */
  checkPasswordStrength(password) {                                 // 보안 수준 평가
    const checks = {
      length: password.length >= 8,                                 // 최소 길이
      uppercase: /[A-Z]/.test(password),                            // 대문자
      lowercase: /[a-z]/.test(password),                            // 소문자
      numbers: /\d/.test(password),                                 // 숫자
      special: /[@$!%*?&#]/.test(password)                          // 특수문자
    };

    const score = Object.values(checks).filter(Boolean).length;

    return {
      score,
      strength: score < 3 ? 'weak' : score < 4 ? 'medium' : 'strong',
      checks
    };
  }

  /**
   * API 키 생성
   */
  generateAPIKey(prefix = 'sk') {                                   // 서비스 키 생성
    const timestamp = Date.now().toString(36);
    const randomPart = this.generateToken(24);
    return `${prefix}_${timestamp}_${randomPart}`;
  }
}

// 싱글톤 인스턴스                                                   // 전역 암호화 관리자
const encryptionManager = new EncryptionManager();

export default encryptionManager;
export { EncryptionManager };

// Named exports for convenience
export const encrypt = encryptionManager.encrypt.bind(encryptionManager);
export const decrypt = encryptionManager.decrypt.bind(encryptionManager);
export const hashPassword = encryptionManager.hashPassword.bind(encryptionManager);
export const verifyPassword = encryptionManager.verifyPassword.bind(encryptionManager);
export const generateHMAC = encryptionManager.generateHMAC.bind(encryptionManager);
export const verifyHMAC = encryptionManager.verifyHMAC.bind(encryptionManager);
