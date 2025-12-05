/**
 * Local App 통합 모니터링 서비스
 * 성능, 에러, 사용자 행동, 비즈니스 메트릭 통합 관리
 */

import PerformanceMonitor from '../../monitoring/performance-monitor.js';
import ErrorTracker from '../../monitoring/error-tracker.js';

/**
 * 모니터링 서비스
 * UnifiedSocketProvider를 통해 실시간 이벤트를 구독하고 메트릭을 수집
 */
class MonitoringService {
  constructor(config = {}) {
    this.config = {
      enablePerformanceMonitoring: true,
      enableErrorTracking: true,
      enableUserAnalytics: true,
      enableBusinessMetrics: true,
      enableSecurityMonitoring: true,
      apiEndpoint: '/api/monitoring',
      enableRealTimeAlerts: true,
      vietnamSpecific: {
        trackVNDTransactions: true,
        trackDeliveryMetrics: true,
        trackPOSIntegration: true,
        trackMobileUsage: true,
        enableVietnameseLocalization: true
      },
      ...config
    };

    this.performanceMonitor = null;
    this.errorTracker = null;
    this.socketProvider = null; // UnifiedSocketProvider 참조
    this.isInitialized = false;
    this.eventCleanupFunctions = []; // 이벤트 구독 해제 함수들
    
    // 메트릭 저장소
    this.metrics = {
      business: new Map(),
      user: new Map(),
      security: new Map(),
      vietnam: new Map()
    };

    this.alertThresholds = {
      errorRate: 0.05, // 5% 이상 에러율
      responseTime: 3000, // 3초 이상 응답시간
      memoryUsage: 0.8, // 80% 이상 메모리 사용
      orderFailureRate: 0.02, // 2% 이상 주문 실패율
      posConnectionFailure: 5, // POS 연결 실패 5회 이상
      paymentFailureRate: 0.01 // 1% 이상 결제 실패율
    };
  }

