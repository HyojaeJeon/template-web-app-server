/**
 * @file ENUM 마스터 정의 파일 (Single Source of Truth)
 * @description 모든 ENUM을 중앙에서 정의하고 Sequelize/GraphQL에 자동 동기화
 * @date 2025-09-21
 * @version 1.0.0
 */

/**
 * ENUM 정의 구조:
 * - values: ENUM 값 배열
 * - description: ENUM 설명 (다국어)
 * - domain: 도메인 분류
 * - sequelizeModels: 사용하는 Sequelize 모델 목록
 * - graphqlTypes: 사용하는 GraphQL 타입 목록
 */

export const ENUM_DEFINITIONS = {
  // ===== 인증 & 사용자 관리 =====
  CustomerStatusEnum: {
    values: ['ACTIVE', 'INACTIVE', 'BLOCKED', 'SUSPENDED', 'PENDING_DELETION'],
    description: {
      vi: 'Trạng thái khách hàng',
      en: 'Customer status',
      ko: '고객 상태'
    },
    domain: 'auth',
    sequelizeModels: ['User'],
    graphqlTypes: ['User'],
    defaultValue: 'ACTIVE'
  },

  StoreAccountStatusEnum: {
    values: ['PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED'],
    description: {
      vi: 'Trạng thái tài khoản cửa hàng',
      en: 'Store account status',
      ko: '매장 계정 상태'
    },
    domain: 'auth',
    sequelizeModels: ['StoreAccount'],
    graphqlTypes: ['StoreAccount'],
    defaultValue: 'PENDING'
  },

  StoreAccountRoleEnum: {
    values: ['STORE_OWNER', 'FRANCHISE_OWNER', 'STORE_MANAGER', 'CHEF', 'CASHIER', 'DELIVERY_MANAGER'],
    description: {
      vi: 'Vai trò tài khoản cửa hàng',
      en: 'Store account role',
      ko: '매장 계정 역할'
    },
    domain: 'auth',
    sequelizeModels: ['StoreAccount'],
    graphqlTypes: ['StoreAccount'],
    defaultValue: 'CASHIER'
  },

  LanguageCodeEnum: {
    values: ['VI', 'EN', 'KO', 'ZH', 'JA'],
    description: {
      vi: 'Mã ngôn ngữ',
      en: 'Language code',
      ko: '언어 코드'
    },
    domain: 'core',
    sequelizeModels: ['User', 'StoreAccount'],
    graphqlTypes: ['User', 'StoreAccount'],
    defaultValue: 'VI'
  },

  SocialProvider: {
    values: ['FACEBOOK', 'GOOGLE', 'ZALO'],
    description: {
      vi: 'Nhà cung cấp đăng nhập xã hội',
      en: 'Social login provider',
      ko: '소셜 로그인 제공자'
    },
    domain: 'auth',
    sequelizeModels: ['User'],
    graphqlTypes: ['SocialLoginInput'],
    defaultValue: null
  },

  // ===== 주문 관리 =====
  OrderStatusEnum: {
    values: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
    description: {
      vi: 'Trạng thái đơn hàng',
      en: 'Order status',
      ko: '주문 상태'
    },
    domain: 'order',
    sequelizeModels: ['Order'],
    graphqlTypes: ['Order'],
    defaultValue: 'PENDING'
  },

  PaymentMethodEnum: {
    values: [
      'CASH',
      'COD',
      'CARD',
      'MOMO',
      'ZALOPAY',
      'VNPAY',
      'SHOPEEPAY',
      'GRAB_PAY',
      'VIETTEL_MONEY',
      'NAPAS_QR',
      'INFOCMS_SHINHAN',
      'INFOCMS_BIDV',
      'MBBANK',
      'BANK_TRANSFER',
      'POINTS',
      'WALLET'
    ],
    description: {
      vi: 'Phương thức thanh toán',
      en: 'Payment method',
      ko: '결제 방법'
    },
    domain: 'payment',
    sequelizeModels: ['Payment', 'Order'],
    graphqlTypes: ['Payment', 'Order'],
    defaultValue: 'COD'
  },

  PaymentStatusEnum: {
    values: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'],
    description: {
      vi: 'Trạng thái thanh toán',
      en: 'Payment status',
      ko: '결제 상태'
    },
    domain: 'payment',
    sequelizeModels: ['Payment'],
    graphqlTypes: ['Payment'],
    defaultValue: 'PENDING'
  },

  // ===== 프로모션 관리 =====
  PromotionTypeEnum: {
    values: ['PERCENTAGE_DISCOUNT', 'FIXED_AMOUNT_DISCOUNT', 'FREE_DELIVERY', 'CASHBACK', 'BUNDLE_OFFER', 'BUY_ONE_GET_ONE', 'LOYALTY_POINTS', 'FIRST_ORDER_DISCOUNT'],
    description: {
      vi: 'Loại khuyến mãi',
      en: 'Promotion type',
      ko: '프로모션 유형'
    },
    domain: 'promotion',
    sequelizeModels: ['Promotion'],
    graphqlTypes: ['Promotion'],
    defaultValue: 'PERCENTAGE_DISCOUNT'
  },

  PromotionStatusEnum: {
    values: ['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELLED'],
    description: {
      vi: 'Trạng thái khuyến mãi',
      en: 'Promotion status',
      ko: '프로모션 상태'
    },
    domain: 'promotion',
    sequelizeModels: ['Promotion'],
    graphqlTypes: ['Promotion'],
    defaultValue: 'DRAFT'
  },

  // ===== 배달 관리 =====
  DeliveryStatusEnum: {
    values: ['PENDING', 'ASSIGNED', 'PICKUP', 'DELIVERING', 'DELIVERED', 'CANCELLED'],
    description: {
      vi: 'Trạng thái giao hàng',
      en: 'Delivery status',
      ko: '배달 상태'
    },
    domain: 'delivery',
    sequelizeModels: ['Delivery'],
    graphqlTypes: ['Delivery'],
    defaultValue: 'PENDING'
  },

  DriverStatusEnum: {
    values: ['AVAILABLE', 'BUSY', 'ON_BREAK', 'OFFLINE'],
    description: {
      vi: 'Trạng thái tài xế',
      en: 'Driver status',
      ko: '기사 상태'
    },
    domain: 'delivery',
    sequelizeModels: ['DeliveryDriver'],
    graphqlTypes: ['DeliveryDriver'],
    defaultValue: 'OFFLINE'
  },

  DeliveryVehicleTypeEnum: {
    values: ['MOTORCYCLE', 'BICYCLE', 'CAR', 'WALKING'],
    description: {
      vi: 'Loại phương tiện giao hàng',
      en: 'Delivery vehicle type',
      ko: '배달 차량 타입'
    },
    domain: 'delivery',
    sequelizeModels: ['DeliveryDriver'],
    graphqlTypes: ['DeliveryDriver'],
    defaultValue: 'MOTORCYCLE'
  },

  // ===== 리뷰 관리 =====
  ReviewStatusEnum: {
    values: ['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN', 'DELETED'],
    description: {
      vi: 'Trạng thái đánh giá',
      en: 'Review status',
      ko: '리뷰 상태'
    },
    domain: 'review',
    sequelizeModels: ['Review'],
    graphqlTypes: ['Review'],
    defaultValue: 'PENDING'
  },

  ReviewReplyTemplateCategoryEnum: {
    values: ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'COMPLAINT', 'GENERAL'],
    description: {
      vi: 'Danh mục mẫu trả lời đánh giá',
      en: 'Review reply template category',
      ko: '리뷰 답글 템플릿 카테고리'
    },
    domain: 'review',
    sequelizeModels: ['ReviewReplyTemplate'],
    graphqlTypes: ['ReviewReplyTemplate'],
    defaultValue: 'GENERAL'
  },

  // ===== 매장 관리 =====
  StoreStatusEnum: {
    values: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CLOSED'],
    description: {
      vi: 'Trạng thái cửa hàng',
      en: 'Store status',
      ko: '매장 상태'
    },
    domain: 'store',
    sequelizeModels: ['Store'],
    graphqlTypes: ['Store'],
    defaultValue: 'INACTIVE'
  },

  // ===== 알림 관리 =====
  NotificationTypeEnum: {
    values: ['ORDER_UPDATE', 'PROMOTION', 'SYSTEM', 'PAYMENT', 'DELIVERY', 'REVIEW', 'STORE_UPDATE'],
    description: {
      vi: 'Loại thông báo',
      en: 'Notification type',
      ko: '알림 타입'
    },
    domain: 'notification',
    sequelizeModels: ['Notification'],
    graphqlTypes: ['Notification'],
    defaultValue: 'SYSTEM'
  },

  NotificationPlatformEnum: {
    values: ['FCM', 'EMAIL', 'SMS', 'IN_APP', 'ZALO'],
    description: {
      vi: 'Nền tảng thông báo',
      en: 'Notification platform',
      ko: '알림 플랫폼'
    },
    domain: 'notification',
    sequelizeModels: ['NotificationLog'],
    graphqlTypes: ['NotificationLog'],
    defaultValue: 'FCM'
  }
};

