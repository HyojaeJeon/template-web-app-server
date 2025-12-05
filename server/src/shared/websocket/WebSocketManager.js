/**
 * Store Socket Manager
 * 점주/매니저 웹앱을 위한 완전한 실시간 Socket.IO 관리 시스템
 * (StoreSocketEvents.js 통합)
 *
 * 기능:
 * - Store 전용 Socket 연결 관리
 * - 실시간 알림 발송
 * - 매장별 Room 관리
 * - 권한 기반 이벤트 필터링
 * - 성능 모니터링 및 최적화
 *
 * 이벤트 카테고리:
 * 1. 주문 관련 - 신규 주문, 상태 변경, 취소
 * 2. 결제 관련 - 결제 완료, 실패, 환불
 * 3. 매장 관리 - 직원 로그인/로그아웃, 설정 변경
 * 4. 시스템 - 중요 알림, 에러 알림
 * 5. POS 연동 - POS 상태, 동기화
 * 6. 분석 데이터 - 실시간 통계 업데이트
 */

import loggerDefault from '../utils/utilities/Logger.js';
import db from '../../models/index.js';

// === Store 전용 Socket 이벤트 상수 (StoreSocketEvents.js 통합) ===
export const STORE_SOCKET_EVENTS = {
  // === 주문 관련 이벤트 ===
  NEW_ORDER: 'store:new_order',
  ORDER_STATUS_CHANGED: 'store:order_status_changed',
  ORDER_CANCELLED: 'store:order_cancelled',
  ORDER_REFUND_REQUESTED: 'store:order_refund_requested',
  ORDER_CUSTOMER_NOTE: 'store:order_customer_note',

  // === 결제 관련 이벤트 ===
  PAYMENT_COMPLETED: 'store:payment_completed',
  PAYMENT_FAILED: 'store:payment_failed',
  PAYMENT_REFUNDED: 'store:payment_refunded',
  PAYMENT_DISPUTE: 'store:payment_dispute',

  // === 매장 관리 이벤트 ===
  STAFF_LOGIN: 'store:staff_login',
  STAFF_LOGOUT: 'store:staff_logout',
  SETTINGS_CHANGED: 'store:settings_changed',
  MENU_UPDATED: 'store:menu_updated',
  STORE_STATUS_CHANGED: 'store:status_changed',

  // === 시스템 알림 이벤트 ===
  SYSTEM_ALERT: 'store:system_alert',
  ERROR_NOTIFICATION: 'store:error_notification',
  MAINTENANCE_NOTICE: 'store:maintenance_notice',
  URGENT_NOTIFICATION: 'store:urgent_notification',

  // === POS 시스템 이벤트 ===
  POS_CONNECTION_STATUS: 'store:pos_connection_status',
  POS_SYNC_STATUS: 'store:pos_sync_status',
  POS_ERROR: 'store:pos_error',
  POS_TRANSACTION_UPDATE: 'store:pos_transaction_update',

  // === 분석 및 통계 이벤트 ===
  ANALYTICS_UPDATE: 'store:analytics_update',
  REVENUE_UPDATE: 'store:revenue_update',
  CUSTOMER_COUNT_UPDATE: 'store:customer_count_update',
  PERFORMANCE_ALERT: 'store:performance_alert',

  // === 고객 관리 이벤트 ===
  CUSTOMER_REVIEW: 'store:customer_review',
  CUSTOMER_COMPLAINT: 'store:customer_complaint',
  CUSTOMER_FEEDBACK: 'store:customer_feedback',

  // === 채팅 관련 이벤트 ===
  CHAT_MESSAGE_RECEIVED: 'store:chat_message_received',
  CHAT_SUPPORT_REQUEST: 'store:chat_support_request',
  CHAT_TYPING_INDICATOR: 'store:chat_typing_indicator',
  CHAT_READ_STATUS: 'store:chat_read_status',
  CHAT_ROOM_CREATED: 'store:chat_room_created',
  CHAT_ROOM_JOINED: 'store:chat_room_joined',
  CHAT_ROOM_LEFT: 'store:chat_room_left',

  // === 배달 관련 이벤트 ===
  DELIVERY_STATUS_UPDATE: 'store:delivery_status_update',
  DELIVERY_ISSUE: 'store:delivery_issue',
  DELIVERY_DELAY: 'store:delivery_delay',

  // === 재고 관련 이벤트 ===
  INVENTORY_LOW: 'store:inventory_low',
  INVENTORY_OUT: 'store:inventory_out',
  MENU_ITEM_UNAVAILABLE: 'store:menu_item_unavailable'
};

