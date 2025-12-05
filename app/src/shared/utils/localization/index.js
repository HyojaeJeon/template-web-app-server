/**
 * Localization Utility Functions
 */

/**
 * Format phone number
 * @param {string} phoneNumber - Phone number
 * @param {string} countryCode - Country code
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber, countryCode = 'VN') => {
  if (!phoneNumber) {return '';}

  // Extract numbers only
  const cleanNumber = phoneNumber.replace(/\D/g, '');

  if (countryCode === 'VN') {
    // Phone number formatting
    if (cleanNumber.length === 10) {
      return cleanNumber.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    } else if (cleanNumber.length === 9) {
      return cleanNumber.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    } else if (cleanNumber.length === 11 && cleanNumber.startsWith('84')) {
      const localNumber = cleanNumber.substring(2);
      return `+84 ${localNumber.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}`;
    }
  }

  return phoneNumber;
};

/**
 * Format address
 * @param {object} address - Address object
 * @param {string} address.street - Street address
 * @param {string} address.ward - Ward
 * @param {string} address.district - District
 * @param {string} address.province - Province
 * @returns {string} Formatted address
 */
export const formatAddress = (address) => {
  if (!address) {return '';}

  const { street, ward, district, province } = address;
  const parts = [street, ward, district, province].filter(Boolean);

  return parts.join(', ');
};

/**
 * Format currency
 * @param {number} amount - Amount
 * @param {boolean} showSymbol - Show currency symbol
 * @param {boolean} compact - Compact notation (K, M units)
 * @returns {string} Formatted currency
 */
import { formatNumber as lcFormatNumber, getCurrentLanguage } from '@shared/utils/localization/localizationUtils';

export const formatVND = (amount, showSymbol = true, compact = false) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return showSymbol ? '0₫' : '0';
  }

  let formatted;

  if (compact && amount >= 1000) {
    if (amount >= 1000000) {
      const millions = amount / 1000000;
      formatted = `${millions.toFixed(millions >= 10 ? 0 : 1)}M`;
    } else if (amount >= 1000) {
      const thousands = amount / 1000;
      formatted = `${thousands.toFixed(thousands >= 10 ? 0 : 1)}K`;
    }
  } else {
    const lang = getCurrentLanguage?.() || 'vi';
    formatted = lcFormatNumber(amount, lang);
  }

  return showSymbol ? `${formatted}₫` : formatted;
};

/**
 * Local 우편번호 검증
 * @param {string} postalCode - 우편번호
 * @returns {boolean} 유효 여부
 */
export const validateVietnamesePostalCode = (postalCode) => {
  if (!postalCode) {return false;}

  // Local 우편번호는 6자리 숫자
  const cleanCode = postalCode.replace(/\D/g, '');
  return cleanCode.length === 6;
};

/**
 * Local 전화번호 검증
 * @param {string} phoneNumber - 전화번호
 * @returns {boolean} 유효 여부
 */
export const validateVietnamesePhone = (phoneNumber) => {
  if (!phoneNumber) {return false;}

  const cleanNumber = phoneNumber.replace(/\D/g, '');

  // Local 모바일 번호 패턴
  // 09x, 08x, 07x, 05x, 03x (10자리)
  const mobilePatterns = [
    /^09\d{8}$/,  // Mobifone, Vinaphone
    /^08\d{8}$/,  // Vinaphone
    /^07\d{8}$/,  // Viettel
    /^05\d{8}$/,  // Vietnamobile
    /^03\d{8}$/,   // Viettel
  ];

  return mobilePatterns.some(pattern => pattern.test(cleanNumber));
};

/**
 * Local 시간대 변환
 * @param {Date|string} date - 변환할 날짜
 * @returns {Date} Local 시간대로 변환된 날짜
 */
export const convertToVietnamTime = (date) => {
  const targetDate = new Date(date);

  // UTC+7 (Local 시간대)
  const vietnamOffset = 7 * 60; // 분 단위
  const localOffset = targetDate.getTimezoneOffset();

  return new Date(targetDate.getTime() + (vietnamOffset + localOffset) * 60 * 1000);
};

/**
 * Local어 검색을 위한 텍스트 정규화
 * @param {string} text - 정규화할 텍스트
 * @returns {string} 정규화된 텍스트
 */
export const normalizeVietnameseText = (text) => {
  if (!text) {return '';}

  return text
    .toLowerCase()
    .normalize('NFD') // 분해된 형태로 정규화
    .replace(/[\u0300-\u036f]/g, '') // 발음 기호 제거
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');
};

export default {
  formatPhoneNumber,
  formatAddress,
  formatVND,
  validateVietnamesePostalCode,
  validateVietnamesePhone,
  convertToVietnamTime,
  normalizeVietnameseText};
