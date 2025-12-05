/**
 * 의존성 주입 컨테이너
 * 애플리케이션의 모든 서비스와 유스케이스를 초기화하고 관리
 */

import winston from 'winston';

// Repository 임포트
import { StoreRepository } from '../features/store/infrastructure/repositories/StoreRepository.js';
import { MenuRepository } from '../features/store/infrastructure/repositories/MenuRepository.js';
import { DeliveryZoneRepository } from '../features/store/infrastructure/repositories/DeliveryZoneRepository.js';
import { OrderRepository } from '../features/order/infrastructure/repositories/OrderRepository.js';
import { CartRepository } from '../features/cart/infrastructure/repositories/CartRepository.js';

// Services 임포트
import { StoreService } from '../features/store/application/services/StoreService.js';
import { MenuService } from '../features/store/application/services/MenuService.js';
import { OrderService } from '../features/order/application/services/OrderService.js';
import { OrderCancellationService } from '../features/order/application/services/OrderCancellationService.js';
import { CartService } from '../features/cart/application/services/CartService.js';
import { POSResponseHandlingService } from '../features/order/application/services/POSResponseHandlingService.js';
import { OrderNotificationService } from '../features/order/application/services/OrderNotificationService.js';

// Use Cases 임포트
import { CreateOrderUseCase } from '../features/order/application/usecases/CreateOrderUseCase.js';
import { AddToCartUseCase } from '../features/cart/application/usecases/AddToCartUseCase.js';
import { UpdateCartUseCase } from '../features/cart/application/usecases/UpdateCartUseCase.js';
import { RemoveFromCartUseCase } from '../features/cart/application/usecases/RemoveFromCartUseCase.js';
import { ClearCartUseCase } from '../features/cart/application/usecases/ClearCartUseCase.js';
import { ResetPasswordUseCase } from '../features/auth/application/usecases/ResetPasswordUseCase.js';

// 검색 Use Cases 임포트
import SearchStoreUseCase from '../features/store/application/usecases/SearchStoreUseCase.js';
import SearchMenuUseCase from '../features/store/application/usecases/SearchMenuUseCase.js';
import UnifiedSearchUseCase from '../features/store/application/usecases/UnifiedSearchUseCase.js';

// 중앙 Redis 클라이언트 임포트
import { cacheService } from './redis.js';

// 중앙 Elasticsearch 서비스 임포트
import elasticsearchService from '../shared/elasticsearch/index.js';

// Membership System 임포트
import { MembershipTierRepository } from '../features/membership/infrastructure/repositories/MembershipTierRepository.js';
import { MembershipProgressRepository } from '../features/membership/infrastructure/repositories/MembershipProgressRepository.js';
import { TierCacheService } from '../features/membership/infrastructure/services/TierCacheService.js';
import { MembershipTierService } from '../features/membership/application/services/MembershipTierService.js';
import { TierDiscountCalculationService } from '../features/membership/application/services/TierDiscountCalculationService.js';
import { TierProgressService } from '../features/membership/application/services/TierProgressService.js';

// Discount Aggregation Services
import { DiscountAggregationService } from '../features/discount/application/services/DiscountAggregationService.js';
import { DiscountCacheService } from '../features/discount/infrastructure/services/DiscountCacheService.js';

// 실시간 통신 서비스 임포트
import { ChatService } from '../features/chat/application/services/ChatService.js';
import { RealtimeMessageService } from '../features/realtime/application/services/RealtimeMessageService.js';
import { NotificationSocketHandler } from '../features/realtime/interfaces/websocket/NotificationSocketHandler.js';
import { NotificationService } from '../features/notification/application/services/NotificationService.js';
import { SMSNotificationService } from '../features/notification/infrastructure/services/SMSNotificationService.js';
import { EmailNotificationService } from '../features/notification/infrastructure/services/EmailNotificationService.js';

// Payment Services 임포트
import { PaymentSecurityService } from '../features/payment/application/services/PaymentSecurityService.js';
import { PaymentValidationService } from '../features/payment/application/services/PaymentValidationService.js';