/**
 * ENUM 값 유효성 검사 함수
 */
export function validateEnumValue(enumName, value) {
  const enumDef = ENUM_DEFINITIONS[enumName];
  if (!enumDef) {
    throw new Error(`Unknown ENUM: ${enumName}`);
  }

  if (!enumDef.values.includes(value)) {
    throw new Error(`Invalid value "${value}" for ENUM ${enumName}. Valid values: ${enumDef.values.join(', ')}`);
  }

  return true;
}

/**
 * ENUM 기본값 가져오기
 */
export function getEnumDefaultValue(enumName) {
  const enumDef = ENUM_DEFINITIONS[enumName];
  return enumDef?.defaultValue || enumDef?.values[0] || null;
}

/**
 * 도메인별 ENUM 목록 가져오기
 */
export function getEnumsByDomain(domain) {
  return Object.entries(ENUM_DEFINITIONS)
    .filter(([_, def]) => def.domain === domain)
    .reduce((acc, [name, def]) => {
      acc[name] = def;
      return acc;
    }, {});
}

/**
 * ENUM 사용 현황 분석
 */
export function getEnumUsageAnalysis() {
  const analysis = {
    totalEnums: Object.keys(ENUM_DEFINITIONS).length,
    byDomain: {},
    byModel: {},
    byGraphQLType: {}
  };

  Object.entries(ENUM_DEFINITIONS).forEach(([enumName, def]) => {
    // 도메인별 집계
    if (!analysis.byDomain[def.domain]) {
      analysis.byDomain[def.domain] = [];
    }
    analysis.byDomain[def.domain].push(enumName);

    // Sequelize 모델별 집계
    def.sequelizeModels?.forEach(model => {
      if (!analysis.byModel[model]) {
        analysis.byModel[model] = [];
      }
      analysis.byModel[model].push(enumName);
    });

    // GraphQL 타입별 집계
    def.graphqlTypes?.forEach(type => {
      if (!analysis.byGraphQLType[type]) {
        analysis.byGraphQLType[type] = [];
      }
      analysis.byGraphQLType[type].push(enumName);
    });
  });

  return analysis;
}

export default ENUM_DEFINITIONS;