// === Store 이벤트 메시지 템플릿 (다국어 지원) ===
export const STORE_EVENT_MESSAGES = {
  // === 주문 관련 메시지 ===
  [STORE_SOCKET_EVENTS.NEW_ORDER]: {
    title: {
      vi: 'Đơn hàng mới',
      ko: '새 주문',
      en: 'New Order'
    },
    message: {
      vi: 'Có đơn hàng mới từ khách hàng {customerName}',
      ko: '{customerName} 고객으로부터 새 주문이 들어왔습니다',
      en: 'New order from customer {customerName}'
    },
    priority: 'HIGH',
    sound: 'new-order.mp3',
    icon: '🛒'
  },

  [STORE_SOCKET_EVENTS.ORDER_CANCELLED]: {
    title: {
      vi: 'Đơn hàng bị hủy',
      ko: '주문 취소',
      en: 'Order Cancelled'
    },
    message: {
      vi: 'Đơn hàng #{orderId} đã bị hủy',
      ko: '주문 #{orderId}이 취소되었습니다',
      en: 'Order #{orderId} has been cancelled'
    },
    priority: 'MEDIUM',
    sound: 'order-cancelled.mp3',
    icon: '❌'
  },

  // === 결제 관련 메시지 ===
  [STORE_SOCKET_EVENTS.PAYMENT_COMPLETED]: {
    title: {
      vi: 'Thanh toán thành công',
      ko: '결제 완료',
      en: 'Payment Completed'
    },
    message: {
      vi: 'Thanh toán {amount} VND đã hoàn tất cho đơn hàng #{orderId}',
      ko: '주문 #{orderId}의 결제 {amount}원이 완료되었습니다',
      en: 'Payment of {amount} VND completed for order #{orderId}'
    },
    priority: 'HIGH',
    sound: 'payment-success.mp3',
    icon: '💰'
  },

  [STORE_SOCKET_EVENTS.PAYMENT_FAILED]: {
    title: {
      vi: 'Thanh toán thất bại',
      ko: '결제 실패',
      en: 'Payment Failed'
    },
    message: {
      vi: 'Thanh toán cho đơn hàng #{orderId} đã thất bại',
      ko: '주문 #{orderId}의 결제가 실패했습니다',
      en: 'Payment failed for order #{orderId}'
    },
    priority: 'HIGH',
    sound: 'payment-failed.mp3',
    icon: '⚠️'
  },

  // === 시스템 알림 메시지 ===
  [STORE_SOCKET_EVENTS.SYSTEM_ALERT]: {
    title: {
      vi: 'Thông báo hệ thống',
      ko: '시스템 알림',
      en: 'System Alert'
    },
    message: {
      vi: '{message}',
      ko: '{message}',
      en: '{message}'
    },
    priority: 'MEDIUM',
    sound: 'system-alert.mp3',
    icon: '🔔'
  },

  // === POS 시스템 메시지 ===
  [STORE_SOCKET_EVENTS.POS_CONNECTION_STATUS]: {
    title: {
      vi: 'Trạng thái POS',
      ko: 'POS 상태',
      en: 'POS Status'
    },
    message: {
      vi: 'POS {status}: {message}',
      ko: 'POS {status}: {message}',
      en: 'POS {status}: {message}'
    },
    priority: 'MEDIUM',
    sound: 'pos-status.mp3',
    icon: '🖥️'
  },

  // === 분석 업데이트 메시지 ===
  [STORE_SOCKET_EVENTS.ANALYTICS_UPDATE]: {
    title: {
      vi: 'Cập nhật thống kê',
      ko: '통계 업데이트',
      en: 'Analytics Update'
    },
    message: {
      vi: 'Dữ liệu thống kê đã được cập nhật',
      ko: '분석 데이터가 업데이트되었습니다',
      en: 'Analytics data has been updated'
    },
    priority: 'LOW',
    sound: null,
    icon: '📊'
  }
};

// === Store 알림 우선순위 레벨 ===
export const STORE_NOTIFICATION_PRIORITIES = {
  URGENT: {
    level: 4,
    color: '#DA020E', // Error Red
    duration: 0, // 수동으로 닫을 때까지 유지
    sound: true
  },
  HIGH: {
    level: 3,
    color: '#FFDD00', // Warning Gold
    duration: 10000, // 10초
    sound: true
  },
  MEDIUM: {
    level: 2,
    color: '#2AC1BC', // Primary Mint
    duration: 7000, // 7초
    sound: false
  },
  LOW: {
    level: 1,
    color: '#00B14F', // Secondary Green
    duration: 5000, // 5초
    sound: false
  }
};

// === Store Room 타입 정의 ===
export const STORE_ROOM_TYPES = {
  STORE: 'store',        // store:{storeId}
  MANAGER: 'manager',    // manager:{storeId}
  STAFF: 'staff',        // staff:{storeId}
  POS: 'pos',           // pos:{storeId}
  ANALYTICS: 'analytics' // analytics:{storeId}
};

// === Store 실시간 통계 메트릭 정의 ===
export const STORE_REALTIME_METRICS = {
  // 주문 관련 메트릭
  ORDERS_TODAY: 'orders_today',
  ORDERS_PENDING: 'orders_pending',
  ORDERS_PREPARING: 'orders_preparing',
  ORDERS_READY: 'orders_ready',

  // 매출 관련 메트릭
  REVENUE_TODAY: 'revenue_today',
  REVENUE_THIS_HOUR: 'revenue_this_hour',
  AVERAGE_ORDER_VALUE: 'average_order_value',

  // 고객 관련 메트릭
  ACTIVE_CUSTOMERS: 'active_customers',
  NEW_CUSTOMERS: 'new_customers',
  CUSTOMER_SATISFACTION: 'customer_satisfaction',

  // 운영 관련 메트릭
  AVERAGE_PREP_TIME: 'average_prep_time',
  STAFF_ONLINE: 'staff_online',
  POS_STATUS: 'pos_status',

  // 배달 관련 메트릭
  DELIVERIES_IN_PROGRESS: 'deliveries_in_progress',
  AVERAGE_DELIVERY_TIME: 'average_delivery_time',
  DELIVERY_SUCCESS_RATE: 'delivery_success_rate'
};

const logger = loggerDefault;

export class StoreSocketManager {
  constructor(unifiedSocketServer) {
    this.io = unifiedSocketServer.io;
    this.connections = new Map(); // storeId -> Set of socketIds
    this.storeMetrics = new Map(); // storeId -> realtime metrics
    this.notificationQueue = new Map(); // storeId -> pending notifications
    this.unifiedSocket = unifiedSocketServer;
    this.storeHeartbeats = new Map(); // storeId -> heartbeat data
    this.heartbeatCheckInterval = null; // Heartbeat 모니터링 interval

    this.setupStoreSocketHandlers();
    this.initializeMetrics();
    this.startHeartbeatMonitoring(); // Heartbeat 모니터링 시작

    logger.info('🏪 Store Socket Manager 초기화 완료');
  }

  /**
   * Store 전용 Socket 핸들러 설정
   */
  setupStoreSocketHandlers() {
    // UnifiedSocketServer의 connection 이벤트에 추가 핸들러 등록
    this.io.on('connection', (socket) => {
      // Store 클라이언트만 처리
      if (socket.userType === 'STORE' && socket.storeId) {
        this.handleStoreConnection(socket);
      }
    });
  }

