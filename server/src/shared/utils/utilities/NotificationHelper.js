/**
 * Notification Helper
 * Socket.IO 실시간 알림 + DB 저장 통합 헬퍼
 *
 * 핵심 기능:
 * - Socket.IO 이벤트 발송
 * - Notification 테이블 저장
 * - 다국어 메시지 자동 생성
 * - 최적화된 데이터만 전송
 */

import db from '../../../models/index.js';
import { STORE_SOCKET_EVENTS } from '../../websocket/StoreSocketManager.js';

// 간단한 로거 정의 (Logger.js와 동일한 패턴)
const logger = {
  info: (...args) => console.log('[NotificationHelper]', ...args),
  error: (...args) => console.error('[NotificationHelper]', ...args),
  warn: (...args) => console.warn('[NotificationHelper]', ...args)
};

/**
 * 주문 알림 생성 및 발송 (통합)
 * @param {Object} io - Socket.IO 인스턴스
 * @param {Object} order - 주문 객체
 * @param {Object} user - 고객 정보
 * @param {Array} orderItems - 주문 아이템 목록
 */
export async function createAndEmitOrderNotification(io, order, user, orderItems) {
  try {
    const storeId = order.storeId;

    // 1. Socket.IO 실시간 이벤트 발송 (기존 로직)
    if (io) {
      const socketOrderItems = orderItems.map(item => ({
        id: item.menuItemId,
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        notes: item.notes || null,
        options: item.options ? item.options.map(opt => ({
          id: opt.optionId,
          name: opt.name || 'Option',
          price: opt.price || 0,
          quantity: opt.quantity || 1
        })) : []
      }));

      io.to(`store:${storeId}`).emit(STORE_SOCKET_EVENTS.NEW_ORDER, {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        orderType: order.orderType,
        createdAt: order.createdAt,
        customer: {
          id: user.id,
          customerName: user.fullName,
          fullName: user.fullName,
          phone: user.phone || null,
          totalOrders: 0,
          averageRating: 0,
          isVip: false
        },
        items: socketOrderItems,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        deliveryAddress: order.deliveryAddress || null,
        notes: order.notes || null,
        isUrgent: false,
        posData: null
      });

      logger.info('📦 [Socket] 새 주문 알림 발송:', {
        room: `store:${storeId}`,
        event: STORE_SOCKET_EVENTS.NEW_ORDER,
        orderId: order.id,
        orderNumber: order.orderNumber
      });
    }

    // 2. Notification DB 저장 (신규 추가)
    const notification = await db.Notification.create({
      userId: storeId, // 매장을 userId로 사용 (Web용)
      storeId: storeId,
      type: 'ORDER_UPDATE',

      // 다국어 제목 (title = Local어, titleEn = 영어, titleKo = 한국어)
      title: `Đơn hàng mới #${order.orderNumber}`,       // Local어
      titleEn: `New Order #${order.orderNumber}`,        // 영어
      titleKo: `새 주문 #${order.orderNumber}`,          // 한국어

      // 다국어 내용 (body = Local어, bodyEn = 영어, bodyKo = 한국어)
      body: `Đơn hàng từ ${user.fullName} (${order.total.toLocaleString()}đ)`,           // Local어
      bodyEn: `Order from ${user.fullName} (${order.total.toLocaleString()}đ)`,          // 영어
      bodyKo: `${user.fullName}님의 주문 (${order.total.toLocaleString()}đ)`,            // 한국어

      // 최소한의 메타데이터만 저장
      data: JSON.stringify({
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        total: order.total,
        customerName: user.fullName,
        itemCount: orderItems.length,
        type: 'NEW_ORDER'
      }),

      platform: 'PUSH',
      deliveryStatus: 'SENT',
      sentAt: new Date(),
      isRead: false
    });

    logger.info('💾 [DB] 주문 알림 저장 완료:', {
      notificationId: notification.id,
      storeId,
      orderId: order.id
    });

    return notification;

  } catch (error) {
    logger.error('❌ [Error] 주문 알림 생성 실패:', error);
    // 에러 발생 시에도 Socket 발송은 완료되었으므로 에러를 던지지 않음
    return null;
  }
}

