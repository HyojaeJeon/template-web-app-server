/**
 * 전화번호 유틸리티 함수
 * 국제 전화번호 형식 처리 및 유효성 검사
 */

// 지원하는 국가 정보
export const COUNTRIES = [
  {
    code: 'VN',
    name: 'Việt Nam',
    flag: '🇻🇳',
    dialCode: '+84',
    format: '(0XX) XXX-XXXX', // 표시 형식
    placeholder: '(090) 123-4567',
    regex: /^(\+84|84|0)?[1-9][0-9]{8,9}$/,
    maxLength: 10, // 0 포함
    minLength: 9,  // 0 제외
  },
  {
    code: 'KR',
    name: 'Hàn Quốc',
    flag: '🇰🇷',
    dialCode: '+82',
    format: '010-XXXX-XXXX',
    placeholder: '010-1234-5678',
    regex: /^(\+82|82|0)?1[0-9]{9,10}$/,
    maxLength: 11,
    minLength: 10},
  {
    code: 'US',
    name: 'Hoa Kỳ',
    flag: '🇺🇸',
    dialCode: '+1',
    format: '(XXX) XXX-XXXX',
    placeholder: '(555) 123-4567',
    regex: /^(\+1|1)?[2-9][0-9]{9}$/,
    maxLength: 10,
    minLength: 10},
];

// 기본 국가 (Local)
export const DEFAULT_COUNTRY = COUNTRIES[0];

/**
 * 국가 코드로 국가 정보 찾기
 */
export const getCountryByCode = (code) => {
  return COUNTRIES.find(country => country.code === code) || DEFAULT_COUNTRY;
};

/**
 * dial code로 국가 정보 찾기
 */
export const getCountryByDialCode = (dialCode) => {
  return COUNTRIES.find(country => country.dialCode === dialCode) || DEFAULT_COUNTRY;
};

/**
 * 전화번호에서 국가 코드 추출
 */
export const detectCountryFromPhone = (phone) => {
  if (!phone) {return DEFAULT_COUNTRY;}

  // 정규화된 번호 (숫자만)
  const normalized = phone.replace(/\D/g, '');

  // 국가 코드로 시작하는지 확인
  for (const country of COUNTRIES) {
    const dialCode = country.dialCode.replace('+', '');
    if (normalized.startsWith(dialCode)) {
      return country;
    }
  }

  // 0으로 시작하면 로컬 번호로 간주 (Local)
  if (phone.startsWith('0')) {
    return DEFAULT_COUNTRY;
  }

  return DEFAULT_COUNTRY;
};

/**
 * 전화번호 정규화 (E.164 형식으로 변환)
 * 예: 0901234567 -> +84901234567
 */
export const normalizePhoneNumber = (phone, country) => {
  if (!phone) {return '';}

  // 숫자만 추출
  let normalized = phone.replace(/\D/g, '');

  // 이미 국가 코드가 있는 경우
  const dialCode = country.dialCode.replace('+', '');
  if (normalized.startsWith(dialCode)) {
    return '+' + normalized;
  }

  // 0으로 시작하는 로컬 번호
  if (normalized.startsWith('0')) {
    normalized = normalized.substring(1);
  }

  // 국가 코드 추가
  return country.dialCode + normalized;
};

/**
 * E.164 형식을 로컬 형식으로 변환
 * 예: +84901234567 -> 0901234567
 */
export const formatToLocal = (phone, country) => {
  if (!phone) {return '';}

  const dialCode = country.dialCode.replace('+', '');
  let normalized = phone.replace(/\D/g, '');

  // 국가 코드 제거
  if (normalized.startsWith(dialCode)) {
    normalized = normalized.substring(dialCode.length);
  }

  // Local과 한국은 0 추가
  if (country.code === 'VN' || country.code === 'KR') {
    if (!normalized.startsWith('0')) {
      normalized = '0' + normalized;
    }
  }

  return normalized;
};

/**
 * 전화번호 표시 형식으로 포맷팅
 * 예: 0901234567 -> (090) 123-4567 (Local)
 */
