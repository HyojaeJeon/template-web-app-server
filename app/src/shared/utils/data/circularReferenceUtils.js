/**
 * 순환 참조 방지 유틸리티
 * Apollo Client 데이터 처리 시 JSON 순환 참조 에러 방지
 */

/**
 * 순환 참조를 제거하면서 객체를 깊은 복사
 * @param {any} obj - 처리할 객체
 * @param {Set} seen - 이미 처리된 객체들 (내부용)
 * @returns {any} 순환 참조가 제거된 객체
 */
export const removeCircularReferences = (obj, seen = new Set()) => {
  // 원시 타입은 그대로 반환
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 이미 처리된 객체면 참조 제거
  if (seen.has(obj)) {
    return undefined; // 또는 '[Circular]' 같은 표시자
  }

  // 처리 중인 객체로 표시
  seen.add(obj);

  try {
    // 배열 처리
    if (Array.isArray(obj)) {
      return obj.map(item => removeCircularReferences(item, seen));
    }

    // 객체 처리
    const result = {};

    for (const [key, value] of Object.entries(obj)) {
      // Apollo Client 내부 필드 제외
      if (key.startsWith('__')) {
        continue;
      }

      // 알려진 순환 참조 필드 제외
      if (isCircularReferenceField(key, value)) {
        continue;
      }

      result[key] = removeCircularReferences(value, seen);
    }

    return result;
  } finally {
    // 처리 완료 후 제거 (다른 경로에서 접근 가능하도록)
    seen.delete(obj);
  }
};

/**
 * 순환 참조 필드인지 확인
 * @param {string} key - 필드명
 * @param {any} value - 필드값
 * @returns {boolean} 순환 참조 필드 여부
 */
const isCircularReferenceField = (key, value) => {
  // Order → Store → Orders 순환 참조
  if (key === 'store' && value && typeof value === 'object' && value.orders) {
    return false; // store 정보는 유지하되 orders 필드만 제거
  }

  // Store → MenuItems → Store 순환 참조
  if (key === 'menuItems' && Array.isArray(value)) {
    return false; // menuItems는 유지하되 내부 store 참조 제거
  }

  // OrderItem → Order 순환 참조
  if (key === 'order' && value && typeof value === 'object') {
    return true; // orderItem에서 order 참조는 완전 제거
  }

  // MenuItem → OrderItems 순환 참조
  if (key === 'orderItems' && Array.isArray(value) && value.length > 0) {
    return true; // menuItem에서 orderItems 참조는 완전 제거
  }

  return false;
};

/**
 * Apollo Query 결과를 안전하게 처리
 * @param {any} queryResult - Apollo useQuery 결과
 * @returns {any} 순환 참조가 제거된 데이터
 */
export const safeProcessApolloData = (queryResult) => {
  if (!queryResult || !queryResult.data) {
    return queryResult;
  }

  try {
    // data 필드만 순환 참조 제거하여 처리
    const safeData = removeCircularReferences(queryResult.data);

    return {
      ...queryResult,
      data: safeData
    };
  } catch (error) {
    console.warn('순환 참조 제거 중 에러 발생:', error);

    // 에러 발생 시 원본 데이터의 최상위 필드만 복사
    const fallbackData = {};
    if (queryResult.data && typeof queryResult.data === 'object') {
      for (const [key, value] of Object.entries(queryResult.data)) {
        if (typeof value !== 'object' || value === null) {
          fallbackData[key] = value;
        }
      }
    }

    return {
      ...queryResult,
      data: fallbackData
    };
  }
};

/**
 * 안전한 JSON.stringify (순환 참조 방지)
 * @param {any} obj - 문자열화할 객체
 * @param {number} space - 들여쓰기 공백 수
 * @returns {string} JSON 문자열
 */
export const safeStringify = (obj, space = 0) => {
  try {
    const seen = new WeakSet();

    return JSON.stringify(obj, (key, value) => {
      // Apollo Client 내부 필드 제외
      if (key.startsWith('__')) {
        return undefined;
      }

      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }

      return value;
    }, space);
  } catch (error) {
    console.warn('JSON.stringify 실패:', error);
    return JSON.stringify({ error: 'Serialization failed', message: error.message });
  }
};

/**
 * Order 데이터 안전 처리 (주문 화면 전용)
 * @param {Array} orders - 주문 배열
 * @returns {Array} 순환 참조가 제거된 주문 배열
 */
export const safeProcessOrders = (orders) => {
  if (!Array.isArray(orders)) {
    return [];
  }

  return orders.map(order => {
    if (!order || typeof order !== 'object') {
      return order;
    }

    // 필수 정보만 추출하여 새 객체 생성
    const safeOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      orderType: order.orderType,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: order.total,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    // Store 정보 (순환 참조 제거)
    if (order.store) {
      safeOrder.store = {
        id: order.store.id,
        name: order.store.name,
        logo: order.store.logo,
        rating: order.store.rating,
        address: order.store.address,
        phone: order.store.phone,
        isOpen: order.store.isOpen
      };
    }

    // OrderItems (순환 참조 제거)
    if (Array.isArray(order.orderItems)) {
      safeOrder.orderItems = order.orderItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        // menuItem에서 순환 참조 제거
        menuItem: item.menuItem ? {
          id: item.menuItem.id,
          name: item.menuItem.name,
          profileImage: item.menuItem.profileImage,
          price: item.menuItem.price,
          isAvailable: item.menuItem.isAvailable
        } : null
      }));
    }

    // Delivery 정보
    if (order.delivery) {
      safeOrder.delivery = {
        id: order.delivery.id,
        status: order.delivery.status,
        driver: order.delivery.driver ? {
          id: order.delivery.driver.id,
          name: order.delivery.driver.name,
          phone: order.delivery.driver.phone,
          profileImage: order.delivery.driver.profileImage
        } : null
      };
    }

    // Payment 정보
    if (order.payment) {
      safeOrder.payment = {
        id: order.payment.id,
        status: order.payment.status,
        method: order.payment.method,
        paidAt: order.payment.paidAt
      };
    }

    return safeOrder;
  });
};

export default {
  removeCircularReferences,
  safeProcessApolloData,
  safeStringify,
  safeProcessOrders
};