/**
 * 보안 유틸리티 통합 모듈
 * JWT, 암호화, 인증 관련 모든 보안 기능 제공
 */

// JWT 관리                                                          // 토큰 생성/검증
export { 
  default as jwtManager,
  JWTManager 
} from './JWT.js';

// 암호화 관리                                                       // 암호화/해싱
export { 
  default as encryptionManager,
  EncryptionManager 
} from './Encryption.js';

// 보안 유틸리티 함수들                                              // 자주 사용되는 함수
export {
  // JWT 함수
  generateAccessToken,
  generateRefreshToken,
  generateStoreTokens,
  generateCustomerTokens,
  verifyToken,
  refreshTokens,
  blacklistToken,
  extractUserInfo,
  getTokenRemainingTime
} from './JWT.js';

export {
  // 암호화 함수
  hashPassword,
  verifyPassword,
  encrypt,
  decrypt,
  encryptString,
  decryptString,
  generateToken,
  generateOTP,
  generateEmailToken,
  generateResetToken,
  generateHMAC,
  verifyHMAC,
  maskSensitiveData,
  checkPasswordStrength,
  generateAPIKey
} from './Encryption.js';

// 기본 내보내기                                                     // 통합 보안 객체
export default {
  jwt: jwtManager,
  encryption: encryptionManager
};