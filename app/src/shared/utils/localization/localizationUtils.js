import { format, parseISO, isValid } from 'date-fns';
import { vi, en, ko } from 'date-fns/locale';
import i18n from '@shared/i18n';
import logger from '@shared/utils/system/logger';

/**
 * LocalizationUtils
 *
 * Single Responsibility: 현지화 형식 변환만 담당
 * Open/Closed: 새로운 형식이나 언어 추가 시 수정 없이 확장 가능
 */
class LocalizationUtils {
  constructor() {
    // 지원되는 언어별 로케일
    this.locales = {
      vi: vi, // Local어
      en: en, // 영어
      ko: ko,  // 한국어
    };

    // Local 지역 매핑
    this.vietnamRegions = {
      north: { // 북부
        vi: 'Miền Bắc',
        en: 'Northern Vietnam',
        ko: 'Local 북부',
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'VND'},
      central: { // 중부
        vi: 'Miền Trung',
        en: 'Central Vietnam',
        ko: 'Local 중부',
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'VND'},
      south: { // 남부
        vi: 'Miền Nam',
        en: 'Southern Vietnam',
        ko: 'Local 남부',
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'VND'}};

    // 전화번호 형식 패턴
    this.phonePatterns = {
      vi: {
        mobile: /^(\+84|84|0)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])\d{7}$/,
        landline: /^(\+84|84|0)(2[0-9])\d{8}$/,
        format: (number) => this.formatVietnamesePhone(number)},
      en: {
        mobile: /^(\+1|1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/,
        landline: /^(\+1|1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/,
        format: (number) => this.formatUSPhone(number)},
      ko: {
        mobile: /^(\+82|82|0)(10|11|16|17|18|19)\d{7,8}$/,
        landline: /^(\+82|82|0)(2|3[1-3]|4[1-4]|5[1-5]|6[1-4])\d{7,8}$/,
        format: (number) => this.formatKoreanPhone(number)}};
  }

  /**
   * 현재 언어 가져오기
   */
  getCurrentLanguage() {
    return i18n.language || 'vi';
  }

  /**
   * 현재 로케일 가져오기
   */
  getCurrentLocale() {
    const lang = this.getCurrentLanguage();
    return this.locales[lang] || this.locales.vi;
  }

