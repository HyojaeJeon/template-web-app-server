/**
 * Mobile Socket Manager
 * 고객용 React Native App을 위한 완전한 실시간 Socket.IO 관리 시스템
 * (Store와 대칭적 구조)
 *
 * 기능:
 * - Mobile 전용 Socket 연결 관리
 * - 실시간 알림 발송
 * - 고객별 Room 관리
 * - 권한 기반 이벤트 필터링
 * - 성능 모니터링 및 최적화
 *
 * 이벤트 카테고리:
 * 1. 주문 관련 - 주문 상태 업데이트, 확인, 취소
 * 2. 배달 추적 - 실시간 위치, ETA 업데이트
 * 3. 채팅 - 매장과의 실시간 채팅
 * 4. 알림 - 프로모션, 시스템 알림
 * 5. 결제 - 결제 상태 알림
 * 6. 리뷰 - 리뷰 요청 알림
 */

import loggerDefault from '../utils/utilities/Logger.js';

// === Mobile 전용 Socket 이벤트 상수 ===
export const MOBILE_SOCKET_EVENTS = {
  // === 주문 관련 이벤트 ===
  ORDER_CONFIRMED: 'mobile:order_confirmed',
  ORDER_PREPARING: 'mobile:order_preparing',
  ORDER_READY: 'mobile:order_ready',
  ORDER_PICKED_UP: 'mobile:order_picked_up',
  ORDER_DELIVERED: 'mobile:order_delivered',
  ORDER_CANCELLED: 'mobile:order_cancelled',
  ORDER_STATUS_UPDATE: 'mobile:order_status_update',

  // === 배달 추적 이벤트 ===
  DELIVERY_LOCATION_UPDATE: 'mobile:delivery_location_update',
  DELIVERY_ETA_UPDATE: 'mobile:delivery_eta_update',
  DELIVERY_STARTED: 'mobile:delivery_started',
  DELIVERY_COMPLETED: 'mobile:delivery_completed',
  DELIVERY_DELAY: 'mobile:delivery_delay',

  // === 채팅 관련 이벤트 ===
  CHAT_MESSAGE_RECEIVED: 'mobile:chat_message_received',
  CHAT_MESSAGE_SENT: 'mobile:chat_message_sent',
  CHAT_TYPING: 'mobile:chat_typing',
  CHAT_ROOM_JOINED: 'mobile:chat_room_joined',
  CHAT_ROOM_LEFT: 'mobile:chat_room_left',

  // === 알림 이벤트 ===
  NOTIFICATION_RECEIVED: 'mobile:notification_received',
  NOTIFICATION_READ: 'mobile:notification_read',
  PROMOTION_ALERT: 'mobile:promotion_alert',
  DISCOUNT_AVAILABLE: 'mobile:discount_available',

  // === 결제 관련 이벤트 ===
  PAYMENT_COMPLETED: 'mobile:payment_completed',
  PAYMENT_FAILED: 'mobile:payment_failed',
  PAYMENT_PROCESSING: 'mobile:payment_processing',
  REFUND_PROCESSED: 'mobile:refund_processed',

  // === 리뷰 관련 이벤트 ===
  REVIEW_REQUEST: 'mobile:review_request',
  REVIEW_REMINDER: 'mobile:review_reminder',

  // === 시스템 이벤트 ===
  SYSTEM_ALERT: 'mobile:system_alert',
  MAINTENANCE_NOTICE: 'mobile:maintenance_notice',
  CONNECTION_STATUS: 'mobile:connection_status',
  APP_UPDATE_AVAILABLE: 'mobile:app_update_available',

  // === 프로필 관련 이벤트 ===
  PROFILE_UPDATE_SUCCESS: 'mobile:profile_update_success',
  ADDRESS_UPDATE_SUCCESS: 'mobile:address_update_success',

  // === 즐겨찾기 관련 이벤트 ===
  FAVORITE_STORE_PROMOTION: 'mobile:favorite_store_promotion',
  FAVORITE_MENU_AVAILABLE: 'mobile:favorite_menu_available'
};

