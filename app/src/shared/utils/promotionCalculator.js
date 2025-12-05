/**
 * 프로모션 할인 계산 유틸리티
 *
 * @features
 * - 프로모션 타입별 할인 계산
 * - 적용 조건 검증
 * - 최대 할인 금액 제한
 */

/**
 * 프로모션 적용 가능 여부 검증
 *
 * @param {Object} promotion - 프로모션 객체
 * @param {number} orderAmount - 주문 금액 (VND 정수)
 * @returns {Object} { canApply: boolean, reason: string }
 */
export const canApplyPromotion = (promotion, orderAmount) => {
  if (!promotion) {
    return { canApply: false, reason: 'PROMOTION_NOT_FOUND' };
  }

  // 1. 활성 상태 체크
  if (!promotion.isActive || promotion.status !== 'ACTIVE') {
    return { canApply: false, reason: 'PROMOTION_INACTIVE' };
  }

  // 2. 날짜 체크
  const now = new Date();
  const startDate = promotion.startDate ? new Date(promotion.startDate) : null;
  const endDate = promotion.endDate ? new Date(promotion.endDate) : null;

  if (startDate && now < startDate) {
    return { canApply: false, reason: 'PROMOTION_NOT_STARTED' };
  }

  if (endDate && now > endDate) {
    return { canApply: false, reason: 'PROMOTION_EXPIRED' };
  }

  // 3. 최소 주문 금액 체크
  if (promotion.minOrderAmount > 0 && orderAmount < promotion.minOrderAmount) {
    return {
      canApply: false,
      reason: 'MIN_ORDER_AMOUNT_NOT_MET',
      minAmount: promotion.minOrderAmount
    };
  }

  // 4. 최대 주문 금액 체크
  if (promotion.maxOrderAmount > 0 && orderAmount > promotion.maxOrderAmount) {
    return {
      canApply: false,
      reason: 'MAX_ORDER_AMOUNT_EXCEEDED',
      maxAmount: promotion.maxOrderAmount
    };
  }

  // 5. 사용 제한 체크 (서버에서 검증하지만 클라이언트에서도 표시)
  if (promotion.usageLimit > 0 && promotion.usageCount >= promotion.usageLimit) {
    return { canApply: false, reason: 'USAGE_LIMIT_REACHED' };
  }

  return { canApply: true };
};

/**
 * 프로모션 할인 금액 계산
 *
 * @param {Object} promotion - 프로모션 객체
 * @param {number} subtotal - 소계 (VND 정수, 배달비 제외)
 * @param {number} deliveryFee - 배달비 (VND 정수)
 * @returns {Object} { discountAmount: number, finalTotal: number, type: string }
 */
export const calculatePromotionDiscount = (promotion, subtotal, deliveryFee = 0) => {
  if (!promotion) {
    return {
      discountAmount: 0,
      finalTotal: subtotal + deliveryFee,
      type: null
    };
  }

  const orderAmount = subtotal + deliveryFee;

  // 적용 가능 여부 체크
  // 1. 서버에서 이미 검증된 isApplicable 또는 모달에서 설정한 canApply 우선 사용
  // 2. 둘 다 없는 경우에만 클라이언트 검증 수행
  let isPromotionApplicable;

  if (promotion.isApplicable !== undefined) {
    isPromotionApplicable = promotion.isApplicable;
  } else if (promotion.canApply !== undefined) {
    isPromotionApplicable = promotion.canApply;
  } else {
    // 서버 검증 데이터가 없는 경우 클라이언트에서 검증
    const validation = canApplyPromotion(promotion, orderAmount);
    isPromotionApplicable = validation.canApply;
  }

  if (!isPromotionApplicable) {
    return {
      discountAmount: 0,
      finalTotal: orderAmount,
      type: null,
      canApply: false
    };
  }

  let discountAmount = 0;
  let discountType = null;

  // 1. 퍼센트 할인
  if (promotion.discountPercentage > 0) {
    discountAmount = Math.floor((subtotal * promotion.discountPercentage) / 10000);
    discountType = 'PERCENTAGE';
  }
  // 2. 고정 금액 할인
  else if (promotion.discountAmount > 0) {
    discountAmount = promotion.discountAmount;
    discountType = 'FIXED_AMOUNT';
  }
  // 3. 무료 배달
  else if (promotion.promotionType === 'FREE_DELIVERY') {
    discountAmount = deliveryFee;
    discountType = 'FREE_DELIVERY';
  }

  // 최대 할인 금액 제한
  if (promotion.maxDiscountAmount > 0 && discountAmount > promotion.maxDiscountAmount) {
    discountAmount = promotion.maxDiscountAmount;
  }

  // 할인 금액이 주문 금액을 초과할 수 없음
  if (discountAmount > orderAmount) {
    discountAmount = orderAmount;
  }

  const finalTotal = Math.max(0, orderAmount - discountAmount);

  return {
    discountAmount,
    finalTotal,
    type: discountType,
    canApply: true,
    promotionId: promotion.id,
    promotionName: promotion.displayTitle || promotion.name
  };
};

