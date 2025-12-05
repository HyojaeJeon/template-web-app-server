/**
 * 화폐/결제 처리 통합 유틸리티
 * Local 동(VND) 중심 설계
 * 
 * @description  Local 동(VND) 포맷팅, 환율 변환, 수수료 계산
 * @currency     VND (Vietnamese Dong) 기본
 * @includes     포맷팅, 환율, 수수료, 가격 검증
 */

// ================================
// 상수 정의
// ================================
const VND_SYMBOL = '₫';                               // Local 동 기호
const DEFAULT_LOCALE = 'vi-VN';                       // Local 로케일
const SUPPORTED_CURRENCIES = ['VND', 'USD', 'KRW'];   // 지원 화폐

// Local 동 단위 (최소 단위: 100 VND)
const VND_MIN_UNIT = 100;                             // 최소 100동
const VND_COIN_DENOMINATIONS = [200, 500, 1000, 2000, 5000]; // 동전
const VND_BILL_DENOMINATIONS = [10000, 20000, 50000, 100000, 200000, 500000]; // 지폐

// ================================
// VND 포맷팅 함수
// ================================

/**
 * VND 금액을 Local 형식으로 포맷팅
 * @param {number} amount                             - 금액 (VND)
 * @param {Object} options                            - 포맷팅 옵션
 * @returns {string}                                  포맷된 VND 문자열
 */
export const formatVND = (amount, options = {}) => {
  const {
    showSymbol = true,                                // 기호 표시 여부
    showDecimals = false,                             // 소수점 표시 여부
    compact = false,                                  // 축약 형식 (예: 50K)
  } = options;

  if (!amount || isNaN(amount)) {
    return showSymbol ? `0 ${VND_SYMBOL}` : '0';
  }

  const numAmount = Math.abs(Number(amount));
  const isNegative = Number(amount) < 0;

  // 축약 형식 처리
  if (compact) {
    return formatCompactVND(numAmount, isNegative, showSymbol);
  }

  // 표준 형식 처리
  const formattedNumber = new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'decimal',
    minimumFractionDigits: showDecimals ? 0 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(numAmount);

  const sign = isNegative ? '-' : '';
  const symbol = showSymbol ? ` ${VND_SYMBOL}` : '';
  
  return `${sign}${formattedNumber}${symbol}`;
};

/**
 * VND 축약 형식 포맷팅 (K, M 단위)
 * @param {number} amount                             - 금액
 * @param {boolean} isNegative                        - 음수 여부
 * @param {boolean} showSymbol                        - 기호 표시 여부
 * @returns {string}                                  축약된 VND 문자열
 */
const formatCompactVND = (amount, isNegative, showSymbol) => {
  const sign = isNegative ? '-' : '';
  const symbol = showSymbol ? ` ${VND_SYMBOL}` : '';

  if (amount >= 1000000000) {                         // 10억 이상: B
    return `${sign}${(amount / 1000000000).toFixed(1)}B${symbol}`;
  } else if (amount >= 1000000) {                     // 100만 이상: M
    return `${sign}${(amount / 1000000).toFixed(1)}M${symbol}`;
  } else if (amount >= 1000) {                        // 1천 이상: K
    return `${sign}${(amount / 1000).toFixed(1)}K${symbol}`;
  } else {
    return `${sign}${amount}${symbol}`;
  }
};

/**
 * 문자열에서 VND 금액 파싱
 * @param {string} vndString                          - VND 문자열
 * @returns {number}                                  파싱된 금액
 */
export const parseVND = (vndString) => {
  if (!vndString || typeof vndString !== 'string') {
    return 0;
  }

  // 숫자가 아닌 문자 제거 (음수 부호 제외)
  const cleanString = vndString.replace(/[^\d.-]/g, '');
  const amount = parseFloat(cleanString);
  
  return isNaN(amount) ? 0 : amount;
};

// ================================
// 환율 변환 함수
// ================================

/**
 * 환율 기반 화폐 변환
 * @param {number} amount                             - 변환할 금액
 * @param {string} fromCurrency                       - 원본 화폐
 * @param {string} toCurrency                         - 대상 화폐
 * @param {number} exchangeRate                       - 환율
 * @returns {number}                                  변환된 금액
 */
export const convertCurrency = (amount, fromCurrency, toCurrency, exchangeRate) => {
  if (!amount || !exchangeRate || !SUPPORTED_CURRENCIES.includes(fromCurrency) || !SUPPORTED_CURRENCIES.includes(toCurrency)) {
    return 0;
  }

  if (fromCurrency === toCurrency) {
    return amount;
  }

  return Math.round(amount * exchangeRate);
};

/**
 * USD를 VND로 변환 (대략적 환율)
 * @param {number} usdAmount                          - USD 금액
 * @param {number} rate                               - 환율 (기본: 24000)
 * @returns {number}                                  VND 금액
 */
export const usdToVnd = (usdAmount, rate = 24000) => {
  return Math.round(usdAmount * rate);
};

/**
 * KRW를 VND로 변환 (대략적 환율)
 * @param {number} krwAmount                          - KRW 금액
 * @param {number} rate                               - 환율 (기본: 18)
 * @returns {number}                                  VND 금액
 */