export const formatPhoneNumber = (phone, country) => {
  if (!phone) {return '';}

  const localNumber = formatToLocal(phone, country);
  const digits = localNumber.replace(/\D/g, '');

  switch (country.code) {
    case 'VN':
      // (0XX) XXX-XXXX 또는 (0XX) XXXX-XXXX
      if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      } else if (digits.length === 11) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 7)}-${digits.slice(7)}`;
      }
      break;

    case 'KR':
      // 010-XXXX-XXXX
      if (digits.length === 11) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
      } else if (digits.length === 10) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      break;

    case 'US':
      // (XXX) XXX-XXXX
      if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      break;
  }

  return localNumber;
};

/**
 * 입력 중인 전화번호 실시간 포맷팅
 */
export const formatPhoneNumberInput = (input, previousInput, country) => {
  // 숫자만 추출
  const digits = input.replace(/\D/g, '');
  const previousDigits = previousInput?.replace(/\D/g, '') || '';

  // 삭제 중인 경우
  if (digits.length < previousDigits.length) {
    return input;
  }

  // 국가별 포맷팅
  switch (country.code) {
    case 'VN':
      if (digits.length <= 3) {
        return digits;
      } else if (digits.length <= 6) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      } else if (digits.length <= 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      break;

    case 'KR':
      if (digits.length <= 3) {
        return digits;
      } else if (digits.length <= 7) {
        return `${digits.slice(0, 3)}-${digits.slice(3)}`;
      } else if (digits.length <= 11) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
      }
      break;

    case 'US':
      if (digits.length <= 3) {
        return digits;
      } else if (digits.length <= 6) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      } else if (digits.length <= 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      break;
  }

  return digits.slice(0, country.maxLength);
};

/**
 * 전화번호 유효성 검사
 */
export const validatePhoneNumber = (phone, country) => {
  if (!phone) {return false;}

  // 입력된 전화번호에서 숫자만 추출
  const digitsOnly = phone.replace(/\D/g, '');

  // 최소 길이 검사 - 너무 짧으면 유효하지 않음
  if (digitsOnly.length < country.minLength) {
    return false;
  }

  // 최대 길이 검사 - 너무 길면 유효하지 않음
  if (digitsOnly.length > country.maxLength) {
    return false;
  }

  // 국가별 패턴 검사
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  // Local 전화번호 특별 처리
  if (country.code === 'VN') {
    // 090, 091, 092 등으로 시작하는 패턴 허용
    const vnPattern = /^(0[3-9][0-9]{8}|84[3-9][0-9]{8}|\+84[3-9][0-9]{8})$/;
    return vnPattern.test(cleanPhone);
  }

  // 한국 전화번호 특별 처리
  if (country.code === 'KR') {
    const krPattern = /^(01[0-9][0-9]{7,8}|82[0-9]{9,10}|\+82[0-9]{9,10})$/;
    return krPattern.test(cleanPhone);
  }

  // 미국 전화번호 특별 처리
  if (country.code === 'US') {
    const usPattern = /^([2-9][0-9]{2}[2-9][0-9]{6}|1[2-9][0-9]{2}[2-9][0-9]{6}|\+1[2-9][0-9]{2}[2-9][0-9]{6})$/;
    return usPattern.test(cleanPhone);
  }

  // 기본 정규식 검사
  return country.regex.test(cleanPhone);
};

/**
 * 전화번호 마스킹 (개인정보 보호)
 * 예: +84901234567 -> +849****4567
 */
export const maskPhoneNumber = (phone) => {
  if (!phone || phone.length < 8) {return phone;}

  const visibleStart = 4;
  const visibleEnd = 4;
  const masked = phone.slice(0, visibleStart) +
                 '****' +
                 phone.slice(-visibleEnd);

  return masked;
};

/**
 * 언어별 국가명 반환
 */
export const getCountryName = (country, language = 'vi') => {
  switch (language) {
    case 'en':
      return country.name;
    case 'vi':
    default:
      return country.name;
  }
};
