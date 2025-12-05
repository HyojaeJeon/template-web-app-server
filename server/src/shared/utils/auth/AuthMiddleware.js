/**
 * 통합 인증 미들웨어
 * JWT 토큰 검증 및 사용자 인증 처리
 *
 * 기존 middleware/auth.js의 기능을 auth 폴더로 통합
 * Mobile과 Store 클라이언트 모두 지원
 *
 * 보안 강화 (2025-01-15):
 * - JWT 알고리즘 검증 추가
 * - 토큰 발행자(issuer) 및 대상(audience) 검증
 * - 환경 변수 필수 검증
 * - clientType 명확한 정의
 */

import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { promisify } from 'util';
// db 모델 import
import db from '../../../models/index.js';
const { User } = db;

// JWT verify를 Promise로 변환
const verifyAsync = promisify(jwt.verify);

// JWT 설정 검증
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || 'template';
const JWT_MOBILE_AUDIENCE = process.env.JWT_MOBILE_AUDIENCE || 'mobile';
const JWT_STORE_AUDIENCE = process.env.JWT_STORE_AUDIENCE || 'store';
const JWT_ADMIN_AUDIENCE = process.env.JWT_ADMIN_AUDIENCE || 'admin';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for security');
}

/**
 * Authorization 헤더에서 JWT 토큰 추출 및 검증
 * @param {Object} req - Express request 객체
 * @param {string} clientType - 클라이언트 타입 ('mobile' | 'store')
 * @returns {Object|null} 인증된 사용자 정보 또는 null
 */
export async function getUser(req, clientType = null) {
  try {
    // clientType 결정 (우선순위: 파라미터 > 헤더 > 토큰 클레임)
    if (!clientType) {
      clientType = req.headers['x-client-type'] || req.headers['client-type'];
    }

    // Authorization 헤더에서 토큰 추출
    const authorization = req.headers.authorization || '';

    if (!authorization) {
      console.log('[AuthMiddleware] No authorization header');
      return null;
    }

    // Bearer 토큰 형식 확인 (더 엄격한 검증)
    if (!authorization.startsWith('Bearer ')) {
      console.log('[AuthMiddleware] Invalid authorization format');
      return null;
    }

    const token = authorization.substring(7).trim();

    if (!token) {
      console.log('[AuthMiddleware] Empty token');
      return null;
    }

    // JWT 토큰 초기 디코딩 (clientType 확인용)
    const preliminaryDecoded = jwt.decode(token);
    // 로그 제거 - 토큰 디코딩은 정상 수행

    // clientType 최종 결정 (토큰 클레임에서)
    if (!clientType && preliminaryDecoded) {
      clientType = preliminaryDecoded.clientType ||
                  (preliminaryDecoded.storeId ? 'store' : 'mobile');
    }

    // clientType이 여전히 없으면 기본값 설정 (토큰이 있으면 mobile 가정)
    if (!clientType) {
      console.log('[AuthMiddleware] Client type not found, defaulting to mobile');
      clientType = 'mobile';  // 기본값 설정
    }

    // audience 결정 (clientType 기반)
    let expectedAudience;
    if (clientType === 'admin') {
      expectedAudience = JWT_ADMIN_AUDIENCE;
    } else if (clientType === 'store') {
      expectedAudience = JWT_STORE_AUDIENCE;
    } else {
      expectedAudience = JWT_MOBILE_AUDIENCE;
    }

    console.log('[AuthMiddleware] Verification params:', {
      clientType,
      expectedAudience,
      JWT_ISSUER,
      algorithm: 'HS256'
    });

    // JWT 토큰 검증 (보안 옵션 포함)
    let decoded;
    try {
      decoded = await verifyAsync(token, JWT_SECRET, {
        algorithms: ['HS256'],  // 허용된 알고리즘만
        issuer: JWT_ISSUER,     // 발행자 검증
        audience: expectedAudience, // 대상 검증
        clockTolerance: 0       // ⚡ 시간 오차 허용 안함 (정확한 만료 체크)
      });

      console.log('[AuthMiddleware] Token verified successfully:', {
        userId: decoded?.id,
        phone: decoded?.phone,
        clientType: decoded?.clientType
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        // ⚡ 토큰 만료 시 isExpired 객체 반환 (Context에서 처리)
        // GraphQLError를 던지면 Apollo errorLink가 감지 못함
        console.log('[AuthMiddleware] 🔴 Token expired (TokenExpiredError)');
        console.log('[AuthMiddleware] Error details:', err.message, 'expiredAt:', err.expiredAt);

        return {
          isExpired: true,
          error: 'TOKEN_EXPIRED',
          message: err.message,
          clientType: clientType
        };
      }
      if (err.name === 'JsonWebTokenError') {
        // 잘못된 토큰은 null 반환
        console.log('[AuthMiddleware] Invalid JWT token:', err.message);
        return null;
      }
      throw err;
    }

    // 동적 import로 순환 참조 방지
    const db = await import('../../../models/index.js').then(m => m.default);

    // 클라이언트 타입에 따라 명확하게 구분하여 처리
    switch (clientType) {
      case 'admin': {
        // Admin 클라이언트 (관리자 패널) - adminAccountId 필수
        if (!decoded.id) {
          throw new GraphQLError('Invalid admin token - missing id', {
            extensions: {
              code: 'A2003',  // Admin 에러 코드 사용
              http: { status: 401 }
            }
          });
        }

        // Admin 토큰 검증 - role이 관리자여야 함
        const validAdminRoles = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'ANALYST'];
        if (!decoded.role || !validAdminRoles.includes(decoded.role)) {
          throw new GraphQLError('Invalid admin token - invalid role', {
            extensions: {
              code: 'A2004',
              http: { status: 401 }
            }
          });
        }

        const adminAccount = await db.AdminAccount.findByPk(decoded.id);
        if (!adminAccount) {
          return null;
        }

        return {
          id: adminAccount.id,
          role: decoded.role,
          email: adminAccount.email,
          fullName: adminAccount.fullName,
          permissions: decoded.permissions || [],
          isAdminAccount: true
        };
      }
      case 'store': {
        // Store 클라이언트 (점주앱) - storeId 필수
        if (!decoded.storeId) {
          throw new GraphQLError('Invalid store token - missing storeId', {
            extensions: {
              code: 'S2003',  // Store 에러 코드 사용
              http: { status: 401 }
            }
          });
        }

        // 추가 검증: Store 토큰에 userId가 있으면 잘못된 토큰
        if (decoded.userId && !decoded.storeAccountId) {
          throw new GraphQLError('Invalid store token - wrong token type', {
            extensions: {
              code: 'S2004',
              http: { status: 401 }
            }
          });
        }

        const storeAccount = await db.StoreAccount.findByPk(decoded.id);
        if (!storeAccount) {
          return null;
        }

        return {
          id: storeAccount.id,
          storeId: decoded.storeId,
          role: decoded.role || 'STORE_STAFF',
          email: storeAccount.email,
          phone: storeAccount.phone,
          fullName: storeAccount.fullName,
          permissions: decoded.permissions || [],
          isStoreAccount: true
        };
      }
      case 'mobile': {
        // Mobile 클라이언트 (App) - storeId 없어야 함
        if (decoded.storeId || decoded.storeAccountId) {
          throw new GraphQLError('Invalid mobile token - wrong token type', {
            extensions: {
              code: 'M2003',  // Mobile 에러 코드 사용
              http: { status: 401 }
            }
          });
        }

        // 추가 검증: 모바일 토큰 role은 CUSTOMER여야 함
        if (decoded.role && decoded.role !== 'CUSTOMER') {
          throw new GraphQLError('Invalid mobile token - wrong role', {
            extensions: {
              code: 'M2004',
              http: { status: 401 }
            }
          });
        }

        const user = await User.findByPk(decoded.id);
        if (!user) {
          return null;
        }

        return {
          id: user.id,
          phone: user.phone,
          email: user.email,
          fullName: user.fullName,
          phoneVerified: user.phoneVerified,
          preferredLanguage: user.preferredLanguage,
          role: 'CUSTOMER',
          isStoreAccount: false
        };
      }
      default: {
        // 알 수 없는 클라이언트 타입 - 보안상 거부
        throw new GraphQLError(`Unknown client type: ${clientType}`, {
          extensions: {
            code: 'UNKNOWN_CLIENT_TYPE',
            http: { status: 400 },
            clientType
          }
        });
      }
    }
  } catch (error) {
    // GraphQL 에러는 그대로 전파
    if (error instanceof GraphQLError) {
      throw error;
    }

    // JWT 검증 실패 (이미 처리된 경우)
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      // 이미 위에서 처리됨
      throw error;
    }

    // 기타 에러는 로깅 후 null 반환 (인증되지 않은 사용자로 처리)
    // 보안상 상세 에러 정보는 로그에만 기록
    if (process.env.NODE_ENV === 'development') {
      console.error('Authentication error:', error);
    } else {
      console.error('Authentication error:', error.message);
    }

    return null;
  }
}