// === Mobile 이벤트 메시지 템플릿 (다국어 지원) ===
export const MOBILE_EVENT_MESSAGES = {
  // === 주문 관련 메시지 ===
  [MOBILE_SOCKET_EVENTS.ORDER_CONFIRMED]: {
    title: {
      vi: 'Đơn hàng đã xác nhận',
      ko: '주문이 확인되었습니다',
      en: 'Order Confirmed'
    },
    message: {
      vi: 'Đơn hàng #{orderId} đã được xác nhận và đang chuẩn bị',
      ko: '주문 #{orderId}이 확인되었으며 준비 중입니다',
      en: 'Order #{orderId} has been confirmed and is being prepared'
    },
    priority: 'HIGH',
    sound: 'order-confirmed.mp3',
    icon: '✅'
  },

  [MOBILE_SOCKET_EVENTS.ORDER_PREPARING]: {
    title: {
      vi: 'Đang chuẩn bị món ăn',
      ko: '음식 준비 중',
      en: 'Food Being Prepared'
    },
    message: {
      vi: 'Nhà hàng đang chuẩn bị món ăn cho bạn',
      ko: '매장에서 음식을 준비하고 있습니다',
      en: 'The restaurant is preparing your food'
    },
    priority: 'MEDIUM',
    sound: 'order-preparing.mp3',
    icon: '👨‍🍳'
  },

  [MOBILE_SOCKET_EVENTS.ORDER_READY]: {
    title: {
      vi: 'Món ăn đã sẵn sàng',
      ko: '음식이 준비완료되었습니다',
      en: 'Food is Ready'
    },
    message: {
      vi: 'Món ăn của bạn đã sẵn sàng và đang chờ người giao hàng',
      ko: '음식이 준비완료되어 배달기사를 기다리고 있습니다',
      en: 'Your food is ready and waiting for pickup'
    },
    priority: 'HIGH',
    sound: 'order-ready.mp3',
    icon: '🍽️'
  },

  [MOBILE_SOCKET_EVENTS.ORDER_PICKED_UP]: {
    title: {
      vi: 'Bắt đầu giao hàng',
      ko: '배달이 시작되었습니다',
      en: 'Delivery Started'
    },
    message: {
      vi: 'Người giao hàng đã nhận món ăn và đang trên đường đến bạn',
      ko: '배달기사가 음식을 픽업하여 배달 중입니다',
      en: 'Driver has picked up your order and is on the way'
    },
    priority: 'HIGH',
    sound: 'delivery-started.mp3',
    icon: '🚗'
  },

  [MOBILE_SOCKET_EVENTS.ORDER_DELIVERED]: {
    title: {
      vi: 'Giao hàng hoàn tất',
      ko: '배달이 완료되었습니다',
      en: 'Delivery Completed'
    },
    message: {
      vi: 'Đơn hàng của bạn đã được giao thành công. Chúc bạn ngon miệng!',
      ko: '주문이 성공적으로 배달되었습니다. 맛있게 드세요!',
      en: 'Your order has been delivered successfully. Enjoy your meal!'
    },
    priority: 'HIGH',
    sound: 'delivery-completed.mp3',
    icon: '🎉'
  },

  // === 배달 추적 메시지 ===
  [MOBILE_SOCKET_EVENTS.DELIVERY_LOCATION_UPDATE]: {
    title: {
      vi: 'Cập nhật vị trí giao hàng',
      ko: '배달 위치 업데이트',
      en: 'Delivery Location Update'
    },
    message: {
      vi: 'Người giao hàng đang di chuyển đến bạn',
      ko: '배달기사가 고객님께 이동 중입니다',
      en: 'Driver is moving towards you'
    },
    priority: 'LOW',
    sound: null,
    icon: '📍'
  },

  [MOBILE_SOCKET_EVENTS.DELIVERY_ETA_UPDATE]: {
    title: {
      vi: 'Cập nhật thời gian giao hàng',
      ko: '배달 예상 시간 업데이트',
      en: 'Delivery ETA Update'
    },
    message: {
      vi: 'Thời gian giao hàng dự kiến: {eta} phút',
      ko: '배달 예상 시간: {eta}분',
      en: 'Estimated delivery time: {eta} minutes'
    },
    priority: 'MEDIUM',
    sound: null,
    icon: '⏰'
  },

  // === 채팅 메시지 ===
  [MOBILE_SOCKET_EVENTS.CHAT_MESSAGE_RECEIVED]: {
    title: {
      vi: 'Tin nhắn mới',
      ko: '새 메시지',
      en: 'New Message'
    },
    message: {
      vi: 'Bạn có tin nhắn mới từ nhà hàng',
      ko: '매장으로부터 새 메시지가 있습니다',
      en: 'You have a new message from the restaurant'
    },
    priority: 'MEDIUM',
    sound: 'new-message.mp3',
    icon: '💬'
  },

  // === 프로모션 메시지 ===
  [MOBILE_SOCKET_EVENTS.PROMOTION_ALERT]: {
    title: {
      vi: 'Ưu đãi đặc biệt',
      ko: '특별 할인',
      en: 'Special Promotion'
    },
    message: {
      vi: 'Có ưu đãi đặc biệt dành cho bạn!',
      ko: '고객님을 위한 특별 할인이 있습니다!',
      en: 'There\'s a special promotion for you!'
    },
    priority: 'MEDIUM',
    sound: 'promotion.mp3',
    icon: '🎁'
  },

  // === 결제 메시지 ===
  [MOBILE_SOCKET_EVENTS.PAYMENT_COMPLETED]: {
    title: {
      vi: 'Thanh toán thành công',
      ko: '결제 완료',
      en: 'Payment Successful'
    },
    message: {
      vi: 'Thanh toán {amount} VND đã hoàn tất',
      ko: '{amount}원 결제가 완료되었습니다',
      en: 'Payment of {amount} VND completed successfully'
    },
    priority: 'HIGH',
    sound: 'payment-success.mp3',
    icon: '💳'
  },

  [MOBILE_SOCKET_EVENTS.PAYMENT_FAILED]: {
    title: {
      vi: 'Thanh toán thất bại',
      ko: '결제 실패',
      en: 'Payment Failed'
    },
    message: {
      vi: 'Thanh toán không thành công. Vui lòng thử lại.',
      ko: '결제에 실패했습니다. 다시 시도해 주세요.',
      en: 'Payment failed. Please try again.'
    },
    priority: 'HIGH',
    sound: 'payment-failed.mp3',
    icon: '❌'
  },

  // === 시스템 메시지 ===
  [MOBILE_SOCKET_EVENTS.SYSTEM_ALERT]: {
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
  }
};

