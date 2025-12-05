/**
 * 이벤트 버스 - 도메인 이벤트 발행 및 구독 관리
 * 마이크로서비스 아키텍처에서 느슨한 결합을 위한 이벤트 기반 통신을 제공합니다.
 */
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export class EventBus {
  constructor(options = {}) {
    this.eventEmitter = new EventEmitter();
    this.maxListeners = options.maxListeners || 100;
    this.subscribers = new Map();
    this.publishedEvents = new Map();
    this.failedEvents = [];
    this.metrics = {
      published: 0,
      delivered: 0,
      failed: 0,
    };
    
    // 메모리 누수 방지를 위한 최대 리스너 설정
    this.eventEmitter.setMaxListeners(this.maxListeners);
    
    // 에러 핸들링
    this.eventEmitter.on('error', (error) => {
      console.error('EventBus error:', error);
      this.metrics.failed++;
    });
  }

  /**
   * 이벤트 구독
   *
   * @param {string} eventName - 이벤트 이름
   * @param {Function} handler - 이벤트 핸들러
   * @param {object} options - 구독 옵션
   * @returns {string} - 구독 ID
   */
  subscribe(eventName, handler, options = {}) {
    if (!eventName || typeof eventName !== 'string') {
      throw new Error('이벤트 이름은 문자열이어야 합니다.');
    }

    if (!handler || typeof handler !== 'function') {
      throw new Error('핸들러는 함수여야 합니다.');
    }

    const subscriptionId = uuidv4();
    const subscription = {
      id: subscriptionId,
      eventName,
      handler,
      options: {
        once: options.once || false,
        priority: options.priority || 0,
        filter: options.filter,
        retry: options.retry || 0,
        timeout: options.timeout || 5000,
      },
      createdAt: new Date(),
      handledCount: 0,
    };

    // 구독 정보 저장
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, []);
    }
    this.subscribers.get(eventName).push(subscription);

    // 우선순위별 정렬 (높은 우선순위 먼저)
    this.subscribers.get(eventName).sort((a, b) => b.options.priority - a.options.priority);

    // 래핑된 핸들러로 이벤트 등록
    const wrappedHandler = this.createWrappedHandler(subscription);
    
    if (options.once) {
      this.eventEmitter.once(eventName, wrappedHandler);
    } else {
      this.eventEmitter.on(eventName, wrappedHandler);
    }

    return subscriptionId;
  }

  /**
   * 한 번만 실행되는 이벤트 구독
   *
   * @param eventName
   * @param handler
   * @param options
   */
  subscribeOnce(eventName, handler, options = {}) {
    return this.subscribe(eventName, handler, { ...options, once: true });
  }

  /**
   * 우선순위가 높은 이벤트 구독
   *
   * @param eventName
   * @param handler
   * @param options
   */
  subscribeHighPriority(eventName, handler, options = {}) {
    return this.subscribe(eventName, handler, { ...options, priority: 10 });
  }

  /**
   * 이벤트 구독 해제
   *
   * @param subscriptionId
   */
  unsubscribe(subscriptionId) {
    for (const [eventName, subscriptions] of this.subscribers.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        const subscription = subscriptions[index];
        subscriptions.splice(index, 1);
        
        // EventEmitter에서도 제거
        this.eventEmitter.removeAllListeners(eventName);
        
        // 남은 구독자들 다시 등록
        subscriptions.forEach(sub => {
          const wrappedHandler = this.createWrappedHandler(sub);
          if (sub.options.once) {
            this.eventEmitter.once(eventName, wrappedHandler);
          } else {
            this.eventEmitter.on(eventName, wrappedHandler);
          }
        });
        
        return true;
      }
    }
    return false;
  }

  /**
   * 특정 이벤트의 모든 구독자 해제
   *
   * @param eventName
   */
  unsubscribeAll(eventName) {
    if (this.subscribers.has(eventName)) {
      this.subscribers.delete(eventName);
      this.eventEmitter.removeAllListeners(eventName);
      return true;
    }
    return false;
  }

  /**
   * 이벤트 발행
   *
   * @param eventName
   * @param eventData
   * @param options
   */
  async publish(eventName, eventData = {}, options = {}) {
    if (!eventName || typeof eventName !== 'string') {
      throw new Error('이벤트 이름은 문자열이어야 합니다.');
    }

    const event = {
      id: uuidv4(),
      name: eventName,
      data: eventData,
      timestamp: new Date(),
      publisherId: options.publisherId || 'unknown',
      correlationId: options.correlationId || uuidv4(),
      version: options.version || '1.0',
      metadata: options.metadata || {},
    };

    // 발행된 이벤트 기록
    this.publishedEvents.set(event.id, event);
    this.metrics.published++;

    try {
      // 동기적 발행 (기본)
      if (!options.async) {
        this.eventEmitter.emit(eventName, event);
        return event;
      }

      // 비동기 발행
      setImmediate(() => {
        this.eventEmitter.emit(eventName, event);
      });

      return event;
    } catch (error) {
      this.metrics.failed++;
      this.failedEvents.push({ event, error, timestamp: new Date() });
      throw error;
    }
  }

  /**
   * 지연된 이벤트 발행
   *
   * @param eventName
   * @param eventData
   * @param delay
   * @param options
   */
  publishDelayed(eventName, eventData, delay, options = {}) {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const event = await this.publish(eventName, eventData, options);
          resolve(event);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  /**
   * 조건부 이벤트 발행
   *
   * @param eventName
   * @param eventData
   * @param condition
   * @param options
   */
  publishConditional(eventName, eventData, condition, options = {}) {
    if (typeof condition === 'function' ? condition(eventData) : condition) {
      return this.publish(eventName, eventData, options);
    }
    return null;
  }

  /**
   * 래핑된 핸들러 생성 (에러 처리, 메트릭, 필터링 등)
   *
   * @param subscription
   */
  createWrappedHandler(subscription) {
    return async (event) => {
      try {
        // 필터 적용
        if (subscription.options.filter && !subscription.options.filter(event)) {
          return;
        }

        // 타임아웃 설정
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Handler timeout')), subscription.options.timeout);
        });

        // 핸들러 실행 (타임아웃과 경쟁)
        const handlerPromise = subscription.handler(event);
        
        await Promise.race([handlerPromise, timeoutPromise]);
        
        subscription.handledCount++;
        this.metrics.delivered++;

        // 일회성 구독인 경우 제거
        if (subscription.options.once) {
          this.unsubscribe(subscription.id);
        }
      } catch (error) {
        this.metrics.failed++;
        this.handleSubscriberError(subscription, event, error);
      }
    };
  }

  /**
   * 구독자 에러 처리
   *
   * @param subscription
   * @param event
   * @param error
   */
  handleSubscriberError(subscription, event, error) {
    console.error(`Event handler error for ${event.name}:`, error);

    // 재시도 로직
    if (subscription.options.retry > 0) {
      subscription.options.retry--;
      setTimeout(() => {
        subscription.handler(event).catch(retryError => {
          console.error(`Event handler retry failed for ${event.name}:`, retryError);
        });
      }, 1000);
    }

    // 에러 이벤트 발행
    this.eventEmitter.emit('subscriberError', {
      subscription,
      event,
      error,
      timestamp: new Date(),
    });
  }

  /**
   * 활성 구독자 조회
   *
   * @param eventName
   */
  getSubscribers(eventName) {
    if (eventName) {
      return this.subscribers.get(eventName) || [];
    }
    return Array.from(this.subscribers.entries()).reduce((acc, [name, subs]) => {
      acc[name] = subs;
      return acc;
    }, {});
  }

  /**
   * 이벤트 기록 조회
   *
   * @param limit
   */
  getPublishedEvents(limit = 100) {
    const events = Array.from(this.publishedEvents.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    return events;
  }

  /**
   * 실패한 이벤트 조회
   *
   * @param limit
   */
  getFailedEvents(limit = 100) {
    return this.failedEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * 메트릭 조회
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeSubscribers: Array.from(this.subscribers.values()).reduce((acc, subs) => acc + subs.length, 0),
      totalEvents: this.publishedEvents.size,
      failedEventsCount: this.failedEvents.length,
    };
  }

  /**
   * 이벤트 기록 정리
   *
   * @param options
   */
  cleanup(options = {}) {
    const maxAge = options.maxAge || 24 * 60 * 60 * 1000; // 24시간
    const maxEvents = options.maxEvents || 1000;
    const now = Date.now();

    // 오래된 이벤트 제거
    for (const [eventId, event] of this.publishedEvents.entries()) {
      if (now - event.timestamp.getTime() > maxAge) {
        this.publishedEvents.delete(eventId);
      }
    }

    // 이벤트 수 제한
    if (this.publishedEvents.size > maxEvents) {
      const events = Array.from(this.publishedEvents.entries())
        .sort(([, a], [, b]) => b.timestamp - a.timestamp)
        .slice(maxEvents);
      
      events.forEach(([eventId]) => this.publishedEvents.delete(eventId));
    }

    // 실패한 이벤트 정리
    this.failedEvents = this.failedEvents
      .filter(failedEvent => now - failedEvent.timestamp.getTime() <= maxAge)
      .slice(0, maxEvents);
  }

  /**
   * 모든 구독자 및 이벤트 정리
   */
  destroy() {
    this.subscribers.clear();
    this.publishedEvents.clear();
    this.failedEvents = [];
    this.eventEmitter.removeAllListeners();
    this.metrics = { published: 0, delivered: 0, failed: 0 };
  }

  /**
   * 이벤트 버스 상태 정보
   */
  getStatus() {
    return {
      isHealthy: this.metrics.failed / Math.max(this.metrics.published, 1) < 0.1,
      metrics: this.getMetrics(),
      subscribersCount: Array.from(this.subscribers.values()).reduce((acc, subs) => acc + subs.length, 0),
      eventsInMemory: this.publishedEvents.size,
      failedEventsCount: this.failedEvents.length,
    };
  }
}

// 전역 이벤트 버스 인스턴스
let globalEventBus = null;

/**
 * 전역 이벤트 버스 인스턴스 반환 (싱글톤)
 *
 * @param options
 */
export const getGlobalEventBus = (options = {}) => {
  if (!globalEventBus) {
    globalEventBus = new EventBus(options);
  }
  return globalEventBus;
};

/**
 * 새로운 이벤트 버스 인스턴스 생성
 *
 * @param options
 */
export const createEventBus = (options = {}) => {
  return new EventBus(options);
};

export default EventBus;