  /**
   * Store 연결 처리
   */
  async handleStoreConnection(socket) {
    const { storeId, userId, userRole } = socket;

    try {
      // Null safety 확보: user 정보가 없으면 socket 정보 폴백 사용
      const safeStoreId = storeId || socket.user?.storeId || socket.storeId;
      const safeUserId = userId || socket.user?.id || socket.userId;

      // Store 연결 맵에 추가
      if (safeStoreId && !this.connections.has(safeStoreId)) {
        this.connections.set(safeStoreId, new Set());
      }
      if (safeStoreId) {
        this.connections.get(safeStoreId).add(socket.id);
      }

      // Store 전용 Room 가입
      await this.joinStoreRooms(socket, safeStoreId, userRole);

      // Store 전용 이벤트 핸들러 등록
      this.registerStoreEventHandlers(socket);

      // 연결 성공 알림
      socket.emit('store:connected', {
        storeId: safeStoreId,
        userId: safeUserId,
        userRole,
        connectedAt: new Date(),
        availableEvents: Object.keys(STORE_SOCKET_EVENTS),
        currentMetrics: this.getStoreMetrics(safeStoreId),
        tokenRefresh: socket.tokenRefresh || false
      });

      // 대기 중인 알림 전송
      if (safeStoreId) {
        await this.sendPendingNotifications(socket, safeStoreId);
      }

      logger.info('🏪 Store 클라이언트 연결 성공', {
        storeId: safeStoreId,
        userId: safeUserId,
        userRole,
        socketId: socket.id,
        tokenRefresh: socket.tokenRefresh || false
      });

      // 연결 해제 처리
      socket.on('disconnect', () => {
        this.handleStoreDisconnection(socket, safeStoreId);
      });

    } catch (error) {
      logger.error('Store 연결 처리 실패', {
        error: error.message,
        storeId: safeStoreId,
        userId: safeUserId,
        tokenRefresh: socket.tokenRefresh || false
      });

      socket.emit('store:connection_error', {
        error: 'CONNECTION_FAILED',
        message: 'Store 연결에 실패했습니다'
      });
    }
  }

  /**
   * Store Room 가입 처리
   */
  async joinStoreRooms(socket, storeId, userRole) {
    // 기본 Store Room
    await socket.join(`${STORE_ROOM_TYPES.STORE}:${storeId}`);

    // 역할별 Room 가입
    if (userRole === 'STORE_MANAGER' || userRole === 'STORE_OWNER') {
      await socket.join(`${STORE_ROOM_TYPES.MANAGER}:${storeId}`);
      await socket.join(`${STORE_ROOM_TYPES.ANALYTICS}:${storeId}`);
    }

    if (userRole === 'STORE_STAFF') {
      await socket.join(`${STORE_ROOM_TYPES.STAFF}:${storeId}`);
    }

    // POS 권한이 있는 경우
    if (userRole !== 'STORE_STAFF') {
      await socket.join(`${STORE_ROOM_TYPES.POS}:${storeId}`);
    }

    logger.info('Store Room 가입 완료', {
      storeId,
      userRole,
      rooms: [
        `${STORE_ROOM_TYPES.STORE}:${storeId}`,
        ...(userRole !== 'STORE_STAFF' ? [`${STORE_ROOM_TYPES.MANAGER}:${storeId}`] : [])
      ]
    });
  }

  /**
   * Store 전용 이벤트 핸들러 등록
   */
  registerStoreEventHandlers(socket) {
    const { storeId, userRole } = socket;

    // === 주문 관련 이벤트 ===
    socket.on('store:update_order_status', (data) =>
      this.handleOrderStatusUpdate(socket, data));

    socket.on('store:accept_order', (data) =>
      this.handleAcceptOrder(socket, data));

    socket.on('store:reject_order', (data) =>
      this.handleRejectOrder(socket, data));

    // === 메뉴 관리 이벤트 ===
    socket.on('store:update_menu_availability', (data) =>
      this.handleMenuAvailabilityUpdate(socket, data));

    socket.on('store:update_menu_item', (data) =>
      this.handleMenuItemUpdate(socket, data));

    // === 설정 관리 이벤트 (매니저 이상만) ===
    if (userRole === 'STORE_MANAGER' || userRole === 'STORE_OWNER') {
      socket.on('store:update_settings', (data) =>
        this.handleStoreSettingsUpdate(socket, data));

      socket.on('store:update_staff_permissions', (data) =>
        this.handleStaffPermissionsUpdate(socket, data));
    }

    // === Heartbeat 이벤트 (Ack 기반 RTT 측정) ===
    socket.on('heartbeat', (clientTimestamp, ack) => {
      if (typeof ack === 'function') {
        ack(Date.now());  // 서버 타임스탬프 반환
      }
    });

    // === POS 시스템 이벤트 ===
    socket.on('store:pos_sync_request', (data) =>
      this.handlePOSSyncRequest(socket, data));

    socket.on('store:pos_status_check', (data) =>
      this.handlePOSStatusCheck(socket, data));

    // === 분석 데이터 요청 (매니저 이상만) ===
    if (userRole !== 'STORE_STAFF') {
      socket.on('store:request_analytics', (data) =>
        this.handleAnalyticsRequest(socket, data));

      socket.on('store:request_realtime_metrics', (data) =>
        this.handleRealtimeMetricsRequest(socket, data));
    }

    // === 알림 설정 이벤트 ===
    socket.on('store:update_notification_settings', (data) =>
      this.handleNotificationSettingsUpdate(socket, data));

    // === 채팅 관련 이벤트 ===
    socket.on('store:send_chat_message', (data) =>
      this.handleStoreChatMessage(socket, data));

    socket.on('store:chat_typing', (data) =>
      this.handleStoreChatTyping(socket, data));

    socket.on('store:mark_chat_read', (data) =>
      this.handleStoreChatMarkRead(socket, data));

    socket.on('store:create_chat_room', (data) =>
      this.handleStoreCreateChatRoom(socket, data));

    socket.on('store:join_chat_room', (data) =>
      this.handleStoreJoinChatRoom(socket, data));

    socket.on('store:leave_chat_room', (data) =>
      this.handleStoreLeaveChatRoom(socket, data));

    // === 점주 Heartbeat 이벤트 (온라인 상태 추적) ===
    socket.on('store:heartbeat', (data) =>
      this.handleStoreHeartbeat(socket, data));

    logger.info('Store 이벤트 핸들러 등록 완료', {
      storeId,
      userRole,
      handlersCount: userRole === 'STORE_STAFF' ? 15 : 19
    });
  }

