/**
 * 데이터 정보 포맷팅 유틸리티
 * 날짜, 통화, 헤더 포맷터 함수들
 */

/**
 * 날짜/시간 포맷팅 함수들
 */
export const dateFormatters = {
  /**
   * 날짜를 Local 시간대로 변환
   * @param {Date|string} date - 변환할 날짜
   * @returns {Date} Local 시간대로 변환된 날짜
   */
  toVietnamTime(date) {
    const dateObj = new Date(date);                                    // Date 객체 변환
    const options = { timeZone: 'Asia/Ho_Chi_Minh' };                 // Local 시간대 설정
    return new Date(dateObj.toLocaleString('en-US', options));        // Local 시간대로 변환
  },

  /**
   * 날짜만 포맷팅 (YYYY-MM-DD)
   * @param {Date|string} date - 포맷할 날짜
   * @returns {string} 포맷된 날짜 문자열
   */
  formatDate(date) {
    const vietnamDate = this.toVietnamTime(date);                     // Local 시간대로 변환
    return vietnamDate.toISOString().split('T')[0];                   // YYYY-MM-DD 형태로 반환
  },

  /**
   * 시간만 포맷팅 (HH:MM:SS)
   * @param {Date|string} date - 포맷할 시간
   * @returns {string} 포맷된 시간 문자열
   */
  formatTime(date) {
    const vietnamDate = this.toVietnamTime(date);                     // Local 시간대로 변환
    return vietnamDate.toTimeString().split(' ')[0];                  // HH:MM:SS 형태로 반환
  },

  /**
   * 날짜+시간 포맷팅 (YYYY-MM-DD HH:MM:SS)
   * @param {Date|string} date - 포맷할 날짜시간
   * @returns {string} 포맷된 날짜시간 문자열
   */
  formatDateTime(date) {
    const vietnamDate = this.toVietnamTime(date);                     // Local 시간대로 변환
    return vietnamDate.toISOString().replace('T', ' ').slice(0, 19);  // YYYY-MM-DD HH:MM:SS 형태
  },

  /**
   * Local 현지 날짜 형식 포맷팅 (현지어)
   * @param {Date|string} date - 포맷할 날짜
   * @returns {string} 현지어 날짜 형식 문자열
   */
  formatDateVN(date) {
    const vietnamDate = this.toVietnamTime(date);                     // Local 시간대로 변환
    const options = {                                                 // 현지어 포맷팅 옵션
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh'
    };
    return vietnamDate.toLocaleDateString('vi-VN', options);          // 현지어 날짜 포맷
  },

  /**
   * 상대적 시간 형식 (몇 분 전, 몇 시간 전)
   * @param {Date|string} date - 기준 날짜
   * @returns {string} 상대적 시간 문자열
   */
  formatRelativeTime(date) {
    const now = this.toVietnamTime(new Date());                       // 현재 Local 시간
    const targetDate = this.toVietnamTime(date);                      // 대상 Local 시간
    const diffMs = now.getTime() - targetDate.getTime();              // 시간 차이 (밀리초)
    const diffMinutes = Math.floor(diffMs / (1000 * 60));             // 분 단위 차이

    if (diffMinutes < 1) return 'Vừa xong';                          // 1분 미만
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;        // 1시간 미만
    
    const diffHours = Math.floor(diffMinutes / 60);                   // 시간 단위 계산
    if (diffHours < 24) return `${diffHours} giờ trước`;             // 24시간 미만
    
    const diffDays = Math.floor(diffHours / 24);                      // 일 단위 계산
    return `${diffDays} ngày trước`;                                  // 24시간 이상
  }
};

/**
 * 통화 포맷팅 함수들
 */
export const currencyFormatters = {
  /**
   * VND 통화 포맷팅 (기본)
   * @param {number} amount - 금액
   * @returns {string} 포맷된 VND 금액
   */
  formatVND(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '0₫';     // 유효성 검사
    const formatted = amount.toLocaleString('vi-VN');                 // Local 숫자 형식 변환
    return `${formatted}₫`;                                           // VND 기호 추가
  },

  /**
   * VND 통화 포맷팅 (축약형 - 천, 만, 억)
   * @param {number} amount - 금액
   * @returns {string} 축약형 VND 금액
   */
  formatVNDShort(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '0₫';     // 유효성 검사
    
    if (amount >= 1000000000) {                                       // 10억 이상
      const billions = (amount / 1000000000).toFixed(1);              // 십억 단위 계산
      return `${billions}B₫`;                                         // 십억 단위 표시
    }
    
    if (amount >= 1000000) {                                          // 100만 이상
      const millions = (amount / 1000000).toFixed(1);                 // 백만 단위 계산
      return `${millions}M₫`;                                         // 백만 단위 표시
    }
    
    if (amount >= 1000) {                                             // 1천 이상
      const thousands = (amount / 1000).toFixed(1);                   // 천 단위 계산
      return `${thousands}K₫`;                                        // 천 단위 표시
    }
    
    return `${amount}₫`;                                              // 천 단위 미만은 그대로 표시
  },

  /**
   * 할인/쿠폰 금액 포맷팅
   * @param {number} amount - 쿠폰 금액
   * @param {string} type - 쿠폰 타입 ('FIXED' | 'PERCENTAGE')
   * @returns {string} 포맷된 쿠폰 금액
   */
  formatDiscount(amount, type = 'FIXED') {
    if (type === 'PERCENTAGE') {                                      // 퍼센트 쿠폰
      return `-${amount}%`;                                           // 퍼센트 표시
    }
    return `-${this.formatVND(amount)}`;                              // 고정 금액 쿠폰
  }
};