// === Mobile 알림 우선순위 레벨 ===
export const MOBILE_NOTIFICATION_PRIORITIES = {
  URGENT: {
    level: 4,
    color: '#DA020E', // Error Red
    duration: 0, // 수동으로 닫을 때까지 유지
    sound: true,
    vibration: true
  },
  HIGH: {
    level: 3,
    color: '#FFDD00', // Warning Gold
    duration: 8000, // 8초
    sound: true,
    vibration: true
  },
  MEDIUM: {
    level: 2,
    color: '#2AC1BC', // Primary Mint
    duration: 5000, // 5초
    sound: false,
    vibration: false
  },
  LOW: {
    level: 1,
    color: '#00B14F', // Secondary Green
    duration: 3000, // 3초
    sound: false,
    vibration: false
  }
};

// === Mobile Room 타입 정의 ===
export const MOBILE_ROOM_TYPES = {
  USER: 'user',              // user:{userId}
  ORDER: 'order',            // order:{orderId}
  DELIVERY: 'delivery',      // delivery:{orderId}
  CHAT: 'chat',             // chat:{roomId}
  NOTIFICATION: 'notification' // notification:{userId}
};

// === Mobile 실시간 통계 메트릭 정의 ===
export const MOBILE_REALTIME_METRICS = {
  // 사용자 활동 메트릭
  ACTIVE_SESSIONS: 'active_sessions',
  CURRENT_ORDERS: 'current_orders',
  PENDING_DELIVERIES: 'pending_deliveries',

  // 알림 메트릭
  NOTIFICATIONS_SENT: 'notifications_sent',
  NOTIFICATIONS_READ: 'notifications_read',
  PUSH_DELIVERY_RATE: 'push_delivery_rate',

  // 성능 메트릭
  CONNECTION_LATENCY: 'connection_latency',
  MESSAGE_DELIVERY_TIME: 'message_delivery_time',
  RECONNECTION_RATE: 'reconnection_rate'
};

