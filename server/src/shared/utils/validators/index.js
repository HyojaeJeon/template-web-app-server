/**
 * 통합 검증 유틸리티
 * 입력 데이터 검증, 포맷 검증, 비즈니스 규칙 검증
 */

import Joi from 'joi';
import { SecurityValidator } from './SecurityValidator.js';

// 통합 보안 검증자 export
export { SecurityValidator };
export const Validators = SecurityValidator; // 하위 호환성을 위한 alias

/**
 * 이메일 검증
 */
export const emailValidator = {
  isValid(email) {                                                  // 이메일 형식 검증
    const schema = Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'vn'] } })
      .required();
    
    const { error } = schema.validate(email);
    return !error;
  },
  
  normalize(email) {                                                // 이메일 정규화
    return email?.toLowerCase().trim();
  },
  
  schema: Joi.string()                                              // Joi 스키마
    .email({ minDomainSegments: 2 })
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Email không hợp lệ',
      'string.empty': 'Email là bắt buộc'
    })
};

/**
 * Local 전화번호 검증
 */
export const phoneValidator = {
  isValid(phone) {                                                  // Local 번호 형식
    const vietnamPhoneRegex = /^(\+84|84|0)(3|5|7|8|9)([0-9]{8})$/;
    const cleaned = phone?.replace(/[\s\-\(\)]/g, '');
    return vietnamPhoneRegex.test(cleaned);
  },
  
  format(phone) {                                                   // 표준 형식 변환
    const cleaned = phone?.replace(/[\s\-\(\)]/g, '');
    if (cleaned?.startsWith('84')) {
      return '+' + cleaned;
    }
    if (cleaned?.startsWith('0')) {
      return '+84' + cleaned.substring(1);
    }
    return cleaned;
  },
  
  getCarrier(phone) {                                               // 통신사 식별
    const cleaned = phone?.replace(/[\s\-\(\)]/g, '');
    const prefix = cleaned.substring(0, 3);
    
    const carriers = {
      '032': 'Viettel', '033': 'Viettel', '034': 'Viettel',
      '035': 'Viettel', '036': 'Viettel', '037': 'Viettel',
      '038': 'Viettel', '039': 'Viettel',
      '070': 'MobiFone', '076': 'MobiFone', '077': 'MobiFone',
      '078': 'MobiFone', '079': 'MobiFone',
      '081': 'Vinaphone', '082': 'Vinaphone', '083': 'Vinaphone',
      '084': 'Vinaphone', '085': 'Vinaphone',
      '088': 'Vinaphone', '091': 'Vinaphone', '094': 'Vinaphone'
    };
    
    return carriers[prefix] || 'Unknown';
  },
  
  schema: Joi.string()                                              // Joi 스키마
    .pattern(/^(\+84|84|0)(3|5|7|8|9)([0-9]{8})$/)
    .required()
    .messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ',
      'string.empty': 'Số điện thoại là bắt buộc'
    })
};

/**
 * Local 주소 검증
 */
