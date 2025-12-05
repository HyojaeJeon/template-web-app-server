/**
 * 비즈니스 로직 검증 시스템
 * 
 * 주문, 결제, 매장, 메뉴 관련 비즈니스 규칙 검증
 * Local 현지 비즈니스 요구사항과 배달 서비스 정책 적용
 */

import Joi from 'joi';
import { GraphQLError } from '../../../errors/GraphQLError.js';
import { InputValidators } from './InputValidators.js';

export class BusinessValidators extends InputValidators {
  constructor() {
    super();

    // 지원되는 결제 방법                                            - Local 현지 결제
    this.supportedPaymentMethods = [
      'COD',          // 착불
      'MOMO',         // 모모페이
      'ZALOPAY',      // 잘로페이
      'VNPAY',        // VN페이
      'CREDIT_CARD',  // 신용카드
      'BANK_TRANSFER' // 계좌이체
    ];

    // 주문 상태 정의                                               - 배달 프로세스 상태
    this.orderStatuses = [
      'PENDING',      // 대기중
      'CONFIRMED',    // 확인됨
      'PREPARING',    // 조리중
      'READY',        // 픽업 준비
      'PICKED_UP',    // 픽업됨
      'DELIVERING',   // 배달중
      'DELIVERED',    // 배달완료
      'CANCELLED'     // 취소됨
    ];

    // 매장 운영 상태                                               - 매장 관리
    this.storeStatuses = [
      'OPEN',         // 운영중
      'CLOSED',       // 휴무
      'BUSY',         // 주문 많음
      'TEMPORARILY_CLOSED', // 임시휴무
      'MAINTENANCE'   // 점검중
    ];

    // Local 주요 도시                                             - 서비스 지역
    this.vietnamMajorCities = [
      'Hà Nội',       // 하노이
      'TP.HCM',       // 호치민
      'Đà Nẵng',      // 다낭
      'Hải Phòng',    // 하이퐁
      'Cần Thơ',      // 껀터
      'Biên Hòa',     // 비엔호아
      'Huế',          // 후에
      'Nha Trang',    // 나트랑
      'Buôn Ma Thuột', // 부온마투옷
      'Quy Nhon'      // 퀴논
    ];

    // 음식 알레르기 항목                                           - 알레르기 정보
    this.commonAllergens = [
      'dairy',        // 유제품
      'eggs',         // 계란
      'fish',         // 생선
      'shellfish',    // 갑각류
      'tree_nuts',    // 견과류
      'peanuts',      // 땅콩
      'wheat',        // 밀
      'soy',          // 대두
      'sesame',       // 참깨
      'msg'           // MSG
    ];

    // Local 요리 카테고리                                          - 현지 음식 분류
    this.vietnameseCuisineTypes = [
      'vietnamese',   // Local 요리
      'chinese',      // 중국 요리
      'korean',       // 한국 요리
      'japanese',     // 일본 요리
      'western',      // 서양 요리
      'fast_food',    // 패스트푸드
      'dessert',      // 디저트
      'drinks',       // 음료
      'street_food',  // 길거리 음식
      'hotpot'        // 훠궈
    ];
  }

  /**
   * 가격 검증 (VND 기준)                                          - Local 화폐 단위
   * 
   * @param {number} price     - 가격 (VND)
   * @param {number} min       - 최소 가격
   * @param {number} max       - 최대 가격
   * @param {string} fieldName - 필드명
   * @returns {number}         - 검증된 가격
   */
  validatePrice(price, min = 1000, max = 10000000, fieldName = 'price') {
    const validatedPrice = this.validateNumberRange(price, min, max, fieldName);

    // VND는 보통 1000원 단위                                       - 현지 관습
    if (validatedPrice % 500 !== 0) {
      throw new GraphQLError(
        `${fieldName} should be in increments of 500 VND`,
        'INVALID_PRICE_INCREMENT',
        400
      );
    }

    return validatedPrice;
  }

  /**
   * 배달비 검증                                                  - 배달 요금 계산
   * 
   * @param {number} fee - 배달비
   * @returns {number}   - 검증된 배달비
   */
  validateDeliveryFee(fee) {
    return this.validatePrice(fee, 0, 100000, 'delivery fee');
  }

  /**
   * 최소 주문 금액 검증                                           - 주문 정책
   * 
   * @param {number} amount - 최소 주문 금액
   * @returns {number}      - 검증된 금액
   */
  validateMinimumOrderAmount(amount) {
    return this.validatePrice(amount, 0, 1000000, 'minimum order amount');
  }