/**
 * 전화번호 포맷팅 함수들
 */
export const phoneFormatters = {
  /**
   * Local 전화번호 포맷팅
   * @param {string} phone - 원본 전화번호
   * @returns {string} 포맷된 전화번호
   */
  formatVNPhone(phone) {
    if (!phone) return '';                                            // 빈 값 처리
    
    const cleaned = phone.replace(/\D/g, '');                         // 숫자만 추출
    
    // 국제번호 (+84)
    if (cleaned.startsWith('84')) {                                   // 84로 시작하는 경우
      const number = cleaned.slice(2);                                // 84 제거
      if (number.length === 9) {                                     // 9자리 확인
        return `+84 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;  // +84 XXX XXX XXX
      }
    }
    
    // 국내번호 (0으로 시작)
    if (cleaned.startsWith('0') && cleaned.length === 10) {           // 0으로 시작하고 10자리
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;     // 0XXX XXX XXX
    }
    
    return phone;                                                     // 포맷팅 불가능하면 원본 반환
  },

  /**
   * 전화번호 마스킹 (개인정보 보호)
   * @param {string} phone - 원본 전화번호
   * @returns {string} 마스킹된 전화번호
   */
  maskPhone(phone) {
    const formatted = this.formatVNPhone(phone);                      // 먼저 포맷팅
    if (formatted.includes('+84')) {                                  // 국제번호인 경우
      return formatted.replace(/(\d{3})\s(\d{3})\s(\d{3})/, '$1 *** $3');  // 가운데 3자리 마스킹
    }
    return formatted.replace(/(\d{4})\s(\d{3})\s(\d{3})/, '$1 *** $3');    // 가운데 3자리 마스킹
  }
};

/**
 * 주소 포맷팅 함수들
 */
export const addressFormatters = {
  /**
   * Local 주소 포맷팅
   * @param {Object} address - 주소 객체
   * @param {string} address.street - 도로 주소
   * @param {string} address.ward - 동/구
   * @param {string} address.district - 시/군
   * @param {string} address.city - 도시
   * @returns {string} 포맷된 주소
   */
  formatVNAddress(address) {
    if (!address) return '';                                          // 빈 주소 처리
    
    const parts = [];                                                 // 주소 구성 요소 배열
    
    if (address.street) parts.push(address.street);                  // 도로 주소 추가
    if (address.ward) parts.push(address.ward);                      // 동/구 추가
    if (address.district) parts.push(address.district);              // 시/군 추가
    if (address.city) parts.push(address.city);                      // 도시 추가
    
    return parts.join(', ');                                          // 콤마로 구분하여 연결
  },

  /**
   * 간단한 주소 포맷팅 (동/구, 시/군만)
   * @param {Object} address - 주소 객체
   * @returns {string} 축약형 주소
   */
  formatShortAddress(address) {
    if (!address) return '';                                          // 빈 주소 처리
    
    const parts = [];                                                 // 주소 구성 요소 배열
    if (address.district) parts.push(address.district);              // 시/군 추가
    if (address.city) parts.push(address.city);                      // 도시 추가
    
    return parts.join(', ');                                          // 콤마로 구분하여 연결
  }
};

/**
 * 오류 메시지 포맷팅 함수들
 */
export const errorFormatters = {
  /**
   * 표준 오류 응답 생성
   * @param {string} message - 오류 메시지
   * @param {string} code - 오류 코드
   * @param {Object} details - 상세 정보
   * @returns {Object} 포맷된 오류 응답
   */
  formatError(message, code = 'UNKNOWN_ERROR', details = null) {
    return {
      success: false,                                                 // 실패 표시
      message,                                                        // 오류 메시지
      errorCode: code,                                                // 오류 코드
      details,                                                        // 상세 정보
      timestamp: dateFormatters.formatDateTime(new Date())            // 오류 발생 시간
    };
  },

  /**
   * 유효성 검사 오류 포맷팅
   * @param {Array} validationErrors - 유효성 검사 오류 배열
   * @returns {Object} 포맷된 유효성 검사 오류
   */
  formatValidationError(validationErrors) {
    return this.formatError(
      'Dữ liệu không hợp lệ',                                         // Local어 메시지
      'VALIDATION_ERROR',                                             // 유효성 검사 오류 코드
      { fields: validationErrors }                                    // 필드별 오류 정보
    );
  },

  /**
   * 인증 오류 포맷팅
   * @param {string} message - 인증 오류 메시지
   * @returns {Object} 포맷된 인증 오류
   */
  formatAuthError(message = 'Không có quyền truy cập') {
    return this.formatError(
      message,                                                        // 인증 오류 메시지
      'AUTH_ERROR',                                                   // 인증 오류 코드
      { requiresLogin: true }                                         // 로그인 필요 정보
    );
  }
};

/**
 * 페이지네이션 응답 포맷터
 */
export const paginationFormatters = {
  /**
   * 페이지네이션 메타정보 생성
   * @param {number} total - 전체 항목 수
   * @param {number} page - 현재 페이지
   * @param {number} limit - 페이지당 항목 수
   * @returns {Object} 페이지네이션 메타정보
   */
  createPaginationMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);                     // 전체 페이지 수 계산
    const hasNextPage = page < totalPages;                           // 다음 페이지 존재 여부
    const hasPrevPage = page > 1;                                    // 이전 페이지 존재 여부
    
    return {
      total,                                                          // 전체 항목 수
      page,                                                           // 현재 페이지
      limit,                                                          // 페이지당 항목 수
      totalPages,                                                     // 전체 페이지 수
      hasNextPage,                                                    // 다음 페이지 존재 여부
      hasPrevPage                                                     // 이전 페이지 존재 여부
    };
  },

  /**
   * 페이지네이션 응답 포맷팅
   * @param {Array} data - 정보 배열
   * @param {Object} meta - 메타정보
   * @returns {Object} 포맷된 페이지네이션 응답
   */
  formatPaginatedResponse(data, meta) {
    return {
      success: true,                                                  // 성공 표시
      data,                                                           // 실제 정보
      pagination: meta,                                               // 페이지네이션 메타정보
      timestamp: dateFormatters.formatDateTime(new Date())           // 응답 생성 시간
    };
  }
};

/**
 * 일반 응답 포맷터
 */
export const responseFormatters = {
  /**
   * 성공 응답 포맷팅
   * @param {*} data - 응답 정보
   * @param {string} message - 성공 메시지
   * @returns {Object} 포맷된 성공 응답
   */
  formatSuccess(data, message = 'Thành công') {
    return {
      success: true,                                                  // 성공 표시
      message,                                                        // 성공 메시지
      data,                                                           // 응답 정보
      timestamp: dateFormatters.formatDateTime(new Date())           // 응답 생성 시간
    };
  },

  /**
   * 빈 결과 응답 포맷팅
   * @param {string} message - 빈 결과 메시지
   * @returns {Object} 포맷된 빈 결과 응답
   */
  formatEmptyResult(message = 'Không tìm thấy dữ liệu') {
    return {
      success: true,                                                  // 성공 표시 (빈 결과도 성공)
      message,                                                        // 빈 결과 메시지
      data: [],                                                       // 빈 배열
      timestamp: dateFormatters.formatDateTime(new Date())           // 응답 생성 시간
    };
  }
};

/**
 * 기타 유틸리티 포맷터
 */
export const utilityFormatters = {
  /**
   * 파일 크기 포맷팅
   * @param {number} bytes - 바이트 크기
   * @returns {string} 포맷된 파일 크기
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';                                   // 0바이트 처리
    
    const units = ['B', 'KB', 'MB', 'GB'];                           // 단위 배열
    const k = 1024;                                                   // 1KB = 1024B
    const i = Math.floor(Math.log(bytes) / Math.log(k));             // 단위 인덱스 계산
    
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;     // 소수점 1자리로 포맷팅
  },

  /**
   * 퍼센트 포맷팅
   * @param {number} value - 퍼센트 값 (0-1 또는 0-100)
   * @param {boolean} isDecimal - 소수점 여부
   * @returns {string} 포맷된 퍼센트
   */
  formatPercentage(value, isDecimal = true) {
    const percent = isDecimal ? value * 100 : value;                 // 퍼센트 변환
    return `${percent.toFixed(1)}%`;                                  // 소수점 1자리로 포맷팅
  },

  /**
   * 거리 포맷팅 (미터 단위)
   * @param {number} meters - 미터 단위 거리
   * @returns {string} 포맷된 거리
   */
  formatDistance(meters) {
    if (meters < 1000) {                                             // 1km 미만
      return `${Math.round(meters)}m`;                               // 미터 단위 표시
    }
    return `${(meters / 1000).toFixed(1)}km`;                        // 킬로미터 단위 표시
  }
};

// 모든 포맷터들을 하나의 객체로 통합하여 export
export default {
  date: dateFormatters,                                               // 날짜/시간 포맷터
  currency: currencyFormatters,                                      // 통화 포맷터
  phone: phoneFormatters,                                             // 전화번호 포맷터
  address: addressFormatters,                                        // 주소 포맷터
  error: errorFormatters,                                             // 오류 포맷터
  pagination: paginationFormatters,                                   // 페이지네이션 포맷터
  response: responseFormatters,                                       // 응답 포맷터
  utility: utilityFormatters                                          // 기타 유틸리티 포맷터
};