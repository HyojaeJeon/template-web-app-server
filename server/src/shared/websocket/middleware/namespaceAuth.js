/**
 * Socket.IO 네임스페이스별 권한 관리 미들웨어
 * 
 * 각 네임스페이스별로 접근 권한을 체계적으로 관리하며,
 * 사용자 역할과 권한에 따라 실시간 이벤트 접근을 제어합니다.
 */

import jwt from 'jsonwebtoken';
import { Logger } from '../../utils/utilities/Logger.js';
import models from '../../../models/index.js';

const logger = new Logger('SocketAuth');
const { User, Store, StoreAccount, StoreStaff } = models;

// 연결 시도 Rate Limiting을 위한 Map
const connectionAttempts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1분
const MAX_CONNECTION_ATTEMPTS = 10; // 1분당 최대 10회 연결 시도

// 블랙리스트된 토큰들 (로그아웃된 토큰 등)
const tokenBlacklist = new Set();

// 주기적으로 오래된 연결 시도 기록 정리
setInterval(() => {
  const now = Date.now();
  for (const [key, attempts] of connectionAttempts.entries()) {
    const validAttempts = attempts.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    if (validAttempts.length === 0) {
      connectionAttempts.delete(key);
    } else {
      connectionAttempts.set(key, validAttempts);
    }
  }
}, RATE_LIMIT_WINDOW);

/**
 * 네임스페이스별 권한 정의
 */
const NAMESPACE_PERMISSIONS = {
  '/main': {
    roles: ['OWNER', 'MANAGER', 'STAFF', 'CUSTOMER'],
    requireStore: false,
    requireAuth: true,
    events: {
      'ping': ['OWNER', 'MANAGER', 'STAFF', 'CUSTOMER'],
      'pong': ['OWNER', 'MANAGER', 'STAFF', 'CUSTOMER']
    }
  },
  
  '/notifications': {
    roles: ['OWNER', 'MANAGER', 'STAFF', 'CUSTOMER'],
    requireStore: true,
    events: {
      'notification:new': ['OWNER', 'MANAGER', 'STAFF'],
      'notification:status_changed': ['OWNER', 'MANAGER', 'STAFF'],
      'notification:deleted': ['OWNER', 'MANAGER'],
      'notifications:bulk_updated': ['OWNER', 'MANAGER']
    }
  },
  
  '/orders': {
    roles: ['OWNER', 'MANAGER', 'STAFF', 'KITCHEN'],
    requireStore: true,
    events: {
      'order:new': ['OWNER', 'MANAGER', 'STAFF', 'KITCHEN'],
      'order:status_updated': ['OWNER', 'MANAGER', 'STAFF', 'KITCHEN'],
      'order:pos_status_changed': ['OWNER', 'MANAGER'],
      'order:batch_updated': ['OWNER', 'MANAGER'],
      'order:metrics_updated': ['OWNER', 'MANAGER'],
      'order:delivery_updated': ['OWNER', 'MANAGER', 'STAFF'],
      'order:payment_updated': ['OWNER', 'MANAGER']
    }
  },
  
  '/chat': {
    roles: ['OWNER', 'MANAGER', 'STAFF', 'SUPPORT'],
    requireStore: true,
    events: {
      'chat:message_new': ['OWNER', 'MANAGER', 'STAFF', 'SUPPORT'],
      'chat:typing': ['OWNER', 'MANAGER', 'STAFF', 'SUPPORT'],
      'chat:user_online_status': ['OWNER', 'MANAGER', 'STAFF'],
      'chat:room_created': ['OWNER', 'MANAGER', 'STAFF'],
      'chat:room_closed': ['OWNER', 'MANAGER'],
      'chat:message_read': ['OWNER', 'MANAGER', 'STAFF', 'SUPPORT'],
      'chat:support_joined': ['OWNER', 'MANAGER', 'STAFF']
    }
  },
  
  '/pos': {
    roles: ['OWNER', 'MANAGER', 'POS_OPERATOR'],
    requireStore: true,
    requirePosIntegration: true,
    events: {
      'pos:sync': ['OWNER', 'MANAGER', 'POS_OPERATOR'],
      'pos:status': ['OWNER', 'MANAGER', 'POS_OPERATOR'],
      'pos:error': ['OWNER', 'MANAGER'],
      'pos:heartbeat': ['OWNER', 'MANAGER', 'POS_OPERATOR']
    }
  },
  
  '/delivery': {
    roles: ['OWNER', 'MANAGER', 'STAFF', 'DRIVER'],
    requireStore: false,
    events: {
      'delivery:assigned': ['OWNER', 'MANAGER', 'STAFF', 'DRIVER'],
      'delivery:started': ['OWNER', 'MANAGER', 'STAFF', 'DRIVER'],
      'delivery:location_updated': ['OWNER', 'MANAGER', 'DRIVER'],
      'delivery:completed': ['OWNER', 'MANAGER', 'STAFF', 'DRIVER'],
      'delivery:failed': ['OWNER', 'MANAGER', 'DRIVER']
    }
  },
  
  '/analytics': {
    roles: ['OWNER', 'MANAGER'],
    requireStore: true,
    events: {
      'analytics:realtime': ['OWNER', 'MANAGER'],
      'analytics:daily_summary': ['OWNER', 'MANAGER'],
      'analytics:alert': ['OWNER', 'MANAGER']
    }
  },
  
  '/admin': {
    roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN'],
    requireStore: false,
    requireAdmin: true,
    events: {
      'admin:system_status': ['SYSTEM_ADMIN', 'SUPER_ADMIN'],
      'admin:store_activity': ['SYSTEM_ADMIN', 'SUPER_ADMIN'],
      'admin:error_log': ['SYSTEM_ADMIN', 'SUPER_ADMIN']
    }
  }
};

