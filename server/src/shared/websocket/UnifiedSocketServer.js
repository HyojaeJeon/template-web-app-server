/**
 * 완전한 Socket.IO 실시간 통신 서버
 * GraphQL Subscription 완전 제거 후 Socket.IO 전용 시스템
 *
 * Local 음식 App을 위한 통합 실시간 통신 시스템:
 * - Mobile 클라이언트 (고객 앱)
 * - Store 클라이언트 (점주 웹앱)
 */

import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { buildSocketCors } from '../config/cors.js';
import loggerDefault from '../utils/utilities/Logger.js';
import db from '../../models/index.js';
import WebSocketManager from './WebSocketManager.js';
import MobileSocketManager from './MobileSocketManager.js';
import WebOnlineStatusService from './services/WebOnlineStatusService.js';
import { kv } from '../cache/kv.js';
import { redisClient, redisPub as redisPubClient, redisSub as redisSubClient } from '../../config/redis.js';
import eventLogger from './services/EventLogger.js';

/**
 * Socket.IO 전용 실시간 이벤트 정의
 * GraphQL Subscription 완전 대체
 */
export const SOCKET_EVENTS = {
  // 주문 관련 이벤트
  ORDER_STATUS_CHANGED: 'order:status_changed',
  ORDER_CONFIRMED: 'order:confirmed',
  ORDER_PREPARING: 'order:preparing',
  ORDER_READY: 'order:ready',
  ORDER_PICKED_UP: 'order:picked_up',
  ORDER_DELIVERED: 'order:delivered',
  ORDER_CANCELLED: 'order:cancelled',

  // 배달 추적 이벤트
  DELIVERY_LOCATION_UPDATE: 'delivery:location_update',
  DELIVERY_ETA_UPDATE: 'delivery:eta_update',
  DELIVERY_STARTED: 'delivery:started',
  DELIVERY_COMPLETED: 'delivery:completed',

  // 채팅 이벤트
  CHAT_MESSAGE_RECEIVED: 'chat:message:new',  // 점주앱과 통일: chat:message:new
  CHAT_MESSAGE_SENT: 'chat:message_sent',
  CHAT_TYPING: 'chat:typing',
  CHAT_ROOM_JOINED: 'chat:room_joined',
  CHAT_ROOM_LEFT: 'chat:room_left',

  // 알림 이벤트
  NOTIFICATION_RECEIVED: 'notification:received',
  NOTIFICATION_READ: 'notification:read',
  PROMOTION_ALERT: 'promotion:alert',

  // 쿠폰 관련 이벤트 (실시간 쿠폰 시스템)
  COUPON_NEW: 'coupon:new',                    // 새 쿠폰 발급 알림
  COUPON_USED: 'coupon:used',                  // 쿠폰 사용 즉시 반영
  COUPON_EXPIRED: 'coupon:expired',            // 쿠폰 만료 알림
  COUPON_ANALYTICS_UPDATE: 'coupon:analytics_update',  // 쿠폰 성과 실시간 업데이트
  COUPON_BULK_CREATED: 'coupon:bulk_created',  // 대량 쿠폰 생성 완료
  COUPON_STATUS_CHANGED: 'coupon:status_changed', // 쿠폰 활성화/비활성화
  COUPON_DISCOUNT_APPLIED: 'coupon:discount_applied', // 할인 적용 완료

  // 시스템 이벤트
  SYSTEM_ALERT: 'system:alert',
  MAINTENANCE_NOTICE: 'system:maintenance',
  CONNECTION_STATUS: 'system:connection_status',

  // POS 시스템 이벤트
  POS_ORDER_RECEIVED: 'pos:order_received',
  POS_ORDER_CONFIRMED: 'pos:order_confirmed',
  POS_STATUS_CHANGED: 'pos:status_changed',
  POS_CONNECTION_STATUS: 'pos:connection_status',

  // 점주 전용 이벤트
  STORE_NEW_ORDER: 'store:new_order',
  STORE_NOTIFICATION: 'store:notification',
  STORE_ANALYTICS_UPDATE: 'store:analytics_update',

  // 메뉴 재고 관련 이벤트
  MENU_STOCK_OUT: 'menu:stock_out',           // 메뉴 재고 품절 (자동 숨김)
  MENU_LOW_STOCK: 'menu:low_stock',           // 메뉴 재고 부족 경고
  MENU_RESTOCKED: 'menu:restocked',           // 메뉴 재고 복구 (자동 활성화)
  MENU_STOCK_UPDATED: 'menu:stock_updated'    // 메뉴 재고 변경
};

// === 고객 앱 이벤트는 MobileSocketManager.js로 이동됨 ===

/**
 * 점주 앱 수신 이벤트 정의
 */
export const STORE_EVENTS = {
  // 주문 관련
  'new_order': {
    key: 'STORE_NEW_ORDER',
    messageKo: '새 주문이 들어왔습니다',
    messageVi: 'Có đơn hàng mới',
    messageEn: 'New order received'
  },
  'order_cancelled': {
    key: 'ORDER_CANCELLED',
    messageKo: '주문이 취소되었습니다',
    messageVi: 'Đơn hàng đã bị hủy',
    messageEn: 'Order has been cancelled'
  },
  // 채팅 관련
  'chat_notification': {
    key: 'CHAT_MESSAGE_NEW',  // 이벤트명 통일
    messageKo: '고객 메시지가 도착했습니다',
    messageVi: 'Tin nhắn từ khách hàng đã đến',
    messageEn: 'Customer message received'
  },
  // 시스템 관련
  'pos_status_changed': {
    key: 'POS_STATUS_CHANGED',
    messageKo: 'POS 연결 상태 변경',
    messageVi: 'Thay đổi trạng thái kết nối POS',
    messageEn: 'POS connection status changed'
  }
};

const logger = loggerDefault;
const { User, StoreAccount, Store, Order, Notification, ChatRoom, Payment } = db;