const logger = loggerDefault;

export class MobileSocketManager {
  constructor(unifiedSocketServer) {
    this.io = unifiedSocketServer.io;
    this.connections = new Map(); // userId -> Set of socketIds
    this.userMetrics = new Map(); // userId -> realtime metrics
    this.notificationQueue = new Map(); // userId -> pending notifications
    this.unifiedSocket = unifiedSocketServer;

    this.setupMobileSocketHandlers();
    this.initializeMetrics();

    logger.info('📱 Mobile Socket Manager 초기화 완료');
  }

  /**
   * Mobile 전용 Socket 핸들러 설정
   */
  setupMobileSocketHandlers() {
    // UnifiedSocketServer의 connection 이벤트에 추가 핸들러 등록
    this.io.on('connection', (socket) => {
      // Mobile 클라이언트만 처리
      if (socket.userType === 'CUSTOMER' && socket.userId) {
        this.handleMobileConnection(socket);
      }
    });
  }

  /**
   * Mobile 클라이언트 연결 처리
   */
  handleMobileConnection(socket) {
    const { userId, platform, appVersion } = socket;

    // Null safety 확보: user 정보가 없으면 userId 폴백 사용
    const safeUserId = userId || socket.user?.id || socket.userId;

    logger.info('📱 Mobile 클라이언트 연결', {
      socketId: socket.id,
      userId: safeUserId,
      platform,
      appVersion,
      tokenRefresh: socket.tokenRefresh || false
    });

    // 사용자 연결 등록 (safeUserId 사용)
    if (safeUserId && !this.connections.has(safeUserId)) {
      this.connections.set(safeUserId, new Set());
    }
    if (safeUserId) {
      this.connections.get(safeUserId).add(socket.id);
    }

    // 사용자별 룸 참여
    this.joinUserRooms(socket);

    // Mobile 전용 이벤트 핸들러 설정
    this.setupMobileEventHandlers(socket);

    // 연결 성공 알림
    socket.emit('mobile:connected', {
      userId,
      timestamp: new Date(),
      features: this.getAvailableFeatures(socket)
    });

    // 미읽은 알림 확인 및 전송
    this.sendPendingNotifications(socket);

    // 연결 해제 처리
    socket.on('disconnect', () => {
      this.handleMobileDisconnection(socket);
    });
  }

  /**
   * 사용자별 룸 참여
   */
  joinUserRooms(socket) {
    const { userId } = socket;

    // 기본 룸들 참여
    socket.join(`${MOBILE_ROOM_TYPES.USER}:${userId}`);
    socket.join(`${MOBILE_ROOM_TYPES.NOTIFICATION}:${userId}`);

    logger.info('📱 Mobile 룸 참여 완료', {
      userId,
      rooms: [`user:${userId}`, `notification:${userId}`]
    });
  }