/**
 * Rate Limiting 검증
 */
function checkRateLimit(clientIp) {
  const now = Date.now();
  const clientKey = clientIp;
  
  if (!connectionAttempts.has(clientKey)) {
    connectionAttempts.set(clientKey, []);
  }
  
  const attempts = connectionAttempts.get(clientKey);
  
  // 오래된 시도 기록 정리
  const validAttempts = attempts.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  connectionAttempts.set(clientKey, validAttempts);
  
  // 최대 시도 횟수 확인
  if (validAttempts.length >= MAX_CONNECTION_ATTEMPTS) {
    logger.warn(`Rate limit exceeded for IP: ${clientIp}`);
    return false;
  }
  
  // 새 시도 기록
  validAttempts.push(now);
  connectionAttempts.set(clientKey, validAttempts);
  
  return true;
}

/**
 * JWT 토큰 검증 및 사용자 정보 추출 (모바일 고객용)
 */
async function verifyTokenMobile(token) {
  try {
    if (!token) {
      throw new Error('No token provided');
    }

    // 토큰 블랙리스트 확인
    if (tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 디버깅을 위한 토큰 정보 로깅
    const now = Date.now();
    const exp = decoded.exp * 1000;
    logger.info(`Token verification (Mobile): exp=${new Date(exp).toISOString()}, now=${new Date(now).toISOString()}, remaining=${Math.floor((exp - now) / 1000)}s`);

    // User 테이블에서 고객 정보 조회 (안전한 쿼리 사용)
    let user = null;
    try {
      const results = await User.sequelize.query(
        'SELECT id, phone, email, fullName, role, status, deletedAt FROM Users WHERE id = ? AND deletedAt IS NULL',
        {
          replacements: [decoded.userId || decoded.id],
          type: User.sequelize.QueryTypes.SELECT
        }
      );
      user = results[0]; // 첫 번째 결과 사용

      logger.debug("Mobile user query result:", {
        userId: decoded.userId || decoded.id,
        found: !!user,
        userRole: user?.role
      });
    } catch (queryError) {
      logger.error('User query failed in token verification:', queryError);
      throw new Error('Database query failed');
    }

    if (!user) {
      throw new Error('User not found');
    }
    
    // 사용자 상태 확인
    if (user.status && user.status !== 'ACTIVE') {
      throw new Error(`User account is ${user.status.toLowerCase()}`);
    }
    
    // 사용자 계정 검증
    if (user.deletedAt) {
      throw new Error('User account has been deleted');
    }
    
    logger.info(`Mobile user verified: ${user.id} - ${user.phone}`);
    return user;
  } catch (error) {
    logger.error('Mobile token verification failed:', error);
    throw new Error('Invalid token');
  }
}

/**
 * JWT 토큰 검증 및 사용자 정보 추출 (점주/직원용)
 */
async function verifyTokenStore(token) {
  try {
    if (!token) {
      throw new Error('No token provided');
    }
    
    // 토큰 블랙리스트 확인
    if (tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 디버깅을 위한 토큰 정보 로깅
    const now = Date.now();
    const exp = decoded.exp * 1000;
    logger.info(`Token verification (Store): exp=${new Date(exp).toISOString()}, now=${new Date(now).toISOString()}, remaining=${Math.floor((exp - now) / 1000)}s`);
    
    // StoreAccount 테이블에서 점주/직원 정보 조회
    const storeAccount = await StoreAccount.findByPk(decoded.storeAccountId, {
      include: [
        {
          model: Store,
          as: 'store',
          attributes: ['id', 'name', 'status', 'posIntegrated']
        }
      ]
    });
    
    if (!storeAccount) {
      throw new Error('Store account not found');
    }
    
    // 계정 상태 확인
    if (storeAccount.status && storeAccount.status !== 'ACTIVE') {
      throw new Error(`Store account is ${storeAccount.status.toLowerCase()}`);
    }
    
    // 계정 검증
    if (storeAccount.deletedAt) {
      throw new Error('Store account has been deleted');
    }
    
    logger.info(`Store user verified: ${storeAccount.id} - ${storeAccount.phone} - ${storeAccount.role}`);
    return storeAccount;
  } catch (error) {
    logger.error('Store token verification failed:', error);
    throw new Error('Invalid token');
  }
}

/**
 * 네임스페이스 접근 권한 확인
 */
function checkNamespaceAccess(namespace, user) {
  const permissions = NAMESPACE_PERMISSIONS[namespace];
  
  if (!permissions) {
    logger.warn(`Unknown namespace: ${namespace}`);
    return false;
  }
  
  // 필수 인증 확인
  if (permissions.requireAuth && !user) {
    logger.warn(`Authentication required for namespace: ${namespace}`);
    return false;
  }
  
  // 사용자 유효성 확인
  if (!user || !user.id) {
    logger.warn(`Invalid user trying to access namespace: ${namespace}`);
    return false;
  }
  
  // 역할 확인
  const userRole = user.storeRole || user.role || user.userType;
  if (!userRole || !permissions.roles.includes(userRole)) {
    logger.warn(`User ${user.id} with role ${userRole} denied access to ${namespace}`);
    return false;
  }
  
  // 매장 요구사항 확인
  if (permissions.requireStore && !user.storeId) {
    logger.warn(`User ${user.id} needs store association for ${namespace}`);
    return false;
  }
  
  // POS 통합 요구사항 확인
  if (permissions.requirePosIntegration) {
    const store = user.storeAccount?.store;
    if (!store || !store.posIntegrated) {
      logger.warn(`Store ${user.storeId} needs POS integration for ${namespace}`);
      return false;
    }
  }
  
  // 관리자 권한 요구사항 확인
  if (permissions.requireAdmin && !['SYSTEM_ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
    logger.warn(`User ${user.id} needs admin role for ${namespace}`);
    return false;
  }
  
  return true;
}

/**
 * 이벤트 권한 확인
 */
function checkEventPermission(namespace, eventName, user) {
  const permissions = NAMESPACE_PERMISSIONS[namespace];
  
  if (!permissions || !permissions.events) {
    return false;
  }
  
  const eventRoles = permissions.events[eventName];
  if (!eventRoles) {
    logger.warn(`Unknown event ${eventName} in namespace ${namespace}`);
    return false;
  }
  
  const userRole = user.storeRole || user.role;
  return eventRoles.includes(userRole);
}

/**
 * 네임스페이스 인증 미들웨어 생성
 */
export function createNamespaceAuth(namespace) {
  return async (socket, next) => {
    try {
      logger.info(`[SOCKET] Namespace auth started for ${namespace}`, {
        socketId: socket.id,
        hasAuth: !!socket.handshake.auth,
        authKeys: Object.keys(socket.handshake.auth || {}),
        hasToken: !!socket.handshake.auth?.token,
        userId: socket.handshake.auth?.userId,
        userType: socket.handshake.auth?.userType
      });

      // JWT 토큰이 있는 경우 검증
      const token = socket.handshake.auth?.token;
      const clientType = socket.handshake.auth?.clientType;
      
      if (token) {
        try {
          let user;
          // clientType and token intentionally not logged for security
          // 클라이언트 타입에 따라 다른 인증 방식 사용
          if (clientType === 'mobile' || clientType === 'customer') {
            // 모바일 고객용 인증 (User 테이블)
            user = await verifyTokenMobile(token);
            socket.userType = user.role || 'CUSTOMER';
            logger.info(`[SOCKET] Mobile token verification successful for ${namespace}`, {
              userId: user.id,
              phone: user.phone,
              role: user.role,
              socketId: socket.id
            });
          } else if (clientType === 'store' || clientType === 'store-admin') {
            // 점주/직원용 인증 (StoreAccount 테이블)
            user = await verifyTokenStore(token);
            socket.userType = user.role || 'STORE_OWNER';
            logger.info(`[SOCKET] Store token verification successful for ${namespace}`, {
              storeAccountId: user.id,
              phone: user.phone,
              role: user.role,
              socketId: socket.id
            });
          } else {
            // 기본값: 모바일 고객으로 처리
            user = await verifyTokenMobile(token);
            socket.userType = user.role || 'CUSTOMER';
            logger.info(`[SOCKET] Default (Mobile) token verification successful for ${namespace}`, {
              userId: user.id,
              phone: user.phone,
              role: user.role,
              socketId: socket.id
            });
          }

          // Socket에 사용자 정보 저장
          socket.user = user;
          socket.userId = user.id;
          socket.storeId = user.storeId; // storeId도 직접 저장 (null safety용)

          // 토큰 갱신 여부 표시 (EventLogger에서 참조)
          socket.tokenRefresh = socket.handshake.auth?.tokenRefresh || false;
          
        } catch (tokenError) {
          // 토큰 검증 실패 시에도 기본 정보는 설정 (EventLogger null 방지)
          socket.userId = socket.handshake.auth?.userId || null;
          socket.storeId = socket.handshake.auth?.storeId || null;
          socket.tokenRefresh = socket.handshake.auth?.tokenRefresh || false;

          logger.error(`[SOCKET] Token verification failed for ${namespace}:`, {
            error: tokenError.message,
            socketId: socket.id,
            clientType: clientType,
            userId: socket.userId,
            // token redacted
          });
          return next(new Error('Authentication failed'));
        }
      }
      
      // 기본 정보 설정
      socket.namespace = namespace;
      
      logger.info(`[SOCKET] Namespace connection allowed: ${namespace}`, {
        socketId: socket.id,
        namespace: namespace,
        userId: socket.userId,
        userType: socket.userType
      });
      
      next(); // 인증 성공
      
    } catch (error) {
      logger.error(`[SOCKET] Namespace connection failed for ${namespace}:`, error);
      next(new Error('Connection failed'));
    }
  };
}

/**
 * 토큰 블랙리스트 관리 함수들
 */
export function revokeToken(token) {
  tokenBlacklist.add(token);
  logger.info('Token has been revoked');
}

export function isTokenRevoked(token) {
  return tokenBlacklist.has(token);
}

/**
 * 이벤트 권한 검증 미들웨어
 */
export function eventAuthMiddleware(eventName) {
  return (socket, next) => {
    if (!socket.user || !socket.namespace) {
      return next(new Error('Not authenticated'));
    }
    
    if (!checkEventPermission(socket.namespace, eventName, socket.user)) {
      logger.warn(`User ${socket.user.id} denied access to event ${eventName}`);
      return next(new Error('Permission denied for event'));
    }
    
    next();
  };
}

/**
 * 동적 룸 권한 확인
 */
export function checkRoomAccess(socket, room) {
  // 매장 룸 접근 확인
  if (room.startsWith('store_')) {
    const storeId = room.replace('store_', '');
    return socket.user.storeId === storeId;
  }
  
  // 주문 룸 접근 확인
  if (room.startsWith('order_')) {
    // 매장 소속 확인 필요
    return !!socket.user.storeId;
  }
  
  // 채팅 룸 접근 확인
  if (room.startsWith('chat_')) {
    // 채팅 권한 확인
    return ['OWNER', 'MANAGER', 'STAFF', 'SUPPORT'].includes(socket.user.storeRole || socket.user.role);
  }
  
  return false;
}

/**
 * 네임스페이스별 권한 정보 조회
 */
export function getNamespacePermissions(namespace) {
  return NAMESPACE_PERMISSIONS[namespace] || null;
}

/**
 * 사용자의 접근 가능한 네임스페이스 목록 조회
 */
export function getUserNamespaces(user) {
  const userRole = user.storeRole || user.role;
  const accessibleNamespaces = [];
  
  Object.entries(NAMESPACE_PERMISSIONS).forEach(([namespace, permissions]) => {
    if (permissions.roles.includes(userRole)) {
      // 추가 조건 확인
      if (permissions.requireStore && !user.storeId) return;
      if (permissions.requireAdmin && !['SYSTEM_ADMIN', 'SUPER_ADMIN'].includes(userRole)) return;
      if (permissions.requirePosIntegration && (!user.storeAccount?.store || !user.storeAccount.store.posIntegrated)) return;
      
      accessibleNamespaces.push(namespace);
    }
  });
  
  return accessibleNamespaces;
}

export default {
  createNamespaceAuth,
  eventAuthMiddleware,
  checkRoomAccess,
  getNamespacePermissions,
  getUserNamespaces,
  NAMESPACE_PERMISSIONS
};