  /**
   * Store 연결 해제 처리
   */
  handleStoreDisconnection(socket, storeId) {
    try {
      // 연결 맵에서 제거
      if (this.connections.has(storeId)) {
        this.connections.get(storeId).delete(socket.id);

        // 해당 매장의 연결이 모두 해제된 경우
        if (this.connections.get(storeId).size === 0) {
          this.connections.delete(storeId);
          logger.info('매장의 모든 연결이 해제됨', { storeId });
        }
      }

      logger.info('🏪 Store 클라이언트 연결 해제', {
        storeId,
        socketId: socket.id,
        remainingConnections: this.connections.get(storeId)?.size || 0
      });

    } catch (error) {
      logger.error('Store 연결 해제 처리 실패', {
        error: error.message,
        storeId,
        socketId: socket.id
      });
    }
  }

  /**
   * ====================================================================
   * Store 실시간 이벤트 발송 메서드들
   * ====================================================================
   */

  /**
   * 새 주문 알림 발송
   */
  async emitNewOrder(storeId, orderData) {
    try {
      const notification = this.createNotification(
        STORE_SOCKET_EVENTS.NEW_ORDER,
        {
          orderId: orderData.id,
          customerName: orderData.customer?.fullName || '고객',
          customerPhone: orderData.customer?.phone || '',
          items: orderData.items || [],
          totalAmount: orderData.totalAmount,
          paymentMethod: orderData.paymentMethod,
          deliveryAddress: orderData.deliveryAddress,
          estimatedTime: orderData.estimatedTime,
          notes: orderData.notes,
          timestamp: new Date()
        },
        'HIGH'
      );

      await this.sendToStoreRoom(storeId, STORE_SOCKET_EVENTS.NEW_ORDER, notification);

      // 실시간 메트릭 업데이트
      this.updateStoreMetric(storeId, STORE_REALTIME_METRICS.ORDERS_PENDING, 1);

      logger.info('새 주문 알림 발송 완료', {
        storeId,
        orderId: orderData.id,
        customerName: orderData.customer?.fullName
      });

    } catch (error) {
      logger.error('새 주문 알림 발송 실패', {
        error: error.message,
        storeId,
        orderData
      });
    }
  }

  /**
   * 결제 완료 알림 발송
   */
  async emitPaymentCompleted(storeId, paymentData) {
    try {
      const notification = this.createNotification(
        STORE_SOCKET_EVENTS.PAYMENT_COMPLETED,
        {
          orderId: paymentData.orderId,
          paymentId: paymentData.id,
          amount: paymentData.amount,
          currency: paymentData.currency || 'VND',
          paymentMethod: paymentData.method,
          transactionId: paymentData.transactionId,
          timestamp: new Date()
        },
        'HIGH'
      );

      await this.sendToStoreRoom(storeId, STORE_SOCKET_EVENTS.PAYMENT_COMPLETED, notification);

      // 실시간 메트릭 업데이트
      this.updateStoreMetric(storeId, STORE_REALTIME_METRICS.REVENUE_TODAY, paymentData.amount);

      logger.info('결제 완료 알림 발송 완료', {
        storeId,
        orderId: paymentData.orderId,
        amount: paymentData.amount
      });

    } catch (error) {
      logger.error('결제 완료 알림 발송 실패', {
        error: error.message,
        storeId,
        paymentData
      });
    }
  }

  /**
   * 주문 상태 변경 알림 발송
   */
  async emitOrderStatusChanged(storeId, orderData) {
    try {
      const notification = this.createNotification(
        STORE_SOCKET_EVENTS.ORDER_STATUS_CHANGED,
        {
          orderId: orderData.id,
          status: orderData.status,
          previousStatus: orderData.previousStatus,
          updatedBy: orderData.updatedBy,
          timestamp: new Date()
        },
        'MEDIUM'
      );

      await this.sendToStoreRoom(storeId, STORE_SOCKET_EVENTS.ORDER_STATUS_CHANGED, notification);

      logger.info('주문 상태 변경 알림 발송 완료', {
        storeId,
        orderId: orderData.id,
        status: orderData.status
      });

    } catch (error) {
      logger.error('주문 상태 변경 알림 발송 실패', {
        error: error.message,
        storeId,
        orderData
      });
    }
  }

  /**
   * POS 연결 상태 알림 발송
   */
  async emitPOSConnectionStatus(storeId, posData) {
    try {
      const notification = this.createNotification(
        STORE_SOCKET_EVENTS.POS_CONNECTION_STATUS,
        {
          posId: posData.posId,
          status: posData.status,
          lastSync: posData.lastSync,
          errorMessage: posData.errorMessage,
          connectionDetails: posData.connectionDetails,
          timestamp: new Date()
        },
        posData.status === 'ERROR' ? 'HIGH' : 'MEDIUM'
      );

      await this.sendToPOSRoom(storeId, STORE_SOCKET_EVENTS.POS_CONNECTION_STATUS, notification);

      logger.info('POS 연결 상태 알림 발송 완료', {
        storeId,
        posId: posData.posId,
        status: posData.status
      });

    } catch (error) {
      logger.error('POS 연결 상태 알림 발송 실패', {
        error: error.message,
        storeId,
        posData
      });
    }
  }

  /**
   * 시스템 알림 발송
   */
  async emitSystemAlert(storeId, alertData) {
    try {
      const notification = this.createNotification(
        STORE_SOCKET_EVENTS.SYSTEM_ALERT,
        {
          title: alertData.title,
          message: alertData.message,
          type: alertData.type,
          actionRequired: alertData.actionRequired,
          timestamp: new Date()
        },
        alertData.priority || 'MEDIUM'
      );

      await this.sendToStoreRoom(storeId, STORE_SOCKET_EVENTS.SYSTEM_ALERT, notification);

      logger.info('시스템 알림 발송 완료', {
        storeId,
        alertType: alertData.type,
        priority: alertData.priority
      });

    } catch (error) {
      logger.error('시스템 알림 발송 실패', {
        error: error.message,
        storeId,
        alertData
      });
    }
  }