/**
 * 리뷰 알림 생성 및 발송 (통합)
 * @param {Object} io - Socket.IO 인스턴스
 * @param {Object} review - 리뷰 객체
 * @param {Object} user - 고객 정보
 * @param {number} storeId - 매장 ID
 */
export async function createAndEmitReviewNotification(io, review, user, storeId) {
  try {
    // 1. Socket.IO 실시간 이벤트 발송 (기존 로직)
    if (io) {
      // 고객 이름 마스킹
      const maskUserName = (name) => {
        if (!name || name.length === 0) return '익명';
        if (name.length === 1) return name;
        if (name.length === 2) return name[0] + '*';
        return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
      };

      io.to(`store_${storeId}`).emit('newReview', {
        reviewId: review.id,
        customerName: maskUserName(user.fullName || user.name),
        rating: review.rating,
        content: review.content,
        storeId: storeId
      });

      logger.info('⭐ [Socket] 리뷰 알림 발송:', {
        room: `store_${storeId}`,
        reviewId: review.id,
        rating: review.rating
      });
    }

    // 2. Notification DB 저장 (신규 추가)
    const notification = await db.Notification.create({
      userId: storeId, // 매장을 userId로 사용
      storeId: storeId,
      type: 'REVIEW',

      // 다국어 제목 (title = Local어, titleEn = 영어, titleKo = 한국어)
      title: `Đánh giá mới (${review.rating}⭐)`,           // Local어
      titleEn: `New Review (${review.rating}⭐)`,          // 영어
      titleKo: `새 리뷰 (${review.rating}⭐)`,             // 한국어

      // 다국어 내용 (개인정보 마스킹 적용)
      body: `Đánh giá từ khách hàng đã được đăng`,         // Local어
      bodyEn: `Customer review has been posted`,           // 영어
      bodyKo: `고객님의 리뷰가 등록되었습니다`,            // 한국어

      // 최소한의 메타데이터만 저장
      data: JSON.stringify({
        reviewId: review.id,
        rating: review.rating,
        hasContent: !!review.content,
        contentLength: review.content ? review.content.length : 0,
        type: 'NEW_REVIEW'
      }),

      platform: 'PUSH',
      deliveryStatus: 'SENT',
      sentAt: new Date(),
      isRead: false
    });

    logger.info('💾 [DB] 리뷰 알림 저장 완료:', {
      notificationId: notification.id,
      storeId,
      reviewId: review.id
    });

    return notification;

  } catch (error) {
    logger.error('❌ [Error] 리뷰 알림 생성 실패:', error);
    return null;
  }
}

/**
 * 주문 상태 변경 알림
 * @param {Object} io - Socket.IO 인스턴스
 * @param {Object} order - 주문 객체
 * @param {string} oldStatus - 이전 상태
 * @param {string} newStatus - 새 상태
 */