// Coupon Services 및 Repositories 임포트 - 다른 에이전트가 아직 작업 중
// import CouponService from '../features/coupon/application/services/CouponService.js';
// import CouponValidationService from '../features/coupon/application/services/CouponValidationService.js';
// import CouponDiscountCalculationService from '../features/coupon/application/services/CouponDiscountCalculationService.js';
// import CouponRepository from '../features/coupon/infrastructure/repositories/CouponRepository.js';
// import CouponUsageRepository from '../features/coupon/infrastructure/repositories/CouponUsageRepository.js';
// import CouponCacheService from '../features/coupon/infrastructure/services/CouponCacheService.js';

// Use Cases는 나중에 필요할 때 동적으로 import 하도록 변경

// 로거 설정
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'duri-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

// 간단한 EventBus 구현 (추후 확장 가능)
class SimpleEventBus {
  constructor() {
    this.handlers = {};
  }

  async publish(event) {
    const handlers = this.handlers[event.type] || [];
    await Promise.all(handlers.map(handler => handler(event)));
  }

  subscribe(eventType, handler) {
    if (!this.handlers[eventType]) {
      this.handlers[eventType] = [];
    }
    this.handlers[eventType].push(handler);
  }
}

// 컨테이너 클래스
class DIContainer {
  constructor() {
    this.services = {};
    this.repositories = {};
    this.useCases = {};
    this.eventBus = new SimpleEventBus();
    this.cacheService = cacheService;
    this.elasticsearchService = elasticsearchService;
    this.initialized = false;
  }

  // 컨테이너 초기화
  async initialize() {
    if (this.initialized) {
      return;
    }

    logger.info('의존성 주입 컨테이너 초기화 시작...');

    try {
      // 1. Cache Manager 초기화
      // 중앙 Redis 캐시 서비스 사용 (이미 초기화됨)

      // 2. Repositories 초기화
      await this.initializeRepositories();

      // 3. Services 초기화
      await this.initializeServices();

      // 4. Use Cases 초기화
      await this.initializeUseCases();

      this.initialized = true;
      logger.info('의존성 주입 컨테이너 초기화 완료');
    } catch (error) {
      logger.error('의존성 주입 컨테이너 초기화 실패:', error);
      throw error;
    }
  }

  // Cache Manager 초기화 - 중앙 Redis 클라이언트 사용
  async initializeCacheManager() {
    logger.info('Cache Manager 초기화 - 중앙 Redis 클라이언트 사용...');
    
    // 중앙 Redis 클라이언트를 사용하여 CacheService 직접 사용
    const { cacheService } = await import('./redis.js');
    this.cacheManager = {
      getOrderCache: () => null, // 필요시 구현
      getCartCache: () => null,  // 필요시 구현
      // 기본 캐시 인터페이스
      set: (key, value, ttl) => cacheService.set(key, value, ttl),
      get: (key) => cacheService.get(key),
      del: (key) => cacheService.del(key),
      exists: (key) => cacheService.exists(key),
    };
    
    logger.info('Cache Manager 초기화 완료 (중앙 Redis 클라이언트 사용)');
  }

  // Repositories 초기화
  async initializeRepositories() {
    logger.info('Repositories 초기화...');

    this.repositories.storeRepository = new StoreRepository();
    this.repositories.menuRepository = new MenuRepository();
    this.repositories.deliveryZoneRepository = new DeliveryZoneRepository();
    
    // Order/Cart Repositories 초기화
    this.repositories.orderRepository = new OrderRepository({ 
      database: null, // 데이터베이스 연결은 별도 설정 필요
      orderMapper: null, // Mapper는 별도 설정 필요
    });
    this.repositories.cartRepository = new CartRepository({ 
      database: null, // 데이터베이스 연결은 별도 설정 필요
      cartMapper: null, // Mapper는 별도 설정 필요
    });

    // 실시간 통신을 위한 Mock Repositories (실제 구현으로 대체 필요)
    this.repositories.chatRepository = {
      findActiveRoom: async () => null,
      save: async (entity) => entity,
      saveMessage: async (message) => message,
      update: async (entity) => entity,
      getChatHistory: async () => [],
      markMessagesAsRead: async () => true,
    };

    this.repositories.messageRepository = {
      save: async (message) => message,
      findById: async (id) => null,
      getOfflineMessages: async () => [],
    };

    this.repositories.notificationRepository = {
      save: async (notification) => notification,
      markAsRead: async () => true,
      getUnreadNotifications: async () => [],
    };

    // Coupon Repositories 초기화 - 다른 에이전트가 아직 작업 중
    // this.repositories.couponRepository = new CouponRepository();
    // this.repositories.couponUsageRepository = new CouponUsageRepository();

    // Membership Repositories 초기화
    this.repositories.membershipTierRepository = new MembershipTierRepository({
      database: this.database,
    });

    this.repositories.membershipProgressRepository = new MembershipProgressRepository({
      database: this.database,
    });

    logger.info('Repositories 초기화 완료');
  }