export const addressValidator = {
  isValid(address) {                                                // 주소 형식 검증
    if (!address || typeof address !== 'string') return false;
    
    // 최소 길이 체크
    if (address.length < 10) return false;
    
    // Local 주소 키워드 체크
    const vietnamKeywords = ['phường', 'quận', 'tp', 'hcm', 'hà nội', 'đà nẵng'];
    const hasKeyword = vietnamKeywords.some(keyword => 
      address.toLowerCase().includes(keyword)
    );
    
    return hasKeyword || address.length > 20;
  },
  
  parseDistrict(address) {                                          // 구/군 추출
    const districtRegex = /(?:quận|huyện)\s+([^,]+)/i;
    const match = address.match(districtRegex);
    return match ? match[1].trim() : null;
  },
  
  parseWard(address) {                                              // 동/읍 추출
    const wardRegex = /(?:phường|xã)\s+([^,]+)/i;
    const match = address.match(wardRegex);
    return match ? match[1].trim() : null;
  },
  
  schema: Joi.object({                                              // Joi 스키마
    street: Joi.string().min(5).required(),
    ward: Joi.string().optional(),
    district: Joi.string().required(),
    city: Joi.string().required(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional()
  }).messages({
    'string.min': 'Địa chỉ quá ngắn',
    'any.required': 'Thông tin địa chỉ không đầy đủ'
  })
};

/**
 * 결제 정보 검증
 */
export const paymentValidator = {
  isValidCard(cardNumber) {                                         // 카드 번호 검증
    const cleaned = cardNumber?.replace(/\s/g, '');
    if (!cleaned || cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }
    
    // Luhn 알고리즘
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  },
  
  getCardType(cardNumber) {                                         // 카드 종류 식별
    const cleaned = cardNumber?.replace(/\s/g, '');
    
    if (/^4/.test(cleaned)) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'MasterCard';
    if (/^3[47]/.test(cleaned)) return 'Amex';
    if (/^9704/.test(cleaned)) return 'VietnamDomestic';
    
    return 'Unknown';
  },
  
  isValidCVV(cvv, cardType) {                                       // CVV 검증
    if (cardType === 'Amex') {
      return /^\d{4}$/.test(cvv);
    }
    return /^\d{3}$/.test(cvv);
  },
  
  isValidAmount(amount, currency = 'VND') {                        // 금액 검증
    if (typeof amount !== 'number' || amount <= 0) {
      return false;
    }
    
    if (currency === 'VND') {
      // Local 동: 1,000 VND 이상
      return amount >= 1000;
    }
    
    return amount > 0;
  },
  
  formatVND(amount) {                                               // VND 포맷팅
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  },
  
  schema: Joi.object({                                              // Joi 스키마
    method: Joi.string()
      .valid('CARD', 'CASH', 'MOMO', 'ZALOPAY', 'VNPAY')
      .required(),
    amount: Joi.number().min(1000).required(),
    currency: Joi.string().default('VND'),
    cardNumber: Joi.when('method', {
      is: 'CARD',
      then: Joi.string().creditCard().required(),
      otherwise: Joi.optional()
    })
  }).messages({
    'number.min': 'Số tiền tối thiểu là 1,000 VND',
    'any.only': 'Phương thức thanh toán không hợp lệ'
  })
};

/**
 * 비즈니스 규칙 검증
 */
export const businessValidator = {
  isValidOrderTime(orderTime, storeHours) {                        // 주문 시간 검증
    const hour = new Date(orderTime).getHours();
    return hour >= storeHours.open && hour < storeHours.close;
  },
  
  isMinimumOrder(amount, minimumAmount = 50000) {                  // 최소 주문 금액
    return amount >= minimumAmount;
  },
  
  isDeliveryArea(distance, maxDistance = 10) {                     // 배달 가능 거리
    return distance <= maxDistance;
  },
  
  isValidPromoCode(code) {                                          // 프로모션 코드
    const promoRegex = /^[A-Z0-9]{4,12}$/;
    return promoRegex.test(code);
  },
  
  isValidRating(rating) {                                           // 평점 검증
    return rating >= 1 && rating <= 5 && Number.isInteger(rating);
  }
};

/**
 * 입력 Sanitization
 */
export const sanitizer = {
  cleanHTML(input) {                                                // HTML 태그 제거
    return input?.replace(/<[^>]*>/g, '');
  },
  
  cleanSQL(input) {                                                 // SQL Injection 방지
    return input?.replace(/['";\\]/g, '');
  },
  
  cleanPhone(phone) {                                               // 전화번호 정리
    return phone?.replace(/[^\d+]/g, '');
  },
  
  cleanEmail(email) {                                               // 이메일 정리
    return email?.toLowerCase().trim();
  },
  
  trimAll(obj) {                                                    // 모든 문자열 trim
    if (typeof obj === 'string') return obj.trim();
    if (typeof obj !== 'object') return obj;
    
    const cleaned = {};
    for (const key in obj) {
      cleaned[key] = this.trimAll(obj[key]);
    }
    return cleaned;
  }
};

/**
 * 통합 검증 스키마
 */
export const schemas = {
  // 사용자 등록                                                     // 회원가입 검증
  userRegistration: Joi.object({
    email: emailValidator.schema,
    phone: phoneValidator.schema,
    password: Joi.string().min(6).required(),
    fullName: Joi.string().min(2).max(50).required(),
    address: addressValidator.schema
  }),
  
  // 주문 생성                                                       // 주문 검증
  orderCreation: Joi.object({
    storeId: Joi.number().required(),
    items: Joi.array().items(
      Joi.object({
        menuItemId: Joi.number().required(),
        quantity: Joi.number().min(1).required(),
        options: Joi.array().optional()
      })
    ).min(1).required(),
    deliveryAddress: Joi.string().min(10).required(),
    paymentMethod: Joi.string().valid('CASH', 'CARD', 'MOMO', 'ZALOPAY').required(),
    note: Joi.string().max(500).optional()
  }),
  
  // 리뷰 작성                                                       // 리뷰 검증
  reviewCreation: Joi.object({
    orderId: Joi.number().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().max(1000).optional(),
    images: Joi.array().items(Joi.string().uri()).max(5).optional()
  })
};

// 기본 내보내기                                                     // 전체 검증 도구
export default {
  email: emailValidator,
  phone: phoneValidator,
  address: addressValidator,
  payment: paymentValidator,
  business: businessValidator,
  sanitizer,
  schemas
};