  /**
   * Mobile 전용 이벤트 핸들러 설정
   */
  setupMobileEventHandlers(socket) {
    const { userId } = socket;

    // 주문 추적 시작
    socket.on('mobile:track_order', (data) => {
      this.handleTrackOrder(socket, data);
    });

    // 배달 추적 시작
    socket.on('mobile:track_delivery', (data) => {
      this.handleTrackDelivery(socket, data);
    });

    // 채팅 룸 참여
    socket.on('mobile:join_chat', (data) => {
      this.handleJoinChat(socket, data);
    });

    // 채팅 메시지 전송
    socket.on('mobile:send_chat_message', (data) => {
      this.handleSendChatMessage(socket, data);
    });

    // 채팅 타이핑 상태
    socket.on('mobile:chat_typing', (data) => {
      this.handleChatTyping(socket, data);
    });

    // 채팅 메시지 읽음 처리
    socket.on('mobile:mark_chat_read', (data) => {
      this.handleMarkChatRead(socket, data);
    });

    // 채팅방 생성
    socket.on('mobile:create_chat_room', (data) => {
      this.handleCreateChatRoom(socket, data);
    });

    // 알림 읽음 처리
    socket.on('mobile:mark_notification_read', (data) => {
      this.handleMarkNotificationRead(socket, data);
    });

    // 위치 업데이트 (배달 추적용)
    socket.on('mobile:update_location', (data) => {
      this.handleLocationUpdate(socket, data);
    });

    // 하트비트
    socket.on('mobile:heartbeat', (data) => {
      socket.lastHeartbeat = new Date();
      socket.emit('mobile:heartbeat_ack', { timestamp: new Date() });
    });
  }

  /**
   * 주문 추적 처리
   */
  async handleTrackOrder(socket, data) {
    const { orderId } = data;
    const { userId } = socket;

    try {
      // 주문 권한 확인 (실제로는 DB 조회)
      const hasPermission = await this.verifyOrderPermission(userId, orderId);

      if (!hasPermission) {
        socket.emit('mobile:error', {
          code: 'PERMISSION_DENIED',
          message: '주문 조회 권한이 없습니다'
        });
        return;
      }

      // 주문 추적 룸 참여
      socket.join(`${MOBILE_ROOM_TYPES.ORDER}:${orderId}`);

      socket.emit('mobile:order_tracking_started', {
        orderId,
        timestamp: new Date()
      });

      logger.info('📱 주문 추적 시작', { userId, orderId });

    } catch (error) {
      logger.error('📱 주문 추적 실패', { userId, orderId, error: error.message });
      socket.emit('mobile:error', {
        code: 'ORDER_TRACKING_FAILED',
        message: '주문 추적을 시작할 수 없습니다'
      });
    }
  }

  /**
   * 배달 추적 처리
   */
  async handleTrackDelivery(socket, data) {
    const { orderId } = data;
    const { userId } = socket;

    try {
      // 배달 추적 룸 참여
      socket.join(`${MOBILE_ROOM_TYPES.DELIVERY}:${orderId}`);

      socket.emit('mobile:delivery_tracking_started', {
        orderId,
        timestamp: new Date()
      });

      logger.info('📱 배달 추적 시작', { userId, orderId });

    } catch (error) {
      logger.error('📱 배달 추적 실패', { userId, orderId, error: error.message });
    }
  }

  /**
   * 채팅 룸 참여 처리
   */
  async handleJoinChat(socket, data) {
    const { roomId } = data;
    const { userId } = socket;

    try {
      // 채팅 룸 참여
      socket.join(`${MOBILE_ROOM_TYPES.CHAT}:${roomId}`);

      socket.emit('mobile:chat_joined', {
        roomId,
        timestamp: new Date()
      });

      logger.info('📱 채팅 룸 참여', { userId, roomId });

    } catch (error) {
      logger.error('📱 채팅 룸 참여 실패', { userId, roomId, error: error.message });
    }
  }

