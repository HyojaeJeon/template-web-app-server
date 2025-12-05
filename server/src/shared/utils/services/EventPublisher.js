/**
 * 이벤트 퍼블리셔 - 도메인 이벤트 발행을 담당
 * 비즈니스 로직에서 발생하는 중요한 이벤트들을 다른 컨텍스트로 전파합니다.
 */
import { getGlobalEventBus } from './EventBus.js';

export class EventPublisher {
  constructor(eventBus = null, options = {}) {
    this.eventBus = eventBus || getGlobalEventBus();
    this.publisherId = options.publisherId || 'DefaultPublisher';
    this.defaultOptions = {
      async: options.async || false,
      retry: options.retry || 3,
      timeout: options.timeout || 5000,
      ...options,
    };
    this.publishQueue = [];
    this.isProcessing = false;
  }

  /**
   * 도메인 이벤트 발행
   *
   * @param eventName
   * @param aggregateId
   * @param eventData
   * @param options
   */
  async publishDomainEvent(eventName, aggregateId, eventData, options = {}) {
    const event = {
      eventName,
      eventData: {
        aggregateId,
        ...eventData,
      },
      options: {
        ...this.defaultOptions,
        ...options,
        publisherId: this.publisherId,
        metadata: {
          domain: 'business',
          type: 'domain_event',
          ...options.metadata,
        },
      },
    };

    return await this.publish(event);
  }

  /**
   * 통합 이벤트 발행 (다른 바운디드 컨텍스트로)
   *
   * @param eventName
   * @param eventData
   * @param options
   */
  async publishIntegrationEvent(eventName, eventData, options = {}) {
    const event = {
      eventName,
      eventData,
      options: {
        ...this.defaultOptions,
        ...options,
        publisherId: this.publisherId,
        metadata: {
          domain: 'integration',
          type: 'integration_event',
          ...options.metadata,
        },
      },
    };

    return await this.publish(event);
  }

  /**
   * 시스템 이벤트 발행
   *
   * @param eventName
   * @param eventData
   * @param options
   */
  async publishSystemEvent(eventName, eventData, options = {}) {
    const event = {
      eventName,
      eventData,
      options: {
        ...this.defaultOptions,
        ...options,
        publisherId: this.publisherId,
        metadata: {
          domain: 'system',
          type: 'system_event',
          ...options.metadata,
        },
      },
    };

    return await this.publish(event);
  }

  /**
   * 기본 이벤트 발행
   *
   * @param event
   */
  async publish(event) {
    if (this.defaultOptions.queued) {
      return this.enqueue(event);
    }

    return await this.eventBus.publish(
      event.eventName,
      event.eventData,
      event.options,
    );
  }

  /**
   * 배치 이벤트 발행
   *
   * @param events
   * @param options
   */
  async publishBatch(events, options = {}) {
    const batchOptions = {
      ...this.defaultOptions,
      ...options,
      publisherId: this.publisherId,
    };

    const results = [];
    const errors = [];

    for (const event of events) {
      try {
        const result = await this.eventBus.publish(
          event.eventName,
          event.eventData,
          { ...batchOptions, ...event.options },
        );
        results.push(result);
      } catch (error) {
        errors.push({ event, error });
      }
    }

    return { results, errors };
  }

  /**
   * 큐에 이벤트 추가
   *
   * @param event
   */
  enqueue(event) {
    this.publishQueue.push({
      ...event,
      enqueuedAt: new Date(),
    });

    // 큐 처리 시작 (이미 처리 중이 아닌 경우)
    if (!this.isProcessing) {
      this.processQueue();
    }

    return Promise.resolve({ queued: true, position: this.publishQueue.length });
  }

