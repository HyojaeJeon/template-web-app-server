/**
 * 통합 인증 시스템 진입점
 *
 * JWT, OTP, 미들웨어 등 모든 인증 관련 기능을 중앙 집중식으로 관리
 */

// JWT 토큰 관리
import jwtManager from './JWT.js';

// OTP 관리
import otpManager from './OTPManager.js';

// 인증 미들웨어
import {
  getUser,
  getStoreAccount,
  getMobileUser,
  createAuthContext
} from './AuthMiddleware.js';

// Named exports
export {
  // JWT 관리
  jwtManager,

  // OTP 관리
  otpManager,

  // 인증 미들웨어
  getUser,
  getStoreAccount,
  getMobileUser,
  createAuthContext
};

// Default export - 전체 인증 시스템
export default {
  jwt: jwtManager,
  otp: otpManager,
  middleware: {
    getUser,
    getStoreAccount,
    getMobileUser,
    createAuthContext
  }
};