  /**
   * 날짜 형식 현지화
   * @param {Date|string} date - 변환할 날짜
   * @param {string} formatPattern - 형식 패턴 ('short', 'medium', 'long', 'full' 또는 커스텀)
   * @param {string} language - 언어 코드 (선택사항)
   * @returns {string} 현지화된 날짜 문자열
   */
  formatDate(date, formatPattern = 'medium', language = null) {
    try {
      const lang = language || this.getCurrentLanguage();
      const locale = this.locales[lang] || this.locales.vi;

      let dateObj = null;

      // ✅ 포괄적 날짜 타입 처리
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'number') {
        // epoch ms 지원
        dateObj = new Date(date);
      } else if (typeof date === 'string') {
        // ISO 우선, 실패 시 Date 생성 한번 더 시도
        dateObj = parseISO(date);
        if (!isValid(dateObj)) {
          const tryDate = new Date(date);
          dateObj = isValid(tryDate) ? tryDate : null;
        }
      }

      // ✅ Invalid time value 방지를 위한 엄격한 검사
      if (!dateObj || !isValid(dateObj)) {
        // 에러를 던지지 않고 안전하게 fallback
        return '';
      }

      // 사전 정의된 형식 패턴
      const patterns = {
        vi: {
          short: 'dd/MM/yyyy',
          medium: 'dd/MM/yyyy HH:mm',
          long: 'dd MMMM yyyy HH:mm',
          full: 'EEEE, dd MMMM yyyy HH:mm:ss',
          date: 'dd/MM/yyyy',
          time: 'HH:mm',
          datetime: 'dd/MM/yyyy HH:mm'},
        en: {
          short: 'MM/dd/yyyy',
          medium: 'MM/dd/yyyy h:mm a',
          long: 'MMMM dd, yyyy h:mm a',
          full: 'EEEE, MMMM dd, yyyy h:mm:ss a',
          date: 'MM/dd/yyyy',
          time: 'h:mm a',
          datetime: 'MM/dd/yyyy h:mm a'},
        ko: {
          short: 'yyyy.MM.dd',
          medium: 'yyyy.MM.dd HH:mm',
          long: 'yyyy년 MM월 dd일 HH:mm',
          full: 'yyyy년 MM월 dd일 EEEE HH:mm:ss',
          date: 'yyyy.MM.dd',
          time: 'HH:mm',
          datetime: 'yyyy.MM.dd HH:mm'}};

      const pattern = patterns[lang]?.[formatPattern] || formatPattern;
      return format(dateObj, pattern, { locale });
    } catch (error) {
      // AbortError 등은 error로 찍지 않도록 필터링
      if (error?.name !== 'AbortError') {
        logger.warn('날짜 형식 변환 오류', error);
      }
      return '';
    }
  }

  /**
   * Local 주소 형식 현지화
   * @param {Object} address - 주소 객체
   * @param {string} language - 언어 코드
   * @returns {string} 현지화된 주소 문자열
   */
  formatVietnameseAddress(address, language = null) {
    const lang = language || this.getCurrentLanguage();

    const {
      streetNumber = '',
      streetName = '',
      ward = '',
      district = '',
      city = '',
      province = ''} = address;

    // 언어별 주소 형식
    switch (lang) {
      case 'vi':
        return [
          streetNumber && streetName ? `${streetNumber} ${streetName}` : (streetNumber || streetName),
          ward && `Phường ${ward}`,
          district && `Quận ${district}`,
          city && `TP. ${city}`,
          province && `Tỉnh ${province}`,
        ].filter(Boolean).join(', ');

      case 'en':
        return [
          streetNumber && streetName ? `${streetNumber} ${streetName}` : (streetNumber || streetName),
          ward && `${ward} Ward`,
          district && `${district} District`,
          city && `${city} City`,
          province && `${province} Province`,
        ].filter(Boolean).join(', ');

      case 'ko':
        return [
          province && `${province}성`,
          city && `${city}시`,
          district && `${district}구`,
          ward && `${ward}동`,
          streetName && streetNumber ? `${streetName} ${streetNumber}` : (streetName || streetNumber),
        ].filter(Boolean).join(' ');

      default:
        return this.formatVietnameseAddress(address, 'vi');
    }
  }

  /**
   * Local 전화번호 형식화
   */
  formatVietnamesePhone(number) {
    const cleaned = number.replace(/\D/g, '');

    // 국가 코드 제거
    let phone = cleaned;
    if (phone.startsWith('84')) {
      phone = '0' + phone.substring(2);
    } else if (phone.startsWith('+84')) {
      phone = '0' + phone.substring(3);
    }

    // 형식화: 0XXX XXX XXX
    if (phone.length === 10) {
      return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    }

    return number;
  }

  /**
   * 미국 전화번호 형식화
   */
  formatUSPhone(number) {
    const cleaned = number.replace(/\D/g, '');

    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return cleaned.replace(/(\d)(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
    }

    return number;
  }

  /**
   * 한국 전화번호 형식화
   */
  formatKoreanPhone(number) {
    const cleaned = number.replace(/\D/g, '');

    // 국가 코드 제거
    let phone = cleaned;
    if (phone.startsWith('82')) {
      phone = '0' + phone.substring(2);
    } else if (phone.startsWith('+82')) {
      phone = '0' + phone.substring(3);
    }

    // 휴대폰: 010-XXXX-XXXX
    if (phone.length === 11 && phone.startsWith('010')) {
      return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    // 일반전화: 0X-XXXX-XXXX
    else if (phone.length === 10) {
      return phone.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
    }

    return number;
  }

  /**
   * 전화번호 형식 현지화
   * @param {string} number - 전화번호
   * @param {string} country - 국가 코드 ('vi', 'en', 'ko')
   * @returns {string} 현지화된 전화번호
   */
  formatPhoneNumber(number, country = null) {
    const lang = country || this.getCurrentLanguage();
    const pattern = this.phonePatterns[lang];

    if (pattern && pattern.format) {
      return pattern.format(number);
    }

    return number;
  }

  /**
   * 전화번호 유효성 검증
   * @param {string} number - 전화번호
   * @param {string} country - 국가 코드
   * @param {string} type - 'mobile' 또는 'landline'
   * @returns {boolean} 유효성 여부
   */
  validatePhoneNumber(number, country = null, type = 'mobile') {
    const lang = country || this.getCurrentLanguage();
    const pattern = this.phonePatterns[lang];

    if (pattern && pattern[type]) {
      return pattern[type].test(number);
    }

    return false;
  }

  /**
   * 화폐 형식 현지화
   * @param {number} amount - 금액
   * @param {string} currency - 통화 코드
   * @param {string} language - 언어 코드
   * @returns {string} 현지화된 화폐 문자열
   */
  formatCurrency(amount, currency = 'VND', language = null) {
    const lang = language || this.getCurrentLanguage();

    try {
      // Local 동 특별 처리
      if (currency === 'VND') {
        const formatter = new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
          style: 'currency',
          currency: 'VND',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0});
        return formatter.format(amount);
      }

      // 기타 통화
      const locale = {
        vi: 'vi-VN',
        en: 'en-US',
        ko: 'ko-KR'}[lang] || 'vi-VN';

      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency}).format(amount);
    } catch (error) {
      logger.error('화폐 형식 변환 오류', error);
      return `${amount} ${currency}`;
    }
  }

  /**
   * 숫자 형식 현지화
   * @param {number} number - 숫자
   * @param {string} language - 언어 코드
   * @returns {string} 현지화된 숫자 문자열
   */
  formatNumber(number, language = null) {
    const lang = language || this.getCurrentLanguage();

    const locale = {
      vi: 'vi-VN',
      en: 'en-US',
      ko: 'ko-KR'}[lang] || 'vi-VN';

    return new Intl.NumberFormat(locale).format(number);
  }

  /**
   * 지역 정보 현지화
   * @param {string} region - 지역 코드
   * @param {string} language - 언어 코드
   * @returns {Object} 현지화된 지역 정보
   */
  getLocalizedRegion(region, language = null) {
    const lang = language || this.getCurrentLanguage();
    const regionInfo = this.vietnamRegions[region];

    if (!regionInfo) {return null;}

    return {
      name: regionInfo[lang] || regionInfo.vi,
      timezone: regionInfo.timezone,
      currency: regionInfo.currency};
  }
}

