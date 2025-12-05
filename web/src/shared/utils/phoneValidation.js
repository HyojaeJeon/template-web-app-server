/**
 * 전화번호 검증 유틸리티 (Stub)
 * TODO: 구현 필요
 */

// 국가별 전화번호 데이터
export const COUNTRY_DATA = [
  {
    code: 'VN',
    name: 'Vietnam',
    dialCode: '+84',
    phoneFormat: '### ### ####',
    maxLength: 10
  },
  {
    code: 'KR',
    name: 'Korea',
    dialCode: '+82',
    phoneFormat: '### #### ####',
    maxLength: 11
  },
  {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    phoneFormat: '(###) ###-####',
    maxLength: 10
  }
];

/**
 * 전화번호 유효성 검사
 */
export function validatePhoneNumber(phone, countryCode = 'VN') {
  if (!phone) return false;

  const cleanPhone = phone.replace(/\D/g, '');
  const country = COUNTRY_DATA.find(c => c.code === countryCode);

  if (!country) return false;

  return cleanPhone.length >= 9 && cleanPhone.length <= country.maxLength;
}

/**
 * 전화번호 포맷팅
 */
export function formatPhoneNumber(phone, countryCode = 'VN') {
  if (!phone) return '';

  const cleanPhone = phone.replace(/\D/g, '');
  const country = COUNTRY_DATA.find(c => c.code === countryCode);

  if (!country) return cleanPhone;

  // 간단한 포맷팅
  if (countryCode === 'VN' && cleanPhone.length >= 9) {
    return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
  }

  return cleanPhone;
}

/**
 * 베트남 전화번호 앞자리 0 제거
 */
export function cleanVietnamesePhoneNumber(phone) {
  if (!phone) return '';

  let cleaned = phone.replace(/\D/g, '');

  // 앞자리 0 제거
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  return cleaned;
}

export default {
  COUNTRY_DATA,
  validatePhoneNumber,
  formatPhoneNumber,
  cleanVietnamesePhoneNumber
};
