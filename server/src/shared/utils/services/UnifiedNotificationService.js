/**
 * UnifiedNotificationService
 * ===========================
 * Socket.IO + FCM 통합 알림 서비스
 *
 * 핵심 로직:
 * 1. Socket.IO로 실시간 알림 전송 시도
 * 2. 사용자가 오프라인이거나 백그라운드인 경우 FCM 푸시 발송
 * 3. 포그라운드 상태에서는 Socket을 통한 Notifee 알림만 표시
 *
 * 워크플로우:
 * ┌─────────────┐
 * │ 알림 요청    │
 * └──────┬──────┘
 *        │
 *        ↓
 * ┌─────────────────────────────┐
 * │ 1. Socket 연결 상태 확인     │
 * │    (Redis 캐시 조회)         │
 * └──────┬─────────┬────────────┘
 *        │         │
 *   연결됨│         │연결 안됨/백그라운드
 *        ↓         ↓
 * ┌─────────┐  ┌──────────┐
 * │ Socket  │  │   FCM    │
 * │ 발송만  │  │ 푸시 발송 │
 * └─────────┘  └──────────┘
 *        │         │
 *        └────┬────┘
 *             ↓
 *      ┌─────────────┐
 *      │ DB 알림 저장│
 *      └─────────────┘
 */

import { getFirebaseMessaging, isFirebaseInitialized } from '../../../config/firebase.js';
import db from '../../../models/index.js';
import { kv } from '../../cache/kv.js';

const logger = {
  info: (...args) => console.log('[UnifiedNotificationService]', ...args),
  error: (...args) => console.error('[UnifiedNotificationService]', ...args),
  warn: (...args) => console.warn('[UnifiedNotificationService]', ...args)
};

/**
 * 사용자 Socket 연결 상태 확인
 * @param {string} userId - 사용자 ID
 * @returns {Promise<boolean>} - true면 연결됨(포그라운드), false면 오프라인/백그라운드
 */
async function isUserSocketConnected(userId) {
  try {
    // Redis에서 사용자 Socket 연결 상태 확인
    // Key 형식: "socket:user:{userId}:connected"
    const isConnected = await kv.get(`socket:user:${userId}:connected`);
    return isConnected === '1' || isConnected === 'true';
  } catch (error) {
    logger.error('Socket 연결 상태 확인 실패:', error);
    // 에러 발생 시 안전하게 false 반환 (FCM 발송)
    return false;
  }
}

/**
 * 사용자의 FCM 토큰 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<string[]>} - FCM 토큰 배열
 */
async function getUserFcmTokens(userId) {
  try {
    // FCMToken 모델에서 활성화된 토큰만 조회
    const fcmTokens = await db.FCMToken.findAll({
      where: {
        userId: userId,
        isActive: true
      },
      attributes: ['token', 'platform', 'language'],
      order: [['lastUsedAt', 'DESC']] // 최근 사용한 토큰 우선
    });

    if (!fcmTokens || fcmTokens.length === 0) {
      logger.warn('⚠️ 활성화된 FCM 토큰이 없습니다:', { userId });
      return [];
    }

    // 토큰 문자열 배열로 변환
    const tokens = fcmTokens.map(t => t.token);

    logger.info('✅ FCM 토큰 조회 성공:', {
      userId,
      tokenCount: tokens.length,
      platforms: fcmTokens.map(t => t.platform)
    });

    return tokens;
  } catch (error) {
    logger.error('❌ FCM 토큰 조회 실패:', error);
    return [];
  }
}

/**
 * 사용자의 앱 상태 조회 (포그라운드/백그라운드)
 * FCM 발송 조건 판단을 위해 실제 앱 상태를 확인합니다.
 *
 * @param {string} userId - 사용자 ID
 * @returns {Promise<string|null>} - 'foreground', 'background', 또는 null
 */
async function getUserAppState(userId) {
  try {
    // Redis에서 사용자 앱 상태 확인
    // Key 형식: "socket:user:{userId}:appState"
    const redisKey = `socket:user:${userId}:appState`;
    const appState = await kv.get(redisKey);

    logger.info('📱 [AppState] 사용자 앱 상태 조회:', {
      userId,
      redisKey,
      appState: appState || 'unknown',
      cached: !!appState,
      rawValue: appState
    });

    return appState; // 'foreground' | 'background' | null
  } catch (error) {
    logger.error('❌ [AppState] 앱 상태 조회 실패:', {
      error: error.message,
      userId
    });
    // 에러 발생 시 안전하게 null 반환 (FCM 발송 트리거)
    return null;
  }
}

/**
 * FCM 푸시 알림 발송
 * @param {Object} params - 알림 파라미터
 * @param {string[]} params.tokens - FCM 토큰 배열
 * @param {string} params.title - 알림 제목
 * @param {string} params.body - 알림 내용
 * @param {Object} params.data - 추가 데이터
 * @param {string} params.type - 알림 타입
 * @returns {Promise<Object>} - 발송 결과
 */