  /**
   * 실시간 분석 데이터 업데이트 발송
   */
  async emitAnalyticsUpdate(storeId, analyticsData) {
    try {
      const notification = this.createNotification(
        STORE_SOCKET_EVENTS.ANALYTICS_UPDATE,
        {
          type: analyticsData.type,
          metrics: analyticsData.metrics,
          period: analyticsData.period,
          timestamp: new Date()
        },
        'LOW'
      );

      await this.sendToAnalyticsRoom(storeId, STORE_SOCKET_EVENTS.ANALYTICS_UPDATE, notification);

      // 매장 메트릭 업데이트
      if (analyticsData.metrics) {
        Object.entries(analyticsData.metrics).forEach(([key, value]) => {
          this.setStoreMetric(storeId, key, value);
        });
      }

      logger.info('분석 데이터 업데이트 발송 완료', {
        storeId,
        type: analyticsData.type,
        metricsCount: Object.keys(analyticsData.metrics || {}).length
      });

    } catch (error) {
      logger.error('분석 데이터 업데이트 발송 실패', {
        error: error.message,
        storeId,
        analyticsData
      });
    }
  }

  /**
   * ====================================================================
   * Store 이벤트 핸들러들
   * ====================================================================
   */

  /**
   * 주문 상태 업데이트 처리
   */
  async handleOrderStatusUpdate(socket, data) {
    try {
      const { orderId, status, notes } = data;
      const { storeId, userId } = socket;

      // 주문 상태 업데이트 로직 (실제 구현 필요)
      logger.info('주문 상태 업데이트 요청', {
        storeId,
        orderId,
        status,
        updatedBy: userId
      });

      // 성공 응답
      socket.emit('store:order_status_updated', {
        orderId,
        status,
        success: true,
        timestamp: new Date()
      });

      // 다른 연결된 클라이언트들에게 알림
      socket.to(`${STORE_ROOM_TYPES.STORE}:${storeId}`).emit(
        STORE_SOCKET_EVENTS.ORDER_STATUS_CHANGED,
        {
          orderId,
          status,
          updatedBy: userId,
          notes,
          timestamp: new Date()
        }
      );

    } catch (error) {
      logger.error('주문 상태 업데이트 실패', error);
      socket.emit('store:error', {
        action: 'order_status_update',
        error: error.message
      });
    }
  }

  /**
   * 주문 수락 처리
   */
  async handleAcceptOrder(socket, data) {
    try {
      const { orderId, estimatedTime } = data;
      const { storeId, userId } = socket;

      logger.info('주문 수락 요청', {
        storeId,
        orderId,
        estimatedTime,
        acceptedBy: userId
      });

      // 주문 수락 로직 (실제 구현 필요)

      socket.emit('store:order_accepted', {
        orderId,
        estimatedTime,
        success: true,
        timestamp: new Date()
      });

      // 실시간 메트릭 업데이트
      this.updateStoreMetric(storeId, STORE_REALTIME_METRICS.ORDERS_PREPARING, 1);
      this.updateStoreMetric(storeId, STORE_REALTIME_METRICS.ORDERS_PENDING, -1);

    } catch (error) {
      logger.error('주문 수락 처리 실패', error);
      socket.emit('store:error', {
        action: 'accept_order',
        error: error.message
      });
    }
  }