  /**
   * 알림 읽음 처리
   */
  async handleMarkNotificationRead(socket, data) {
    const { notificationId } = data;
    const { userId } = socket;

    try {
      // 실제로는 DB 업데이트
      logger.info('📱 알림 읽음 처리', { userId, notificationId });

      socket.emit('mobile:notification_marked_read', {
        notificationId,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('📱 알림 읽음 처리 실패', { userId, notificationId, error: error.message });
    }
  }

  /**
   * Mobile 연결 해제 처리
   */
  handleMobileDisconnection(socket) {
    const { userId } = socket;

    if (userId && this.connections.has(userId)) {
      this.connections.get(userId).delete(socket.id);

      // 모든 연결이 끊어진 경우 Map에서 제거
      if (this.connections.get(userId).size === 0) {
        this.connections.delete(userId);
      }
    }

    logger.info('📱 Mobile 클라이언트 연결 해제', {
      socketId: socket.id,
      userId
    });
  }

  /**
   * 사용자에게 알림 전송
   */
  async sendNotificationToUser(userId, eventType, data) {
    try {
      const eventConfig = MOBILE_EVENT_MESSAGES[eventType];
      if (!eventConfig) {
        throw new Error(`Unknown event type: ${eventType}`);
      }

      const notification = {
        type: eventType,
        title: eventConfig.title,
        message: this.formatMessage(eventConfig.message, data),
        priority: eventConfig.priority,
        icon: eventConfig.icon,
        data,
        timestamp: new Date()
      };

      // 연결된 모든 소켓에 전송
      this.io.to(`${MOBILE_ROOM_TYPES.USER}:${userId}`).emit('mobile:notification', notification);

      logger.info('📱 Mobile 알림 전송', { userId, eventType });

    } catch (error) {
      logger.error('📱 Mobile 알림 전송 실패', { userId, eventType, error: error.message });
    }
  }

  /**
   * 주문 상태 변경 알림
   */
  async notifyOrderStatusChanged(userId, orderData) {
    const eventType = this.getOrderEventType(orderData.status);
    if (eventType) {
      await this.sendNotificationToUser(userId, eventType, orderData);
    }
  }

  /**
   * 배달 위치 업데이트 알림
   */
  async notifyDeliveryLocationUpdate(orderId, locationData) {
    this.io.to(`${MOBILE_ROOM_TYPES.DELIVERY}:${orderId}`)
      .emit('mobile:delivery_location_update', locationData);
  }

  /**
   * 메시지 포맷팅
   */
  formatMessage(messageTemplate, data) {
    const formatted = {};
    for (const [lang, template] of Object.entries(messageTemplate)) {
      formatted[lang] = template.replace(/\{(\w+)\}/g, (match, key) => {
        return data[key] || match;
      });
    }
    return formatted;
  }

  /**
   * 주문 상태에 따른 이벤트 타입 반환
   */
  getOrderEventType(status) {
    const statusMap = {
      'CONFIRMED': MOBILE_SOCKET_EVENTS.ORDER_CONFIRMED,
      'PREPARING': MOBILE_SOCKET_EVENTS.ORDER_PREPARING,
      'READY': MOBILE_SOCKET_EVENTS.ORDER_READY,
      'PICKED_UP': MOBILE_SOCKET_EVENTS.ORDER_PICKED_UP,
      'DELIVERED': MOBILE_SOCKET_EVENTS.ORDER_DELIVERED,
      'CANCELLED': MOBILE_SOCKET_EVENTS.ORDER_CANCELLED
    };
    return statusMap[status];
  }

  /**
   * 사용 가능한 기능 목록 반환
   */
  getAvailableFeatures(socket) {
    return {
      orderTracking: true,
      deliveryTracking: true,
      realTimeChat: true,
      pushNotifications: true,
      locationServices: true
    };
  }

  /**
   * 주문 권한 확인 (Mock)
   */
  async verifyOrderPermission(userId, orderId) {
    // 실제로는 DB에서 확인
    return true;
  }

  /**
   * 미읽은 알림 전송
   */
  async sendPendingNotifications(socket) {
    const { userId } = socket;
    // 실제로는 DB에서 미읽은 알림 조회 후 전송
    logger.info('📱 미읽은 알림 확인', { userId });
  }

  /**
   * 메트릭 초기화
   */
  initializeMetrics() {
    logger.info('📱 Mobile Socket Manager 메트릭 초기화');
  }

  // ===============================================
  // 채팅 관련 핸들러들 (RealtimeMessagingService 통합)
  // ===============================================

  /**
   * 채팅 메시지 전송 핸들러
   */
  async handleSendChatMessage(socket, data) {
    try {
      const { roomId, content, messageType = 'TEXT' } = data;
      const { userId } = socket;

      logger.info('📱 Mobile 채팅 메시지 전송', { userId, roomId });

      // 메시지를 MobileSocketManager 이벤트로 변환 후 전송
      const messageData = {
        roomId,
        senderId: userId,
        senderType: 'USER',
        content,
        messageType,
        timestamp: new Date()
      };

      // 채팅방 참가자들에게 메시지 전송
      this.io.to(`${MOBILE_ROOM_TYPES.CHAT}:${roomId}`).emit('mobile:chat_message_received', messageData);

      // 성공 응답
      socket.emit('mobile:message_sent', {
        success: true,
        messageId: `temp_${Date.now()}`,
        timestamp: messageData.timestamp
      });

    } catch (error) {
      logger.error('📱 Mobile 채팅 메시지 전송 실패', { error: error.message });
      socket.emit('mobile:message_error', {
        error: 'MESSAGE_SEND_FAILED',
        message: '메시지 전송에 실패했습니다.'
      });
    }
  }

  /**
   * 채팅 타이핑 상태 핸들러
   */
  async handleChatTyping(socket, data) {
    try {
      const { roomId, isTyping = true } = data;
      const { userId } = socket;

      // 채팅방 다른 참가자들에게 타이핑 상태 전송
      socket.to(`${MOBILE_ROOM_TYPES.CHAT}:${roomId}`).emit('mobile:chat_typing', {
        roomId,
        userId,
        isTyping,
        timestamp: new Date()
      });

      logger.info('📱 Mobile 타이핑 상태 업데이트', { userId, roomId, isTyping });

    } catch (error) {
      logger.error('📱 Mobile 타이핑 상태 업데이트 실패', { error: error.message });
    }
  }

  /**
   * 채팅 메시지 읽음 처리 핸들러
   */
  async handleMarkChatRead(socket, data) {
    try {
      const { roomId, messageIds } = data;
      const { userId } = socket;

      logger.info('📱 Mobile 채팅 메시지 읽음 처리', { userId, roomId });

      // 읽음 상태 변경 알림
      this.io.to(`${MOBILE_ROOM_TYPES.CHAT}:${roomId}`).emit('mobile:chat_messages_read', {
        roomId,
        userId,
        messageIds,
        readAt: new Date()
      });

      // 성공 응답
      socket.emit('mobile:mark_read_success', {
        roomId,
        readCount: messageIds?.length || 0
      });

    } catch (error) {
      logger.error('📱 Mobile 채팅 읽음 처리 실패', { error: error.message });
    }
  }

  /**
   * 채팅방 생성 핸들러
   */
  async handleCreateChatRoom(socket, data) {
    try {
      const { storeId, orderId = null, type = 'GENERAL_INQUIRY' } = data;
      const { userId } = socket;

      logger.info('📱 Mobile 채팅방 생성', { userId, storeId, orderId });

      // 임시 채팅방 ID 생성 (실제로는 DB에서 생성)
      const roomId = `room_${userId}_${storeId}_${Date.now()}`;

      // 채팅방 참여
      socket.join(`${MOBILE_ROOM_TYPES.CHAT}:${roomId}`);

      // 성공 응답
      socket.emit('mobile:chat_room_created', {
        success: true,
        room: {
          id: roomId,
          userId,
          storeId,
          orderId,
          type,
          createdAt: new Date()
        }
      });

      logger.info('📱 Mobile 채팅방 생성 완료', { roomId });

    } catch (error) {
      logger.error('📱 Mobile 채팅방 생성 실패', { error: error.message });
      socket.emit('mobile:chat_room_created', {
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 채팅 알림 전송
   */
  async sendChatNotification(userId, messageData) {
    try {
      await this.sendNotificationToUser(userId, MOBILE_SOCKET_EVENTS.CHAT_MESSAGE_RECEIVED, {
        senderName: messageData.senderName || '매장',
        message: messageData.content?.substring(0, 50) || '새 메시지'
      });

      logger.info('📱 Mobile 채팅 알림 전송 완료', { userId });

    } catch (error) {
      logger.error('📱 Mobile 채팅 알림 전송 실패', { userId, error: error.message });
    }
  }
}

// 레거시 호환성을 위한 export
export default MobileSocketManager;