/**
 * 여러 프로모션 중 최대 할인 선택
 *
 * @param {Array} promotions - 프로모션 배열
 * @param {number} subtotal - 소계
 * @param {number} deliveryFee - 배달비
 * @returns {Object} 최대 할인을 제공하는 프로모션 계산 결과
 */
export const getBestPromotion = (promotions, subtotal, deliveryFee = 0) => {
  if (!promotions || promotions.length === 0) {
    return {
      discountAmount: 0,
      finalTotal: subtotal + deliveryFee,
      type: null
    };
  }

  let bestResult = {
    discountAmount: 0,
    finalTotal: subtotal + deliveryFee,
    type: null,
    promotion: null
  };

  promotions.forEach((promotion) => {
    const result = calculatePromotionDiscount(promotion, subtotal, deliveryFee);

    if (result.canApply && result.discountAmount > bestResult.discountAmount) {
      bestResult = {
        ...result,
        promotion
      };
    }
  });

  return bestResult;
};

/**
 * 프로모션 할인 금액 포맷팅
 *
 * @param {number} amount - 금액 (VND 정수)
 * @returns {string} 포맷된 문자열
 */
export const formatDiscountAmount = (amount) => {
  if (amount == null || amount === 0) return '0₫';
  return `-${amount.toLocaleString()}₫`;
};

/**
 * 프로모션 에러 메시지 반환
 *
 * @param {string} reason - 에러 코드
 * @param {Object} data - 추가 데이터
 * @returns {string} 사용자 친화적 메시지
 */
export const getPromotionErrorMessage = (reason, data = {}) => {
  const messages = {
    PROMOTION_NOT_FOUND: '프로모션을 찾을 수 없습니다',
    PROMOTION_INACTIVE: '이 프로모션은 현재 사용할 수 없습니다',
    PROMOTION_NOT_STARTED: '이 프로모션은 아직 시작되지 않았습니다',
    PROMOTION_EXPIRED: '이 프로모션이 만료되었습니다',
    MIN_ORDER_AMOUNT_NOT_MET: data.minAmount
      ? `최소 주문 금액 ${data.minAmount.toLocaleString()}₫ 이상이어야 합니다`
      : '최소 주문 금액을 충족하지 못했습니다',
    MAX_ORDER_AMOUNT_EXCEEDED: data.maxAmount
      ? `최대 주문 금액 ${data.maxAmount.toLocaleString()}₫을 초과했습니다`
      : '최대 주문 금액을 초과했습니다',
    USAGE_LIMIT_REACHED: '이 프로모션의 사용 가능 횟수가 초과되었습니다',
  };

  return messages[reason] || '프로모션을 적용할 수 없습니다';
};