async function sendFcmNotification({ tokens, title, body, data = {}, type = 'DEFAULT' }) {
  if (!isFirebaseInitialized()) {
    logger.warn('Firebase가 초기화되지 않았습니다. FCM 발송 건너뜀');
    return { success: false, reason: 'firebase_not_initialized' };
  }

  const messaging = getFirebaseMessaging();
  if (!messaging || tokens.length === 0) {
    return { success: false, reason: 'no_tokens' };
  }

  try {
    const message = {
      tokens,
      notification: {
        title,
        body
      },
      data: {
        type,
        ...data,
        timestamp: Date.now().toString()
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'delivery-channel',  // ✅ 클라이언트와 동일한 channel ID 사용
          sound: 'default',
          priority: 'high',
          defaultVibrateTimings: true,
          visibility: 'public'
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body
            },
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await messaging.sendEachForMulticast(message);

    logger.info('✅ FCM 푸시 발송 완료:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalTokens: tokens.length
    });

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    };

  } catch (error) {
    logger.error('❌ FCM 푸시 발송 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 통합 알림 발송 (Socket.IO + FCM)
 * @param {Object} params - 알림 파라미터
 * @param {Object} params.io - Socket.IO 인스턴스
 * @param {string} params.userId - 수신자 사용자 ID
 * @param {string} params.eventName - Socket 이벤트명
 * @param {Object} params.socketData - Socket으로 전송할 데이터
 * @param {string} params.title - 알림 제목 (FCM용)
 * @param {string} params.body - 알림 내용 (FCM용)
 * @param {Object} params.fcmData - FCM 추가 데이터
 * @param {string} params.type - 알림 타입 (ORDER, CHAT, REVIEW 등)
 * @param {boolean} params.saveToDb - DB 저장 여부 (기본: true)
 * @returns {Promise<Object>} - 발송 결과
 */
export async function sendUnifiedNotification({
  io,
  userId,
  eventName,
  socketData,
  title,
  body,
  fcmData = {},
  type = 'DEFAULT',
  saveToDb = true
}) {
  const result = {
    socket: false,
    fcm: false,
    saved: false
  };

  try {
    // ============================================
    // 1단계: Socket.IO 실시간 알림 전송
    // ============================================
    if (io && userId && eventName) {
      io.to(`user:${userId}`).emit(eventName, socketData);
      result.socket = true;

      logger.info('📡 [Socket] 실시간 알림 발송:', {
        userId,
        eventName,
        room: `user:${userId}`
      });
    }

    // ============================================
    // 2단계: Socket 연결 상태 확인
    // ============================================
    const isConnected = await isUserSocketConnected(userId);

    if (!isConnected) {
      // ============================================
      // 3단계: 오프라인/백그라운드인 경우 FCM 발송
      // ============================================
      logger.info('🔔 사용자 오프라인/백그라운드 감지, FCM 푸시 발송 시작...');

      const tokens = await getUserFcmTokens(userId);

      if (tokens.length > 0) {
        const fcmResult = await sendFcmNotification({
          tokens,
          title,
          body,
          data: fcmData,
          type
        });

        result.fcm = fcmResult.success;

        if (fcmResult.success) {
          logger.info('✅ [FCM] 푸시 알림 발송 성공');
        }
      } else {
        logger.warn('⚠️ [FCM] 사용자의 FCM 토큰이 없습니다:', { userId });
      }
    } else {
      logger.info('✅ 사용자 포그라운드 상태, Socket 알림만 발송 (FCM 건너뜀)');
    }

    // ============================================
    // 4단계: DB에 알림 저장 (선택적)
    // ============================================
    if (saveToDb) {
      await db.Notification.create({
        userId,
        type,
        title,
        body,
        data: JSON.stringify(fcmData),
        platform: result.fcm ? 'FCM' : 'SOCKET',
        deliveryStatus: result.socket || result.fcm ? 'SENT' : 'FAILED',
        sentAt: new Date(),
        isRead: false
      });

      result.saved = true;
      logger.info('💾 [DB] 알림 저장 완료');
    }

    return result;

  } catch (error) {
    logger.error('❌ 통합 알림 발송 실패:', error);
    return result;
  }
}

/**
 * 주문 상태 변경 알림 (통합)
 * @param {Object} params - 알림 파라미터
 *
 * FCM 발송 조건:
 * - CONFIRMED (결제완료): FCM 발송
 * - COMPLETED (배달완료): 리뷰 작성 요청 메시지로 FCM 발송
 * - 기타 상태: Socket 이벤트만 발송
 */
export async function sendOrderStatusNotification({
  io,
  userId,
  orderId,
  orderNumber,
  oldStatus,
  newStatus,
  language = 'vi'
}) {
  // ============================================
  // 1. Socket 이벤트는 모든 상태 변경 시 발송
  // ============================================
  const socketData = {
    orderId,
    orderNumber,
    oldStatus,
    newStatus,
    updatedAt: new Date()
  };

  if (io && userId) {
    io.to(`user:${userId}`).emit('order:status_changed', socketData);
    logger.info('📡 [Socket] 주문 상태 변경 이벤트 발송:', {
      userId,
      orderId,
      newStatus,
      room: `user:${userId}`
    });
  }

  // ============================================
  // 2. FCM 푸시 메시지 생성 (상태별 맞춤 메시지)
  // ============================================
  let title, body;

  if (newStatus === 'CONFIRMED') {
    // 주문 확인
    title = language === 'vi'
      ? `Đơn hàng #${orderNumber}`
      : language === 'en'
      ? `Order #${orderNumber}`
      : `주문 #${orderNumber}`;

    body = language === 'vi'
      ? 'Đã xác nhận đơn hàng của bạn'
      : language === 'en'
      ? 'Your order has been confirmed'
      : '주문이 확인되었습니다';

  } else if (newStatus === 'PREPARING') {
    // 음식 준비 중
    title = language === 'vi'
      ? `Đơn hàng #${orderNumber}`
      : language === 'en'
      ? `Order #${orderNumber}`
      : `주문 #${orderNumber}`;

    body = language === 'vi'
      ? 'Cửa hàng đang chuẩn bị đơn hàng của bạn'
      : language === 'en'
      ? 'Your order is being prepared'
      : '매장에서 주문을 준비 중입니다';

  } else if (newStatus === 'READY') {
    // 픽업 준비 완료
    title = language === 'vi'
      ? `Đơn hàng #${orderNumber} sẵn sàng`
      : language === 'en'
      ? `Order #${orderNumber} ready`
      : `주문 #${orderNumber} 준비 완료`;

    body = language === 'vi'
      ? 'Đơn hàng của bạn đã sẵn sàng để giao'
      : language === 'en'
      ? 'Your order is ready for delivery'
      : '주문이 배달 준비 완료되었습니다';

  } else if (newStatus === 'DELIVERING') {
    // ⭐ 배달 중 (새로 추가)
    title = language === 'vi'
      ? `Đơn hàng #${orderNumber} đang giao`
      : language === 'en'
      ? `Order #${orderNumber} on the way`
      : `주문 #${orderNumber} 배달 중`;

    body = language === 'vi'
      ? 'Đơn hàng của bạn đang được giao đến'
      : language === 'en'
      ? 'Your order is on the way'
      : '주문이 배달 중입니다';

  } else if (newStatus === 'COMPLETED') {
    // 배달완료 + 리뷰 작성 요청 메시지
    title = language === 'vi'
      ? `Đơn hàng #${orderNumber} hoàn thành`
      : language === 'en'
      ? `Order #${orderNumber} completed`
      : `주문 #${orderNumber} 완료`;

    body = language === 'vi'
      ? 'Cảm ơn bạn! Vui lòng đánh giá đơn hàng của bạn'
      : language === 'en'
      ? 'Thank you! Please review your order'
      : '감사합니다! 주문에 대한 리뷰를 남겨주세요';

  } else if (newStatus === 'CANCELLED') {
    // 주문 취소
    title = language === 'vi'
      ? `Đơn hàng #${orderNumber} đã bị hủy`
      : language === 'en'
      ? `Order #${orderNumber} cancelled`
      : `주문 #${orderNumber} 취소됨`;

    body = language === 'vi'
      ? 'Đơn hàng của bạn đã bị hủy'
      : language === 'en'
      ? 'Your order has been cancelled'
      : '주문이 취소되었습니다';

  } else if (newStatus === 'REJECTED') {
    // 주문 거절
    title = language === 'vi'
      ? `Đơn hàng #${orderNumber} bị từ chối`
      : language === 'en'
      ? `Order #${orderNumber} rejected`
      : `주문 #${orderNumber} 거절됨`;

    body = language === 'vi'
      ? 'Xin lỗi, cửa hàng đã từ chối đơn hàng của bạn'
      : language === 'en'
      ? 'Sorry, the store has rejected your order'
      : '죄송합니다. 매장에서 주문을 거절했습니다';

  } else if (newStatus === 'PENDING') {
    // 주문 접수 대기
    title = language === 'vi'
      ? `Đơn hàng #${orderNumber}`
      : language === 'en'
      ? `Order #${orderNumber}`
      : `주문 #${orderNumber}`;

    body = language === 'vi'
      ? 'Đơn hàng của bạn đang chờ xác nhận'
      : language === 'en'
      ? 'Your order is pending confirmation'
      : '주문이 확인 대기 중입니다';

  } else {
    // 기타 상태에 대한 기본 메시지
    title = language === 'vi'
      ? `Đơn hàng #${orderNumber}`
      : language === 'en'
      ? `Order #${orderNumber}`
      : `주문 #${orderNumber}`;

    body = language === 'vi'
      ? `Trạng thái đơn hàng: ${newStatus}`
      : language === 'en'
      ? `Order status: ${newStatus}`
      : `주문 상태: ${newStatus}`;
  }

  // ============================================
  // 4. 통합 알림 발송 (Socket 연결 상태 + 앱 상태 확인 → FCM)
  // ============================================
  const isConnected = await isUserSocketConnected(userId);
  const appState = await getUserAppState(userId); // 'foreground' | 'background' | null

  logger.info('🔔 [Notification] 사용자 상태 확인:', {
    userId,
    isSocketConnected: isConnected,
    appState: appState || 'unknown',
    willSendFCM: !isConnected || appState === 'background'
  });

  // FCM 발송 조건: Socket 연결 안 됨 OR 앱이 백그라운드 상태
  const shouldSendFCM = !isConnected || appState === 'background';

  if (shouldSendFCM) {
    logger.info('🔔 [FCM] FCM 푸시 발송 조건 충족 (오프라인 또는 백그라운드)');

    const tokens = await getUserFcmTokens(userId);

    if (tokens.length > 0) {
      const fcmResult = await sendFcmNotification({
        tokens,
        title,
        body,
        data: {
          orderId: orderId.toString(),
          orderNumber,
          oldStatus,
          newStatus,
          screen: 'OrderDetail',
          channelId: 'delivery-channel',  // ✅ Android notification channel ID 명시
          notificationType: 'ORDER_UPDATE'
        },
        type: 'ORDER_UPDATE'
      });

      logger.info(fcmResult.success ? '✅ [FCM] 푸시 발송 성공' : '❌ [FCM] 푸시 발송 실패');
    }
  } else {
    logger.info('✅ 사용자 포그라운드 상태 (Socket 연결됨 + 앱이 포그라운드), Socket 알림만 발송');
  }

  // ============================================
  // 5. DB에 알림 저장
  // ============================================
  await db.Notification.create({
    userId,
    type: 'ORDER_UPDATE',  // ✅ ENUM 값: ORDER_UPDATE
    title,
    body,
    data: { orderId, orderNumber, oldStatus, newStatus },  // ✅ JSON 직접 저장
    platform: 'PUSH',  // ✅ ENUM 값: PUSH (FCM/Socket 구분 없이 통일)
    deliveryStatus: 'SENT',
    sentAt: new Date(),
    isRead: false
  });

  return { socket: true, fcm: !isConnected, saved: true };
}

/**
 * 채팅 메시지 알림 (통합)
 * @param {Object} params - 알림 파라미터
 */
export async function sendChatMessageNotification({
  io,
  userId,
  roomId,
  senderName,
  messagePreview,
  language = 'vi'
}) {
  const title = language === 'vi'
    ? `Tin nhắn mới từ ${senderName}`
    : language === 'en'
    ? `New message from ${senderName}`
    : `${senderName}님의 새 메시지`;

  return await sendUnifiedNotification({
    io,
    userId,
    eventName: 'chat:message:new',
    socketData: {
      roomId,
      senderName,
      messagePreview,
      timestamp: new Date()
    },
    title,
    body: messagePreview,
    fcmData: {
      roomId: roomId.toString(),
      senderName,
      screen: 'ChatRoom'
    },
    type: 'CHAT'
  });
}

/**
 * 리뷰 등록 알림 (점주용)
 * @param {Object} params - 알림 파라미터
 */
export async function sendReviewNotification({
  io,
  storeId,
  reviewId,
  rating,
  language = 'vi'
}) {
  const title = language === 'vi'
    ? `Đánh giá mới (${rating}⭐)`
    : language === 'en'
    ? `New Review (${rating}⭐)`
    : `새 리뷰 (${rating}⭐)`;

  const body = language === 'vi'
    ? 'Đánh giá từ khách hàng đã được đăng'
    : language === 'en'
    ? 'Customer review has been posted'
    : '고객님의 리뷰가 등록되었습니다';

  return await sendUnifiedNotification({
    io,
    userId: storeId, // 점주는 storeId를 userId로 사용
    eventName: 'store:new_review',
    socketData: {
      reviewId,
      rating,
      timestamp: new Date()
    },
    title,
    body,
    fcmData: {
      reviewId: reviewId.toString(),
      rating: rating.toString(),
      screen: 'ReviewDetail'
    },
    type: 'REVIEW'
  });
}

export default {
  sendUnifiedNotification,
  sendOrderStatusNotification,
  sendChatMessageNotification,
  sendReviewNotification,
  isUserSocketConnected,
  getUserFcmTokens
};