// ✅ 필드 현지화 함수 (RangeError: Invalid time value 해결)
function localizeField(entity, language = 'vi', key = 'name') {
  if (!entity) return '';

  // 케이스별 후보 키 (프로젝트에 맞게 조정)
  // 예: name, nameEn, nameKo … 혹은 translations[lang][key]
  const langSuffix = { vi: '', en: 'En', ko: 'Ko' }[language] ?? '';
  const candidates = [
    // translations 객체를 우선 시도
    entity.translations?.[language]?.[key],
    // nameEn / nameKo 같은 낙타표기
    langSuffix ? `${key}${langSuffix}` : key,
    // 스네이크/케밥 표기 등도 쓰고 있다면 여기에 후보를 더 추가
    key, // 마지막 fallback
  ].filter(Boolean);

  for (const k of candidates) {
    const val = typeof k === 'string' ? entity[k] : k; // translations는 값 자체일 수 있음
    if (typeof val === 'string' && val.trim() !== '') return val;
  }
  return '';
}

// 싱글톤 인스턴스 생성
const localizationUtils = new LocalizationUtils();

// 개별 함수들을 직접 export
export const localize = localizeField; // ✅ 텍스트 현지화 함수 (store.nameKo, store.nameEn 등)
export const formatDate = localizationUtils.formatDate.bind(localizationUtils);
export const formatCurrency = localizationUtils.formatCurrency.bind(localizationUtils);
export const formatPhoneNumber = localizationUtils.formatPhoneNumber.bind(localizationUtils);
export const formatNumber = localizationUtils.formatNumber.bind(localizationUtils);
export const getCurrentLanguage = localizationUtils.getCurrentLanguage.bind(localizationUtils);

export default localizationUtils;