  /**
   * 메뉴 가용성 업데이트 처리
   */
  async handleMenuAvailabilityUpdate(socket, data) {
    try {
      const { menuItemId, available, reason } = data;
      const { storeId, userId } = socket;

      logger.info('메뉴 가용성 업데이트 요청', {
        storeId,
        menuItemId,
        available,
        reason,
        updatedBy: userId
      });

      // 메뉴 가용성 업데이트 로직 (실제 구현 필요)

      socket.emit('store:menu_availability_updated', {
        menuItemId,
        available,
        success: true,
        timestamp: new Date()
      });

      // 매장의 모든 클라이언트에게 알림
      this.sendToStoreRoom(storeId, STORE_SOCKET_EVENTS.MENU_UPDATED, {
        type: 'AVAILABILITY_CHANGE',
        menuItemId,
        available,
        reason,
        updatedBy: userId,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('메뉴 가용성 업데이트 실패', error);
      socket.emit('store:error', {
        action: 'menu_availability_update',
        error: error.message
      });
    }
  }

  /**
   * 실시간 메트릭 요청 처리
   */
  async handleRealtimeMetricsRequest(socket, data) {
    try {
      const { storeId } = socket;
      const { metrics } = data;

      const currentMetrics = this.getStoreMetrics(storeId);

      // 요청된 메트릭만 필터링
      const requestedMetrics = metrics
        ? Object.fromEntries(
            Object.entries(currentMetrics).filter(([key]) => metrics.includes(key))
          )
        : currentMetrics;

      socket.emit('store:realtime_metrics_response', {
        storeId,
        metrics: requestedMetrics,
        timestamp: new Date()
      });

      logger.info('실시간 메트릭 요청 처리 완료', {
        storeId,
        requestedMetrics: metrics?.length || 'all',
        responseSize: Object.keys(requestedMetrics).length
      });

    } catch (error) {
      logger.error('실시간 메트릭 요청 처리 실패', error);
      socket.emit('store:error', {
        action: 'realtime_metrics_request',
        error: error.message
      });
    }
  }

  /**
   * ====================================================================
   * 유틸리티 메서드들
   * ====================================================================
   */

  /**
   * 알림 객체 생성
   */
  createNotification(eventType, data, priority = 'MEDIUM') {
    const template = STORE_EVENT_MESSAGES[eventType];
    const priorityConfig = STORE_NOTIFICATION_PRIORITIES[priority];

    return {
      id: `store_notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      priority,
      title: template?.title || { vi: 'Thông báo', ko: '알림', en: 'Notification' },
      message: template?.message || { vi: '', ko: '', en: '' },
      icon: template?.icon || '🔔',
      sound: template?.sound || null,
      data,
      timestamp: new Date(),
      config: priorityConfig
    };
  }

  /**
   * Store Room에 이벤트 발송
   */
  async sendToStoreRoom(storeId, eventName, data) {
    const room = `${STORE_ROOM_TYPES.STORE}:${storeId}`;
    this.io.to(room).emit(eventName, data);

    logger.debug('Store Room 이벤트 발송', {
      storeId,
      room,
      eventName,
      dataKeys: Object.keys(data || {})
    });
  }

  /**
   * Manager Room에 이벤트 발송
   */
  async sendToManagerRoom(storeId, eventName, data) {
    const room = `${STORE_ROOM_TYPES.MANAGER}:${storeId}`;
    this.io.to(room).emit(eventName, data);

    logger.debug('Manager Room 이벤트 발송', {
      storeId,
      room,
      eventName
    });
  }

  /**
   * POS Room에 이벤트 발송
   */
  async sendToPOSRoom(storeId, eventName, data) {
    const room = `${STORE_ROOM_TYPES.POS}:${storeId}`;
    this.io.to(room).emit(eventName, data);

    logger.debug('POS Room 이벤트 발송', {
      storeId,
      room,
      eventName
    });
  }

  /**
   * Analytics Room에 이벤트 발송
   */
  async sendToAnalyticsRoom(storeId, eventName, data) {
    const room = `${STORE_ROOM_TYPES.ANALYTICS}:${storeId}`;
    this.io.to(room).emit(eventName, data);

    logger.debug('Analytics Room 이벤트 발송', {
      storeId,
      room,
      eventName
    });
  }

  /**
   * 대기 중인 알림 전송
   */
  async sendPendingNotifications(socket, storeId) {
    try {
      const pendingNotifications = this.notificationQueue.get(storeId) || [];

      if (pendingNotifications.length > 0) {
        for (const notification of pendingNotifications) {
          socket.emit('store:pending_notification', notification);
        }

        // 전송 완료 후 큐에서 제거
        this.notificationQueue.delete(storeId);

        logger.info('대기 중인 알림 전송 완료', {
          storeId,
          notificationCount: pendingNotifications.length
        });
      }
    } catch (error) {
      logger.error('대기 중인 알림 전송 실패', {
        error: error.message,
        storeId
      });
    }
  }

  /**
   * 매장 연결 상태 확인
   */
  isStoreConnected(storeId) {
    return this.connections.has(storeId) && this.connections.get(storeId).size > 0;
  }

  /**
   * 연결된 매장 수 조회
   */
  getConnectedStoresCount() {
    return this.connections.size;
  }

  /**
   * 특정 매장의 연결 수 조회
   */
  getStoreConnectionCount(storeId) {
    return this.connections.get(storeId)?.size || 0;
  }

  /**
   * ====================================================================
   * 실시간 메트릭 관리
   * ====================================================================
   */

  /**
   * 메트릭 초기화
   */
  initializeMetrics() {
    // 기본 메트릭 구조 생성
    Object.values(STORE_REALTIME_METRICS).forEach(metric => {
      // 각 매장별로 메트릭 초기화는 첫 연결 시 수행
    });

    logger.info('Store 메트릭 시스템 초기화 완료');
  }

  /**
   * 매장 메트릭 조회
   */
  getStoreMetrics(storeId) {
    if (!this.storeMetrics.has(storeId)) {
      this.storeMetrics.set(storeId, this.createDefaultMetrics());
    }

    return this.storeMetrics.get(storeId);
  }

  /**
   * 매장 메트릭 설정
   */
  setStoreMetric(storeId, metric, value) {
    if (!this.storeMetrics.has(storeId)) {
      this.storeMetrics.set(storeId, this.createDefaultMetrics());
    }

    const metrics = this.storeMetrics.get(storeId);
    metrics[metric] = value;
    metrics.lastUpdated = new Date();

    // 실시간으로 연결된 클라이언트들에게 업데이트 전송
    if (this.isStoreConnected(storeId)) {
      this.sendToAnalyticsRoom(storeId, 'store:metric_updated', {
        metric,
        value,
        timestamp: new Date()
      });
    }
  }

  /**
   * 매장 메트릭 증가/감소
   */
  updateStoreMetric(storeId, metric, delta) {
    const metrics = this.getStoreMetrics(storeId);
    const currentValue = metrics[metric] || 0;
    this.setStoreMetric(storeId, metric, currentValue + delta);
  }

  /**
   * 기본 메트릭 구조 생성
   */
  createDefaultMetrics() {
    return {
      [STORE_REALTIME_METRICS.ORDERS_TODAY]: 0,
      [STORE_REALTIME_METRICS.ORDERS_PENDING]: 0,
      [STORE_REALTIME_METRICS.ORDERS_PREPARING]: 0,
      [STORE_REALTIME_METRICS.ORDERS_READY]: 0,
      [STORE_REALTIME_METRICS.REVENUE_TODAY]: 0,
      [STORE_REALTIME_METRICS.REVENUE_THIS_HOUR]: 0,
      [STORE_REALTIME_METRICS.AVERAGE_ORDER_VALUE]: 0,
      [STORE_REALTIME_METRICS.ACTIVE_CUSTOMERS]: 0,
      [STORE_REALTIME_METRICS.NEW_CUSTOMERS]: 0,
      [STORE_REALTIME_METRICS.CUSTOMER_SATISFACTION]: 0,
      [STORE_REALTIME_METRICS.AVERAGE_PREP_TIME]: 0,
      [STORE_REALTIME_METRICS.STAFF_ONLINE]: 0,
      [STORE_REALTIME_METRICS.POS_STATUS]: 'UNKNOWN',
      [STORE_REALTIME_METRICS.DELIVERIES_IN_PROGRESS]: 0,
      [STORE_REALTIME_METRICS.AVERAGE_DELIVERY_TIME]: 0,
      [STORE_REALTIME_METRICS.DELIVERY_SUCCESS_RATE]: 100,
      lastUpdated: new Date()
    };
  }

  /**
   * Store Socket Manager 상태 조회
   */
  getManagerStatus() {
    return {
      connectedStores: this.connections.size,
      totalConnections: Array.from(this.connections.values())
        .reduce((sum, connections) => sum + connections.size, 0),
      metricsTracked: this.storeMetrics.size,
      pendingNotifications: Array.from(this.notificationQueue.values())
        .reduce((sum, queue) => sum + queue.length, 0),
      uptime: process.uptime(),
      timestamp: new Date()
    };
  }

  /**
   * ====================================================================
   * Store 채팅 관련 핸들러들
   * ====================================================================
   */

  /**
   * Store 채팅 메시지 전송 처리
   */
  async handleStoreChatMessage(socket, data) {
    try {
      const { roomId, content, messageType = 'TEXT', recipientId } = data;
      const { storeId, userId } = socket;

      logger.info('Store 채팅 메시지 전송 요청', {
        storeId,
        userId,
        roomId,
        messageType,
        recipientId
      });

      // 채팅 메시지 저장 및 전송 로직 (실제 구현 필요)
      const message = {
        id: `store_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId,
        senderId: userId,
        senderType: 'STORE',
        content,
        messageType,
        storeId,
        timestamp: new Date(),
        readStatus: {}
      };

      // 채팅룸의 모든 참가자에게 메시지 전송
      socket.to(`chat:${roomId}`).emit(STORE_SOCKET_EVENTS.CHAT_MESSAGE_RECEIVED, message);

      // 전송자에게 성공 응답
      socket.emit('store:chat_message_sent', {
        messageId: message.id,
        roomId,
        success: true,
        timestamp: new Date()
      });

      logger.info('Store 채팅 메시지 전송 완료', {
        messageId: message.id,
        roomId,
        storeId
      });

    } catch (error) {
      logger.error('Store 채팅 메시지 전송 실패', error);
      socket.emit('store:error', {
        action: 'send_chat_message',
        error: error.message
      });
    }
  }

  /**
   * Store 채팅 타이핑 상태 처리
   */
  async handleStoreChatTyping(socket, data) {
    try {
      const { roomId, isTyping } = data;
      const { storeId, userId } = socket;

      logger.info('📝 [Socket] Store 타이핑 상태 수신:', {
        roomId,
        userId,
        storeId,
        isTyping
      });

      // ✅ App이 수신할 수 있도록 chat:typing 이벤트로 브로드캐스트
      socket.to(`chat:${roomId}`).emit('chat:typing', {
        roomId,
        userId,
        userName: '점주',
        userType: 'STORE',
        storeId,
        isTyping,
        timestamp: new Date()
      });

      logger.info('✅ [Socket] 타이핑 상태 브로드캐스트 완료:', {
        event: 'chat:typing',
        roomId,
        isTyping,
        targetRoom: `chat:${roomId}`
      });

    } catch (error) {
      logger.error('Store 채팅 타이핑 상태 처리 실패', error);
      socket.emit('store:error', {
        action: 'chat_typing',
        error: error.message
      });
    }
  }

  /**
   * Store 채팅 읽음 상태 처리
   */
  async handleStoreChatMarkRead(socket, data) {
    try {
      const { roomId, messageIds } = data;
      const { storeId, userId } = socket;

      logger.info('📖 [Socket] Store 채팅 읽음 상태 업데이트', {
        roomId,
        userId,
        storeId,
        messageCount: messageIds?.length || 0
      });

      // ✅ DB 읽음 상태 업데이트
      const updateResult = await db.ChatMessage.update(
        {
          isReadByStore: true,
          readByStoreAt: new Date()
        },
        {
          where: {
            id: messageIds,
            chatRoomId: roomId,
            senderType: 'USER'  // 고객이 보낸 메시지만
          }
        }
      );

      logger.info('✅ [Socket] DB 읽음 상태 업데이트 완료', {
        roomId,
        updatedCount: updateResult[0]
      });

      // ✅ 고객에게 즉시 읽음 확인 브로드캐스트
      socket.to(`chat:${roomId}`).emit(STORE_SOCKET_EVENTS.CHAT_READ_STATUS, {
        roomId,
        userId,
        userType: 'STORE',
        storeId,
        messageIds,
        readAt: new Date()
      });

      // ✅ 점주앱에 성공 응답
      socket.emit('store:chat_marked_read', {
        roomId,
        messageIds,
        success: true,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Store 채팅 읽음 상태 처리 실패', error);
      socket.emit('store:error', {
        action: 'mark_chat_read',
        error: error.message
      });
    }
  }

  /**
   * Store 채팅룸 생성 처리
   */
  async handleStoreCreateChatRoom(socket, data) {
    try {
      const { customerId, roomType = 'CUSTOMER_SUPPORT' } = data;
      const { storeId, userId } = socket;

      const roomId = `room_${storeId}_${customerId}_${Date.now()}`;

      logger.info('Store 채팅룸 생성 요청', {
        storeId,
        userId,
        customerId,
        roomType,
        roomId
      });

      // 채팅룸 생성 로직 (실제 구현 필요)

      // 채팅룸 참가
      await socket.join(`chat:${roomId}`);

      // 고객에게 채팅룸 생성 알림 (고객이 온라인인 경우)
      socket.broadcast.emit('customer:chat_room_invitation', {
        roomId,
        storeId,
        storeName: data.storeName || `Store ${storeId}`,
        invitedBy: userId,
        roomType,
        timestamp: new Date()
      });

      // 성공 응답
      socket.emit('store:chat_room_created', {
        roomId,
        customerId,
        storeId,
        roomType,
        success: true,
        timestamp: new Date()
      });

      logger.info('Store 채팅룸 생성 완료', { roomId, storeId, customerId });

    } catch (error) {
      logger.error('Store 채팅룸 생성 실패', error);
      socket.emit('store:error', {
        action: 'create_chat_room',
        error: error.message
      });
    }
  }

  /**
   * Store 채팅룸 참가 처리
   */
  async handleStoreJoinChatRoom(socket, data) {
    try {
      const { roomId } = data;
      const { storeId, userId } = socket;

      // 채팅룸 참가 권한 확인 (실제 구현 필요)

      await socket.join(`chat:${roomId}`);

      // 채팅룸의 다른 참가자들에게 참가 알림
      socket.to(`chat:${roomId}`).emit(STORE_SOCKET_EVENTS.CHAT_ROOM_JOINED, {
        roomId,
        userId,
        userType: 'STORE',
        storeId,
        joinedAt: new Date()
      });

      // 성공 응답
      socket.emit('store:chat_room_joined', {
        roomId,
        success: true,
        timestamp: new Date()
      });

      logger.info('Store 채팅룸 참가 완료', {
        roomId,
        storeId,
        userId
      });

    } catch (error) {
      logger.error('Store 채팅룸 참가 실패', error);
      socket.emit('store:error', {
        action: 'join_chat_room',
        error: error.message
      });
    }
  }

  /**
   * Store 채팅룸 떠나기 처리
   */
  async handleStoreLeaveChatRoom(socket, data) {
    try {
      const { roomId } = data;
      const { storeId, userId } = socket;

      await socket.leave(`chat:${roomId}`);

      // 채팅룸의 다른 참가자들에게 떠남 알림
      socket.to(`chat:${roomId}`).emit(STORE_SOCKET_EVENTS.CHAT_ROOM_LEFT, {
        roomId,
        userId,
        userType: 'STORE',
        storeId,
        leftAt: new Date()
      });

      // 성공 응답
      socket.emit('store:chat_room_left', {
        roomId,
        success: true,
        timestamp: new Date()
      });

      logger.info('Store 채팅룸 떠나기 완료', {
        roomId,
        storeId,
        userId
      });

    } catch (error) {
      logger.error('Store 채팅룸 떠나기 실패', error);
      socket.emit('store:error', {
        action: 'leave_chat_room',
        error: error.message
      });
    }
  }

  /**
   * 점주 Heartbeat 핸들러
   * ✅ Redis에 저장만 하고, 브로드캐스트는 해당 채팅방에만
   */
  async handleStoreHeartbeat(socket, data) {
    try {
      const { storeId, timestamp } = data;

      // 유효성 검사
      if (!storeId) {
        logger.warn('Heartbeat 실패: storeId 누락');
        return;
      }

      // Socket에 저장된 storeId와 일치 확인 (보안)
      // 타입 변환 후 비교 (socket.storeId는 Number, data.storeId는 String일 수 있음)
      if (String(socket.storeId) !== String(storeId)) {
        logger.warn('Heartbeat 거부: storeId 불일치', {
          socketStoreId: socket.storeId,
          socketStoreIdType: typeof socket.storeId,
          requestStoreId: storeId,
          requestStoreIdType: typeof storeId
        });
        return;
      }

      const now = Date.now();
      const previousHeartbeat = this.storeHeartbeats.get(storeId);

      // Redis에 heartbeat 저장 (30초 TTL)
      const redisClient = this.unifiedSocket.redisClient;
      if (redisClient) {
        await redisClient.setex(
          `store:heartbeat:${storeId}`,
          30, // 30초 TTL
          JSON.stringify({
            storeId,
            lastHeartbeat: now,
            timestamp,
            isOnline: true
          })
        );
      }

      // 메모리에도 저장
      this.storeHeartbeats.set(storeId, {
        lastHeartbeat: now,
        timestamp,
        socketId: socket.id
      });

      // 첫 heartbeat이거나 오프라인에서 온라인으로 전환된 경우만
      // 해당 채팅방(`chat:*`)에 있는 고객에게만 브로드캐스트
      if (!previousHeartbeat || (now - previousHeartbeat.lastHeartbeat > 30000)) {
        // store:${storeId} 룸 대신 해당 매장의 활성 채팅방에만 전송
        this.notifyActiveChatRooms(storeId, true);

        logger.info(`✅ 점주 온라인 - storeId: ${storeId}`);
      }

    } catch (error) {
      logger.error('Heartbeat 처리 실패', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * 활성 채팅방에만 온라인 상태 알림
   * ✅ 전체 브로드캐스트 대신 채팅 중인 고객에게만
   */
  async notifyActiveChatRooms(storeId, isOnline) {
    try {
      // 해당 매장의 활성 채팅방 조회
      const rooms = await this.io.in(`store:${storeId}`).allSockets();

      // 각 socket이 속한 chat 룸에만 전송
      for (const socketId of rooms) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket && socket.userType === 'MOBILE') {
          // 모바일 고객이 속한 채팅방에만 전송
          const chatRooms = Array.from(socket.rooms).filter(room => room.startsWith('chat:'));

          for (const chatRoom of chatRooms) {
            this.io.to(chatRoom).emit('store:online:status', {
              storeId,
              isOnline,
              lastActivityAt: new Date().toISOString(),
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      logger.error('활성 채팅방 알림 실패', error);
    }
  }

  /**
   * Heartbeat Timeout 체크 (30초)
   * ✅ 매 15초마다 실행되어 30초 이상 heartbeat 없는 매장을 오프라인 처리
   * ✅ 활성 채팅방에만 알림
   */
  startHeartbeatMonitoring() {
    if (!this.storeHeartbeats) {
      this.storeHeartbeats = new Map();
    }

    // 15초마다 체크
    this.heartbeatCheckInterval = setInterval(() => {
      const now = Date.now();
      const TIMEOUT_MS = 30000; // 30초

      for (const [storeId, heartbeatData] of this.storeHeartbeats.entries()) {
        const timeSinceLastHeartbeat = now - heartbeatData.lastHeartbeat;

        // 30초 이상 heartbeat 없으면 오프라인 처리
        if (timeSinceLastHeartbeat > TIMEOUT_MS) {
          // 활성 채팅방에만 오프라인 알림 (전체 브로드캐스트 방지)
          this.notifyActiveChatRooms(storeId, false);

          // Map에서 제거
          this.storeHeartbeats.delete(storeId);

          logger.info(`⚫ 점주 오프라인 - storeId: ${storeId} (timeout: ${Math.round(timeSinceLastHeartbeat / 1000)}s)`);
        }
      }
    }, 15000); // 15초마다 체크

    logger.info('📡 Heartbeat 모니터링 시작 (timeout: 30s, check: 15s)');
  }

  /**
   * Heartbeat 모니터링 중지
   */
  stopHeartbeatMonitoring() {
    if (this.heartbeatCheckInterval) {
      clearInterval(this.heartbeatCheckInterval);
      this.heartbeatCheckInterval = null;
      logger.info('⏹️ Heartbeat 모니터링 중지');
    }
  }

  /**
   * 우아한 종료
   */
  async shutdown() {
    logger.info('🏪 Store Socket Manager 종료 시작...');

    try {
      // Heartbeat 모니터링 중지
      this.stopHeartbeatMonitoring();

      // 모든 Store 클라이언트에게 종료 알림
      for (const storeId of this.connections.keys()) {
        await this.sendToStoreRoom(storeId, 'store:server_shutdown', {
          message: 'Server is shutting down gracefully',
          reconnectAfter: 5000,
          timestamp: new Date()
        });
      }

      // 연결 정보 정리
      this.connections.clear();
      this.storeMetrics.clear();
      this.notificationQueue.clear();
      this.storeHeartbeats.clear();

      logger.info('✅ Store Socket Manager 종료 완료');
    } catch (error) {
      logger.error('❌ Store Socket Manager 종료 중 오류', error);
      throw error;
    }
  }
}

export default StoreSocketManager;
