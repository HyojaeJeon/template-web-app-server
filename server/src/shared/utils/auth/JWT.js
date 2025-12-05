/**
 * JWT 통합 보안 관리자
 * JWT 토큰 생성, 검증, 갱신, 블랙리스트 관리
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class JWTManager {
  constructor(options = {}) {
    // 환경변수 검증                                                // 필수 보안 설정 검증
    this.validateSecrets();

    // 토큰 시크릿                                                  // 서명용 비밀키
    this.accessTokenSecret = process.env.JWT_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    this.storeTokenSecret = process.env.JWT_STORE_SECRET || this.accessTokenSecret;

    // 토큰 만료 시간 (환경별 설정)
    const isProduction = process.env.NODE_ENV === 'production';

    // Mobile 토큰 만료 시간
    this.accessTokenExpiry = isProduction
      ? (process.env.JWT_ACCESS_EXPIRY_PROD || '1h')
      : (process.env.JWT_ACCESS_EXPIRY_DEV || '15s');
    this.refreshTokenExpiry = isProduction
      ? (process.env.JWT_REFRESH_EXPIRY_PROD || '7d')
      : (process.env.JWT_REFRESH_EXPIRY_DEV || '365d');

    // Store 토큰 만료 시간
    this.storeTokenExpiry = isProduction
      ? (process.env.JWT_STORE_EXPIRY_PROD || '8h')
      : (process.env.JWT_STORE_EXPIRY_DEV || '10s');

    // Admin 토큰 만료 시간
    this.adminTokenExpiry = isProduction
      ? (process.env.JWT_ADMIN_EXPIRY_PROD || '8h')
      : (process.env.JWT_ADMIN_EXPIRY_DEV || '24h');

    // Audience 설정 (환경변수에서 가져오기)                        // 클라이언트별 audience
    this.mobileAudience = process.env.JWT_MOBILE_AUDIENCE || 'mobile';
    this.storeAudience = process.env.JWT_STORE_AUDIENCE || 'store';
    this.adminAudience = process.env.JWT_ADMIN_AUDIENCE || 'admin';

    // 블랙리스트 관리                                              // 무효화된 토큰 추적
    this.blacklistedTokens = new Set();
    this.cache = options.cache;

    // JWT 설정                                                     // 토큰 생성 옵션
    this.config = {
      algorithm: 'HS256',                                          // HMAC SHA256 알고리즘
      issuer: 'template',                                       // 발급자
      audience: [this.mobileAudience, this.storeAudience, 'admin'], // 대상 클라이언트
      ...options
    };
  }

  /**
   * 환경변수 검증
   */
  validateSecrets() {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is required');
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET is required');
    }
  }

  /**
   * 액세스 토큰 생성
   */
  generateAccessToken(payload, options = {}) {                      // 짧은 수명 인증 토큰
    const tokenPayload = {
      ...payload,
      type: 'access',
      jti: crypto.randomBytes(16).toString('hex'),                 // 고유 토큰 ID
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(tokenPayload, this.accessTokenSecret, {
      expiresIn: options.expiresIn || this.accessTokenExpiry,
      algorithm: this.config.algorithm,
      issuer: this.config.issuer,
      audience: options.audience || this.config.audience[0],
      ...options
    });
  }

  /**
   * 리프레시 토큰 생성
   */
  generateRefreshToken(payload, options = {}) {                     // 긴 수명 갱신 토큰
    const tokenPayload = {
      ...payload,
      type: 'refresh',
      jti: crypto.randomBytes(16).toString('hex'),
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(tokenPayload, this.refreshTokenSecret, {
      expiresIn: options.expiresIn || this.refreshTokenExpiry,
      algorithm: this.config.algorithm,
      issuer: this.config.issuer,
      audience: options.audience || this.config.audience[0],
      ...options
    });
  }

  /**
   * 점주용 토큰 생성
   */
  generateStoreTokens(storeAccount) {                               // 점주 전용 토큰 쌍
    const payload = {
      id: storeAccount.id,
      storeId: storeAccount.storeId,
      role: storeAccount.role,
      permissions: storeAccount.permissions || [],
      clientType: 'store'  // AuthMiddleware에서 사용하는 필수 필드 추가
    };

    return {
      accessStoreToken: this.generateAccessToken(payload, {
        audience: this.storeAudience,
        expiresIn: this.storeTokenExpiry
      }),
      refreshStoreToken: this.generateRefreshToken(payload, {
        audience: this.storeAudience
      })
    };
  }

  /**
   * 고객용 토큰 생성
   */
  generateCustomerTokens(user) {                                    // 고객 전용 토큰 쌍
    const payload = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: 'CUSTOMER',
      clientType: 'mobile'  // AuthMiddleware에서 사용하는 필수 필드 추가
    };

    return {
      accessToken: this.generateAccessToken(payload, {
        audience: this.mobileAudience
      }),
      refreshToken: this.generateRefreshToken(payload, {
        audience: this.mobileAudience
      })
    };
  }

  /**
   * 슈퍼관리자용 토큰 생성
   */
  generateAdminTokens(adminAccount) {                               // 관리자 전용 토큰 쌍
    const payload = {
      id: adminAccount.id,
      email: adminAccount.email,
      role: adminAccount.role,
      permissions: adminAccount.permissions || [],
      clientType: 'admin'  // AuthMiddleware에서 사용하는 필수 필드 추가
    };

    return {
      accessAdminToken: this.generateAccessToken(payload, {
        audience: this.adminAudience,
        expiresIn: this.adminTokenExpiry
      }),
      refreshAdminToken: this.generateRefreshToken(payload, {
        audience: this.adminAudience
      })
    };
  }

  /**
   * 토큰 검증
   */
  async verifyToken(token, options = {}) {                          // 토큰 유효성 검사
    try {
      // 블랙리스트 확인                                            // 무효화 여부 체크
      if (await this.isBlacklisted(token)) {
        throw new Error('Token has been revoked');
      }

      // 시크릿 선택                                                // 토큰 타입별 시크릿
      const secret = options.isRefresh ? this.refreshTokenSecret :
                     options.isStore ? this.storeTokenSecret :
                     this.accessTokenSecret;

      // 토큰 검증                                                  // JWT 서명 검증
      const decoded = jwt.verify(token, secret, {
        algorithms: [this.config.algorithm],
        issuer: this.config.issuer,
        audience: options.audience || this.config.audience,
        ...options
      });

      // 타입 확인                                                  // 토큰 타입 검증
      if (options.isRefresh && decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      if (!options.isRefresh && decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      // JWT 에러를 그대로 전달하여 상위에서 구분 가능하도록 함
      if (error.name === 'TokenExpiredError') {
        const expiredError = new Error('Token has expired');
        expiredError.name = 'TokenExpiredError';
        throw expiredError;
      }
      if (error.name === 'JsonWebTokenError') {
        const invalidError = new Error('Invalid token');
        invalidError.name = 'JsonWebTokenError';
        throw invalidError;
      }
      throw error;
    }
  }

  /**
   * 토큰 갱신
   */
  async refreshTokens(refreshToken, options = {}) {                 // 새 토큰 쌍 발급
    const decoded = await this.verifyToken(refreshToken, {
      isRefresh: true,
      ...options
    });

    // 기존 리프레시 토큰 블랙리스트                                // 재사용 방지
    await this.blacklistToken(refreshToken);

    // 새 토큰 생성                                                 // 갱신된 토큰 쌍
    const payload = {
      id: decoded.id,
      email: decoded.email,
      phone: decoded.phone,
      storeId: decoded.storeId,
      role: decoded.role,
      permissions: decoded.permissions,
      clientType: decoded.clientType  // 기존 토큰의 clientType 유지
    };

    // JWT 표준 클레임은 'aud'임 (audience가 아님)
    const aud = decoded.aud;
    const isStoreAud = Array.isArray(aud) ? aud.includes(this.storeAudience) : aud === this.storeAudience;

    // clientType 또는 audience로 클라이언트 타입 판단
    if (options.isStore || isStoreAud || payload.clientType === 'store') {
      return this.generateStoreTokens(payload);
    } else {
      return this.generateCustomerTokens(payload);
    }
  }

  /**
   * 토큰 무효화
   */
  async blacklistToken(token) {                                     // 토큰 강제 무효화
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.jti) return;

      const key = `blacklist:${decoded.jti}`;
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);

      if (this.cache) {
        // Redis 사용                                               // 분산 환경 지원
        await this.cache.setex(key, ttl, '1');
      } else {
        // 메모리 사용                                              // 단일 서버 환경
        this.blacklistedTokens.add(decoded.jti);
        setTimeout(() => {
          this.blacklistedTokens.delete(decoded.jti);
        }, ttl * 1000);
      }
    } catch (error) {
      console.error('Failed to blacklist token:', error);
    }
  }

  /**
   * 블랙리스트 확인
   */
  async isBlacklisted(token) {                                      // 무효화 여부 확인
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.jti) return false;

      if (this.cache) {
        const exists = await this.cache.exists(`blacklist:${decoded.jti}`);
        return exists === 1;
      } else {
        return this.blacklistedTokens.has(decoded.jti);
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * 토큰에서 사용자 정보 추출
   */
  extractUserInfo(token) {                                          // 페이로드 추출
    try {
      const decoded = jwt.decode(token);
      if (!decoded) return null;

      return {
        id: decoded.id,
        email: decoded.email,
        phone: decoded.phone,
        storeId: decoded.storeId,
        role: decoded.role,
        permissions: decoded.permissions || [],
        audience: decoded.aud,
        expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : null
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 토큰 남은 시간 확인
   */
  getTokenRemainingTime(token) {                                    // TTL 계산
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) return 0;

      const remaining = decoded.exp - Math.floor(Date.now() / 1000);
      return Math.max(0, remaining);
    } catch (error) {
      return 0;
    }
  }
}

// 싱글톤 인스턴스                                                   // 전역 JWT 관리자
const jwtManager = new JWTManager();

export default jwtManager;
export { JWTManager };