  // Services 초기화
  async initializeServices() {
    logger.info('Services 초기화...');

    this.services.storeService = new StoreService(
      this.repositories.storeRepository,
      this.repositories.menuRepository,
      this.eventBus,
      logger,
    );

    this.services.menuService = new MenuService(
      this.repositories.menuRepository,
      this.repositories.storeRepository,
      this.eventBus,
      logger,
    );
    
    // Order/Cart Services 초기화
    this.services.orderService = new OrderService({
      orderRepository: this.repositories.orderRepository,
      orderCacheService: this.cacheService,
      eventPublisher: this.eventBus,
      logger,
    });

    this.services.orderCancellationService = new OrderCancellationService({
      orderRepository: this.repositories.orderRepository,
      paymentService: null, // PaymentService 추후 구현 필요
      notificationService: this.services.notificationService,
      eventPublisher: this.eventBus,
      logger,
    });

    this.services.cartService = new CartService({
      cartRepository: this.repositories.cartRepository,
      cartCacheService: this.cacheService,
      eventPublisher: this.eventBus,
      logger,
    });

    // Mock 서비스들 (실제 구현으로 대체 필요)
    this.services.userService = {
      getUserById: async (userId) => this.repositories.userRepository.findById(userId),
    };

    // 결제 보안 서비스 초기화
    this.services.paymentSecurityService = new PaymentSecurityService({
      redisClient: {
        get: async () => null,
        setex: async () => true,
        exists: async () => false,
        incrby: async () => 1,
        expire: async () => true,
        incr: async () => 1,
        lrange: async () => [],
        lpush: async () => true,
        ltrim: async () => true,
      },
      configService: {
        get: (key, defaultValue) => {
          const config = {
            'payment.ipWhitelist': [],
            'payment.secretKey': process.env.PAYMENT_SECRET_KEY || 'test_secret_key',
          };
          return config[key] || defaultValue;
        },
      },
    });

    // 결제 검증 서비스 초기화
    this.services.paymentValidationService = new PaymentValidationService({
      orderService: this.services.orderService,
      userService: this.services.userService,
      menuService: this.services.menuService,
      configService: {
        get: (key, defaultValue) => {
          const config = {
            'payment.minAmount': 10000,
            'payment.maxAmount': 50000000,
          };
          return config[key] || defaultValue;
        },
      },
    });

    this.services.paymentService = {
      getPaymentByOrderId: async (orderId) => this.repositories.paymentRepository.findByOrderId(orderId),
      getPaymentById: async (paymentId) => this.repositories.paymentRepository.findById(paymentId),
    };

    // UnifiedSocketServer는 app.js에서 초기화됨
    // app.get('socketServer')를 통해 접근 가능
    this.services.socketServer = null; // Runtime에 app.js에서 주입됨

    // SMS 알림 서비스 초기화
    this.services.smsNotificationService = new SMSNotificationService({
      logger,
      configService: {
        get: (key, defaultValue) => {
          const config = {
            'sms.primary_gateway': 'vietguys',
            'sms.vietguys.token': process.env.VIETGUYS_TOKEN || 'test_token',
            'sms.vietguys.brandname': process.env.VIETGUYS_BRANDNAME || 'DELIVERY',
            'sms.speedsms.token': process.env.SPEEDSMS_TOKEN || 'test_token',
            'sms.rate_limit': 5,
          };
          return config[key] || defaultValue;
        },
      },
      i18nService: {
        getSMSTemplate: async (templateId, language) => ({
          content: `테스트 SMS 메시지: ${templateId} (${language})`,
        }),
      },
      redisClient: {
        get: async () => null,
        setex: async () => true,
        lpush: async () => true,
        ltrim: async () => true,
      },
    });

    // 이메일 알림 서비스 초기화
    this.services.emailNotificationService = new EmailNotificationService({
      logger,
      configService: {
        get: (key, defaultValue) => {
          const config = {
            'email.smtp.host': process.env.SMTP_HOST || 'localhost',
            'email.smtp.port': process.env.SMTP_PORT || 587,
            'email.smtp.user': process.env.SMTP_USER || 'test@example.com',
            'email.smtp.password': process.env.SMTP_PASSWORD || 'password',
            'email.from.address': process.env.EMAIL_FROM || 'noreply@deliveryapp.vn',
            'email.from.name': 'Delivery App',
            'email.rate_limit': 10,
            'app.baseUrl': process.env.BASE_URL || 'http://localhost:3000',
          };
          return config[key] || defaultValue;
        },
      },
      i18nService: {
        getEmailTemplate: async (templateId, language) => ({
          subject: `테스트 이메일: ${templateId}`,
          content: `테스트 이메일 내용: ${templateId} (${language})`,
        }),
      },
      redisClient: {
        get: async () => null,
        setex: async () => true,
        lpush: async () => true,
        ltrim: async () => true,
        sadd: async () => true,
        sismember: async () => false,
      },
    });

    // 사용자 레포지토리 Mock (실제 구현으로 대체 필요)
    this.repositories.userRepository = {
      findById: async (userId) => ({
        id: userId,
        name: `사용자 ${userId}`,
        email: `user${userId}@example.com`,
        phone: '+84901234567',
      }),
      findByEmail: async (email) => {
        // 테스트용 사용자 데이터
        if (email === 'test@example.com') {
          return {
            id: 'test_user_1',
            email: { value: email },
            fullName: '테스트 점주',
            phoneNumber: { toStorageFormat: () => '+84901234567', mask: () => '+849***4567' },
            status: 'ACTIVE',
            setPasswordResetToken: (token, expiry) => {
              this.passwordResetToken = token;
              this.passwordResetTokenExpiry = expiry;
            },
            isPasswordResetTokenValid: (token) => {
              return this.passwordResetToken === token && this.passwordResetTokenExpiry > new Date();
            },
            changePassword: async (newPassword) => {
              this.hashedPassword = newPassword; // In real app, this would be hashed
            },
            clearPasswordResetToken: () => {
              this.passwordResetToken = null;
              this.passwordResetTokenExpiry = null;
            },
            invalidateAllSessions: () => {
              // Mock implementation
            },
          };
        }
        return null;
      },
      findByPhone: async (phone) => null,
      findByPasswordResetToken: async (token) => {
        // 테스트용 토큰 검증
        const user = await this.repositories.userRepository.findByEmail('test@example.com');
        if (user && user.passwordResetToken === token) {
          return user;
        }
        return null;
      },
      save: async (user) => user,
      mapShortToken: async (shortToken, token, userId) => {
        // Mock implementation for SMS short token mapping
        return true;
      },
    };

    // Payment Repository Mock (실제 구현으로 대체 필요)
    this.repositories.paymentRepository = {
      findByOrderId: async (orderId) => ({
        id: `payment_${orderId}`,
        orderId,
        paymentMethod: 'COD',
        status: 'PENDING',
        amount: 250000.00,
        currency: 'VND',
        initiatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      findById: async (paymentId) => ({
        id: paymentId,
        orderId: 'order_123',
        paymentMethod: 'COD', 
        status: 'PENDING',
        amount: 250000.00,
        currency: 'VND',
        initiatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    // 알림 서비스 초기화 (SMS/Email 서비스 포함)
    this.services.notificationService = new NotificationService({
      notificationRepository: this.repositories.notificationRepository,
      userRepository: this.repositories.userRepository,
      eventPublisher: this.eventBus,
      smsNotificationService: this.services.smsNotificationService,
      emailNotificationService: this.services.emailNotificationService,
      logger,
    });

    // 실시간 메시지 서비스 초기화
    this.services.realtimeMessageService = new RealtimeMessageService({
      socketServer: this.services.socketServer,
      messageRepository: this.repositories.messageRepository,
      eventPublisher: this.eventBus,
      logger,
    });

    // 채팅 서비스 초기화
    this.services.chatService = new ChatService({
      chatRepository: this.repositories.chatRepository,
      realtimeMessageService: this.services.realtimeMessageService,
      notificationService: this.services.notificationService,
      eventPublisher: this.eventBus,
      logger,
    });

    // 알림 소켓 핸들러 초기화
    this.services.notificationSocketHandler = new NotificationSocketHandler({
      notificationService: this.services.notificationService,
      realtimeMessageService: this.services.realtimeMessageService,
      socketServer: this.services.socketServer,
      authMiddleware: null, // 실제 구현으로 대체 필요
      eventPublisher: this.eventBus,
    });

    // POS 응답 처리 서비스 초기화 (OrderNotificationService 초기화 후)
    this.services.posResponseHandlingService = new POSResponseHandlingService({
      orderRepository: this.repositories.orderRepository,
      posService: null, // 실제 POS 서비스로 대체 필요
      orderStatusService: null, // OrderStatusService 구현 후 추가
      notificationService: this.services.notificationService,
      eventEmitter: this.eventBus,
      cacheService: this.cacheService,
    });

    // 주문 알림 서비스 초기화
    this.services.orderNotificationService = new OrderNotificationService({
      userRepository: this.repositories.userRepository,
      orderRepository: this.repositories.orderRepository,
      socketService: this.services.socketServer,
      pushNotificationService: null, // FCM 서비스 구현 후 추가
      smsService: this.services.smsNotificationService,
      emailService: this.services.emailNotificationService,
      i18nService: null, // I18N 서비스 구현 후 추가
    });

    // REST API 컨트롤러에서 필요한 Mock 서비스들 추가
    this.services.deliveryService = {
      getDriverProfile: async (driverId) => ({
        id: driverId,
        name: `Driver ${driverId}`,
        status: 'online',
        vehicle: { type: 'motorcycle', plateNumber: '29A-12345' },
        rating: 4.8,
        completedOrders: 150,
      }),
      updateDriverStatus: async (driverId, status, location) => ({
        id: driverId,
        status,
        location,
        updatedAt: new Date(),
      }),
      getAvailableOrders: async (driverId, options) => ([]),
      acceptOrder: async (data) => ({ id: data.orderId, status: 'ACCEPTED' }),
      declineOrder: async (data) => true,
      getActiveOrders: async (driverId) => ([]),
      completePickup: async (data) => ({ id: data.orderId, status: 'PICKED_UP' }),
      completeDelivery: async (data) => ({ id: data.orderId, status: 'DELIVERED' }),
      reportIssue: async (data) => ({ id: Date.now(), ...data }),
      getDailySummary: async (driverId, date) => ({
        date,
        ordersCompleted: 8,
        totalEarnings: 320000,
        totalDistance: 45.2,
        onlineTime: 480,
      }),
      getDriverEarnings: async (driverId, options) => ({
        totalEarnings: 2500000,
        period: options.period,
        breakdown: { base: 2000000, tips: 300000, bonus: 200000 },
      }),
      getDeliveryHistory: async (driverId, options) => ({
        orders: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }),
      getPerformanceStats: async (driverId, period) => ({
        period,
        rating: 4.8,
        completionRate: 98.5,
        averageDeliveryTime: 25,
      }),
      requestEmergencySupport: async (data) => ({ id: Date.now(), ...data }),
    };

    this.services.locationService = {
      updateDriverLocation: async (driverId, location) => true,
    };

    this.services.navigationService = {
      optimizeDeliveryRoute: async (data) => ({
        optimizedRoute: {
          totalDistance: 15.5,
          estimatedTime: 35,
          stops: data.orders.map(order => ({ orderId: order.orderId, estimatedArrival: '15:30' })),
        },
      }),
      getTrafficInfo: async (location) => ({
        location,
        trafficLevel: 'moderate',
        incidents: [],
        estimatedDelay: 5,
      }),
      getWeatherInfo: async (data) => ({
        location: data.city || 'ho_chi_minh',
        temperature: 28,
        humidity: 75,
        condition: 'partly_cloudy',
        visibility: 'good',
      }),
    };

    this.services.analyticsService = {
      getDashboardStats: async (options) => ({
        period: options.period,
        totalOrders: 1250,
        totalRevenue: 125000000,
        activeUsers: 580,
        activeDrivers: 45,
      }),
      getOrderAnalytics: async (options) => ({
        totalOrders: 1250,
        completedOrders: 1180,
        cancelledOrders: 70,
        avgOrderValue: 100000,
      }),
      getDeliveryAnalytics: async (options) => ({
        avgDeliveryTime: 28,
        successRate: 94.4,
        totalDeliveries: 1180,
      }),
      getPopularItemsAnalytics: async (options) => ([
        { itemId: '1', name: 'Phở Bò', orderCount: 350, revenue: 35000000 },
        { itemId: '2', name: 'Bánh mì', orderCount: 280, revenue: 8400000 },
      ]),
      getRegionalAnalytics: async (options) => ([
        { region: 'District 1', orders: 450, revenue: 45000000 },
        { region: 'District 3', orders: 380, revenue: 38000000 },
      ]),
      getPaymentMethodAnalytics: async (options) => ([
        { method: 'momo', usage: 45, revenue: 56250000 },
        { method: 'cod', usage: 35, revenue: 43750000 },
        { method: 'zalopay', usage: 20, revenue: 25000000 },
      ]),
      getPromotionAnalytics: async (options) => ({
        totalPromotions: 15,
        activePromotions: 8,
        redemptionRate: 67.5,
      }),
      getReviewAnalytics: async (options) => ({
        avgRating: 4.3,
        totalReviews: 890,
        ratingDistribution: { 5: 45, 4: 32, 3: 15, 2: 6, 1: 2 },
      }),
      getRealtimeStats: async (options) => ({
        activeOrders: 25,
        onlineDrivers: 18,
        activeUsers: 156,
        currentRevenue: 2850000,
      }),
      getABTestAnalytics: async (options) => ([]),
      getPredictiveAnalytics: async (options) => ({
        forecast: [
          { date: '2025-01-01', predicted: 1500, confidence: 0.85 },
          { date: '2025-01-02', predicted: 1650, confidence: 0.82 },
        ],
      }),
      generateReport: async (options) => ({
        reportId: Date.now(),
        type: options.reportType,
        status: 'generated',
        downloadUrl: '/reports/download/123',
      }),
      executeCustomQuery: async (options) => ({
        results: [],
        executionTime: 150,
      }),
      getVietnamMarketInsights: async (options) => ({
        aspect: options.aspect,
        insights: {
          topCuisines: ['Vietnamese', 'Asian', 'Fast Food'],
          peakHours: ['11:00-13:00', '18:00-21:00'],
          preferredPayment: 'momo',
        },
      }),
    };

    this.services.salesAnalyticsService = {
      getSalesAnalytics: async (options) => ({
        totalSales: 125000000,
        dailySales: [],
        growth: 15.2,
      }),
    };

    this.services.userAnalyticsService = {
      getUserAnalytics: async (options) => ({
        totalUsers: 15000,
        activeUsers: 2500,
        newUsers: 150,
        retentionRate: 68.5,
      }),
      getCohortAnalysis: async (options) => ({
        cohorts: [],
        retentionMatrix: [],
      }),
    };

    this.services.storeAnalyticsService = {
      getStoreAnalytics: async (options) => ([
        { storeId: '1', name: 'Store A', revenue: 25000000, orders: 450 },
        { storeId: '2', name: 'Store B', revenue: 18000000, orders: 320 },
      ]),
    };

    // 배달 존 서비스
    this.services.deliveryZoneService = {
      getByStore: async (storeId) => ([
        { id: '1', name: 'District 1', radius: 5, fee: 15000 },
        { id: '2', name: 'District 3', radius: 8, fee: 25000 },
      ]),
      updateStoreZones: async (storeId, zones) => zones,
    };

    // POS 메뉴 동기화 서비스
    this.services.posMenuSyncService = {
      syncMenuItem: async (storeId, menuItem) => true,
      removeMenuItem: async (storeId, itemId) => true,
      syncMenuAvailability: async (storeId, items) => true,
      checkPOSConnection: async (storeId) => ({
        connected: true,
        lastSync: new Date(),
        status: 'online',
      }),
    };

    // Coupon Services 초기화 - 다른 에이전트가 아직 작업 중
    // this.services.couponCacheService = new CouponCacheService({
    //   redisClient: this.cacheService,
    //   logger
    // });

    // this.services.couponDiscountCalculationService = new CouponDiscountCalculationService({
    //   logger
    // });

    // this.services.couponValidationService = new CouponValidationService(
    //   this.repositories.couponRepository,
    //   this.repositories.couponUsageRepository,
    //   logger
    // );

    // this.services.couponService = new CouponService({
    //   couponRepository: this.repositories.couponRepository,
    //   couponUsageRepository: this.repositories.couponUsageRepository,
    //   couponValidationService: this.services.couponValidationService,
    //   couponDiscountCalculationService: this.services.couponDiscountCalculationService,
    //   couponCacheService: this.services.couponCacheService,
    //   eventPublisher: this.eventBus,
    //   logger
    // });

    // Membership Services 초기화
    this.services.tierCacheService = new TierCacheService({
      redisClient: this.cacheService,
    });

    this.services.membershipTierService = new MembershipTierService({
      membershipTierRepository: this.repositories.membershipTierRepository,
      membershipProgressRepository: this.repositories.membershipProgressRepository,
      tierCacheService: this.services.tierCacheService,
      eventPublisher: this.eventBus,
    });

    this.services.tierDiscountCalculationService = new TierDiscountCalculationService({
      membershipTierService: this.services.membershipTierService,
      membershipProgressRepository: this.repositories.membershipProgressRepository,
      vietnamHolidayService: null, // 추후 구현
      weatherService: null, // 추후 구현
      eventPublisher: this.eventBus,
    });

    this.services.tierProgressService = new TierProgressService({
      membershipProgressRepository: this.repositories.membershipProgressRepository,
      membershipTierRepository: this.repositories.membershipTierRepository,
      membershipTierService: this.services.membershipTierService,
      eventPublisher: this.eventBus,
    });

    // Discount Aggregation Services 초기화
    this.services.discountCacheService = new DiscountCacheService({
      redisClient: this.cacheService,
      logger,
    });

    this.services.discountAggregationService = new DiscountAggregationService({
      couponService: this.services.couponService || null, // 쿠폰 서비스 구현 후 추가
      tierDiscountCalculationService: this.services.tierDiscountCalculationService,
      promotionEventService: this.services.promotionEventService || null, // 프로모션 서비스 구현 후 추가
      discountCacheService: this.services.discountCacheService,
      eventPublisher: this.eventBus,
      logger,
    });

    logger.info('Services 초기화 완료');
  }

  // Use Cases 초기화
  async initializeUseCases() {
    logger.info('Use Cases 초기화...');
    
    // Order Use Cases
    this.useCases.createOrderUseCase = new CreateOrderUseCase({
      orderRepository: this.repositories.orderRepository,
      cartRepository: this.repositories.cartRepository,
      menuRepository: this.repositories.menuRepository,
      storeRepository: this.repositories.storeRepository,
      eventPublisher: this.eventBus,
      logger,
    });
    
    // Cart Use Cases
    this.useCases.addToCartUseCase = new AddToCartUseCase({
      cartRepository: this.repositories.cartRepository,
      menuRepository: this.repositories.menuRepository,
      storeRepository: this.repositories.storeRepository,
      eventPublisher: this.eventBus,
      logger,
    });

    this.useCases.updateCartUseCase = new UpdateCartUseCase({
      cartRepository: this.repositories.cartRepository,
      eventPublisher: this.eventBus,
      logger,
    });

    this.useCases.removeFromCartUseCase = new RemoveFromCartUseCase({
      cartRepository: this.repositories.cartRepository,
      eventPublisher: this.eventBus,
      logger,
    });

    this.useCases.clearCartUseCase = new ClearCartUseCase({
      cartRepository: this.repositories.cartRepository,
      eventPublisher: this.eventBus,
      logger,
    });

    // 검색 Use Cases
    this.useCases.searchStoreUseCase = new SearchStoreUseCase({
      storeRepository: this.repositories.storeRepository,
      locationService: this.services.locationService,
      elasticsearchService: this.elasticsearchService,
      redisService: this.redisService,
      logger,
    });

    this.useCases.searchMenuUseCase = new SearchMenuUseCase({
      menuRepository: this.repositories.menuRepository,
      storeRepository: this.repositories.storeRepository,
      elasticsearchService: this.elasticsearchService,
      logger,
    });

    this.useCases.unifiedSearchUseCase = new UnifiedSearchUseCase({
      storeRepository: this.repositories.storeRepository,
      menuRepository: this.repositories.menuRepository,
      locationService: this.services.locationService,
      elasticsearchService: this.elasticsearchService,
      logger,
    });

    // 비밀번호 재설정 Use Case 초기화
    this.useCases.resetPasswordUseCase = new ResetPasswordUseCase({
      userRepository: this.repositories.userRepository,
      emailService: this.services.emailNotificationService,
      smsService: this.services.smsNotificationService,
      domainEventPublisher: this.eventBus,
      logger,
    });
    
    logger.info('Use Cases 초기화 완료');
  }

  // 통합 get 메서드 - resolver에서 container.get('ServiceName') 형태로 사용
  get(name) {
    if (!this.initialized) {
      throw new Error('컨테이너가 초기화되지 않았습니다.');
    }

    // Services 먼저 체크
    if (this.services[name] || this.services[name.charAt(0).toLowerCase() + name.slice(1)]) {
      return this.services[name] || this.services[name.charAt(0).toLowerCase() + name.slice(1)];
    }

    // Use Cases 체크
    if (this.useCases[name] || this.useCases[name.charAt(0).toLowerCase() + name.slice(1)]) {
      return this.useCases[name] || this.useCases[name.charAt(0).toLowerCase() + name.slice(1)];
    }

    // Repositories 체크
    if (this.repositories[name] || this.repositories[name.charAt(0).toLowerCase() + name.slice(1)]) {
      return this.repositories[name] || this.repositories[name.charAt(0).toLowerCase() + name.slice(1)];
    }

    throw new Error(`서비스 '${name}'를 찾을 수 없습니다.`);
  }

  // GraphQL Context 생성
  createGraphQLContext(baseContext) {
    if (!this.initialized) {
      throw new Error('컨테이너가 초기화되지 않았습니다. initialize()를 먼저 호출하세요.');
    }

    return {
      ...baseContext,
      container: this,
      services: this.services,
      repositories: this.repositories,
      useCases: this.useCases,
      eventBus: this.eventBus,
      cacheService: this.cacheService,
      elasticsearchService: this.elasticsearchService,
      logger,
    };
  }

  // 서비스 가져오기
  getService(serviceName) {
    if (!this.initialized) {
      throw new Error('컨테이너가 초기화되지 않았습니다.');
    }
    return this.services[serviceName];
  }

  // Repository 가져오기
  getRepository(repositoryName) {
    if (!this.initialized) {
      throw new Error('컨테이너가 초기화되지 않았습니다.');
    }
    return this.repositories[repositoryName];
  }

  // Use Case 가져오기
  getUseCase(useCaseName) {
    if (!this.initialized) {
      throw new Error('컨테이너가 초기화되지 않았습니다.');
    }
    return this.useCases[useCaseName];
  }
}

// 싱글톤 인스턴스 생성
const container = new DIContainer();

export { container };
export default container;