  /**
   * 배달 거리 검증 (미터 단위)                                     - 배달 가능 범위
   * 
   * @param {number} radius - 배달 반경 (미터)
   * @returns {number}      - 검증된 반경
   */
  validateDeliveryRadius(radius) {
    return this.validateNumberRange(radius, 100, 50000, 'delivery radius');
  }

  /**
   * 배달 시간 검증 (분 단위)                                       - 배달 예상 시간
   * 
   * @param {number} time - 예상 배달 시간 (분)
   * @returns {number}    - 검증된 시간
   */
  validateDeliveryTime(time) {
    return this.validateNumberRange(time, 10, 120, 'delivery time');
  }

  /**
   * 좌표 검증                                                   - 위치 정보
   * 
   * @param {number} latitude  - 위도
   * @param {number} longitude - 경도
   * @returns {object}         - 검증된 좌표
   */
  validateCoordinates(latitude, longitude) {
    const lat = this.validateNumberRange(latitude, -90, 90, 'latitude');
    const lng = this.validateNumberRange(longitude, -180, 180, 'longitude');

    // Local 영토 범위 검증 (대략적)                               - 서비스 지역 제한
    if (lat < 8.0 || lat > 23.5 || lng < 102.0 || lng > 110.0) {
      throw new GraphQLError(
        'Coordinates must be within Vietnam territory',
        'COORDINATES_OUT_OF_RANGE',
        400
      );
    }

    return { latitude: lat, longitude: lng };
  }

  /**
   * 결제 방법 검증                                               - 지원 결제 수단
   * 
   * @param {string} method - 결제 방법
   * @returns {string}      - 검증된 결제 방법
   */
  validatePaymentMethod(method) {
    if (!method || typeof method !== 'string') {
      throw new GraphQLError(
        'Payment method is required',
        'PAYMENT_METHOD_REQUIRED',
        400
      );
    }

    const upperMethod = method.toUpperCase();
    if (!this.supportedPaymentMethods.includes(upperMethod)) {
      throw new GraphQLError(
        `Unsupported payment method: ${method}`,
        'UNSUPPORTED_PAYMENT_METHOD',
        400
      );
    }

    return upperMethod;
  }

  /**
   * 주문 상태 검증                                               - 주문 진행 상태
   * 
   * @param {string} status - 주문 상태
   * @returns {string}      - 검증된 상태
   */
  validateOrderStatus(status) {
    if (!status || typeof status !== 'string') {
      throw new GraphQLError(
        'Order status is required',
        'ORDER_STATUS_REQUIRED',
        400
      );
    }

    const upperStatus = status.toUpperCase();
    if (!this.orderStatuses.includes(upperStatus)) {
      throw new GraphQLError(
        `Invalid order status: ${status}`,
        'INVALID_ORDER_STATUS',
        400
      );
    }

    return upperStatus;
  }

  /**
   * 매장 상태 검증                                               - 매장 운영 상태
   * 
   * @param {string} status - 매장 상태
   * @returns {string}      - 검증된 상태
   */
  validateStoreStatus(status) {
    if (!status || typeof status !== 'string') {
      throw new GraphQLError(
        'Store status is required',
        'STORE_STATUS_REQUIRED',
        400
      );
    }

    const upperStatus = status.toUpperCase();
    if (!this.storeStatuses.includes(upperStatus)) {
      throw new GraphQLError(
        `Invalid store status: ${status}`,
        'INVALID_STORE_STATUS',
        400
      );
    }

    return upperStatus;
  }

  /**
   * 음식 매운맛 레벨 검증                                          - 매운맛 단계
   * 
   * @param {number} level - 매운맛 레벨 (0-5)
   * @returns {number}     - 검증된 레벨
   */
  validateSpicyLevel(level) {
    return this.validateNumberRange(level, 0, 5, 'spicy level');
  }

  /**
   * 칼로리 검증                                                 - 영양 정보
   * 
   * @param {number} calories - 칼로리
   * @returns {number}        - 검증된 칼로리
   */
  validateCalories(calories) {
    return this.validateNumberRange(calories, 0, 5000, 'calories');
  }