export async function createAndEmitOrderStatusNotification(io, order, oldStatus, newStatus) {
  try {
    const storeId = order.storeId;

    // 1. Socket.IO 이벤트 발송
    if (io) {
      io.to(`store:${storeId}`).emit(STORE_SOCKET_EVENTS.ORDER_STATUS_CHANGED, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        oldStatus,
        newStatus,
        updatedAt: new Date()
      });

      logger.info('🔄 [Socket] 주문 상태 변경 알림:', {
        orderId: order.id,
        oldStatus,
        newStatus
      });
    }

    // 2. DB 저장
    const statusMessages = {
      CONFIRMED: { ko: '확인됨', vi: 'Đã xác nhận', en: 'Confirmed' },
      PREPARING: { ko: '조리 중', vi: 'Đang chuẩn bị', en: 'Preparing' },
      READY: { ko: '픽업 준비 완료', vi: 'Sẵn sàng lấy món', en: 'Ready' },
      DELIVERING: { ko: '배달 중', vi: 'Đang giao hàng', en: 'Delivering' },
      COMPLETED: { ko: '완료', vi: 'Hoàn thành', en: 'Completed' },
      CANCELLED: { ko: '취소됨', vi: 'Đã hủy', en: 'Cancelled' }
    };

    const statusText = statusMessages[newStatus] || { ko: newStatus, vi: newStatus, en: newStatus };

    const notification = await db.Notification.create({
      userId: storeId,
      storeId: storeId,
      type: 'ORDER_UPDATE',

      // 다국어 제목 (title = Local어, titleEn = 영어, titleKo = 한국어)
      title: `Đơn hàng ${order.orderNumber} ${statusText.vi}`,           // Local어
      titleEn: `Order ${order.orderNumber} ${statusText.en}`,            // 영어
      titleKo: `주문 ${order.orderNumber} ${statusText.ko}`,             // 한국어

      // 다국어 내용
      body: `Trạng thái đơn hàng đã thay đổi từ ${statusMessages[oldStatus]?.vi || oldStatus} sang ${statusText.vi}`,       // Local어
      bodyEn: `Order status changed from ${statusMessages[oldStatus]?.en || oldStatus} to ${statusText.en}`,                 // 영어
      bodyKo: `주문 상태가 ${statusMessages[oldStatus]?.ko || oldStatus}에서 ${statusText.ko}(으)로 변경되었습니다`,        // 한국어

      data: JSON.stringify({
        orderId: order.id,
        orderNumber: order.orderNumber,
        oldStatus,
        newStatus,
        type: 'ORDER_STATUS_CHANGE'
      }),

      platform: 'PUSH',
      deliveryStatus: 'SENT',
      sentAt: new Date(),
      isRead: false
    });

    logger.info('💾 [DB] 주문 상태 변경 알림 저장:', {
      notificationId: notification.id,
      orderId: order.id,
      newStatus
    });

    return notification;

  } catch (error) {
    logger.error('❌ [Error] 주문 상태 변경 알림 실패:', error);
    return null;
  }
}

/**
 * 범용 알림 생성 헬퍼
 * @param {Object} params - 알림 파라미터
 */
export async function createStoreNotification(params) {
  const {
    storeId,
    type,
    title,      // Local어 (Vi)
    titleEn,    // 영어
    titleKo,    // 한국어
    body,       // Local어 (Vi)
    bodyEn,     // 영어
    bodyKo,     // 한국어
    data = {},
    platform = 'PUSH'
  } = params;

  try {
    const notification = await db.Notification.create({
      userId: storeId,
      storeId: storeId,
      type,
      // 다국어 제목 (title = Local어, titleEn = 영어, titleKo = 한국어)
      title: title,              // Local어
      titleEn: titleEn || title, // 영어 (없으면 Local어로 대체)
      titleKo: titleKo || title, // 한국어 (없으면 Local어로 대체)
      // 다국어 내용
      body: body,                // Local어
      bodyEn: bodyEn || body,    // 영어 (없으면 Local어로 대체)
      bodyKo: bodyKo || body,    // 한국어 (없으면 Local어로 대체)
      data: JSON.stringify(data),
      platform,
      deliveryStatus: 'SENT',
      sentAt: new Date(),
      isRead: false
    });

    logger.info('💾 [DB] 범용 알림 생성:', {
      notificationId: notification.id,
      storeId,
      type
    });

    return notification;
  } catch (error) {
    logger.error('❌ [Error] 범용 알림 생성 실패:', error);
    return null;
  }
}

export default {
  createAndEmitOrderNotification,
  createAndEmitReviewNotification,
  createAndEmitOrderStatusNotification,
  createStoreNotification
};