export class UnifiedSocketServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: buildSocketCors(),
      transports: ['polling', 'websocket'],  // polling 우선
      pingTimeout: 60000,
      pingInterval: 25000,
      connectTimeout: 45000,
      maxHttpBufferSize: 1e6,
      allowEIO3: true
    });

    // Use centralized Redis client (config/redis.js)
    this.redis = redisClient;

    // Enable Socket.IO Redis adapter for horizontal scaling
    try {
      const pubClient = redisPubClient;
      const subClient = redisSubClient;
      this.io.adapter(createAdapter(pubClient, subClient));
    } catch (e) {
      logger.error('Failed to initialize Redis adapter', { error: e.message });
    }

    this.eventLogger = eventLogger;
    this.connections = new Map();

    // Socket Manager 초기화 (대칭적 구조)
    this.webSocketManager = new WebSocketManager(this);
    this.mobileSocketManager = new MobileSocketManager(this);

    // ✅ 점주 온라인 상태 추적 서비스 초기화
    this.webOnlineService = new WebOnlineStatusService(this.io);

    this.setupGlobalMiddleware();
    this.setupSocketHandlers();

    // 단일 소켓 구조로 변경 - 네임스페이스 초기화 불필요
    this.initializationPromise = Promise.resolve();

    // 연결 상태 모니터링 시작
    this.startConnectionMonitoring();

    logger.info('✅ Socket.IO 실시간 통신 서버 초기화 완료', {
      transport: ['polling', 'websocket'],
      namespace: 'unified',
      managers: ['Store', 'Mobile']
    });
  }

  /**
   * 서버 준비 완료 대기
   */
  async ready() {
    await this.initializationPromise;
    return this;
  }

  /**
   * Store Socket Manager 접근
   */
  getWebSocketManager() {
    return this.webSocketManager;
  }

  /**
   * 글로벌 미들웨어 설정
   */
  setupGlobalMiddleware() {
    // 기본 인증 미들웨어
    this.io.use(async (socket, next) => {
      try {
        const bypassAuth = process.env.SOCKET_AUTH_BYPASS === '1' && process.env.NODE_ENV === 'development';
        logger.info('🔌 New Socket connection attempt (단일 소켓 구조)', {
          id: socket.id,
          namespace: socket.nsp.name,
          clientType: socket.handshake.auth?.clientType,
          userId: socket.handshake.auth?.userId,
          storeId: socket.handshake.auth?.storeId,
          hasToken: !!socket.handshake.auth?.token,
          hasAuthHeader: !!socket.handshake.headers?.authorization,
          platform: socket.handshake.auth?.platform
        });

        // 개발 환경 헬스체크/로컬 테스트를 위한 인증 우회
        if (bypassAuth) {
          const clientType = socket.handshake.auth?.clientType || 'mobile';
          const rawUserId = socket.handshake.auth?.userId || 'dev-user';
          const rawStoreId = socket.handshake.auth?.storeId || null;

          socket.userId = rawUserId;
          socket.userType = clientType === 'store-admin' || clientType === 'store' ? 'STORE' : 'CUSTOMER';
          socket.storeId = rawStoreId;
          socket.userRole = 'STORE_MANAGER';

          // 사용자/매장 Room 가입
          if (socket.userId) socket.join(`user:${socket.userId}`);
          if (socket.storeId) socket.join(`store:${socket.storeId}`);

          logger.warn('⚠️ SOCKET_AUTH_BYPASS 활성화 - 인증 및 DB 조회 생략', {
            userId: socket.userId,
            userType: socket.userType,
            storeId: socket.storeId
          });
          return next();
        }

        // Accept token from either auth.token or Authorization header, tolerating optional "Bearer " prefix
        let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization || '';
        if (typeof token === 'string' && token.startsWith('Bearer ')) {
          token = token.slice(7).trim();
        }

        if (!token) {
          logger.warn('Socket connection attempted without valid token', {
            hasToken: !!token,
            hasAuthObject: !!socket.handshake.auth,
            authKeys: socket.handshake.auth ? Object.keys(socket.handshake.auth) : [],
            clientType: socket.handshake.auth?.clientType,
            namespace: socket.nsp.name
          });
          return next(new Error('Authentication failed: No token provided'));
        }

        let decoded;
        try {
          const JWT_SECRET = process.env.JWT_SECRET;
          const JWT_ISSUER = process.env.JWT_ISSUER || 'template';
          const JWT_MOBILE_AUDIENCE = process.env.JWT_MOBILE_AUDIENCE || 'mobile';
          const JWT_STORE_AUDIENCE = process.env.JWT_STORE_AUDIENCE || 'store';

          // audience를 사전 결정하기 어렵기 때문에, 허용 가능한 audience 배열로 검증
          decoded = jwt.verify(token, JWT_SECRET, {
            algorithms: ['HS256'],
            issuer: JWT_ISSUER,
            audience: [JWT_MOBILE_AUDIENCE, JWT_STORE_AUDIENCE],
            clockTolerance: 30,
          });
        } catch (jwtError) {
          if (jwtError.name === 'TokenExpiredError') {
            logger.warn('Socket authentication failed - JWT expired', {
              expiredAt: jwtError.expiredAt,
              service: 'delivery-mvp-server',
              socketId: socket.id,
              namespace: socket.nsp.name,
              clientType: socket.handshake.auth?.clientType
            });
            return next(new Error('Authentication failed: Token expired'));
          } else if (jwtError.name === 'JsonWebTokenError') {
            logger.error('Socket authentication failed - Invalid JWT', {
              error: jwtError.message,
              service: 'delivery-mvp-server',
              socketId: socket.id,
              namespace: socket.nsp.name,
              jwtSecret: process.env.JWT_SECRET ? 'Set' : 'NOT SET',
            });
            return next(new Error('Authentication failed: Invalid token'));
          } else {
            logger.error('Socket authentication failed - JWT verification error', {
              error: jwtError.message,
              name: jwtError.name,
              service: 'delivery-mvp-server',
              socketId: socket.id
            });
            return next(new Error('Authentication failed'));
          }
        }

        // JWT 페이로드에서 올바른 ID 추출 (userId가 실제 필드)
        const userId = decoded.userId || decoded.id;

        logger.info('JWT Token decoded', {
          userId: userId,
          decodedId: decoded.id,
          type: decoded.type,
          clientType: decoded.clientType,
          storeId: decoded.storeId,
          storeAccountId: decoded.storeAccountId,
          role: decoded.role,
          exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
        });

        // clientType에 따라 올바른 테이블에서 사용자 조회
        const clientType = socket.handshake.auth?.clientType || decoded.clientType;
        let user = null;

        logger.info('Socket auth attempt', {
          userId: userId,
          decodedId: decoded.id,
          clientType: clientType,
          handshakeClientType: socket.handshake.auth?.clientType
        });

        if (clientType === 'store-admin' || clientType === 'store' || decoded.type === 'store') {
          // 점주앱: StoreAccount 테이블에서 조회
          logger.info('Searching in StoreAccount table', { id: userId });

          user = await StoreAccount.findByPk(userId, {
            include: [
              { model: Store, as: 'store', required: false },
              { model: Store, as: 'ownedStores', required: false }
            ]
          });

          logger.info('StoreAccount query result', {
            found: !!user,
            userId: user?.id,
            userEmail: user?.email,
            userRole: user?.role,
            userStoreId: user?.storeId
          });

          if (user) {
            socket.userId = userId;
            socket.user = user;
            socket.userType = 'STORE';
            socket.storeId = user.storeId || user.store?.id || user.ownedStores?.[0]?.id;
            socket.userRole = user.role;
          }
        } else {
          // 고객앱: User 테이블에서 조회 (Sequelize 모델 사용)
          user = await db.User.findByPk(userId, {
            attributes: ['id', 'phone', 'email', 'fullName', 'status']
          });

          if (user) {
            socket.userId = userId;
            socket.user = user;
            socket.userType = 'CUSTOMER';
            socket.storeId = null; // 관련 정보는 필요시 별도 조회
          }
        }

        if (!user) {
          logger.error('Socket authentication failed - User not found', {
            userId: userId,
            clientType: clientType,
            table: clientType === 'store-admin' || clientType === 'store' ? 'StoreAccount' : 'User',
            decodedInfo: {
              userId: decoded.userId,
              id: decoded.id,
              type: decoded.type,
              role: decoded.role
            }
          });
          return next(new Error('Authentication failed: User not found'));
        }

        const platformInfo = socket.handshake.auth?.platform || 'unknown';
        logger.info('SocketConnected', {
          userType: socket.userType,
          userId: socket.userId,
          storeId: socket.storeId || null,
          platform: platformInfo,
          socketId: socket.id,
          namespace: socket.nsp.name,
          ts: new Date().toISOString(),
        });

        logger.info('Socket authenticated', {
          userId: socket.userId,
          userType: socket.userType,
          storeId: socket.storeId,
          userRole: socket.userRole,
          clientType: clientType,
          namespace: socket.nsp.name,
          table: clientType === 'store-admin' ? 'StoreAccount' : 'User'
        });

        next();
      } catch (error) {
        logger.error('Socket authentication failed - Unexpected error', {
          error: error.message,
          stack: error.stack,
          socketId: socket.id,
          clientType: socket.handshake.auth?.clientType
        });
        next(new Error('Authentication failed'));
      }
    });
  }
  /**
   * 단일 소켓 핸들러 설정
   */
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      this.connections.set(socket.id, {
        socket,
        userId: socket.userId,
        userType: socket.userType,
        storeId: socket.storeId,
        connectedAt: new Date()
      });

      // 사용자별 Room 가입
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
        logger.info(`사용자 Room 가입`, { userId: socket.userId, room: `user:${socket.userId}` });

        // ✅ Redis에 사용자 Socket 연결 상태 저장 (FCM 조건부 발송용)
        kv.setex(`socket:user:${socket.userId}:connected`, 3600, '1')
          .then(() => {
            logger.info('📡 [Redis] 사용자 Socket 연결 상태 저장:', { userId: socket.userId });
          })
          .catch(err => {
            logger.error('❌ [Redis] Socket 연결 상태 저장 실패:', err);
          });

        // ✅ 초기 앱 상태는 'foreground'로 설정 (연결 직후는 포그라운드)
        kv.setex(`socket:user:${socket.userId}:appState`, 3600, 'foreground')
          .then(() => {
            logger.info('📱 [Redis] 사용자 앱 상태 초기화: foreground', { userId: socket.userId });
          })
          .catch(err => {
            logger.error('❌ [Redis] 앱 상태 저장 실패:', err);
          });
      }

      // 매장별 Room 가입
      if (socket.storeId) {
        socket.join(`store:${socket.storeId}`);
        logger.info(`매장 Room 가입`, { storeId: socket.storeId, room: `store:${socket.storeId}` });

        // ✅ 점주 온라인 상태 업데이트 (점주 웹앱 접속)
        if (socket.userType === 'STORE') {
          this.webOnlineService.handleStoreConnect(socket.storeId, socket.id);
        }
      }

      // 단일 소켓 이벤트 핸들러 등록
      this.registerEventHandlers(socket);

      // 연결 해제 처리
      socket.on('disconnect', (reason) => {
        logger.info('SocketDisconnected', {
          socketId: socket.id,
          userId: socket.userId,
          userType: socket.userType,
          storeId: socket.storeId,
          reason
        });

        // ✅ Redis에서 사용자 Socket 연결 상태 제거 (FCM 조건부 발송용)
        if (socket.userId) {
          kv.del(`socket:user:${socket.userId}:connected`)
            .then(() => {
              logger.info('📡 [Redis] 사용자 Socket 연결 상태 제거:', { userId: socket.userId });
            })
            .catch(err => {
              logger.error('❌ [Redis] Socket 연결 상태 제거 실패:', err);
            });
        }

        // ✅ 점주 오프라인 상태 업데이트 (점주 웹앱 종료)
        if (socket.userType === 'STORE' && socket.storeId) {
          this.webOnlineService.handleStoreDisconnect(socket.storeId, socket.id);
        }

        this.connections.delete(socket.id);
      });
    });

    logger.info('단일 소켓 핸들러 설정 완료');
  }

  /**
   * ====================================================================
   * Store Socket Manager를 통한 실시간 이벤트 발송 메서드들
   * ====================================================================
   */

  /**
   * Store에 새 주문 알림 발송
   */
  async notifyStoreNewOrder(storeId, orderData) {
    return await this.webSocketManager.emitNewOrder(storeId, orderData);
  }

  /**
   * Store에 결제 완료 알림 발송
   */
  async notifyStorePaymentCompleted(storeId, paymentData) {
    return await this.webSocketManager.emitPaymentCompleted(storeId, paymentData);
  }

  /**
   * Store에 주문 상태 변경 알림 발송
   */
  async notifyStoreOrderStatusChanged(storeId, orderData) {
    return await this.webSocketManager.emitOrderStatusChanged(storeId, orderData);
  }

  /**
   * Store에 POS 연결 상태 알림 발송
   */
  async notifyStorePOSConnectionStatus(storeId, posData) {
    return await this.webSocketManager.emitPOSConnectionStatus(storeId, posData);
  }

  /**
   * Store에 시스템 알림 발송
   */
  async notifyStoreSystemAlert(storeId, alertData) {
    return await this.webSocketManager.emitSystemAlert(storeId, alertData);
  }

  /**
   * Store에 실시간 분석 데이터 업데이트 발송
   */
  async notifyStoreAnalyticsUpdate(storeId, analyticsData) {
    return await this.webSocketManager.emitAnalyticsUpdate(storeId, analyticsData);
  }

  /**
   * Store의 연결 상태 확인
   */
  isStoreConnected(storeId) {
    return this.webSocketManager.isStoreConnected(storeId);
  }

  /**
   * Store의 실시간 메트릭 조회
   */
  getStoreMetrics(storeId) {
    return this.webSocketManager.getStoreMetrics(storeId);
  }

  /**
   * Store 메트릭 업데이트
   */
  updateStoreMetric(storeId, metric, value) {
    return this.webSocketManager.setStoreMetric(storeId, metric, value);
  }

  /**
   * 강화된 Socket.IO 이벤트 핸들러 등록
   * 완전한 실시간 통신을 위한 모든 이벤트 처리
   */
  registerEventHandlers(socket) {
    // === 인증 및 연결 관리 ===
    socket.on('authenticate', (data) => this.handleAuthentication(socket, data));
    socket.on('heartbeat', (data) => this.handleHeartbeat(socket, data));
    socket.on('reconnect_request', (data) => this.handleReconnectRequest(socket, data));

    // === 채팅 이벤트 (다국어 지원) ===
    socket.on('chat:send_message', (data) => this.handleChatMessage(socket, data));
    socket.on('chat:join_room', (data) => this.handleJoinRoom(socket, data));
    socket.on('chat:leave_room', (data) => this.handleLeaveRoom(socket, data));
    socket.on('chat:typing_start', (data) => this.handleTypingStart(socket, data));
    socket.on('chat:typing_stop', (data) => this.handleTypingStop(socket, data));
    socket.on('chat:message_read', (data) => this.handleMessageRead(socket, data));
    socket.on('chat:get_history', (data) => this.handleGetChatHistory(socket, data));

    // === 주문 추적 이벤트 ===
    socket.on('order:track_start', (data) => this.handleOrderTrackStart(socket, data));
    socket.on('order:track_stop', (data) => this.handleOrderTrackStop(socket, data));
    socket.on('order:status_update', (data) => this.handleOrderStatusUpdate(socket, data));
    socket.on('order:cancel_request', (data) => this.handleOrderCancelRequest(socket, data));

    // === 배달 추적 이벤트 ===
    socket.on('delivery:track_start', (data) => this.handleDeliveryTrackStart(socket, data));
    socket.on('delivery:track_stop', (data) => this.handleDeliveryTrackStop(socket, data));
    socket.on('delivery:location_update', (data) => this.handleDeliveryLocationUpdate(socket, data));
    socket.on('delivery:eta_update', (data) => this.handleDeliveryEtaUpdate(socket, data));

    // === POS 시스템 이벤트 ===
    socket.on('pos:order_received', (data) => this.handlePosOrderReceived(socket, data));
    socket.on('pos:order_confirm', (data) => this.handlePosOrderConfirm(socket, data));
    socket.on('pos:order_reject', (data) => this.handlePosOrderReject(socket, data));
    socket.on('pos:status_check', (data) => this.handlePosStatusCheck(socket, data));
    socket.on('pos:menu_sync', (data) => this.handlePosMenuSync(socket, data));

    // === 알림 이벤트 ===
    socket.on('notification:mark_read', (data) => this.handleNotificationRead(socket, data));
    socket.on('notification:mark_all_read', (data) => this.handleMarkAllNotificationsRead(socket, data));
    socket.on('notification:get_unread_count', (data) => this.handleGetUnreadNotificationCount(socket, data));

    // === 매장 관리 이벤트 (점주 전용) ===
    socket.on('store:status_change', (data) => this.handleStoreStatusChange(socket, data));
    socket.on('store:menu_update', (data) => this.handleStoreMenuUpdate(socket, data));
    socket.on('store:analytics_request', (data) => this.handleStoreAnalyticsRequest(socket, data));

    // === 일반 Room 관리 이벤트 (store 온라인 상태 추적 등) ===
    socket.on('joinRoom', (data) => this.handleGenericJoinRoom(socket, data));
    socket.on('leaveRoom', (data) => this.handleGenericLeaveRoom(socket, data));

    // === 시스템 이벤트 ===
    socket.on('system:ping', (data) => this.handleSystemPing(socket, data));
    socket.on('system:get_status', (data) => this.handleGetSystemStatus(socket, data));

    // === 앱 상태 변화 이벤트 (FCM 조건부 발송용) ===
    socket.on('app:state', (data) => this.handleAppStateChange(socket, data));

    logger.info('🔌 모든 Socket.IO 이벤트 핸들러 등록 완료', {
      userId: socket.userId,
      userType: socket.userType,
      storeId: socket.storeId,
      handlersCount: 20
    });
  }

  /**
   * ====================================================================
   * 강화된 Socket.IO 이벤트 핸들러들
   * GraphQL Subscription 완전 대체를 위한 모든 실시간 기능
   * ====================================================================
   */

  /**
   * 인증 처리 (동적 인증 지원)
   */
  async handleAuthentication(socket, data) {
    try {
      const { token, userType, language = 'vi' } = data;

      if (!token) {
        socket.emit('auth:error', {
          error: 'TOKEN_REQUIRED',
          message: this.getLocalizedMessage('TOKEN_REQUIRED', language)
        });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId || decoded.id;
      socket.userType = userType || decoded.type || 'CUSTOMER';
      socket.language = language;

      // 사용자별 Room 가입
      socket.join(`user:${socket.userId}`);

      // 매장 관련 Room 가입 (점주의 경우)
      if (socket.userType === 'STORE' && decoded.storeId) {
        socket.storeId = decoded.storeId;
        socket.join(`store:${decoded.storeId}`);
      }

      socket.emit('auth:success', {
        userId: socket.userId,
        userType: socket.userType,
        language: socket.language
      });

      logger.info('🔐 동적 인증 성공', {
        userId: socket.userId,
        userType: socket.userType,
        language: socket.language
      });
    } catch (error) {
      socket.emit('auth:error', {
        error: 'AUTH_FAILED',
        message: 'Authentication failed'
      });
      logger.error('동적 인증 실패', error);
    }
  }

  /**
   * 하트비트 처리 (연결 상태 모니터링)
   */
  async handleHeartbeat(socket, data) {
    try {
      socket.lastHeartbeat = new Date();
      socket.emit('heartbeat:pong', {
        timestamp: socket.lastHeartbeat,
        latency: data.timestamp ? Date.now() - data.timestamp : 0
      });
    } catch (error) {
      logger.error('하트비트 처리 실패', error);
    }
  }

  /**
   * 재연결 요청 처리
   */
  async handleReconnectRequest(socket, data) {
    try {
      // 기존 연결 정보 복구
      const { lastMessageId, roomIds = [] } = data;

      // 채팅방 재가입
      for (const roomId of roomIds) {
        await socket.join(`chat:${roomId}`);
      }

      socket.emit('reconnect:success', {
        status: 'RECONNECTED',
        rejoined_rooms: roomIds,
        timestamp: new Date()
      });

      logger.info('재연결 완료', {
        userId: socket.userId,
        roomCount: roomIds.length
      });
    } catch (error) {
      socket.emit('reconnect:error', { error: error.message });
      logger.error('재연결 실패', error);
    }
  }

  /**
   * 강화된 채팅 메시지 처리 (다국어, 첨부파일 지원)
   */
  async handleChatMessage(socket, data) {
    try {
      const messageData = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId: data.roomId,
        senderId: socket.userId,
        senderType: socket.userType,
        content: data.message || data.content,
        messageType: data.type || 'text',
        attachments: data.attachments || [],
        language: socket.language || 'vi',
        timestamp: new Date(),
        serverTimestamp: new Date().toISOString()
      };

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔥 [SERVER] handleChatMessage 호출됨!');
      console.log('Message ID:', messageData.id);
      console.log('Room ID:', data.roomId);
      console.log('Sender:', socket.userId, '/', socket.userType);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 메시지를 데이터베이스에 저장 (선택적)
      let chatRoom = null;
      if (data.persist !== false) {
        chatRoom = await this.saveChatMessage(messageData);
      } else {
        // persist가 false여도 storeId를 위해 ChatRoom 조회
        chatRoom = await db.ChatRoom.findByPk(data.roomId);
      }

      // ✅ 채팅방의 모든 참여자에게 단일 통합 이벤트로 메시지 전송
      // 점주앱, App 모두 'chat:received' 이벤트로 통일 (중복 방지)
      console.log('📤 [SERVER] 이벤트 발송:', {
        event: 'chat:received',
        room: `chat:${data.roomId}`,
        messageId: messageData.id
      });

      this.io.to(`chat:${data.roomId}`).emit('chat:received', messageData);

      console.log('✅ [SERVER] 메시지 발송 완료!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // 상대방이 오프라인인 경우 푸시 알림 준비
      await this.handleOfflineChatNotification(messageData);

      logger.info('💬 채팅 메시지 전송 완료', {
        messageId: messageData.id,
        roomId: data.roomId,
        messageType: messageData.messageType,
        hasAttachments: messageData.attachments.length > 0
      });
    } catch (error) {
      socket.emit('chat:error', {
        error: 'MESSAGE_SEND_FAILED',
        message: this.getLocalizedMessage('MESSAGE_SEND_FAILED', socket.language)
      });
      logger.error('채팅 메시지 처리 실패', error);
    }
  }

  /**
   * 채팅방 입장 처리 (권한 검증 포함)
   */
  async handleJoinRoom(socket, data) {
    try {
      const { roomId } = data || {};

      // 입력 검증
      if (!roomId) {
        logger.warn('⚠️ roomId가 제공되지 않음', { userId: socket.userId, data });
        socket.emit('chat:join_error', {
          error: 'ROOM_ID_REQUIRED',
          message: 'roomId is required'
        });
        return;
      }

      // ✅ store: prefix가 있으면 그대로 join (store room)
      // chat: prefix가 없으면 chat: 추가 (채팅방)
      const actualRoomId = roomId.startsWith('store:') || roomId.startsWith('chat:') || roomId.startsWith('user:')
        ? roomId
        : `chat:${roomId}`;

      // 채팅방 접근 권한 검증 (store room은 skip)
      if (actualRoomId.startsWith('chat:')) {
        const chatRoomId = actualRoomId.replace('chat:', '');
        const hasAccess = await this.verifyChatRoomAccess(socket.userId, chatRoomId, socket.userType);

        if (!hasAccess) {
          socket.emit('chat:access_denied', {
            roomId,
            error: 'ACCESS_DENIED',
            message: this.getLocalizedMessage('CHAT_ACCESS_DENIED', socket.language)
          });
          return;
        }
      }

      await socket.join(actualRoomId);

      // 입장 확인 응답
      socket.emit('chat:room_joined', {
        userId: socket.userId,
        userType: socket.userType,
        roomId: actualRoomId,
        timestamp: new Date()
      });

      // 채팅방 참여자에게 입장 알림 (chat room만)
      if (actualRoomId.startsWith('chat:')) {
        socket.to(actualRoomId).emit(SOCKET_EVENTS.CHAT_ROOM_JOINED, {
          userId: socket.userId,
          userType: socket.userType,
          roomId: actualRoomId,
          timestamp: new Date()
        });

        // 최근 메시지 히스토리 전송 (선택적, chat room만)
        if (data.loadHistory !== false) {
          const chatRoomId = actualRoomId.replace('chat:', '');
          const recentMessages = await this.getChatHistory(chatRoomId, 20);
          socket.emit('chat:history', {
            roomId: chatRoomId,
            messages: recentMessages
          });
        }
      }

      logger.info('🏠 Room 입장 완료', {
        userId: socket.userId,
        roomId: actualRoomId,
        userType: socket.userType,
        storeId: socket.storeId
      });
    } catch (error) {
      socket.emit('chat:join_error', {
        roomId: data?.roomId,
        error: error.message
      });
      logger.error('채팅방 입장 실패', {
        userId: socket?.userId,
        userType: socket?.userType,
        roomId: data?.roomId,
        errorMessage: error.message,
        errorStack: error.stack
      });
    }
  }

  /**
   * 채팅방 나가기 처리
   */
  async handleLeaveRoom(socket, data) {
    try {
      const { roomId } = data;
      await socket.leave(`chat:${roomId}`);

      // 채팅방 참여자에게 퇴장 알림
      socket.to(`chat:${roomId}`).emit(SOCKET_EVENTS.CHAT_ROOM_LEFT, {
        userId: socket.userId,
        userType: socket.userType,
        roomId,
        timestamp: new Date()
      });

      logger.info('🚪 채팅방 퇴장 완료', {
        userId: socket.userId,
        roomId
      });
    } catch (error) {
      logger.error('채팅방 퇴장 실패', error);
    }
  }

  /**
   * 타이핑 시작 처리
   */
  async handleTypingStart(socket, data) {
    try {
      const typingData = {
        userId: socket.userId,
        userType: socket.userType,
        roomId: data.roomId,
        isTyping: true,
        timestamp: new Date()
      };

      socket.to(`chat:${data.roomId}`).emit(SOCKET_EVENTS.CHAT_TYPING, typingData);

      logger.debug('⌨️ 타이핑 시작', {
        userId: socket.userId,
        roomId: data.roomId
      });
    } catch (error) {
      logger.error('타이핑 시작 처리 실패', error);
    }
  }

  /**
   * 타이핑 중지 처리
   */
  async handleTypingStop(socket, data) {
    try {
      const typingData = {
        userId: socket.userId,
        userType: socket.userType,
        roomId: data.roomId,
        isTyping: false,
        timestamp: new Date()
      };

      socket.to(`chat:${data.roomId}`).emit(SOCKET_EVENTS.CHAT_TYPING, typingData);

      logger.debug('⌨️ 타이핑 중지', {
        userId: socket.userId,
        roomId: data.roomId
      });
    } catch (error) {
      logger.error('타이핑 중지 처리 실패', error);
    }
  }

  /**
   * 메시지 읽음 처리
   */
  async handleMessageRead(socket, data) {
    try {
      const { roomId, messageId, lastReadMessageId } = data;

      // 메시지 읽음 상태 업데이트
      await this.markMessagesAsRead(socket.userId, roomId, messageId || lastReadMessageId);

      // 상대방에게 읽음 상태 알림
      socket.to(`chat:${roomId}`).emit('chat:message_read', {
        userId: socket.userId,
        roomId,
        messageId: messageId || lastReadMessageId,
        timestamp: new Date()
      });

      logger.info('✅ 메시지 읽음 처리', {
        userId: socket.userId,
        roomId,
        messageId: messageId || lastReadMessageId
      });
    } catch (error) {
      logger.error('메시지 읽음 처리 실패', error);
    }
  }

  /**
   * 채팅 히스토리 조회
   */
  async handleGetChatHistory(socket, data) {
    try {
      const { roomId, limit = 50, before = null } = data;

      const messages = await this.getChatHistory(roomId, limit, before);

      socket.emit('chat:history', {
        roomId,
        messages,
        hasMore: messages.length === limit
      });

      logger.info('📜 채팅 히스토리 전송', {
        roomId,
        messageCount: messages.length
      });
    } catch (error) {
      socket.emit('chat:history_error', {
        roomId: data.roomId,
        error: error.message
      });
      logger.error('채팅 히스토리 조회 실패', error);
    }
  }

  /**
   * ====================================================================
   * 주문 추적 이벤트 핸들러들
   * ====================================================================
   */

  /**
   * 주문 추적 시작
   */
  async handleOrderTrackStart(socket, data) {
    try {
      const { orderId } = data;

      // 주문 추적 Room 가입
      await socket.join(`order:${orderId}`);

      // 주문 현재 상태 조회 및 전송
      const order = await Order.findByPk(orderId);
      if (order) {
        socket.emit('order:tracking_started', {
          orderId,
          currentStatus: order.status,
          estimatedTime: order.estimatedDeliveryTime,
          timestamp: new Date()
        });
      }

      logger.info('📦 주문 추적 시작', {
        userId: socket.userId,
        orderId
      });
    } catch (error) {
      socket.emit('order:track_error', {
        orderId: data.orderId,
        error: error.message
      });
      logger.error('주문 추적 시작 실패', error);
    }
  }

  /**
   * 주문 추적 중지
   */
  async handleOrderTrackStop(socket, data) {
    try {
      const { orderId } = data;

      // 주문 추적 Room 나가기
      await socket.leave(`order:${orderId}`);

      socket.emit('order:tracking_stopped', {
        orderId,
        timestamp: new Date()
      });

      logger.info('📦 주문 추적 중지', {
        userId: socket.userId,
        orderId
      });
    } catch (error) {
      logger.error('주문 추적 중지 실패', error);
    }
  }

  /**
   * 주문 상태 업데이트 (강화된 버전)
   */
  async handleOrderStatusUpdate(socket, data) {
    try {
      const {
        orderId,
        status,
        userId,
        storeId,
        estimatedTime,
        reason,
        deliveryInfo
      } = data;

      const orderUpdateData = {
        orderId,
        status,
        previousStatus: data.previousStatus,
        estimatedTime,
        reason,
        deliveryInfo,
        timestamp: new Date(),
        updatedBy: socket.userId,
        updaterType: socket.userType
      };

      // Local어 우선 다국어 메시지
      const statusMessage = this.getOrderStatusMessage(status, 'vi');

      // 고객에게 주문 상태 알림
      if (userId) {
        this.io.to(`user:${userId}`).emit(SOCKET_EVENTS.ORDER_STATUS_CHANGED, {
          ...orderUpdateData,
          message: statusMessage
        });

        // 주문별 추적자들에게 알림
        this.io.to(`order:${orderId}`).emit('order:status_updated', orderUpdateData);
      }

      // 매장에 주문 상태 알림
      if (storeId) {
        this.io.to(`store:${storeId}`).emit('store:order_status_changed', orderUpdateData);
      }

      logger.info('📦 주문 상태 업데이트 완료', {
        orderId,
        status,
        userId,
        storeId
      });
    } catch (error) {
      socket.emit('order:status_update_error', {
        orderId: data.orderId,
        error: error.message
      });
      logger.error('주문 상태 업데이트 실패', error);
    }
  }

  /**
   * 주문 취소 요청
   */
  async handleOrderCancelRequest(socket, data) {
    try {
      const { orderId, reason } = data;

      const cancelData = {
        orderId,
        reason,
        requestedBy: socket.userId,
        requesterType: socket.userType,
        timestamp: new Date()
      };

      // 매장에 취소 요청 알림
      const order = await Order.findByPk(orderId, {
        include: [{ model: Store, as: 'store' }]
      });

      if (order && order.store) {
        this.io.to(`store:${order.storeId}`).emit('store:order_cancel_request', cancelData);
      }

      socket.emit('order:cancel_request_sent', {
        orderId,
        status: 'PENDING_CANCELLATION'
      });

      logger.info('❌ 주문 취소 요청', {
        userId: socket.userId,
        orderId,
        reason
      });
    } catch (error) {
      socket.emit('order:cancel_error', {
        orderId: data.orderId,
        error: error.message
      });
      logger.error('주문 취소 요청 실패', error);
    }
  }

  /**
   * ====================================================================
   * 배달 추적 이벤트 핸들러들
   * ====================================================================
   */

  /**
   * 배달 추적 시작
   */
  async handleDeliveryTrackStart(socket, data) {
    try {
      const { orderId } = data;

      await socket.join(`delivery:${orderId}`);

      socket.emit('delivery:tracking_started', {
        orderId,
        timestamp: new Date()
      });

      logger.info('🚚 배달 추적 시작', {
        userId: socket.userId,
        orderId
      });
    } catch (error) {
      socket.emit('delivery:track_error', {
        orderId: data.orderId,
        error: error.message
      });
      logger.error('배달 추적 시작 실패', error);
    }
  }

  /**
   * 배달 추적 중지
   */
  async handleDeliveryTrackStop(socket, data) {
    try {
      const { orderId } = data;

      await socket.leave(`delivery:${orderId}`);

      logger.info('🚚 배달 추적 중지', {
        userId: socket.userId,
        orderId
      });
    } catch (error) {
      logger.error('배달 추적 중지 실패', error);
    }
  }

  /**
   * 배달 위치 업데이트
   */
  async handleDeliveryLocationUpdate(socket, data) {
    try {
      const {
        orderId,
        location,
        address,
        eta,
        distance
      } = data;

      const locationData = {
        orderId,
        location,
        address,
        eta,
        distance,
        timestamp: new Date(),
        deliveryPersonId: socket.userId
      };

      // 배달 추적자들에게 위치 업데이트 전송
      this.io.to(`delivery:${orderId}`).emit(SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE, locationData);

      // 고객에게 직접 알림
      const order = await Order.findByPk(orderId);
      if (order) {
        this.io.to(`user:${order.userId}`).emit('delivery:location_updated', locationData);
      }

      logger.info('📍 배달 위치 업데이트', {
        orderId,
        location,
        eta
      });
    } catch (error) {
      logger.error('배달 위치 업데이트 실패', error);
    }
  }

  /**
   * 배달 예상시간 업데이트
   */
  async handleDeliveryEtaUpdate(socket, data) {
    try {
      const { orderId, eta, reason } = data;

      const etaData = {
        orderId,
        eta,
        reason,
        timestamp: new Date()
      };

      this.io.to(`delivery:${orderId}`).emit(SOCKET_EVENTS.DELIVERY_ETA_UPDATE, etaData);

      logger.info('⏱️ 배달 예상시간 업데이트', {
        orderId,
        eta,
        reason
      });
    } catch (error) {
      logger.error('배달 예상시간 업데이트 실패', error);
    }
  }

  /**
   * ====================================================================
   * POS 시스템 이벤트 핸들러들
   * ====================================================================
   */

  /**
   * POS 주문 수신 처리
   */
  async handlePosOrderReceived(socket, data) {
    try {
      const { orderId, posSystemId, orderDetails } = data;

      const posOrderData = {
        orderId,
        posSystemId,
        status: 'RECEIVED',
        orderDetails,
        timestamp: new Date(),
        receivedBy: socket.userId
      };

      // 매장에 POS 주문 수신 알림
      if (socket.storeId) {
        this.io.to(`store:${socket.storeId}`).emit(SOCKET_EVENTS.POS_ORDER_RECEIVED, posOrderData);
      }

      socket.emit('pos:order_received_ack', {
        orderId,
        status: 'ACKNOWLEDGED'
      });

      logger.info('🖥️ POS 주문 수신', {
        orderId,
        posSystemId,
        storeId: socket.storeId
      });
    } catch (error) {
      socket.emit('pos:order_error', {
        orderId: data.orderId,
        error: error.message
      });
      logger.error('POS 주문 수신 실패', error);
    }
  }

  /**
   * POS 주문 확인 처리
   */
  async handlePosOrderConfirm(socket, data) {
    try {
      const { orderId, estimatedPrepTime, notes } = data;

      const confirmData = {
        orderId,
        status: 'CONFIRMED',
        estimatedPrepTime,
        notes,
        confirmedAt: new Date(),
        confirmedBy: socket.userId
      };

      // 주문 정보 조회
      const order = await Order.findByPk(orderId);
      if (order) {
        // 고객에게 주문 확인 알림
        this.io.to(`user:${order.userId}`).emit(SOCKET_EVENTS.ORDER_CONFIRMED, {
          orderId,
          status: 'CONFIRMED',
          estimatedTime: estimatedPrepTime,
          storeMessage: notes,
          timestamp: new Date()
        });

        // 주문 추적자들에게 알림
        this.io.to(`order:${orderId}`).emit('order:pos_confirmed', confirmData);
      }

      logger.info('✅ POS 주문 확인', {
        orderId,
        estimatedPrepTime,
        storeId: socket.storeId
      });
    } catch (error) {
      socket.emit('pos:confirm_error', {
        orderId: data.orderId,
        error: error.message
      });
      logger.error('POS 주문 확인 실패', error);
    }
  }

  /**
   * POS 주문 거부 처리
   */
  async handlePosOrderReject(socket, data) {
    try {
      const { orderId, reason } = data;

      const rejectData = {
        orderId,
        status: 'REJECTED',
        reason,
        rejectedAt: new Date(),
        rejectedBy: socket.userId
      };

      // 주문 정보 조회
      const order = await Order.findByPk(orderId);
      if (order) {
        // 고객에게 주문 거부 알림
        this.io.to(`user:${order.userId}`).emit(SOCKET_EVENTS.ORDER_CANCELLED, {
          orderId,
          status: 'REJECTED',
          reason,
          timestamp: new Date()
        });
      }

      logger.info('❌ POS 주문 거부', {
        orderId,
        reason,
        storeId: socket.storeId
      });
    } catch (error) {
      socket.emit('pos:reject_error', {
        orderId: data.orderId,
        error: error.message
      });
      logger.error('POS 주문 거부 실패', error);
    }
  }

  /**
   * POS 상태 확인
   */
  async handlePosStatusCheck(socket, data) {
    try {
      const statusData = {
        storeId: socket.storeId,
        status: 'ONLINE',
        lastSyncTime: new Date(),
        pendingOrders: data.pendingOrders || 0
      };

      socket.emit('pos:status_response', statusData);

      logger.info('🖥️ POS 상태 확인', {
        storeId: socket.storeId,
        status: 'ONLINE'
      });
    } catch (error) {
      socket.emit('pos:status_error', {
        error: error.message
      });
      logger.error('POS 상태 확인 실패', error);
    }
  }

  /**
   * POS 메뉴 동기화
   */
  async handlePosMenuSync(socket, data) {
    try {
      const { menuData, syncType = 'FULL' } = data;

      const syncData = {
        storeId: socket.storeId,
        syncType,
        itemCount: menuData ? menuData.length : 0,
        syncTime: new Date()
      };

      // 매장에 메뉴 동기화 완료 알림
      this.io.to(`store:${socket.storeId}`).emit('pos:menu_synced', syncData);

      socket.emit('pos:sync_complete', {
        syncType,
        status: 'SUCCESS',
        timestamp: new Date()
      });

      logger.info('🔄 POS 메뉴 동기화', {
        storeId: socket.storeId,
        syncType,
        itemCount: syncData.itemCount
      });
    } catch (error) {
      socket.emit('pos:sync_error', {
        syncType: data.syncType,
        error: error.message
      });
      logger.error('POS 메뉴 동기화 실패', error);
    }
  }

  /**
   * ====================================================================
   * 알림 시스템 이벤트 핸들러들
   * ====================================================================
   */

  /**
   * 개별 알림 읽음 처리
   */
  async handleNotificationRead(socket, data) {
    try {
      const { notificationId } = data;

      // 알림 읽음 상태 업데이트
      const [updatedCount] = await Notification.update(
        { isRead: true, readAt: new Date() },
        { where: { id: notificationId, userId: socket.userId } }
      );

      if (updatedCount > 0) {
        socket.emit(SOCKET_EVENTS.NOTIFICATION_READ, {
          notificationId,
          readAt: new Date()
        });
      }

      logger.info('🔔 알림 읽음 처리', {
        userId: socket.userId,
        notificationId
      });
    } catch (error) {
      socket.emit('notification:read_error', {
        notificationId: data.notificationId,
        error: error.message
      });
      logger.error('알림 읽음 처리 실패', error);
    }
  }

  /**
   * 모든 알림 읽음 처리
   */
  async handleMarkAllNotificationsRead(socket, data) {
    try {
      const [updatedCount] = await Notification.update(
        { isRead: true, readAt: new Date() },
        {
          where: {
            userId: socket.userId,
            isRead: false
          }
        }
      );

      socket.emit('notification:all_read', {
        markedCount: updatedCount,
        timestamp: new Date()
      });

      logger.info('🔔 모든 알림 읽음 처리', {
        userId: socket.userId,
        markedCount: updatedCount
      });
    } catch (error) {
      socket.emit('notification:mark_all_error', {
        error: error.message
      });
      logger.error('모든 알림 읽음 처리 실패', error);
    }
  }

  /**
   * 미읽은 알림 개수 조회
   */
  async handleGetUnreadNotificationCount(socket, data) {
    try {
      const count = await Notification.count({
        where: {
          userId: socket.userId,
          isRead: false
        }
      });

      socket.emit('notification:unread_count', {
        count,
        timestamp: new Date()
      });

      logger.info('🔔 미읽은 알림 개수 조회', {
        userId: socket.userId,
        count
      });
    } catch (error) {
      socket.emit('notification:count_error', {
        error: error.message
      });
      logger.error('미읽은 알림 개수 조회 실패', error);
    }
  }

  /**
   * ====================================================================
   * 매장 관리 이벤트 핸들러들 (점주 전용)
   * ====================================================================
   */

  /**
   * 매장 상태 변경
   */
  async handleStoreStatusChange(socket, data) {
    try {
      if (socket.userType !== 'STORE') {
        socket.emit('store:access_denied', {
          error: 'STORE_ONLY_ACCESS'
        });
        return;
      }

      const { status, reason } = data;

      const statusData = {
        storeId: socket.storeId,
        status,
        reason,
        changedBy: socket.userId,
        timestamp: new Date()
      };

      // 매장의 모든 연결된 클라이언트에게 상태 변경 알림
      this.io.to(`store:${socket.storeId}`).emit('store:status_changed', statusData);

      // 해당 매장의 고객들에게 알림 (진행 중인 주문이 있는 경우)
      // TODO: 매장의 활성 주문 고객들에게 알림 전송

      logger.info('🏪 매장 상태 변경', {
        storeId: socket.storeId,
        status,
        reason
      });
    } catch (error) {
      socket.emit('store:status_change_error', {
        error: error.message
      });
      logger.error('매장 상태 변경 실패', error);
    }
  }

  /**
   * 매장 메뉴 업데이트
   */
  async handleStoreMenuUpdate(socket, data) {
    try {
      if (socket.userType !== 'STORE') {
        socket.emit('store:access_denied', {
          error: 'STORE_ONLY_ACCESS'
        });
        return;
      }

      const { menuItemId, action, updateData } = data;

      const menuUpdateData = {
        storeId: socket.storeId,
        menuItemId,
        action, // 'ADD', 'UPDATE', 'DELETE', 'AVAILABILITY_CHANGE'
        updateData,
        updatedBy: socket.userId,
        timestamp: new Date()
      };

      // 매장 관리자들에게 메뉴 업데이트 알림
      this.io.to(`store:${socket.storeId}`).emit(SOCKET_EVENTS.STORE_ANALYTICS_UPDATE, menuUpdateData);

      socket.emit('store:menu_updated', {
        menuItemId,
        action,
        status: 'SUCCESS'
      });

      logger.info('📋 매장 메뉴 업데이트', {
        storeId: socket.storeId,
        menuItemId,
        action
      });
    } catch (error) {
      socket.emit('store:menu_update_error', {
        menuItemId: data.menuItemId,
        error: error.message
      });
      logger.error('매장 메뉴 업데이트 실패', error);
    }
  }

  /**
   * 매장 분석 데이터 요청
   */
  async handleStoreAnalyticsRequest(socket, data) {
    try {
      if (socket.userType !== 'STORE') {
        socket.emit('store:access_denied', {
          error: 'STORE_ONLY_ACCESS'
        });
        return;
      }

      const { dateRange, metrics } = data;

      // 실시간 분석 데이터 조회 (실제 구현은 별도 서비스에서)
      const analyticsData = {
        storeId: socket.storeId,
        dateRange,
        metrics: {
          todayOrders: 0,
          todayRevenue: 0,
          averageOrderTime: 0,
          customerSatisfaction: 0
        },
        timestamp: new Date()
      };

      socket.emit('store:analytics_response', analyticsData);

      logger.info('📊 매장 분석 데이터 요청', {
        storeId: socket.storeId,
        dateRange,
        requestedMetrics: metrics
      });
    } catch (error) {
      socket.emit('store:analytics_error', {
        error: error.message
      });
      logger.error('매장 분석 데이터 요청 실패', error);
    }
  }

  /**
   * ====================================================================
   * 일반 Room 관리 이벤트 핸들러들
   * ====================================================================
   */

  /**
   * 일반 Room 참가 처리 (store 온라인 상태 추적 등)
   */
  async handleGenericJoinRoom(socket, data) {
    try {
      // 표준 형식: { roomId: 'type:id' }
      const roomId = data?.roomId;

      if (!roomId) {
        logger.warn('⚠️ joinRoom: roomId가 제공되지 않음', { userId: socket.userId, data });
        return;
      }

      // Room에 참가
      socket.join(roomId);
      logger.info(`🚪 Room 참가: ${roomId}`, { userId: socket.userId, socketId: socket.id });

      // store room인 경우 현재 온라인 상태 전송
      if (roomId.startsWith('store:')) {
        const storeId = roomId.replace('store:', '');

        // Redis에서 직접 온라인 상태 조회
        try {
          const redisKey = `store:${storeId}:online`;
          const statusData = await kv.get(redisKey);

          let isOnline = false;
          let lastSeenAt = null;
          let socketCount = 0;

          if (statusData) {
            const parsed = typeof statusData === 'string' ? JSON.parse(statusData) : statusData;
            isOnline = parsed.isOnline || false;
            lastSeenAt = parsed.lastSeenAt || null;
            socketCount = parsed.socketCount || 0;
          }

          // 현재 상태 즉시 전송
          socket.emit('store:online:status', {
            storeId,
            isOnline,
            lastSeenAt,
            socketCount,
            timestamp: new Date().toISOString()
          });

          logger.info(`📡 Store 온라인 상태 전송: ${storeId}`, {
            isOnline,
            lastSeenAt,
            socketCount,
            userId: socket.userId
          });
        } catch (error) {
          logger.error('Store 온라인 상태 조회 실패', { storeId, error: error.message });
          // 에러 시에도 기본 상태 전송
          socket.emit('store:online:status', {
            storeId,
            isOnline: false,
            lastSeenAt: null,
            timestamp: new Date().toISOString()
          });
        }
      }

      // 참가 확인 응답
      socket.emit('room:joined', { roomId, timestamp: new Date() });
    } catch (error) {
      logger.error('Room 참가 실패', { error: error.message, data });
    }
  }

  /**
   * 일반 Room 퇴장 처리
   */
  async handleGenericLeaveRoom(socket, data) {
    try {
      // 표준 형식: { roomId: 'type:id' }
      const roomId = data?.roomId;

      if (!roomId) {
        logger.warn('⚠️ leaveRoom: roomId가 제공되지 않음', { userId: socket.userId, data });
        return;
      }

      // Room에서 퇴장
      socket.leave(roomId);
      logger.info(`🚪 Room 퇴장: ${roomId}`, { userId: socket.userId, socketId: socket.id });

      // 퇴장 확인 응답
      socket.emit('room:left', { roomId, timestamp: new Date() });
    } catch (error) {
      logger.error('Room 퇴장 실패', { error: error.message, data });
    }
  }

  /**
   * ====================================================================
   * 시스템 이벤트 핸들러들
   * ====================================================================
   */

  /**
   * 시스템 핑 처리
   */
  async handleSystemPing(socket, data) {
    try {
      socket.emit('system:pong', {
        timestamp: new Date(),
        latency: data.timestamp ? Date.now() - data.timestamp : 0,
        serverTime: new Date().toISOString()
      });
    } catch (error) {
      logger.error('시스템 핑 처리 실패', error);
    }
  }

  /**
   * 시스템 상태 조회
   */
  async handleGetSystemStatus(socket, data) {
    try {
      const status = this.getStatus();

      socket.emit('system:status_response', {
        ...status,
        serverTime: new Date().toISOString(),
        uptime: process.uptime(),
        storeManager: this.webSocketManager.getManagerStatus()
      });

      logger.info('🔧 시스템 상태 조회', {
        userId: socket.userId,
        connectedClients: status.connected
      });
    } catch (error) {
      socket.emit('system:status_error', {
        error: error.message
      });
      logger.error('시스템 상태 조회 실패', error);
    }
  }

  /**
   * 앱 상태 변화 처리 (포그라운드/백그라운드)
   * FCM 발송 조건 판단을 위한 실제 앱 상태 추적
   */
  async handleAppStateChange(socket, data) {
    try {
      const { state } = data; // 'foreground' 또는 'background'
      const userId = socket.userId;

      if (!userId) {
        logger.warn('📱 [AppState] 사용자 ID 없음 - 상태 변경 무시');
        return;
      }

      if (!['foreground', 'background'].includes(state)) {
        logger.warn('📱 [AppState] 잘못된 상태 값:', { userId, state });
        return;
      }

      // ✅ Redis에 앱 상태 저장 (FCM 조건부 발송용)
      await kv.setex(`socket:user:${userId}:appState`, 3600, state);

      logger.info(`📱 [AppState] 사용자 앱 상태 변경: ${state.toUpperCase()}`, {
        userId,
        state,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });

      // 클라이언트에 확인 응답 전송
      socket.emit('app:state_updated', {
        state,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('❌ [AppState] 앱 상태 변경 처리 실패:', {
        error: error.message,
        userId: socket.userId,
        state: data?.state
      });
    }
  }

  /**
   * 서버 상태 조회
   */
  getStatus() {
    const status = {
      connected: this.io.engine.clientsCount,
      activeConnections: this.connections.size,
      rooms: this.io.sockets.adapter.rooms.size,
      storeManager: this.webSocketManager.getManagerStatus()
    };

    return status;
  }

  /**
   * 우아한 종료 (강화된 버전)
   */
  async shutdown() {
    logger.info('🔄 Socket.IO 서버 종료 시작...');

    try {
      // Store Socket Manager 먼저 종료
      if (this.webSocketManager) {
        await this.webSocketManager.shutdown();
      }

      // 연결 모니터링 인터벌 정리
      if (this.connectionCleanupInterval) {
        clearInterval(this.connectionCleanupInterval);
        this.connectionCleanupInterval = null;
      }

      if (this.heartbeatCheckInterval) {
        clearInterval(this.heartbeatCheckInterval);
        this.heartbeatCheckInterval = null;
      }

      // 모든 클라이언트에게 종료 알림
      this.io.emit('server:shutdown', {
        message: 'Server is shutting down gracefully',
        messageKo: '서버가 안전하게 종료됩니다',
        messageVi: 'Máy chủ đang tắt an toàn',
        timestamp: new Date(),
        reconnectAfter: 5000 // 5초 후 재연결 권장
      });

      // 2초 대기 후 연결 종료 (클라이언트가 메시지를 받을 시간)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 모든 연결 정리
      this.connections.clear();

      // Socket.IO 서버 종료
      this.io.close();

      // Redis 연결 종료
      if (this.redis) {
        await this.redis.quit();
      }

      // 이벤트 로거 종료
      if (this.eventLogger && this.eventLogger.shutdown) {
        await this.eventLogger.shutdown();
      }

      logger.info('✅ Socket.IO 서버 종료 완료');
    } catch (error) {
      logger.error('❌ Socket.IO 서버 종료 중 오류 발생', error);
      throw error;
    }
  }

  /**
   * ====================================================================
   * realtimeResolvers.js 통합 메서드들
   * ====================================================================
   */

  /**
   * 실시간 통신 상태 조회 (GraphQL Query)
   */
  async getRealtimeStatus(userId) {
    try {
      // 사용자 연결 상태 확인
      const connections = this.getConnectionsByUser(userId);

      const stats = {
        totalConnections: this.io.engine.clientsCount,
        userConnections: connections.length,
        activeNamespaces: 1, // 단일 소켓 구조
        serverUptime: process.uptime(),
        storeManager: this.webSocketManager.getManagerStatus()
      };

      return {
        connected: connections.length > 0,
        stats,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('실시간 상태 조회 실패', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 사용자별 미읽은 알림 조회 (GraphQL Query)
   */
  async getUnreadNotifications(userId, limit = 10) {
    try {
      const notifications = await Notification.findAll({
        where: {
          userId,
          isRead: false
        },
        order: [['createdAt', 'DESC']],
        limit
      });

      return notifications;
    } catch (error) {
      logger.error('미읽은 알림 조회 실패', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * 실시간 메시지 전송 (GraphQL Mutation)
   */
  async sendRealtimeMessage(senderId, input) {
    try {
      const { receiverId, messageType, content, priority = 'NORMAL' } = input;
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const messageData = {
        id: messageId,
        senderId,
        receiverId,
        messageType,
        content,
        priority,
        timestamp: new Date()
      };

      // Socket.IO로 실시간 전송
      if (receiverId) {
        this.io.to(`user:${receiverId}`).emit('realtime:message', messageData);
      }

      // Socket.IO로 실시간 이벤트 발행
      await this.publishSocketEvent('CHAT_MESSAGE_RECEIVED', {
        chatMessageReceived: messageData
      });

      logger.info('실시간 메시지 전송 완료', { messageId, senderId, receiverId });

      return {
        messageId,
        success: true
      };
    } catch (error) {
      logger.error('실시간 메시지 전송 실패', { error: error.message, senderId, input });
      return {
        messageId: null,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 알림 읽음 처리 (GraphQL Mutation)
   */
  async markNotificationAsRead(notificationId, userId) {
    try {
      const [updatedCount] = await Notification.update(
        { isRead: true, readAt: new Date() },
        { where: { id: notificationId, userId } }
      );

      if (updatedCount > 0) {
        // 실시간으로 알림 읽음 상태 브로드캐스트
        this.io.to(`user:${userId}`).emit('notification:read', { notificationId });
      }

      return {
        success: updatedCount > 0
      };
    } catch (error) {
      logger.error('알림 읽음 처리 실패', { error: error.message, notificationId, userId });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Socket.IO 실시간 이벤트 발행
   */
  async publishSocketEvent(eventType, data) {
    try {
      const socketEventName = SOCKET_EVENTS[eventType?.toUpperCase()] || `realtime:${eventType}`;

      // Socket.IO로 실시간 브로드캐스트
      this.io.emit(socketEventName, data);

      logger.info('Socket.IO 이벤트 발행 완료', { eventType: socketEventName, timestamp: new Date() });
    } catch (error) {
      logger.error('Socket.IO 이벤트 발행 실패', { error: error.message, eventType });
      throw error;
    }
  }

  /**
   * 주문 상태 변경 이벤트 발행
   */
  async publishOrderStatusChanged(orderData) {
    try {
      const eventData = {
        orderStatusChanged: {
          orderId: orderData.id,
          status: orderData.status,
          userId: orderData.userId,
          storeId: orderData.storeId,
          previousStatus: orderData.previousStatus,
          estimatedTime: orderData.estimatedTime,
          reason: orderData.reason || null,
          timestamp: new Date(),
          ...orderData
        }
      };

      await this.publishSocketEvent('ORDER_STATUS_CHANGED', eventData);

      // 대칭적 구조: Mobile + Store 매니저를 통한 알림
      if (orderData.userId) {
        // 기존 직접 전송도 유지 (호환성)
        this.io.to(`user:${orderData.userId}`).emit('order:status_updated', eventData.orderStatusChanged);

        // Mobile Socket Manager를 통한 알림
        await this.mobileSocketManager.notifyOrderStatusChanged(orderData.userId, orderData);
      }
      if (orderData.storeId) {
        // 기존 직접 전송도 유지 (호환성)
        this.io.to(`store:${orderData.storeId}`).emit('order:status_updated', eventData.orderStatusChanged);

        // Store Socket Manager를 통한 알림
        await this.notifyStoreOrderStatusChanged(orderData.storeId, orderData);
      }

      logger.info('주문 상태 변경 이벤트 발행 완료', { orderId: orderData.id, status: orderData.status });
    } catch (error) {
      logger.error('주문 상태 변경 이벤트 발행 실패', { error: error.message, orderData });
    }
  }

  /**
   * 배달 위치 업데이트 이벤트 발행
   */
  async publishDeliveryLocationUpdate(locationData) {
    try {
      const eventData = {
        deliveryLocationUpdate: {
          orderId: locationData.orderId,
          location: locationData.location,
          eta: locationData.eta,
          deliveryId: locationData.deliveryId,
          userId: locationData.userId,
          timestamp: new Date()
        }
      };

      await this.publishSocketEvent('DELIVERY_LOCATION_UPDATE', eventData);

      // 기존 직접 전송도 유지 (호환성)
      this.io.to(`tracking:order:${locationData.orderId}`).emit('tracking:location_updated', eventData.deliveryLocationUpdate);

      // Mobile Socket Manager를 통한 배달 위치 업데이트
      if (locationData.orderId) {
        await this.mobileSocketManager.notifyDeliveryLocationUpdate(locationData.orderId, locationData);
      }

      logger.info('배달 위치 업데이트 이벤트 발행 완료', { orderId: locationData.orderId });
    } catch (error) {
      logger.error('배달 위치 업데이트 이벤트 발행 실패', { error: error.message, locationData });
    }
  }

  /**
   * 채팅 메시지 이벤트 발행
   */
  async publishChatMessageReceived(messageData) {
    try {
      const eventData = {
        chatMessageReceived: {
          id: messageData.id,
          roomId: messageData.roomId,
          senderId: messageData.senderId,
          receiverId: messageData.receiverId,
          content: messageData.content,
          messageType: messageData.messageType,
          timestamp: new Date()
        }
      };

      await this.publishSocketEvent('CHAT_MESSAGE_RECEIVED', eventData);

      // 단일 소켓으로 직접 전송
      if (messageData.roomId) {
        this.io.to(`chat:${messageData.roomId}`).emit('chat:message_new', eventData.chatMessageReceived);
      }

      logger.info('채팅 메시지 이벤트 발행 완료', { messageId: messageData.id, roomId: messageData.roomId });
    } catch (error) {
      logger.error('채팅 메시지 이벤트 발행 실패', { error: error.message, messageData });
    }
  }

  /**
   * 알림 이벤트 발행
   */
  async publishNotificationReceived(notificationData) {
    try {
      const eventData = {
        notificationReceived: {
          id: notificationData.id,
          userId: notificationData.userId,
          title: notificationData.title,
          content: notificationData.content,
          type: notificationData.type,
          priority: notificationData.priority,
          timestamp: new Date()
        }
      };

      await this.publishSocketEvent('NOTIFICATION_RECEIVED', eventData);

      // 단일 소켓으로 직접 전송
      if (notificationData.userId) {
        this.io.to(`user:${notificationData.userId}`).emit('notification:new', eventData.notificationReceived);
      }

      logger.info('알림 이벤트 발행 완료', { notificationId: notificationData.id, userId: notificationData.userId });
    } catch (error) {
      logger.error('알림 이벤트 발행 실패', { error: error.message, notificationData });
    }
  }

  /**
   * 시스템 알림 이벤트 발행
   */
  async publishSystemAlert(alertData) {
    try {
      const eventData = {
        systemAlert: {
          id: alertData.id,
          title: alertData.title,
          message: alertData.message,
          type: alertData.type,
          priority: alertData.priority,
          targetUsers: alertData.targetUsers,
          timestamp: new Date()
        }
      };

      await this.publishSocketEvent('SYSTEM_ALERT', eventData);

      // 시스템 알림은 전체 또는 특정 사용자들에게 전송
      if (alertData.targetUsers && Array.isArray(alertData.targetUsers)) {
        alertData.targetUsers.forEach(userId => {
          this.io.to(`user:${userId}`).emit('system:alert', eventData.systemAlert);
        });
      } else {
        // 전체 사용자에게 브로드캐스트
        this.io.emit('system:alert', eventData.systemAlert);
      }

      logger.info('시스템 알림 이벤트 발행 완료', { alertId: alertData.id, type: alertData.type });
    } catch (error) {
      logger.error('시스템 알림 이벤트 발행 실패', { error: error.message, alertData });
    }
  }

  /**
   * 사용자별 연결 조회 헬퍼 (단일 소켓)
   */
  getConnectionsByUser(userId) {
    const connections = [];

    // 모든 연결에서 해당 사용자의 연결을 찾음
    for (const [socketId, connection] of this.connections) {
      if (connection.userId === userId || connection.userId === userId.toString()) {
        connections.push({
          socketId: socketId,
          userType: connection.userType,
          storeId: connection.storeId,
          connectedAt: connection.connectedAt
        });
      }
    }

    return connections;
  }

  /**
   * 단일 소켓 이벤트 발송 메서드
   */
  emitToRoom(room, event, data) {
    try {
      this.io.to(room).emit(event, data);
      logger.info(`이벤트 발송`, { room, event });
    } catch (error) {
      logger.error('이벤트 발송 실패', error);
    }
  }

  /**
   * 전체 브로드캐스트
   */
  broadcast(event, data) {
    try {
      this.io.emit(event, data);
      logger.info(`브로드캐스트`, { event });
    } catch (error) {
      logger.error('브로드캐스트 실패', error);
    }
  }

  /**
   * ====================================================================
   * 유틸리티 메서드들 (다국어, 권한, 데이터베이스)
   * ====================================================================
   */

  /**
   * 다국어 메시지 조회
   */
  getLocalizedMessage(messageKey, language = 'vi') {
    const messages = {
      'TOKEN_REQUIRED': {
        vi: 'Token xác thực là bắt buộc',
        ko: '인증 토큰이 필요합니다',
        en: 'Authentication token is required'
      },
      'CHAT_ACCESS_DENIED': {
        vi: 'Không có quyền truy cập phòng chat này',
        ko: '이 채팅방에 접근할 권한이 없습니다',
        en: 'Access denied to this chat room'
      },
      'MESSAGE_SEND_FAILED': {
        vi: 'Gửi tin nhắn thất bại',
        ko: '메시지 전송에 실패했습니다',
        en: 'Failed to send message'
      }
    };

    return messages[messageKey]?.[language] || messages[messageKey]?.['vi'] || messageKey;
  }

  /**
   * 주문 상태별 다국어 메시지
   */
  getOrderStatusMessage(status, language = 'vi') {
    const statusMessages = {
      'PENDING': {
        vi: 'Đơn hàng đang chờ xử lý',
        ko: '주문 처리 대기 중',
        en: 'Order is pending'
      },
      'CONFIRMED': {
        vi: 'Đơn hàng đã được xác nhận',
        ko: '주문이 확인되었습니다',
        en: 'Order confirmed'
      },
      'PREPARING': {
        vi: 'Đang chuẩn bị món ăn',
        ko: '음식을 준비 중입니다',
        en: 'Preparing your food'
      },
      'READY': {
        vi: 'Món ăn đã sẵn sàng',
        ko: '음식이 준비완료되었습니다',
        en: 'Food is ready'
      },
      'PICKED_UP': {
        vi: 'Đã bắt đầu giao hàng',
        ko: '배달이 시작되었습니다',
        en: 'Delivery started'
      },
      'DELIVERED': {
        vi: 'Giao hàng hoàn tất',
        ko: '배달이 완료되었습니다',
        en: 'Delivery completed'
      },
      'CANCELLED': {
        vi: 'Đơn hàng đã bị hủy',
        ko: '주문이 취소되었습니다',
        en: 'Order cancelled'
      }
    };

    return statusMessages[status]?.[language] || statusMessages[status]?.['vi'] || status;
  }

  /**
   * 채팅방 접근 권한 검증
   */
  async verifyChatRoomAccess(userId, roomId, userType) {
    try {
      // 실제 구현에서는 데이터베이스에서 채팅방 참여자 확인
      // 임시로 true 반환 (개발용)
      return true;

      // 실제 구현 예시:
      // const chatRoom = await ChatRoom.findByPk(roomId, {
      //   include: [{ model: ChatParticipant, where: { userId } }]
      // });
      // return !!chatRoom;
    } catch (error) {
      logger.error('채팅방 접근 권한 검증 실패', error);
      return false;
    }
  }

  /**
   * 채팅 메시지 저장
   *
   * ⚠️ 주의: GraphQL Mutation(mSendChatMessage)에서 이미 DB 저장을 처리합니다.
   * Socket.IO 이벤트는 실시간 전파용으로만 사용하고, 중복 저장하지 않습니다.
   */
  async saveChatMessage(messageData) {
    try {
      logger.info('💬 채팅 메시지 Socket 전파 (프로덕션)', {
        messageId: messageData.id,
        roomId: messageData.roomId,
        senderId: messageData.senderId
      });

      // GraphQL Mutation에서 이미 DB 저장이 완료되었으므로
      // Socket.IO는 실시간 전파만 담당
      // 별도 DB 저장 로직 불필요

      return true;
    } catch (error) {
      logger.error('❌ 채팅 메시지 Socket 전파 실패', error);
      throw error;
    }
  }

  /**
   * 채팅 히스토리 조회
   *
   * ⚠️ 주의: GraphQL Query(mGetChatMessages)에서 이미 DB 조회를 처리합니다.
   * Socket.IO에서는 히스토리 조회 기능을 사용하지 않습니다.
   */
  async getChatHistory(roomId, limit = 50, before = null) {
    try {
      logger.info('📜 채팅 히스토리 조회 (GraphQL Query 사용 권장)', {
        roomId,
        limit,
        before
      });

      // GraphQL Query(mGetChatMessages)를 사용하여 조회하세요
      // Socket.IO는 실시간 메시지 전파용으로만 사용
      return [];
    } catch (error) {
      logger.error('❌ 채팅 히스토리 조회 실패', error);
      return [];
    }
  }

  /**
   * 메시지 읽음 상태 업데이트
   *
   * ⚠️ 주의: GraphQL Mutation(mMarkMessagesRead)에서 이미 DB 업데이트를 처리합니다.
   * Socket.IO는 실시간 읽음 상태 전파용으로만 사용합니다.
   */
  async markMessagesAsRead(userId, roomId, lastReadMessageId) {
    try {
      logger.info('👁️ 메시지 읽음 상태 Socket 전파 (프로덕션)', {
        userId,
        roomId,
        lastReadMessageId
      });

      // GraphQL Mutation에서 이미 DB 업데이트가 완료되었으므로
      // Socket.IO는 실시간 전파만 담당
      // 별도 DB 업데이트 로직 불필요

      return true;
    } catch (error) {
      logger.error('❌ 메시지 읽음 상태 Socket 전파 실패', error);
    }
  }

  /**
   * 오프라인 사용자를 위한 푸시 알림 준비
   */
  async handleOfflineChatNotification(messageData) {
    try {
      // 채팅방 참여자 중 오프라인 사용자 확인
      const offlineParticipants = await this.getOfflineChatParticipants(messageData.roomId, messageData.senderId);

      for (const participant of offlineParticipants) {
        // FCM 푸시 알림 준비 (실제 구현 필요)
        logger.info('오프라인 푸시 알림 준비', {
          userId: participant.userId,
          messageId: messageData.id,
          roomId: messageData.roomId
        });
      }
    } catch (error) {
      logger.error('오프라인 채팅 알림 처리 실패', error);
    }
  }

  /**
   * 오프라인 채팅 참여자 조회
   */
  async getOfflineChatParticipants(roomId, excludeUserId) {
    try {
      // 실제 구현에서는 채팅방 참여자 중 현재 연결되지 않은 사용자 조회
      return [];

      // 실제 구현 예시:
      // const participants = await ChatParticipant.findAll({
      //   where: {
      //     roomId,
      //     userId: { [Op.ne]: excludeUserId }
      //   },
      //   include: [{ model: User, as: 'user' }]
      // });

      // return participants.filter(p => {
      //   const connections = this.getConnectionsByUser(p.userId);
      //   return connections.length === 0; // 연결되지 않은 사용자
      // });
    } catch (error) {
      logger.error('오프라인 채팅 참여자 조회 실패', error);
      return [];
    }
  }

  /**
   * ====================================================================
   * GraphQL 리졸버를 위한 실시간 서비스 인터페이스
   * ====================================================================
   */

  /**
   * GraphQL Context에서 사용할 수 있는 실시간 서비스 인터페이스
   */
  getRealtimeService() {
    return {
      // 상태 조회
      getRealtimeStatus: this.getRealtimeStatus.bind(this),
      getUnreadNotifications: this.getUnreadNotifications.bind(this),

      // 메시지 전송
      sendRealtimeMessage: this.sendRealtimeMessage.bind(this),
      markNotificationAsRead: this.markNotificationAsRead.bind(this),

      // 이벤트 발행 (주문, 배달, 채팅, 알림)
      publishOrderStatusChanged: this.publishOrderStatusChanged.bind(this),
      publishDeliveryLocationUpdate: this.publishDeliveryLocationUpdate.bind(this),
      publishChatMessageReceived: this.publishChatMessageReceived.bind(this),
      publishNotificationReceived: this.publishNotificationReceived.bind(this),
      publishSystemAlert: this.publishSystemAlert.bind(this),

      // Store 전용 알림 메서드들
      notifyStoreNewOrder: this.notifyStoreNewOrder.bind(this),
      notifyStorePaymentCompleted: this.notifyStorePaymentCompleted.bind(this),
      notifyStoreOrderStatusChanged: this.notifyStoreOrderStatusChanged.bind(this),
      notifyStorePOSConnectionStatus: this.notifyStorePOSConnectionStatus.bind(this),
      notifyStoreSystemAlert: this.notifyStoreSystemAlert.bind(this),
      notifyStoreAnalyticsUpdate: this.notifyStoreAnalyticsUpdate.bind(this),

      // Store 상태 및 메트릭
      isStoreConnected: this.isStoreConnected.bind(this),
      getStoreMetrics: this.getStoreMetrics.bind(this),
      updateStoreMetric: this.updateStoreMetric.bind(this),

      // 연결 관리
      getConnectionsByUser: this.getConnectionsByUser.bind(this),
      emitToRoom: this.emitToRoom.bind(this),
      broadcast: this.broadcast.bind(this),

      // 직접 이벤트 발송 (GraphQL 리졸버용)
      emitToUser: this.emitToUser.bind(this),
      emitToStore: this.emitToStore.bind(this),
      emitToChatRoom: this.emitToChatRoom.bind(this),
      emitToOrder: this.emitToOrder.bind(this),
      emitToDelivery: this.emitToDelivery.bind(this)
    };
  }

  /**
   * ====================================================================
   * GraphQL 리졸버를 위한 직접 이벤트 발송 메서드들
   * ====================================================================
   */

  /**
   * 특정 사용자에게 이벤트 전송
   */
  emitToUser(userId, eventName, data) {
    try {
      this.io.to(`user:${userId}`).emit(eventName, {
        ...data,
        timestamp: new Date(),
        serverTime: new Date().toISOString()
      });

      logger.info('👤 사용자 이벤트 전송', {
        userId,
        eventName,
        dataKeys: Object.keys(data || {})
      });
    } catch (error) {
      logger.error('사용자 이벤트 전송 실패', error);
    }
  }

  /**
   * 특정 매장에 이벤트 전송
   */
  emitToStore(storeId, eventName, data) {
    try {
      this.io.to(`store:${storeId}`).emit(eventName, {
        ...data,
        timestamp: new Date(),
        serverTime: new Date().toISOString()
      });

      logger.info('🏪 매장 이벤트 전송', {
        storeId,
        eventName,
        dataKeys: Object.keys(data || {})
      });
    } catch (error) {
      logger.error('매장 이벤트 전송 실패', error);
    }
  }

  /**
   * 특정 채팅방에 이벤트 전송
   */
  emitToChatRoom(chatRoomId, eventName, data) {
    try {
      this.io.to(`chat:${chatRoomId}`).emit(eventName, {
        ...data,
        timestamp: new Date(),
        serverTime: new Date().toISOString()
      });

      logger.info('💬 채팅방 이벤트 전송', {
        chatRoomId,
        eventName,
        dataKeys: Object.keys(data || {})
      });
    } catch (error) {
      logger.error('채팅방 이벤트 전송 실패', error);
    }
  }

  /**
   * 특정 주문에 이벤트 전송
   */
  emitToOrder(orderId, eventName, data) {
    try {
      this.io.to(`order:${orderId}`).emit(eventName, {
        ...data,
        timestamp: new Date(),
        serverTime: new Date().toISOString()
      });

      logger.info('📦 주문 이벤트 전송', {
        orderId,
        eventName,
        dataKeys: Object.keys(data || {})
      });
    } catch (error) {
      logger.error('주문 이벤트 전송 실패', error);
    }
  }

  /**
   * 특정 배달에 이벤트 전송
   */
  emitToDelivery(orderId, eventName, data) {
    try {
      this.io.to(`delivery:${orderId}`).emit(eventName, {
        ...data,
        timestamp: new Date(),
        serverTime: new Date().toISOString()
      });

      logger.info('🚚 배달 이벤트 전송', {
        orderId,
        eventName,
        dataKeys: Object.keys(data || {})
      });
    } catch (error) {
      logger.error('배달 이벤트 전송 실패', error);
    }
  }

  /**
   * ====================================================================
   * 연결 상태 모니터링 및 자동 정리
   * ====================================================================
   */

  /**
   * 연결 상태 모니터링 시작
   */
  startConnectionMonitoring() {
    // 5분마다 비활성 연결 정리
    this.connectionCleanupInterval = setInterval(() => {
      this.cleanupInactiveConnections();
    }, 5 * 60 * 1000);

    // 30초마다 하트비트 확인
    this.heartbeatCheckInterval = setInterval(() => {
      this.checkHeartbeats();
    }, 30 * 1000);

    logger.info('🔍 연결 상태 모니터링 시작');
  }

  /**
   * 비활성 연결 정리
   */
  cleanupInactiveConnections() {
    const now = new Date();
    const timeout = 10 * 60 * 1000; // 10분

    for (const [socketId, connection] of this.connections) {
      const lastActivity = connection.socket.lastHeartbeat || connection.connectedAt;

      if (now - lastActivity > timeout) {
        logger.info('🧹 비활성 연결 정리', {
          socketId,
          userId: connection.userId,
          lastActivity
        });

        connection.socket.disconnect(true);
        this.connections.delete(socketId);
      }
    }
  }

  /**
   * 하트비트 상태 확인
   */
  checkHeartbeats() {
    const now = new Date();
    const warningThreshold = 2 * 60 * 1000; // 2분

    for (const [socketId, connection] of this.connections) {
      const lastHeartbeat = connection.socket.lastHeartbeat || connection.connectedAt;

      if (now - lastHeartbeat > warningThreshold) {
        connection.socket.emit('heartbeat:ping', {
          timestamp: now.getTime()
        });
      }
    }
  }

  // === 싱글톤 인스턴스 관리 (socketManager.js 통합) ===

  static instance = null;

  /**
   * 싱글톤 인스턴스 설정
   * @param {UnifiedSocketServer} server - UnifiedSocketServer 인스턴스
   */
  static setInstance(server) {
    UnifiedSocketServer.instance = server;
  }

  /**
   * 싱글톤 인스턴스 가져오기
   * @returns {UnifiedSocketServer|null} Socket.IO 서버 인스턴스
   */
  static getInstance() {
    return UnifiedSocketServer.instance;
  }

  /**
   * Socket.IO 서버 초기화 여부 확인
   * @returns {boolean} 초기화 여부
   */
  static isInitialized() {
    return UnifiedSocketServer.instance !== null;
  }
}

// 레거시 호환성을 위한 export (socketManager.js 대체)
export const setSocketServer = (server) => UnifiedSocketServer.setInstance(server);
export const getSocketServer = () => UnifiedSocketServer.getInstance();
export const isSocketServerInitialized = () => UnifiedSocketServer.isInitialized();

export default UnifiedSocketServer;