  /**
   * 큐 처리
   */
  async processQueue() {
    if (this.isProcessing || this.publishQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.publishQueue.length > 0) {
        const event = this.publishQueue.shift();
        
        try {
          await this.eventBus.publish(
            event.eventName,
            event.eventData,
            event.options,
          );
        } catch (error) {
          console.error('Failed to publish queued event:', error);
          
          // 재시도 로직
          if (event.retryCount < (event.options.retry || 3)) {
            event.retryCount = (event.retryCount || 0) + 1;
            event.lastError = error;
            this.publishQueue.unshift(event); // 큐 앞쪽에 다시 추가
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 큐 상태 조회
   */
  getQueueStatus() {
    return {
      queueLength: this.publishQueue.length,
      isProcessing: this.isProcessing,
      oldestEvent: this.publishQueue.length > 0 ? this.publishQueue[0].enqueuedAt : null,
    };
  }

  /**
   * 큐 정리
   */
  clearQueue() {
    this.publishQueue = [];
    this.isProcessing = false;
  }
}

/**
 * Local App 특화 이벤트 퍼블리셔
 * 도메인별 이벤트 발행을 위한 특화된 메서드들을 제공합니다.
 */
export class DeliveryAppEventPublisher extends EventPublisher {
  constructor(eventBus = null, options = {}) {
    super(eventBus, { ...options, publisherId: 'DeliveryAppPublisher' });
  }

  // === 사용자 도메인 이벤트 ===

  /**
   * 사용자 등록 이벤트
   *
   * @param userId
   * @param userData
   */
  async publishUserRegistered(userId, userData) {
    return this.publishDomainEvent('user.registered', userId, {
      phone: userData.phone,
      preferredLanguage: userData.preferredLanguage,
      registeredAt: new Date(),
    });
  }

  /**
   * 사용자 프로필 업데이트 이벤트
   *
   * @param userId
   * @param updatedFields
   */
  async publishUserProfileUpdated(userId, updatedFields) {
    return this.publishDomainEvent('user.profile.updated', userId, {
      updatedFields,
      updatedAt: new Date(),
    });
  }

  /**
   * 사용자 주소 추가 이벤트 - 비활성화됨 (UserAddress 모델 제거됨)
   *
   * @param userId
   * @param address
   */
  async publishUserAddressAdded(userId, address) {
    // UserAddress 모델 제거로 인해 이벤트 비활성화
    console.warn('UserAddress events disabled - model removed');
    return null;
  }

  // === 매장 도메인 이벤트 ===

  /**
   * 매장 등록 이벤트
   *
   * @param storeId
   * @param storeData
   */
  async publishStoreRegistered(storeId, storeData) {
    return this.publishDomainEvent('store.registered', storeId, {
      name: storeData.name,
      cuisineType: storeData.cuisineType,
      address: storeData.address,
      registeredAt: new Date(),
    });
  }

  /**
   * 매장 영업 상태 변경 이벤트
   *
   * @param storeId
   * @param oldStatus
   * @param newStatus
   */
  async publishStoreStatusChanged(storeId, oldStatus, newStatus) {
    return this.publishDomainEvent('store.status.changed', storeId, {
      oldStatus,
      newStatus,
      changedAt: new Date(),
    });
  }

  /**
   * 메뉴 업데이트 이벤트
   *
   * @param storeId
   * @param menuChanges
   */
  async publishMenuUpdated(storeId, menuChanges) {
    return this.publishDomainEvent('store.menu.updated', storeId, {
      changes: menuChanges,
      updatedAt: new Date(),
    });
  }

  // === 주문 도메인 이벤트 ===

  /**
   * 주문 생성 이벤트
   *
   * @param orderId
   * @param orderData
   */
  async publishOrderCreated(orderId, orderData) {
    return this.publishDomainEvent('order.created', orderId, {
      userId: orderData.userId,
      storeId: orderData.storeId,
      totalAmount: orderData.totalAmount.toJSON(),
      items: orderData.items,
      deliveryAddress: orderData.deliveryAddress.toPlainObject(),
      createdAt: new Date(),
    });
  }

  /**
   * 주문 상태 변경 이벤트
   *
   * @param orderId
   * @param oldStatus
   * @param newStatus
   * @param context
   */
  async publishOrderStatusChanged(orderId, oldStatus, newStatus, context = {}) {
    return this.publishDomainEvent('order.status.changed', orderId, {
      oldStatus,
      newStatus,
      context,
      changedAt: new Date(),
    });
  }

  /**
   * 주문 취소 이벤트
   *
   * @param orderId
   * @param reason
   * @param cancelledBy
   */
  async publishOrderCancelled(orderId, reason, cancelledBy) {
    return this.publishDomainEvent('order.cancelled', orderId, {
      reason,
      cancelledBy,
      cancelledAt: new Date(),
    });
  }

  // === 결제 도메인 이벤트 ===

  /**
   * 결제 시작 이벤트
   *
   * @param paymentId
   * @param paymentData
   */
  async publishPaymentInitiated(paymentId, paymentData) {
    return this.publishDomainEvent('payment.initiated', paymentId, {
      orderId: paymentData.orderId,
      amount: paymentData.amount.toJSON(),
      method: paymentData.method,
      initiatedAt: new Date(),
    });
  }

  /**
   * 결제 완료 이벤트
   *
   * @param paymentId
   * @param transactionId
   */
  async publishPaymentCompleted(paymentId, transactionId) {
    return this.publishDomainEvent('payment.completed', paymentId, {
      transactionId,
      completedAt: new Date(),
    });
  }

  /**
   * 결제 실패 이벤트
   *
   * @param paymentId
   * @param errorCode
   * @param errorMessage
   */
  async publishPaymentFailed(paymentId, errorCode, errorMessage) {
    return this.publishDomainEvent('payment.failed', paymentId, {
      errorCode,
      errorMessage,
      failedAt: new Date(),
    });
  }

  // === POS 통합 이벤트 ===

  /**
   * POS 주문 전송 이벤트
   *
   * @param orderId
   * @param posSystemId
   */
  async publishPosOrderSent(orderId, posSystemId) {
    return this.publishIntegrationEvent('pos.order.sent', {
      orderId,
      posSystemId,
      sentAt: new Date(),
    });
  }

  /**
   * POS 주문 확인 이벤트
   *
   * @param orderId
   * @param posSystemId
   * @param estimatedTime
   */
  async publishPosOrderConfirmed(orderId, posSystemId, estimatedTime) {
    return this.publishIntegrationEvent('pos.order.confirmed', {
      orderId,
      posSystemId,
      estimatedTime,
      confirmedAt: new Date(),
    });
  }

  /**
   * POS 연결 상태 변경 이벤트
   *
   * @param storeId
   * @param posSystemId
   * @param status
   */
  async publishPosConnectionStatusChanged(storeId, posSystemId, status) {
    return this.publishSystemEvent('pos.connection.status.changed', {
      storeId,
      posSystemId,
      status,
      changedAt: new Date(),
    });
  }

  // === 배달 도메인 이벤트 ===

  /**
   * 배달 시작 이벤트
   *
   * @param orderId
   * @param deliveryData
   */
  async publishDeliveryStarted(orderId, deliveryData) {
    return this.publishDomainEvent('delivery.started', orderId, {
      driverId: deliveryData.driverId,
      estimatedArrival: deliveryData.estimatedArrival,
      startedAt: new Date(),
    });
  }

  /**
   * 배달 완료 이벤트
   *
   * @param orderId
   * @param deliveryData
   */
  async publishDeliveryCompleted(orderId, deliveryData) {
    return this.publishDomainEvent('delivery.completed', orderId, {
      driverId: deliveryData.driverId,
      actualArrival: deliveryData.actualArrival,
      completedAt: new Date(),
    });
  }

  // === 시스템 이벤트 ===

  /**
   * 시스템 오류 이벤트
   *
   * @param component
   * @param error
   * @param context
   */
  async publishSystemError(component, error, context = {}) {
    return this.publishSystemEvent('system.error', {
      component,
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack,
      },
      context,
      occurredAt: new Date(),
    });
  }

  /**
   * 시스템 성능 메트릭 이벤트
   *
   * @param metrics
   */
  async publishPerformanceMetrics(metrics) {
    return this.publishSystemEvent('system.performance.metrics', {
      metrics,
      timestamp: new Date(),
    });
  }
}

/**
 * 전역 App 이벤트 퍼블리셔 인스턴스
 */
let globalDeliveryAppPublisher = null;

/**
 * 전역 App 이벤트 퍼블리셔 반환
 *
 * @param options
 */
export const getGlobalDeliveryAppPublisher = (options = {}) => {
  if (!globalDeliveryAppPublisher) {
    globalDeliveryAppPublisher = new DeliveryAppEventPublisher(null, options);
  }
  return globalDeliveryAppPublisher;
};

/**
 * 새로운 이벤트 퍼블리셔 인스턴스 생성
 *
 * @param eventBus
 * @param options
 */
export const createEventPublisher = (eventBus = null, options = {}) => {
  return new EventPublisher(eventBus, options);
};

/**
 * 새로운 App 이벤트 퍼블리셔 인스턴스 생성
 *
 * @param eventBus
 * @param options
 */
export const createDeliveryAppEventPublisher = (eventBus = null, options = {}) => {
  return new DeliveryAppEventPublisher(eventBus, options);
};

export default EventPublisher;