  /**
   * 알레르기 정보 검증                                            - 알레르기 항목
   * 
   * @param {Array} allergens - 알레르기 항목 배열
   * @returns {Array}         - 검증된 알레르기 목록
   */
  validateAllergens(allergens) {
    if (!allergens) return [];

    const validatedArray = this.validateArraySize(allergens, 0, 20, 'allergens');

    const invalidAllergens = validatedArray.filter(
      allergen => !this.commonAllergens.includes(allergen)
    );

    if (invalidAllergens.length > 0) {
      throw new GraphQLError(
        `Invalid allergens: ${invalidAllergens.join(', ')}`,
        'INVALID_ALLERGENS',
        400
      );
    }

    return validatedArray;
  }

  /**
   * 요리 종류 검증                                               - 음식 카테고리
   * 
   * @param {string} cuisineType - 요리 종류
   * @returns {string}           - 검증된 요리 종류
   */
  validateCuisineType(cuisineType) {
    if (!cuisineType) return 'vietnamese'; // 기본값

    if (!this.vietnameseCuisineTypes.includes(cuisineType.toLowerCase())) {
      throw new GraphQLError(
        `Unsupported cuisine type: ${cuisineType}`,
        'UNSUPPORTED_CUISINE_TYPE',
        400
      );
    }

    return cuisineType.toLowerCase();
  }

  /**
   * 주문 아이템 검증                                             - 주문 상품 검사
   * 
   * @param {Array} items - 주문 아이템 목록
   * @returns {Array}     - 검증된 아이템 목록
   */
  validateOrderItems(items) {
    const validatedArray = this.validateArraySize(items, 1, 50, 'order items');

    return validatedArray.map((item, index) => {
      if (!item.menuItemId) {
        throw new GraphQLError(
          `Item ${index + 1}: menuItemId is required`,
          'MENU_ITEM_ID_REQUIRED',
          400
        );
      }

      const quantity = this.validateNumberRange(
        item.quantity, 
        1, 
        99, 
        `Item ${index + 1} quantity`
      );

      const specialRequests = item.specialRequests 
        ? this.validateStringLength(item.specialRequests, 0, 200, 'special requests')
        : '';

      return {
        menuItemId: this.validateUUID(item.menuItemId, `Item ${index + 1} menuItemId`),
        quantity,
        options: item.options || [],
        specialRequests,
      };
    });
  }

  /**
   * 매장 운영 시간 검증                                           - 영업 시간 관리
   * 
   * @param {object} hours - 운영 시간 객체
   * @returns {object}     - 검증된 운영 시간
   */
  validateOperatingHours(hours) {
    if (!hours || typeof hours !== 'object') {
      throw new GraphQLError(
        'Operating hours are required',
        'OPERATING_HOURS_REQUIRED',
        400
      );
    }

    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const validatedHours = {};

    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (const day of daysOfWeek) {
      if (hours[day]) {
        const { open, close, isOpen = true } = hours[day];

        if (isOpen) {
          if (!timePattern.test(open) || !timePattern.test(close)) {
            throw new GraphQLError(
              `Invalid time format for ${day}. Use HH:MM format`,
              'INVALID_TIME_FORMAT',
              400
            );
          }
        }

        validatedHours[day] = { open, close, isOpen };
      }
    }

    return validatedHours;
  }

  /**
   * 프로모션 할인율 검증                                           - 할인 정책
   * 
   * @param {number} discount - 할인율 (%)
   * @returns {number}        - 검증된 할인율
   */
  validateDiscountPercentage(discount) {
    return this.validateNumberRange(discount, 0, 90, 'discount percentage');
  }

  /**
   * 재고 수량 검증                                               - 재고 관리
   * 
   * @param {number} stock - 재고 수량
   * @returns {number}     - 검증된 재고
   */
  validateStockQuantity(stock) {
    return this.validateNumberRange(stock, 0, 9999, 'stock quantity');
  }

  /**
   * 메뉴 정렬 순서 검증                                           - 메뉴 순서 관리
   * 
   * @param {number} displayOrder - 정렬 순서
   * @returns {number}         - 검증된 순서
   */
  validateDisplayOrder(displayOrder) {
    return this.validateNumberRange(displayOrder, 0, 9999, 'sort order');
  }

  /**
   * Local 도시명 검증                                            - 서비스 지역
   * 
   * @param {string} city - 도시명
   * @returns {string}    - 검증된 도시명
   */
  validateVietnameseCity(city) {
    if (!city) return null;

    // 주요 도시가 아닌 경우 경고만 (완전 차단하지 않음)
    if (!this.vietnamMajorCities.includes(city)) {
      console.warn(`Uncommon Vietnamese city: ${city}`);
    }

    return this.validateStringLength(city, 1, 50, 'city');
  }
}

export default BusinessValidators;