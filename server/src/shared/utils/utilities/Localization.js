/**
 * 다국어 지원 유틸리티 (초간단 버전)
 * Local/한국/영어 3개국 지원
 * 
 * @description  GraphQL 응답 다국어 처리
 * @languages    vi (Local어, 기본), ko (한국어), en (영어)
 */

// ================================
// 상수 정의
// ================================

const LANGUAGE_MAP = {
  'ko': 'Ko',  // 한국어: nameKo, descriptionKo
  'en': 'En',  // 영어: nameEn, descriptionEn
  'vi': ''     // Local어: name, description (기본)
};

// 다국어 처리가 필요한 모든 필드들 (프로젝트 전체)
// 주의: address는 제외 - CLAUDE.md에 따라 address 컬럼 1개만 사용
const LOCALIZABLE_FIELDS = [
  'name', 'description', 'title', 'message', 'content',
  'shortDescription', 'details', 'instructions', 'note',
  'label', 'text', 'displayName', 'summary', 'displayTitle'
];

// ================================
// 핵심 함수 2개만
// ================================

/**
 * 1. 데이터 다국어 처리 (통합 함수)
 * @param {any} data - 처리할 데이터 (객체, 배열, null 등)
 * @param {string} language - 언어 코드 ('vi', 'ko', 'en')
 * @returns {any} 다국어 처리된 데이터
 */
export const localize = (data, language = 'vi') => {
  // null/undefined 처리
  if (!data) return data;
  
  // 언어 코드 검증
  const suffix = LANGUAGE_MAP[language] || '';
  
  // 배열 처리
  if (Array.isArray(data)) {
    return data.map(item => localize(item, language));
  }
  
  // 객체가 아닌 경우 (문자열, 숫자, Date 등)
  if (typeof data !== 'object' || data instanceof Date || data instanceof Buffer) {
    return data;
  }
  
  // Sequelize 모델 인스턴스 또는 일반 객체 처리
  const source = data.toJSON ? data.toJSON() : (data.dataValues || data);
  const result = { ...source };
  
  // 모든 다국어 필드를 자동으로 처리
  LOCALIZABLE_FIELDS.forEach(fieldName => {
    // 원본 필드가 존재하는 경우만 처리
    if (fieldName in source) {
      const localizedFieldName = fieldName + suffix;
      
      // 언어별 필드가 있으면 사용, 없으면 기본값 사용
      if (suffix && source[localizedFieldName]) {
        result[fieldName] = source[localizedFieldName];
      }
      
      // 불필요한 다국어 필드들 제거 (clean up)
      if (suffix !== 'Ko') delete result[`${fieldName}Ko`];
      if (suffix !== 'En') delete result[`${fieldName}En`];
    }
  });
  
  // 중첩된 객체/배열 재귀 처리
  Object.keys(result).forEach(key => {
    // 관계 필드들 (store, category, user 등) 자동 처리
    if (result[key] && typeof result[key] === 'object' && !(result[key] instanceof Date)) {
      result[key] = localize(result[key], language);
    }
  });
  
  return result;
};

/**
 * 2. Sequelize 쿼리용 속성 선택
 * @param {Array<string>} fields - 다국어 필드 목록 ['name', 'description']
 * @param {string} language - 언어 코드 ('vi', 'ko', 'en')
 * @param {Array<string>} additional - 추가 필드 ['id', 'createdAt']
 * @returns {Array<string>} Sequelize attributes 배열
 */
export const getLocalizedAttributes = (fields = [], language = 'vi', additional = []) => {
  const suffix = LANGUAGE_MAP[language] || '';
  const attributes = [...additional];
  
  fields.forEach(field => {
    // 항상 기본 필드 포함 (폴백용)
    attributes.push(field);
    
    // vi가 아닌 경우 언어별 필드도 포함
    if (suffix) {
      attributes.push(field + suffix);
    }
  });
  
  // 중복 제거
  return [...new Set(attributes)];
};

// ================================
// Export
// ================================

export default {
  localize,
  getLocalizedAttributes
};