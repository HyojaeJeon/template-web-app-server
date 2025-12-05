/**
 * 포매터 유틸리티 함수들
 * 통화, 날짜, 시간 등의 포맷팅 처리
 */

/**
 * Local 동(VND) 통화 포맷팅
 * @param {number} amount - 금액
 * @param {boolean} showCurrency - 통화 기호 표시 여부
 * @returns {string} 포맷된 통화 문자열
 */
import { formatCurrency as lcFormatCurrency, formatNumber as lcFormatNumber, getCurrentLanguage } from '@shared/utils/localization/localizationUtils';

export const formatCurrency = (amount, showCurrency = true) => {
  if (amount == null || amount === '') return showCurrency ? '0₫' : '0';

  const lang = getCurrentLanguage?.() || 'vi';
  const numAmount = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(numAmount)) return showCurrency ? '0₫' : '0';

  if (showCurrency) {
    return lcFormatCurrency(numAmount, 'VND', lang);
  }
  return lcFormatNumber(numAmount, lang);
};

// formatVND 별칭 (하위 호환성)
export const formatVND = formatCurrency;

/**
 * 짧은 형식의 통화 포맷팅 (K, M 단위)
 * @param {number} amount - 금액
 * @returns {string} 포맷된 통화 문자열
 */
export const formatCurrencyShort = (amount) => {
  if (!amount) return '0₫';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (numAmount >= 1000000) {
    return `${(numAmount / 1000000).toFixed(1)}M₫`;
  } else if (numAmount >= 1000) {
    return `${(numAmount / 1000).toFixed(0)}K₫`;
  }
  
  return `${numAmount}₫`;
};

/**
 * 거리 포맷팅
 * @param {number} distance - 거리 (미터 단위)
 * @returns {string} 포맷된 거리 문자열
 */
export const formatDistance = (distance) => {
  if (!distance) return '0m';
  
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)}km`;
  }
  
  return `${Math.round(distance)}m`;
};

/**
 * 시간 포맷팅 (분 단위)
 * @param {number} minutes - 분
 * @returns {string} 포맷된 시간 문자열
 */
export const formatDuration = (minutes) => {
  if (!minutes) return '0 phút';
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins} phút` : `${hours}h`;
  }
  
  return `${minutes} phút`;
};

/**
 * 날짜 포맷팅
 * @param {Date|string} date - 날짜
 * @param {string} format - 포맷 형식
 * @returns {string} 포맷된 날짜 문자열
 */
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '';
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'DD/MM/YYYY HH:mm':
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    case 'HH:mm':
      return `${hours}:${minutes}`;
    default:
      return `${day}/${month}/${year}`;
  }
};

/**
 * 상대 시간 포맷팅
 * @param {Date|string} date - 날짜
 * @returns {string} 상대 시간 문자열
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now - then) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Vừa xong';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} tháng trước`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} năm trước`;
  }
};

/**
 * 전화번호 포맷팅 (Local)
 * @param {string} phone - 전화번호
 * @returns {string} 포맷된 전화번호
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // 숫자만 추출
  const cleaned = phone.replace(/\D/g, '');
  
  // Local 전화번호 포맷 (0xx xxxx xxxx 또는 +84 xx xxxx xxxx)
  if (cleaned.startsWith('84')) {
    const number = cleaned.slice(2);
    return `+84 ${number.slice(0, 2)} ${number.slice(2, 6)} ${number.slice(6)}`;
  } else if (cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
};

/**
 * 퍼센트 포맷팅
 * @param {number} value - 값
 * @param {number} decimals - 소수점 자리수
 * @returns {string} 포맷된 퍼센트 문자열
 */
export const formatPercent = (value, decimals = 0) => {
  if (!value && value !== 0) return '0%';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return `${numValue.toFixed(decimals)}%`;
};

/**
 * 주문 번호 포맷팅
 * @param {string|number} orderNumber - 주문 번호
 * @returns {string} 포맷된 주문 번호
 */
export const formatOrderNumber = (orderNumber) => {
  if (!orderNumber) return '';
  
  const str = orderNumber.toString();
  // 예: ORD-2024-0001 형식
  if (str.length > 8) {
    return str;
  }
  
  return `#${str.padStart(6, '0')}`;
};

/**
 * 평점 포맷팅
 * @param {number} rating - 평점
 * @returns {string} 포맷된 평점
 */
export const formatRating = (rating) => {
  if (!rating) return '0.0';
  
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  return numRating.toFixed(1);
};

export default {
  formatCurrency,
  formatVND,
  formatCurrencyShort,
  formatDistance,
  formatDuration,
  formatDate,
  formatRelativeTime,
  formatPhoneNumber,
  formatPercent,
  formatOrderNumber,
  formatRating};