/**
 * Store 계정 전용 인증 미들웨어
 * @param {Object} req - Express request 객체
 * @returns {Object|null} Store 계정 정보 또는 null
 */
export async function getStoreAccount(req) {
  // Store 클라이언트임을 명시
  const user = await getUser(req, 'store');

  if (!user || !user.isStoreAccount) {
    return null;
  }

  return user;
}

/**
 * Mobile 사용자 전용 인증 미들웨어
 * @param {Object} req - Express request 객체
 * @returns {Object|null} Mobile 사용자 정보 또는 null
 */
export async function getMobileUser(req) {
  // Mobile 클라이언트임을 명시
  const user = await getUser(req, 'mobile');

  if (!user || user.isStoreAccount) {
    return null;
  }

  return user;
}

/**
 * GraphQL Context에 사용자 정보 추가
 * Apollo Server context 함수에서 사용
 * @param {Object} params - Apollo Server context 파라미터
 * @param {Object} params.req - Express request 객체
 * @returns {Object} GraphQL context 객체
 */
export async function createAuthContext({ req }) {
  // clientType을 헤더에서 추출 (GraphQL 요청의 경우)
  const clientType = req.headers['x-client-type'] ||
                    req.headers['client-type'] ||
                    null;

  const user = await getUser(req, clientType);

  // 언어 설정 (우선순위: 헤더 > 유저 설정 > 기본값)
  const language = req.headers['accept-language']?.split(',')[0]?.split('-')[0] ||
                  user?.preferredLanguage ||
                  'vi';

  return {
    user,
    storeAccount: user?.isStoreAccount ? user : null,
    mobileUser: !user?.isStoreAccount ? user : null,
    language,
    clientType: user ? (user.isStoreAccount ? 'store' : 'mobile') : null
  };
}

// 하위 호환성을 위한 default export
export default {
  getUser,
  getStoreAccount,
  getMobileUser,
  createAuthContext
};