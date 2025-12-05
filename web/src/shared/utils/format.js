/**
 * 기본 포맷팅 유틸리티 함수
 * @description 날짜, 숫자, 통화 등 기본 포맷팅
 */

/**
 * 통화 포맷팅
 */
export function formatCurrency(amount, currency = 'KRW', options = {}) {
  const { showSymbol = true, locale = 'ko-KR' } = options;

  if (typeof amount !== 'number' || isNaN(amount)) {
    return showSymbol ? '0원' : '0';
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (!showSymbol) {
    return formatter.format(amount).replace(/[₩\s]/g, '').trim();
  }

  return formatter.format(amount);
}

/**
 * 숫자 포맷팅 (천단위 구분)
 */
export function formatNumber(number, decimals = 0) {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0';
  }

  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
}

/**
 * 백분율 포맷팅
 */
export function formatPercent(number, decimals = 1) {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0%';
  }

  return new Intl.NumberFormat('ko-KR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number / 100);
}

/**
 * 날짜 포맷팅
 */
export function formatDate(date, format = 'short', locale = 'ko-KR') {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  switch (format) {
    case 'long':
      return d.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'medium':
      return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'short':
    default:
      return d.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
  }
}

/**
 * 시간 포맷팅 (24시간 형식)
 */
export function formatTime(date, includeSeconds = false) {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const options = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };

  if (includeSeconds) {
    options.second = '2-digit';
  }

  return d.toLocaleTimeString('ko-KR', options);
}

/**
 * 날짜+시간 포맷팅
 */
export function formatDateTime(date, locale = 'ko-KR') {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * 파일 크기 포맷팅
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * 전화번호 포맷팅
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';

  const cleaned = phone.replace(/\D/g, '');

  // 한국 휴대폰 (010-XXXX-XXXX)
  if (cleaned.length === 11 && cleaned.startsWith('010')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }

  // 한국 일반전화 (02-XXXX-XXXX, 031-XXX-XXXX)
  if (cleaned.length === 10) {
    if (cleaned.startsWith('02')) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
}

/**
 * 통합 포맷팅 함수
 */
export const format = {
  currency: formatCurrency,
  number: formatNumber,
  percent: formatPercent,
  date: formatDate,
  time: formatTime,
  dateTime: formatDateTime,
  fileSize: formatFileSize,
  phone: formatPhoneNumber
};

export default format;