  /**
   * 모니터링 서비스 초기화
   * @param {Object} socketProvider - UnifiedSocketProvider 인스턴스
   */
  async init(socketProvider) {
    if (this.isInitialized) return;
    
    // UnifiedSocketProvider 저장
    this.socketProvider = socketProvider;
    
    try {
      console.log('🔍 Local App 모니터링 시스템 초기화 중...');

      // 성능 모니터링 초기화
      if (this.config.enablePerformanceMonitoring) {
        this.performanceMonitor = new PerformanceMonitor({
          endpoint: `${this.config.apiEndpoint}/performance`,
          enableRealTime: true,
          enableWebVitals: true,
          enableResourceTiming: true
        });
        console.log('✅ 성능 모니터링 초기화 완료');
      }

      // 에러 추적 초기화
      if (this.config.enableErrorTracking) {
        this.errorTracker = new ErrorTracker({
          apiEndpoint: `${this.config.apiEndpoint}/errors`,
          enableConsoleCapture: true,
          enableNetworkCapture: true,
          enableUserInteractionCapture: true
        });
        console.log('✅ 에러 추적 초기화 완료');
      }

      // 실시간 웹소켓 연결은 UnifiedSocketProvider를 통해 처리됨
      if (this.config.enableRealTimeAlerts && this.socketProvider) {
        console.log('✅ 실시간 알림은 UnifiedSocketProvider를 통해 처리됩니다');
      }

      // 비즈니스 메트릭 추적 시작
      if (this.config.enableBusinessMetrics && this.socketProvider) {
        this.startBusinessMetricCollection();
        console.log('✅ 비즈니스 메트릭 수집 시작');
      }

      // Local 특화 기능 초기화
      if (this.config.vietnamSpecific.enableVietnameseLocalization) {
        this.initVietnameseFeatures();
        console.log('✅ Local 특화 기능 초기화 완료');
      }

      this.isInitialized = true;
      console.log('🎯 모니터링 시스템 초기화 완료');

    } catch (error) {
      console.error('❌ 모니터링 시스템 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * Local 특화 기능 초기화
   */
  initVietnameseFeatures() {
    // VND 통화 포맷팅
    this.vndFormatter = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    });

    // Local 시간대 설정
    this.vietnamTimeZone = 'Asia/Ho_Chi_Minh';
    
    // Local 공휴일 체크
    this.vietnameseHolidays = [
      '01-01', // Tết Dương lịch
      '30-04', // Ngày Giải phóng
      '01-05', // Ngày Quốc tế Lao động
      '02-09'  // Ngày Quốc khánh
    ];

    console.log('🇻🇳 Local 특화 기능 활성화됨');
  }

  /**
   * UnifiedSocketProvider 연결 이벤트 추적
   */
  trackConnectionEvents() {
    if (!this.socketProvider) return;

    // 연결 성공
    const cleanupConnect = this.socketProvider.subscribeToRealtime('connect', () => {
      this.sendMetric('system', 'websocket_connected', {
        timestamp: Date.now(),
        vietnamese: { status: '통합 실시간 연결 성공' }
      });
    });
    this.eventCleanupFunctions.push(cleanupConnect);
  }

  /**
   * 모든 메트릭 수집 시작
   */
  startBusinessMetricCollection() {
    if (!this.socketProvider) {
      console.warn('MonitoringService: socketProvider가 필요합니다');
      return;
    }

    // 주문 관련 메트릭
    this.trackOrderMetrics();
    
    // 결제 관련 메트릭
    this.trackPaymentMetrics();
    
    // 배달 관련 메트릭
    this.trackDeliveryMetrics();
    
    // POS 통합 메트릭
    this.trackPOSMetrics();
    
    // 사용자 행동 메트릭
    this.trackUserBehaviorMetrics();
  }

  /**
   * 주문 메트릭 추적
   */
  trackOrderMetrics() {
    if (!this.socketProvider) return;

    // 주문 생성 추적
    const cleanup1 = this.socketProvider.subscribeToRealtime('order:created', (orderData) => {
      this.sendMetric('business', 'order_created', {
        orderId: orderData.id,
        storeId: orderData.storeId,
        totalAmount: orderData.total,
        currency: 'VND',
        itemCount: orderData.items?.length || 0,
        paymentMethod: orderData.paymentMethod,
        timestamp: Date.now(),
        vietnamese: {
          orderType: '새 주문',
          amount: `${orderData.total?.toLocaleString('vi-VN')} ₫`,
          status: '주문 접수됨'
        }
      });
    });
    this.eventCleanupFunctions.push(cleanup1);

    // 주문 실패 추적
    const cleanup2 = this.socketProvider.subscribeToRealtime('order:failed', (data) => {
      const { orderData, error } = data;
      this.sendMetric('business', 'order_failed', {
        orderId: orderData.id,
        failureReason: error.code,
        errorMessage: error.message,
        timestamp: Date.now(),
        vietnamese: {
          orderType: '주문 실패',
          reason: this.getVietnameseFailureReason(error.code),
          status: '처리 실패'
        }
      });
    });
    this.eventCleanupFunctions.push(cleanup2);

    // 주문 완료 추적
    const cleanup3 = this.socketProvider.subscribeToRealtime('order:completed', (orderData) => {
      const completionTime = Date.now() - new Date(orderData.createdAt).getTime();
      this.sendMetric('business', 'order_completed', {
        orderId: orderData.id,
        completionTimeMs: completionTime,
        completionTimeMinutes: Math.round(completionTime / 60000),
        totalAmount: orderData.total,
        currency: 'VND',
        timestamp: Date.now(),
        vietnamese: {
          orderType: '주문 완료',
          time: `${Math.round(completionTime / 60000)} 분`,
          amount: this.vndFormatter?.format(orderData.total) || `${orderData.total} ₫`
        }
      });
    });
    this.eventCleanupFunctions.push(cleanup3);
  }

  /**
   * 결제 메트릭 추적
   */
  trackPaymentMetrics() {
    if (!this.socketProvider) return;

    // 결제 시도 추적
    const cleanup1 = this.socketProvider.subscribeToRealtime('payment:attempt', (paymentData) => {
      this.sendMetric('business', 'payment_attempted', {
        paymentId: paymentData.id,
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        method: paymentData.method,
        provider: paymentData.provider,
        timestamp: Date.now(),
        vietnamese: {
          method: this.getVietnamesePaymentMethod(paymentData.method),
          provider: paymentData.provider || 'N/A',
          amount: this.vndFormatter?.format(paymentData.amount) || `${paymentData.amount} ₫`
        }
      });
    });
    this.eventCleanupFunctions.push(cleanup1);

    // 결제 실패 추적
    const cleanup2 = this.socketProvider.subscribeToRealtime('payment:failed', (data) => {
      const { paymentData, error } = data;
      this.sendMetric('business', 'payment_failed', {
        paymentId: paymentData.id,
        failureCode: error.code,
        failureMessage: error.message,
        method: paymentData.method,
        amount: paymentData.amount,
        timestamp: Date.now(),
        vietnamese: {
          reason: this.getVietnamesePaymentFailureReason(error.code),
          method: this.getVietnamesePaymentMethod(paymentData.method),
          amount: this.vndFormatter?.format(paymentData.amount) || `${paymentData.amount} ₫`
        }
      });

      // 결제 실패율 체크
      this.checkPaymentFailureRate();
    });
    this.eventCleanupFunctions.push(cleanup2);

    // 결제 성공 추적
    const cleanup3 = this.socketProvider.subscribeToRealtime('payment:success', (paymentData) => {
      this.sendMetric('business', 'payment_successful', {
        paymentId: paymentData.id,
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        method: paymentData.method,
        provider: paymentData.provider,
        processingTimeMs: paymentData.processingTime,
        timestamp: Date.now(),
        vietnamese: {
          method: this.getVietnamesePaymentMethod(paymentData.method),
          provider: paymentData.provider,
          amount: this.vndFormatter?.format(paymentData.amount) || `${paymentData.amount} ₫`,
          time: `${paymentData.processingTime}ms`
        }
      });
    });
    this.eventCleanupFunctions.push(cleanup3);
  }

  /**
   * 배달 메트릭 추적
   */
  trackDeliveryMetrics() {
    if (!this.socketProvider) return;

    // 배달 시작 추적
    const cleanup1 = this.socketProvider.subscribeToRealtime('delivery:started', (deliveryData) => {
      this.sendMetric('business', 'delivery_started', {
        deliveryId: deliveryData.id,
        orderId: deliveryData.orderId,
        driverId: deliveryData.driverId,
        estimatedTime: deliveryData.estimatedTime,
        distance: deliveryData.distance,
        timestamp: Date.now(),
        vietnamese: {
          status: '배달 시작됨',
          estimatedTime: `${deliveryData.estimatedTime} 분`,
          distance: `${deliveryData.distance} km`
        }
      });
    });
    this.eventCleanupFunctions.push(cleanup1);

    // 배달 완료 추적
    const cleanup2 = this.socketProvider.subscribeToRealtime('delivery:completed', (deliveryData) => {
      const actualTime = Date.now() - new Date(deliveryData.startedAt).getTime();
      this.sendMetric('business', 'delivery_completed', {
        deliveryId: deliveryData.id,
        orderId: deliveryData.orderId,
        driverId: deliveryData.driverId,
        actualTimeMs: actualTime,
        actualTimeMinutes: Math.round(actualTime / 60000),
        distance: deliveryData.distance,
        rating: deliveryData.rating,
        timestamp: Date.now(),
        vietnamese: {
          status: '배달 완료',
          time: `${Math.round(actualTime / 60000)} 분`,
          distance: `${deliveryData.distance} km`,
          rating: deliveryData.rating ? `${deliveryData.rating}/5` : 'N/A'
        }
      });
    });
    this.eventCleanupFunctions.push(cleanup2);
  }

  /**
   * POS 통합 메트릭 추적
   */
  trackPOSMetrics() {
    if (!this.socketProvider) return;

    // POS 연결 상태 추적
    const cleanup1 = this.socketProvider.subscribeToRealtime('pos:connection_status', (status) => {
      this.sendMetric('business', 'pos_connection_status', {
        connected: status.connected,
        posType: status.posType,
        storeId: status.storeId,
        latency: status.latency,
        timestamp: Date.now(),
        vietnamese: {
          status: status.connected ? '연결됨' : '연결 끊김',
          type: status.posType || 'Unknown',
          latency: status.latency ? `${status.latency}ms` : 'N/A'
        }
      });

      // POS 연결 실패 체크
      if (!status.connected) {
        this.checkPOSConnectionFailure();
      }
    });
    this.eventCleanupFunctions.push(cleanup1);

    // POS 주문 동기화 추적
    const cleanup2 = this.socketProvider.subscribeToRealtime('pos:order_sync', (syncData) => {
      this.sendMetric('business', 'pos_order_synced', {
        orderId: syncData.orderId,
        syncType: syncData.type,
        success: syncData.success,
        processingTime: syncData.processingTime,
        timestamp: Date.now(),
        vietnamese: {
          type: syncData.type === 'CREATE' ? '주문 생성' : '주문 업데이트',
          status: syncData.success ? '성공' : '실패',
          time: `${syncData.processingTime}ms`
        }
      });
    });
    this.eventCleanupFunctions.push(cleanup2);
  }

  /**
   * 사용자 행동 메트릭 추적
   */
  trackUserBehaviorMetrics() {
    if (!this.socketProvider) return;

    // 페이지 뷰 추적
    const cleanup1 = this.socketProvider.subscribeToRealtime('user:page_view', (pageData) => {
      this.sendMetric('user', 'page_viewed', {
        page: pageData.page,
        userId: pageData.userId,
        sessionId: pageData.sessionId,
        referrer: pageData.referrer,
        timestamp: Date.now(),
        vietnamese: {
          page: this.getVietnamesePageName(pageData.page),
          action: '페이지 조회'
        }
      });
    });
    this.eventCleanupFunctions.push(cleanup1);

    // 기능 사용 추적
    const cleanup2 = this.socketProvider.subscribeToRealtime('user:feature_used', (featureData) => {
      this.sendMetric('user', 'feature_used', {
        feature: featureData.feature,
        userId: featureData.userId,
        context: featureData.context,
        timestamp: Date.now(),
        vietnamese: {
          feature: this.getVietnameseFeatureName(featureData.feature),
          action: '기능 사용'
        }
      });
    });
    this.eventCleanupFunctions.push(cleanup2);

    // 보안 이벤트 추적
    this.trackSecurityEvents();
  }

  /**
   * 보안 이벤트 추적
   */
  trackSecurityEvents() {
    if (!this.socketProvider) return;

    // 로그인 시도 추적
    const cleanup1 = this.socketProvider.subscribeToRealtime('security:login_attempt', (loginData) => {
      this.sendMetric('security', 'login_attempt', {
        userId: loginData.userId,
        success: loginData.success,
        method: loginData.method,
        ipAddress: loginData.ipAddress,
        timestamp: Date.now(),
        vietnamese: {
          status: loginData.success ? '성공' : '실패',
          method: this.getVietnameseLoginMethod(loginData.method)
        }
      });
    });
    this.eventCleanupFunctions.push(cleanup1);

    // 의심스러운 활동 추적
    const cleanup2 = this.socketProvider.subscribeToRealtime('security:suspicious_activity', (activityData) => {
      this.sendMetric('security', 'suspicious_activity', {
        userId: activityData.userId,
        activityType: activityData.type,
        riskLevel: activityData.riskLevel,
        details: activityData.details,
        timestamp: Date.now(),
        vietnamese: {
          type: this.getVietnameseSuspiciousActivityType(activityData.type),
          riskLevel: this.getVietnameseRiskLevel(activityData.riskLevel)
        }
      });

      // 높은 위험도 알림
      if (activityData.riskLevel === 'HIGH') {
        this.sendSecurityAlert(activityData);
      }
    });
    this.eventCleanupFunctions.push(cleanup2);
  }

  /**
   * Local 특화 메트릭 추적
   */
  trackVietnameSpecificMetrics() {
    if (!this.socketProvider) return;

    // VND 거래 추적
    const cleanup1 = this.socketProvider.subscribeToRealtime('transaction:vnd', (transactionData) => {
      this.sendMetric('vietnam', 'vnd_transaction', {
        amount: transactionData.amount,
        type: transactionData.type,
        exchangeRate: transactionData.exchangeRate,
        timestamp: Date.now(),
        vietnamese: {
          amount: this.vndFormatter?.format(transactionData.amount) || `${transactionData.amount} ₫`,
          type: transactionData.type === 'PAYMENT' ? 'Thanh toán' : 'Hoàn tiền'
        }
      });
    });
    this.eventCleanupFunctions.push(cleanup1);

    // 모바일 앱 사용량 추적
    const cleanup2 = this.socketProvider.subscribeToRealtime('mobile:usage', (usageData) => {
      this.sendMetric('vietnam', 'mobile_usage', {
        platform: usageData.platform,
        version: usageData.version,
        action: usageData.action,
        duration: usageData.duration,
        timestamp: Date.now(),
        vietnamese: {
          platform: usageData.platform,
          action: this.getVietnameseMobileAction(usageData.action)
        }
      });
    });
    this.eventCleanupFunctions.push(cleanup2);
  }

  /**
   * 메트릭 전송
   */
  sendMetric(category, name, data) {
    // 메트릭 저장
    const metricKey = `${category}:${name}`;
    if (!this.metrics[category]) {
      this.metrics[category] = new Map();
    }
    
    const existingMetrics = this.metrics[category].get(name) || [];
    existingMetrics.push({
      ...data,
      recordedAt: Date.now()
    });
    
    // 최근 100개만 유지
    if (existingMetrics.length > 100) {
      existingMetrics.shift();
    }
    
    this.metrics[category].set(name, existingMetrics);

    // API 서버로 전송
    if (this.config.apiEndpoint) {
      fetch(`${this.config.apiEndpoint}/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category,
          name,
          data,
          timestamp: Date.now()
        })
      }).catch(error => {
        console.error('Failed to send metric:', error);
      });
    }

    // 콘솔 로그 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 [${category}] ${name}:`, data);
    }
  }

  /**
   * Local어 번역 헬퍼 메서드들
   */
  getVietnameseFailureReason(code) {
    const reasons = {
      'OUT_OF_STOCK': 'Hết hàng',
      'PAYMENT_FAILED': 'Thanh toán thất bại',
      'STORE_CLOSED': 'Cửa hàng đã đóng',
      'DELIVERY_UNAVAILABLE': 'Không thể giao hàng',
      'INVALID_ADDRESS': 'Địa chỉ không hợp lệ'
    };
    return reasons[code] || 'Lý do không xác định';
  }

  getVietnamesePaymentMethod(method) {
    const methods = {
      'CASH': 'Tiền mặt',
      'MOMO': 'MoMo',
      'ZALOPAY': 'ZaloPay',
      'VNPAY': 'VNPay',
      'CARD': 'Thẻ ngân hàng',
      'COD': 'Thu hộ'
    };
    return methods[method] || method;
  }

  getVietnamesePaymentFailureReason(code) {
    const reasons = {
      'INSUFFICIENT_BALANCE': 'Số dư không đủ',
      'INVALID_CARD': 'Thẻ không hợp lệ',
      'TIMEOUT': 'Hết thời gian',
      'CANCELLED': 'Đã hủy',
      'NETWORK_ERROR': 'Lỗi mạng'
    };
    return reasons[code] || 'Lỗi không xác định';
  }

  getVietnamesePageName(page) {
    const pages = {
      '/': 'Trang chủ',
      '/menu': 'Thực đơn',
      '/orders': 'Đơn hàng',
      '/cart': 'Giỏ hàng',
      '/profile': 'Tài khoản'
    };
    return pages[page] || page;
  }

  getVietnameseFeatureName(feature) {
    const features = {
      'ADD_TO_CART': 'Thêm vào giỏ',
      'PLACE_ORDER': 'Đặt hàng',
      'SEARCH': 'Tìm kiếm',
      'FILTER': 'Lọc',
      'REVIEW': 'Đánh giá'
    };
    return features[feature] || feature;
  }

  getVietnameseLoginMethod(method) {
    const methods = {
      'EMAIL': 'Email',
      'PHONE': 'Số điện thoại',
      'SOCIAL': 'Mạng xã hội',
      'OTP': 'Mã OTP'
    };
    return methods[method] || method;
  }

  getVietnameseSuspiciousActivityType(type) {
    const types = {
      'MULTIPLE_FAILED_LOGINS': 'Nhiều lần đăng nhập thất bại',
      'UNUSUAL_LOCATION': 'Vị trí bất thường',
      'RAPID_REQUESTS': 'Yêu cầu quá nhanh',
      'SUSPICIOUS_PAYMENT': 'Thanh toán đáng ngờ'
    };
    return types[type] || type;
  }

  getVietnameseRiskLevel(level) {
    const levels = {
      'LOW': 'Thấp',
      'MEDIUM': 'Trung bình',
      'HIGH': 'Cao',
      'CRITICAL': 'Nghiêm trọng'
    };
    return levels[level] || level;
  }

  getVietnameseMobileAction(action) {
    const actions = {
      'APP_OPEN': 'Mở ứng dụng',
      'APP_CLOSE': 'Đóng ứng dụng',
      'ORDER_PLACED': 'Đặt hàng',
      'ITEM_VIEWED': 'Xem sản phẩm',
      'NOTIFICATION_RECEIVED': 'Nhận thông báo'
    };
    return actions[action] || action;
  }

  /**
   * 경보 체크 메서드들
   */
  checkPaymentFailureRate() {
    const paymentMetrics = this.metrics.business?.get('payment_failed') || [];
    const successMetrics = this.metrics.business?.get('payment_successful') || [];
    
    const totalPayments = paymentMetrics.length + successMetrics.length;
    if (totalPayments > 100) {
      const failureRate = paymentMetrics.length / totalPayments;
      if (failureRate > this.alertThresholds.paymentFailureRate) {
        this.sendAlert('HIGH_PAYMENT_FAILURE_RATE', {
          rate: failureRate,
          threshold: this.alertThresholds.paymentFailureRate,
          vietnamese: {
            message: `Tỷ lệ thanh toán thất bại cao: ${(failureRate * 100).toFixed(2)}%`
          }
        });
      }
    }
  }

  checkPOSConnectionFailure() {
    const posMetrics = this.metrics.business?.get('pos_connection_status') || [];
    const recentFailures = posMetrics.filter(m => 
      !m.connected && (Date.now() - m.timestamp < 600000) // 최근 10분
    );
    
    if (recentFailures.length >= this.alertThresholds.posConnectionFailure) {
      this.sendAlert('POS_CONNECTION_UNSTABLE', {
        failureCount: recentFailures.length,
        threshold: this.alertThresholds.posConnectionFailure,
        vietnamese: {
          message: `POS kết nối không ổn định: ${recentFailures.length} lần thất bại`
        }
      });
    }
  }

  handlePerformanceDegradation(data) {
    if (data.responseTime > this.alertThresholds.responseTime) {
      this.sendAlert('SLOW_RESPONSE_TIME', {
        responseTime: data.responseTime,
        threshold: this.alertThresholds.responseTime,
        vietnamese: {
          message: `Thời gian phản hồi chậm: ${data.responseTime}ms`
        }
      });
    }
    
    if (data.memoryUsage > this.alertThresholds.memoryUsage) {
      this.sendAlert('HIGH_MEMORY_USAGE', {
        usage: data.memoryUsage,
        threshold: this.alertThresholds.memoryUsage,
        vietnamese: {
          message: `Sử dụng bộ nhớ cao: ${(data.memoryUsage * 100).toFixed(2)}%`
        }
      });
    }
  }

  /**
   * 경보 전송
   */
  sendAlert(type, data) {
    console.warn(`🚨 [ALERT] ${type}:`, data);
    
    // Socket을 통한 실시간 알림
    if (this.socketProvider) {
      this.socketProvider.sendMessage('monitoring:alert', {
        type,
        data,
        timestamp: Date.now()
      });
    }
    
    // API 서버로 알림 전송
    fetch(`${this.config.apiEndpoint}/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        data,
        timestamp: Date.now()
      })
    }).catch(error => {
      console.error('Failed to send alert:', error);
    });
  }

  sendSecurityAlert(activityData) {
    this.sendAlert('SECURITY_THREAT', {
      ...activityData,
      vietnamese: {
        message: 'Phát hiện hoạt động đáng ngờ mức độ cao',
        action: 'Cần xem xét ngay lập tức'
      }
    });
  }

  /**
   * 메트릭 통계 조회
   */
  getMetricStats(category, name, duration = 3600000) {
    const metrics = this.metrics[category]?.get(name) || [];
    const cutoff = Date.now() - duration;
    const recentMetrics = metrics.filter(m => m.recordedAt > cutoff);
    
    if (recentMetrics.length === 0) {
      return null;
    }
    
    return {
      count: recentMetrics.length,
      firstRecorded: recentMetrics[0].recordedAt,
      lastRecorded: recentMetrics[recentMetrics.length - 1].recordedAt,
      data: recentMetrics
    };
  }

  /**
   * 대시보드용 요약 데이터
   */
  getDashboardSummary() {
    const now = Date.now();
    const hourAgo = now - 3600000;
    
    return {
      orders: {
        created: this.getMetricStats('business', 'order_created', 3600000)?.count || 0,
        completed: this.getMetricStats('business', 'order_completed', 3600000)?.count || 0,
        failed: this.getMetricStats('business', 'order_failed', 3600000)?.count || 0
      },
      payments: {
        successful: this.getMetricStats('business', 'payment_successful', 3600000)?.count || 0,
        failed: this.getMetricStats('business', 'payment_failed', 3600000)?.count || 0
      },
      delivery: {
        started: this.getMetricStats('business', 'delivery_started', 3600000)?.count || 0,
        completed: this.getMetricStats('business', 'delivery_completed', 3600000)?.count || 0
      },
      pos: {
        connected: this.metrics.business?.get('pos_connection_status')?.slice(-1)[0]?.connected || false,
        syncCount: this.getMetricStats('business', 'pos_order_synced', 3600000)?.count || 0
      },
      vietnamese: {
        title: 'Tổng quan theo dõi',
        period: '1 giờ qua'
      }
    };
  }

  /**
   * 정리 및 종료
   */
  cleanup() {
    console.log('🔄 모니터링 서비스 정리 중...');
    
    // 모든 이벤트 구독 해제
    this.eventCleanupFunctions.forEach(cleanup => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    });
    this.eventCleanupFunctions = [];
    
    // 리소스 정리
    this.performanceMonitor = null;
    this.errorTracker = null;
    this.socketProvider = null;
    this.metrics.business.clear();
    this.metrics.user.clear();
    this.metrics.security.clear();
    this.metrics.vietnam.clear();
    
    this.isInitialized = false;
    console.log('✅ 모니터링 서비스 정리 완료');
  }
}

// 싱글톤 인스턴스
const monitoringService = new MonitoringService();

export default monitoringService;