export const krwToVnd = (krwAmount, rate = 18) => {
  return Math.round(krwAmount * rate);
};

// ================================
// 가격 계산 및 검증
// ================================

/**
 * 배달비 계산 (거리 기반)
 * @param {number} distance                           - 거리 (km)
 * @param {Object} feeStructure                       - 배달비 구조
 * @returns {number}                                  배달비 (VND)
 */
export const calculateDeliveryFee = (distance, feeStructure = {}) => {
  const {
    baseFee = 15000,                                  // 기본 배달비
    perKmFee = 5000,                                  // km당 추가 요금
    maxFee = 50000,                                   // 최대 배달비
    freeDeliveryThreshold = 100000,                   // 무료 배달 최소 주문액
  } = feeStructure;

  if (distance <= 0) return baseFee;

  const calculatedFee = baseFee + (Math.ceil(distance) * perKmFee);
  return Math.min(calculatedFee, maxFee);
};

/**
 * 할인 금액 계산
 * @param {number} originalPrice                      - 원본 가격
 * @param {Object} discountInfo                       - 할인 정보
 * @returns {Object}                                  할인 계산 결과
 */
export const calculateDiscount = (originalPrice, discountInfo) => {
  const { type, value, maxDiscount = 0 } = discountInfo;
  
  let discountAmount = 0;
  
  switch (type) {
    case 'PERCENTAGE':
      discountAmount = Math.round(originalPrice * (value / 100));
      if (maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, maxDiscount);
      }
      break;
      
    case 'FIXED':
      discountAmount = Math.min(value, originalPrice);
      break;
      
    default:
      discountAmount = 0;
  }

  return {
    originalPrice,
    discountAmount,
    finalPrice: originalPrice - discountAmount,
    discountPercentage: originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0,
  };
};

/**
 * VND 금액 유효성 검증
 * @param {number} amount                             - 검증할 금액
 * @param {Object} constraints                        - 제약 조건
 * @returns {Object}                                  검증 결과
 */
export const validateVNDAmount = (amount, constraints = {}) => {
  const {
    min = 0,                                          // 최소 금액
    max = 10000000,                                   // 최대 금액 (기본: 1천만 동)
    allowZero = true,                                 // 0원 허용 여부
    requireInteger = true,                            // 정수 필수 여부
  } = constraints;

  const errors = [];
  
  // 숫자 여부 확인
  if (isNaN(amount) || !isFinite(amount)) {
    errors.push('INVALID_NUMBER');
  }
  
  // 음수 확인
  if (amount < 0) {
    errors.push('NEGATIVE_AMOUNT');
  }
  
  // 0원 확인
  if (amount === 0 && !allowZero) {
    errors.push('ZERO_NOT_ALLOWED');
  }
  
  // 범위 확인
  if (amount < min) {
    errors.push('BELOW_MINIMUM');
  }
  
  if (amount > max) {
    errors.push('ABOVE_MAXIMUM');
  }
  
  // 정수 확인
  if (requireInteger && !Number.isInteger(amount)) {
    errors.push('NOT_INTEGER');
  }
  
  // VND 최소 단위 확인
  if (amount % VND_MIN_UNIT !== 0) {
    errors.push('INVALID_VND_UNIT');
  }

  return {
    isValid: errors.length === 0,
    errors,
    amount,
    rounded: Math.round(amount / VND_MIN_UNIT) * VND_MIN_UNIT,
  };
};

// ================================
// 결제 관련 함수
// ================================

/**
 * Local 현금 거스름돈 계산
 * @param {number} totalAmount                        - 총 금액
 * @param {number} paidAmount                         - 지불 금액
 * @returns {Object}                                  거스름돈 정보
 */
export const calculateChange = (totalAmount, paidAmount) => {
  const change = paidAmount - totalAmount;
  
  if (change < 0) {
    return {
      isValid: false,
      change: 0,
      shortage: Math.abs(change),
      denominations: {},
    };
  }

  // 거스름돈을 화폐 단위로 분해
  const denominations = {};
  let remainingChange = change;
  
  // 큰 단위부터 계산
  const allDenominations = [...VND_BILL_DENOMINATIONS, ...VND_COIN_DENOMINATIONS].sort((a, b) => b - a);
  
  for (const denomination of allDenominations) {
    if (remainingChange >= denomination) {
      const count = Math.floor(remainingChange / denomination);
      denominations[denomination] = count;
      remainingChange -= count * denomination;
    }
  }

  return {
    isValid: true,
    change,
    shortage: 0,
    denominations,
    remainingChange,                                  // 최소 단위로 나누어떨어지지 않는 금액
  };
};

// ================================
// 기본 export
// ================================
export default {
  // 포맷팅
  formatVND,
  parseVND,
  
  // 환율 변환
  convertCurrency,
  usdToVnd,
  krwToVnd,
  
  // 가격 계산
  calculateDeliveryFee,
  calculateDiscount,
  validateVNDAmount,
  calculateChange,
  
  // 상수
  VND_SYMBOL,
  VND_MIN_UNIT,
  SUPPORTED_CURRENCIES,
};